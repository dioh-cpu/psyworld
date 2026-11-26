// Regras do evento de Halloween: banner mensal com contador e garantias, tickets separados, doces e evolução de tier, Torre de 4
// dificuldades × 100 andares com marcos pagos uma única vez, loja da Torre e poções de XP. Estado em save.idle.hw.
import { EDICAO, BANNER_HW, LINHAGENS_HW, DOCES, LOJA_TORRE, TORRE, formaDoTier, RENOMEAR_HW } from './regiao1-halloween-dados.js';
import { aplicarXp, previsaoXp, POCOES, nivelDe, xpTotal } from './regiao1-progressao.js';
import { ganharXpPasse } from './regiao1-passe-regras.js';

// Saves anteriores: nomes provisórios viram os definitivos; cada Onírico ganha um id estável (para Equipes)
export function migrarHW(save) {
  let mudou = false, n = 0;
  for (const m of save.idle?.equipe || []) { if (RENOMEAR_HW[m.especie]) { m.especie = RENOMEAR_HW[m.especie]; mudou = true; } }
  const usados = new Set((save.idle?.equipe || []).map((m) => m.uid).filter(Boolean));
  for (const m of save.idle?.equipe || []) if (!m.uid) { while (usados.has(`o${n}`)) n++; m.uid = `o${n}`; usados.add(m.uid); mudou = true; }
  return mudou;
}
export function hwDe(save) {
  const idle = save.idle || (save.idle = {});
  const h = idle.hw || (idle.hw = {});
  h.tickets = h.tickets || 0; h.contador = h.contador || {}; h.doces = h.doces || 0; h.pocoes = h.pocoes || {}; h.loja = h.loja || {};
  h.torre = h.torre || { liberada: 1, maior: {}, pagos: {}, dif: 1, andar: 1 }; h.torre.maior ||= {}; h.torre.pagos ||= {};
  h.historico = h.historico || [];
  return h;
}
const dia = (d) => new Date(`${d}T00:00:00`);
export const eventoAtivo = (agora = new Date(), ed = EDICAO) => agora >= dia(ed.inicio) && agora < new Date(dia(ed.fim).getTime() + 86400000);

// ---------- tickets ----------
export function comprarPacote(save, confirmado) {
  const h = hwDe(save), { tickets, diamantes } = BANNER_HW.pacote;
  if (!confirmado) return { ok: false, precisaConfirmar: true, motivo: `Comprar ${tickets} Tickets de Halloween por ${diamantes}💎?` };
  if ((save.recompensas?.diamantes || 0) < diamantes) return { ok: false, motivo: `Faltam diamantes (${diamantes}💎).` };
  save.recompensas.diamantes -= diamantes; h.tickets += tickets; return { ok: true, tickets: h.tickets };
}

// ---------- banner: a posição no contador define a garantia daquela invocação ----------
export function tierDaPosicao(pos, rng = Math.random, cfg = BANNER_HW) {
  if (pos % 100 === 0) return { tier: cfg.marco100, garantia: 100 };
  if (pos % 50 === 0) return { tier: cfg.marco50, garantia: 50 };
  if (pos % 10 === 0) { const r = rng(); return { tier: r < cfg.garantia10[3] ? 3 : 4, garantia: 10 }; }
  let r = rng(), acc = 0;
  for (const t of [1, 2, 3, 4, 5]) { acc += cfg.chances[t]; if (r < acc) return { tier: t, garantia: null }; }
  return { tier: 1, garantia: null };
}
// Bônus de tier de um membro da equipe (zero para quem não é exclusivo)
export const bonusDoMembro = (m) => (m?.tierHW ? { hp: 0.15 * (m.tierHW - 1), atk: 0.15 * (m.tierHW - 1), def: 0.12 * (m.tierHW - 1) } : {});
export const proximosMarcos = (n) => ({ ate10: 10 - (n % 10), ate50: 50 - (n % 50), ate100: 100 - (n % 100) });
export function invocarHW(save, quantos = 1, rng = Math.random, ed = EDICAO) {
  const h = hwDe(save);
  if (h.tickets < quantos) return { ok: false, motivo: `Precisa de ${quantos} Ticket(s) de Halloween (você tem ${h.tickets}).` };
  h.tickets -= quantos; const resultados = [];
  for (let i = 0; i < quantos; i++) { // o lote de 10 é processado em ordem, contando cada invocação
    const pos = (h.contador[ed.id] || 0) + 1; h.contador[ed.id] = pos; h.total = (h.total || 0) + 1;
    const { tier, garantia } = tierDaPosicao(pos, rng);
    if (tier === 5) h.contador[ed.id] = 0; // Tier 5 (sorte ou garantia) reinicia a contagem
    const lin = LINHAGENS_HW.find((l) => l.tier === tier);
    const novo = { especie: lin.especie, nivel: 1, xp: 0, raridade: tier, forma: 'natural', tierHW: tier, evento: ed.id, uid: `h${ed.id.slice(-4)}${h.total || 0}_${i}` };
    (save.idle.equipe ||= []).push(novo);
    resultados.push({ pos, tier, garantia, especie: lin.especie });
  }
  h.historico.push(...resultados.map((r) => `${r.pos}: T${r.tier}${r.garantia ? ` (garantia ${r.garantia})` : ''}`)); if (h.historico.length > 60) h.historico = h.historico.slice(-60);
  return { ok: true, resultados, contador: h.contador[ed.id], marcos: proximosMarcos(h.contador[ed.id]) };
}

// ---------- evolução de tier com doces ----------
export const ehHW = (m) => Boolean(m?.tierHW);
export function infoEvolucao(m) {
  if (!ehHW(m) || m.tierHW >= 5) return null;
  const lin = LINHAGENS_HW.find((l) => l.especie === m.especie);
  return { custo: DOCES.custos[m.tierHW - 1], de: m.tierHW, para: m.tierHW + 1, formaAtual: formaDoTier(m.tierHW), formaNova: formaDoTier(m.tierHW + 1), arteNova: lin?.arte[formaDoTier(m.tierHW + 1)] };
}
export function evoluirHW(save, idx) {
  const h = hwDe(save), m = save.idle.equipe?.[idx], inf = infoEvolucao(m);
  if (!inf) return { ok: false, motivo: 'Este Onírico não evolui com doces.' };
  if (h.doces < inf.custo) return { ok: false, motivo: `Faltam doces (${inf.custo}🍬).` };
  h.doces -= inf.custo; m.tierHW = inf.para; m.raridade = inf.para; return { ok: true, ...inf };
}
// Drop de doce (só durante o evento). origem: 'abate' (Campanha, Auto-Caça, Caçadas, Torre) ou 'andar'.
export function talvezDoce(save, origem, rng = Math.random, agora = new Date()) {
  if (!eventoAtivo(agora)) return 0;
  const p = origem === 'andar' ? DOCES.chanceAndar : DOCES.chanceAbate;
  if (rng() < p) { hwDe(save).doces += 1; return 1; } return 0;
}
export function comprarLoja(save, id, aplicar = {}) {
  const h = hwDe(save), it = LOJA_TORRE.find((x) => x.id === id); if (!it) return { ok: false, motivo: 'Item inexistente.' };
  if (h.doces < it.custo) return { ok: false, motivo: `Faltam doces (${it.custo}🍬).` };
  h.doces -= it.custo; h.loja[id] = (h.loja[id] || 0) + 1;
  if (it.tipo === 'pocao') h.pocoes[id] = (h.pocoes[id] || 0) + 1; else aplicar[it.tipo]?.(it);
  return { ok: true, item: it };
}

// ---------- poções de XP (Domador ou Onírico), preservando o excedente ----------
export function alvoXp(save, alvo) {
  if (alvo === 'domador') { const j = save.idle.jogador; return { obj: { nivel: nivelDe(j.xp), xp: j.xp }, salvar: (o) => { j.xp = o.xp; } }; }
  const m = save.idle.equipe?.[Number(alvo)]; if (!m) return null;
  return { obj: { nivel: m.nivel || 1, xp: Math.max(m.xp || 0, xpTotal(m.nivel || 1)) }, salvar: (o) => { m.xp = o.xp; m.nivel = o.nivel; } };
}
export const previsaoPocao = (save, alvo, pocao) => { const a = alvoXp(save, alvo); return a && POCOES[pocao] ? previsaoXp(a.obj, POCOES[pocao].xp) : null; };
export function usarPocao(save, alvo, pocao) {
  const h = hwDe(save); if (!(h.pocoes[pocao] > 0)) return { ok: false, motivo: 'Você não tem essa poção.' };
  const a = alvoXp(save, alvo); if (!a) return { ok: false, motivo: 'Alvo inválido.' };
  h.pocoes[pocao] -= 1; const r = aplicarXp(a.obj, POCOES[pocao].xp); a.salvar(a.obj); return { ok: true, ...r };
}
export const darPocao = (save, id, n = 1) => { const h = hwDe(save); h.pocoes[id] = (h.pocoes[id] || 0) + n; };

// ---------- Torre ----------
const POOL = ['Noctarn', 'Ignavor', 'Vaelith', 'Brotavel', 'Fanalino', 'Cervomusgo', 'Cobrabúfalo', 'Tatuveludo', 'Xistolim', 'Melifalcão', 'Lavândria', 'Calquélon', 'Vesprata', 'Colmeiro', 'Cerifogo', 'Âmbarasa', 'Zunifaísca', 'Trovoresta', 'Voltabelha', 'Falesário', 'Ventassol', 'Bronzelo', 'Latonhorn'];
// Curva suave no começo (expoente 1,25) e um alívio nos 10 primeiros andares da Dificuldade 1, para os iniciais chegarem aos primeiros tickets
export function nivelDoAndar(dif, andar) { const [a, b] = TORRE.dificuldades[dif - 1].nivel; const t = (andar - 1) / 99; const nv = a + (b - a) * Math.pow(t, 1.25); return Math.max(1, Math.round(nv) - (dif === 1 && andar > 1 && andar <= 10 ? 1 : 0)); }
// Composição varia por andar (determinística): 2 a 6 inimigos (até 4 em campo + 2 na fila). Múltiplos de 10 têm chefe.
export function andar(dif, n) {
  const nv = nivelDoAndar(dif, n), qtd = Math.min(6, 2 + Math.floor((n - 1) / 20) + (n % 10 === 0 ? 1 : 0) + (dif - 1));
  const sem = (n * 7 + dif * 13) % POOL.length;
  const inimigos = Array.from({ length: qtd }, (_, i) => [POOL[(sem + i * 5) % POOL.length], Math.max(1, nv - (i % 3 === 2 ? 2 : 0))]);
  if (n % 10 === 0) inimigos[0] = [POOL[(sem + 3) % POOL.length], nv + 2, undefined, { chefe: true, bonus: { hp: 2.2, atk: 0.35, def: 0.3 } }];
  return { dif, n, nivel: nv, recomendado: nv, inimigos, arena: TORRE.arenas[dif - 1], marco: n % 10 === 0 };
}
export const proximaRecompensa = (save, dif) => { const h = hwDe(save); const m = h.torre.maior[dif] || 0; const alvo = Math.min(100, (Math.floor(m / 10) + 1) * 10); return h.torre.pagos[`${dif}:${alvo}`] ? null : { andar: alvo, tickets: TORRE.ticketsPorMarco }; };
// Vitória: registra o andar e paga o marco junto, uma única vez (mesmo recarregando ou repetindo o andar)
export function vencerAndar(save, dif, n, rng = Math.random, agora = new Date()) {
  const h = hwDe(save), t = h.torre;
  if (dif > t.liberada) return { ok: false, motivo: 'Dificuldade bloqueada.' };
  if (n > (t.maior[dif] || 0) + 1) return { ok: false, motivo: 'Vença o andar anterior primeiro.' };
  t.maior[dif] = Math.max(t.maior[dif] || 0, n);
  const r = { ok: true, tickets: 0, doce: 0, pocao: null, liberou: null };
  const chave = `${dif}:${n}`;
  if (n % 10 === 0 && !t.pagos[chave]) { t.pagos[chave] = true; h.tickets += TORRE.ticketsPorMarco; r.tickets = TORRE.ticketsPorMarco; }
  if (n === 100 && dif < TORRE.dificuldades.length && t.liberada <= dif) { t.liberada = dif + 1; r.liberou = dif + 1; }
  r.doce = talvezDoce(save, 'andar', rng, agora);
  if (rng() < TORRE.chancePocao) { const id = dif >= 3 ? 'pocao_xp_g' : dif === 2 ? 'pocao_xp_m' : 'pocao_xp_p'; darPocao(save, id); r.pocao = id; }
  ganharXpPasse(save, 'torre', null, agora);
  for (const m of save.idle?.diarias?.itens || []) if (m.tipo === 'batalhas' && !m.resgatada) m.progresso = Math.min(m.meta, m.progresso + 1);
  t.dif = dif; t.andar = Math.min(100, n + 1);
  return r;
}
