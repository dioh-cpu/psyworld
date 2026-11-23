// Vila de teste. Chão limpo (piso-vila) + camada de objetos (vila-objetos) recortada da cena completa.
// Cada pixel de objeto sabe a linha do chão onde encosta (vila-base): se o pé do personagem está acima dessa linha,
// ele passa atrás do objeto; se está abaixo, na frente. Colisão: água + pegada dos objetos (grade de 8 px).
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
const COLISAO = { celula: 8, colunas: 344, linhas: 192, rle: "255,1,17,21,285,6,1,2,7,3,17,22,291,12,17,22,19,3,95,2,147,1,54,23,20,3,94,2,202,22,23,1,93,2,203,21,25,4,89,1,207,17,26,5,88,1,211,6,2,4,27,8,91,3,213,1,30,6,91,3,246,4,91,3,247,3,536,15,139,2,184,19,138,6,181,19,137,9,179,19,137,9,179,19,61,2,74,9,168,4,3,23,60,2,19,1,55,9,159,39,59,3,75,13,135,59,59,3,13,1,61,14,125,53,74,3,75,2,2,12,117,55,78,2,13,2,4,3,54,1,4,17,97,11,1,57,19,1,58,1,14,10,60,15,95,71,19,4,71,10,61,13,94,72,19,9,65,11,61,13,93,74,18,11,14,3,29,2,15,1,1,9,61,13,89,3,1,75,17,28,29,2,8,2,10,5,16,1,45,13,88,74,4,2,17,29,28,2,7,3,11,4,62,13,88,67,30,30,25,4,7,5,9,1,61,17,86,61,38,31,19,1,2,7,5,6,72,3,3,10,86,48,8,3,38,36,12,15,4,8,78,8,86,40,55,42,7,16,4,9,21,2,54,8,83,35,59,47,5,16,5,11,1,1,4,1,14,1,53,8,78,39,61,46,3,17,6,11,1,2,2,2,70,6,75,39,70,40,2,18,6,15,77,2,73,36,75,59,8,14,151,25,2,1,86,57,8,16,140,5,3,22,95,54,9,16,140,30,96,53,9,16,9,1,130,30,100,19,3,27,10,15,9,4,127,30,103,15,5,25,11,15,9,6,125,26,130,21,12,15,12,3,125,25,135,16,12,16,140,25,136,13,14,16,140,24,73,5,59,11,15,17,140,23,76,6,56,8,17,2,3,13,140,23,79,6,53,6,19,2,3,12,141,21,85,4,51,5,20,2,2,12,142,15,93,4,46,7,20,15,144,12,99,3,44,5,21,15,145,11,102,3,66,13,1,1,23,3,121,8,107,2,65,16,21,4,237,3,24,2,36,17,21,4,239,2,22,3,34,18,16,2,4,12,232,3,22,6,28,19,15,5,1,16,230,4,21,1,32,19,13,3,2,27,281,19,10,4,3,27,284,15,10,4,4,27,184,8,55,1,39,11,11,2,7,26,184,11,52,1,42,6,11,2,10,25,184,12,50,4,42,3,11,3,11,24,184,15,45,7,54,3,14,22,184,15,3,3,35,6,56,5,16,21,184,15,3,4,35,2,59,3,20,19,32,2,150,17,1,6,117,19,32,3,149,17,1,6,117,20,30,4,149,17,1,10,113,23,27,4,146,20,1,9,114,24,26,4,4,2,137,23,1,6,119,2,4,17,25,4,4,3,131,3,1,26,133,15,24,5,3,4,126,33,142,7,23,7,2,4,45,2,76,26,3,7,142,8,22,7,2,4,43,5,62,31,2,3,7,6,142,9,20,8,2,4,42,6,61,32,12,7,141,13,16,8,2,4,40,8,61,32,16,2,142,15,14,9,1,4,39,9,61,32,17,1,142,16,12,15,39,9,61,32,17,1,141,19,10,15,38,10,61,32,17,1,61,1,49,3,25,46,37,11,61,32,17,1,60,13,38,10,19,34,2,9,2,8,24,16,2,3,54,32,17,1,62,3,5,3,40,3,4,2,20,32,3,8,2,13,2,10,6,17,2,5,52,32,15,3,69,5,47,3,19,31,3,8,2,25,6,24,52,32,16,2,69,2,1,1,48,8,16,28,4,8,2,25,6,27,49,29,2,4,2,1,10,3,1,1,1,1,117,4,20,27,4,4,2,2,2,25,6,28,46,28,13,2,7,1,77,1,71,25,4,4,6,26,5,29,41,28,1,2,174,24,5,3,6,29,2,31,27,36,89,1,91,23,6,3,6,43,2,20,21,35,102,3,81,22,7,2,6,42,3,22,7,4,6,25,114,3,82,20,8,2,3,43,5,62,117,1,86,17,8,2,3,42,6,62,116,2,88,15,9,1,3,40,8,62,116,1,91,12,14,40,9,61,209,11,14,39,10,61,215,3,16,39,10,61,98,2,2,3,129,3,7,25,16,3,2,54,97,5,1,2,129,3,13,4,8,6,17,2,4,53,92,1,3,8,55,1,74,3,25,6,24,58,84,3,2,9,130,3,25,6,27,53,83,18,126,6,23,1,1,7,27,47,87,19,4,1,121,6,24,8,28,42,90,20,3,4,119,6,2,5,20,5,29,29,5,4,92,27,124,8,59,22,103,27,125,6,10,7,45,9,2,8,47,2,54,23,3,2,139,10,110,2,50,3,2,22,147,5,110,4,49,28,29,9,223,6,48,26,32,9,221,5,51,24,34,9,218,6,54,22,33,11,67,2,147,5,59,17,34,13,31,2,248,11,39,13,31,2,179,5,66,7,40,14,31,1,146,1,32,6,67,5,41,14,69,2,106,2,31,2,73,2,43,14,69,2,104,6,27,3,119,14,69,2,49,1,53,3,29,4,118,16,69,3,101,1,30,5,118,17,104,1,67,2,8,2,19,3,121,17,170,3,9,3,17,3,121,18,163,1,3,5,10,8,10,3,122,19,164,6,28,4,120,18,168,3,30,4,121,13,204,4,115,3,5,13,203,3,110,10,1,15,38,4,9,3,48,2,101,2,52,2,1,10,45,25,39,5,2,3,2,4,49,2,101,1,52,15,44,22,42,5,1,9,50,2,151,18,42,23,36,2,4,15,51,2,151,18,42,23,13,2,19,4,2,16,50,5,144,4,4,16,42,23,13,2,17,23,50,6,95,3,43,6,6,16,46,19,12,2,16,23,50,7,95,5,40,7,6,15,49,3,3,5,19,1,15,22,52,7,96,4,39,7,7,13,57,5,33,22,54,4,100,3,38,8,4,14,59,5,32,23,53,5,100,3,37,26,61,6,30,22,54,5,101,2,36,26,93,22,59,5,136,27,90,26,60,5,134,26,93,26,59,9,131,25,88,2,4,25,60,9,131,23,89,4,3,24,61,6,130,27,91,2,2,23,63,6,3,2,124,5,1,21,95,22,64,7,3,3,122,26,97,21,41,1,23,5,3,6,119,25,99,20,55,1,10,5,6,4,63,2,13,5,34,10,2,12,102,19,54,5,8,5,6,4,62,3,13,5,34,17,2,3,103,18,54,9,2,9,6,6,59,4,13,5,35,15,110,16,53,21,7,7,56,6,13,4,38,13,110,15,54,21,7,7,31,31,13,3,41,10,50,5,56,13,51,26,7,8,28,34,2,5,52,7,21,2,25,9,42,4,8,13,48,28,7,9,26,29,5,15,15,1,26,2,6,1,22,3,5,6,8,16,39,6,9,7,53,28,7,9,25,28,8,14,43,3,26,4,3,33,40,4,11,2,56,28,5,11,23,27,11,14,7,2,62,2,3,37,43,2,71,24,5,11,22,26,13,14,4,4,62,2,4,37,2,1,40,3,70,23,6,11,21,24,16,14,3,3,13,4,47,1,5,40,40,4,69,23,7,10,9,5,5,20,22,14,1,3,9,2,4,1,50,1,4,41,40,9,66,21,10,7,4,12,1,21,21,16,1,2,8,5,60,41,40,4,72,19,12,7,2,34,23,16,9,6,48,1,1,3,12,42,112,15,14,41,24,15,10,7,47,5,13,41,2,5,109,11,14,40,25,15,8,9,48,4,15,39,2,15,100,9,15,38,31,11,5,16,44,4,17,37,2,19,99,3,17,1,2,35,36,2,10,17,45,3,17,36,2,23,1,7,110,33,48,21,45,4,17,33,2,34,108,31,48,23,46,4,16,3,4,3,3,3,1,46,5,1,108,28,50,24,47,5,32,41,117,27,52,22,87,38,118,25,52,22,91,34,120,24,53,21,64,4,25,29,124,23,54,12,1,6,66,10,19,26,127,21,56,11,2,6,71,7,17,24,128,10,5,5,58,3,2,6,3,4,77,4,15,18,134,6,10,2,60,3,2,5,4,4,97,5,1,3,145,2,71,5,2,3,7,2,104,3,145,1,71,5,3,4,6,1,105,3,210,2,4,6,4,3,93,3,16,3,208,4,2,7,5,3,93,3,2,3,11,3,203,3,1,2,2,10,6,1,94,7,12,3,4,3,195,3,6,9,119,10,194,2,2,2,7,8,322,3,1,2,8,8,321,4,1,1,8,9,322,2,2,1,8,7,166,2,158,3,5,4,1,3,23,2,3,1,135,9,142,1,5,2,1,1,1,11,1,2,31,3,10,2,9,6,107,16,134,2,3,5,2,9,2,2,30,6,8,4,3,14,103,18,132,11,1,13,31,7,6,27,82,4,5,2,4,25,9,8,108,25,32,1,3,4,2,36,75,13,2,30,5,7,108,24,33,1,5,47,20,1,48,47,3,6,109,22,34,2,5,50,14,5,32,2,7,59,111,21,44,52,6,12,31,1,3,60,113,20,47,70,30,64,111,21,48,73,28,31,2,30,109,16,1,5,49,77,24,31,2,30,108,21,52,77,23,31,2,10,4,16,64" };
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
const INICIO = P(1124, 940);                 // início no caminho de pedra do centro
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
