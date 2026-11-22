// Quarteirão de teste da primeira cidade. O chão é a imagem completa da cidade (1376x768), que já tem as casas, o rio,
// a ponte, as barracas e a fonte pintados. A colisão segue essa imagem: retângulos marcados em pixels da imagem (BLOQUEIOS)
// cobrem o que é parede ou obstáculo; ruas, praça, calçada e ponte ficam livres. Escala: o Azazel tem 3,8 de altura no mundo.
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';

const A = 'assets/';
const IMG_W = 1376, IMG_H = 768;                 // tamanho do piso (16:9)
const LARG = 54;                                 // largura do piso no mundo
const ALT = LARG * IMG_H / IMG_W;                // altura do piso no mundo
const ALTURA_PERSONAGEM = 3.8;                   // altura do Azazel no mundo, em proporção ao mapa
const RAIO = 0.68;                               // raio do personagem para a colisão (acompanha o tamanho)
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
// Projeção 2D fixa: X aponta para leste e Z para sul.
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.up.set(0, 0, -1);
camera.position.y = 18;
camera.lookAt(0, 0, 0);
function enquadrar() {
  const aspecto = window.innerWidth / window.innerHeight;
  const geral = ['topo', 'geral'].includes(VISAO);
  const altura = geral ? Math.max(ALT, LARG / aspecto) : Math.min(18, ALT, LARG / aspecto);
  camera.top = altura / 2;
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
    new THREE.MeshBasicMaterial({ map: textura('piso-cidade-2') }));
  cena.add(piso);
}

// ---- colisões (retângulos no chão) ----
const colisoes = [];
const caixa = (x0, x1, z0, z1) => colisoes.push({ x0, x1, z0, z1 });

// limites da imagem: fora dela não se anda (muro invisível)
caixa(-30, 30, -ALT / 2 - 2, -ALT / 2);            // norte
caixa(-30, 30, ALT / 2, ALT / 2 + 2);              // sul
caixa(-30, -LARG / 2, -ALT / 2 - 2, ALT / 2 + 2);  // oeste
caixa(LARG / 2, 30, -ALT / 2 - 2, ALT / 2 + 2);    // leste

// obstáculos pintados na imagem: casas, rio, rochas, carroça, barracas, corrimão, fonte e árvores.
// Cada retângulo é [x0, y0, x1, y1] em pixels da imagem. Ruas, praça, calçadas, escadas e a ponte ficam livres.
const BLOQUEIOS = [
  [60, 0, 340, 290], [0, 180, 210, 420], [0, 410, 260, 640], [330, 0, 520, 300], [495, 0, 565, 260],   // casas e pinheiro
  [560, 110, 640, 230], [600, 220, 690, 330], [440, 400, 575, 500], [240, 540, 390, 600],              // rio
  [340, 405, 450, 470], [330, 330, 420, 400],                                                          // rochas e carroça
  [530, 470, 670, 545], [820, 450, 980, 525], [935, 480, 1085, 560], [640, 555, 780, 690], [750, 600, 895, 700], // barracas
  [800, 0, 1120, 320], [1020, 130, 1350, 460], [1150, 0, 1376, 140], [1290, 290, 1376, 520],          // casas e pinheiros da direita
  [900, 372, 1095, 396],                                                                               // corrimão da praça
  [1085, 575, 1230, 700], [1200, 545, 1340, 640],                                                      // fonte e carroça
  [170, 650, 360, 768], [440, 615, 620, 768], [940, 690, 1100, 768], [1260, 610, 1376, 768],          // casas de baixo
  [330, 670, 460, 768], [630, 690, 740, 768], [690, 130, 770, 215], [0, 0, 55, 170],                   // árvores
];
for (const [px0, py0, px1, py1] of BLOQUEIOS) {
  const a = P(px0, py0), b = P(px1, py1);
  caixa(a.x, b.x, a.z, b.z);
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

// ---- ninhos da Fazenda dos Ovos: em trechos livres de calçamento; começam vazios ----
const NINHOS = [P(700, 420), P(705, 520), P(1010, 650), P(1230, 470)].map((p) => [p.x, p.z]);
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
cena.add(jogador);

// ---- entrada: teclado e joystick de toque ----
const teclas = new Set();
const INICIO = P(300, 460);                  // início num caminho de terra livre, perto da ponte
const estado = { x: INICIO.x, z: INICIO.z };
const PRESET = { taverna: P(330, 430), loja: P(1000, 420) };   // posições para conferir visualmente
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

document.getElementById('btn-ovo').addEventListener('click', () => depositar());
document.getElementById('btn-recolher').addEventListener('click', () => recolherOvos());

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
  jogador.rotation.x = -Math.PI / 2;
  azazel.atualizar(andando, rot, 0);
  const geral = ['topo', 'geral'].includes(VISAO);
  if (geral) {
    camera.position.x = camera.position.z = 0;
  } else {
    const seguir = primeiroQuadro ? 1 : 1 - Math.exp(-dt * 14);
    const x = THREE.MathUtils.clamp(estado.x, -LARG / 2 + camera.right, LARG / 2 - camera.right);
    const z = THREE.MathUtils.clamp(estado.z, -ALT / 2 + camera.top, ALT / 2 - camera.top);
    camera.position.x += (x - camera.position.x) * seguir;
    camera.position.z += (z - camera.position.z) * seguir;
  }
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
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
  ovos: () => ovos.map((o) => o.visible),
  colisoes: () => colisoes.length,
  caixas: () => caixasAABB,
  mover: (x, z) => { estado.x = x; estado.z = z; },
};
requestAnimationFrame(quadro);
