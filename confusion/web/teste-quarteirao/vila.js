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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
const cena = new THREE.Scene();
cena.background = new THREE.Color('#cfe8f7');
// Câmera em ângulo, como nas capturas de referência: ortográfica, com inclinação fixa e sem girar.
// INCLINACAO: graus a partir da horizontal (90 seria de cima). ALTURA_CAMERA: unidades de tela visíveis na vertical.
// Ajuste pela URL para testar: ?inclinacao=50&altura=25
const INCLINACAO = THREE.MathUtils.clamp(Number(params.get('inclinacao')) || 50, 30, 80);
const ALTURA_CAMERA = Number(params.get('altura')) || 25;
const SEN = Math.sin(THREE.MathUtils.degToRad(INCLINACAO));
const COS = Math.cos(THREE.MathUtils.degToRad(INCLINACAO));
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
    : aspecto < 1 ? ALT * SEN
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
    const t = carregador.load(A + nome + '.webp');
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    texturas.set(nome, t);
  }
  return texturas.get(nome);
}
const materialBase = (nome, opts = {}) =>
  new THREE.MeshBasicMaterial({ map: textura(nome), transparent: true, alphaTest: 0.4, ...opts });

// ---- chão: a imagem inteira da cidade. O topo da imagem fica no norte ----
{
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(LARG, ALT).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: textura('piso-vila'), depthTest: false, depthWrite: false }));
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
const COLISAO = { celula: 8, colunas: 344, linhas: 192, rle: "0,203,47,45,23,225,52,43,23,223,55,42,23,221,59,40,24,217,71,31,24,215,85,19,24,213,26,6,61,14,24,211,25,10,63,11,23,211,26,10,66,6,25,211,24,13,67,3,25,212,23,13,96,211,22,16,8,9,78,209,23,17,7,15,2,11,59,209,21,22,5,31,56,207,21,26,1,36,54,203,22,72,49,200,20,81,45,192,4,1,19,87,43,188,23,94,43,183,22,100,40,182,20,102,41,181,20,101,44,179,20,101,46,176,21,100,48,170,26,95,54,164,30,96,55,159,32,97,29,10,18,154,35,97,29,12,19,148,38,98,27,14,21,122,12,2,48,97,26,17,21,117,66,96,26,19,21,111,71,96,26,21,20,100,81,27,2,67,24,24,20,95,86,10,3,11,7,63,23,26,21,90,92,3,10,8,12,59,21,29,21,85,110,6,16,56,20,31,21,81,114,4,18,55,18,33,22,78,118,2,20,53,17,35,21,76,121,1,23,49,17,37,20,74,148,48,16,39,19,73,149,46,17,41,18,71,49,33,70,45,16,43,17,69,43,46,65,44,16,45,16,67,38,58,60,44,15,48,14,65,34,69,55,43,15,50,13,63,34,74,52,43,15,52,11,54,40,80,49,42,15,55,9,52,39,85,46,42,15,58,7,51,38,90,42,43,14,61,5,50,37,94,39,43,14,64,3,48,36,98,38,43,14,65,2,47,35,100,37,43,15,66,1,46,35,101,38,41,14,114,34,103,40,38,14,114,33,104,46,32,14,114,32,89,1,15,49,30,12,115,32,89,5,11,53,26,12,115,32,88,11,7,56,21,13,114,33,88,11,7,29,4,27,18,12,114,31,90,11,7,28,8,29,13,12,10,2,102,31,91,10,8,18,20,30,10,10,12,3,101,30,91,11,7,18,23,31,8,8,12,5,99,30,91,11,7,18,27,31,5,6,13,7,98,29,91,12,6,19,31,29,3,5,12,11,95,29,91,12,6,19,35,28,16,14,94,28,91,13,5,19,39,26,14,18,90,28,91,14,5,18,43,23,13,21,88,28,90,15,4,18,47,19,13,22,87,27,91,16,3,18,51,16,12,24,86,26,91,18,2,17,56,12,11,25,85,26,91,37,60,10,8,28,83,26,92,36,63,9,6,31,81,26,91,36,66,8,4,33,79,26,91,37,69,44,77,26,90,37,72,43,75,26,72,8,11,36,75,43,73,26,69,14,7,36,77,43,72,25,68,17,3,38,81,41,71,25,67,58,83,40,71,25,65,59,86,38,71,24,65,59,89,36,71,24,64,60,91,36,69,23,63,61,92,38,67,23,62,61,94,38,66,22,61,62,96,39,63,23,60,62,99,38,61,24,59,62,102,36,60,25,58,61,106,35,58,26,57,59,113,33,56,26,55,59,119,32,51,28,54,55,130,28,48,30,52,55,134,28,43,32,50,56,138,28,38,34,49,57,141,27,32,39,47,59,141,28,25,44,46,60,142,30,18,49,44,63,141,31,11,54,43,65,140,32,10,54,29,81,139,32,9,32,2,20,28,63,1,20,137,32,9,30,6,19,26,62,3,21,136,32,9,28,12,15,25,60,7,22,134,32,9,25,16,15,24,57,11,23,132,32,9,23,18,16,22,56,14,23,131,31,12,18,22,15,22,54,18,23,129,25,1,3,17,12,25,16,22,50,23,22,128,24,25,5,30,16,21,48,27,23,125,24,60,16,21,46,32,23,122,23,62,16,21,44,35,25,118,23,63,16,21,41,39,25,115,23,64,17,21,38,43,25,59,2,52,23,65,17,25,32,45,26,54,7,50,22,66,18,24,30,49,26,50,11,47,23,67,18,22,30,52,26,46,14,46,22,69,17,21,29,55,26,43,16,45,22,71,17,20,27,58,26,40,18,44,23,72,18,18,26,61,26,36,21,43,22,74,18,16,25,64,30,30,24,5,3,33,22,74,21,13,23,67,31,26,27,1,8,30,22,76,25,5,24,70,31,23,39,29,21,78,51,75,29,21,41,28,20,80,48,80,27,18,44,27,20,81,44,84,28,15,45,27,19,83,41,89,27,11,47,27,18,85,40,90,27,8,49,26,18,87,39,92,26,6,50,25,19,88,38,93,27,2,51,25,18,91,37,94,79,23,19,94,36,95,76,23,19,97,35,96,73,22,21,98,35,97,69,23,20,99,37,99,64,24,20,100,38,100,60,25,20,4,2,94,41,100,55,26,21,5,3,92,44,99,53,26,21,5,5,91,48,97,48,28,21,6,6,89,51,96,44,30,22,5,7,88,53,97,40,32,35,87,55,96,39,31,36,86,57,97,37,30,37,85,60,96,36,29,37,84,63,97,35,27,21,3,14,83,66,96,34,26,22,2,15,82,69,96,33,24,22,2,15,82,40,4,27,96,32,23,22,2,14,83,41,6,27,96,30,21,23,2,13,84,42,8,26,96,30,18,25,2,13,82,44,10,25,97,28,16,26,2,15,79,31,3,12,12,25,96,28,13,27,3,17,75,32,4,12,14,26,94,27,11,28,4,24,19,4,44,31,7,10,16,27,93,27,7,30,6,24,16,6,42,32,9,9,16,31,90,26,5,32,6,25,14,7,41,32,12,5,19,32,89,26,1,34,8,25,12,8,39,32,39,37,84,60,9,24,10,10,38,32,42,37,82,60,10,24,8,11,37,32,45,36,82,59,10,26,5,12,36,31,49,34,84,57,11,42,34,31,53,33,85,55,13,40,33,29,58,32,84,55,14,39,31,30,59,34,82,55,16,37,29,31,60,35,81,55,16,37,27,31,62,37,1,3,71,59,16,37,26,31,60,47,64,64,15,37,24,31,61,52,55,71,12,37,24,31,60,74,28,80,9,37,23,32,60,90,9,87,6,36,23,32,60,22,2,165,4,35,23,31,61,23,4,123,3,39,1,15,2,17,24,31,61,22,9,118,7,52,6,12,24,32,61,22,12,114,11,50,40,33,61,22,15,110,16,46,38,35,62,22,18,105,20,44,36,36,62,18,25,100,25,41,36,36,63,17,26,98,29,39,35,36,65,15,29,94,32,38,34,36,66,14,31,90,36,38,32,36,67,13,37,82,40,39,29,36,69,11,40,76,45,39,26,37,71,9,44,70,50,38,24,37,74,4,52,62,54,39,22,36,142,46,60,39,20,37,152,31,66,40,18,36,161,18,72,41,16,34,255,40,15,34,256,42,12,33,258,45,8,32,260,47,5,31,262,48,3,30,264,49,1,30,266,77,268,75,271,45" };
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
function camadaObjetos(frente, ordem) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: texObjetos }, base: { value: texBase }, pesY: uPes, frente: { value: frente ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D mapa; uniform sampler2D base; uniform float pesY; uniform float frente; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(mapa, vUv);
        vec3 b = texture2D(base, vUv).rgb;
        if (b.b < 0.5 || c.a < 0.03) discard;
        float linha = floor(b.r * 255.0 + 0.5) * 256.0 + floor(b.g * 255.0 + 0.5);
        bool naFrente = linha > pesY;
        if ((frente > 0.5) != naFrente) discard;
        gl_FragColor = c;
      }`,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(LARG, ALT).rotateX(-Math.PI / 2), mat);
  m.position.y = 0.02;
  m.renderOrder = ordem;
  cena.add(m);
  return m;
}
camadaObjetos(false, 1);   // atrás
camadaObjetos(true, 4);    // na frente

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
};
requestAnimationFrame(quadro);
