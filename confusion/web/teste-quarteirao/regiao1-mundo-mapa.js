// Mundo no mapa: presença física dos sistemas (vilas do 01, NPCs do 04, refúgios do 05, masmorras do 08, rotas do 10 e demais).
// Usa diretamente as artes reais de assets/confusion/interface/mundo/<sistema>/<vaga>.webp com cache de texturas,
// sem exibir polígonos provisórios quando a arte existe. Fallback visual discreto só aparece se o arquivo falhar.
// Posições: escolhidas no piso livre do mapa (com folga da colisão), longe de saídas, NPCs, pistas, monstros e chegadas.
import * as THREE from 'three';
import { artePorSistema, caminhoArte, SISTEMAS_NO_MAPA } from '../mundo/artes.js';
import { elementosDoMundo, VILAS_MAPA, MASMORRAS_MAPA, ROTAS_MAPA } from './regiao1-mundo-integracao.js';
export { SISTEMAS_NO_MAPA, elementosDoMundo, VILAS_MAPA, MASMORRAS_MAPA, ROTAS_MAPA };

const TAM_PADRAO = { sprite: 6.2, marcador: 3.8, cena: 8.8, retrato: 5.4, icone: 3.4, banner: 8.5 };
const TAM = {
  'vila-saudavel': 10.5, 'vila-corrompida': 10.5, 'vila-ruinas': 10.5,
  ana: 5.6, teo: 5.6, lia: 5.6,
  refugio: 8.4, fortaleza: 9.2, protecao: 5.2,
  catacumba: 8.8, mina: 8.8, templo: 8.8,
  caravana: 7.2, mercado: 8.6,
  'gigante-norte': 16, 'guardiao-norte': 8, 'guardiao-sul': 8,
  'portal-lua': 7, 'portal-sombra': 7, 'portal-sol': 7,
  observatorio: 8, santuario: 7, 'arvore-crescida': 8, praga: 12,
  ilha: 10, barco: 7, 'reliquia-oculta': 4, estandarte: 4.5, monumento: 6,
};
const CORES_VAGA = { 'vila-corrompida': '#7b3a8e', 'vila-ruinas': '#6b6b6b', praga: '#6b8e3a', 'reliquia-corrompida': '#8e3a6b' };

// Vagas que bloqueiam o personagem (raio = fração do tamanho). Marcadores e objetos rasteiros não bloqueiam.
const SOLIDO = {
  'vila-saudavel': 0.18, 'vila-corrompida': 0.18, 'vila-ruinas': 0.18,
  refugio: 0.18, fortaleza: 0.18,
  catacumba: 0.16, mina: 0.16, templo: 0.16,
  mercado: 0.15,
  'guardiao-norte': 0.2, 'guardiao-sul': 0.2,
  'portal-lua': 0.15, 'portal-sombra': 0.15, 'portal-sol': 0.15,
  observatorio: 0.2, santuario: 0.2, 'arvore-crescida': 0.12, monumento: 0.2,
  'gigante-norte': 0.25, 'reliquia-restaurada': 0.14, 'reliquia-corrompida': 0.14,
};
const U_PX = 1024 / 106; // pixels do mapa por unidade de mundo

const hash = (t) => { let h = 2166136261; for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };

// Fallback discreto usado apenas se o arquivo .webp realmente falhar ao carregar.
function texturaFallback(vaga, sis) {
  const arte = artePorSistema(sis);
  const cor = CORES_VAGA[vaga] || arte?.cor || '#8e5b47';
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = `${cor}bb`; g.strokeStyle = '#fde68a'; g.lineWidth = 6;
  g.beginPath(); g.arc(128, 128, 92, 0, Math.PI * 2); g.fill(); g.stroke();
  g.font = '82px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(arte?.emoji || '🌍', 128, 114);
  g.font = '700 20px system-ui, sans-serif'; g.fillStyle = '#fff3e7'; g.strokeStyle = '#1a0f22'; g.lineWidth = 4;
  const nome = (arte?.artes.find((a) => a.id === vaga)?.nome || vaga);
  g.strokeText(nome, 128, 198, 180); g.fillText(nome, 128, 198, 180);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function iniciarMundoNoMapa({ cena, camera, P, camada, getMapaAtual, getJogador, caminhavel, ocupados, getMundo, getMeta, abrirSistema, interagirElemento, algumModalAberto, liberado }) {
  const grupo = new THREE.Group();
  cena.add(grupo);
  const loader = new THREE.TextureLoader();
  const cacheTex = new Map();
  let assinatura = '';
  let itens = []; // { el, mesh, x, z, tam, r }

  // Grade 128x71 do piso livre (com folga) menos os círculos dos objetos sólidos; busca em largura a partir do spawn.
  const GW = 128, GH = 71;
  function alcance(mapaId, circulos, alvos) {
    const livre = new Uint8Array(GW * GH);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const px = (gx + 0.5) / GW * 1024, py = (gy + 0.5) / GH * 571;
      if (!caminhavel(mapaId, px, py)) continue;
      if (circulos.some((c) => Math.hypot(c[0] - px, c[1] - py) < c[2] + 5)) continue;
      livre[gy * GW + gx] = 1;
    }
    const celula = (px, py) => {
      const cx = Math.min(GW - 1, Math.floor(px / 1024 * GW)), cy = Math.min(GH - 1, Math.floor(py / 571 * GH));
      for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < GW && y >= 0 && y < GH && livre[y * GW + x]) return y * GW + x;
      }
      return -1;
    };
    const ini = celula(alvos[0][0], alvos[0][1]);
    const vis = new Uint8Array(GW * GH);
    if (ini >= 0) {
      const fila = [ini]; vis[ini] = 1;
      for (let h = 0; h < fila.length; h++) {
        const c = fila[h], x = c % GW, y = (c / GW) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
          const n = ny * GW + nx;
          if (livre[n] && !vis[n]) { vis[n] = 1; fila.push(n); }
        }
      }
    }
    return alvos.map(([px, py]) => { const c = celula(px, py); return c >= 0 && vis[c] === 1; });
  }

  function posicoes(mapaId, els, tamDe) {
    const usados = ocupados(mapaId).map(([x, y]) => [x, y]);
    const base = alcance(mapaId, [], usados);
    const colocados = [];
    const circulos = [];
    for (const el of els) {
      const r = lcg(hash(`${mapaId}|${el.chave}`));
      const rpx = (SOLIDO[el.vaga] || 0) * tamDe(el) * U_PX;
      let melhor = null;
      for (let t = 0; t < 400 && !melhor; t++) {
        const px = 90 + r() * 844, py = 100 + r() * 400;
        if (!caminhavel(mapaId, px, py)) continue;
        const dist = (a) => Math.hypot(a[0] - px, a[1] - py);
        const folga = t < 250 ? 85 : 55;
        if (usados.some((u) => dist(u) < folga + rpx * 0.6) || colocados.some((u) => dist(u) < folga)) continue;
        if (rpx > 0) {
          const dep = alcance(mapaId, [...circulos, [px, py, rpx]], usados);
          if (base.some((ok, i) => ok && !dep[i])) continue;
        }
        melhor = [px, py];
      }
      if (!melhor) { el.px = null; continue; }
      colocados.push(melhor);
      if (rpx > 0) circulos.push([melhor[0], melhor[1], rpx]);
      el.px = melhor; el.rpx = rpx;
    }
  }

  function limpar() {
    for (const it of itens) {
      grupo.remove(it.mesh);
      if (it.mesh.userData.fallbackTex) it.mesh.material.map?.dispose();
      it.mesh.material.dispose();
      it.mesh.geometry.dispose();
    }
    itens = [];
  }

  function aplicarTextura(mesh, mat, tex, tam) {
    if (!itens.some((i) => i.mesh === mesh)) return;
    mat.map = tex;
    mat.opacity = 1;
    mat.needsUpdate = true;
    const prop = tex.image && tex.image.height ? Math.min(1.9, Math.max(0.6, tex.image.width / tex.image.height)) : 1;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(tam * prop, tam);
    mesh.userData.arte = true;
  }

  function construir() {
    limpar();
    const mapa = getMapaAtual();
    if (!mapa) return;
    const els = elementosDoMundo(getMundo(), getMeta?.()).filter((e) => e.mapa === mapa.id && (!liberado || liberado(e.sis)));
    assinatura = `${mapa.id}|${els.map((e) => `${e.chave}:${e.vaga}:${e.rotulo}`).join(',')}`;
    const tamDe = (el) => TAM[el.vaga] || TAM_PADRAO[artePorSistema(el.sis)?.artes.find((a) => a.id === el.vaga)?.tipo] || 5.4;
    posicoes(mapa.id, els, tamDe);
    for (const el of els) {
      if (!el.px) continue;
      const tam = tamDe(el);
      const w = P(el.px[0], el.px[1]);
      const url = `../../../${caminhoArte(el.sis, el.vaga)}`;
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), mat);
      mesh.position.set(w.x, camada(w.z) + tam * 0.45, w.z);
      mesh.renderOrder = 3;
      mesh.userData = { chave: el.chave, sis: el.sis, vaga: el.vaga, arteUrl: url, arte: false };
      grupo.add(mesh);
      itens.push({ el, mesh, x: w.x, z: w.z, tam, r: (el.rpx || 0) / U_PX });

      if (cacheTex.has(url)) {
        aplicarTextura(mesh, mat, cacheTex.get(url), tam);
      } else {
        loader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          cacheTex.set(url, tex);
          aplicarTextura(mesh, mat, tex, tam);
        }, undefined, () => {
          if (!itens.some((i) => i.mesh === mesh)) return;
          const fb = texturaFallback(el.vaga, el.sis);
          mesh.userData.fallbackTex = true;
          mat.map = fb; mat.opacity = 1; mat.needsUpdate = true;
        });
      }
    }
  }

  // Botão contextual próximo a um elemento do mundo no mapa
  const botao = document.createElement('button');
  botao.className = 'btn-pri';
  botao.id = 'btn-mundo-perto';
  Object.assign(botao.style, { position: 'fixed', left: '50%', bottom: '78px', transform: 'translateX(-50%)', zIndex: 8, display: 'none', minHeight: '42px', maxWidth: '78vw', fontSize: '13px' });
  document.body.append(botao);
  let alvo = null;
  function acionar(el) {
    if (!el) return;
    if (interagirElemento) interagirElemento(el);
    else abrirSistema(el.sis);
  }
  botao.addEventListener('click', () => { if (alvo) acionar(alvo.el); });

  function quadro() {
    for (const it of itens) it.mesh.quaternion.copy(camera.quaternion);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  setInterval(() => {
    const mapa = getMapaAtual();
    if (!mapa) return;
    const els = elementosDoMundo(getMundo(), getMeta?.()).filter((e) => e.mapa === mapa.id && (!liberado || liberado(e.sis)));
    const sig = `${mapa.id}|${els.map((e) => `${e.chave}:${e.vaga}:${e.rotulo}`).join(',')}`;
    if (sig !== assinatura) construir();
    const j = getJogador();
    let melhor = null, d0 = Infinity;
    for (const it of itens) { const d = Math.hypot(it.x - j.x, it.z - j.z); if (d < d0) { d0 = d; melhor = it; } }
    const perto = melhor && d0 < Math.max(6.2, melhor.tam * 0.62) && !algumModalAberto();
    alvo = perto ? melhor : null;
    botao.style.display = alvo ? 'block' : 'none';
    if (alvo) botao.textContent = `🌍 ${alvo.el.rotulo} · interagir`;
  }, 200);

  construir();
  function empurrar(x, z, raio = 0.35) {
    let mudou = false;
    for (const it of itens) {
      if (!it.r) continue;
      const dx = x - it.x, dz = z - it.z, d = Math.hypot(dx, dz), min = it.r + raio;
      if (d < min) {
        const nx = d > 1e-4 ? dx / d : 0, nz = d > 1e-4 ? dz / d : 1;
        x = it.x + nx * min; z = it.z + nz * min; mudou = true;
      }
    }
    return mudou ? { x, z } : null;
  }
  const circulosPx = () => itens.filter((i) => i.r).map((i) => ({ px: (i.x / 106 + 0.5) * 1024, py: (i.z / (106 * 571 / 1024) + 0.5) * 571, r: i.r * U_PX }));
  return {
    atualizar: construir,
    empurrar,
    circulosPx,
    elementos: () => itens.map((i) => ({ ...i.el, x: i.x, z: i.z, r: i.r, arteCarregada: Boolean(i.mesh.userData.arte) })),
    interagir: (chave) => { const hit = itens.find((i) => i.el.chave === chave); if (hit) { acionar(hit.el); return true; } return false; },
  };
}
