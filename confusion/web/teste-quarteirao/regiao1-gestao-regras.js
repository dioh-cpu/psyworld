// Gestão do reino (regras puras): fila de obras com duração, produção passiva por prédio, coleta em lote e fabricação em lote.
// Tudo é calculado pelo tempo decorrido (timestamps), então ao voltar ao jogo basta chamar `avancar`. Cada obra concluída, cada coleta
// e cada lote saem uma única vez: o item sai da fila quando termina e cada evento tem um id registrado em g.log.
// Dados por reino (em D.gestao): vagasObra, capacidade (por material), capProducaoHoras, receitas, itens. Estruturas: duracao[nivel], producao.
import { custoDoNivel, falta } from './regiao1-estrategia-regras.js';

export const HORA = 3600000;
export function criarGestao() { return { obras: [], producao: {}, itens: {}, fabricacao: [], ultimoLote: null, log: [], seq: 0, ts: 0 }; }
export function gestaoDe(s, agora = Date.now()) {
  const g = s.gestao || (s.gestao = criarGestao());
  g.obras = g.obras || []; g.producao = g.producao || {}; g.itens = g.itens || {}; g.fabricacao = g.fabricacao || []; g.log = g.log || []; g.seq = g.seq || 0;
  if (!g.ts) g.ts = agora;
  // construções concluídas (obras novas e melhorias; fila e obras em andamento não contam). Saves antigos: níveis já construídos.
  if (g.concluidas == null) g.concluidas = Object.values(s.estruturas || {}).reduce((a, e) => a + (e.nivel || 0), 0);
  return g;
}
const registrar = (g, texto, agora) => { g.seq += 1; g.log.push({ id: g.seq, em: agora, t: texto }); if (g.log.length > 40) g.log = g.log.slice(-40); return g.seq; };
export const estrDoLocal = (D, locId) => { const l = D.locais.find((x) => x.id === locId); return l ? D.estruturas.find((e) => e.categoria === l.categoria) : null; };
export const duracaoDaObra = (est, nivel) => (est.duracao?.[nivel - 1] ?? (est.duracaoBase ? est.duracaoBase * (1 + (est.duracaoCresc ?? 0.1) * (nivel - 1)) : 60)) * 1000;
// Terrenos liberados pelo nível da construção principal (sem principal, vale o nível 1)
export const locaisAtivos = (s, D) => { const nv = Math.max(1, s.estruturas?.[D.principalLote]?.nivel || 1); return D.locais.filter((l) => !l.nivelPrincipal || l.nivelPrincipal <= nv); };
export const capacidade = (D, tipo) => D.gestao?.capacidade?.[tipo] ?? D.gestao?.capacidadePadrao ?? 200;

// ---------- obras ----------
// Próximo nível de cada local, ignorando o que já está na fila
export function candidatasObra(s, D) {
  const g = gestaoDe(s);
  return locaisAtivos(s, D).map((l) => {
    const est = estrDoLocal(D, l.id); const emObra = g.obras.find((o) => o.loc === l.id);
    const nivel = (s.estruturas[l.id]?.nivel || 0) + 1 + (emObra ? 1 : 0);
    if (!est || nivel > est.niveis) return { loc: l.id, est, maximo: true };
    return { loc: l.id, est, nivel, custo: custoDoNivel(est, nivel), duracao: duracaoDaObra(est, nivel), emObra: !!emObra };
  });
}
// Enfileira várias obras de uma vez, na ordem pedida. Cada uma consome materiais e vaga; o que não couber fica pendente com o motivo.
export function enfileirarObras(s, D, locs, agora = Date.now()) {
  const g = gestaoDe(s, agora); avancar(s, D, agora);
  const vagas = D.gestao?.vagasObra ?? 2;
  const r = { entraram: [], pendentes: [], custo: {} };
  for (const loc of locs) {
    const c = candidatasObra(s, D).find((x) => x.loc === loc);
    if (!c || c.maximo) { r.pendentes.push({ loc, motivo: 'Nível máximo.' }); continue; }
    if (g.obras.some((o) => o.loc === loc)) { r.pendentes.push({ loc, motivo: 'Já há uma obra neste local.' }); continue; }
    if (g.obras.length >= vagas) { r.pendentes.push({ loc, motivo: `Sem vaga de obra (${vagas}/${vagas} ocupadas).` }); continue; }
    const f = falta(c.custo, s.materiais);
    if (Object.keys(f).length) { r.pendentes.push({ loc, motivo: 'Faltam materiais.', falta: f }); continue; }
    for (const [k, v] of Object.entries(c.custo)) { s.materiais[k] -= v; r.custo[k] = (r.custo[k] || 0) + v; }
    const o = { id: `${loc}-${c.nivel}-${agora}`, loc, tipo: c.est.id, nivel: c.nivel, inicio: agora, fimEm: agora + c.duracao, custo: c.custo };
    g.obras.push(o); r.entraram.push(o);
    registrar(g, `Obra iniciada: ${c.est.nome} nv.${c.nivel}.`, agora);
  }
  return r;
}
// Diamantes para terminar uma obra agora: 1 por minuto restante (mínimo 1). A confirmação fica por conta da interface.
export const custoAceleracao = (o, agora = Date.now()) => Math.max(1, Math.ceil(Math.max(0, o.fimEm - agora) / 60000));
export function acelerarObra(s, D, obraId, diamantes, agora = Date.now()) {
  const g = gestaoDe(s, agora); const o = g.obras.find((x) => x.id === obraId);
  if (!o) return { ok: false, motivo: 'Obra não encontrada.' };
  const custo = custoAceleracao(o, agora);
  if ((diamantes.valor || 0) < custo) return { ok: false, motivo: `Faltam diamantes (${custo}💎).` };
  diamantes.valor -= custo; o.fimEm = agora;
  registrar(g, `Obra acelerada com ${custo}💎.`, agora);
  return { ok: true, custo, concluidas: avancar(s, D, agora).concluidas };
}

// ---------- produção passiva ----------
export const producaoPorHora = (est, nivel, trabalhador) => (est.producao ? est.producao.porHora * nivel * (trabalhador ? 1 + (D_BONUS_TRAB) : 1) : 0);
const D_BONUS_TRAB = 0.1; // Onírico em serviço: +10%; ele continua disponível para combate
// Atualiza obras concluídas, produção acumulada e fila de fabricação até `agora`. Devolve o que terminou agora.
export function avancar(s, D, agora = Date.now()) {
  const g = gestaoDe(s, agora); const ev = { concluidas: [], fabricados: [] };
  // produção: acumula por prédio desde a última atualização (limitada pelo teto de horas)
  const capH = D.gestao?.capProducaoHoras ?? 8;
  for (const [loc, at] of Object.entries(s.estruturas)) {
    const est = D.estruturas.find((e) => e.id === at.tipo); if (!est?.producao) continue;
    const p = g.producao[loc] || (g.producao[loc] = { desde: agora, acum: 0 });
    const ph = producaoPorHora(est, at.nivel, !!s.trabalho?.[loc]);
    const dt = Math.max(0, agora - p.desde); p.desde = agora;
    p.acum = Math.min(ph * capH, p.acum + (ph * dt) / HORA);
  }
  // obras que terminaram (a produção do nível novo começa na conclusão)
  for (const o of [...g.obras].sort((a, b) => a.fimEm - b.fimEm)) {
    if (o.fimEm > agora) continue;
    g.obras = g.obras.filter((x) => x.id !== o.id);
    s.estruturas[o.loc] = { tipo: o.tipo, nivel: o.nivel }; g.concluidas += 1;
    const est = D.estruturas.find((e) => e.id === o.tipo);
    if (est?.producao && !g.producao[o.loc]) g.producao[o.loc] = { desde: o.fimEm, acum: 0 };
    registrar(g, `Obra concluída: ${est?.nome || o.tipo} nv.${o.nivel}.`, agora);
    ev.concluidas.push(o);
  }
  // fabricação: lotes em sequência; cada unidade termina no seu horário
  let cursor = g.fabricacao.length ? (g.fabricacao[0].inicio ?? agora) : agora;
  while (g.fabricacao.length) {
    const l = g.fabricacao[0]; const rec = D.gestao.receitas.find((x) => x.id === l.receita);
    if (l.inicio == null) l.inicio = Math.max(cursor, l.enfileirado || agora);
    const fim = l.inicio + rec.seg * 1000 * l.qtd;
    if (fim > agora) break;
    for (const [k, v] of Object.entries(rec.saida)) g.itens[k] = (g.itens[k] || 0) + v * l.qtd;
    registrar(g, `Lote pronto: ${l.qtd}× ${rec.nome}.`, agora);
    ev.fabricados.push({ ...l, fim }); g.fabricacao.shift(); cursor = fim;
    if (g.fabricacao[0]) g.fabricacao[0].inicio = fim;
  }
  g.ts = agora;
  return ev;
}
export function prontoParaColetar(s, D) {
  const g = gestaoDe(s); const por = {};
  for (const [loc, p] of Object.entries(g.producao)) {
    const est = D.estruturas.find((e) => e.id === s.estruturas[loc]?.tipo); if (!est?.producao) continue;
    const q = Math.floor(p.acum); if (q > 0) por[loc] = { tipo: est.producao.tipo, qtd: q };
  }
  return por;
}
// Coleta tudo do reino. O que não couber no estoque fica no prédio (pendente).
export function coletarTudo(s, D, agora = Date.now()) {
  const g = gestaoDe(s, agora); avancar(s, D, agora);
  const r = { recebido: {}, pendente: {}, motivos: [] };
  for (const [loc, it] of Object.entries(prontoParaColetar(s, D))) {
    const cap = capacidade(D, it.tipo), livre = Math.max(0, cap - (s.materiais[it.tipo] || 0));
    const leva = Math.min(it.qtd, livre);
    if (leva > 0) { s.materiais[it.tipo] = (s.materiais[it.tipo] || 0) + leva; g.producao[loc].acum -= leva; r.recebido[it.tipo] = (r.recebido[it.tipo] || 0) + leva; }
    if (leva < it.qtd) { r.pendente[it.tipo] = (r.pendente[it.tipo] || 0) + (it.qtd - leva); if (!r.motivos.includes(it.tipo)) r.motivos.push(it.tipo); }
  }
  if (Object.keys(r.recebido).length) registrar(g, `Coleta: ${Object.entries(r.recebido).map(([k, v]) => `${v} ${k}`).join(', ')}.`, agora);
  return r;
}

// ---------- fabricação ----------
export function previsaoLote(s, D, receitaId, qtd) {
  const rec = D.gestao.receitas.find((x) => x.id === receitaId); if (!rec) return null;
  const insumos = Object.fromEntries(Object.entries(rec.insumos).map(([k, v]) => [k, v * qtd]));
  const f = falta(insumos, s.materiais);
  return { rec, qtd, insumos, saida: Object.fromEntries(Object.entries(rec.saida).map(([k, v]) => [k, v * qtd])), duracao: rec.seg * 1000 * qtd, falta: f, ok: Object.keys(f).length === 0 && qtd > 0 };
}
export function fabricarLote(s, D, receitaId, qtd, agora = Date.now()) {
  const g = gestaoDe(s, agora); avancar(s, D, agora);
  const p = previsaoLote(s, D, receitaId, qtd);
  if (!p) return { ok: false, motivo: 'Receita desconhecida.' };
  const max = D.gestao.filaFabricacao ?? 3;
  if (g.fabricacao.length >= max) return { ok: false, motivo: `Fila de fabricação cheia (${max} lotes).` };
  if (!p.ok) return { ok: false, motivo: 'Faltam insumos.', falta: p.falta };
  for (const [k, v] of Object.entries(p.insumos)) s.materiais[k] -= v;
  g.fabricacao.push({ id: `${receitaId}-${agora}-${g.seq}`, receita: receitaId, qtd, enfileirado: agora, inicio: g.fabricacao.length ? null : agora });
  g.ultimoLote = { receita: receitaId, qtd };
  registrar(g, `Lote enfileirado: ${qtd}× ${p.rec.nome}.`, agora);
  return { ok: true, previsao: p };
}
export const repetirUltimoLote = (s, D, agora = Date.now()) => { const g = gestaoDe(s, agora); return g.ultimoLote ? fabricarLote(s, D, g.ultimoLote.receita, g.ultimoLote.qtd, agora) : { ok: false, motivo: 'Nenhum lote anterior.' }; };
