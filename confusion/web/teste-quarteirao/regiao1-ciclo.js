// Motor de ciclo jogável (regras genéricas). Recebe um objeto de dados (ver regiao1-ciclo-c1.js) e faz acontecer NO MAPA:
// coletar recursos, entregar no canteiro (a obra muda a aparência), rotina de NPCs, falas que mudam e uma investigação curta.
// Nada daqui conhece C1: posições, NPCs e textos vêm dos dados, então outra região é só outro arquivo de dados.
// Estado salvo em save.idle.ciclos[id] = { carga, progresso, obra, invest, coletas }.
import * as THREE from 'three';

const DIA_MS = 120000; // um dia do mundo (igual ao módulo Mundo)

export function iniciarCiclo({ dados, cena, camera, P, camada, getMapaAtual, getJogador, getEntidades, getSave, salvar, mostrarToast, abrirDialogo, fecharModal, atualizarHud }) {
  const D = dados;
  const U = 1024 / 106;
  const grupo = new THREE.Group();
  cena.add(grupo);
  const loader = new THREE.TextureLoader();
  let itens = []; // { tipo, mesh, x, z, i?, ... }
  let assinatura = '';

  // ---------- estado ----------
  const estado = () => {
    const idle = getSave().idle || (getSave().idle = {});
    idle.ciclos = idle.ciclos || {};
    const c = idle.ciclos[D.id] || (idle.ciclos[D.id] = { carga: 0, progresso: 0, obra: false, invest: 'nova', coletas: {} });
    c.coletas = c.coletas || {};
    return c;
  };
  const diario = (texto) => {
    const meta = window.regiaoMundo?.estado?.().meta;
    if (!meta) return;
    meta.diario = meta.diario || [];
    meta.diario.push({ dia: meta.dia, t: texto });
    if (meta.diario.length > 150) meta.diario = meta.diario.slice(-150);
  };
  const premiar = (r) => {
    const rec = getSave().recompensas;
    rec.gold += r.gold || 0; rec.diamantes += r.diamantes || 0;
    atualizarHud?.();
  };
  const arteUrl = (a) => `../../../assets/confusion/interface/mundo/${a.sis}/${a.vaga}.webp`;

  // ---------- desenho: polígono + arte real quando o arquivo existe ----------
  function poligono(emoji, cor, nome) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = `${cor}66`; g.strokeStyle = cor; g.lineWidth = 8; g.lineJoin = 'round';
    g.beginPath(); [[128, 14], [236, 70], [236, 170], [128, 226], [20, 170], [20, 70]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
    g.font = '92px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 128, 112);
    g.font = '700 22px system-ui, sans-serif'; g.fillStyle = '#fff3e7'; g.strokeStyle = '#1a0f22'; g.lineWidth = 5;
    g.strokeText(nome, 128, 200, 200); g.fillText(nome, 128, 200, 200);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function criar(tipo, px, py, tam, arte, emoji, cor, nome, extra = {}) {
    const w = P(px, py);
    const mat = new THREE.MeshBasicMaterial({ map: poligono(emoji, cor, nome), transparent: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), mat);
    mesh.position.set(w.x, camada(w.z) + tam * 0.45, w.z);
    mesh.renderOrder = 3;
    grupo.add(mesh);
    const it = { tipo, mesh, x: w.x, z: w.z, tam, ...extra };
    itens.push(it);
    loader.load(arteUrl(arte), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (!itens.includes(it)) { tex.dispose(); return; }
      mat.map?.dispose(); mat.map = tex; mat.needsUpdate = true;
      mesh.geometry.dispose(); mesh.geometry = new THREE.PlaneGeometry(tam * (tex.image.width / tex.image.height), tam);
    }, undefined, () => {});
    return it;
  }
  function limpar() {
    for (const it of itens) { grupo.remove(it.mesh); it.mesh.material.map?.dispose(); it.mesh.material.dispose(); it.mesh.geometry.dispose(); }
    itens = [];
  }

  // ---------- o que existe no mapa agora ----------
  function visiveis() {
    const c = estado(); const agora = Date.now();
    const lista = [];
    D.coleta.pontos.forEach((p, i) => { if (agora - (c.coletas[i] || 0) > D.coleta.recarregaMs) lista.push(`t${i}`); });
    lista.push(c.obra ? 'vila:depois' : 'vila:antes');
    if (c.invest === 'ativa') lista.push('pista');
    return lista.join(',');
  }
  function construir() {
    limpar();
    const c = estado(); const agora = Date.now();
    if (getMapaAtual()?.id !== D.mapa) { assinatura = `${D.mapa}:fora`; return; }
    D.coleta.pontos.forEach((p, i) => {
      if (agora - (c.coletas[i] || 0) > D.coleta.recarregaMs) criar('tora', p[0], p[1], D.coleta.tam, D.coleta.arte, D.coleta.icone, '#8e6b3a', D.coleta.rotulo, { i });
    });
    const o = D.obra, v = c.obra ? o.depois : o.antes;
    criar('obra', o.local[0], o.local[1], o.tam, v.arte, c.obra ? '🏘️' : '🏗️', c.obra ? '#8e5b47' : '#6b6b6b', v.rotulo);
    if (c.invest === 'ativa') criar('pista', D.investigacao.pista.local[0], D.investigacao.pista.local[1], D.investigacao.pista.tam, D.investigacao.pista.arte, '🔍', '#8e7a4a', D.investigacao.pista.rotulo);
    assinatura = `${D.mapa}:${visiveis()}`;
  }

  // ---------- chip com a carga ----------
  const chip = document.createElement('div');
  Object.assign(chip.style, { position: 'fixed', left: '50%', top: '12px', transform: 'translateX(-50%)', zIndex: 8, display: 'none', background: 'rgba(33,19,41,.92)', border: '1px solid #c59c67', color: '#fff3e7', borderRadius: '99px', padding: '5px 12px', font: '700 13px system-ui, sans-serif', pointerEvents: 'none' });
  document.body.append(chip);
  function atualizarChip() {
    const c = estado();
    const ativo = getMapaAtual()?.id === D.mapa && (c.carga > 0 || (c.progresso > 0 && !c.obra));
    chip.style.display = ativo ? 'block' : 'none';
    if (ativo) chip.textContent = `${D.coleta.icone} ${D.coleta.rotulo} ${c.carga}/${D.coleta.capacidade}${c.progresso ? ` · obra ${c.progresso}/${D.obra.custo}` : ''}`;
  }

  // ---------- interações (chamadas por regiao1.js) ----------
  function alvo(x, z) {
    if (getMapaAtual()?.id !== D.mapa) return null;
    const c = estado();
    let melhor = null, md = Infinity;
    for (const it of itens) {
      const d = Math.hypot(it.x - x, it.z - z);
      const lim = it.tipo === 'obra' ? Math.max(7, it.tam * 0.6) : 5;
      if (d < lim && d < md) { md = d; melhor = it; }
    }
    if (!melhor) return null;
    let rotulo, executar;
    if (melhor.tipo === 'tora') {
      rotulo = `${D.coleta.icone} Pegar ${D.coleta.rotulo.toLowerCase()}`;
      executar = () => coletar(melhor.i);
    } else if (melhor.tipo === 'pista') {
      rotulo = `🔍 ${D.investigacao.pista.rotulo}`;
      executar = () => pegarPista();
    } else if (!c.obra) {
      rotulo = `🏗️ ${D.obra.antes.rotulo} (${c.progresso + c.carga}/${D.obra.custo})`;
      executar = () => entregar();
    } else {
      rotulo = window.regiaoEstrategia ? '🧭 Estratégia da cidade' : `🏘️ ${D.obra.depois.rotulo}`;
      executar = () => (window.regiaoEstrategia ? window.regiaoEstrategia.abrir() : abrirDialogo(D.titulo, 'Obra concluída', D.obra.textoFim, [{ rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]));
    }
    return { tipo: 'ciclo', rotulo, dist: md, executar };
  }

  function coletar(i) {
    const c = estado();
    if (c.carga >= D.coleta.capacidade) { mostrarToast(`${D.coleta.icone} Você já está carregando o máximo (${D.coleta.capacidade}). Entregue no canteiro.`, 2600); return; }
    c.carga = Math.min(D.coleta.capacidade, c.carga + D.coleta.porPonto);
    c.coletas[i] = Date.now();
    mostrarToast(`${D.coleta.icone} ${D.coleta.rotulo} ${c.carga}/${D.coleta.capacidade}`, 1800);
    salvar(); construir(); atualizarChip();
  }
  function entregar() {
    const c = estado();
    if (c.carga <= 0) { mostrarToast(`Traga ${D.coleta.rotulo.toLowerCase()} do mapa. Faltam ${D.obra.custo - c.progresso}.`, 2800); return; }
    const falta = D.obra.custo - c.progresso;
    const usa = Math.min(c.carga, falta);
    c.carga -= usa; c.progresso += usa;
    if (c.progresso >= D.obra.custo) {
      c.obra = true;
      premiar(D.obra.recompensa);
      const m = D.obra.mundo, v = window.regiaoMundo?.estado?.().mundo?.[m.sistema]?.[m.chave];
      if (v) v.prosperidade = Math.min(100, (v.prosperidade || 0) + m.prosperidade);
      diario(`${D.titulo}: a vila foi reconstruída.`);
      mostrarToast('🏘️ A vila foi reconstruída!', 3500);
      abrirDialogo(D.titulo, 'Obra concluída', D.obra.textoFim, [{ rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]);
    } else {
      mostrarToast(`🏗️ Obra ${c.progresso}/${D.obra.custo}`, 2200);
    }
    salvar(); construir(); atualizarChip();
  }
  function pegarPista() {
    const c = estado(); const p = D.investigacao.pista;
    if (c.invest !== 'ativa') return;
    c.invest = 'pista';
    diario(`${D.titulo}: encontrou "${p.rotulo}".`);
    salvar(); construir();
    abrirDialogo(`✦ ${p.rotulo}`, 'Pista registrada', p.texto, [{ rotulo: 'Continuar', prim: true, aoClicar: () => fecharModal('modal-dialogo') }]);
  }

  // Falas: devolve { falas, botoes } para o NPC, ou null para usar a fala original
  function dialogo(npc) {
    if (getMapaAtual()?.id !== D.mapa) return null;
    const lista = D.falas[npc.id]; if (!lista) return null;
    const c = estado(); const s = { invest: c.invest, obra: c.obra };
    const e = lista.find((f) => Object.entries(f.se).every(([k, v]) => s[k] === v));
    if (!e) return null;
    const botoes = [];
    if (e.acao === 'iniciar' && c.invest === 'nova') {
      botoes.push({ rotulo: e.rotuloAcao, prim: true, aoClicar: () => { c.invest = 'ativa'; diario(`${D.titulo}: procurar o pacote perdido.`); salvar(); construir(); fecharModal('modal-dialogo'); mostrarToast('🔍 Procure o pacote no lado oeste da cidade.', 3200); } });
    } else if (e.acao === 'entregar' && c.invest === 'pista') {
      botoes.push({ rotulo: e.rotuloAcao, prim: true, aoClicar: () => { c.invest = 'concluida'; premiar(D.investigacao.recompensa); diario(`${D.titulo}: pacote entregue.`); salvar(); construir(); fecharModal('modal-dialogo'); mostrarToast(`✨ Investigação concluída! +${D.investigacao.recompensa.gold} ouro, +${D.investigacao.recompensa.diamantes} 💎`, 4000); } });
    }
    botoes.push({ rotulo: 'Fechar', prim: !botoes.length, aoClicar: () => fecharModal('modal-dialogo') });
    return { falas: e.falas, botoes };
  }

  // ---------- rotina dos NPCs ----------
  const posNpc = new Map(); // id -> { ent, x, z } (a posição sobrevive quando o mapa reconstrói as entidades)
  let ultimoRot = performance.now();
  function rotina() {
    const agora = performance.now(), dt = Math.min(0.2, (agora - ultimoRot) / 1000); ultimoRot = agora;
    if (getMapaAtual()?.id !== D.mapa || document.hidden) return;
    const meta = window.regiaoMundo?.estado?.().meta;
    const fase = (window.__cicloFase ?? (meta ? ((Date.now() - meta.ultimoMs) / DIA_MS) % 1 : 0));
    const noite = fase >= 0.5;
    for (const ent of getEntidades()) {
      if (ent.tipo !== 'npc' || !D.rotina.npcs.includes(ent.dados.id)) continue;
      let reg = posNpc.get(ent.dados.id);
      if (!reg) { reg = { ent, x: ent.x, z: ent.z }; posNpc.set(ent.dados.id, reg); }
      if (reg.ent !== ent) { reg.ent = ent; moverPara(ent, reg.x, reg.z); } // entidades reconstruídas: volta para onde estava
      const alvoPx = noite ? D.rotina.noite[ent.dados.id] : ent.dados.pos;
      const a = P(alvoPx[0], alvoPx[1]);
      const dx = a.x - reg.x, dz = a.z - reg.z, d = Math.hypot(dx, dz);
      if (d > 0.05) { const passo = Math.min(d, 2.6 * dt); reg.x += (dx / d) * passo; reg.z += (dz / d) * passo; moverPara(ent, reg.x, reg.z); }
    }
  }
  function moverPara(ent, x, z) {
    const yOff = ent.mesh.position.y - camada(ent.z);
    ent.x = x; ent.z = z;
    ent.mesh.position.set(x, camada(z) + yOff, z);
  }

  // ---------- laços ----------
  function quadro() { for (const it of itens) it.mesh.quaternion.copy(camera.quaternion); requestAnimationFrame(quadro); }
  requestAnimationFrame(quadro);
  setInterval(() => {
    const m = getMapaAtual()?.id;
    const sig = m === D.mapa ? `${D.mapa}:${visiveis()}` : `${D.mapa}:fora`;
    if (sig !== assinatura) construir();
    atualizarChip();
  }, 400);
  setInterval(rotina, 100);
  construir();

  // texto do diário de progresso (usado no menu Mundo)
  function resumo() {
    const c = estado();
    const inv = { nova: 'ainda não começou', ativa: 'procurando o pacote no mapa', pista: 'pacote encontrado: entregue ao mensageiro', concluida: 'concluída' }[c.invest];
    return { titulo: D.titulo, linhas: [`Reconstrução: ${c.obra ? 'concluída' : `${c.progresso}/${D.obra.custo} de ${D.coleta.rotulo.toLowerCase()} entregues`}`, `Investigação: ${inv}`, `Carregando: ${c.carga}/${D.coleta.capacidade}`] };
  }

  const npcsPx = () => [...posNpc].map(([id, r]) => [id, Math.round((r.x / 106 + 0.5) * 1024), Math.round((r.z / (106 * 571 / 1024) + 0.5) * 571)]);
  return { alvo, dialogo, resumo, estado, npcsPx, atualizar: construir, elementos: () => itens.map((i) => ({ tipo: i.tipo, x: i.x, z: i.z, i: i.i })) };
}
