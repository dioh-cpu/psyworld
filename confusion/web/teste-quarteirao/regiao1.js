// PSYWORLD — Explorador Completo da Região 1 (48 Áreas, Quests, Teleportes, NPCs, Monstros, Chefes e Save)
import * as THREE from 'three';
import { vetorJoystick } from '../explorar3d/controles.js';
import { construirSDF, resolverMovimentoSDF } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';
import { criarNoctarn } from './noctarn.js';
import { IMG_W, IMG_H, MAPA_INICIAL, ORDEM_MAPAS, MAPAS } from './regiao1-mapas.js';
import { NPCS_REGIAO1, PISTAS_MUNDO, MONSTROS_SELVAGENS, ENTIDADES_BOSS } from './regiao1-entidades.js';
import {
  SAVE_KEY_REGIAO1,
  MARCOS_TELEPORTE,
  BOSSES_REGIAO1,
  QUESTS_DEFINICOES,
  QUESTS_POR_ID,
  criarEstadoInicial,
  aceitarQuest,
  registrarPista,
  descobrirMarco,
  destinosTeleporteDisponiveis,
  registrarVitoriaBoss,
  embarcarNoTrem,
  progressoQuest,
  serializarEstado,
  desserializarEstado,
} from './regiao1-estado.js';

// ---- Constantes de mundo, escala (+30% aplicado uma vez) e câmera calibrada ----
const LARG = 106;
const ALT = LARG * IMG_H / IMG_W;
const params = new URLSearchParams(location.search);

const ALTURA_BASE_PERSONAGEM = 5.54;
const FATOR_ESCALA_PERSONAGEM = Number(params.get('escala')) || 1.30; // +30% sobre a base -> 7.20 unidades
const ALTURA_PERSONAGEM = ALTURA_BASE_PERSONAGEM * FATOR_ESCALA_PERSONAGEM;
const RAIO = 0.35; // colisão preservada conforme especificação
const VELOCIDADE_BASE = 5.8;
const MULT_CORRIDA = 2.18; // +50% mais rápido na corrida (8.41 -> 12.64 u/s)
const VERSAO_ASSETS = 'r1_48_v2';

const P = (px, py) => ({ x: (px / IMG_W - 0.5) * LARG, z: (py / IMG_H - 0.5) * ALT });
const W2P = (x, z) => [
  Math.round((x / LARG + 0.5) * IMG_W),
  Math.round((z / ALT + 0.5) * IMG_H),
];

const VISAO = params.get('visao') || 'jogo';
const INCLINACAO = THREE.MathUtils.clamp(Number(params.get('inclinacao')) || 50, 30, 80);
const SEN = Math.sin(THREE.MathUtils.degToRad(INCLINACAO));
const COS = Math.cos(THREE.MathUtils.degToRad(INCLINACAO));
const ALTURA_MAX = ALT * SEN; // ~45.3 (100% do mapa)
const ALTURA_MIN = 16;
const ALTURA_PAISAGEM_PADRAO = 28; // calibrado em C0, C1, PC1, CC7 e BOSS_E
const ALTURA_RETRATO_PADRAO = 32;  // retrato equilibrado com espaço à frente
const OFFSET_RETRATO_Z = -4.2;     // desloca enquadramento ao norte em retrato para ver o que vem pela frente
const DISTANCIA_CAMERA = 60;

let alturaPaisagem = THREE.MathUtils.clamp(Number(params.get('altura')) || ALTURA_PAISAGEM_PADRAO, ALTURA_MIN, ALTURA_MAX);
let alturaRetrato = THREE.MathUtils.clamp(Number(params.get('alturape')) || ALTURA_RETRATO_PADRAO, ALTURA_MIN, ALTURA_MAX);

// ---- Renderizador e câmera ortográfica 3/4 ----
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
renderer.setSize(window.innerWidth, window.innerHeight, false);
const maxAniso = renderer.capabilities?.getMaxAnisotropy?.() || 16;

const cena = new THREE.Scene();
cena.background = new THREE.Color('#0b1322');

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
camera.up.set(0, 1, 0);
const alvoCamera = { x: 0, z: 0 };

const zoomValEl = document.getElementById('zoom-val');
const ehRetrato = () => window.innerWidth < window.innerHeight;

function atualizarLabelZoom() {
  if (!zoomValEl) return;
  const h = ehRetrato() ? alturaRetrato : alturaPaisagem;
  zoomValEl.textContent = `${Math.round((ALTURA_MAX / h) * 100)}%`;
}

function posicionarCamera() {
  camera.position.set(alvoCamera.x, DISTANCIA_CAMERA * SEN, alvoCamera.z + DISTANCIA_CAMERA * COS);
  camera.lookAt(alvoCamera.x, 0, alvoCamera.z);
}

function enquadrar() {
  const aspecto = window.innerWidth / window.innerHeight;
  const tela = VISAO === 'geral'
    ? Math.max(ALTURA_MAX, LARG / aspecto)
    : aspecto < 1
      ? Math.min(alturaRetrato, ALTURA_MAX)
      : Math.min(alturaPaisagem, ALTURA_MAX, LARG / aspecto);
  camera.top = tela / 2;
  camera.bottom = -camera.top;
  camera.right = camera.top * aspecto;
  camera.left = -camera.right;
  camera.updateProjectionMatrix();
  atualizarLabelZoom();
}
enquadrar();

function ajustarZoom(delta) {
  if (ehRetrato()) {
    alturaRetrato = THREE.MathUtils.clamp(alturaRetrato + delta, ALTURA_MIN, ALTURA_MAX);
  } else {
    alturaPaisagem = THREE.MathUtils.clamp(alturaPaisagem + delta, ALTURA_MIN, ALTURA_MAX);
  }
  enquadrar();
}

document.getElementById('btn-zoom-menos')?.addEventListener('click', () => ajustarZoom(3.5));
document.getElementById('btn-zoom-mais')?.addEventListener('click', () => ajustarZoom(-3.5));
zoomValEl?.addEventListener('click', () => {
  alturaPaisagem = ALTURA_PAISAGEM_PADRAO;
  alturaRetrato = ALTURA_RETRATO_PADRAO;
  enquadrar();
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  ajustarZoom(Math.sign(e.deltaY) * 2.5);
}, { passive: false });

// ---- Persistência (save) ----
let save = criarEstadoInicial();
try {
  const raw = localStorage.getItem(SAVE_KEY_REGIAO1);
  if (raw && !params.get('novosave')) save = desserializarEstado(raw);
} catch (_) {}

function salvarEstado() {
  try {
    save.mapaAtual = mapaAtual ? mapaAtual.id : save.mapaAtual;
    save.posicaoPx = W2P(estado.x, estado.z);
    localStorage.setItem(SAVE_KEY_REGIAO1, serializarEstado(save));
  } catch (_) {}
}

// ---- Piso + Caches ----
const carregador = new THREE.TextureLoader();
const cacheTexturas = new Map();
const cacheSdfs = new Map();

function carregarTextura(url) {
  if (!cacheTexturas.has(url)) {
    const t = carregador.load(`${url}?v=${VERSAO_ASSETS}`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    cacheTexturas.set(url, t);
  }
  return cacheTexturas.get(url);
}

function texturaAtualDoMapa(mapa) {
  const ativo = Boolean(mapa.marco && save.teleportes[mapa.marco.id]?.ativo);
  const url = (ativo && mapa.arteAtivo) ? mapa.arteAtivo : mapa.arte;
  return carregarTextura(url);
}

function carregarSdfMapa(mapa) {
  if (cacheSdfs.has(mapa.id)) return Promise.resolve(cacheSdfs.get(mapa.id));
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      const sw = Math.min(im.width, 512);
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

// ---- Personagens controlados: Noctarn e Azazel (+30% aplicados na mesma altura-base) ----
const azazel = criarAzazel('assets/characters/', ALTURA_PERSONAGEM);
const noctarn = criarNoctarn('../../../assets/monsters/noctarn/', ALTURA_PERSONAGEM);

const jogador = new THREE.Group();
jogador.add(azazel.malha, noctarn.malha);
jogador.traverse((o) => {
  if (o.material) {
    o.material.depthTest = false;
    o.material.transparent = true;
    o.renderOrder = 4;
  }
});
cena.add(jogador);

const btnForma = document.getElementById('btn-forma');
function aplicarForma(novaForma) {
  save.forma = novaForma === 'azazel' ? 'azazel' : 'noctarn';
  azazel.malha.visible = save.forma === 'azazel';
  noctarn.malha.visible = save.forma === 'noctarn';
  if (save.forma !== 'noctarn') noctarn.pausar();
  if (btnForma) btnForma.textContent = save.forma === 'azazel' ? 'Forma: Azazel' : 'Forma: Noctarn';
  salvarEstado();
}
btnForma?.addEventListener('click', () => aplicarForma(save.forma === 'noctarn' ? 'azazel' : 'noctarn'));

// Sombra de contato sob os pés (proporcional a +30%)
const sombra = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.8)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.55).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false })
  );
  m.renderOrder = 2;
  cena.add(m);
  return m;
})();

// ---- Geradores de sprites provisórios (NPCs, Pistas, Cristal C1) ----
function criarTexturaNpcProvisorio(npc, temQuest) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 240;
  const g = c.getContext('2d');

  // Placa de nome no topo
  g.fillStyle = 'rgba(8, 16, 32, 0.88)';
  g.strokeStyle = npc.cor || '#38bdf8';
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(10, 8, 172, 42, 10);
  g.fill();
  g.stroke();

  g.fillStyle = '#fff';
  g.font = 'bold 14px system-ui';
  g.textAlign = 'center';
  g.fillText(npc.nome.split(',')[0], 96, 28);
  g.fillStyle = npc.cor || '#7dd3fc';
  g.font = '600 11px system-ui';
  g.fillText(`[${npc.raca.toUpperCase()}]`, 96, 44);

  if (temQuest) {
    g.fillStyle = '#facc15';
    g.font = '900 28px system-ui';
    g.fillText('!', 164, 34);
  }

  // Corpo estilizado provisório (ancorado perto da base y=232)
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath();
  g.ellipse(96, 224, 36, 12, 0, 0, Math.PI * 2);
  g.fill();

  // Manto/túnica
  g.fillStyle = npc.cor || '#38bdf8';
  g.beginPath();
  g.moveTo(64, 220);
  g.lineTo(74, 125);
  g.lineTo(118, 125);
  g.lineTo(128, 220);
  g.closePath();
  g.fill();
  g.strokeStyle = '#0f172a';
  g.lineWidth = 3;
  g.stroke();

  // Cabeça + orelhas (elfo / goblin)
  const pele = npc.raca === 'goblin' ? '#84cc16' : npc.raca === 'espirito' ? '#a7f3d0' : '#f1c29b';
  g.fillStyle = pele;
  g.beginPath();
  g.arc(96, 98, 24, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  if (npc.raca === 'elfo' || npc.raca === 'goblin') {
    const tam = npc.raca === 'goblin' ? 22 : 16;
    g.beginPath();
    g.moveTo(73, 96); g.lineTo(73 - tam, 88); g.lineTo(75, 105);
    g.moveTo(119, 96); g.lineTo(119 + tam, 88); g.lineTo(117, 105);
    g.fill();
  }

  // Olhos
  g.fillStyle = '#0f172a';
  g.beginPath();
  g.arc(88, 97, 3, 0, Math.PI * 2);
  g.arc(104, 97, 3, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function criarTexturaPista(rotulo, feita) {
  const c = document.createElement('canvas');
  c.width = 220;
  c.height = 110;
  const g = c.getContext('2d');

  // Anel luminoso no piso
  const cor = feita ? '#4ade80' : '#facc15';
  g.fillStyle = feita ? 'rgba(74,222,128,0.22)' : 'rgba(250,204,21,0.3)';
  g.beginPath();
  g.arc(110, 82, 22, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = cor;
  g.lineWidth = 4;
  g.stroke();

  g.fillStyle = 'rgba(8, 16, 32, 0.88)';
  g.beginPath();
  g.roundRect(8, 12, 204, 34, 8);
  g.fill();
  g.strokeStyle = cor;
  g.lineWidth = 2;
  g.stroke();

  g.fillStyle = feita ? '#86efac' : '#fef08a';
  g.font = 'bold 12px system-ui';
  g.textAlign = 'center';
  g.fillText((feita ? '✓ ' : '✦ ') + rotulo.slice(0, 26), 110, 33);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function criarTexturaCristal(ativo) {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 200;
  const g = c.getContext('2d');
  // Base pedestal
  g.fillStyle = '#475569';
  g.beginPath();
  g.ellipse(80, 172, 46, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = ativo ? '#38bdf8' : '#94a3b8';
  g.lineWidth = 4;
  g.stroke();

  if (ativo) {
    const gr = g.createRadialGradient(80, 96, 8, 80, 96, 68);
    gr.addColorStop(0, 'rgba(56,189,248,0.85)');
    gr.addColorStop(1, 'rgba(56,189,248,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 160, 200);
  }
  g.fillStyle = ativo ? '#38bdf8' : '#94a3b8';
  g.beginPath();
  g.moveTo(80, 22);
  g.lineTo(112, 108);
  g.lineTo(80, 162);
  g.lineTo(48, 108);
  g.closePath();
  g.fill();
  g.strokeStyle = ativo ? '#e0f2fe' : '#334155';
  g.lineWidth = 3;
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Grupo dinâmico de entidades do mapa atual
const grupoEntidades = new THREE.Group();
cena.add(grupoEntidades);
let entidadesMapa = []; // { tipo, dados, mesh, x, z, baseY, raio }
let monstrosDerrotadosSessao = new Set();

function limparEntidades() {
  while (grupoEntidades.children.length) {
    const ch = grupoEntidades.children[0];
    grupoEntidades.remove(ch);
    ch.geometry?.dispose?.();
    if (ch.material) {
      if (ch.material.map && !cacheTexturas.has(ch.material.map)) {
        // Texturas de canvas locais podem ser descartadas
        if (ch.material.map.isCanvasTexture) ch.material.map.dispose();
      }
      ch.material.dispose();
    }
  }
  entidadesMapa = [];
}

function adicionarBillboard(tex, x, z, largura, altura, renderOrder = 3) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), mat);
  m.position.set(x, camada(z) + altura * 0.45, z);
  m.renderOrder = renderOrder;
  grupoEntidades.add(m);
  return m;
}

function construirEntidadesDoMapa(mapa) {
  limparEntidades();

  // 1. Cristal visual de C1 (enquanto não tem C1-ativo.webp)
  if (mapa.marco?.usarOverlayCristal) {
    const ativo = Boolean(save.teleportes[mapa.marco.id]?.ativo);
    const w = P(mapa.marco.pos[0], mapa.marco.pos[1]);
    const mesh = adicionarBillboard(criarTexturaCristal(ativo), w.x, w.z, 3.6, 4.5, 3);
    entidadesMapa.push({ tipo: 'cristal_visual', dados: mapa.marco, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 0 });
  }

  // 2. NPCs
  for (const npc of NPCS_REGIAO1) {
    if (npc.mapa !== mapa.id) continue;
    const w = P(npc.pos[0], npc.pos[1]);
    const temQuest = Boolean(npc.quest && save.quests[npc.quest] !== 'concluida');
    const mesh = adicionarBillboard(criarTexturaNpcProvisorio(npc, temQuest), w.x, w.z, 5.4, 6.75, 3);
    entidadesMapa.push({ tipo: 'npc', dados: npc, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 5.4 });
  }

  // 3. Pistas / Objetos de Quest
  for (const p of PISTAS_MUNDO) {
    if (p.mapa !== mapa.id) continue;
    const feita = Boolean(save.pistas[p.id]);
    const w = P(p.pos[0], p.pos[1]);
    const mesh = adicionarBillboard(criarTexturaPista(p.rotulo, feita), w.x, w.z, 5.2, 2.6, 3);
    entidadesMapa.push({ tipo: 'pista', dados: p, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 4.5 });
  }

  // 4. Monstros selvagens visíveis nas áreas abertas
  for (const m of MONSTROS_SELVAGENS) {
    if (m.mapa !== mapa.id || monstrosDerrotadosSessao.has(m.id)) continue;
    const w = P(m.pos[0], m.pos[1]);
    const tex = carregarTextura(m.sprite);
    const mesh = adicionarBillboard(tex, w.x, w.z, 6.4, 6.4, 3);
    entidadesMapa.push({ tipo: 'wild', dados: m, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 3.1, raioInteracao: 5.8 });
  }

  // 5. Boss da arena (se ainda não derrotado)
  for (const b of ENTIDADES_BOSS) {
    if (b.mapa !== mapa.id || save.bossesDerrotados[b.id]) continue;
    const w = P(b.pos[0], b.pos[1]);
    const tex = carregarTextura(b.sprite);
    const mesh = adicionarBillboard(tex, w.x, w.z, 9.8, 9.8, 3);
    entidadesMapa.push({ tipo: 'boss', dados: b, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 4.6, raioInteracao: 7.5 });
  }
}

// ---- UI & HUD ----
const hudTitulo = document.getElementById('mapa-titulo');
const hudRecursos = document.getElementById('hud-recursos');
const seletorMapa = document.getElementById('seletor-mapa');
const cortina = document.getElementById('cortina-transicao');
const aviso = document.getElementById('aviso-saida');
const containerSetas = document.getElementById('setas-saidas');
const btnInteragir = document.getElementById('btn-interagir');
const btnCorrer = document.getElementById('btn-correr');
const btnFazenda = document.getElementById('btn-fazenda');
const qbTitulo = document.getElementById('qb-titulo');
const qbSub = document.getElementById('qb-sub');

for (const id of ORDEM_MAPAS) {
  const m = MAPAS[id];
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = `${m.id} · ${m.nome}`;
  seletorMapa.appendChild(opt);
}

let timerAviso = null;
function mostrarToast(msg, ms = 3600) {
  aviso.textContent = msg;
  aviso.style.display = 'block';
  clearTimeout(timerAviso);
  if (ms > 0) timerAviso = setTimeout(() => { aviso.style.display = 'none'; }, ms);
}

function atualizarHudEstado() {
  hudRecursos.textContent = `${save.recompensas.gold}g · ${save.recompensas.diamantes}💎`;
  btnFazenda.style.display = save.desbloqueios.fazenda ? 'inline-flex' : 'none';
  btnCorrer.style.display = save.desbloqueios.corrida ? 'block' : 'none';

  // Destaque da primeira quest ativa no banner
  const ativa = QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'ativa')
    || QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'disponivel');
  if (ativa) {
    const prog = progressoQuest(save, ativa.id);
    qbTitulo.textContent = `${ativa.titulo} (${prog.feitos}/${prog.total})`;
    qbSub.textContent = `${ativa.mapas.join(' → ')} · ${ativa.resumo.slice(0, 74)}${ativa.resumo.length > 74 ? '…' : ''}`;
  } else {
    qbTitulo.textContent = 'Região 1 concluída!';
    qbSub.textContent = 'Todas as missões ativas foram completadas.';
  }
}

// Modais helpers
function abrirModal(id) { document.getElementById(id)?.classList.add('aberto'); }
function fecharModal(id) { document.getElementById(id)?.classList.remove('aberto'); }
function algumModalAberto() { return Boolean(document.querySelector('.modal-bg.aberto')); }

document.querySelectorAll('[data-fechar]').forEach((btn) => {
  btn.addEventListener('click', () => fecharModal(btn.getAttribute('data-fechar')));
});

btnFazenda?.addEventListener('click', () => {
  abrirDialogo('🌱 Fazenda da Cidade', 'Desbloqueio de Missão Secundária (C1)',
    'A Fazenda está liberada! Os monstros capturados na Região 1 podem produzir suprimentos aqui sem interferir na progressão do trem.',
    [{ rotulo: 'Fechar', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]
  );
});

let correndoToggle = false;
btnCorrer?.addEventListener('click', () => {
  correndoToggle = !correndoToggle;
  btnCorrer.classList.toggle('ativo', correndoToggle);
});

// ---- Diário de Quests ----
function renderizarDiario() {
  const resumo = document.getElementById('diario-resumo');
  const lista = document.getElementById('diario-lista');
  const concluidas = QUESTS_DEFINICOES.filter((q) => save.quests[q.id] === 'concluida').length;
  const bosses = Object.values(save.bossesDerrotados).filter(Boolean).length;
  const marcosAtivos = Object.values(save.teleportes).filter((t) => t.ativo).length;
  resumo.textContent = `Missões concluídas: ${concluidas}/${QUESTS_DEFINICOES.length} · Chefes: ${bosses}/4 · Teleportes ativos: ${marcosAtivos}/6 · Trem: ${save.tremLiberado ? 'Liberado' : 'Bloqueado'}`;

  const porCat = new Map();
  for (const q of QUESTS_DEFINICOES) {
    if (!porCat.has(q.categoria)) porCat.set(q.categoria, []);
    porCat.get(q.categoria).push(q);
  }
  lista.innerHTML = '';
  for (const [cat, qs] of porCat.entries()) {
    const h = document.createElement('div');
    h.className = 'q-cat';
    h.textContent = cat;
    lista.appendChild(h);
    for (const q of qs) {
      const st = save.quests[q.id];
      const el = document.createElement('div');
      el.className = `q-item ${st}`;
      const passosHtml = q.pistas.map((p) => {
        const ok = Boolean(save.pistas[p]);
        return `<li class="${ok ? 'ok' : ''}">${q.rotulosPistas?.[p] || p}</li>`;
      }).join('');
      el.innerHTML = `
        <div class="q-top">
          <b>${q.titulo} <span style="color:#94b3d4;font-weight:500">(${q.mapas.join(' → ')})</span></b>
          <span class="q-badge ${st}">${st}</span>
        </div>
        <div style="margin-top:3px;color:#cbd5e1">${q.resumo}</div>
        <ul class="q-passos">${passosHtml}</ul>
      `;
      lista.appendChild(el);
    }
  }
}

document.getElementById('btn-diario')?.addEventListener('click', () => {
  renderizarDiario();
  abrirModal('modal-diario');
});

document.getElementById('btn-reset-save')?.addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY_REGIAO1);
  save = criarEstadoInicial();
  monstrosDerrotadosSessao.clear();
  aplicarForma('noctarn');
  fecharModal('modal-diario');
  entrarNoMapa('C0', null, true);
  mostrarToast('Save da Região 1 reiniciado.');
});

// ---- Mapa Regional ----
document.getElementById('btn-mapa')?.addEventListener('click', () => {
  const stEl = document.getElementById('mapa-status');
  const tps = Object.keys(MARCOS_TELEPORTE).map((id) => {
    const t = save.teleportes[id];
    const ic = t.ativo ? '🔷' : t.descoberto ? '⬜' : '🔒';
    return `${ic} ${id}`;
  }).join(' · ');
  const bs = Object.values(BOSSES_REGIAO1).map((b) =>
    `${save.bossesDerrotados[b.id] ? '✅' : '⚔️'} ${b.nome}`
  ).join(' · ');
  stEl.innerHTML = `<b>Área atual:</b> ${mapaAtual?.id} · ${mapaAtual?.nome}<br><b>Marcos:</b> ${tps}<br><b>Chefes:</b> ${bs}`;
  abrirModal('modal-mapa');
});

// ---- Diálogo genérico ----
function abrirDialogo(titulo, sub, texto, botoes) {
  document.getElementById('dlg-titulo').textContent = titulo;
  document.getElementById('dlg-sub').textContent = sub || '';
  document.getElementById('dlg-texto').textContent = texto;
  const ac = document.getElementById('dlg-acoes');
  ac.innerHTML = '';
  for (const b of botoes) {
    const btn = document.createElement('button');
    btn.className = b.prim ? 'btn-pri' : 'btn-sec';
    btn.textContent = b.rotulo;
    btn.onclick = b.aoClicar;
    ac.appendChild(btn);
  }
  abrirModal('modal-dialogo');
}

function notificarQuestsConcluidas(concluidas) {
  if (!concluidas || !concluidas.length) return;
  const nomes = concluidas.map((q) => `🏆 ${q.titulo}`).join(' · ');
  mostrarToast(`Missão concluída: ${nomes}`, 4500);
  // Atualiza textura do mapa imediatamente caso o marco deste mapa tenha sido ativado
  if (mapaAtual?.marco && save.teleportes[mapaAtual.marco.id]?.ativo) {
    matPiso.map = texturaAtualDoMapa(mapaAtual);
    matPiso.needsUpdate = true;
    construirEntidadesDoMapa(mapaAtual);
  }
  atualizarHudEstado();
  salvarEstado();
}

// ---- Interação com Marco de Teleporte ----
function interagirComMarco(marco) {
  const id = marco.id;
  const tp = save.teleportes[id];
  const def = MARCOS_TELEPORTE[id];

  // Se já ativo: abre menu de viagem listando SOMENTE outros marcos descobertos e ativos
  if (tp?.ativo) {
    const res = destinosTeleporteDisponiveis(save, id);
    document.getElementById('tp-titulo').textContent = `🔷 Teleporte · ${def.nome}`;
    const msgEl = document.getElementById('tp-msg');
    const grid = document.getElementById('tp-destinos');
    grid.innerHTML = '';
    if (res.destinos.length === 0) {
      msgEl.textContent = res.mensagem;
    } else {
      msgEl.textContent = 'Escolha um marco ativo da rede regional para viajar:';
      for (const dest of res.destinos) {
        const btn = document.createElement('button');
        btn.className = 'tp-card';
        btn.innerHTML = `🔷 ${dest.nome}`;
        btn.onclick = () => {
          fecharModal('modal-teleporte');
          const mDest = MAPAS[dest.id];
          entrarNoMapa(dest.id, mDest.marco?.interacao || mDest.spawnPadrao, true);
        };
        grid.appendChild(btn);
      }
    }
    abrirModal('modal-teleporte');
    return;
  }

  // Marco inativo (cristal cinza)
  if (id === 'C1' && save.quests.q_tp_c1 === 'bloqueada') {
    abrirDialogo('⬜ Cristal da Praça (Inativo)', 'C1 · Marco Regional',
      'O cristal cinza permanece silencioso. Descubra primeiro o marco de E8 (Floresta Sombria) ou D9 (Floresta de Cogumelos) para despertar sua missão com a zeladora.',
      [{ rotulo: 'Entendi', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]
    );
    return;
  }

  // Missões de ativação direta no pedestal (E8, D9, PC7) vs multi-etapa (C1, CC7)
  const acaoDireta = {
    E8: { pista: 'tp_e8_raizes_limpas', btn: 'Limpar raízes e ativar cristal', qId: 'q_tp_e8' },
    D9: { pista: 'tp_d9_sequencia_ok', btn: 'Reproduzir sequência de luz', qId: 'q_tp_d9' },
    PC7: { pista: 'tp_pc7_marcas_alinhadas', btn: 'Alinhar marcas da maré', qId: 'q_tp_pc7' },
  }[id];

  if (acaoDireta) {
    const q = QUESTS_POR_ID[acaoDireta.qId];
    abrirDialogo(`⬜ ${def.nome} (Inativo)`, `Missão de Teleporte · ${q.titulo}`, q.resumo, [
      { rotulo: 'Depois', aoClicar: () => fecharModal('modal-dialogo') },
      {
        rotulo: acaoDireta.btn,
        prim: true,
        aoClicar: () => {
          const r1 = aceitarQuest(save, acaoDireta.qId);
          const r2 = registrarPista(save, acaoDireta.pista);
          fecharModal('modal-dialogo');
          notificarQuestsConcluidas([...r1.concluidas, ...r2.concluidas]);
          mostrarToast(`🔷 Marco ${id} ativado! O cristal agora brilha em azul.`, 4200);
        },
      },
    ]);
    return;
  }

  // C1 ou CC7: aceita missão e mostra progresso dos pontos da área
  const q = QUESTS_POR_ID[def.questId];
  const r = aceitarQuest(save, def.questId);
  notificarQuestsConcluidas(r.concluidas);
  const prog = progressoQuest(save, def.questId);
  abrirDialogo(`⬜ ${def.nome} (Inativo)`, `Missão · ${q.titulo} (${prog.feitos}/${prog.total})`,
    q.resumo,
    [{ rotulo: 'OK', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]
  );
}

// ---- Sistema de Encontro / Batalha (Selvagens e 4 Bosses) ----
let batalhaAtiva = null;

function iniciarBatalha(tipo, entidade) {
  if (batalhaAtiva) return;
  const ehBoss = tipo === 'boss';
  const defBoss = ehBoss ? BOSSES_REGIAO1[entidade.id] : null;
  const maxIni = ehBoss ? defBoss.hp : 65 + entidade.nivel * 8;
  batalhaAtiva = {
    tipo,
    entidade,
    hpJog: 150,
    maxJog: 150,
    hpIni: maxIni,
    maxIni,
    nomeIni: ehBoss ? defBoss.nome : `${entidade.especie} (Nv. ${entidade.nivel})`,
  };
  document.getElementById('bat-titulo').textContent = ehBoss ? `⚔️ Chefe · ${defBoss.nome}` : `⚡ Encontro Selvagem`;
  document.getElementById('bat-img-ini').src = entidade.sprite;
  document.getElementById('bat-nome-ini').textContent = batalhaAtiva.nomeIni;
  document.getElementById('bat-log').textContent = ehBoss
    ? `${defBoss.nome} bloqueia a arena! Vença para concluir a missão da rota.`
    : `Um ${entidade.especie} selvagem surgiu na clareira!`;
  renderizarBatalha();
  abrirModal('modal-batalha');
}

function renderizarBatalha() {
  if (!batalhaAtiva) return;
  const b = batalhaAtiva;
  document.getElementById('bat-hp-jog').style.width = `${Math.max(0, (b.hpJog / b.maxJog) * 100)}%`;
  document.getElementById('bat-hp-jog-txt').textContent = `${b.hpJog} / ${b.maxJog}`;
  document.getElementById('bat-hp-ini').style.width = `${Math.max(0, (b.hpIni / b.maxIni) * 100)}%`;
  document.getElementById('bat-hp-ini-txt').textContent = `${b.hpIni} / ${b.maxIni}`;

  const acoes = document.getElementById('bat-acoes');
  acoes.innerHTML = '';
  const golpes = [
    { nome: 'Mordida Umbral', dano: [28, 40] },
    { nome: 'Chama Violeta', dano: [36, 52] },
    { nome: 'Véu Noturno (Cura)', cura: 42 },
  ];
  for (const g of golpes) {
    const btn = document.createElement('button');
    btn.className = 'btn-pri';
    btn.textContent = g.nome;
    btn.onclick = () => executarTurno(g);
    acoes.appendChild(btn);
  }
  if (b.tipo === 'wild') {
    const cap = document.createElement('button');
    cap.className = 'btn-sec';
    cap.textContent = 'Capturar';
    cap.onclick = () => {
      document.getElementById('bat-log').textContent = `${b.entidade.especie} capturado com sucesso! (+35g)`;
      save.recompensas.gold += 35;
      encerrarBatalha(true);
    };
    acoes.appendChild(cap);
  } else {
    const fugir = document.createElement('button');
    fugir.className = 'btn-sec';
    fugir.textContent = 'Recuar';
    fugir.onclick = () => encerrarBatalha(false);
    acoes.appendChild(fugir);
  }
}

function executarTurno(golpe) {
  if (!batalhaAtiva) return;
  const b = batalhaAtiva;
  const log = [];
  if (golpe.cura) {
    b.hpJog = Math.min(b.maxJog, b.hpJog + golpe.cura);
    log.push(`Noctarn usou ${golpe.nome} e recuperou ${golpe.cura} de HP.`);
  } else {
    const dano = golpe.dano[0] + Math.floor(Math.random() * (golpe.dano[1] - golpe.dano[0] + 1));
    b.hpIni = Math.max(0, b.hpIni - dano);
    log.push(`Noctarn usou ${golpe.nome} e causou ${dano} de dano!`);
  }

  if (b.hpIni <= 0) {
    encerrarBatalha(true);
    return;
  }

  const contra = b.tipo === 'boss' ? 18 : 11;
  b.hpJog = Math.max(1, b.hpJog - contra);
  log.push(`${b.nomeIni} contra-atacou (${contra} de dano).`);
  document.getElementById('bat-log').textContent = log.join(' ');
  renderizarBatalha();
}

function encerrarBatalha(vitoria) {
  if (!batalhaAtiva) return;
  const b = batalhaAtiva;
  batalhaAtiva = null;
  fecharModal('modal-batalha');

  if (vitoria) {
    if (b.tipo === 'boss') {
      const res = registrarVitoriaBoss(save, b.entidade.id);
      construirEntidadesDoMapa(mapaAtual);
      notificarQuestsConcluidas(res.concluidas);
      if (res.tremLiberadoAgora) {
        mostrarToast('🚂 Espírito da Floresta e Rei Fungo derrotados! O trem em C3 foi liberado!', 5500);
      } else {
        const ret = BOSSES_REGIAO1[b.entidade.id].mapaRetorno;
        mostrarToast(`Vitória contra ${b.nomeIni}! Retorne a pé para ${ret}.`, 4500);
      }
    } else {
      monstrosDerrotadosSessao.add(b.entidade.id);
      save.recompensas.gold += 25;
      save.recompensas.xp += 20;
      construirEntidadesDoMapa(mapaAtual);
      mostrarToast(`Vitória sobre ${b.entidade.especie}! (+25g, +20 XP)`, 3000);
    }
    atualizarHudEstado();
    salvarEstado();
  } else {
    // Afasta levemente da entidade ao recuar para não disparar encontro imediato
    bloqueioEncontroAte = performance.now() + 2500;
  }
}

document.getElementById('btn-fugir-x')?.addEventListener('click', () => encerrarBatalha(false));

// ---- Navegação entre as 48 áreas ----
let mapaAtual = null;
let sdfAtivo = null;
let saidasAtuais = [];
let elementosSetas = [];
let emTransicao = false;
let bloqueioSaidaAte = 0;
let bloqueioEncontroAte = 0;
let saidaAvisoAtual = null;
let primeiroQuadro = true;
let alvoInteracao = null;

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
    const cor = sa.tipo === 'trem' || sa.tipo === 'trem_volta' ? '#fb923c' : sa.tipo === 'arco' ? '#4ade80' : '#facc15';
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

  if (comFade) {
    cortina.classList.add('ativo');
    await new Promise((r) => setTimeout(r, 150));
  }

  mapaAtual = destino;

  // Descoberta automática de marco regional (C1, E8, D9, PC7, CC7)
  if (destino.marco && destino.marco.id !== 'REINO') {
    const desc = descobrirMarco(save, destino.marco.id);
    if (desc.descobertoAgora) {
      const extraC1 = desc.questsLiberadas.includes('q_tp_c1') ? ' Missão do marco de C1 liberada!' : '';
      mostrarToast(`📍 Marco descoberto em ${destino.id}! Conclua a missão local para ativá-lo.${extraC1}`, 4600);
    }
  }

  matPiso.map = texturaAtualDoMapa(destino);
  matPiso.needsUpdate = true;

  const sdfPromise = carregarSdfMapa(destino);
  for (const sa of destino.saidas) {
    if (sa.destino && MAPAS[sa.destino]) {
      carregarTextura(MAPAS[sa.destino].arte);
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
  construirEntidadesDoMapa(destino);
  hudTitulo.textContent = `${destino.id} · ${destino.nome}`;
  seletorMapa.value = destino.id;
  atualizarHudEstado();
  salvarEstado();

  const url = new URL(location.href);
  url.searchParams.set('mapa', destino.id);
  history.replaceState(null, '', url.toString());

  bloqueioSaidaAte = performance.now() + 500;
  bloqueioEncontroAte = performance.now() + 900;

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

// ---- Interação contextual ([E] ou botão flutuante) ----
function encontrarAlvoInteracao() {
  if (!mapaAtual) return null;
  let melhor = null;
  let melhorDist = Infinity;

  // Marco de teleporte do mapa
  if (mapaAtual.marco) {
    const w = P(mapaAtual.marco.interacao[0], mapaAtual.marco.interacao[1]);
    const dist = Math.hypot(estado.x - w.x, estado.z - w.z);
    if (dist < 6.5 && dist < melhorDist) {
      melhorDist = dist;
      const ativo = Boolean(save.teleportes[mapaAtual.marco.id]?.ativo);
      melhor = { tipo: 'marco', dados: mapaAtual.marco, rotulo: ativo ? `🔷 Teleporte (${mapaAtual.marco.id})` : `⬜ Examinar Marco (${mapaAtual.marco.id})` };
    }
  }

  for (const ent of entidadesMapa) {
    if (ent.tipo === 'cristal_visual') continue;
    const dist = Math.hypot(estado.x - ent.x, estado.z - ent.z);
    const lim = ent.raioInteracao || ent.raio;
    if (dist < lim && dist < melhorDist) {
      melhorDist = dist;
      const rotulo = ent.tipo === 'npc' ? `💬 Falar com ${ent.dados.nome.split(',')[0]}`
        : ent.tipo === 'pista' ? `🔍 ${ent.dados.rotulo}`
        : ent.tipo === 'boss' ? `⚔️ Enfrentar ${ent.dados.nome}`
        : `⚡ Enfrentar ${ent.dados.especie}`;
      melhor = { tipo: ent.tipo, dados: ent.dados, rotulo };
    }
  }
  return melhor;
}

function executarInteracao() {
  if (algumModalAberto() || emTransicao) return;
  const alvo = encontrarAlvoInteracao();
  if (!alvo) return;

  if (alvo.tipo === 'marco') {
    interagirComMarco(alvo.dados);
    return;
  }
  if (alvo.tipo === 'npc') {
    const npc = alvo.dados;
    const concluidas = [];
    if (npc.quest && save.quests[npc.quest] !== 'concluida') {
      concluidas.push(...aceitarQuest(save, npc.quest).concluidas);
    }
    if (npc.pistaAoFalar) {
      concluidas.push(...registrarPista(save, npc.pistaAoFalar).concluidas);
    }
    // Se falou com a pescadora após examinar o bote, permite recuperar forma Azazel naturalmente
    if (npc.id === 'npc_pescadora' && save.pistas.clue_c0_bote && save.forma === 'noctarn') {
      mostrarToast('Você pode alternar entre Noctarn e Azazel no topo!', 3800);
    }
    notificarQuestsConcluidas(concluidas);
    construirEntidadesDoMapa(mapaAtual);
    abrirDialogo(npc.nome, `NPC (${npc.raca}) · ID: ${npc.id}`, npc.dialogo, [
      { rotulo: 'Fechar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
    ]);
    return;
  }
  if (alvo.tipo === 'pista') {
    const p = alvo.dados;
    const res = registrarPista(save, p.id);
    notificarQuestsConcluidas(res.concluidas);
    construirEntidadesDoMapa(mapaAtual);
    atualizarHudEstado();
    salvarEstado();
    abrirDialogo(`✦ ${p.rotulo}`, `Pista registrada (${mapaAtual.id})`, p.texto, [
      { rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
    ]);
    return;
  }
  if (alvo.tipo === 'wild' || alvo.tipo === 'boss') {
    iniciarBatalha(alvo.tipo, alvo.dados);
  }
}

btnInteragir?.addEventListener('click', executarInteracao);

// ---- Controles: teclado e joystick ----
const teclas = new Set();
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
  if (e.code === 'KeyE' || e.code === 'Enter') executarInteracao();
  if (e.code === 'Escape') {
    ['modal-dialogo', 'modal-diario', 'modal-mapa', 'modal-teleporte'].forEach(fecharModal);
  }
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

// ---- Saídas, encontros por proximidade e setas direcionais ----
const _v = new THREE.Vector3();

function atualizarSaidasEInteracoes(agora) {
  if (!mapaAtual) return;

  // Botão contextual de interação
  const novoAlvo = algumModalAberto() ? null : encontrarAlvoInteracao();
  if (novoAlvo !== alvoInteracao) {
    alvoInteracao = novoAlvo;
    if (novoAlvo) {
      btnInteragir.textContent = `[E] ${novoAlvo.rotulo}`;
      btnInteragir.style.display = 'block';
    } else {
      btnInteragir.style.display = 'none';
    }
  }

  // Encontros por aproximação com monstros selvagens ou Boss
  if (!emTransicao && !algumModalAberto() && agora >= bloqueioEncontroAte) {
    for (const ent of entidadesMapa) {
      if (ent.tipo !== 'wild' && ent.tipo !== 'boss') continue;
      if (Math.hypot(estado.x - ent.x, estado.z - ent.z) < ent.raio) {
        iniciarBatalha(ent.tipo, ent.dados);
        return;
      }
    }
  }

  // Transições de borda e Trem
  if (!emTransicao && !algumModalAberto() && agora >= bloqueioSaidaAte) {
    const dentro = saidasAtuais.find((sa) =>
      estado.x >= sa.x0 && estado.x <= sa.x1 && estado.z >= sa.z0 && estado.z <= sa.z1
    ) || null;

    if (dentro) {
      if (dentro.tipo === 'trem') {
        if (saidaAvisoAtual !== dentro) {
          saidaAvisoAtual = dentro;
          const res = embarcarNoTrem(save);
          if (res.ok) {
            notificarQuestsConcluidas(res.concluidas);
            mostrarToast(res.mensagem, 5000);
            entrarNoMapa('REINO', dentro.chegada, true);
          } else {
            mostrarToast(res.mensagem, 4200);
          }
        }
        return;
      }
      if (dentro.destino && MAPAS[dentro.destino]) {
        entrarNoMapa(dentro.destino, dentro.chegada, true);
        return;
      }
    } else if (saidaAvisoAtual) {
      saidaAvisoAtual = null;
    }
  }

  // Setas direcionais fora da tela
  const L = window.innerWidth;
  const A = window.innerHeight;
  const mx = 46, mt = 66, mb = 142;

  saidasAtuais.forEach((sa, i) => {
    const el = elementosSetas[i];
    if (!el) return;
    _v.set(sa.centro.x, 0, sa.centro.z).project(camera);
    const sx = (_v.x * 0.5 + 0.5) * L;
    const sy = (-_v.y * 0.5 + 0.5) * A;
    if (sx > mx && sx < L - mx && sy > mt && sy < A - 24) {
      el.style.display = 'none';
      return;
    }
    const cx = L / 2, cy = A / 2;
    const dx = sx - cx, dy = sy - cy;
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

  if (VISAO === 'jogo' && !emTransicao && !algumModalAberto() && sdfAtivo) {
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
      const correndo = save.desbloqueios.corrida && (correndoToggle || pressionada('ShiftLeft', 'ShiftRight'));
      const vel = VELOCIDADE_BASE * (correndo ? MULT_CORRIDA : 1);
      dx = (dx / n) * forca * vel * dt;
      dz = (dz / n) * forca * vel * dt;
      const p = resolverMovimentoSDF({ x: estado.x, z: estado.z }, dx, dz, RAIO, sdfAtivo);
      estado.x = THREE.MathUtils.clamp(p.x, -LARG / 2 + RAIO, LARG / 2 - RAIO);
      estado.z = THREE.MathUtils.clamp(p.z, -ALT / 2 + RAIO, ALT / 2 - RAIO);
    }
  }

  jogador.position.set(estado.x, camada(estado.z), estado.z);
  sombra.position.set(estado.x, camada(estado.z) - 0.005, estado.z);
  if (save.forma === 'azazel') {
    azazel.atualizar(andando, rot, 0);
  } else {
    noctarn.atualizar(andando, rot, 0);
  }

  // Animação suave nos billboards de monstros e pistas + orientação para câmera
  const pulso = Math.sin(agora * 0.004);
  for (const ent of entidadesMapa) {
    ent.mesh.quaternion.copy(camera.quaternion);
    if (ent.tipo === 'wild' || ent.tipo === 'boss') {
      ent.mesh.position.y = ent.baseY + pulso * 0.14;
    }
  }

  if (VISAO === 'geral') {
    alvoCamera.x = 0;
    alvoCamera.z = 0;
  } else {
    const seguir = primeiroQuadro ? 1 : 1 - Math.exp(-dt * 14);
    const limX = Math.max(0, LARG / 2 - camera.right);
    const dz = camera.top / SEN;
    const limZ = Math.max(0, ALT / 2 - dz);
    const zDesejado = estado.z + (ehRetrato() ? OFFSET_RETRATO_Z : 0);
    const tx = THREE.MathUtils.clamp(estado.x, -limX, limX);
    const tz = THREE.MathUtils.clamp(zDesejado, -limZ, limZ);
    alvoCamera.x += (tx - alvoCamera.x) * seguir;
    alvoCamera.z += (tz - alvoCamera.z) * seguir;
  }

  posicionarCamera();
  atualizarSaidasEInteracoes(agora);
  jogador.quaternion.copy(camera.quaternion);
  primeiroQuadro = false;

  renderer.render(cena, camera);
  requestAnimationFrame(quadro);
}

window.addEventListener('resize', () => {
  enquadrar();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

// ---- API de inspeção e testes automatizados ----
window.regiao1 = {
  mapaAtual: () => (mapaAtual ? mapaAtual.id : null),
  irPara: (id, px = null) => entrarNoMapa(id, px, false),
  moverPx: (px, py) => { const w = P(px, py); estado.x = w.x; estado.z = w.z; primeiroQuadro = true; },
  estado: () => ({ x: estado.x, z: estado.z, px: W2P(estado.x, estado.z) }),
  save: () => save,
  salvar: salvarEstado,
  resetarSave: () => { localStorage.removeItem(SAVE_KEY_REGIAO1); save = criarEstadoInicial(); salvarEstado(); },
  forma: () => save.forma,
  setForma: (f) => aplicarForma(f),
  escalaPersonagem: () => ({ base: ALTURA_BASE_PERSONAGEM, fator: FATOR_ESCALA_PERSONAGEM, final: ALTURA_PERSONAGEM }),
  cameraInfo: () => ({
    retrato: ehRetrato(),
    alturaPaisagem,
    alturaRetrato,
    offsetRetratoZ: ehRetrato() ? OFFSET_RETRATO_Z : 0,
    alvo: { ...alvoCamera },
  }),
  interagir: executarInteracao,
  teleportes: () => save.teleportes,
  quests: () => save.quests,
  mapasDisponiveis: () => [...ORDEM_MAPAS],
  vencerBatalhaAtual: () => { if (batalhaAtiva) encerrarBatalha(true); },
};

// Inicialização
aplicarForma(params.get('forma') || save.forma || 'noctarn');
const inicialParam = params.get('mapa')?.toUpperCase();
const inicialId = (inicialParam && MAPAS[inicialParam]) ? inicialParam : (MAPAS[save.mapaAtual] ? save.mapaAtual : MAPA_INICIAL);
const spawnInicial = (!inicialParam && inicialId === save.mapaAtual && save.posicaoPx) ? save.posicaoPx : null;
entrarNoMapa(inicialId, spawnInicial, false);
requestAnimationFrame(quadro);
