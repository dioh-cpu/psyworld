// Quarteirão de teste da primeira cidade. O chão é a imagem completa da cidade (1376x768), que já tem as casas, o rio,
// a ponte, as barracas e a fonte pintados. A colisão é uma grade de células de 8 px pintada no editor-colisao.html
// (COLISAO): as células bloqueadas viram retângulos no jogo. Escala: o Azazel tem 3,8 de altura no mundo.
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

// obstáculos pintados na imagem: grade de células de 8 px (172 x 96) desenhada no editor de colisão
// (confusion/web/teste-quarteirao/editor-colisao.html). Cada célula 1 bloqueia. A grade vira retângulos (caixasDaGrade).
const COLISAO = { celula: 8, colunas: 172, linhas: 96, rle: "0,7,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,171,1,161,3,7,1,161,3,7,1,161,3,7,1,161,11,161,11,161,3,169,3,169,3,169,3,169,3,34,1,101,1,32,3,35,1,99,3,32,2,36,1,34,1,14,2,6,3,37,4,32,2,86,1,7,4,37,2,33,2,95,4,37,1,34,1,95,5,71,1,95,6,8,1,61,1,74,1,21,6,6,3,60,1,74,1,22,6,5,4,59,1,98,6,3,5,160,5,1,7,97,1,9,1,12,3,1,1,35,12,95,3,9,18,37,11,91,6,9,17,39,11,90,6,8,17,41,11,89,7,12,13,41,18,81,8,11,14,3,1,37,18,2,1,77,8,11,8,2,9,35,22,77,8,11,7,4,10,31,6,2,16,76,9,11,7,6,12,26,6,4,15,75,10,11,7,10,11,22,6,6,3,2,9,17,1,56,11,11,6,13,10,20,7,13,8,15,3,1,1,53,11,11,6,14,10,19,6,14,9,13,6,52,28,17,10,16,7,16,10,10,5,53,14,13,1,19,9,15,6,20,10,7,4,53,15,34,9,13,6,22,10,5,5,53,15,35,10,5,1,4,7,23,12,1,6,53,15,37,14,4,6,26,17,52,16,42,8,4,6,30,14,52,16,43,7,3,6,32,13,52,16,29,1,14,7,1,7,33,1,2,9,52,15,30,2,1,1,12,13,37,9,53,15,44,13,38,9,54,10,1,4,42,15,37,10,54,8,7,2,37,18,37,10,54,4,12,1,17,1,18,19,37,9,55,2,14,2,34,1,3,15,38,9,71,5,34,15,38,9,72,5,33,15,39,9,72,6,31,15,39,9,72,7,29,17,39,8,73,9,24,20,38,8,73,12,19,24,36,9,73,13,2,1,14,27,22,4,8,8,74,16,7,9,1,1,3,23,19,4,7,8,74,21,1,9,8,2,2,19,18,2,7,10,73,30,13,20,18,3,4,12,64,37,14,22,15,5,1,15,60,39,30,8,13,23,57,40,31,10,12,12,1,11,54,27,10,1,1,1,32,13,8,7,9,11,51,27,46,18,2,5,13,12,50,23,49,24,15,12,9,1,35,19,3,3,51,23,17,12,8,1,27,14,1,12,4,1,52,23,19,9,9,1,25,14,4,9,59,23,19,9,9,1,24,14,6,2,65,24,17,10,9,1,22,12,77,24,16,10,10,1,20,12,79,25,15,9,11,1,19,12,81,5,8,12,13,8,13,1,18,12,84,3,9,13,11,7,32,12,86,2,10,15,8,7,31,11,89,1,11,28,32,9,104,27,31,9,107,24,31,9,110,17,35,9,162,9,161,10,56,1,94" };
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
cena.add(jogador);

// ---- entrada: teclado e joystick de toque ----
const teclas = new Set();
const INICIO = P(284, 432);                  // início num caminho de terra livre, perto da ponte
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
