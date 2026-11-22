// Quarteirão de teste da primeira cidade. O chão é uma imagem só (16:9), com rua em cruz, praça de pedra, calçadas
// nas bordas e o campo da Fazenda dos Ovos à direita da estrada sul. Tudo é posto pelas coordenadas da imagem:
// P(px, py) converte um ponto da imagem para o mundo. Escala: o Azazel tem 2,55 unidades de altura, como no jogo.
// Câmera de cima, estilo Tibia: ângulo fixo, sem girar. Objetos são sprites em pé; fachadas mostram só a frente.
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';

const A = 'assets/';
const IMG_W = 1376, IMG_H = 768;                 // tamanho do piso (16:9)
const LARG = 54;                                 // largura do piso no mundo
const ALT = LARG * IMG_H / IMG_W;                // altura do piso no mundo
const ALTURA_PERSONAGEM = 2.55;                  // igual ao jogo
const ESCALA_AZAZEL = ALTURA_PERSONAGEM / 480;   // a figura do Azazel tem 480 px de altura na folha
const RAIO = 0.45;                               // raio do personagem para a colisão
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
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);

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
  // base verde por baixo: se a câmera passar da borda da imagem, não aparece o céu
  const base = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#5a8f42' }));
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.03;
  cena.add(base);
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
const sprites = [];
function objeto(nome, { x, z, y = 0, altura = ALTURA[nome], colide = null, giro = 0, doisLados = false, sprite = true }) {
  const w = largura(nome, altura);
  const mat = materialBase(nome, doisLados ? { side: THREE.DoubleSide } : {});
  const grupo = new THREE.Group();
  grupo.position.set(x, y, z);
  grupo.rotation.y = giro;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, altura), mat);
  p.position.y = altura / 2;
  grupo.add(p);
  cena.add(grupo);
  if (sprite) sprites.push(grupo);
  if (colide) {
    const lado = colide === true ? w * 0.8 : colide;   // colisor = 80% da largura visível do sprite
    caixa(x - lado / 2, x + lado / 2, z - lado / 2, z + lado / 2);
  }
  return grupo;
}
// objeto posto por coordenadas da imagem
const emImagem = (nome, px, py, extra = {}) => { const p = P(px, py); return objeto(nome, { x: p.x, z: p.z, colide: true, ...extra }); };

// casas: a frente de cada uma, de pé e virada para a câmera (é a única face que aparece de cima)
const CASA_LARG = 5.4 * 302 / 310, CASA_ALT = 5.4;
function casa(nome, { x, z }) {
  const grupo = new THREE.Group();
  grupo.position.set(x, 0, z);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(CASA_LARG, CASA_ALT), new THREE.MeshBasicMaterial({ map: textura(nome) }));
  p.position.y = CASA_ALT / 2;
  grupo.add(p);
  cena.add(grupo);
  sprites.push(grupo);
  caixa(x - CASA_LARG / 2, x + CASA_LARG / 2, z - 0.5, z + 0.5);   // a base da casa bloqueia a passagem
}
casa('casa-taverna', { x: -LARG / 2 + CASA_LARG / 2, z: P(0, 280).z });   // oeste, de frente para a calçada
casa('casa-loja', { x: LARG / 2 - CASA_LARG / 2, z: P(0, 300).z });       // leste, de frente para a calçada

// ---- Fazenda dos Ovos: cerca no campo à direita da estrada sul (imagem: x 700-1260, y 340-740) ----
const F = { x0: P(700, 0).x, x1: P(1260, 0).x, z0: P(0, 340).z, z1: P(0, 740).z };
// postes igualmente espaçados (cerca de 3 unidades), de a até b, incluindo as duas pontas
function pontos(a, b) {
  const n = Math.max(1, Math.round((b - a) / 3));
  return Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
}
const TABUA_ALT = 0.74;
function poste(x, z) { objeto('poste', { x, z, colide: true }); }
function tabuas(x0, z0, x1, z1, plano) {
  // tábuas são peças de pé viradas para a câmera; nas laterais leste/oeste ficam estreitas (vistas de cima)
  const comp = plano === 'x' ? Math.abs(x1 - x0) : 0.5;
  for (const y0 of [0.35, 1.15]) {
    const grupo = new THREE.Group();
    grupo.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(comp, TABUA_ALT), materialBase('tabua', { side: THREE.DoubleSide }));
    p.position.y = TABUA_ALT / 2;
    grupo.add(p);
    cena.add(grupo);
    sprites.push(grupo);
  }
}
const postesNS = pontos(F.x0, F.x1);       // norte e sul
const postesLO = pontos(F.z0, F.z1);       // leste e oeste
for (const x of postesNS) { poste(x, F.z0); poste(x, F.z1); }
for (let i = 0; i < postesNS.length - 1; i++) {
  tabuas(postesNS[i], F.z0, postesNS[i + 1], F.z0, 'x');
  tabuas(postesNS[i], F.z1, postesNS[i + 1], F.z1, 'x');
}
for (const z of postesLO) poste(F.x1, z);
for (let i = 0; i < postesLO.length - 1; i++) tabuas(F.x1, postesLO[i], F.x1, postesLO[i + 1], 'z');
// oeste: o portão fica no meio do segmento central, de frente para a estrada sul
const SEG_PORTAO = Math.floor((postesLO.length - 1) / 2);
const PORTAO_Z = (postesLO[SEG_PORTAO] + postesLO[SEG_PORTAO + 1]) / 2;
for (const z of postesLO) poste(F.x0, z);
for (let i = 0; i < postesLO.length - 1; i++) {
  if (i !== SEG_PORTAO) tabuas(F.x0, postesLO[i], F.x0, postesLO[i + 1], 'z');
}
// portão: folha presa numa dobradiça no lado norte da abertura. Abre (para dentro do campo) quando o personagem
// chega perto e fecha ao se afastar; fechado, a folha bloqueia a passagem. Aberto, a passagem fica livre.
const LARG_PORTAO = largura('portao', ALTURA.portao);   // a folha tem a largura do próprio recorte
const zDobradica = PORTAO_Z - LARG_PORTAO / 2;   // início da folha; o colisor do portão fechado começa aqui
// a folha é uma peça de pé virada para a câmera; some quando o portão está aberto
const portaoPivo = new THREE.Group();
portaoPivo.position.set(F.x0, 0, PORTAO_Z);
cena.add(portaoPivo);
{
  const folha = new THREE.Mesh(new THREE.PlaneGeometry(LARG_PORTAO, ALTURA.portao),
    materialBase('portao', { side: THREE.DoubleSide }));
  folha.position.y = ALTURA.portao / 2;
  portaoPivo.add(folha);
  sprites.push(portaoPivo);
}
const caixaPortao = { min: { x: F.x0 - 0.2, y: 0, z: zDobradica }, max: { x: F.x0 + 0.2, y: 6, z: zDobradica + LARG_PORTAO } };
let portaoAberto = false;
function atualizarPortao(dt) {
  const d = Math.hypot(estado.x - F.x0, estado.z - PORTAO_Z);
  if (!portaoAberto && d < 2.5) portaoAberto = true;
  else if (portaoAberto && d > 3.5) portaoAberto = false;
  portaoPivo.visible = !portaoAberto;
  const existe = caixasAABB.includes(caixaPortao);
  if (!portaoAberto && !existe) caixasAABB.push(caixaPortao);
  if (portaoAberto && existe) caixasAABB.splice(caixasAABB.indexOf(caixaPortao), 1);
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
emImagem('lampada', 110, 240);       // no gramado junto da calçada oeste
emImagem('placa', 520, 300);         // ao norte da estrada oeste
emImagem('banco', 960, 170);         // praça
emImagem('banco', 1120, 230);        // praça
emImagem('vaso', 900, 90);           // praça
emImagem('vaso', 1185, 120);         // praça, junto da borda
emImagem('arbusto', 300, 250);       // gramado norte
emImagem('arbusto', 220, 570);       // gramado sudoeste

// ---- Azazel no traje de vilão: andar em vídeo MP4 e parado nas 4 direções (mesmo do jogo principal) ----
const azazel = criarAzazel('assets/characters/');
const jogador = new THREE.Group();
jogador.add(azazel.malha);
cena.add(jogador);

// ---- entrada: teclado, joystick de toque e arrastar para girar a câmera ----
const teclas = new Set();
const ALVO_ALTURA = ALTURA_PERSONAGEM * 0.8;
const INICIO = P(420, 380);                  // início na estrada oeste
const estado = { x: INICIO.x, z: INICIO.z };
if (VISAO === 'portao') { estado.x = F.x0 - 2; estado.z = PORTAO_Z; }
if (VISAO === 'taverna') { estado.x = -21; estado.z = P(0, 280).z + 3; }
if (VISAO === 'loja') { estado.x = 21; estado.z = P(0, 300).z + 3; }
// câmera de cima, estilo Tibia: ângulo fixo, sem girar; segue o personagem com suavidade
const CAMERA_INCLINACAO = 1.1;               // radianos a partir da horizontal (~63°, quase de cima)
const CAMERA_DISTANCIA = 18;
const cam = { pos: null };
// colisões em caixas (AABB) para o movimento e para a câmera, com a mesma lógica do jogo principal
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
  jogador.position.set(estado.x, 0, estado.z);
  azazel.atualizar(andando, rot, 0);   // câmera fixa: a frente é o norte
  jogador.quaternion.copy(camera.quaternion);   // o personagem só fica de frente para a câmera (nunca fino)

  if (VISAO === 'topo') {
    camera.position.set(0, 120, 0.01);
    camera.lookAt(0, 0, 0);
    camera.fov = 40;
  } else if (VISAO === 'geral') {
    camera.position.set(0, 96, 40);
    camera.lookAt(0, 0, -2);
    camera.fov = 40;
  } else {
    // a câmera segue o personagem com suavidade, sempre do mesmo ângulo; uma parede encurta a distância
    const alvo = { x: estado.x, y: ALVO_ALTURA, z: estado.z };
    const h = CAMERA_DISTANCIA * Math.cos(CAMERA_INCLINACAO), v = CAMERA_DISTANCIA * Math.sin(CAMERA_INCLINACAO);
    const desejada = { x: alvo.x, y: alvo.y + v, z: alvo.z + h };
    const f = 1;   // câmera de cima, à distância fixa: objetos não a aproximam do personagem
    const destino = {
      x: alvo.x + (desejada.x - alvo.x) * f,
      y: alvo.y + (desejada.y - alvo.y) * f,
      z: alvo.z + (desejada.z - alvo.z) * f,
    };
    if (!cam.pos) cam.pos = { ...destino };
    const k2 = 1 - Math.exp(-dt * 14);
    cam.pos.x += (destino.x - cam.pos.x) * k2;
    cam.pos.y += (destino.y - cam.pos.y) * k2;
    cam.pos.z += (destino.z - cam.pos.z) * k2;
    camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    camera.lookAt(alvo.x, alvo.y, alvo.z);
    camera.fov = 55;
  }
  // sprites em pé: cada um gira para a câmera, com a base no chão
  for (const s of sprites) s.quaternion.copy(camera.quaternion);
  jogador.quaternion.copy(camera.quaternion);
  camera.updateProjectionMatrix();
  renderer.render(cena, camera);
  requestAnimationFrame(quadro);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
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
