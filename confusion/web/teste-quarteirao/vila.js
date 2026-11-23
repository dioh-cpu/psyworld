// Vila de teste. Chão limpo (piso-vila) + camada de objetos (vila-objetos) recortada da cena completa.
// Cada pixel de objeto sabe a linha do chão onde encosta (vila-base): se o pé do personagem está acima dessa linha,
// ele passa atrás do objeto; se está abaixo, na frente. Colisão: máscara pintada no editor (branco = anda).
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';

const A = 'assets/';
const IMG_W = 2752, IMG_H = 1536;                // tamanho da arte (16:9)
const LARG = 106;                                // largura do mapa no mundo: casas ficam ~2,5x o personagem
const ALT = LARG * IMG_H / IMG_W;                // altura do piso no mundo
const ALTURA_PERSONAGEM = 3.8;                   // altura do Azazel no mundo, em proporção ao mapa
const RAIO = 0.3;                                // raio do corpo para a colisão
const VELOCIDADE = 5.2;

// ponto da imagem (px, py) -> mundo; o topo da imagem é o norte (-z)
const P = (px, py) => ({ x: (px / IMG_W - 0.5) * LARG, z: (py / IMG_H - 0.5) * ALT });

// tamanho em pixels de cada recorte (para manter a proporção)
const PX = { ninho: [319, 206], ovo: [82, 104] };
const ALTURA = { ninho: 0.71, ovo: 0.4 };       // altura visível, em unidades
const largura = (nome, altura = ALTURA[nome]) => altura * PX[nome][0] / PX[nome][1];

const params = new URLSearchParams(location.search);
const VISAO = params.get('visao') || 'jogo';

const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
renderer.setSize(window.innerWidth, window.innerHeight, false);
const maxAniso = renderer.capabilities?.getMaxAnisotropy?.() || 16;
const cena = new THREE.Scene();
cena.background = new THREE.Color('#cfe8f7');
// Câmera em ângulo, como nas capturas de referência: ortográfica, com inclinação fixa e sem girar.
// INCLINACAO: graus a partir da horizontal (90 seria de cima). ALTURA_CAMERA: unidades de tela visíveis na vertical.
// Ajuste pela URL para testar: ?inclinacao=50&altura=25
const INCLINACAO = THREE.MathUtils.clamp(Number(params.get('inclinacao')) || 50, 30, 80);
const ALTURA_CAMERA = Number(params.get('altura')) || 13.5;  // mais zoom no mapa deitado (antes 19.2)
const SEN = Math.sin(THREE.MathUtils.degToRad(INCLINACAO));
const COS = Math.cos(THREE.MathUtils.degToRad(INCLINACAO));
const ALTURA_EM_PE = Number(params.get('alturape')) || 28;   // em pé: evita super-aproximar uma faixa estreita que estoura os pixels
const DISTANCIA_CAMERA = 60;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
camera.up.set(0, 1, 0);
const alvoCamera = { x: 0, z: 0 };               // ponto do chão para onde a câmera olha
function posicionarCamera() {
  camera.position.set(alvoCamera.x, DISTANCIA_CAMERA * SEN, alvoCamera.z + DISTANCIA_CAMERA * COS);
  camera.lookAt(alvoCamera.x, 0, alvoCamera.z);
}
function enquadrar() {
  const aspecto = window.innerWidth / window.innerHeight;
  // altura da tela, em unidades de tela: paisagem mostra ALTURA_CAMERA; em pé, a profundidade inteira do mapa;
  // 'geral' mostra o mapa todo. A profundidade do chão visível é a altura da tela dividida por SEN.
  const tela = VISAO === 'geral' ? Math.max(ALT * SEN, LARG / aspecto)
    : aspecto < 1 ? Math.min(ALTURA_EM_PE, ALT * SEN)
    : Math.min(ALTURA_CAMERA, ALT * SEN, LARG / aspecto);
  camera.top = tela / 2;
  camera.bottom = -camera.top;
  camera.right = camera.top * aspecto;
  camera.left = -camera.right;
  camera.updateProjectionMatrix();
}
enquadrar();

const carregador = new THREE.TextureLoader();
const texturas = new Map();
function textura(nome) {
  if (!texturas.has(nome)) {
    const t = carregador.load(A + nome + '.webp?v=3d_hd_v1');
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    texturas.set(nome, t);
  }
  return texturas.get(nome);
}
const materialBase = (nome, opts = {}) =>
  new THREE.MeshBasicMaterial({ map: textura(nome), transparent: true, alphaTest: 0.4, ...opts });

// ---- chão: arte da praia colocada por cima para teste, mantendo 100% da colisão atual da vila ----
{
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(LARG, ALT).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: textura('praia-cena'), depthTest: false, depthWrite: false }));
  piso.renderOrder = 0;
  cena.add(piso);
}

// ---- colisões (retângulos no chão) ----
const colisoes = [];
const caixa = (x0, x1, z0, z1) => colisoes.push({ x0, x1, z0, z1 });

// limites da imagem: fora dela não se anda (muro invisível)
caixa(-80, 80, -ALT / 2 - 2, -ALT / 2);            // norte
caixa(-80, 80, ALT / 2, ALT / 2 + 2);              // sul
caixa(-80, -LARG / 2, -ALT / 2 - 2, ALT / 2 + 2);  // oeste
caixa(LARG / 2, 80, -ALT / 2 - 2, ALT / 2 + 2);    // leste

// obstáculos pintados na imagem: grade de células de 8 px (172 x 96) desenhada no editor de colisão
// (confusion/web/teste-quarteirao/editor-colisao.html). Cada célula 1 bloqueia. A grade vira retângulos (caixasDaGrade).
const COLISAO = { celula: 8, colunas: 344, linhas: 192, rle: "0,202,48,45,19,227,51,47,19,225,52,47,20,220,58,46,20,220,58,46,20,217,24,2,36,14,6,23,21,214,26,5,38,13,10,16,22,212,25,10,43,12,9,11,22,211,24,13,33,2,14,13,3,8,23,211,23,15,32,3,21,16,22,212,21,18,6,4,21,6,21,12,23,210,22,20,5,14,2,19,20,1,1,6,24,209,21,24,2,16,1,24,46,210,21,24,2,16,1,24,46,207,22,73,43,203,22,86,34,201,20,93,31,193,25,94,32,192,23,97,33,190,21,100,41,182,20,101,44,179,20,101,44,179,20,101,45,178,20,100,47,171,26,100,48,164,30,101,51,157,34,101,25,10,19,152,36,100,26,12,19,140,45,101,23,16,22,137,45,101,23,16,22,118,64,100,23,18,22,111,70,99,24,21,20,100,82,96,23,24,19,96,87,94,22,26,21,88,100,88,18,30,21,83,105,18,2,67,17,32,21,80,110,12,9,63,15,34,22,77,113,11,9,62,15,36,21,77,113,11,9,62,15,36,21,75,119,7,11,60,14,39,19,72,142,57,15,40,18,71,48,35,63,54,13,43,17,69,42,48,60,49,15,45,16,67,36,61,57,46,15,48,14,64,35,71,52,45,14,50,13,55,40,77,50,44,14,54,10,55,40,77,50,44,14,54,10,53,39,83,47,43,14,57,8,50,39,89,43,44,12,61,6,49,38,92,41,44,13,64,3,48,36,98,38,43,14,66,1,47,34,104,34,44,13,114,34,106,35,40,13,115,33,108,39,36,12,116,33,108,39,36,12,115,31,110,43,32,12,114,31,112,47,27,12,114,32,89,1,22,23,3,24,24,9,115,33,89,2,22,21,8,25,19,9,115,31,90,4,19,22,16,22,16,8,5,5,105,31,90,5,18,14,26,24,13,7,4,11,101,30,90,7,16,14,32,24,8,5,5,14,98,29,91,8,16,13,37,22,15,16,97,29,91,8,16,13,37,22,15,16,97,28,91,10,14,12,43,19,13,18,94,29,92,10,13,12,49,18,7,22,92,28,92,12,11,12,53,17,4,25,89,28,92,14,8,13,56,46,87,27,91,16,6,15,60,44,84,26,92,17,5,15,63,44,82,25,92,18,4,15,66,43,81,25,92,18,4,15,66,43,80,26,91,21,1,15,70,40,79,26,92,35,74,39,78,25,92,35,78,38,75,26,77,3,11,35,82,37,73,26,89,36,85,37,71,25,84,42,87,35,71,25,82,43,92,31,71,25,82,43,92,31,71,25,77,47,96,28,71,24,74,50,100,27,69,24,70,52,106,25,67,23,67,55,109,24,66,23,64,57,111,24,64,22,64,58,115,23,60,26,59,60,117,23,58,27,57,60,121,23,56,27,57,60,121,23,55,28,55,58,127,23,52,29,52,58,133,24,47,30,51,58,135,25,42,33,50,56,139,28,35,36,49,57,141,28,27,43,47,57,143,30,20,48,45,59,144,31,17,48,45,59,144,31,11,54,43,65,141,31,10,40,2,12,30,80,139,32,9,32,1,7,2,12,27,63,2,20,137,32,9,29,8,2,5,11,25,62,6,19,136,32,9,26,18,11,25,59,10,21,134,31,9,24,21,11,23,56,18,19,132,30,11,20,25,11,22,54,22,18,131,29,12,20,25,11,22,54,22,18,131,29,16,13,28,11,22,52,26,18,129,24,24,5,34,11,22,48,33,17,126,23,65,12,20,46,37,18,123,23,65,13,20,43,41,18,121,22,67,13,21,40,44,19,118,22,67,13,23,35,50,17,117,21,69,13,25,31,52,18,115,19,71,14,23,30,56,17,114,19,71,14,23,30,56,17,114,19,73,13,21,29,59,17,113,18,75,12,21,28,63,16,110,19,76,13,18,26,68,15,109,18,78,13,17,24,72,14,107,18,79,14,14,24,75,15,46,7,52,18,80,14,10,24,81,13,43,14,45,19,82,15,4,26,84,14,40,18,42,18,83,15,4,26,84,14,40,18,42,18,84,42,88,13,38,26,34,17,88,37,94,14,31,30,33,16,90,36,96,17,23,33,32,16,92,34,98,18,18,34,33,16,94,34,98,22,11,35,33,16,96,33,99,25,4,36,34,16,97,35,97,64,34,16,98,35,97,64,34,16,99,35,100,52,4,1,35,18,98,37,101,49,40,16,100,39,103,45,40,16,101,40,102,44,40,16,101,42,102,42,40,16,101,44,106,37,38,17,102,47,109,31,36,18,102,49,111,28,34,18,104,49,111,28,34,18,102,52,112,27,31,19,102,55,113,24,30,19,102,58,112,23,30,18,102,40,4,17,111,22,27,20,102,39,6,19,110,22,25,20,102,40,8,18,110,21,24,20,100,43,10,19,107,21,22,20,102,43,10,19,107,21,22,20,101,44,12,19,106,19,19,23,100,31,2,13,14,19,106,18,16,25,98,32,4,12,16,19,105,19,12,27,97,31,8,9,19,20,103,17,10,30,94,32,11,7,23,18,103,16,4,1,2,33,93,32,14,2,29,16,7,2,1,3,91,54,23,4,65,31,50,18,1,9,93,50,22,6,64,31,50,18,1,9,93,50,22,6,62,32,55,26,91,50,21,9,59,31,59,24,20,1,70,50,21,10,56,30,62,25,16,7,67,50,20,12,53,30,64,27,13,9,66,50,20,12,51,31,59,2,2,31,10,10,7,7,50,52,19,12,50,30,62,36,8,11,10,6,44,56,20,11,48,31,60,44,2,9,14,9,39,58,19,10,47,31,61,56,14,11,36,59,19,9,48,31,61,56,14,11,36,59,19,9,47,31,61,57,15,13,29,30,2,31,20,8,45,32,61,58,16,12,27,30,8,29,17,8,44,33,60,22,2,38,13,14,18,34,14,28,16,7,44,31,61,24,6,61,17,32,19,29,12,6,45,31,61,23,10,60,6,39,24,28,9,8,43,32,61,23,13,61,1,37,30,30,4,9,39,35,62,22,17,93,35,41,39,35,62,22,17,93,35,41,37,36,63,17,24,87,40,40,36,36,64,16,26,82,47,36,36,35,66,15,30,73,55,34,35,35,67,14,32,67,62,33,33,35,69,11,38,61,67,33,27,37,71,9,43,51,75,32,25,37,73,6,50,43,79,33,23,37,73,6,50,43,79,33,22,38,137,34,82,34,19,37,152,15,87,35,18,36,161,6,85,1,2,37,16,34,255,41,14,33,257,44,10,32,259,46,7,31,261,49,3,30,264,49,1,30,264,49,1,30,266,77,268,75,271,45" };
// RLE: contagens alternadas de células livres e bloqueadas, começando por livre
function decodificarGrade({ rle, colunas, linhas }) {
  const grade = new Uint8Array(colunas * linhas);
  let pos = 0, valor = 0;
  for (const n of rle.split(',').map(Number)) {
    if (valor) grade.fill(1, pos, pos + n);
    pos += n;
    valor ^= 1;
  }
  return grade;
}
// retângulos em células [c0, l0, c1, l1] (c1 e l1 exclusivos), por expansão gulosa para a direita e para baixo
function caixasDaGrade(grade, colunas, linhas) {
  const usado = new Uint8Array(grade.length);
  const retangulos = [];
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < colunas; c++) {
      const i = l * colunas + c;
      if (!grade[i] || usado[i]) continue;
      let c1 = c;
      while (c1 + 1 < colunas && grade[l * colunas + c1 + 1] && !usado[l * colunas + c1 + 1]) c1++;
      let l1 = l;
      let cresce = true;
      while (cresce && l1 + 1 < linhas) {
        for (let k = c; k <= c1; k++) {
          const j = (l1 + 1) * colunas + k;
          if (!grade[j] || usado[j]) { cresce = false; break; }
        }
        if (cresce) l1++;
      }
      for (let y = l; y <= l1; y++) for (let x = c; x <= c1; x++) usado[y * colunas + x] = 1;
      retangulos.push([c, l, c1 + 1, l1 + 1]);
    }
  }
  return retangulos;
}
const N_BORDAS = colisoes.length;               // muros das bordas, que a máscara não troca
for (const [c0, l0, c1, l1] of caixasDaGrade(decodificarGrade(COLISAO), COLISAO.colunas, COLISAO.linhas)) {
  const a = P(c0 * COLISAO.celula, l0 * COLISAO.celula), b = P(c1 * COLISAO.celula, l1 * COLISAO.celula);
  caixa(a.x, b.x, a.z, b.z);
}


// ---- objetos: a mesma camada desenhada duas vezes; a primeira só com o que fica atrás do personagem, a segunda só com
// o que fica na frente. vila-base guarda, por pixel, a linha do chão onde aquele objeto encosta (R*256+G) e a máscara (B).
const texObjetos = carregador.load(A + 'vila-objetos.webp');
texObjetos.anisotropy = 8;                                     // cor crua: o shader devolve os valores sem conversão
const texBase = carregador.load(A + 'vila-base.png');
texBase.magFilter = texBase.minFilter = THREE.NearestFilter;
texBase.generateMipmaps = false;
const uPes = { value: 0 };
// Objetos da vila antiga ocultados durante o teste com a arte da praia por cima
if (false) {
  camadaObjetos(false, 1);
  camadaObjetos(true, 4);
}

// ---- objetos: peças planas no chão, com a base no ponto de apoio ----
const camada = z => 0.04 + (z + ALT / 2) * 0.01;
function desenho(nome, x, z, w, h, elevacao = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), materialBase(nome));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, camada(z) + elevacao, z - h / 2);
  cena.add(mesh);
  return mesh;
}
function objeto(nome, { x, z, y = 0, altura = ALTURA[nome] }) {
  const w = largura(nome, altura);
  const mesh = desenho(nome, x, z, w, altura, y * 0.01);
  mesh.position.z -= y;
  return mesh;
}

// ---- ninhos: removidos desta cidade (a imagem não tem fazenda); a mecânica de ovos fica sem ninhos até haver um lugar ----
const NINHOS = [];
NINHOS.forEach(([x, z]) => objeto('ninho', { x, z, altura: ALTURA.ninho }));
const ovos = NINHOS.map(([x, z]) => {
  const g = objeto('ovo', { x, z, y: 0.3, altura: ALTURA.ovo });
  g.visible = false;
  return g;
});


// ---- Azazel no traje de vilão: andar em vídeo MP4 e parado nas 4 direções (mesmo do jogo principal) ----
const azazel = criarAzazel('assets/characters/', ALTURA_PERSONAGEM);
const jogador = new THREE.Group();
jogador.add(azazel.malha);
// o personagem entra na mesma fila dos objetos transparentes, para a ordem de desenho (renderOrder) valer
jogador.traverse((o) => { if (o.material) { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 3; } });
cena.add(jogador);

// sombra de contato: um disco escuro e suave sob os pés, no chão, para o personagem parecer apoiado
const sombra = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.8)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false }));
  m.renderOrder = 2;
  cena.add(m);
  return m;
})();

// ---- entrada: teclado e joystick de toque ----
const teclas = new Set();
const INICIO = P(1348, 836);                 // início num caminho livre da máscara
const estado = { x: INICIO.x, z: INICIO.z };
const PRESET = { atras: P(1124, 640) };   // posição para conferir: atrás de casa
if (PRESET[VISAO]) Object.assign(estado, PRESET[VISAO]);
// colisões em caixas (AABB) para o movimento, com a mesma lógica do jogo principal
const caixasAABB = colisoes.map((b) => ({ min: { x: b.x0, y: 0, z: b.z0 }, max: { x: b.x1, y: 6, z: b.z1 } }));
// máscara de caminho do editor (walk: 1 anda, 0 bloqueia; mw x mh): refaz a grade e as caixas na hora
function aplicarMascaraCaminho(walk, mw, mh) {
  const { colunas, linhas, celula } = COLISAO;
  const g = new Uint8Array(colunas * linhas);
  for (let l = 0; l < linhas; l++) for (let c = 0; c < colunas; c++) {
    const px = Math.min(mw - 1, Math.floor((c + 0.5) * celula * mw / IMG_W));
    const py = Math.min(mh - 1, Math.floor((l + 0.5) * celula * mh / IMG_H));
    g[l * colunas + c] = walk[py * mw + px] ? 0 : 1;
  }
  colisoes.length = N_BORDAS;
  for (const [c0, l0, c1, l1] of caixasDaGrade(g, colunas, linhas)) {
    const a = P(c0 * celula, l0 * celula), b = P(c1 * celula, l1 * celula);
    caixa(a.x, b.x, a.z, b.z);
  }
  caixasAABB.length = 0;
  for (const b of colisoes) caixasAABB.push({ min: { x: b.x0, y: 0, z: b.z0 }, max: { x: b.x1, y: 6, z: b.z1 } });
}
window.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'walkmask') aplicarMascaraCaminho(e.data.walk, e.data.w, e.data.h);
});
// edição salva neste aparelho (pelo editor) vale ao abrir a vila
try {
  const s = localStorage.getItem('vilaWalkmask');
  if (s) {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const cx = c.getContext('2d'); cx.drawImage(im, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data, w = new Uint8Array(c.width * c.height);
      for (let i = 0; i < w.length; i++) w[i] = d[i * 4] >= 128 ? 1 : 0;
      aplicarMascaraCaminho(w, c.width, c.height);
    };
    im.src = 'data:image/png;base64,' + s;
  }
} catch (_) {}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
  if (e.code === 'KeyE') depositar();
  if (e.code === 'KeyQ') recolherOvos();
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));
const pressionada = (...codigos) => codigos.some((c) => teclas.has(c));

// joystick de toque (mesmo controle do jogo principal)
const joy = { x: 0, z: 0 };
const joyEl = document.getElementById('joy');
const joyKnob = document.getElementById('joy-knob');
let joyDedo = null;
function joyAtualizar(e) {
  const r = joyEl.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const v = vetorJoystick(dx, dy, r.width / 2);
  joy.x = v.x;
  joy.z = v.z;
  // o botão do joystick acompanha o dedo, limitado ao círculo
  const d = Math.hypot(dx, dy) || 1;
  const lim = Math.min(d, r.width * 0.3);
  joyKnob.style.transform = `translate(calc(-50% + ${(dx / d) * lim}px), calc(-50% + ${(dy / d) * lim}px))`;
}
function joyFim() {
  joyDedo = null;
  joy.x = 0;
  joy.z = 0;
  joyKnob.style.transform = 'translate(-50%, -50%)';
}
joyEl.addEventListener('pointerdown', (e) => { joyDedo = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyAtualizar(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyDedo) joyAtualizar(e); });
joyEl.addEventListener('pointerup', joyFim);
joyEl.addEventListener('pointercancel', joyFim);


function depositar() {
  let melhor = -1, dist = 3.2;
  NINHOS.forEach(([x, z], i) => {
    if (ovos[i].visible) return;
    const d = Math.hypot(estado.x - x, estado.z - z);
    if (d < dist) { dist = d; melhor = i; }
  });
  if (melhor >= 0) ovos[melhor].visible = true;
}
function recolherOvos() { ovos.forEach((o) => { o.visible = false; }); }

// ---- saídas da cidade: três estradas que chegam à borda do mapa (posições em pixels da arte) ----
// 'borda' diz de que lado da imagem a estrada sai; 'de'..'ate' é o trecho caminhável (px) nessa borda.
const SAIDAS = [
  { nome: 'Oeste',    borda: 'oeste', de: 774,  ate: 829  },
  { nome: 'Norte',    borda: 'norte', de: 1615, ate: 2000 },
  { nome: 'Sudoeste', borda: 'sul',   de: 0,    ate: 221  },
];
const PROFUNDIDADE_SAIDA = 3.2;                   // unidades para dentro do mapa em que a saída dispara
for (const sa of SAIDAS) {
  const m = (sa.de + sa.ate) / 2;
  const ponto = { oeste: P(0, m), norte: P(m, 0), sul: P(m, IMG_H) }[sa.borda];
  sa.centro = ponto;                              // ponto da borda, em coordenadas do mundo
  const ini = P(sa.borda === 'oeste' ? 0 : sa.de, sa.borda === 'norte' ? 0 : sa.borda === 'sul' ? IMG_H : sa.de);
  const fim = P(sa.borda === 'oeste' ? 0 : sa.ate, sa.borda === 'norte' ? 0 : sa.borda === 'sul' ? IMG_H : sa.ate);
  sa.x0 = Math.min(ini.x, fim.x) - (sa.borda === 'oeste' ? 0 : 0); sa.x1 = Math.max(ini.x, fim.x);
  sa.z0 = Math.min(ini.z, fim.z); sa.z1 = Math.max(ini.z, fim.z);
  if (sa.borda === 'oeste') { sa.x1 = sa.x0 + PROFUNDIDADE_SAIDA; }
  if (sa.borda === 'norte') { sa.z1 = sa.z0 + PROFUNDIDADE_SAIDA; }
  if (sa.borda === 'sul')   { sa.z0 = sa.z1 - PROFUNDIDADE_SAIDA; }
}
const avisoSaida = document.createElement('div');
avisoSaida.style.cssText = 'position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:6;padding:10px 16px;border-radius:8px;background:rgba(9,25,60,.92);border:2px solid #facc15;color:#fff;font:600 15px system-ui;display:none;text-align:center;max-width:80vw';
document.body.appendChild(avisoSaida);
let saidaAtual = null, saidaDesde = 0;
const setas = SAIDAS.map((sa) => {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;z-index:4;pointer-events:none;display:none;transform:translate(-50%,-50%);text-align:center;font:700 12px system-ui;color:#fff;text-shadow:0 0 4px #000,0 0 4px #000';
  el.innerHTML = '<div class="seta" style="font-size:26px;line-height:1;color:#facc15">&#9650;</div><div>' + sa.nome + '</div>';
  document.body.appendChild(el);
  return el;
});
const _v = new THREE.Vector3();
function atualizarSaidas(agora) {
  const dentro = SAIDAS.find((sa) => estado.x >= sa.x0 && estado.x <= sa.x1 && estado.z >= sa.z0 && estado.z <= sa.z1) || null;
  if (dentro !== saidaAtual) {
    saidaAtual = dentro;
    saidaDesde = agora;
    avisoSaida.style.display = dentro ? 'block' : 'none';
    if (dentro) avisoSaida.textContent = 'Saída: ' + dentro.nome + ' (este caminho ainda não leva a lugar nenhum)';
  }
  // setas na borda da tela apontando para as saídas que estão fora da vista
  const L = window.innerWidth, A = window.innerHeight, mx = 38, mt = 64, mb = 150;
  SAIDAS.forEach((sa, i) => {
    _v.set(sa.centro.x, 0, sa.centro.z).project(camera);
    const sx = (_v.x * 0.5 + 0.5) * L, sy = (-_v.y * 0.5 + 0.5) * A;
    const visivel = sx > mx && sx < L - mx && sy > mt && sy < A - 20;
    const el = setas[i];
    if (visivel) { el.style.display = 'none'; return; }
    const cx = L / 2, cy = A / 2, dx = sx - cx, dy = sy - cy;
    const k = Math.min((L / 2 - mx) / Math.max(1e-6, Math.abs(dx)), (A / 2 - mt) / Math.max(1e-6, Math.abs(dy)), (A / 2 - mb) / Math.max(1e-6, dy > 0 ? dy : Infinity));
    el.style.left = (cx + dx * k) + 'px';
    el.style.top = (cy + dy * k) + 'px';
    el.querySelector('.seta').style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI + 90) + 'deg)';
    el.style.display = 'block';
  });
}

let primeiroQuadro = true;
let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;

  let andando = false, rot = 0;   // movimento deste quadro, para a animação do Azazel
  if (VISAO === 'jogo') {
    let ix = joy.x, iz = joy.z;
    if (pressionada('KeyW', 'ArrowUp')) iz += 1;
    if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
    if (pressionada('KeyD', 'ArrowRight')) ix += 1;
    if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
    const forca = Math.min(1, Math.hypot(ix, iz));
    // câmera fixa: a frente é o norte (-z) e a direita é o leste (+x)
    let dx = ix;
    let dz = -iz;
    const n = Math.hypot(dx, dz);
    if (n > 1e-6 && forca > 0) {
      andando = true;
      rot = Math.atan2(dx, dz);
      dx = (dx / n) * forca * VELOCIDADE * dt;
      dz = (dz / n) * forca * VELOCIDADE * dt;
      const p = resolverMovimento({ x: estado.x, z: estado.z }, dx, dz, RAIO, caixasAABB);
      estado.x = p.x;
      estado.z = p.z;
    }
  }

  jogador.position.set(estado.x, camada(estado.z), estado.z);
  sombra.position.set(estado.x, camada(estado.z) - 0.005, estado.z);
  uPes.value = (estado.z / ALT + 0.5) * IMG_H;
  azazel.atualizar(andando, rot, 0);
  if (VISAO === 'geral') {
    alvoCamera.x = 0;
    alvoCamera.z = 0;
  } else {
    // a câmera segue o personagem com suavidade; na horizontal e na vertical do chão, não sai do mapa
    const seguir = primeiroQuadro ? 1 : 1 - Math.exp(-dt * 14);
    const x = THREE.MathUtils.clamp(estado.x, -LARG / 2 + camera.right, LARG / 2 - camera.right);
    const dz = camera.top / SEN;                 // metade da profundidade do chão visível
    const z = THREE.MathUtils.clamp(estado.z, -ALT / 2 + dz, ALT / 2 - dz);
    alvoCamera.x += (x - alvoCamera.x) * seguir;
    alvoCamera.z += (z - alvoCamera.z) * seguir;
  }
  posicionarCamera();
  atualizarSaidas(agora);
  // em pé: o personagem é um sprite que encara a câmera (não fica deitado no chão)
  jogador.quaternion.copy(camera.quaternion);
  primeiroQuadro = false;
  renderer.render(cena, camera);
  requestAnimationFrame(quadro);
}
window.addEventListener('resize', () => {
  enquadrar();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});
// para os testes: posição do personagem, estado dos ovos e colisores
window.quarteirao = {
  estado: () => ({ x: estado.x, z: estado.z }),
  camera: () => ({ x: alvoCamera.x, z: alvoCamera.z }),
  ovos: () => ovos.map((o) => o.visible),
  colisoes: () => colisoes.length,
  caixas: () => caixasAABB,
  mover: (x, z) => { estado.x = x; estado.z = z; },
  saidas: () => SAIDAS.map((sa) => ({ nome: sa.nome, centro: sa.centro, x0: sa.x0, x1: sa.x1, z0: sa.z0, z1: sa.z1 })),
  saidaAtual: () => (saidaAtual ? saidaAtual.nome : null),
};
requestAnimationFrame(quadro);
