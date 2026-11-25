// Mundo no mapa: protótipos de polígono dos sistemas que têm presença física (vilas, refúgios, masmorras, portais, árvores...).
// Cada elemento sai do estado do mundo e usa a MESMA vaga do catálogo de artes (confusion/web/mundo/artes.js): se o arquivo
// assets/confusion/interface/mundo/<sistema>/<vaga>.webp existir, a arte substitui o polígono sozinha; senão aparece o polígono.
// Posições: escolhidas no piso livre do mapa (com folga da colisão), longe de saídas, NPCs, pistas, monstros e chegadas,
// sempre as mesmas para o mesmo mapa. Perto de um elemento aparece o botão que abre o menu do sistema.
import * as THREE from 'three';
import { artePorSistema, caminhoArte, SISTEMAS_NO_MAPA } from '../mundo/artes.js';
export { SISTEMAS_NO_MAPA };

const TAM_PADRAO = { sprite: 6, marcador: 3.2, cena: 9, retrato: 5, icone: 3, banner: 9 };
const TAM = { 'vila-saudavel': 11, 'vila-corrompida': 11, 'vila-ruinas': 11, fortaleza: 9, 'gigante-norte': 16, 'guardiao-norte': 8, 'guardiao-sul': 8, 'portal-lua': 7, 'portal-sombra': 7, 'portal-sol': 7, observatorio: 8, santuario: 7, 'arvore-crescida': 8, praga: 12, ilha: 10, barco: 7, catacumba: 9, mina: 9, templo: 9, 'reliquia-oculta': 4, estandarte: 4.5, monumento: 6 };
const CORES_VAGA = { 'vila-corrompida': '#7b3a8e', 'vila-ruinas': '#6b6b6b', praga: '#6b8e3a', 'reliquia-corrompida': '#8e3a6b' };

// Vagas que bloqueiam o personagem (raio = fração do tamanho). Marcadores e coisas rasteiras (canal, ponte, barco, estandarte) não bloqueiam.
const SOLIDO = { 'vila-saudavel': 0.2, 'vila-corrompida': 0.2, 'vila-ruinas': 0.2, refugio: 0.2, fortaleza: 0.2, catacumba: 0.18, mina: 0.18, templo: 0.18, 'guardiao-norte': 0.2, 'guardiao-sul': 0.2, 'portal-lua': 0.15, 'portal-sombra': 0.15, 'portal-sol': 0.15, observatorio: 0.2, santuario: 0.2, 'arvore-crescida': 0.12, monumento: 0.2, 'gigante-norte': 0.25, 'reliquia-restaurada': 0.14, 'reliquia-corrompida': 0.14 };
const U_PX = 1024 / 106; // pixels do mapa por unidade de mundo

const lim = (n, max = 3) => Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));
const por = (n, f) => Array.from({ length: lim(n) }, (_, i) => f(i));

// O que existe no mapa, a partir do estado do mundo. mapas: onde aparece. rotulo: o que o botão mostra.
export function elementosDoMundo(m) {
  const L = [];
  const add = (sis, chave, vaga, mapa, rotulo) => L.push({ sis, chave: `${sis}-${chave}`, vaga, mapa, rotulo });
  for (const [k, mapa] of [['norte', 'C2'], ['sul', 'C0'], ['porto', 'E1']]) {
    const v = m['01']?.[k]; if (!v) continue;
    const vaga = v.corrupcao > 50 ? 'vila-corrompida' : v.prosperidade <= 10 ? 'vila-ruinas' : 'vila-saudavel';
    add('01', k, vaga, mapa, `${v.nome} · prosperidade ${Math.round(v.prosperidade)}`);
  }
  (m['05']?.refugios || []).slice(0, 3).forEach((r, i) => add('05', `r${i}`, i >= 2 ? 'fortaleza' : 'refugio', ['C1', 'C0', 'C2'][i], r.nome || `Refúgio ${i + 1}`));
  for (const [k, mapa] of [['catacumba', 'E4'], ['mina', 'CC2'], ['templo', 'PC8']]) {
    const v = m['08']?.[k]; if (v) add('08', k, k, mapa, `${k[0].toUpperCase()}${k.slice(1)} · infestação ${Math.round(v.infestacao)}`);
  }
  if (m['13']?.entradas?.rio_subterraneo) add('13', 'rio', 'entrada', 'E6', 'Entrada subterrânea (rio)');
  if (m['13']?.entradas?.templo_fundo) add('13', 'templo', 'entrada', 'CC4', 'Entrada subterrânea (templo)');
  if (m['15']?.ativa) add('15', 'praga', 'praga', 'C1', `Praga · nível ${Math.round(m['15'].nivel || 0)}`);
  add('17', 'norte', 'guardiao-norte', 'C2', `Guardião do Norte · ${Math.round(m['17']?.forca?.norte ?? 0)}`);
  add('17', 'sul', 'guardiao-sul', 'C3', `Guardião do Sul · ${Math.round(m['17']?.forca?.sul ?? 0)}`);
  if (m['18']?.barco) add('18', 'barco', 'barco', 'C0', 'Seu barco');
  if (m['18']?.mare === 'baixa') add('18', 'ilha', 'ilha', 'E1', 'Ilha (maré baixa)');
  if (m['19']?.estado === 'restaurada') add('19', 'rel', 'reliquia-restaurada', 'C1', 'Relíquia restaurada');
  else if (m['19']?.estado === 'corrompida') add('19', 'rel', 'reliquia-corrompida', 'C1', 'Relíquia corrompida');
  else add('19', 'rel', 'reliquia-oculta', 'CC1', `Relíquia oculta · fragmentos ${m['19']?.fragmentos ?? 0}/3`);
  if (m['23']?.portal) add('23', 'portal', `portal-${m['23'].portal}`, 'D1', `Portal da ${m['23'].portal}`);
  if (m['25']?.guerra) add('25', 'guerra', 'estandarte', 'C1', 'Guerra entre facções');
  (m['29']?.arvores || []).slice(0, 3).forEach((a, i) => add('29', `a${i}`, (a.stage || 0) >= 2 ? 'arvore-crescida' : 'muda', 'C0', 'Árvore da memória'));
  por(m['29']?.monumentos, (i) => add('29', `m${i}`, 'monumento', 'C0', 'Monumento'));
  if ((m['30']?.diasAte ?? 9) <= 1) add('30', 'gigante', 'gigante-norte', 'C2', `Criatura gigante (${m['30'].regiao})`);
  por(m['35']?.guardioes, (i) => add('35', `g${i}`, 'automato', 'C1', 'Autômato guardião'));
  (m['36']?.tipos || []).slice(0, 3).forEach((t, i) => add('36', t, t, 'C0', `Montaria ${t}`));
  if (m['46']?.observatorio) add('46', 'obs', 'observatorio', 'C2', 'Observatório');
  por(m['47']?.santuarios, (i) => add('47', `s${i}`, 'santuario', 'C1', 'Santuário de memória'));
  por(m['48']?.canais, (i) => add('48', `c${i}`, 'canal', 'C0', 'Canal de irrigação'));
  por(m['48']?.pontes, (i) => add('48', `p${i}`, 'ponte', 'C0', 'Ponte reforçada'));
  return L;
}

const hash = (t) => { let h = 2166136261; for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };

function texturaPoligono(vaga, sis, rotulo) {
  const arte = artePorSistema(sis);
  const cor = CORES_VAGA[vaga] || arte?.cor || '#8e5b47';
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = `${cor}66`; g.strokeStyle = cor; g.lineWidth = 8; g.lineJoin = 'round';
  g.beginPath(); [[128, 14], [236, 70], [236, 170], [128, 226], [20, 170], [20, 70]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
  g.font = '92px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(arte?.emoji || '❓', 128, 112);
  g.font = '700 22px system-ui, sans-serif'; g.fillStyle = '#fff3e7'; g.strokeStyle = '#1a0f22'; g.lineWidth = 5;
  const nome = (arte?.artes.find((a) => a.id === vaga)?.nome || vaga);
  g.strokeText(nome, 128, 200, 200); g.fillText(nome, 128, 200, 200);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function iniciarMundoNoMapa({ cena, camera, P, camada, getMapaAtual, getJogador, caminhavel, ocupados, getMundo, abrirSistema, algumModalAberto }) {
  const grupo = new THREE.Group();
  cena.add(grupo);
  const loader = new THREE.TextureLoader();
  let mapaAtualId = null;
  let assinatura = '';
  let itens = []; // { el, mesh, x, z }

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
    const base = alcance(mapaId, [], usados); // o que já era alcançável sem nenhum objeto
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
          if (base.some((ok, i) => ok && !dep[i])) continue; // fecharia uma saída, NPC ou pista: tenta outro lugar
        }
        melhor = [px, py];
      }
      if (!melhor) { el.px = null; continue; } // sem lugar seguro: o objeto fica só no menu
      colocados.push(melhor);
      if (rpx > 0) circulos.push([melhor[0], melhor[1], rpx]);
      el.px = melhor; el.rpx = rpx;
    }
  }

  function limpar() {
    for (const it of itens) {
      grupo.remove(it.mesh);
      it.mesh.material.map?.dispose(); it.mesh.material.dispose(); it.mesh.geometry.dispose();
    }
    itens = [];
  }

  function construir() {
    limpar();
    const mapa = getMapaAtual();
    if (!mapa) return;
    mapaAtualId = mapa.id;
    const els = elementosDoMundo(getMundo()).filter((e) => e.mapa === mapa.id);
    assinatura = `${mapa.id}|${els.map((e) => `${e.chave}:${e.vaga}`).join(',')}`;
    const tamDe = (el) => TAM[el.vaga] || TAM_PADRAO[artePorSistema(el.sis)?.artes.find((a) => a.id === el.vaga)?.tipo] || 5;
    posicoes(mapa.id, els, tamDe);
    for (const el of els) {
      if (!el.px) continue;
      const tam = tamDe(el);
      const w = P(el.px[0], el.px[1]);
      const mat = new THREE.MeshBasicMaterial({ map: texturaPoligono(el.vaga, el.sis, el.rotulo), transparent: true, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), mat);
      mesh.position.set(w.x, camada(w.z) + tam * 0.45, w.z);
      mesh.renderOrder = 3;
      grupo.add(mesh);
      itens.push({ el, mesh, x: w.x, z: w.z, tam, r: (el.rpx || 0) / U_PX });
      // arte de verdade, se existir (mesmo nome do catálogo): troca a textura quando carregar
      loader.load(`../../../${caminhoArte(el.sis, el.vaga)}`, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (!itens.some((i) => i.mesh === mesh)) { tex.dispose(); return; }
        mat.map?.dispose(); mat.map = tex; mat.needsUpdate = true;
        const prop = tex.image.width / tex.image.height;
        mesh.geometry.dispose(); mesh.geometry = new THREE.PlaneGeometry(tam * prop, tam);
        mesh.userData.arte = true;
      }, undefined, () => {});
    }
  }

  // botão "abrir sistema" perto de um elemento
  const botao = document.createElement('button');
  botao.className = 'btn-pri';
  botao.id = 'btn-mundo-perto';
  Object.assign(botao.style, { position: 'fixed', left: '50%', bottom: '78px', transform: 'translateX(-50%)', zIndex: 8, display: 'none', minHeight: '42px', maxWidth: '78vw', fontSize: '13px' });
  document.body.append(botao);
  let alvo = null;
  botao.addEventListener('click', () => { if (alvo) abrirSistema(alvo.el.sis); });

  function quadro() {
    for (const it of itens) it.mesh.quaternion.copy(camera.quaternion);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  setInterval(() => {
    const mapa = getMapaAtual();
    if (!mapa) return;
    const els = elementosDoMundo(getMundo()).filter((e) => e.mapa === mapa.id);
    const sig = `${mapa.id}|${els.map((e) => `${e.chave}:${e.vaga}`).join(',')}`;
    if (sig !== assinatura) construir();
    const j = getJogador();
    let melhor = null, d0 = Infinity;
    for (const it of itens) { const d = Math.hypot(it.x - j.x, it.z - j.z); if (d < d0) { d0 = d; melhor = it; } }
    const perto = melhor && d0 < Math.max(5.5, melhor.tam * 0.55) && !algumModalAberto();
    alvo = perto ? melhor : null;
    botao.style.display = alvo ? 'block' : 'none';
    if (alvo) botao.textContent = `🌍 ${alvo.el.rotulo} · abrir`;
  }, 200);

  construir();
  // Empurra o personagem para fora dos objetos sólidos (chamado depois de cada movimento).
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
  // Círculos sólidos em pixels do mapa, para o caminho do clique e do auto-caça contornarem.
  const circulosPx = () => itens.filter((i) => i.r).map((i) => ({ px: (i.x / 106 + 0.5) * 1024, py: (i.z / (106 * 571 / 1024) + 0.5) * 571, r: i.r * U_PX }));
  return { atualizar: construir, empurrar, circulosPx, elementos: () => itens.map((i) => ({ ...i.el, x: i.x, z: i.z, r: i.r })) };
}
