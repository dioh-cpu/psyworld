// Explorador interligado da Região 1: C0, C1, C2, C3, E1 e D1 com colisão suave SDF e Azazel (traje de vilão).
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { construirSDF, resolverMovimentoSDF } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';
import { IMG_W, IMG_H, MAPA_INICIAL, ORDEM_MAPAS, MAPAS } from './regiao1-mapas.js';

const LARG = 106;
const ALT = LARG * IMG_H / IMG_W;
const ALTURA_PERSONAGEM = 4.4;
const RAIO = 0.35;
const VELOCIDADE = 5.6;
const VERSAO_ASSETS = 'r1_v1';

// Converte ponto (px, py) em 1024x571 para coordenadas de mundo (norte = -z)
const P = (px, py) => ({ x: (px / IMG_W - 0.5) * LARG, z: (py / IMG_H - 0.5) * ALT });

const params = new URLSearchParams(location.search);
const VISAO = params.get('visao') || 'jogo';

const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
renderer.setSize(window.innerWidth, window.innerHeight, false);
const maxAniso = renderer.capabilities?.getMaxAnisotropy?.() || 16;

const cena = new THREE.Scene();
cena.background = new THREE.Color('#0c1522');

const INCLINACAO = THREE.MathUtils.clamp(Number(params.get('inclinacao')) || 50, 30, 80);
const SEN = Math.sin(THREE.MathUtils.degToRad(INCLINACAO));
const COS = Math.cos(THREE.MathUtils.degToRad(INCLINACAO));
const ALTURA_MAX = ALT * SEN;                 // 100% do mapa inteiro na vertical (sem esticar pixels)
const ALTURA_MIN = 16;                        // limite máximo de aproximação
let alturaCamera = THREE.MathUtils.clamp(Number(params.get('altura')) || 34, ALTURA_MIN, ALTURA_MAX);
const ALTURA_EM_PE = Number(params.get('alturape')) || 38;
const DISTANCIA_CAMERA = 60;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
camera.up.set(0, 1, 0);
const alvoCamera = { x: 0, z: 0 };

const zoomValEl = document.getElementById('zoom-val');

function atualizarLabelZoom() {
  if (!zoomValEl) return;
  const pct = Math.round((ALTURA_MAX / alturaCamera) * 100);
  zoomValEl.textContent = `${pct}%`;
}

function posicionarCamera() {
  camera.position.set(alvoCamera.x, DISTANCIA_CAMERA * SEN, alvoCamera.z + DISTANCIA_CAMERA * COS);
  camera.lookAt(alvoCamera.x, 0, alvoCamera.z);
}

function enquadrar() {
  const aspecto = window.innerWidth / window.innerHeight;
  const tela = VISAO === 'geral' ? Math.max(ALTURA_MAX, LARG / aspecto)
    : aspecto < 1 ? Math.min(ALTURA_EM_PE, ALTURA_MAX)
    : Math.min(alturaCamera, ALTURA_MAX, LARG / aspecto);
  camera.top = tela / 2;
  camera.bottom = -camera.top;
  camera.right = camera.top * aspecto;
  camera.left = -camera.right;
  camera.updateProjectionMatrix();
  atualizarLabelZoom();
}
enquadrar();

function definirZoom(novaAltura) {
  alturaCamera = THREE.MathUtils.clamp(novaAltura, ALTURA_MIN, ALTURA_MAX);
  enquadrar();
}

document.getElementById('btn-zoom-menos')?.addEventListener('click', () => definirZoom(alturaCamera + 4));
document.getElementById('btn-zoom-mais')?.addEventListener('click', () => definirZoom(alturaCamera - 4));
zoomValEl?.addEventListener('click', () => definirZoom(ALTURA_MAX));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  definirZoom(alturaCamera + Math.sign(e.deltaY) * 2.5);
}, { passive: false });

// ---- Piso (1 plano único, sem camada de recorte por cima) ----
const carregador = new THREE.TextureLoader();
const cacheTexturas = new Map();
const cacheSdfs = new Map();

function obterTexturaMapa(mapa) {
  if (!cacheTexturas.has(mapa.id)) {
    const t = carregador.load(`${mapa.arte}?v=${VERSAO_ASSETS}`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    cacheTexturas.set(mapa.id, t);
  }
  return cacheTexturas.get(mapa.id);
}

function carregarSdfMapa(mapa) {
  if (cacheSdfs.has(mapa.id)) return Promise.resolve(cacheSdfs.get(mapa.id));
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      const sw = Math.min(im.width, 600);
      const sh = Math.max(1, Math.round(im.height * sw / im.width));
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const cx = c.getContext('2d');
      cx.drawImage(im, 0, 0, sw, sh);
      const d = cx.getImageData(0, 0, sw, sh).data;
      const walk = new Uint8Array(sw * sh);
      for (let i = 0; i < walk.length; i++) walk[i] = d[i * 4] >= 128 ? 1 : 0;
      const sdf = construirSDF(walk, sw, sh, LARG, ALT);
      cacheSdfs.set(mapa.id, sdf);
      resolve(sdf);
    };
    im.onerror = () => resolve(null);
    im.src = `${mapa.mascara}?v=${VERSAO_ASSETS}`;
  });
}

const matPiso = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false });
const piso = new THREE.Mesh(new THREE.PlaneGeometry(LARG, ALT).rotateX(-Math.PI / 2), matPiso);
piso.renderOrder = 0;
cena.add(piso);

const camada = (z) => 0.04 + (z + ALT / 2) * 0.01;

// ---- Azazel no traje de vilão ----
const azazel = criarAzazel('assets/characters/', ALTURA_PERSONAGEM);
const jogador = new THREE.Group();
jogador.add(azazel.malha);
jogador.traverse((o) => {
  if (o.material) {
    o.material.depthTest = false;
    o.material.transparent = true;
    o.renderOrder = 3;
  }
});
cena.add(jogador);

// Sombra de contato sob os pés
const sombra = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.78)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.95).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false })
  );
  m.renderOrder = 2;
  cena.add(m);
  return m;
})();

// ---- UI: HUD do mapa, seletor rápido, fade de transição, aviso e setas ----
const hudTitulo = document.getElementById('mapa-titulo');
const seletorMapa = document.getElementById('seletor-mapa');
const cortina = document.getElementById('cortina-transicao');
const aviso = document.getElementById('aviso-saida');
const containerSetas = document.getElementById('setas-saidas');

for (const id of ORDEM_MAPAS) {
  const m = MAPAS[id];
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = `${m.id} · ${m.nome}`;
  seletorMapa.appendChild(opt);
}

let mapaAtual = null;
let sdfAtivo = null;
let saidasAtuais = [];
let elementosSetas = [];
let emTransicao = false;
let bloqueioSaidaAte = 0;
let saidaAvisoAtual = null;
let primeiroQuadro = true;

const estado = { x: 0, z: 0 };

function prepararSaidas(mapa) {
  containerSetas.innerHTML = '';
  elementosSetas = [];
  saidasAtuais = mapa.saidas.map((sa) => {
    const [x0p, y0p, x1p, y1p] = sa.rect;
    const a = P(x0p, y0p);
    const b = P(x1p, y1p);
    const centro = P((x0p + x1p) / 2, (y0p + y1p) / 2);
    const item = {
      ...sa,
      centro,
      x0: Math.min(a.x, b.x),
      x1: Math.max(a.x, b.x),
      z0: Math.min(a.z, b.z),
      z1: Math.max(a.z, b.z),
    };

    const el = document.createElement('div');
    const cor = sa.tipo === 'trem' ? '#fb923c' : sa.destino ? '#facc15' : '#7dd3fc';
    el.className = 'seta-ind';
    el.innerHTML = `<div class="tri" style="color:${cor}">&#9650;</div><div class="lbl">${sa.rotulo}</div>`;
    containerSetas.appendChild(el);
    elementosSetas.push(el);
    return item;
  });
}

async function entrarNoMapa(id, chegadaPx = null, comFade = true) {
  const destino = MAPAS[id] || MAPAS[MAPA_INICIAL];
  if (!destino || emTransicao) return;
  emTransicao = true;
  saidaAvisoAtual = null;
  aviso.style.display = 'none';

  if (comFade) {
    cortina.classList.add('ativo');
    await new Promise((r) => setTimeout(r, 170));
  }

  mapaAtual = destino;
  matPiso.map = obterTexturaMapa(destino);
  matPiso.needsUpdate = true;

  const sdfPromise = carregarSdfMapa(destino);
  // Pré-carrega vizinhos conectados em segundo plano para transições instantâneas
  for (const sa of destino.saidas) {
    if (sa.destino && MAPAS[sa.destino]) {
      obterTexturaMapa(MAPAS[sa.destino]);
      carregarSdfMapa(MAPAS[sa.destino]);
    }
  }
  sdfAtivo = await sdfPromise;

  const ponto = chegadaPx || destino.spawnPadrao;
  const w = P(ponto[0], ponto[1]);
  estado.x = w.x;
  estado.z = w.z;
  primeiroQuadro = true;

  prepararSaidas(destino);
  hudTitulo.textContent = `${destino.id} · ${destino.nome}`;
  seletorMapa.value = destino.id;

  const url = new URL(location.href);
  url.searchParams.set('mapa', destino.id);
  history.replaceState(null, '', url.toString());

  bloqueioSaidaAte = performance.now() + 450;

  if (comFade) {
    await new Promise((r) => requestAnimationFrame(r));
    cortina.classList.remove('ativo');
  }
  emTransicao = false;
}

seletorMapa.addEventListener('change', () => {
  entrarNoMapa(seletorMapa.value, null, true);
  seletorMapa.blur();
});

// ---- Controles: teclado e joystick ----
const teclas = new Set();
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));
const pressionada = (...codigos) => codigos.some((c) => teclas.has(c));

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
joyEl.addEventListener('pointerdown', (e) => {
  joyDedo = e.pointerId;
  joyEl.setPointerCapture(e.pointerId);
  joyAtualizar(e);
  e.preventDefault();
});
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyDedo) joyAtualizar(e); });
joyEl.addEventListener('pointerup', joyFim);
joyEl.addEventListener('pointercancel', joyFim);

// ---- Saídas e setas direcionais ----
const _v = new THREE.Vector3();

function atualizarSaidas(agora) {
  if (!mapaAtual) return;

  if (!emTransicao && agora >= bloqueioSaidaAte) {
    const dentro = saidasAtuais.find((sa) =>
      estado.x >= sa.x0 && estado.x <= sa.x1 && estado.z >= sa.z0 && estado.z <= sa.z1
    ) || null;

    if (dentro && dentro.destino && MAPAS[dentro.destino]) {
      entrarNoMapa(dentro.destino, dentro.chegada, true);
      return;
    }

    if (dentro !== saidaAvisoAtual) {
      saidaAvisoAtual = dentro;
      if (!dentro) {
        aviso.style.display = 'none';
      } else {
        aviso.textContent = dentro.mensagem || `Em breve · ${dentro.rotulo}`;
        aviso.style.display = 'block';
      }
    }
  }

  const L = window.innerWidth;
  const A = window.innerHeight;
  const mx = 46;
  const mt = 66;
  const mb = 146;

  saidasAtuais.forEach((sa, i) => {
    const el = elementosSetas[i];
    if (!el) return;
    _v.set(sa.centro.x, 0, sa.centro.z).project(camera);
    const sx = (_v.x * 0.5 + 0.5) * L;
    const sy = (-_v.y * 0.5 + 0.5) * A;
    const visivel = sx > mx && sx < L - mx && sy > mt && sy < A - 24;
    if (visivel) {
      el.style.display = 'none';
      return;
    }
    const cx = L / 2;
    const cy = A / 2;
    const dx = sx - cx;
    const dy = sy - cy;
    const folgaBaixo = Math.max(30, A / 2 - mb);
    const k = Math.min(
      (L / 2 - mx) / Math.max(1e-6, Math.abs(dx)),
      (A / 2 - mt) / Math.max(1e-6, Math.abs(dy)),
      dy > 0 ? folgaBaixo / dy : Infinity
    );
    el.style.left = `${cx + dx * k}px`;
    el.style.top = `${cy + dy * k}px`;
    el.querySelector('.tri').style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI + 90}deg)`;
    el.style.display = 'block';
  });
}

// ---- Loop principal ----
let ultimo = performance.now();

function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;

  let andando = false;
  let rot = 0;

  if (VISAO === 'jogo' && !emTransicao && sdfAtivo) {
    let ix = joy.x;
    let iz = joy.z;
    if (pressionada('KeyW', 'ArrowUp')) iz += 1;
    if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
    if (pressionada('KeyD', 'ArrowRight')) ix += 1;
    if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
    const forca = Math.min(1, Math.hypot(ix, iz));
    let dx = ix;
    let dz = -iz;
    const n = Math.hypot(dx, dz);
    if (n > 1e-6 && forca > 0) {
      andando = true;
      rot = Math.atan2(dx, dz);
      dx = (dx / n) * forca * VELOCIDADE * dt;
      dz = (dz / n) * forca * VELOCIDADE * dt;
      const p = resolverMovimentoSDF({ x: estado.x, z: estado.z }, dx, dz, RAIO, sdfAtivo);
      estado.x = THREE.MathUtils.clamp(p.x, -LARG / 2 + RAIO, LARG / 2 - RAIO);
      estado.z = THREE.MathUtils.clamp(p.z, -ALT / 2 + RAIO, ALT / 2 - RAIO);
    }
  }

  jogador.position.set(estado.x, camada(estado.z), estado.z);
  sombra.position.set(estado.x, camada(estado.z) - 0.005, estado.z);
  azazel.atualizar(andando, rot, 0);

  if (VISAO === 'geral') {
    alvoCamera.x = 0;
    alvoCamera.z = 0;
  } else {
    const seguir = primeiroQuadro ? 1 : 1 - Math.exp(-dt * 14);
    const limX = Math.max(0, LARG / 2 - camera.right);
    const dz = camera.top / SEN;
    const limZ = Math.max(0, ALT / 2 - dz);
    const tx = THREE.MathUtils.clamp(estado.x, -limX, limX);
    const tz = THREE.MathUtils.clamp(estado.z, -limZ, limZ);
    alvoCamera.x += (tx - alvoCamera.x) * seguir;
    alvoCamera.z += (tz - alvoCamera.z) * seguir;
  }

  posicionarCamera();
  atualizarSaidas(agora);
  jogador.quaternion.copy(camera.quaternion);
  primeiroQuadro = false;

  renderer.render(cena, camera);
  requestAnimationFrame(quadro);
}

window.addEventListener('resize', () => {
  enquadrar();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

window.regiao1 = {
  mapaAtual: () => (mapaAtual ? mapaAtual.id : null),
  irPara: (id) => entrarNoMapa(id, null, false),
  estado: () => ({ x: estado.x, z: estado.z }),
  saidas: () => saidasAtuais.map((s) => ({ id: s.id, rotulo: s.rotulo, destino: s.destino })),
  mapasDisponiveis: () => [...ORDEM_MAPAS],
};

const inicial = (params.get('mapa') || MAPA_INICIAL).toUpperCase();
entrarNoMapa(MAPAS[inicial] ? inicial : MAPA_INICIAL, null, false);
requestAnimationFrame(quadro);
