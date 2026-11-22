// Quarteirão de teste: uma rua que faz curva até uma pequena praça, fachadas voltadas para a calçada e a Fazenda dos Ovos
// num canto. Mapa separado das áreas jogáveis. Escala: o Azazel tem 2,55 unidades de altura, como no jogo.
// Chão: grama e pedra espelhadas (única emenda exata com estas peças); estradas com as peças da 1000354504, giradas
// para encaixar pelo meio de cada lado. Objetos fixos: planos cruzados (não giram com a câmera). Fachadas: volumes.
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento, fracaoLivreCamera } from '../explorar3d/colisao.js';

const A = 'assets/';
const S = 9;                                   // lado de uma célula, em unidades do mundo
const ALTURA_PERSONAGEM = 2.55;                // igual ao jogo
const ESCALA_AZAZEL = ALTURA_PERSONAGEM / 480; // a figura do Azazel tem 480 px de altura na folha
const RAIO = 0.45;                             // raio do personagem para a colisão
const VELOCIDADE = 5.2;

const cx = (c) => (c - 2) * S;                 // centro da coluna c (c = 0..5)
const cz = (r) => (r - 2) * S;                 // centro da linha r (r = 0..5); norte é -z

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
const materialMadeira = new THREE.MeshBasicMaterial({ color: '#7a5230' });

// ---- chão ----
// Uma célula de chão. O topo da imagem fica no norte; (espelhoX, espelhoY) espelham a arte para emendar.
function chao(c, r, nome, { espelhoX = false, espelhoY = false, giro = 0, sobre = false } = {}) {
  const g = new THREE.PlaneGeometry(S, S);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i);
    let v = uv.getY(i);
    if (espelhoX) u = 1 - u;
    if (espelhoY) v = 1 - v;
    uv.setXY(i, u, v);
  }
  // 'sobre': peça com alfa (estrada). A grama ao redor vem da peça de grama que fica por baixo.
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: textura(nome), transparent: sobre, depthWrite: !sobre }));
  m.position.set(cx(c), sobre ? 0.01 : 0, cz(r));
  m.rotation.y = giro * Math.PI / 2;   // quartos de volta: S→E→N→W
  cena.add(m);
}

// base verde por baixo de tudo: nas emendas entre células não aparece o céu
{
  const base = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ color: '#5a8f42' }));
  base.rotation.x = -Math.PI / 2;
  base.position.set(4.5, -0.03, 4.5);
  cena.add(base);
}

// Tipo de cada célula. Estradas por célula: peça e quartos de volta (sentido horário visto de cima).
const ESTRADAS = {
  '0,2': ['rua-h', 0],        // entrada oeste, reta leste-oeste
  '1,2': ['rua-t', 0],        // cruzamento de quatro lados
  '2,2': ['rua-fim', 3],      // ponta da estrada que sai do cruzamento para leste
  '1,1': ['rua-v', 0],        // reta norte-sul
  '1,0': ['rua-curva', 0],    // curva sul→leste
  '2,0': ['rua-h', 0],        // reta leste, até a praça
  '1,3': ['rua-v', 0],        // ramal para a fazenda
  '1,4': ['rua-curva', 1],    // curva norte→leste
  '2,4': ['rua-h', 0],        // última reta até o portão
};
const PRACA = [[3, 0], [4, 0], [3, 1], [4, 1]];
const CALCADA = [[0, 0], [0, 1], [5, 0], [5, 1]];
const FAZENDA = [[3, 3], [4, 3], [3, 4], [4, 4], [3, 5], [4, 5]];
const emCelulas = (lista, c, r) => lista.some(([a, b]) => a === c && b === r);

for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 6; c++) {
    const mirror = { espelhoX: c % 2 === 1, espelhoY: r % 2 === 1 };   // espelho absoluto: as emendas são exatas
    const chave = `${c},${r}`;
    if (ESTRADAS[chave]) {
      const [nome, giro] = ESTRADAS[chave];
      chao(c, r, 'grama', mirror);                     // grama por baixo: a estrada só cobre o caminho
      chao(c, r, nome, { giro, sobre: true });
    } else if (emCelulas(PRACA, c, r)) {
      chao(c, r, 'praca', mirror);
    } else if (emCelulas(CALCADA, c, r)) {
      chao(c, r, 'calcada', mirror);
    } else if (emCelulas(FAZENDA, c, r)) {
      chao(c, r, 'grama-fazenda', mirror);
    } else {
      chao(c, r, 'grama', mirror);
    }
  }
}

// ---- colisões (retângulos no chão) ----
const colisoes = [];
const caixa = (x0, x1, z0, z1) => colisoes.push({ x0, x1, z0, z1 });

// ---- fachadas: volume com a arte da frente voltada para a calçada ----
// a parede tem 5,4 de altura (2,1 vezes o personagem); a arte tem 906 x 310 px por três peças lado a lado
const FACHADA_ALTURA = 5.4;
function fachada(nome, { x, z, comprimento, lado }) {
  const prof = 1.0;
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(prof, FACHADA_ALTURA, comprimento), materialMadeira);
  // lado = +1: a frente olha para leste (+x); lado = -1: olha para oeste (-x)
  corpo.position.set(x - lado * prof / 2, FACHADA_ALTURA / 2, z);
  cena.add(corpo);
  const arte = new THREE.Mesh(new THREE.PlaneGeometry(comprimento, FACHADA_ALTURA),
    new THREE.MeshBasicMaterial({ map: textura(nome) }));
  arte.position.set(x + lado * 0.02, FACHADA_ALTURA / 2, z);
  arte.rotation.y = lado > 0 ? Math.PI / 2 : -Math.PI / 2;
  cena.add(arte);
  // o volume fica do lado oposto à frente: taverna (lado +1) à esquerda de x, loja (lado -1) à direita de x
  const x0 = lado > 0 ? x - prof : x;
  const x1 = lado > 0 ? x : x + prof;
  caixa(x0, x1, z - comprimento / 2, z + comprimento / 2);
}
// taverna: borda oeste da coluna 0, de frente para a calçada (leste); a estrada fica do outro lado da calçada
fachada('fachada-taverna', { x: cx(0) - S / 2, z: (cz(0) + cz(1)) / 2, comprimento: 5.4 * 906 / 310, lado: 1 });
// loja: borda leste da coluna 5, de frente para a calçada (oeste)
fachada('fachada-loja', { x: cx(5) + S / 2, z: (cz(0) + cz(1)) / 2, comprimento: 5.4 * 906 / 310, lado: -1 });

// ---- objetos fixos: planos cruzados (não giram com a câmera) ----
function objeto(nome, { x, z, y = 0, altura = ALTURA[nome], cruzado = true, colide = null, giro = 0, doisLados = false }) {
  const w = largura(nome, altura);
  const mat = materialBase(nome, doisLados ? { side: THREE.DoubleSide } : {});
  const grupo = new THREE.Group();
  grupo.position.set(x, y, z);
  grupo.rotation.y = giro;
  const planos = cruzado ? [0, Math.PI / 2] : [0];
  for (const g of planos) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, altura), mat);
    p.position.y = altura / 2;
    p.rotation.y = g;
    grupo.add(p);
  }
  cena.add(grupo);
  if (colide) {
    const lado = colide === true ? w * 0.8 : colide;   // colisor = 80% da largura visível do sprite
    caixa(x - lado / 2, x + lado / 2, z - lado / 2, z + lado / 2);
  }
  return grupo;
}

// ---- cercas da fazenda: postes cruzados, tábuas planas (um lado já é suficiente visto de dentro e de fora) ----
const FX0 = cx(3) - S / 2, FX1 = cx(4) + S / 2;        // x: 4,5 .. 22,5
const FZ0 = cz(3) - S / 2, FZ1 = cz(5) + S / 2;        // z: 4,5 .. 31,5
const PORTAO_Z = (FZ0 + FZ1) / 2;                      // portão no meio do lado oeste
const TABUA_ALT = 0.74;
const ALTURA_POSTE = ALTURA.poste;

function poste(x, z) { objeto('poste', { x, z, colide: true }); }
function tabuas(x0, z0, x1, z1, plano) {
  // plano = 'x' (tábuas ao longo de x, no fundo da cerca norte/sul) ou 'z' (ao longo de z, cerca leste/oeste)
  const comp = plano === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  for (const y0 of [0.35, 1.15]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(comp, TABUA_ALT), materialBase('tabua', { side: THREE.DoubleSide }));
    p.position.set((x0 + x1) / 2, y0 + TABUA_ALT / 2, (z0 + z1) / 2);
    if (plano === 'z') p.rotation.y = Math.PI / 2;
    cena.add(p);
  }
}
// norte (z = FZ0) e sul (z = FZ1): postes a cada 3 unidades
for (let x = FX0; x <= FX1 + 1e-6; x += 3) { poste(x, FZ0); poste(x, FZ1); }
for (let x = FX0; x < FX1; x += 3) { tabuas(x, FZ0, x + 3, FZ0, 'x'); tabuas(x, FZ1, x + 3, FZ1, 'x'); }
// leste (x = FX1): postes e tábuas inteiras
for (let z = FZ0; z <= FZ1 + 1e-6; z += 3) poste(FX1, z);
for (let z = FZ0; z < FZ1; z += 3) tabuas(FX1, z, FX1, z + 3, 'z');
// oeste (x = FX0): postes e tábuas, com o portão entre os dois postes do meio
const LARG_PORTAO = largura('portao', ALTURA.portao);  // a abertura tem a largura do próprio portão
const ABERTURA = [PORTAO_Z - LARG_PORTAO / 2, PORTAO_Z + LARG_PORTAO / 2];
const postesOeste = [];
for (let z = FZ0; z <= FZ1 + 1e-6; z += 3) postesOeste.push(z);
for (const z of postesOeste) poste(FX0, z);
for (let i = 0; i < postesOeste.length - 1; i++) {
  const za = postesOeste[i], zb = postesOeste[i + 1];
  if (zb <= ABERTURA[0] + 1e-6 || za >= ABERTURA[1] - 1e-6) tabuas(FX0, za, FX0, zb, 'z');
}
// portão (plano leste-oeste, dos dois lados)
objeto('portao', { x: FX0, z: PORTAO_Z, altura: ALTURA.portao, cruzado: false, giro: Math.PI / 2, doisLados: true });
// colisões: os lados da cerca; a abertura do portão fica livre
caixa(FX0 - 0.2, FX1 + 0.2, FZ0 - 0.2, FZ0 + 0.2);      // norte
caixa(FX0 - 0.2, FX1 + 0.2, FZ1 - 0.2, FZ1 + 0.2);      // sul
caixa(FX1 - 0.2, FX1 + 0.2, FZ0, FZ1);                  // leste
caixa(FX0 - 0.2, FX0 + 0.2, FZ0, ABERTURA[0]);          // oeste, parte norte
caixa(FX0 - 0.2, FX0 + 0.2, ABERTURA[1], FZ1);          // oeste, parte sul

// ---- objetos da fazenda ----
const NINHOS = [[8.5, 10], [14.5, 10], [8.5, 22], [14.5, 22]];
NINHOS.forEach(([x, z]) => objeto('ninho', { x, z, altura: ALTURA.ninho }));
const ovos = NINHOS.map(([x, z]) => {
  const g = objeto('ovo', { x, z, y: 0.3, altura: ALTURA.ovo });
  g.visible = false;
  return g;
});
objeto('mesa', { x: 19.5, z: 27.5, colide: 2.0 });
objeto('cocho', { x: 19.8, z: 7.5, colide: 1.4 });

// ---- rua da cidade: objetos de calçada e praça ----
objeto('lampada', { x: cx(0) + 2.5, z: cz(1) + 2, colide: true });   // na calçada, junto da estrada
objeto('placa', { x: cx(2) - 2.5, z: cz(1) + 1, colide: true });
objeto('banco', { x: cx(3) + 0.5, z: cz(1) + 2.5, altura: ALTURA.banco, colide: true });
objeto('banco', { x: cx(4) - 2.5, z: cz(1) + 2.5, altura: ALTURA.banco, colide: true });
objeto('vaso', { x: cx(3) - 3, z: cz(0) - 2, colide: true });
objeto('vaso', { x: cx(4) + 3, z: cz(0) - 2, colide: true });
objeto('arbusto', { x: cx(2) - 1, z: cz(4) + 3.5, colide: true });
objeto('arbusto', { x: cx(5) - 1, z: cz(4) + 1.5, colide: true });

// ---- Azazel (sprite de frente da folha de repouso do traje de vilão; acompanha a câmera só na horizontal) ----
const AZAZEL_LADO = 512 * ESCALA_AZAZEL;
const azazelMat = new THREE.MeshBasicMaterial({ map: textura('azazel-frente'), transparent: true, alphaTest: 0.4 });
const azazel = new THREE.Mesh(new THREE.PlaneGeometry(AZAZEL_LADO, AZAZEL_LADO), azazelMat);
// os pés ficam no chão: a figura começa 11 px acima da borda de baixo da célula da folha
azazel.position.y = AZAZEL_LADO / 2 - 11 * ESCALA_AZAZEL;
const jogador = new THREE.Group();
jogador.add(azazel);
cena.add(jogador);

// ---- entrada: teclado, joystick de toque e arrastar para girar a câmera ----
const teclas = new Set();
const ALVO_ALTURA = ALTURA_PERSONAGEM * 0.8;
const estado = { x: cx(1), z: cz(2), yaw: 0, pitch: 0.5 };
if (VISAO === 'portao') { estado.x = 0; estado.z = cz(4); estado.yaw = -Math.PI / 2; }
if (VISAO === 'taverna') { estado.x = -19; estado.z = (cz(0) + cz(1)) / 2; estado.yaw = Math.PI / 2; }
if (VISAO === 'loja') { estado.x = 28; estado.z = (cz(0) + cz(1)) / 2; estado.yaw = -Math.PI / 2; }
// câmera suavizada: o ângulo e a posição seguem com amortecimento
const cam = { yaw: estado.yaw, pitch: estado.pitch, pos: null };
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

// arrastar na tela para girar a câmera (igual ao jogo principal)
let arrastando = null;
canvas.addEventListener('pointerdown', (e) => {
  arrastando = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!arrastando || e.pointerId !== arrastando.id) return;
  estado.yaw -= (e.clientX - arrastando.x) * 0.006;
  estado.pitch = Math.max(0.15, Math.min(1.25, estado.pitch + (e.clientY - arrastando.y) * 0.004));
  arrastando.x = e.clientX;
  arrastando.y = e.clientY;
});
const soltarArraste = () => { arrastando = null; };
canvas.addEventListener('pointerup', soltarArraste);
canvas.addEventListener('pointercancel', soltarArraste);

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

const diferencaAngulo = (a, b) => ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;

  if (VISAO === 'jogo') {
    if (pressionada('KeyJ')) estado.yaw -= 2.2 * dt;
    if (pressionada('KeyL')) estado.yaw += 2.2 * dt;
    if (pressionada('KeyI')) estado.pitch = Math.min(1.25, estado.pitch + 1.2 * dt);
    if (pressionada('KeyK')) estado.pitch = Math.max(0.15, estado.pitch - 1.2 * dt);
    let ix = joy.x, iz = joy.z;
    if (pressionada('KeyW', 'ArrowUp')) iz += 1;
    if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
    if (pressionada('KeyD', 'ArrowRight')) ix += 1;
    if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
    const forca = Math.min(1, Math.hypot(ix, iz));
    const frente = { x: -Math.sin(estado.yaw), z: -Math.cos(estado.yaw) };
    const direita = { x: Math.cos(estado.yaw), z: -Math.sin(estado.yaw) };
    let dx = frente.x * iz + direita.x * ix;
    let dz = frente.z * iz + direita.z * ix;
    const n = Math.hypot(dx, dz);
    if (n > 1e-6 && forca > 0) {
      dx = (dx / n) * forca * VELOCIDADE * dt;
      dz = (dz / n) * forca * VELOCIDADE * dt;
      const p = resolverMovimento({ x: estado.x, z: estado.z }, dx, dz, RAIO, caixasAABB);
      estado.x = p.x;
      estado.z = p.z;
    }
  }

  jogador.position.set(estado.x, 0, estado.z);
  jogador.quaternion.copy(camera.quaternion);   // o personagem só fica de frente para a câmera (nunca fino)

  if (VISAO === 'topo') {
    camera.position.set(4.5, 120, 4.6);
    camera.lookAt(4.5, 0, 4.5);
    camera.fov = 40;
  } else if (VISAO === 'geral') {
    camera.position.set(0, 96, 52);
    camera.lookAt(0, 0, -2);
    camera.fov = 40;
  } else {
    // ângulos seguem o alvo com amortecimento; a posição da câmera também, e uma parede encurta a distância
    const k = 1 - Math.exp(-dt * 10);
    cam.yaw += diferencaAngulo(cam.yaw, estado.yaw) * k;
    cam.pitch += (estado.pitch - cam.pitch) * k;
    const alvo = { x: estado.x, y: ALVO_ALTURA, z: estado.z };
    const d = window.innerWidth < 600 ? 13 : 11;   // mesma distância do jogo
    const h = d * Math.cos(cam.pitch), v = d * Math.sin(cam.pitch);
    const desejada = { x: alvo.x + Math.sin(cam.yaw) * h, y: alvo.y + v, z: alvo.z + Math.cos(cam.yaw) * h };
    const f = fracaoLivreCamera(alvo, desejada, caixasAABB);
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
  camera.updateProjectionMatrix();
  renderer.render(cena, camera);
  requestAnimationFrame(quadro);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});
// para os testes: posição do personagem e estado dos ovos
window.quarteirao = {
  estado: () => ({ x: estado.x, z: estado.z, yaw: estado.yaw, pitch: estado.pitch }),
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
  ovos: () => ovos.map((o) => o.visible),
  colisoes: () => colisoes.length,
  caixas: () => caixasAABB,
  mover: (x, z, yaw) => { estado.x = x; estado.z = z; if (yaw !== undefined) estado.yaw = yaw; },
};
requestAnimationFrame(quadro);
