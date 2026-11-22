import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';

const A = 'assets/';
const IMG_W = 1376, IMG_H = 768;                 // tamanho do piso (16:9)
const LARG = 54;                                 // largura do piso no mundo
const ALT = LARG * IMG_H / IMG_W;                // altura do piso no mundo
const ALTURA_PERSONAGEM = 3.8;                   // altura do Azazel no mundo (antes 2,55), em proporção ao mapa
const RAIO = 0.68;                               // raio do personagem para a colisão (acompanha o tamanho)
const VELOCIDADE = 5.2;

// ponto da imagem (px, py) -> mundo; o topo da imagem é o norte (-z)
const P = (px, py) => ({ x: (px / IMG_W - 0.5) * LARG, z: (py / IMG_H - 0.5) * ALT });

// tamanho em pixels de cada recorte (para manter a proporção)
const PX = {
  lampada: [127, 331], placa: [183, 316], banco: [313, 270], vaso: [295, 216], arbusto: [280, 221],
  portao: [250, 246], poste: [56, 261], tabua: [329, 81], mesa: [337, 232], ninho: [319, 206], cocho: [338, 195],
  ovo: [82, 104],
};
const ALTURA = { // altura visível de cada objeto, em unidades (tamanho do personagem como referência)
  lampada: 4.5, placa: 3.3, banco: 1.94, vaso: 1.17, arbusto: 1.8, portao: 2.4, poste: 1.95, tabua: 0.74,
  mesa: 1.51, ninho: 0.71, cocho: 0.81, ovo: 0.4,
};
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

// ---- chão: a imagem inteira, sem recorte nem espelho. O topo da imagem fica no norte ----
{
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(LARG, ALT).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: textura('piso-cidade-1') }));
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


// ---- objetos: sprites em pé, com a base no chão; giram para a câmera (estilo Tibia) ----
// As peças são desenhos planos. A coordenada sul dos pés define a ordem das camadas.
const camada = z => 0.04 + (z + ALT / 2) * 0.01;
function desenho(nome, x, z, w, h, elevacao = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), materialBase(nome));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, camada(z) + elevacao, z - h / 2);
  cena.add(mesh);
  return mesh;
}
function objeto(nome, { x, z, y = 0, altura = ALTURA[nome], colide = false }) {
  const w = largura(nome, altura);
  const mesh = desenho(nome, x, z, w, altura, y * 0.01);
  mesh.position.z -= y;
  if (colide) caixa(x - w * 0.4, x + w * 0.4, z - altura * 0.25, z);
  return mesh;
}
const emImagem = (nome, px, py, extra = {}) => objeto(nome, { ...P(px, py), colide: true, ...extra });
const TAVERNA = P(295, 317), LOJA = P(1160, 336);
function casa(nome, { x, z }, w, h) {
  desenho(nome, x, z, w, h);
  caixa(x - w * 0.46, x + w * 0.46, z - h * 0.70, z - 0.06);
}
casa('edificio-taverna', TAVERNA, 8.5, 6.1);
casa('edificio-loja', LOJA, 6.5, 4.8);

// ---- Fazenda dos Ovos: cerca no campo à direita da estrada sul (imagem: x 700-1260, y 340-740) ----
const F = { x0: P(700, 0).x, x1: P(1260, 0).x, z0: P(0, 390).z, z1: P(0, 740).z };
// postes igualmente espaçados (cerca de 3 unidades), de a até b, incluindo as duas pontas
function pontos(a, b) {
  const n = Math.max(1, Math.round((b - a) / 3));
  return Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
}
function poste(x, z) {
  desenho('poste', x, z, 0.29, 0.92, 0.012);
}
function tabuas(x0, z0, x1, z1) {
  const comprimento = Math.hypot(x1 - x0, z1 - z0);
  const z = (z0 + z1) / 2;
  const madeira = desenho('tabua', (x0 + x1) / 2, z, comprimento, 0.22);
  madeira.position.z = z - (x0 === x1 ? 0 : 0.47);
  madeira.rotateZ(-Math.atan2(z1 - z0, x1 - x0));
}
const postesNS = pontos(F.x0, F.x1);       // norte e sul
const postesLO = pontos(F.z0, F.z1);       // leste e oeste
for (const x of postesNS) { poste(x, F.z0); poste(x, F.z1); }
for (let i = 0; i < postesNS.length - 1; i++) {
  tabuas(postesNS[i], F.z0, postesNS[i + 1], F.z0);
  tabuas(postesNS[i], F.z1, postesNS[i + 1], F.z1);
}
for (const z of postesLO.slice(1, -1)) poste(F.x1, z);
for (let i = 0; i < postesLO.length - 1; i++) tabuas(F.x1, postesLO[i], F.x1, postesLO[i + 1]);
// oeste: o portão fica no meio do segmento central, de frente para a estrada sul
const SEG_PORTAO = Math.floor((postesLO.length - 1) / 2);
const PORTAO_Z = (postesLO[SEG_PORTAO] + postesLO[SEG_PORTAO + 1]) / 2;
for (const z of postesLO.slice(1, -1)) poste(F.x0, z);
for (let i = 0; i < postesLO.length - 1; i++) {
  if (i !== SEG_PORTAO) tabuas(F.x0, postesLO[i], F.x0, postesLO[i + 1]);
}
// portão: folha presa numa dobradiça no lado norte da abertura. Abre (para dentro do campo) quando o personagem
// chega perto e fecha ao se afastar; fechado, a folha bloqueia a passagem. Aberto, a passagem fica livre.
const zDobradica = postesLO[SEG_PORTAO];
const LARG_PORTAO = postesLO[SEG_PORTAO + 1] - zDobradica;
// Uma folha de correr recolhe junto ao trecho norte da cerca.
const folha = desenho('tabua', F.x0, PORTAO_Z, LARG_PORTAO, 0.34, 0.016);
folha.rotateZ(-Math.PI / 2);
const caixaPortao = { min: { x: F.x0 - 0.2, y: 0, z: zDobradica }, max: { x: F.x0 + 0.2, y: 6, z: zDobradica + LARG_PORTAO } };
let portaoAberto = false, abertura = 0;
function atualizarPortao(dt) {
  const d = Math.hypot(estado.x - F.x0, estado.z - PORTAO_Z);
  if (d < 2.5) portaoAberto = true;
  if (d > 3.5) portaoAberto = false;
  abertura = THREE.MathUtils.clamp(abertura + (portaoAberto ? 1 : -1) * dt * 5, 0, 1);
  folha.position.z = PORTAO_Z - abertura * LARG_PORTAO;
  caixaPortao.max.z = zDobradica + (1 - abertura) * LARG_PORTAO;
  const existe = caixasAABB.includes(caixaPortao);
  if (abertura < 1 && !existe) caixasAABB.push(caixaPortao);
  if (abertura === 1 && existe) caixasAABB.splice(caixasAABB.indexOf(caixaPortao), 1);
}
// colisões: os lados da cerca; o segmento do portão fica livre para passar
caixa(F.x0 - 0.2, F.x1 + 0.2, F.z0 - 0.2, F.z0 + 0.2);                       // norte
caixa(F.x0 - 0.2, F.x1 + 0.2, F.z1 - 0.2, F.z1 + 0.2);                       // sul
caixa(F.x1 - 0.2, F.x1 + 0.2, F.z0, F.z1);                                   // leste
caixa(F.x0 - 0.2, F.x0 + 0.2, F.z0, postesLO[SEG_PORTAO]);                    // oeste, norte do portão
caixa(F.x0 - 0.2, F.x0 + 0.2, postesLO[SEG_PORTAO + 1], F.z1);                // oeste, sul do portão

// ---- objetos da fazenda ----
const NINHOS = [P(820, 440), P(980, 440), P(820, 600), P(980, 600)].map((p) => [p.x, p.z]);
NINHOS.forEach(([x, z]) => objeto('ninho', { x, z, altura: ALTURA.ninho }));
const ovos = NINHOS.map(([x, z]) => {
  const g = objeto('ovo', { x, z, y: 0.3, altura: ALTURA.ovo });
  g.visible = false;
  return g;
});
emImagem('mesa', 1130, 670);
emImagem('cocho', 770, 370);

// ---- cidade: objetos de calçada, praça e campo ----
emImagem('lampada', 139, 314, { altura: 2.6 });       // no gramado junto da calçada oeste
emImagem('placa', 424, 312, { altura: 1.7 });         // ao norte da estrada oeste
emImagem('banco', 960, 170);         // praça

// ---- Azazel no traje de vilão: andar em vídeo MP4 e parado nas 4 direções (mesmo do jogo principal) ----
const azazel = criarAzazel('assets/characters/', ALTURA_PERSONAGEM);
const jogador = new THREE.Group();
jogador.add(azazel.malha);
cena.add(jogador);

// ---- entrada: teclado e joystick de toque ----
const teclas = new Set();
const INICIO = P(420, 380);                  // início na estrada oeste
const estado = { x: INICIO.x, z: INICIO.z };
if (VISAO === 'portao') { estado.x = F.x0 - 2; estado.z = PORTAO_Z; }
if (VISAO === 'taverna') Object.assign(estado, TAVERNA);
if (VISAO === 'loja') Object.assign(estado, LOJA);
if (['taverna', 'loja'].includes(VISAO)) estado.z += 1.2;
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
    const frente = { x: 0, z: -1 };         // câmera fixa: a frente é o norte
    const direita = { x: 1, z: 0 };
    let dx = frente.x * iz + direita.x * ix;
    let dz = frente.z * iz + direita.z * ix;
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

  atualizarPortao(dt);
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
// para os testes: posição do personagem, estado dos ovos e geometria da cerca
window.quarteirao = {
  estado: () => ({ x: estado.x, z: estado.z }),
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
  ovos: () => ovos.map((o) => o.visible),
  colisoes: () => colisoes.length,
  caixas: () => caixasAABB,
  cerca: () => ({ x0: F.x0, x1: F.x1, z0: F.z0, z1: F.z1, portaoZ: PORTAO_Z }),
  mover: (x, z, yaw) => { estado.x = x; estado.z = z; if (yaw !== undefined) estado.yaw = yaw; },
};
requestAnimationFrame(quadro);
