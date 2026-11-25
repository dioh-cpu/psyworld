// Confusion Waves — Explorador da Região 1
import * as THREE from 'three';
import { adicionarIdleNpc } from './npc-idle-video.js';
import { vetorJoystick } from '../explorar3d/controles.js';
import { construirSDF, resolverMovimentoSDF } from '../explorar3d/colisao.js';
import { criarAzazel } from './azazel.js';
import { criarNoctarn } from './noctarn.js';
import { criarEspiritoIdle } from './espirito-idle.js';
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

import {
  garantirEstadoIdle,
  registrarCodexArea,
  calcularStatusDetalhado,
  escolherHabilidadeAuto,
  resolverAbateAuto,
  avancarDiaria,
  registrarLogIdle,
} from './regiao1-idle.js';
import { criarControladorIdleUI } from './regiao1-ui-idle.js';
import { iniciarMundo } from './regiao1-mundo.js';
import { iniciarLayout } from './regiao1-layout.js';
import { iniciarCiclo } from './regiao1-ciclo.js';
import { CICLO_C1 } from './regiao1-ciclo-c1.js';
import { iniciarEstrategia } from './regiao1-estrategia.js';
import { ESTRATEGIA_C1 } from './regiao1-estrategia-c1.js';
import { ESTRATEGIA_R2 } from './regiao1-estrategia-r2.js';

// ---- Constantes de mundo, escala (+30% aplicado uma vez) e câmera calibrada ----
const LARG = 106;
const ALT = LARG * IMG_H / IMG_W;
const params = new URLSearchParams(location.search);

const ALTURA_BASE_PERSONAGEM = 5.54;
const FATOR_ESCALA_PERSONAGEM = Number(params.get('escala')) || 1.30; // +30% sobre a base -> 7.20 unidades
const ALTURA_PERSONAGEM = ALTURA_BASE_PERSONAGEM * FATOR_ESCALA_PERSONAGEM;
const RAIO = 0.35; // colisão preservada conforme especificação
const VELOCIDADE_BASE = 8.7; // +50% sobre a velocidade base anterior (5.8 -> 8.7 u/s)
const MULT_ONIRICO = 2.0;    // Transformar (Conexão Onírica): +100% de velocidade (17.4 u/s)
const VERSAO_ASSETS = 'r1_48_v4';

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
const ZOOM_PADRAO = 1.97;          // 197%: zoom aprovado em teste, padrão em paisagem
const ALTURA_PAISAGEM_PADRAO = ALTURA_MAX / ZOOM_PADRAO;
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

// ---- Persistência (save compartilhado entre Modo Idle e Modo Campanha) ----
let save = criarEstadoInicial();
const CHAVE_BACKUP = `${SAVE_KEY_REGIAO1}.backup`;
const CHAVE_CORROMPIDO = `${SAVE_KEY_REGIAO1}.corrompido`;
let avisoSave = null; // mostrado como toast assim que a interface existir
const saveLegivel = (txt) => { try { const o = JSON.parse(txt); return Boolean(o && typeof o === 'object' && o.mapaAtual); } catch { return false; } };
try {
  const raw = localStorage.getItem(SAVE_KEY_REGIAO1);
  if (!params.get('novosave')) {
    if (raw && saveLegivel(raw)) save = desserializarEstado(raw);
    else {
      // save principal ilegível: guarda a cópia estragada e tenta o backup, em vez de recomeçar do zero em silêncio
      if (raw) localStorage.setItem(CHAVE_CORROMPIDO, raw);
      const bk = localStorage.getItem(CHAVE_BACKUP);
      if (bk && saveLegivel(bk)) { save = desserializarEstado(bk); avisoSave = '⚠️ Seu save estava corrompido. Restauramos o backup mais recente.'; }
      else if (raw) avisoSave = '⚠️ Seu save estava corrompido e não há backup. Começando do zero (a cópia estragada foi guardada).';
    }
  }
} catch (_) {}
garantirEstadoIdle(save);

let ultimoBackupMs = 0;
let avisouFalhaSave = false;
function salvarEstado() {
  try {
    const idle = garantirEstadoIdle(save);
    idle.ultimoTickMs = Date.now();
    save.mapaAtual = mapaAtual ? mapaAtual.id : save.mapaAtual;
    save.posicaoPx = W2P(estado.x, estado.z);
    const novo = serializarEstado(save);
    // backup rotativo: a cada 60 s guarda o save anterior (que estava bom) antes de sobrescrever
    const agora = Date.now();
    if (agora - ultimoBackupMs > 60000) {
      const atual = localStorage.getItem(SAVE_KEY_REGIAO1);
      if (atual && saveLegivel(atual)) localStorage.setItem(CHAVE_BACKUP, atual);
      ultimoBackupMs = agora;
    }
    localStorage.setItem(SAVE_KEY_REGIAO1, novo);
  } catch (e) {
    if (!avisouFalhaSave) { avisouFalhaSave = true; setTimeout(() => mostrarToast?.('⚠️ Não foi possível salvar (armazenamento cheio ou bloqueado). Exporte seu save em Configurações.', 6000), 0); }
  }
}

// ---- Piso + Caches ----
const carregador = new THREE.TextureLoader();
const cacheTexturas = new Map();
const cacheSdfs = new Map();
const cacheGrids = new Map();
const GRID_W = 128;
const GRID_H = 71;

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

      // Grade leve 128x71 para pathfinding (clique no mapa e Auto-Rota)
      const g = new Uint8Array(GRID_W * GRID_H);
      for (let gy = 0; gy < GRID_H; gy++) {
        const sy = Math.min(sh - 1, Math.floor((gy + 0.5) * sh / GRID_H));
        for (let gx = 0; gx < GRID_W; gx++) {
          const sx = Math.min(sw - 1, Math.floor((gx + 0.5) * sw / GRID_W));
          g[gy * GRID_W + gx] = walk[sy * sw + sx];
        }
      }
      cacheGrids.set(mapa.id, g);
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

// Marcador visual no chão para clique do mouse / destino da Auto-Rota
const marcadorDestino = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.strokeStyle = '#38bdf8';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(48, 48, 34, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(56, 189, 248, 0.25)';
  g.beginPath();
  g.arc(48, 48, 16, 0, Math.PI * 2);
  g.fill();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false })
  );
  m.renderOrder = 1;
  m.visible = false;
  cena.add(m);
  return m;
})();

// ---- Personagens controlados: forma onírica e Azazel ----
const testeEspirito = params.get('idle') === 'espirito';
const azazel = criarAzazel('assets/characters/', ALTURA_PERSONAGEM, true); // adiado: os vídeos baixam depois do início
const formaOnirica = testeEspirito
  ? criarEspiritoIdle(ALTURA_PERSONAGEM)
  : criarNoctarn('../../../assets/monsters/noctarn/', ALTURA_PERSONAGEM);

const jogador = new THREE.Group();
jogador.add(azazel.malha, formaOnirica.malha);
jogador.traverse((o) => {
  if (o.material) {
    o.material.depthTest = false;
    o.material.transparent = true;
    o.renderOrder = 4;
  }
});
cena.add(jogador);

const btnTransformar = document.getElementById('btn-transformar');
function aplicarForma(novaForma, anunciar = false) {
  save.forma = novaForma === 'azazel' ? 'azazel' : 'noctarn';
  const onirico = save.forma === 'noctarn';
  azazel.malha.visible = !onirico;
  formaOnirica.malha.visible = onirico;
  if (!onirico) formaOnirica.pausar();
  if (btnTransformar) {
    btnTransformar.classList.toggle('ativo', onirico);
    btnTransformar.textContent = onirico
      ? (testeEspirito ? '✨ Espírito da Floresta' : '✨ Onírico (+100% Vel.)')
      : '✨ Transformar';
  }
  if (anunciar) {
    mostrarToast(onirico
      ? `✨ Conexão Onírica ativa! Transformado em ${testeEspirito ? 'Espírito da Floresta' : 'Noctarn'} (+100% de velocidade).`
      : 'Conexão Onírica encerrada. De volta à forma humana (Azazel).', 2400);
  }
  salvarEstado();
}
function alternarTransformacao() {
  aplicarForma(save.forma === 'noctarn' ? 'azazel' : 'noctarn', true);
}
btnTransformar?.addEventListener('click', alternarTransformacao);

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

// ---- Texturas dinâmicas de identificação ----
function criarTexturaNomeNpc(npc, temQuest) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 48;
  const g = c.getContext('2d');
  g.beginPath();
  g.roundRect(4, 3, 184, 42, 7);
  g.fillStyle = '#11191ef0';
  g.fill();
  g.strokeStyle = temQuest ? '#dab77b' : '#80674c';
  g.lineWidth = 2;
  g.stroke();

  g.fillStyle = '#f3e7db';
  g.font = '700 20px system-ui';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const nome = npc.nome.split(',')[0];
  g.fillText(nome, temQuest ? 84 : 96, 24, temQuest ? 140 : 170);
  if (temQuest) {
    g.fillStyle = '#f1c784';
    g.fillText('!', 166, 24);
  }
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
    ch.userData.limparIdle?.();
    ch.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material?.map?.isCanvasTexture) obj.material.map.dispose();
      obj.material?.dispose();
    });
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

// NPCs têm o tamanho do Azazel (ALTURA_PERSONAGEM) +7%; raças pequenas usam `proporcao` (ex.: goblins 0.9)
const FATOR_NPC = 1.07;
const alturaDoNpc = (npc) => ALTURA_PERSONAGEM * FATOR_NPC * (npc.proporcao ?? 1);

function criarMonstroSelvagem(m) {
  const w = P(m.pos[0], m.pos[1]);
  const tex = carregarTextura(m.sprite);
  const mesh = adicionarBillboard(tex, w.x, w.z, 6.4, 6.4, 3);
  const ent = { tipo: 'wild', dados: m, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 3.1, raioInteracao: 5.8 };
  entidadesMapa.push(ent);
  return ent;
}

// Remove só uma entidade (o monstro abatido), sem recriar NPCs e vídeos, que piscavam a cada abate do auto-caça
function removerEntidade(ent) {
  const i = entidadesMapa.indexOf(ent);
  if (i >= 0) entidadesMapa.splice(i, 1);
  grupoEntidades.remove(ent.mesh);
  ent.mesh.userData.limparIdle?.();
  ent.mesh.traverse((obj) => {
    obj.geometry?.dispose();
    if (obj.material?.map?.isCanvasTexture) obj.material.map.dispose();
    obj.material?.dispose();
  });
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
    const altNpc = alturaDoNpc(npc);
    const mesh = adicionarBillboard(carregarTextura(npc.sprite), w.x, w.z, altNpc * 0.8, altNpc);
    if (npc.flutua) mesh.position.y += 0.5;
    if (npc.idle) adicionarIdleNpc(mesh, npc.idle);
    const placa = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 1.35),
      new THREE.MeshBasicMaterial({
        map: criarTexturaNomeNpc(npc, temQuest), transparent: true, depthTest: false, depthWrite: false,
      }),
    );
    placa.position.y = altNpc / 2 + 0.5;
    placa.renderOrder = 4;
    mesh.add(placa);
    entidadesMapa.push({ tipo: 'npc', dados: npc, mesh, x: w.x, z: w.z, baseY: mesh.position.y, raio: 6.2 });
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
    criarMonstroSelvagem(m);
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
const btnFazenda = document.getElementById('btn-fazenda');
const questBanner = document.getElementById('quest-banner');
const qbTitulo = document.getElementById('qb-titulo');
const qbSub = document.getElementById('qb-sub');
const qbAuto = document.getElementById('qb-auto');
let questDestaqueId = null;

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

let idleUI = null;

function atualizarHudEstado() {
  if (hudRecursos) hudRecursos.textContent = `${save.recompensas.gold}g · ${save.recompensas.diamantes}💎`;
  if (btnFazenda) btnFazenda.style.display = save.desbloqueios.fazenda ? 'inline-flex' : 'none';

  // Destaque da quest em auto-rota ou primeira quest ativa no banner
  const ativa = (autoRotaQuestId && QUESTS_POR_ID[autoRotaQuestId] && save.quests[autoRotaQuestId] !== 'concluida'
    ? QUESTS_POR_ID[autoRotaQuestId]
    : null)
    || QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'ativa')
    || QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'disponivel');
  questDestaqueId = ativa ? ativa.id : null;
  if (ativa) {
    const prog = progressoQuest(save, ativa.id);
    qbTitulo.textContent = `${ativa.titulo} (${prog.feitos}/${prog.total})`;
    qbSub.textContent = `${ativa.mapas.join(' → ')} · ${ativa.resumo.slice(0, 74)}${ativa.resumo.length > 74 ? '…' : ''}`;
    const rodando = Boolean(autoRotaQuestId);
    questBanner?.classList.toggle('autorota', rodando);
    if (qbAuto) qbAuto.textContent = rodando ? '⏹ Parar Rota' : '🧭 Auto-Rota';
  } else {
    qbTitulo.textContent = 'Região 1 concluída!';
    qbSub.textContent = 'Todas as missões ativas foram completadas.';
    questBanner?.classList.remove('autorota');
    if (qbAuto) qbAuto.textContent = '✓ Concluído';
  }
  idleUI?.atualizarHudIdle();
}

questBanner?.addEventListener('click', () => {
  if (autoRotaQuestId) {
    pararNavegacao(true);
    mostrarToast('Auto-Rota pausada.', 1800);
  } else if (questDestaqueId) {
    iniciarAutoRota(questDestaqueId);
  }
});

// Modais helpers
function abrirModal(id) { document.getElementById(id)?.classList.add('aberto'); }
function fecharModal(id) {
  document.getElementById(id)?.classList.remove('aberto');
  if (id === 'modal-dialogo') clearInterval(timerDigitacao);
  if (id === 'modal-dialogo' && autoRotaQuestId) {
    setTimeout(() => { if (!batalhaBloqueando() && !dialogoAberto() && autoRotaQuestId) planejarPassoAutoRota(); }, 80);
  }
}
function algumModalAberto() { return Boolean(document.querySelector('.modal-bg.aberto')); }
function batalhaBloqueando() { return Boolean(batalhaAtiva || document.getElementById('modal-batalha')?.classList.contains('aberto')); }
function dialogoAberto() { return Boolean(document.getElementById('modal-dialogo')?.classList.contains('aberto')); }

document.querySelectorAll('[data-fechar]').forEach((btn) => {
  btn.addEventListener('click', () => fecharModal(btn.getAttribute('data-fechar')));
});

btnFazenda?.addEventListener('click', () => {
  abrirDialogo('🌱 Fazenda da Cidade', 'Desbloqueio de Missão Secundária (C1)',
    'A Fazenda está liberada! Os monstros capturados na Região 1 podem produzir suprimentos aqui sem interferir na progressão do trem.',
    [{ rotulo: 'Fechar', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]
  );
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
      const podeSeguir = st === 'ativa' || st === 'disponivel';
      el.innerHTML = `
        <div class="q-top">
          <b>${q.titulo} <span style="color:#94b3d4;font-weight:500">(${q.mapas.join(' → ')})</span></b>
          <div style="display:flex;gap:5px;align-items:center">
            ${podeSeguir ? `<button class="btn-hud" data-autorota="${q.id}" style="padding:2px 7px;font-size:10.5px;border-color:#38bdf8">🧭 Seguir</button>` : ''}
            <span class="q-badge ${st}">${st}</span>
          </div>
        </div>
        <div style="margin-top:3px;color:#cbd5e1">${q.resumo}</div>
        <ul class="q-passos">${passosHtml}</ul>
      `;
      lista.appendChild(el);
    }
  }
  lista.querySelectorAll('[data-autorota]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qid = btn.getAttribute('data-autorota');
      fecharModal('modal-diario');
      iniciarAutoRota(qid);
    });
  });
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
let timerDigitacao;
function retratoNpc(npc, pagina) {
  return npc.sprite.replace('/npcs/', '/retratos/').replace('.webp', `-${npc.expressoes[pagina]}.webp`);
}

function abrirDialogo(titulo, sub, texto, botoes, retrato = null) {
  clearInterval(timerDigitacao);
  document.getElementById('modal-dialogo').classList.toggle('conversa-npc', Array.isArray(texto));
  const imagem = document.getElementById('dlg-retrato');
  imagem.hidden = !retrato;
  if (typeof retrato === 'string') imagem.src = retrato;
  else imagem.removeAttribute('src');
  document.getElementById('dlg-titulo').textContent = titulo;
  document.getElementById('dlg-sub').textContent = sub || '';
  const fala = document.getElementById('dlg-texto');
  const anuncio = document.getElementById('dlg-anuncio');
  const progresso = document.getElementById('dlg-progresso');
  const falas = Array.isArray(texto) ? texto : [texto];
  progresso.hidden = falas.length < 2;
  if (progresso.hidden) progresso.textContent = '';
  const ac = document.getElementById('dlg-acoes');
  ac.replaceChildren();
  const acoesFinais = botoes.map((b) => {
    const btn = document.createElement('button');
    btn.className = b.prim ? 'btn-pri' : 'btn-sec';
    btn.textContent = b.rotulo;
    btn.onclick = b.aoClicar;
    return btn;
  });
  if (falas.length > 1) {
    let pagina = 0;
    const anterior = document.createElement('button');
    anterior.className = 'btn-sec';
    anterior.textContent = 'Anterior';
    const proxima = document.createElement('button');
    proxima.className = 'btn-pri';
    proxima.textContent = 'Próxima fala';
    const revelar = document.createElement('button');
    revelar.className = 'btn-sec';
    revelar.textContent = 'Mostrar fala';
    const mostrarTudo = () => {
      clearInterval(timerDigitacao);
      fala.textContent = falas[pagina];
      revelar.hidden = true;
      if (document.activeElement === revelar) {
        (proxima.hidden ? acoesFinais[0] : proxima)?.focus();
      }
    };
    revelar.onclick = mostrarTudo;
    const mostrarFala = () => {
      clearInterval(timerDigitacao);
      if (typeof retrato === 'function') imagem.src = retrato(pagina);
      anuncio.textContent = falas[pagina];
      progresso.textContent = `${pagina + 1} de ${falas.length}`;
      anterior.hidden = pagina === 0;
      proxima.hidden = pagina === falas.length - 1;
      for (const btn of acoesFinais) btn.hidden = !proxima.hidden;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        mostrarTudo();
        return;
      }
      const caracteres = Array.from(falas[pagina]);
      const inicio = performance.now();
      fala.textContent = '';
      revelar.hidden = false;
      timerDigitacao = setInterval(() => {
        const limite = Math.floor((performance.now() - inicio) / 19);
        if (limite >= caracteres.length) mostrarTudo();
        else fala.textContent = caracteres.slice(0, limite).join('');
      }, 32);
    };
    anterior.onclick = () => {
      pagina--;
      mostrarFala();
      if (anterior.hidden) proxima.focus();
    };
    proxima.onclick = () => {
      if (!revelar.hidden) { mostrarTudo(); return; }
      pagina++;
      mostrarFala();
      if (proxima.hidden) acoesFinais[0]?.focus();
    };
    ac.append(anterior, revelar, proxima, ...acoesFinais);
    mostrarFala();
    abrirModal('modal-dialogo');
    proxima.focus();
    return;
  }
  fala.textContent = falas[0];
  anuncio.textContent = falas[0];
  ac.append(...acoesFinais);
  abrirModal('modal-dialogo');
}

function notificarQuestsConcluidas(concluidas) {
  if (!concluidas || !concluidas.length) return;
  const idle = garantirEstadoIdle(save);
  const nvAntes = calcularStatusDetalhado(save).nivel;
  const xpQuest = concluidas.reduce((acc, q) => acc + (q.recompensa?.xp || 0), 0);
  if (xpQuest > 0) {
    idle.jogador.xp = Math.max(idle.jogador.xp + xpQuest, save.recompensas.xp || 0);
    save.recompensas.xp = idle.jogador.xp;
  }
  const stDepois = calcularStatusDetalhado(save);
  const nomes = concluidas.map((q) => `🏆 ${q.titulo}`).join(' · ');
  if (stDepois.nivel > nvAntes) {
    const ganhoPts = (stDepois.nivel - nvAntes) * 3;
    idle.jogador.hp = stDepois.hpMax;
    registrarLogIdle(idle, `🌟 Domador Nv.${stDepois.nivel}! (+${ganhoPts} pts de atributo)`, 'farm');
    mostrarToast(`🌟 Missão concluída! Domador subiu para o Nv.${stDepois.nivel} (+${ganhoPts} pts)!`, 5000);
  } else {
    mostrarToast(`Missão concluída: ${nomes}`, 4500);
  }
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
  const idle = garantirEstadoIdle(save);
  const st = calcularStatusDetalhado(save);
  const maxJog = st.hpMax;
  const hpJog = Math.max(Math.round(maxJog * 0.5), Math.min(maxJog, idle.jogador.hp));
  batalhaAtiva = {
    tipo,
    entidade,
    hpJog,
    maxJog,
    atkJog: st.atk,
    defJog: st.def,
    nivelJog: st.nivel,
    hpIni: maxIni,
    maxIni,
    nomeIni: ehBoss ? defBoss.nome : `${entidade.especie} (Nv. ${entidade.nivel})`,
  };
  document.getElementById('bat-titulo').textContent = ehBoss ? `⚔️ Chefe · ${defBoss.nome}` : `⚡ Encontro Selvagem`;
  document.getElementById('bat-nome-jog').textContent = `Noctarn · Nv.${st.nivel}`;
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
  const atk = b.atkJog || 22;
  const golpes = [
    { nome: 'Mordida Umbral', dano: [Math.round(atk * 1.15), Math.round(atk * 1.45)] },
    { nome: 'Chama Violeta', dano: [Math.round(atk * 1.4), Math.round(atk * 1.85)] },
    { nome: 'Véu Noturno (Cura)', cura: Math.round(b.maxJog * 0.3) },
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

  const baseContra = b.tipo === 'boss' ? 24 : 14;
  const reducao = Math.floor((b.defJog || 10) * 0.35);
  const contra = Math.max(4, baseContra - reducao);
  b.hpJog = Math.max(1, b.hpJog - contra);
  log.push(`${b.nomeIni} contra-atacou (${contra} de dano).`);
  document.getElementById('bat-log').textContent = log.join(' ');
  renderizarBatalha();
}

function encerrarBatalha(vitoria) {
  if (!batalhaAtiva) return;
  const b = batalhaAtiva;
  const idle = garantirEstadoIdle(save);
  idle.jogador.hp = Math.max(1, Math.min(b.maxJog, b.hpJog));
  batalhaAtiva = null;
  fecharModal('modal-batalha');

  if (vitoria) {
    if (b.tipo === 'boss') {
      const res = registrarVitoriaBoss(save, b.entidade.id);
      idle.codex.bosses[b.entidade.id] = true;
      avancarDiaria(idle, 'bosses', 1);
      registrarLogIdle(idle, `🏆 Chefe derrotado: ${b.nomeIni}!`, 'farm');
      construirEntidadesDoMapa(mapaAtual);
      notificarQuestsConcluidas(res.concluidas);
      if (res.tremLiberadoAgora) {
        mostrarToast('🚂 Espírito da Floresta e Rei Fungo derrotados! O trem em C3 foi liberado!', 5500);
      } else {
        const ret = BOSSES_REGIAO1[b.entidade.id].mapaRetorno;
        mostrarToast(`Vitória contra ${b.nomeIni}! Retorne a pé para ${ret}.`, 4500);
      }
    } else {
      const nvAntes = calcularStatusDetalhado(save).nivel;
      monstrosDerrotadosSessao.add(b.entidade.id);
      save.recompensas.gold += 25;
      idle.jogador.xp += 20;
      save.recompensas.xp = idle.jogador.xp;
      const stDepois = calcularStatusDetalhado(save);
      construirEntidadesDoMapa(mapaAtual);
      if (stDepois.nivel > nvAntes) {
        mostrarToast(`🌟 Vitória sobre ${b.entidade.especie}! Domador Nv.${stDepois.nivel} (+3 pts)!`, 3600);
      } else {
        mostrarToast(`Vitória sobre ${b.entidade.especie}! (+25g, +20 XP)`, 3000);
      }
    }
    atualizarHudEstado();
    salvarEstado();
    if (autoRotaQuestId) {
      setTimeout(() => { if (autoRotaQuestId && !batalhaBloqueando() && !dialogoAberto()) planejarPassoAutoRota(); }, 450);
    }
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
  registrarCodexArea(garantirEstadoIdle(save), destino.id);

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
  if (autoRotaQuestId) {
    planejarPassoAutoRota();
  }
}

seletorMapa.addEventListener('change', () => {
  pararNavegacao(true);
  entrarNoMapa(seletorMapa.value, null, true);
  seletorMapa.blur();
});

// ---- Navegação por Clique no Mapa + Auto-Rota Automática de Missões (48 áreas) ----
let waypointsAtuais = []; // [{ x, z }]
let autoInteragirAoChegar = false;
let autoRotaQuestId = null;
let objetivoAutoRotaAtual = null;
let timerAutoDialogo = null;

function pararNavegacao(cancelarAutoRota = true) {
  waypointsAtuais = [];
  autoInteragirAoChegar = false;
  objetivoAutoRotaAtual = null;
  marcadorDestino.visible = false;
  clearTimeout(timerAutoDialogo);
  timerAutoDialogo = null;
  if (cancelarAutoRota && autoRotaQuestId) {
    autoRotaQuestId = null;
    atualizarHudEstado();
  }
}

function agendarFecharDialogoAuto(ms = 1350) {
  clearTimeout(timerAutoDialogo);
  timerAutoDialogo = setTimeout(() => {
    if (!autoRotaQuestId) return;
    if (document.getElementById('modal-dialogo')?.classList.contains('aberto')) {
      fecharModal('modal-dialogo');
    } else if (!batalhaBloqueando()) {
      planejarPassoAutoRota();
    }
  }, ms);
}

function resolverAlvoDaPista(pistaId) {
  const p = PISTAS_MUNDO.find((x) => x.id === pistaId);
  if (p) return { tipo: 'pista', id: p.id, dados: p, mapa: p.mapa, pos: p.pos, rotulo: p.rotulo, interagir: true };

  const npc = NPCS_REGIAO1.find((n) => n.pistaAoFalar === pistaId);
  if (npc) return { tipo: 'npc', id: npc.id, dados: npc, mapa: npc.mapa, pos: npc.pos, rotulo: npc.nome, interagir: true };

  if (pistaId.startsWith('boss_') && pistaId.endsWith('_derrotado')) {
    const bossId = pistaId.slice(5, -10);
    const b = ENTIDADES_BOSS.find((x) => x.id === bossId);
    if (b) return { tipo: 'boss', id: b.id, dados: b, mapa: b.mapa, pos: b.pos, rotulo: b.nome, interagir: true };
  }

  const marcoPorPista = {
    tp_e8_raizes_limpas: 'E8',
    tp_d9_sequencia_ok: 'D9',
    tp_pc7_marcas_alinhadas: 'PC7',
  };
  if (marcoPorPista[pistaId]) {
    const mid = marcoPorPista[pistaId];
    const m = MAPAS[mid];
    return { tipo: 'marco', id: mid, pistaMarco: pistaId, dados: m.marco, mapa: mid, pos: m.marco.interacao, rotulo: `Marco ${mid}`, interagir: true };
  }

  if (pistaId === 'trem_desembarque_reino') {
    const sa = MAPAS.C3.saidas.find((s) => s.tipo === 'trem');
    const cx = Math.round((sa.rect[0] + sa.rect[2]) / 2);
    const cy = Math.round((sa.rect[1] + sa.rect[3]) / 2);
    return { tipo: 'trem', id: 'TREM', mapa: 'C3', pos: [cx, cy], rotulo: 'Trem para o Reino (C3)', interagir: false };
  }
  return null;
}

function proximoObjetivoQuest(questId) {
  const q = QUESTS_POR_ID[questId];
  if (!q) return null;
  for (const p of q.pistas) {
    if (!save.pistas[p]) {
      const alvo = resolverAlvoDaPista(p);
      if (alvo) return alvo;
    }
  }
  return null;
}

function escolherProximaQuestAutoRota() {
  // Prioriza missões ativas; depois disponíveis (aceitando automaticamente para continuar a jornada)
  const prox = QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'ativa' && proximoObjetivoQuest(q.id))
    || QUESTS_DEFINICOES.find((q) => save.quests[q.id] === 'disponivel' && proximoObjetivoQuest(q.id));
  if (!prox) return null;
  if (save.quests[prox.id] === 'disponivel') {
    const r = aceitarQuest(save, prox.id);
    if (r.concluidas.length) notificarQuestsConcluidas(r.concluidas);
    if (save.quests[prox.id] === 'concluida') return escolherProximaQuestAutoRota();
  }
  return prox.id;
}

function executarObjetivoAutoRota(obj) {
  if (!obj || emTransicao) return;
  const menuAberto = algumModalAberto();
  const idle = garantirEstadoIdle(save);

  if (obj.tipo === 'pista') {
    const p = obj.dados;
    const res = registrarPista(save, p.id);
    notificarQuestsConcluidas(res.concluidas);
    construirEntidadesDoMapa(mapaAtual);
    registrarLogIdle(idle, `✦ Pista coletada: ${p.rotulo} (${mapaAtual.id})`, 'farm');
    atualizarHudEstado();
    salvarEstado();
    if (menuAberto) {
      mostrarToast(`✦ Auto-Rota coletou: ${p.rotulo}`, 2200);
      setTimeout(() => { if (autoRotaQuestId && !batalhaBloqueando()) planejarPassoAutoRota(); }, 350);
    } else {
      abrirDialogo(`✦ ${p.rotulo}`, `Coletado automaticamente (${mapaAtual.id})`, p.texto, [
        { rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
      ]);
      agendarFecharDialogoAuto(1250);
    }
    return;
  }
  if (obj.tipo === 'npc') {
    const npc = obj.dados;
    const concluidas = [];
    if (npc.quest && save.quests[npc.quest] !== 'concluida') {
      concluidas.push(...aceitarQuest(save, npc.quest).concluidas);
    }
    if (npc.pistaAoFalar) {
      concluidas.push(...registrarPista(save, npc.pistaAoFalar).concluidas);
    }
    notificarQuestsConcluidas(concluidas);
    construirEntidadesDoMapa(mapaAtual);
    registrarLogIdle(idle, `💬 Auto-Rota falou com ${npc.nome}`, 'farm');
    atualizarHudEstado();
    salvarEstado();
    if (menuAberto) {
      mostrarToast(`💬 Auto-Rota falou com ${npc.nome}`, 2200);
      setTimeout(() => { if (autoRotaQuestId && !batalhaBloqueando()) planejarPassoAutoRota(); }, 350);
    } else {
      abrirDialogo(npc.nome, 'Conversa automática', npc.dialogo.at(-1), [
        { rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
      ], retratoNpc(npc, npc.dialogo.length - 1));
      agendarFecharDialogoAuto(1450);
    }
    return;
  }
  if (obj.tipo === 'marco') {
    const qId = MARCOS_TELEPORTE[obj.id]?.questId;
    const r1 = qId ? aceitarQuest(save, qId) : { concluidas: [] };
    const r2 = registrarPista(save, obj.pistaMarco);
    notificarQuestsConcluidas([...r1.concluidas, ...r2.concluidas]);
    mostrarToast(`🔷 Marco ${obj.id} ativado automaticamente! Cristal agora brilha em azul.`, 3000);
    setTimeout(() => { if (autoRotaQuestId && !batalhaBloqueando()) planejarPassoAutoRota(); }, 450);
    return;
  }
  if (obj.tipo === 'boss') {
    if (!save.bossesDerrotados[obj.id]) {
      iniciarBatalha('boss', obj.dados);
    } else {
      planejarPassoAutoRota();
    }
  }
}

// BFS no grafo das 48 áreas: devolve a próxima saída do mapaAtual rumo a destinoId
function proximaSaidaParaMapa(origemId, destinoId) {
  if (origemId === destinoId) return null;
  const fila = [origemId];
  const veioDe = new Map([[origemId, null]]);
  while (fila.length) {
    const atual = fila.shift();
    const m = MAPAS[atual];
    if (!m) continue;
    for (const sa of m.saidas) {
      if (!sa.destino || !MAPAS[sa.destino]) continue;
      if (sa.tipo === 'trem' && !save.tremLiberado) continue;
      if (!veioDe.has(sa.destino)) {
        veioDe.set(sa.destino, { de: atual, saida: sa });
        if (sa.destino === destinoId) {
          let cur = destinoId;
          while (veioDe.get(cur) && veioDe.get(cur).de !== origemId) {
            cur = veioDe.get(cur).de;
          }
          return veioDe.get(cur)?.saida || null;
        }
        fila.push(sa.destino);
      }
    }
  }
  return null;
}

function celulaCaminhavelMaisProxima(grid, gx0, gy0) {
  const clampX = (v) => Math.max(0, Math.min(GRID_W - 1, v));
  const clampY = (v) => Math.max(0, Math.min(GRID_H - 1, v));
  const sx = clampX(gx0), sy = clampY(gy0);
  if (grid[sy * GRID_W + sx]) return [sx, sy];
  for (let r = 1; r <= 24; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = sx + dx, ny = sy + dy;
        if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && grid[ny * GRID_W + nx]) {
          return [nx, ny];
        }
      }
    }
  }
  return [sx, sy];
}

// Pathfinding BFS leve na grade 128x71 para contornar pedras, lagoas e pedestais
// Zera na grade as células cobertas por objetos sólidos do mundo, para o caminho contorná-los
function comObstaculosDoMundo(grid) {
  const cs = window.regiaoMundo?.noMapa?.circulosPx?.();
  if (!grid || !cs?.length) return grid;
  const g = grid.slice();
  for (const c of cs) {
    for (let gy = 0; gy < GRID_H; gy++) for (let gx = 0; gx < GRID_W; gx++) {
      if (Math.hypot((gx + 0.5) / GRID_W * IMG_W - c.px, (gy + 0.5) / GRID_H * IMG_H - c.py) < c.r + 6) g[gy * GRID_W + gx] = 0;
    }
  }
  return g;
}

function calcularCaminhoMundo(destX, destZ, opcoes = {}) {
  const grid = comObstaculosDoMundo(opcoes.grid || (mapaAtual ? cacheGrids.get(mapaAtual.id) : null));
  const semCaminho = () => (opcoes.estrito ? null : [{ x: destX, z: destZ }]);
  if (!grid) return semCaminho();

  const w2g = (x, z) => [
    Math.floor((x / LARG + 0.5) * GRID_W),
    Math.floor((z / ALT + 0.5) * GRID_H),
  ];
  const g2w = (gx, gy) => ({
    x: ((gx + 0.5) / GRID_W - 0.5) * LARG,
    z: ((gy + 0.5) / GRID_H - 0.5) * ALT,
  });

  const [sx0, sy0] = w2g(estado.x, estado.z);
  const [tx0, ty0] = w2g(destX, destZ);
  const [sx, sy] = celulaCaminhavelMaisProxima(grid, sx0, sy0);
  const [tx, ty] = celulaCaminhavelMaisProxima(grid, tx0, ty0);

  if (sx === tx && sy === ty) return [{ x: destX, z: destZ }];

  const total = GRID_W * GRID_H;
  const pai = new Int32Array(total).fill(-1);
  const startIdx = sy * GRID_W + sx;
  const goalIdx = ty * GRID_W + tx;
  pai[startIdx] = startIdx;

  const fila = new Int32Array(total);
  let ini = 0, fim = 0;
  fila[fim++] = startIdx;

  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  let achou = false;
  while (ini < fim) {
    const cur = fila[ini++];
    if (cur === goalIdx) { achou = true; break; }
    const cx = cur % GRID_W;
    const cy = (cur / GRID_W) | 0;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      const nIdx = ny * GRID_W + nx;
      if (pai[nIdx] !== -1 || !grid[nIdx]) continue;
      // Evita cortar quinas na diagonal
      if (dx !== 0 && dy !== 0 && (!grid[cy * GRID_W + nx] || !grid[ny * GRID_W + cx])) continue;
      pai[nIdx] = cur;
      fila[fim++] = nIdx;
    }
  }

  if (!achou) return semCaminho();

  const pts = [];
  let cur = goalIdx;
  while (cur !== startIdx) {
    pts.push(g2w(cur % GRID_W, (cur / GRID_W) | 0));
    cur = pai[cur];
  }
  pts.reverse();
  // Simplifica mantendo 1 ponto a cada 3 células + destino final exato
  const simpl = [];
  for (let i = 0; i < pts.length; i += 3) simpl.push(pts[i]);
  simpl.push(g2w(tx, ty));
  return simpl;
}

function definirDestinoMundo(destX, destZ, interagir = false) {
  waypointsAtuais = calcularCaminhoMundo(destX, destZ);
  autoInteragirAoChegar = interagir;
  const ultimoPt = waypointsAtuais[waypointsAtuais.length - 1] || { x: destX, z: destZ };
  marcadorDestino.position.set(ultimoPt.x, camada(ultimoPt.z) - 0.008, ultimoPt.z);
  marcadorDestino.visible = true;
}

function planejarPassoAutoRota() {
  if (!autoRotaQuestId || !mapaAtual) return;
  let obj = proximoObjetivoQuest(autoRotaQuestId);

  // Se a missão atual terminou, avança automaticamente para a próxima missão ativa/disponível!
  if (!obj || save.quests[autoRotaQuestId] === 'concluida') {
    const proxId = escolherProximaQuestAutoRota();
    if (!proxId) {
      pararNavegacao(true);
      mostrarToast('🏆 Todas as missões disponíveis da Região 1 foram concluídas!', 4000);
      return;
    }
    autoRotaQuestId = proxId;
    atualizarHudEstado();
    obj = proximoObjetivoQuest(autoRotaQuestId);
    if (!obj) {
      pararNavegacao(true);
      return;
    }
    mostrarToast(`🧭 Próxima missão automática: ${QUESTS_POR_ID[proxId].titulo}`, 2600);
  }

  objetivoAutoRotaAtual = obj;
  if (obj.mapa === mapaAtual.id) {
    const w = P(obj.pos[0], obj.pos[1]);
    definirDestinoMundo(w.x, w.z, obj.interagir);
    mostrarToast(`🧭 Auto-Rota: indo até ${obj.rotulo} (${obj.mapa})`, 2400);
    return;
  }
  const saida = proximaSaidaParaMapa(mapaAtual.id, obj.mapa);
  if (!saida) {
    pararNavegacao(true);
    mostrarToast(`🧭 Não há rota livre até ${obj.mapa} agora (verifique desbloqueios).`, 3400);
    return;
  }
  const cx = (saida.rect[0] + saida.rect[2]) / 2;
  const cy = (saida.rect[1] + saida.rect[3]) / 2;
  const w = P(cx, cy);
  definirDestinoMundo(w.x, w.z, false);
  mostrarToast(`🧭 Auto-Rota (${obj.mapa}): seguindo via ${saida.rotulo}`, 2200);
}

function iniciarAutoRota(questId) {
  let id = questId || questDestaqueId;
  if (!id || !QUESTS_POR_ID[id] || save.quests[id] === 'concluida') {
    id = escolherProximaQuestAutoRota();
  }
  if (!id) {
    mostrarToast('Nenhuma missão pendente para Auto-Rota.', 2400);
    return false;
  }
  if (save.quests[id] === 'disponivel') {
    const r = aceitarQuest(save, id);
    if (r.concluidas.length) notificarQuestsConcluidas(r.concluidas);
  }
  if (garantirEstadoIdle(save).autoCaca.ativo) {
    garantirEstadoIdle(save).autoCaca.ativo = false;
  }
  autoRotaQuestId = id;
  atualizarHudEstado();
  planejarPassoAutoRota();
  return true;
}

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
  const ciclo = window.regiaoC1?.alvo(estado.x, estado.z); // coleta, canteiro e pista do ciclo de C1
  if (ciclo && ciclo.dist < melhorDist) melhor = ciclo;
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
  if (alvo.tipo === 'ciclo') { alvo.executar(); return; }
  if (alvo.tipo === 'npc') {
    const npc = alvo.dados;
    const concluidas = [];
    if (npc.quest && save.quests[npc.quest] !== 'concluida') {
      concluidas.push(...aceitarQuest(save, npc.quest).concluidas);
    }
    if (npc.pistaAoFalar) {
      concluidas.push(...registrarPista(save, npc.pistaAoFalar).concluidas);
    }
    notificarQuestsConcluidas(concluidas);
    construirEntidadesDoMapa(mapaAtual);
    const ciclo = window.regiaoC1?.dialogo(npc); // fala que muda conforme a obra e a investigação
    abrirDialogo(npc.nome, mapaAtual.nome, ciclo ? ciclo.falas : npc.dialogo, ciclo ? ciclo.botoes : [
      { rotulo: 'Fechar', prim: true, aoClicar: () => fecharModal('modal-dialogo') },
    ], (pagina) => retratoNpc(npc, Math.min(pagina, npc.expressoes.length - 1)));
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

// ---- Controles: clique no mapa, teclado e joystick ----
const _raycaster = new THREE.Raycaster();
const _planoChao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _pontoClique = new THREE.Vector3();
const _ndc = new THREE.Vector2();

function processarCliqueMapa(clientX, clientY) {
  if (VISAO !== 'jogo' || emTransicao || algumModalAberto() || !sdfAtivo) return;
  const rect = canvas.getBoundingClientRect();
  _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  _raycaster.setFromCamera(_ndc, camera);
  if (!_raycaster.ray.intersectPlane(_planoChao, _pontoClique)) return;

  const wx = THREE.MathUtils.clamp(_pontoClique.x, -LARG / 2 + RAIO, LARG / 2 - RAIO);
  const wz = THREE.MathUtils.clamp(_pontoClique.z, -ALT / 2 + RAIO, ALT / 2 - RAIO);

  // Cancelar Auto-Rota anterior ao clicar manualmente no chão
  pararNavegacao(true);

  // Se clicou perto de um NPC, pista, marco, monstro ou boss, vai até ele e interage ao chegar
  let clicouEntidade = false;
  if (mapaAtual?.marco) {
    const mp = P(mapaAtual.marco.pos[0], mapaAtual.marco.pos[1]);
    if (Math.hypot(wx - mp.x, wz - mp.z) < 6.5) {
      const inter = P(mapaAtual.marco.interacao[0], mapaAtual.marco.interacao[1]);
      definirDestinoMundo(inter.x, inter.z, true);
      return;
    }
  }
  for (const ent of entidadesMapa) {
    if (ent.tipo === 'cristal_visual') continue;
    if (Math.hypot(wx - ent.x, wz - ent.z) < 5.0) {
      definirDestinoMundo(ent.x, ent.z, true);
      clicouEntidade = true;
      break;
    }
  }
  if (!clicouEntidade) {
    definirDestinoMundo(wx, wz, false);
  }
}

let arrastandoClique = false;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  arrastandoClique = true;
  processarCliqueMapa(e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', (e) => {
  if (!arrastandoClique || e.pointerType === 'touch') return;
  if (e.buttons & 1) processarCliqueMapa(e.clientX, e.clientY);
});
window.addEventListener('pointerup', () => { arrastandoClique = false; });

const teclas = new Set();
window.addEventListener('keydown', (e) => {
  const alvo = e.target instanceof Element ? e.target : null;
  const campo = alvo?.closest('input, select, textarea, [contenteditable]');
  const botao = alvo?.closest('button, [role="button"]');
  const ativandoBotao = botao && (e.code === 'Space' || e.code === 'Enter');
  if (e.code !== 'Escape' && (e.defaultPrevented || campo || ativandoBotao || algumModalAberto())) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
  if (e.code === 'KeyE' || e.code === 'Enter') executarInteracao();
  if (!e.repeat && (e.code === 'KeyT' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')) {
    if (!algumModalAberto()) alternarTransformacao();
  }
  if (e.code === 'Escape') {
    document.querySelectorAll('.modal-bg.aberto').forEach((m) => {
      if (m.id !== 'modal-batalha') fecharModal(m.id);
    });
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

  // Encontros por aproximação com monstros selvagens ou Boss (durante Auto-Rota ou Auto-Caça, não abre modal para selvagens)
  if (!emTransicao && !algumModalAberto() && agora >= bloqueioEncontroAte) {
    const autoCacaAtivo = Boolean(garantirEstadoIdle(save).autoCaca.ativo);
    for (const ent of entidadesMapa) {
      if (ent.tipo !== 'wild' && ent.tipo !== 'boss') continue;
      if ((autoRotaQuestId || autoCacaAtivo) && ent.tipo === 'wild') continue;
      if (Math.hypot(estado.x - ent.x, estado.z - ent.z) < ent.raio) {
        iniciarBatalha(ent.tipo, ent.dados);
        return;
      }
    }
  }

  // Transições de borda e Trem (Auto-Rota continua atravessando áreas mesmo com menus abertos!)
  if (!emTransicao && !batalhaBloqueando() && (!algumModalAberto() || Boolean(autoRotaQuestId)) && agora >= bloqueioSaidaAte) {
    const dentro = saidasAtuais.find((sa) =>
      estado.x >= sa.x0 && estado.x <= sa.x1 && estado.z >= sa.z0 && estado.z <= sa.z1
    ) || null;

    if (dentro) {
      if (dentro.tipo === 'trem') {
        if (saidaAvisoAtual !== dentro) {
          saidaAvisoAtual = dentro;
          const res = embarcarNoTrem(save);
          if (res.ok) {
            pararNavegacao(true);
            notificarQuestsConcluidas(res.concluidas);
            mostrarToast(res.mensagem, 5000);
            entrarNoMapa('REINO', dentro.chegada, true);
          } else {
            pararNavegacao(true);
            mostrarToast(res.mensagem, 4200);
          }
        }
        return;
      }
      if (dentro.destino && MAPAS[dentro.destino]) {
        waypointsAtuais = [];
        marcadorDestino.visible = false;
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

// ---- Auto-Caça em Tempo Real no Mapa 2D (Idle Principal) ----
let alvoAutoCaca = null;
let proximoGolpeAuto = 0;
let ultimoMinimapa = 0;
let ultimoRenderMs = 0;
const _proj = new THREE.Vector3();

function projetarNaTela(wx, wz) {
  _proj.set(wx, 2.2, wz).project(camera);
  return {
    x: (_proj.x * 0.5 + 0.5) * window.innerWidth,
    y: (-_proj.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function definirAutoCaca(ativo) {
  const idle = garantirEstadoIdle(save);
  idle.autoCaca.ativo = Boolean(ativo);
  if (idle.autoCaca.ativo) {
    pararNavegacao(true);
    alvoAutoCaca = null;
    resetarNavAutoCaca();
    navAutoCaca.bloqueados.clear();
    const temWild = entidadesMapa.some((e) => e.tipo === 'wild');
    if (!temWild) {
      mostrarToast('⚔️ Auto-Caça ligado! Use "Caçar" para ir a uma área com monstros.', 3000);
    } else {
      mostrarToast('⚔️ Auto-Caça ON! Caçando monstros automaticamente no mapa.', 2400);
    }
  } else {
    alvoAutoCaca = null;
    waypointsAtuais = [];
    marcadorDestino.visible = false;
  }
  salvarEstado();
  atualizarHudEstado();
}

document.getElementById('btn-autocaca')?.addEventListener('click', () => {
  const idle = garantirEstadoIdle(save);
  definirAutoCaca(!idle.autoCaca.ativo);
});

// Grade de pathfinding com folga de 1 célula em volta das paredes: o personagem tem raio, então um caminho que raspa
// a quina da máscara trava. Cai para a grade normal se não houver caminho com folga.
const cacheGradesFolga = new Map();
function gradeComFolga(mapaId) {
  if (cacheGradesFolga.has(mapaId)) return cacheGradesFolga.get(mapaId);
  const g = cacheGrids.get(mapaId);
  if (!g) return null;
  const out = new Uint8Array(g.length);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!g[y * GRID_W + x]) continue;
      let livre = true;
      for (let dy = -1; dy <= 1 && livre; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H || !g[ny * GRID_W + nx]) { livre = false; break; }
        }
      }
      out[y * GRID_W + x] = livre ? 1 : 0;
    }
  }
  cacheGradesFolga.set(mapaId, out);
  return out;
}

// Caminho até um ponto do mapa: com folga primeiro, grade normal depois; null se o ponto é inalcançável.
function caminhoAutoCaca(destX, destZ) {
  if (!mapaAtual) return null;
  const folga = gradeComFolga(mapaAtual.id);
  const comFolga = folga && calcularCaminhoMundo(destX, destZ, { grid: folga, estrito: true });
  if (comFolga) return comFolga;
  return calcularCaminhoMundo(destX, destZ, { estrito: true });
}

function comprimentoCaminho(pts) {
  let c = 0, ax = estado.x, az = estado.z;
  for (const p of pts) { c += Math.hypot(p.x - ax, p.z - az); ax = p.x; az = p.z; }
  return c;
}

// Estado da navegação do auto-caça: rota atual, detecção de travamento e alvos temporariamente descartados.
const navAutoCaca = { rota: [], ultimaPos: null, ultimoCheck: 0, travado: 0, bloqueados: new Map(), avisouSemAlvo: false };
const BLOQUEIO_ALVO_MS = 15000;

function resetarNavAutoCaca() {
  navAutoCaca.rota = [];
  navAutoCaca.ultimaPos = null;
  navAutoCaca.travado = 0;
}

// Escolhe o alvo pelo menor CAMINHO (não pela distância em linha reta) e ignora os inalcançáveis ou descartados.
function escolherAlvoAutoCaca(agora, idle) {
  let melhor = null;
  let melhorComp = Infinity;
  let melhorRota = null;
  for (const ent of entidadesMapa) {
    if (ent.tipo !== 'wild') continue;
    if (idle.autoCaca.alvosIgnorados.includes(ent.dados.especie)) continue;
    const ate = navAutoCaca.bloqueados.get(ent.dados.id);
    if (ate && ate > agora) continue;
    const rota = caminhoAutoCaca(ent.x, ent.z);
    if (!rota) { navAutoCaca.bloqueados.set(ent.dados.id, agora + BLOQUEIO_ALVO_MS); continue; }
    const comp = comprimentoCaminho(rota);
    if (comp < melhorComp) { melhorComp = comp; melhor = ent; melhorRota = rota; }
  }
  if (melhor) {
    navAutoCaca.rota = melhorRota;
    navAutoCaca.ultimaPos = { x: estado.x, z: estado.z };
    navAutoCaca.ultimoCheck = agora;
    navAutoCaca.travado = 0;
    navAutoCaca.avisouSemAlvo = false;
  }
  return melhor;
}

// Gancho para as habilidades dos Oníricos usadas FORA da batalha por turnos (auto-caça no mapa). Cada item:
// { id, pronta(agora, alvo) => boolean, usar(agora, alvo) => { dano, ... } }. Enquanto a lista estiver vazia, vale o golpe normal.
const habilidadesOniricasForaDaBatalha = [];

function golpearAlvoAuto(agora, idle) {
  proximoGolpeAuto = agora + 680;
  const st = calcularStatusDetalhado(save);
  const hab = escolherHabilidadeAuto('Noctarn', alvoAutoCaca.dados.especie, idle.autoCaca.preferirVantagem);
  const crit = Math.random() < 0.22;
  const mundoMod = window.regiaoMundo?.modificadores?.() || { dano: 1, ouro: 1 };
  const dano = Math.max(12, Math.round(st.atk * hab.mult * mundoMod.dano * (crit ? 1.5 : 1) * (0.9 + Math.random() * 0.2)));
  alvoAutoCaca._hp -= dano;

  if (!algumModalAberto()) {
    const pt = projetarNaTela(alvoAutoCaca.x, alvoAutoCaca.z);
    idleUI?.spawnFlutuante(pt.x, pt.y - 18, crit ? `⚡ -${dano}!` : `-${dano}`, crit ? '#fb923c' : '#fde047', crit);
  }

  if (alvoAutoCaca._hp <= 0) {
    const morto = alvoAutoCaca.dados;
    const res = resolverAbateAuto(save, morto);
    const ouroExtra = Math.round(res.gold * (mundoMod.ouro - 1));
    if (ouroExtra) { save.recompensas.gold = Math.max(0, save.recompensas.gold + ouroExtra); res.gold += ouroExtra; }
    window.regiaoMundo?.aoAbater?.(morto);
    if (!algumModalAberto()) {
      const pt = projetarNaTela(alvoAutoCaca.x, alvoAutoCaca.z);
      idleUI?.spawnFlutuante(pt.x, pt.y - 42, `+${res.gold}g  +${res.xp} XP`, '#4ade80', false);
      if (res.capturado) {
        idleUI?.spawnFlutuante(pt.x, pt.y - 64, `✨ Capturou ${morto.especie}!`, '#38bdf8', true);
      }
      if (res.ovoDrop) {
        idleUI?.spawnFlutuante(pt.x, pt.y - 84, `🥚 Ovo de ${morto.especie}!`, '#facc15', true);
      }
    }
    registrarLogIdle(
      idle,
      `⚔️ ${morto.especie} Nv.${morto.nivel} → +${res.gold}g +${res.xp}XP${res.capturado ? ' · ✨Capturado' : ''}${res.ovoDrop ? ' · 🥚Ovo' : ''}`,
      'farm'
    );
    if (res.subiuNivel) {
      mostrarToast(`🌟 Domador subiu para o Nível ${res.novoNivel}! (+3 Pontos de Atributo)`, 3400);
    }
    // Remove e agenda respawn automático em 5s para farm contínuo
    monstrosDerrotadosSessao.add(morto.id);
    const idRespawn = morto.id;
    const mapaOrigem = mapaAtual?.id;
    const abatido = alvoAutoCaca;
    alvoAutoCaca = null;
    resetarNavAutoCaca();
    removerEntidade(abatido);
    atualizarHudEstado();
    salvarEstado();
    setTimeout(() => {
      monstrosDerrotadosSessao.delete(idRespawn);
      const jaExiste = entidadesMapa.some((e) => e.tipo === 'wild' && e.dados.id === idRespawn);
      if (mapaAtual?.id === mapaOrigem && !jaExiste) criarMonstroSelvagem(morto);
    }, window.regiaoMundo?.tempoRespawn?.(morto.especie) ?? 5000);
  }
}

function atualizarAutoCaca(agora, dt, vel) {
  const idle = garantirEstadoIdle(save);
  if (!idle.autoCaca.ativo || emTransicao || batalhaBloqueando() || !sdfAtivo) return { andando: false, rot: 0 };

  // Verifica se o alvo atual ainda existe
  if (alvoAutoCaca && !entidadesMapa.includes(alvoAutoCaca)) { alvoAutoCaca = null; resetarNavAutoCaca(); }

  if (!alvoAutoCaca) {
    alvoAutoCaca = escolherAlvoAutoCaca(agora, idle);
    if (!alvoAutoCaca) {
      // Nada alcançável agora: fica parado (animação de parado) em vez de empurrar parede; tenta de novo quando algo nascer
      if (!navAutoCaca.avisouSemAlvo && entidadesMapa.some((e) => e.tipo === 'wild')) {
        navAutoCaca.avisouSemAlvo = true;
        mostrarToast('⚔️ Auto-Caça: os monstros desta área estão fora de alcance. Aguardando…', 2600);
      }
      return { andando: false, rot: 0 };
    }
    if (!alvoAutoCaca._hp) alvoAutoCaca._hp = 50 + alvoAutoCaca.dados.nivel * 12;
  }

  const vx = alvoAutoCaca.x - estado.x;
  const vz = alvoAutoCaca.z - estado.z;
  const dist = Math.hypot(vx, vz);

  if (dist > 5.2) {
    // Detecção de travamento: se quase não saiu do lugar em ~0,35 s, refaz a rota; travado por ~1 s, descarta o alvo
    if (!navAutoCaca.ultimaPos) { navAutoCaca.ultimaPos = { x: estado.x, z: estado.z }; navAutoCaca.ultimoCheck = agora; }
    if (agora - navAutoCaca.ultimoCheck >= 350) {
      const andou = Math.hypot(estado.x - navAutoCaca.ultimaPos.x, estado.z - navAutoCaca.ultimaPos.z);
      navAutoCaca.ultimaPos = { x: estado.x, z: estado.z };
      navAutoCaca.ultimoCheck = agora;
      if (andou < vel * 0.35 * 0.35) {
        navAutoCaca.travado++;
        if (navAutoCaca.travado >= 3) {
          navAutoCaca.bloqueados.set(alvoAutoCaca.dados.id, agora + BLOQUEIO_ALVO_MS);
          alvoAutoCaca = null;
          resetarNavAutoCaca();
          return { andando: false, rot: 0 };
        }
        navAutoCaca.rota = caminhoAutoCaca(alvoAutoCaca.x, alvoAutoCaca.z) || [];
      } else {
        navAutoCaca.travado = 0;
      }
    }
    if (!navAutoCaca.rota.length) navAutoCaca.rota = caminhoAutoCaca(alvoAutoCaca.x, alvoAutoCaca.z) || [];
    if (!navAutoCaca.rota.length) {
      navAutoCaca.bloqueados.set(alvoAutoCaca.dados.id, agora + BLOQUEIO_ALVO_MS);
      alvoAutoCaca = null;
      return { andando: false, rot: 0 };
    }

    // Segue os pontos da rota; o último ponto é o do alvo, mas para ao chegar no alcance de ataque
    while (navAutoCaca.rota.length > 1 && Math.hypot(navAutoCaca.rota[0].x - estado.x, navAutoCaca.rota[0].z - estado.z) < 1.1) {
      navAutoCaca.rota.shift();
    }
    const alvoPt = navAutoCaca.rota[0];
    const wx = alvoPt.x - estado.x;
    const wz = alvoPt.z - estado.z;
    const wd = Math.hypot(wx, wz) || 1;
    const rot = Math.atan2(wx, wz);
    const passo = Math.min(Math.max(0, dist - 4.5), vel * dt);
    const p = resolverMovimentoSDF({ x: estado.x, z: estado.z }, (wx / wd) * passo, (wz / wd) * passo, RAIO, sdfAtivo);
    estado.x = THREE.MathUtils.clamp(p.x, -LARG / 2 + RAIO, LARG / 2 - RAIO);
    estado.z = THREE.MathUtils.clamp(p.z, -ALT / 2 + RAIO, ALT / 2 - RAIO);
    return { andando: true, rot };
  }

  // Em alcance: ataque em tempo real direto no mapa (sem modal!)
  const rot = Math.atan2(vx, vz);
  if (agora >= proximoGolpeAuto) golpearAlvoAuto(agora, idle);
  return { andando: false, rot };
}

// ---- Loop principal ----
let ultimo = performance.now();

function velocidadeAtual() {
  // Forma Onírica (Transformar / Conexão Onírica) = +100% de velocidade (2.0x)
  return VELOCIDADE_BASE * (save.forma === 'noctarn' ? MULT_ONIRICO : 1);
}

function quadro(agora) {
  requestAnimationFrame(quadro);
  const idle = garantirEstadoIdle(save);
  const minFrameMs = idle.config.economiaEnergia ? 450 : (idle.config.fpsLimite === 30 ? 32 : 0);
  if (minFrameMs && agora - ultimoRenderMs < minFrameMs) return;
  ultimoRenderMs = agora;

  const dt = Math.min(0.08, (agora - ultimo) / 1000);
  ultimo = agora;

  let andando = false;
  let rot = 0;

  // Auto-Caça e Auto-Rota NÃO pausam ao abrir menus (apenas batalha de Chefe pausa movimento)
  if (VISAO === 'jogo' && !emTransicao && !batalhaBloqueando() && sdfAtivo) {
    const modalAberto = algumModalAberto();
    let ix = modalAberto ? 0 : joy.x;
    let iz = modalAberto ? 0 : joy.z;
    if (!modalAberto) {
      if (pressionada('KeyW', 'ArrowUp')) iz += 1;
      if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
      if (pressionada('KeyD', 'ArrowRight')) ix += 1;
      if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
    }
    const forca = Math.min(1, Math.hypot(ix, iz));

    let dx = 0;
    let dz = 0;
    const vel = velocidadeAtual();
    const podeSeguirWaypoints = waypointsAtuais.length > 0 && (autoRotaQuestId ? !dialogoAberto() : !modalAberto);

    if (forca > 1e-3) {
      if (waypointsAtuais.length || autoRotaQuestId) pararNavegacao(true);
      if (idle.autoCaca.ativo) definirAutoCaca(false);
      dx = ix;
      dz = -iz;
      const n = Math.hypot(dx, dz) || 1;
      andando = true;
      rot = Math.atan2(dx, dz);
      dx = (dx / n) * forca * vel * dt;
      dz = (dz / n) * forca * vel * dt;
    } else if (podeSeguirWaypoints) {
      while (waypointsAtuais.length > 1) {
        const d0 = Math.hypot(waypointsAtuais[0].x - estado.x, waypointsAtuais[0].z - estado.z);
        if (d0 < 1.1) waypointsAtuais.shift();
        else break;
      }
      const alvo = waypointsAtuais[0];
      const vx = alvo.x - estado.x;
      const vz = alvo.z - estado.z;
      const dist = Math.hypot(vx, vz);
      const tolChegada = autoInteragirAoChegar ? 2.4 : 0.75;
      if (dist <= tolChegada) {
        const deveInteragir = autoInteragirAoChegar;
        waypointsAtuais = [];
        autoInteragirAoChegar = false;
        marcadorDestino.visible = false;
        if (deveInteragir) {
          if (autoRotaQuestId && objetivoAutoRotaAtual && objetivoAutoRotaAtual.mapa === mapaAtual?.id) {
            executarObjetivoAutoRota(objetivoAutoRotaAtual);
          } else {
            executarInteracao();
          }
        }
      } else {
        andando = true;
        rot = Math.atan2(vx, vz);
        const passo = Math.min(dist, vel * dt);
        dx = (vx / dist) * passo;
        dz = (vz / dist) * passo;
      }
    } else if (idle.autoCaca.ativo) {
      const ac = atualizarAutoCaca(agora, dt, vel);
      andando = ac.andando;
      rot = ac.rot;
    }

    if (andando && (dx !== 0 || dz !== 0)) {
      const antesX = estado.x;
      const antesZ = estado.z;
      const p = resolverMovimentoSDF({ x: estado.x, z: estado.z }, dx, dz, RAIO, sdfAtivo);
      estado.x = THREE.MathUtils.clamp(p.x, -LARG / 2 + RAIO, LARG / 2 - RAIO);
      estado.z = THREE.MathUtils.clamp(p.z, -ALT / 2 + RAIO, ALT / 2 - RAIO);
      if (!autoRotaQuestId && waypointsAtuais.length && Math.hypot(estado.x - antesX, estado.z - antesZ) < 1e-4) {
        pararNavegacao(false);
      }
    }
  }

  // Modo Economia de Energia: mantém farm e HUD leve sem renderizar WebGL
  if (idle.config.economiaEnergia) {
    if (testeEspirito) formaOnirica.pausar();
    if (agora - ultimoMinimapa > 900) {
      ultimoMinimapa = agora;
      idleUI?.atualizarHudIdle();
    }
    return;
  }

  const emp = window.regiaoMundo?.noMapa?.empurrar(estado.x, estado.z, RAIO); // objetos sólidos do mundo
  if (emp) { estado.x = emp.x; estado.z = emp.z; }
  jogador.position.set(estado.x, camada(estado.z), estado.z);
  sombra.position.set(estado.x, camada(estado.z) - 0.005, estado.z);
  if (save.forma === 'azazel') {
    azazel.atualizar(andando, rot, 0);
  } else {
    formaOnirica.atualizar(andando, rot, 0);
  }

  const pulso = Math.sin(agora * 0.004);
  if (marcadorDestino.visible) {
    const s = 1 + Math.sin(agora * 0.009) * 0.14;
    marcadorDestino.scale.set(s, s, 1);
  }
  for (const ent of entidadesMapa) {
    ent.mesh.quaternion.copy(camera.quaternion);
    if (ent.tipo === 'wild' || ent.tipo === 'boss' || ent.dados.flutua) {
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

  if (agora - ultimoMinimapa > 220 && mapaAtual) {
    ultimoMinimapa = agora;
    const [jpx, jpy] = W2P(estado.x, estado.z);
    const ws = entidadesMapa.filter((e) => e.tipo === 'wild').map((e) => ({ px: e.dados.pos[0], py: e.dados.pos[1] }));
    idleUI?.atualizarMinimapa(mapaAtual, jpx, jpy, ws);
  }

  renderer.render(cena, camera);
}

window.addEventListener('resize', () => {
  enquadrar();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

// ---- Controlador de UI Idle (Atlas, Codex, Mochila, Temporada, Vote, Config, AFK, Tutorial) ----
idleUI = criarControladorIdleUI({
  getSave: () => save,
  getMapaAtual: () => mapaAtual,
  salvar: salvarEstado,
  mostrarToast,
  definirAutoCaca,
  abrirDiario: () => { renderizarDiario(); abrirModal('modal-diario'); },
  abrirMapa48: () => {
    const stEl = document.getElementById('mapa-status');
    const tps = Object.keys(MARCOS_TELEPORTE).map((id) => {
      const t = save.teleportes[id];
      return `${t.ativo ? '🔷' : t.descoberto ? '⬜' : '🔒'} ${id}`;
    }).join(' · ');
    const bs = Object.values(BOSSES_REGIAO1).map((b) => `${save.bossesDerrotados[b.id] ? '✅' : '⚔️'} ${b.nome}`).join(' · ');
    if (stEl) stEl.innerHTML = `<b>Área atual:</b> ${mapaAtual?.id} · ${mapaAtual?.nome}<br><b>Marcos:</b> ${tps}<br><b>Chefes:</b> ${bs}`;
    abrirModal('modal-mapa');
  },
  viajarParaMapa: async (mapaId, ligarAuto) => {
    pararNavegacao(true);
    await entrarNoMapa(mapaId, null, true);
    if (ligarAuto) definirAutoCaca(true);
  },
  exportarSaveJson: () => serializarEstado(save),
});

// ---- API de inspeção e testes automatizados ----
// Mundo: os 50 sistemas ligados ao jogo (painel "Mundo" no menu)
window.regiaoMundo = iniciarMundo({
  getSave: () => save, salvar: salvarEstado, mostrarToast, atualizarHud: atualizarHudEstado,
  getMapaAtual: () => mapaAtual, abrirModal, fecharModal,
  mapaCtx: {
    cena, camera, P, camada,
    getJogador: () => ({ x: estado.x, z: estado.z }),
    // piso livre com folga da colisão (grade 128x71); false se a máscara do mapa ainda não carregou
    caminhavel: (mapaId, px, py) => {
      const g = gradeComFolga(mapaId);
      return Boolean(g && g[Math.min(GRID_H - 1, Math.floor(py / IMG_H * GRID_H)) * GRID_W + Math.min(GRID_W - 1, Math.floor(px / IMG_W * GRID_W))]);
    },
    // pontos que o mundo não pode cobrir: saídas, chegadas, spawn, NPCs, pistas, monstros e chefes do mapa
    ocupados: (mapaId) => {
      const m = MAPAS[mapaId]; if (!m) return [];
      const L = [m.spawnPadrao, ...(m.marco ? [m.marco.interacao || m.marco.pos] : [])];
      for (const sa of m.saidas) L.push([(sa.rect[0] + sa.rect[2]) / 2, (sa.rect[1] + sa.rect[3]) / 2]);
      for (const o of Object.values(MAPAS)) for (const sa of o.saidas) if (sa.destino === mapaId && sa.chegada) L.push(sa.chegada);
      for (const l of [NPCS_REGIAO1, PISTAS_MUNDO, MONSTROS_SELVAGENS, ENTIDADES_BOSS]) for (const e of l) if (e.mapa === mapaId) L.push(e.pos);
      return L;
    },
  },
});

// Ciclo jogável de C1 (regras genéricas em regiao1-ciclo.js, dados em regiao1-ciclo-c1.js)
window.regiaoC1 = iniciarCiclo({
  dados: CICLO_C1, cena, camera, P, camada,
  getMapaAtual: () => mapaAtual, getJogador: () => ({ x: estado.x, z: estado.z }), getEntidades: () => entidadesMapa,
  getSave: () => save, salvar: salvarEstado, mostrarToast, abrirDialogo, fecharModal, atualizarHud: atualizarHudEstado,
});
// Modo Estratégia da cidade (regras em regiao1-estrategia-regras.js, dados por cidade em regiao1-estrategia-c1.js)
window.regiaoEstrategia = iniciarEstrategia({ dados: [ESTRATEGIA_C1, ESTRATEGIA_R2], getSave: () => save, salvar: salvarEstado, mostrarToast, abrirModal, fecharModal, atualizarHud: atualizarHudEstado });
iniciarLayout();
if (avisoSave) setTimeout(() => mostrarToast(avisoSave, 7000), 1500);

window.regiao1 = {
  restaurarBackup: () => { const bk = localStorage.getItem(CHAVE_BACKUP); if (!bk || !saveLegivel(bk)) return false; localStorage.setItem(SAVE_KEY_REGIAO1, bk); return true; },
  mapaAtual: () => (mapaAtual ? mapaAtual.id : null),
  irPara: (id, px = null) => entrarNoMapa(id, px, false),
  moverPx: (px, py) => { const w = P(px, py); estado.x = w.x; estado.z = w.z; primeiroQuadro = true; },
  estado: () => ({ x: estado.x, z: estado.z, px: W2P(estado.x, estado.z) }),
  save: () => save,
  salvar: salvarEstado,
  resetarSave: () => { localStorage.removeItem(SAVE_KEY_REGIAO1); save = criarEstadoInicial(); garantirEstadoIdle(save); salvarEstado(); },
  forma: () => save.forma,
  setForma: (f) => aplicarForma(f),
  transformar: alternarTransformacao,
  velocidadeAtual,
  definirAutoCaca,
  iniciarAutoRota,
  pararAutoRota: () => pararNavegacao(true),
  autoRotaAtiva: () => autoRotaQuestId,
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
  idleUI,
};

// Inicialização
aplicarForma(params.get('forma') || (testeEspirito ? 'noctarn' : save.forma) || 'noctarn');
const inicialParam = params.get('mapa')?.toUpperCase();
const inicialId = (inicialParam && MAPAS[inicialParam]) ? inicialParam : (MAPAS[save.mapaAtual] ? save.mapaAtual : MAPA_INICIAL);
const spawnInicial = (!inicialParam && inicialId === save.mapaAtual && save.posicaoPx) ? save.posicaoPx : null;
entrarNoMapa(inicialId, spawnInicial, false).then(() => {
  registrarCodexArea(garantirEstadoIdle(save), inicialId);
  idleUI.atualizarHudIdle();
  idleUI.verificarGanhoOffline(false);
  if (!params.get('semtutorial')) idleUI.iniciarTutorial(false);
});
requestAnimationFrame(quadro);
