// Batalha em tela inteira (6 contra 6 no máximo) para missões e capítulos. Reaproveita o motor de turnos da Estratégia e os efeitos de
// regiao1-batalha-fx.js. A lógica só decide o turno; a camada visual toca o movimento a partir do evento.
import { criarRng, criarUnidade, criarBatalha, atorAtual, executar, decidir } from './regiao1-estrategia-regras.js';
import { animarEvento } from './regiao1-batalha-fx.js';
import { ARTE_DA_ESPECIE } from '../species.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const CSS = `
#tela-batalha { position: fixed; inset: 0; z-index: 58; display: none; flex-direction: column; background: #1a0f22; color: #fff3e7; font: 13px system-ui, sans-serif; }
#tela-batalha.vis { display: flex; }
#tela-batalha .tb-topo { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(26,15,34,.9); }
#tela-batalha .tb-topo b { color: #f3c27a; font-size: 14px; flex: 1; }
#tela-batalha .tb-arena { position: relative; flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; background: center / cover #24162b; }
#tela-batalha .tb-lado { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); align-content: space-around; gap: 6px; }
#tela-batalha .un { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; width: 100%; max-width: clamp(120px, 22vw, 200px); justify-self: center; background: rgba(20,10,28,.4); border: 1px solid #6b4a52; border-radius: 8px; padding: 4px; color: inherit; font-size: 10.5px; cursor: default; }
#tela-batalha .un.morto { opacity: .3; } #tela-batalha .un.vez { outline: 2px solid #f3a458; } #tela-batalha .un.alvo { outline: 2px solid #fb7185; }
#tela-batalha .un-fig { display: block; width: 100%; height: clamp(60px, 22vh, 170px); } #tela-batalha .un-fig img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 2px rgba(0,0,0,.6)); }
#tela-batalha .tb-lado.i .un-fig img { transform: scaleX(-1); }
#tela-batalha .un .hp { width: 100%; height: 5px; background: #12091a; border-radius: 3px; overflow: hidden; } #tela-batalha .un .hp i { display: block; height: 100%; background: #4ade80; } #tela-batalha .tb-lado.i .hp i { background: #fb7185; }
#tela-batalha .tb-log { flex: 0 0 auto; max-height: 12vh; overflow: auto; padding: 5px 10px; background: #24162b; font-size: 11.5px; }
#tela-batalha .tb-ctl { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px 10px calc(6px + env(safe-area-inset-bottom, 0px)); background: rgba(26,15,34,.95); }
#tela-batalha .tb-ctl button { min-height: 34px; padding: 4px 10px; }
#tela-batalha .tb-fim { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(13,7,19,.8); font-size: 18px; z-index: 12; text-align: center; padding: 20px; }`;

export function criarTelaBatalha() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  const el = document.createElement('div'); el.id = 'tela-batalha'; document.body.append(el);
  let b = null, cfg = null, timer = null, auto = true, alvoSel = null;
  const rng = criarRng(Date.now() % 100000);
  const arte = (u) => { const p = cfg.artes?.[u.especie] || ARTE_DA_ESPECIE[u.especie] || (u.lado === 'a' && u.especie === 'Noctarn' ? 'assets/monsters/noctarn/sprite-front.png' : `assets/monsters/${u.especie.toLowerCase()}/sprite-front.png`); return `../../../${p}`; };
  const cartao = (u, cls, vez) => `<button class="un ${cls} ${u.hp <= 0 ? 'morto' : ''} ${vez ? 'vez' : ''} ${alvoSel === u.id ? 'alvo' : ''}" data-un="${u.id}"><span class="un-fig"><img src="${arte(u)}" alt="${esc(u.especie)}" onerror="this.outerHTML='<span style=&quot;font-size:34px;line-height:60px&quot;>🐾</span>'"></span><span>${esc(u.especie)} nv.${u.nivel}</span><span class="hp"><i style="width:${Math.max(0, Math.round(u.hp / u.hpMax * 100))}%"></i></span><span>${u.hp}/${u.hpMax}</span></button>`;
  function desenhar() {
    const u = b.fim ? null : atorAtual(b), manual = u && u.lado === 'a' && !auto;
    el.innerHTML = `<div class="tb-topo"><b>${esc(cfg.titulo)}</b><label><input type="checkbox" id="tb-auto" ${auto ? 'checked' : ''}> Atacar automaticamente</label><button class="btn-sec" data-fugir="1">Fugir</button></div>
      <div class="tb-arena" style="background-image:url('../../../${cfg.arena}')"><div class="tb-lado a">${b.aliados.map((x) => cartao(x, 'a', u === x)).join('')}</div><div class="tb-lado i">${b.inimigos.map((x) => cartao(x, 'i', u === x)).join('')}</div></div>
      <div class="tb-log" id="tb-log">${b.log.slice(-5).map((l) => `<p style="margin:1px 0">${esc(l)}</p>`).join('')}</div>
      <div class="tb-ctl">${manual ? `<b>Vez: ${esc(u.especie)}</b> (toque num alvo) <button class="btn-pri" data-acao="atacar">Atacar</button><button class="btn-pri" data-acao="habilidade" ${u.recarga > 0 ? 'disabled' : ''}>Habilidade${u.recarga > 0 ? ` (${u.recarga})` : ''}</button><button class="btn-sec" data-acao="defender">Defender</button>${u.papel === 'suporte' ? '<button class="btn-sec" data-acao="curar">Curar</button>' : ''}` : '<span class="muted">' + (b.fim ? '' : 'Em combate…') + '</span>'}</div>
      ${b.fim ? `<div class="tb-fim"><b>${b.fim === 'vitoria' ? '🏆 Vitória!' : '💀 Derrota'}</b><button class="btn-pri" data-continuar="1">Continuar</button></div>` : ''}`;
    const lg = el.querySelector('#tb-log'); if (lg) lg.scrollTop = lg.scrollHeight;
    animarEvento(el, b.evento, '.tb-arena');
  }
  function passo() {
    if (!b || b.fim) return;
    const u = atorAtual(b); if (!u) return;
    if (u.lado === 'i' || auto) { executar(b, decidir(b, u, rng), rng); desenhar(); if (b.fim) clearInterval(timer); } else desenhar();
  }
  function abrir(c) {
    cfg = c; auto = c.auto !== false; alvoSel = null;
    const papeis = c.papeis || {};
    const al = c.aliados.slice(0, 6).map((m, i) => criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel || 1, lado: 'a', papeis, bonus: c.bonus || {} }));
    const ini = c.inimigos.slice(0, 6).map(([esp, nv], i) => criarUnidade({ id: `i${i}`, especie: esp, nivel: nv, lado: 'i', papeis }));
    b = criarBatalha(al, ini); b.log.push(`${c.titulo}: ${ini.length} inimigo(s) à frente.`);
    el.classList.add('vis'); desenhar(); clearInterval(timer); timer = setInterval(passo, c.ritmo || 750);
  }
  function fechar(venceu) { clearInterval(timer); el.classList.remove('vis'); el.innerHTML = ''; const f = cfg?.onFim; b = null; f?.(venceu); }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button, input'); if (!t || !b) return;
    if (t.id === 'tb-auto') { auto = t.checked; desenhar(); return; }
    if (t.dataset.fugir) { fechar(false); return; }
    if (t.dataset.continuar) { fechar(b.fim === 'vitoria'); return; }
    if (t.dataset.un) { const u = b.ordem.find((x) => x.id === t.dataset.un); if (u?.hp > 0 && u.lado === 'i') { alvoSel = alvoSel === u.id ? null : u.id; desenhar(); } return; }
    if (t.dataset.acao && !b.fim) { const u = atorAtual(b); if (!u || u.lado !== 'a') return; executar(b, { tipo: t.dataset.acao, alvo: alvoSel || undefined }, rng); alvoSel = null; desenhar(); if (b.fim) clearInterval(timer); }
  });
  return { abrir, aberta: () => el.classList.contains('vis'), batalha: () => b, fechar };
}
