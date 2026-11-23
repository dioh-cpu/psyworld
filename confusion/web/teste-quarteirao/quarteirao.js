// Quarteirão de teste da cidade na montanha. O chão é a arte limpa (piso-montanha, 1200x896), com as construções
// já pintadas. A colisão vem do desenho em verde (o que pode andar): uma grade de células de 8 px (COLISAO),
// convertida em retângulos. O corpo do personagem tem raio 0,15 para caber nas passagens verdes.
// A câmera fica num ângulo fixo (INCLINACAO), como nas capturas de referência.
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { resolverMovimento } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';

const A = 'assets/';
const IMG_W = 1200, IMG_H = 896;                 // tamanho do piso (16:9)
const LARG = 54;                                 // largura do piso no mundo
const ALT = LARG * IMG_H / IMG_W;                // altura do piso no mundo
const ALTURA_PERSONAGEM = 3.8;                   // altura do Azazel no mundo, em proporção ao mapa
const RAIO = 0.15;                                // raio do corpo para a colisão: cabe nas passagens verdes do desenho
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
    new THREE.MeshBasicMaterial({ map: textura('piso-montanha') }));
  cena.add(piso);
}

// ---- colisões (retângulos no chão) ----
const colisoes = [];
const caixa = (x0, x1, z0, z1) => colisoes.push({ x0, x1, z0, z1 });

// limites da imagem: fora dela não se anda (muro invisível)
caixa(-30, 30, -ALT / 2 - 2, -ALT / 2);            // norte
// saída da cidade: um corredor na borda de baixo da imagem, ao lado da casa com chaminé de pedra
const SAIDA = { x0: P(120, 0).x, x1: P(190, 0).x };
caixa(-30, SAIDA.x0, ALT / 2, ALT / 2 + 2);   // sul, à esquerda da saída
caixa(SAIDA.x1, 30, ALT / 2, ALT / 2 + 2);    // sul, à direita da saída
caixa(-30, -LARG / 2, -ALT / 2 - 2, ALT / 2 + 2);  // oeste
caixa(LARG / 2, 30, -ALT / 2 - 2, ALT / 2 + 2);    // leste

// obstáculos pintados na imagem: grade de células de 8 px (172 x 96) desenhada no editor de colisão
// (confusion/web/teste-quarteirao/editor-colisao.html). Cada célula 1 bloqueia. A grade vira retângulos (caixasDaGrade).
const COLISAO = { celula: 8, colunas: 150, linhas: 112, rle: "0,3342,4,143,6,145,5,147,4,147,3,45,4,99,3,40,9,2,1,95,4,21,3,7,17,10,2,15,2,5,1,64,4,22,12,1,5,1,6,8,4,2,1,10,5,69,4,42,16,12,6,71,4,40,4,6,8,8,8,73,4,39,3,10,18,77,4,37,2,15,14,78,4,36,3,18,9,80,3,36,3,23,5,6,1,72,4,35,4,25,2,6,3,70,4,35,4,33,6,68,4,34,4,33,9,65,4,5,4,25,5,37,8,62,4,1,7,26,4,40,9,59,14,23,3,45,5,61,13,22,3,48,2,71,5,1,1,18,4,123,4,18,5,125,6,13,5,128,5,10,6,130,8,2,8,130,18,130,18,133,15,135,14,136,4,1,9,134,5,8,4,125,13,8,5,124,12,9,8,121,11,11,9,118,2,3,5,15,13,110,3,5,2,18,11,108,5,26,10,106,6,28,9,104,7,30,8,103,5,35,6,101,6,36,7,99,5,38,9,95,6,39,11,92,4,42,5,3,4,89,6,42,5,5,4,86,6,43,6,5,4,83,9,42,7,6,4,81,10,41,5,96,7,41,5,98,7,38,6,100,6,35,6,104,6,32,5,109,5,28,5,113,4,26,5,52,2,61,5,23,6,53,2,61,5,20,6,55,2,62,6,18,5,56,2,64,5,16,6,55,4,65,5,12,8,55,4,66,6,9,7,58,4,67,6,5,8,60,4,8,2,58,7,2,7,63,4,6,4,58,13,68,3,3,4,60,10,70,10,48,2,10,9,72,8,24,2,22,4,8,9,75,7,22,3,21,6,6,9,79,6,20,2,23,5,4,8,85,6,16,3,23,16,88,22,25,13,93,19,26,10,101,11,28,7,140,9,140,8,141,7,139,2,3,4,139,3,4,2,137,7,141,9,139,6,144,4,146,3,1197" };
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
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  cena.add(m);
  return m;
})();

// ---- entrada: teclado e joystick de toque ----
const teclas = new Set();
const INICIO = P(500, 400);                  // início na praça central
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
  sombra.position.set(estado.x, camada(estado.z) - 0.005, estado.z);
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
