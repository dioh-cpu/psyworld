// Praia de teste (primeira localidade). O chão é a cena completa (praia-cena); a colisão vem da máscara pintada no editor
// (praia-walkmask: branco anda). Mapa simples: sem camada de objetos, porque o personagem não passa atrás de nada.
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
const ALTURA_CAMERA = Number(params.get('altura')) || 19.2;   // 30% mais perto que 25
const SEN = Math.sin(THREE.MathUtils.degToRad(INCLINACAO));
const COS = Math.cos(THREE.MathUtils.degToRad(INCLINACAO));
const ALTURA_EM_PE = Number(params.get('alturape')) || 21;   // tela em pé: unidades de altura visíveis (antes mostrava o mapa todo)
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
const COLISAO = { celula: 8, colunas: 344, linhas: 192, rle: "0,164,22,316,28,314,30,313,32,311,34,309,35,308,36,307,38,305,41,302,43,300,44,278,68,275,70,276,70,275,72,254,2,17,74,244,9,18,77,229,18,22,79,212,30,24,84,203,34,24,96,189,36,24,126,157,37,24,132,150,39,23,136,146,39,23,139,140,1,2,39,23,143,135,43,23,145,100,3,29,43,24,146,99,4,28,43,23,148,97,5,26,44,24,148,96,7,24,46,22,150,94,9,24,45,22,150,88,3,2,14,21,44,22,151,85,20,25,42,22,151,82,15,2,5,27,1,2,37,19,155,80,16,3,1,32,39,14,160,78,13,40,39,10,165,76,11,42,43,5,169,73,6,48,45,1,172,71,7,48,221,68,7,44,2,2,222,29,3,2,6,8,1,18,6,45,227,28,12,6,2,17,7,45,228,27,20,17,7,45,3,1,225,26,20,16,9,45,230,10,3,10,21,16,10,43,233,5,7,8,22,15,10,44,247,4,24,16,10,43,275,16,10,41,277,17,10,34,283,19,8,31,286,20,8,21,1,1,293,20,12,8,3,1,300,21,14,2,307,21,323,20,324,13,331,12,332,11,333,4,8596,2,342,3,341,4,340,4,340,3,341,3,341,2,342,2,342,2,342,1,343,1,343,1,343,1,1433,2,339,6,335,9,327,4,1,13,324,21,322,23,320,24,318,27,316,29,313,32,311,33,310,34,308,35,307,36,307,36,309,33,311,32,312,31,314,28,315,28,316,26,317,26,317,26,320,22,323,16,264,3,62,12,265,7,60,11,266,8,328,5,3,14,320,25,316,28,314,30,312,32,312,35,309,36,308,36,308,37,307,37,307,36,309,35,311,33,18,3,290,33,18,5,288,33,17,6,288,32,18,7,155,1,1,2,128,31,19,7,153,6,16,1,112,26,23,8,152,6,15,3,114,19,27,10,150,6,15,3,114,9,36,14,147,6,15,3,115,5,38,16,146,6,14,4,156,21,5,4,134,6,14,4,154,23,5,5,95,5,33,6,15,4,33,2,117,26,3,6,94,8,30,6,15,4,30,6,114,30,2,5,52,3,37,13,13,9,5,6,14,5,27,9,112,33,3,4,50,16,25,45,15,5,16,5,4,11,6,2,103,34,10,3,42,18,26,44,15,6,15,5,3,10,6,7,2,5,90,39,8,4,38,21,28,42,14,8,13,6,2,7,8,17,65,1,21,46,4,3,37,29,19,45,13,10,9,16,5,22,63,3,17,51,2,4,35,32,16,46,14,10,1,51,62,4,11,62,34,95,14,67,25,4,28,77,33,95,17,69,13,13,3,3,22,78,31,95,16,72,7,31,14,100,7,97,16,110,8,210,16,113,2,213,15,329,15,329,15,329,15,329,15,328,17,327,16,328,16,328,17,327,17,327,17,328,16,328,15,334,9,335,9,5325" };
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
const INICIO = P(1376, 960);                 // início na areia, perto do píer
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
// edição salva neste aparelho (pelo editor) vale ao abrir a praia
try {
  const s = localStorage.getItem('praiaWalkmask');
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
  { nome: 'Oeste', borda: 'oeste', de: 475,  ate: 660  },
  { nome: 'Norte', borda: 'norte', de: 1316, ate: 1484 },
  { nome: 'Leste', borda: 'leste', de: 480,  ate: 650  },
];
const PROFUNDIDADE_SAIDA = 3.2;                   // unidades para dentro do mapa em que a saída dispara
for (const sa of SAIDAS) {
  const m = (sa.de + sa.ate) / 2;
  const a = sa.borda === 'oeste' ? P(0, sa.de) : sa.borda === 'leste' ? P(IMG_W, sa.de) : P(sa.de, 0);
  const b = sa.borda === 'oeste' ? P(0, sa.ate) : sa.borda === 'leste' ? P(IMG_W, sa.ate) : P(sa.ate, 0);
  sa.centro = sa.borda === 'oeste' ? P(0, m) : sa.borda === 'leste' ? P(IMG_W, m) : P(m, 0);
  sa.x0 = Math.min(a.x, b.x); sa.x1 = Math.max(a.x, b.x); sa.z0 = Math.min(a.z, b.z); sa.z1 = Math.max(a.z, b.z);
  if (sa.borda === 'oeste') sa.x1 = sa.x0 + PROFUNDIDADE_SAIDA;
  if (sa.borda === 'leste') sa.x0 = sa.x1 - PROFUNDIDADE_SAIDA;
  if (sa.borda === 'norte') sa.z1 = sa.z0 + PROFUNDIDADE_SAIDA;
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
    const folgaBaixo = Math.max(30, A / 2 - mb);              // abaixo, deixa espaço para o joystick
    const k = Math.min((L / 2 - mx) / Math.max(1e-6, Math.abs(dx)), (A / 2 - mt) / Math.max(1e-6, Math.abs(dy)),
      dy > 0 ? folgaBaixo / dy : Infinity);
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
