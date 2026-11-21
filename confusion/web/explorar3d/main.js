// Protótipo de exploração 3D: terceira pessoa com rotação de câmera, colisão com prédios, placa interativa, minimapa
// e controle de toque (joystick virtual, arrastar para a câmera, botões Examinar e Centralizar).
// A ilha vem de mundo.js: quatro regiões em cruz, doze cidades e o mar. Os prédios e o personagem são provisórios
// (caixas e cápsula). O visual de desenho vem do sombreado em degraus e do contorno.
import * as THREE from 'three';
import { resolverMovimento, fracaoLivreCamera } from './colisao.js';
import { vetorJoystick } from './controles.js';
import { CAIXAS, EDIFICIOS, CIDADES_MUNDO, REGIOES, INICIO, SINAL, LIMITE_MAPA, localDe } from './mundo.js';

const RAIO = 0.5;             // raio do personagem no plano do chão
const VELOCIDADE = 4.5;       // unidades por segundo com o controle no máximo
const ALTURA_ALVO = 1.4;      // a câmera mira um pouco acima dos pés
const distanciaCamera = () => (window.innerWidth < 600 ? 13 : 11); // celular em retrato precisa de mais afastamento
const COR_MAR = '#2f7bc4';

// ---- cena ----
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd3ff');
scene.fog = new THREE.Fog('#9fd3ff', 70, 180);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 260);

// sombreado em três tons, o que dá o efeito de desenho animado
const tons = new Uint8Array([95, 175, 255]);
const degraus = new THREE.DataTexture(tons, 3, 1, THREE.RedFormat);
degraus.minFilter = degraus.magFilter = THREE.NearestFilter;
degraus.needsUpdate = true;
const material = (cor) => new THREE.MeshToonMaterial({ color: cor, gradientMap: degraus });

scene.add(new THREE.AmbientLight('#8aa4c8', 0.7));
const sol = new THREE.DirectionalLight('#fff4d6', 2.2);
sol.position.set(8, 14, 6);
scene.add(sol);

// contorno de desenho: uma cópia um pouco maior, pintada de escuro por trás
function contorno(mesh, escala = 1.05) {
  const m = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#0d1420', side: THREE.BackSide }));
  m.scale.setScalar(escala);
  mesh.add(m);
}

// mar em volta da ilha
const mar = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), material(COR_MAR));
mar.rotation.x = -Math.PI / 2;
mar.position.y = -0.3;
scene.add(mar);

// chão de cada região: um retângulo por braço e um para a praça
for (const r of Object.values(REGIOES)) {
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), material(r.cor));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
  scene.add(chao);
}

// prédios das cidades (a prefeitura é mais alta e mais clara, mas usa a mesma forma)
for (const e of EDIFICIOS) {
  const malha = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h, e.d), material(e.cor));
  malha.position.set(e.x, e.h / 2, e.z);
  contorno(malha);
  scene.add(malha);
}

// placa interativa na praça: poste e painel
const placa = new THREE.Group();
placa.position.set(SINAL.x, 0, SINAL.z);
const poste = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), material('#7a5230'));
poste.position.y = 0.8;
const painel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.1), material('#e8d28a'));
painel.position.set(0, 1.5, 0);
contorno(poste);
contorno(painel);
placa.add(poste, painel);
scene.add(placa);

// personagem provisório: cápsula roxa
const jogadorMalha = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 12), material('#a040ff'));
jogadorMalha.position.y = 0.85;
contorno(jogadorMalha);
const jogador = new THREE.Group();
jogador.add(jogadorMalha);
scene.add(jogador);

// ---- estado ----
const estado = {
  pos: { x: INICIO.x, z: INICIO.z },
  rot: 0,          // direção para onde o personagem olha
  bob: 0,
  yaw: 0,          // ângulo da câmera em volta do personagem
  pitch: 0.5,      // inclinação da câmera
  cam: new THREE.Vector3(0, 4, 9),
  recentralizar: false,
  arrastando: null,
  mensagemAte: 0,
  joy: { x: 0, z: 0 },   // vetor do joystick virtual
  local: null,           // { regiao, cidade } onde o personagem está agora
};
const teclas = new Set();
const toque = window.matchMedia('(pointer: coarse)').matches;

// ---- entrada pelo teclado ----
window.addEventListener('keydown', (e) => {
  teclas.add(e.code);
  if (e.code === 'KeyC' || e.code === 'KeyR') estado.recentralizar = true;
  if (e.code === 'KeyE' && perto()) examinar();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));

// ---- entrada pelo mouse e pelo dedo: arrastar na tela gira a câmera ----
canvas.addEventListener('pointerdown', (e) => { estado.arrastando = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!estado.arrastando) return;
  estado.yaw -= (e.clientX - estado.arrastando.x) * 0.006;
  estado.pitch = Math.max(0.15, Math.min(1.25, estado.pitch + (e.clientY - estado.arrastando.y) * 0.004));
  estado.arrastando = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', () => { estado.arrastando = null; });
canvas.addEventListener('pointercancel', () => { estado.arrastando = null; });

// ---- joystick virtual (canto inferior esquerdo) ----
const joy = document.getElementById('joy');
const knob = document.getElementById('joy-knob');
let joyDedo = null;
function joyAtualizar(e) {
  const r = joy.getBoundingClientRect();
  const v = vetorJoystick(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width / 2);
  estado.joy = v;
  knob.style.transform = `translate(${v.x * r.width / 2}px, ${-v.z * r.width / 2}px)`;
}
function joyFim(e) {
  if (e.pointerId !== joyDedo) return;
  joyDedo = null;
  estado.joy = { x: 0, z: 0 };
  knob.style.transform = '';
}
joy.addEventListener('pointerdown', (e) => { joyDedo = e.pointerId; joy.setPointerCapture(e.pointerId); joyAtualizar(e); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyDedo) joyAtualizar(e); });
joy.addEventListener('pointerup', joyFim);
joy.addEventListener('pointercancel', joyFim);

// ---- botões de toque ----
const btnExaminar = document.getElementById('btn-examinar');
const btnCentro = document.getElementById('btn-centro');
btnExaminar.addEventListener('click', () => { if (perto()) examinar(); });
btnCentro.addEventListener('click', () => { estado.recentralizar = true; });

const pressionada = (...codigos) => codigos.some((c) => teclas.has(c));
const diferencaAngulo = (de, para) => Math.atan2(Math.sin(para - de), Math.cos(para - de));

// ---- placa ----
function perto() {
  return Math.hypot(estado.pos.x - SINAL.x, estado.pos.z - SINAL.z) < 2.2;
}
function examinar() {
  const msg = document.getElementById('msg');
  msg.textContent = 'Placa de madeira: Norte, Leste, Sul e Oeste (texto provisório).';
  msg.style.display = 'block';
  estado.mensagemAte = performance.now() + 3200;
}

// ---- localização na tela ----
const elLocal = document.getElementById('local');
let textoLocal = '';
function atualizarLocal() {
  const onde = localDe(estado.pos.x, estado.pos.z);
  estado.local = onde;
  const texto = !onde ? 'Mar'
    : onde.cidade ? `${onde.regiao} · ${onde.cidade}`
    : onde.regiao === 'Centro' ? 'Praça central' : onde.regiao;
  if (texto !== textoLocal) { textoLocal = texto; elLocal.textContent = texto; }
}

// ---- atualização ----
function atualizar(dt) {
  // câmera pelas teclas I J K L (equivale ao analógico direito)
  if (pressionada('KeyJ')) estado.yaw -= 2.2 * dt;
  if (pressionada('KeyL')) estado.yaw += 2.2 * dt;
  if (pressionada('KeyI')) estado.pitch = Math.min(1.25, estado.pitch + 1.2 * dt);
  if (pressionada('KeyK')) estado.pitch = Math.max(0.15, estado.pitch - 1.2 * dt);

  // centralizar: a câmera volta para trás do personagem
  if (estado.recentralizar) {
    const alvoYaw = estado.rot + Math.PI;
    estado.yaw += diferencaAngulo(estado.yaw, alvoYaw) * Math.min(1, dt * 6);
    if (Math.abs(diferencaAngulo(estado.yaw, alvoYaw)) < 0.01) estado.recentralizar = false;
  }

  // movimento relativo à câmera: teclado ou joystick
  let ix = estado.joy.x;
  let iz = estado.joy.z;
  if (pressionada('KeyW', 'ArrowUp')) iz += 1;
  if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
  if (pressionada('KeyD', 'ArrowRight')) ix += 1;
  if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
  const forca = Math.min(1, Math.hypot(ix, iz));
  const frente = { x: -Math.sin(estado.yaw), z: -Math.cos(estado.yaw) };
  const direita = { x: Math.cos(estado.yaw), z: -Math.sin(estado.yaw) };
  let dx = frente.x * iz + direita.x * ix;
  let dz = frente.z * iz + direita.z * ix;
  const norma = Math.hypot(dx, dz);
  if (norma > 0 && forca > 0) {
    dx = (dx / norma) * forca;
    dz = (dz / norma) * forca;
    const antes = { ...estado.pos };
    estado.pos = resolverMovimento(estado.pos, dx * VELOCIDADE * dt, dz * VELOCIDADE * dt, RAIO, CAIXAS);
    const andou = Math.hypot(estado.pos.x - antes.x, estado.pos.z - antes.z) > 1e-4;
    estado.rot += diferencaAngulo(estado.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    if (andou) estado.bob += dt * 12;
  }
  jogador.position.set(estado.pos.x, Math.abs(Math.sin(estado.bob)) * 0.08, estado.pos.z);
  jogador.rotation.y = estado.rot;

  // câmera: posição desejada, encurtada se houver parede no caminho, e suavizada
  const alvo = new THREE.Vector3(estado.pos.x, ALTURA_ALVO, estado.pos.z);
  const d = distanciaCamera();
  const horiz = d * Math.cos(estado.pitch);
  const vert = d * Math.sin(estado.pitch);
  const desejada = new THREE.Vector3(
    alvo.x + Math.sin(estado.yaw) * horiz,
    alvo.y + vert,
    alvo.z + Math.cos(estado.yaw) * horiz,
  );
  const f = fracaoLivreCamera(alvo, desejada, CAIXAS);
  const destino = alvo.clone().add(desejada.clone().sub(alvo).multiplyScalar(f));
  estado.cam.lerp(destino, Math.min(1, dt * 12));
  camera.position.copy(estado.cam);
  camera.lookAt(alvo.x, alvo.y + 0.2, alvo.z);

  // placa: aviso e botão Examinar aparecem quando o personagem chega perto
  const pertoAgora = perto();
  document.getElementById('prompt').style.display = pertoAgora ? 'block' : 'none';
  btnExaminar.hidden = !pertoAgora;
  btnCentro.hidden = false;
  const msg = document.getElementById('msg');
  if (msg.style.display === 'block' && performance.now() > estado.mensagemAte) msg.style.display = 'none';

  atualizarLocal();
}

// ---- minimapa: mar, quatro regiões, cidades, placa e personagem ----
const mini = document.getElementById('mini');
const g = mini.getContext('2d');
const escalaMini = mini.width / (LIMITE_MAPA * 2);
const mundoParaMini = (x, z) => [(x + LIMITE_MAPA) * escalaMini, (z + LIMITE_MAPA) * escalaMini];
function desenharMinimapa() {
  g.fillStyle = COR_MAR;
  g.fillRect(0, 0, mini.width, mini.height);
  for (const r of Object.values(REGIOES)) {
    const [x, y] = mundoParaMini(r.x0, r.z0);
    g.fillStyle = r.cor;
    g.fillRect(x, y, (r.x1 - r.x0) * escalaMini, (r.z1 - r.z0) * escalaMini);
  }
  const cidadeAtual = estado.local && estado.local.cidade;
  for (const c of CIDADES_MUNDO) {
    const [x, y] = mundoParaMini(c.x, c.z);
    const atual = c.nome === cidadeAtual;
    g.beginPath();
    g.arc(x, y, atual ? 9 : 6, 0, Math.PI * 2);
    g.fillStyle = atual ? '#ffd27a' : '#fff8e7';
    g.strokeStyle = '#17324f';
    g.lineWidth = 2;
    g.fill();
    g.stroke();
  }
  const [sx, sy] = mundoParaMini(SINAL.x, SINAL.z);
  g.fillStyle = '#ffd27a';
  g.beginPath(); g.arc(sx, sy, 5, 0, Math.PI * 2); g.fill();
  const [px, py] = mundoParaMini(estado.pos.x, estado.pos.z);
  // seta do personagem na direção que ele olha
  g.save();
  g.translate(px, py);
  g.rotate(Math.PI - estado.rot); // a seta de cima vira a direção (sen rot, cos rot) no mapa
  g.fillStyle = '#a040ff';
  g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 8); g.lineTo(-8, 8); g.closePath(); g.fill();
  g.restore();
}

// ---- textos conforme o dispositivo ----
if (toque) {
  document.getElementById('dicas').textContent = 'Joystick: mover · arraste na tela: câmera · Centralizar: volta a câmera';
  document.getElementById('prompt').textContent = 'Toque em Examinar';
} else {
  document.getElementById('dicas').textContent = 'WASD ou setas: mover · I J K L ou arrastar: câmera · C: centralizar · E: examinar';
}

// ---- laço principal ----
let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  atualizar(dt);
  renderer.render(scene, camera);
  desenharMinimapa();
  requestAnimationFrame(quadro);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

// para testes automáticos: lê a posição do personagem, da câmera e da localização
window.explorar3d = {
  jogador: () => ({ x: estado.pos.x, z: estado.pos.z, rot: estado.rot }),
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: estado.yaw, pitch: estado.pitch }),
  local: () => estado.local,
  teleportar: (x, z) => { estado.pos = { x, z }; },
};

estado.cam.copy(new THREE.Vector3(estado.pos.x, ALTURA_ALVO + 3, estado.pos.z + distanciaCamera()));
requestAnimationFrame(quadro);
