// Regras puras da Expansão 1: banner/tickets, contratos da Guilda, Calabouço com Sanidade, Crise da cidade e Herói × Vilão.
// O estado fica em save.idle.exp. Cada recompensa é paga uma única vez (marcadores em exp.concedidos / contratos / hv).
import { criarUnidade, criarBatalha, atorAtual, executar, decidir, LIMITE_ALIADOS } from './regiao1-estrategia-regras.js';
import { MARCOS, MISSOES_HISTORIA, CONTRATOS, CALABOUCO, CRISE, HV, FAB } from './regiao1-exp-dados.js';
import { REINOS } from '../reinos.js';
import { gestaoDe } from './regiao1-gestao-regras.js';
import { darPocao } from './regiao1-halloween-regras.js';

export function expDe(save) {
  const idle = save.idle || (save.idle = {});
  const e = idle.exp || (idle.exp = {});
  Object.assign(e, { tickets: 0, concedidos: {}, pulls: 0, tut: {}, visitouCidade: false, cacadas: { ativa: null, retorno: null, abates: 0 }, guilda: { contratos: {} }, fazenda: false, oficina: false, calabouco: { run: null, feitos: 0 }, crise: null, hv: {}, ...e });
  e.cacadas = { ativa: null, retorno: null, abates: 0, ...e.cacadas }; e.guilda = { contratos: {}, ...e.guilda }; e.calabouco = { run: null, feitos: 0, ...e.calabouco }; e.hv = e.hv || {}; e.tut = e.tut || {}; e.concedidos = e.concedidos || {};
  return e;
}
export const questFeita = (save, q) => save.quests?.[q] === 'concluida';

// Formação (aba Equipes): 4 vagas com o id estável de cada Onírico (ou vazia). Vaga vazia não desloca as outras.
export function formacaoDe(idle) {
  const eq = idle.equipe || [];
  eq.forEach((m, i) => { if (!m.uid) m.uid = `o${i}_${Date.now() % 100000}`; });
  if (!Array.isArray(idle.formacao) || idle.formacao.length !== 4) {
    const salvos = Array.isArray(idle.equipeCombate) ? [...new Set(idle.equipeCombate.filter((i) => Number.isInteger(i) && eq[i]))] : [];
    const base = (salvos.length ? salvos : eq.slice(0, LIMITE_ALIADOS).map((_, i) => i)).slice(0, 4).map((i) => eq[i].uid);
    idle.formacao = [...base, null, null, null, null].slice(0, 4);
  }
  idle.formacao = idle.formacao.map((u) => (u && eq.some((m) => m.uid === u) ? u : null));
  if (!idle.formacao.some(Boolean) && eq[0]) idle.formacao[0] = eq[0].uid;
  return idle.formacao;
}
export function membrosFormacao(idle) {
  const eq = idle.equipe || [];
  return formacaoDe(idle).map((uid, vaga) => { const idx = eq.findIndex((m) => m.uid === uid); return idx >= 0 ? { m: eq[idx], idx, vaga } : null; }).filter(Boolean);
}
export function colocarNaVaga(idle, uid, vaga) {
  const f = formacaoDe(idle); const de = f.indexOf(uid);
  if (de === vaga) return f;
  const ocupante = f[vaga]; f[vaga] = uid; if (de >= 0) f[de] = ocupante ?? null; // troca se já estava em outra vaga
  return f;
}
export function trocarVagas(idle, a, b) { const f = formacaoDe(idle); [f[a], f[b]] = [f[b], f[a]]; return f; }
export function tirarDaVaga(idle, vaga) { const f = formacaoDe(idle); if (f.filter(Boolean).length <= 1) return false; f[vaga] = null; return true; }
export function indicesEquipeCombate(idle) {
  const membros = membrosFormacao(idle); if (membros.length) return membros.map((x) => x.idx);
  const equipe = idle.equipe || [];
  const salvos = Array.isArray(idle.equipeCombate) ? idle.equipeCombate : [];
  const validos = [...new Set(salvos.filter(i => Number.isInteger(i) && equipe[i]))];
  return validos.length ? validos.slice(0, LIMITE_ALIADOS) : equipe.slice(0, LIMITE_ALIADOS).map((_, i) => i);
}

export const aberto = (save, modo) => {
  const e = expDe(save);
  switch (modo) {
    case 'banner': return questFeita(save, MARCOS.banner) || e.tickets > 0 || e.pulls > 0;
    case 'cacadas': return questFeita(save, MARCOS.cacada1);
    case 'guilda': return e.visitouCidade || questFeita(save, MARCOS.cronicas);
    case 'calabouco': return questFeita(save, MARCOS.calabouco);
    case 'cronicas': return questFeita(save, MARCOS.cronicas);
    case 'reinos': return Boolean(save.desbloqueios?.fazenda) || questFeita(save, MARCOS.reinos);
    default: return false;
  }
};

// ---- Tickets: 1 por missão de história, na primeira conclusão ----
export function concederTickets(save) {
  const e = expDe(save); let n = 0;
  for (const q of MISSOES_HISTORIA) if (questFeita(save, q) && !e.concedidos[q]) { e.concedidos[q] = true; e.tickets += 1; n += 1; }
  return n;
}

// ---- Banner ----
const RARIDADES = [['comum', 0.70, 1], ['rara', 0.22, 2], ['epica', 0.07, 3], ['lendaria', 0.01, 4]];
export function poolBanner() {
  const vistos = new Set(), pool = [];
  for (const r of Object.values(REINOS)) for (const l of r.linhagens) if (!vistos.has(l.nome)) { vistos.add(l.nome); const k = [...l.nome].reduce((a, c) => a + c.charCodeAt(0), 0) % 10; pool.push({ especie: l.nome, elemento: l.elemento, raridade: k < 6 ? 'comum' : k < 8 ? 'rara' : k < 9 ? 'epica' : 'lendaria' }); }
  return pool;
}
export function invocar(save, rng = Math.random) {
  const e = expDe(save);
  if (e.tickets < 1) return { ok: false, motivo: 'Sem tickets. Eles vêm da primeira conclusão das missões de história.' };
  e.tickets -= 1; e.pulls += 1;
  const garantia = e.pulls % 10 === 0; // a cada 10 invocações, pelo menos rara
  let r = rng(), alvo = 'comum', acc = 0;
  for (const [nome, taxa] of RARIDADES) { acc += taxa; if (r < acc) { alvo = nome; break; } }
  if (garantia && alvo === 'comum') alvo = 'rara';
  const pool = poolBanner(); let cand = pool.filter((p) => p.raridade === alvo); if (!cand.length) cand = pool;
  const sorteado = cand[Math.floor(rng() * cand.length) % cand.length];
  const nivel = 1, idle = save.idle; (idle.equipe = idle.equipe || []).push({ especie: sorteado.especie, nivel, xp: 0, raridade: RARIDADES.find((x) => x[0] === sorteado.raridade)[2], forma: 'natural' });
  return { ok: true, ...sorteado };
}

// ---- Guilda ----
export const estadoContrato = (save, c) => {
  const e = expDe(save), st = e.guilda.contratos[c.id];
  if (st === 'entregue') return 'entregue';
  if (c.requer && e.guilda.contratos[c.requer] !== 'entregue') return 'bloqueado';
  return st === 'ativo' ? 'ativo' : 'disponivel';
};
export function estoqueDaFab(save) { const s = fabEstado(save); return { mat: s.materiais, itens: s.gestao?.itens || {} }; }
export function fabEstado(save) {
  const e = expDe(save); const idle = save.idle;
  const s = idle.exp.fab || (idle.exp.fab = { materiais: { ...FAB.inicial }, estruturas: {}, trabalho: {}, profissoes: {} });
  s.materiais = { ...FAB.inicial, ...s.materiais }; s.estruturas = s.estruturas || {}; s.profissoes = s.profissoes || {};
  gestaoDe(s); void e; return s;
}
export function aceitarContrato(save, id) {
  const c = CONTRATOS.find((x) => x.id === id), e = expDe(save);
  if (!c || estadoContrato(save, c) !== 'disponivel') return { ok: false, motivo: 'Contrato indisponível.' };
  e.guilda.contratos[id] = 'ativo'; return { ok: true };
}
export function podeEntregar(save, c) {
  const { mat, itens } = estoqueDaFab(save);
  return Object.entries(c.pede.mat || {}).every(([k, v]) => (mat[k] || 0) >= v) && Object.entries(c.pede.itens || {}).every(([k, v]) => (itens[k] || 0) >= v);
}
export function entregarContrato(save, id) {
  const c = CONTRATOS.find((x) => x.id === id), e = expDe(save);
  if (!c || estadoContrato(save, c) !== 'ativo') return { ok: false, motivo: 'O contrato precisa estar aceito.' };
  if (!podeEntregar(save, c)) return { ok: false, motivo: 'Faltam itens para entregar.' };
  const s = fabEstado(save);
  for (const [k, v] of Object.entries(c.pede.mat || {})) s.materiais[k] -= v;
  for (const [k, v] of Object.entries(c.pede.itens || {})) s.gestao.itens[k] -= v;
  e.guilda.contratos[id] = 'entregue'; // uma única vez
  save.recompensas.gold += c.recompensa.gold || 0; save.recompensas.diamantes += c.recompensa.diamantes || 0;
  if (c.libera === 'fazenda') liberarFazenda(save);
  if (c.libera === 'oficina') e.oficina = true;
  return { ok: true, contrato: c };
}
export function liberarFazenda(save) {
  const e = expDe(save), s = fabEstado(save); if (e.fazenda) return; e.fazenda = true;
  s.estruturas = { ...s.estruturas, cur: { tipo: 'curral', nivel: 1 }, api: { tipo: 'apiario', nivel: 1 }, gal: { tipo: 'galinheiro', nivel: 1 } };
}

// ---- Cacadas ----
export function materiaisDoAbate(cacada, rng = Math.random) {
  const r = {}; if (rng() > cacada.chance) return r;
  for (const [k, [a, b]] of Object.entries(cacada.materiais)) { const n = a + Math.floor(rng() * (b - a + 1)); if (n) r[k] = n; }
  return r;
}

// ---- Calabouço e Sanidade ----
function poderLuta(equipe, nivel, rng) {
  const papeis = {};
  const al = equipe.slice(0, 3).map((m, i) => criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel || 1, lado: 'a', papeis }));
  const ini = [0, 1].map((i) => criarUnidade({ id: `i${i}`, especie: 'Noctarn', nivel, lado: 'i', papeis }));
  const b = criarBatalha(al, ini); let g = 0;
  while (!b.fim && g++ < 200) executar(b, decidir(b, atorAtual(b), rng), rng);
  return { vitoria: b.fim === 'vitoria', hpFinal: al.reduce((a, u) => a + u.hp, 0) / al.reduce((a, u) => a + u.hpMax, 0) };
}
export function iniciarCalabouco(save) {
  const e = expDe(save);
  if (!aberto(save, 'calabouco')) return { ok: false, motivo: 'O calabouço abre depois de derrotar o Espírito da Floresta.' };
  e.calabouco.run = { sala: 0, sanidade: CALABOUCO.sanidadeMax, ganhos: {}, estado: 'sala', log: [`Você desce às ${CALABOUCO.nome}.`], pago: false, resultado: null };
  return { ok: true };
}
const somar = (run, rec, mult = 1) => { for (const [k, v] of Object.entries(rec)) run.ganhos[k] = (run.ganhos[k] || 0) + Math.round(v * mult); };
export function encerrarCalabouco(save, run, motivo) {
  const e = expDe(save); if (run.pago) return run;
  run.pago = true; run.estado = 'fim'; run.resultado = motivo;
  const perda = motivo === 'sanidade' || motivo === 'derrota' ? 0.5 : 1; // sair por escolha ou concluir preserva tudo
  const g = {}; for (const [k, v] of Object.entries(run.ganhos)) g[k] = Math.floor(v * perda);
  save.recompensas.gold += g.gold || 0; save.recompensas.diamantes += g.diamantes || 0;
  const s = fabEstado(save); for (const k of ['fibra', 'cristal']) if (g[k]) s.materiais[k] = (s.materiais[k] || 0) + g[k];
  run.pagos = g; if (motivo === 'concluido') e.calabouco.feitos += 1;
  run.log.push(motivo === 'concluido' ? 'Calabouço concluído!' : motivo === 'saiu' ? 'Você saiu com os ganhos.' : motivo === 'sanidade' ? 'A Sanidade acabou: você foi arrastado para fora, perdendo metade dos ganhos.' : 'A equipe caiu: metade dos ganhos foi perdida.');
  return run;
}
// Avança uma sala. Antes de uma sala corrompida com Sanidade baixa, pede escolha (tônico, risco ou sair).
export function avancarSala(save, rng = Math.random, escolha = null) {
  const e = expDe(save), run = e.calabouco.run; if (!run || run.pago) return { ok: false, motivo: 'Sem expedição ativa.' };
  const sala = CALABOUCO.salas[run.sala]; if (!sala) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
  const equipe = save.idle.equipe || [];
  if (sala.tipo === 'corrompida') {
    if (run.sanidade <= CALABOUCO.limiteEscolha && !escolha) { run.estado = 'escolha'; return { ok: true, run, precisaEscolher: true }; }
    if (escolha === 'sair') return { ok: true, run: encerrarCalabouco(save, run, 'saiu') };
    if (escolha === 'tonico') {
      const s = fabEstado(save); const itens = s.gestao?.itens || {};
      if (!(itens.tonico > 0)) return { ok: false, motivo: 'Você não tem Tônico de Lucidez.' };
      itens.tonico -= 1; run.sanidade = Math.min(CALABOUCO.sanidadeMax, run.sanidade + CALABOUCO.tonico); run.log.push(`Tônico usado: Sanidade ${run.sanidade}.`);
    }
    const risco = escolha === 'risco';
    run.sanidade = Math.max(0, run.sanidade - CALABOUCO.perdaCorrompida);
    somar(run, CALABOUCO.recompensas.corrompida, risco ? 2 : 1);
    run.log.push(`${sala.rotulo}: Sanidade ${run.sanidade}${risco ? ' (avançou com risco, ganhos dobrados)' : ''}.`);
    run.sala += 1; run.estado = 'sala';
    if (run.sanidade <= 0) return { ok: true, run: encerrarCalabouco(save, run, 'sanidade') };
    return { ok: true, run };
  }
  const r = poderLuta(equipe, sala.nivel, rng);
  if (!r.vitoria) return { ok: true, run: encerrarCalabouco(save, run, 'derrota') };
  somar(run, CALABOUCO.recompensas[sala.tipo]); run.log.push(`${sala.rotulo}: vitória (${Math.round(r.hpFinal * 100)}% de vida).`);
  run.sala += 1; run.estado = 'sala';
  if (run.sala >= CALABOUCO.salas.length) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
  return { ok: true, run };
}

// ---- Crise ----
export function criseDe(save) {
  const e = expDe(save);
  if (!e.crise) e.crise = { estado: 'saudavel', zumbis: 0, historico: ['saudavel'], servicoEm: 0, tonicosDados: 0 };
  return e.crise;
}
const gasta = (save, custo) => {
  const s = fabEstado(save), itens = (s.gestao ||= { itens: {} }).itens || (s.gestao.itens = {});
  for (const [k, v] of Object.entries(custo.mat || {})) if ((s.materiais[k] || 0) < v) return false;
  for (const [k, v] of Object.entries(custo.itens || {})) if ((itens[k] || 0) < v) return false;
  if ((custo.gold || 0) > save.recompensas.gold) return false;
  for (const [k, v] of Object.entries(custo.mat || {})) s.materiais[k] -= v;
  for (const [k, v] of Object.entries(custo.itens || {})) itens[k] -= v;
  save.recompensas.gold -= custo.gold || 0; return true;
};
const ir = (c, estado) => { c.estado = estado; c.zumbis = CRISE.zumbis[estado]; c.historico.push(estado); };
export function acaoCrise(save, acao, rng = Math.random, agora = Date.now()) {
  const c = criseDe(save);
  if (acao === 'surto' && c.estado === 'saudavel') { ir(c, 'contaminada'); return { ok: true, msg: 'O surto começou: zumbis nas ruas.' }; }
  if (acao === 'aguardar' && c.estado === 'contaminada') { ir(c, 'tomada'); return { ok: true, msg: 'A vila foi tomada. As ruas são dos zumbis.' }; }
  if (acao === 'conter' && c.estado === 'contaminada') { if (!gasta(save, CRISE.custos.conter)) return { ok: false, motivo: 'Faltam 2 Tônicos de Lucidez.' }; ir(c, 'purificada'); return { ok: true, msg: 'Surto contido: a vila foi purificada.' }; }
  if (acao === 'retomar' && c.estado === 'tomada') {
    if (c.zumbis <= 0) return { ok: false, motivo: 'Não restam zumbis.' };
    const r = poderLuta(save.idle.equipe || [], 5 + c.zumbis, rng);
    if (!r.vitoria) return { ok: false, motivo: 'A equipe foi repelida. Suba o nível dos Oníricos e tente de novo.' };
    c.zumbis = Math.max(0, c.zumbis - 3); return { ok: true, msg: c.zumbis ? `Rua retomada: restam ${c.zumbis} zumbis.` : 'As ruas estão livres de zumbis.' };
  }
  if (acao === 'purificar' && c.estado === 'tomada') { if (c.zumbis > 0) return { ok: false, motivo: 'Retome as ruas antes de purificar.' }; if (!gasta(save, CRISE.custos.purificar)) return { ok: false, motivo: 'Faltam 1 Tônico e 2 Cristais.' }; ir(c, 'purificada'); return { ok: true, msg: 'A vila foi purificada.' }; }
  if (acao === 'reconstruir' && c.estado === 'purificada') { if (!gasta(save, CRISE.custos.reconstruir)) return { ok: false, motivo: 'Faltam 8 Fibras, 4 Cristais e 100 de ouro.' }; ir(c, 'reconstruida'); c.servicoEm = agora; return { ok: true, msg: 'Reconstruída: o Posto de cura reabriu.' }; }
  if (acao === 'servico' && c.estado === 'reconstruida') {
    if (agora - c.servicoEm < CRISE.servico.intervaloMs) return { ok: false, motivo: 'O posto ainda está preparando o próximo tônico.' };
    c.servicoEm = agora; const s = fabEstado(save); (s.gestao ||= { itens: {} }).itens = s.gestao.itens || {}; s.gestao.itens.tonico = (s.gestao.itens.tonico || 0) + 1; c.tonicosDados += 1; return { ok: true, msg: 'O posto entregou 1 Tônico de Lucidez.' };
  }
  return { ok: false, motivo: 'Ação indisponível neste estado.' };
}
export const reiniciarCrise = (save) => { expDe(save).crise = null; return criseDe(save); };

// ---- Herói × Vilão ----
export function hvDe(save, capId = 'cap1') {
  const e = expDe(save); const h = e.hv[capId] || (e.hv[capId] = { atual: 1, feitas: {}, escolha: null, fim: false });
  return h;
}
export const capitulo = (id) => HV.capitulos.find((c) => c.id === id);
export function missaoResolvida(save, capId, n) {
  const h = hvDe(save, capId), m = capitulo(capId).missoes.find((x) => x.n === n);
  const v = m.porEscolha?.[h.escolha] || {};
  return { ...m, ...v, dialogo: v.dialogo || m.dialogo, inimigos: v.inimigos || m.inimigos, objetivo: v.objetivo || m.objetivo };
}
export function estadoMissao(save, capId, n) { const h = hvDe(save, capId); return h.feitas[n] ? 'feita' : n === h.atual ? 'atual' : n < h.atual ? 'feita' : 'bloqueada'; }
export function escolherHV(save, capId, n, opcaoId) {
  const h = hvDe(save, capId), m = capitulo(capId).missoes.find((x) => x.n === n);
  if (!m?.escolha || h.escolha) return { ok: false };
  if (!m.escolha.opcoes.some((o) => o.id === opcaoId)) return { ok: false };
  h.escolha = opcaoId; return { ok: true };
}
export function concluirMissaoHV(save, capId, n) {
  const h = hvDe(save, capId); const m = missaoResolvida(save, capId, n);
  if (n !== h.atual || h.feitas[n]) return { ok: false, motivo: 'Missão já concluída ou bloqueada.' }; // sem pagamento duplo
  if (m.escolha && !h.escolha) return { ok: false, motivo: 'Faça a escolha da missão antes de concluir.' };
  h.feitas[n] = true; h.atual = Math.min(capitulo(capId).missoes.length + 1, n + 1);
  save.recompensas.gold += m.recompensa.gold || 0; save.recompensas.diamantes += m.recompensa.diamantes || 0; darPocao(save, 'pocao_xp_p');
  if (n === capitulo(capId).missoes.length) h.fim = true;
  return { ok: true, recompensa: m.recompensa, fim: h.fim, epilogo: h.fim ? capitulo(capId).missoes[n - 1].epilogo?.[h.escolha] : null };
}
