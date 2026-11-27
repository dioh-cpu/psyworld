// Regras puras da Expansão 1: banner/tickets, contratos da Guilda, Calabouço com Sanidade, Crise da cidade e Herói × Vilão.
// O estado fica em save.idle.exp. Cada recompensa é paga uma única vez (marcadores em exp.concedidos / contratos / hv).
import { criarRng, criarUnidade, criarBatalha, atorAtual, executar, decidir, LIMITE_ALIADOS } from './regiao1-estrategia-regras.js';
import { MARCOS, MISSOES_HISTORIA, CONTRATOS, CONTRATOS_DIARIOS_GRUPOS, CALABOUCO, CRISE, HV, FAB } from './regiao1-exp-dados.js';
import { REINOS } from '../reinos.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { gestaoDe, avancar as avancarGestao } from './regiao1-gestao-regras.js';
import { darPocao, hwDe } from './regiao1-halloween-regras.js';
import { aplicarXp, estrelasIniciais, classeDaEspecie } from './regiao1-progressao.js';
import { ganharXpPasse } from './regiao1-passe-regras.js';
import { ehElementoForaBannerPermanente, NOCTARN_REGRA } from './regiao1-regras-sonho.js';

export function expDe(save) {
  const idle = save.idle || (save.idle = {});
  const e = idle.exp || (idle.exp = {});
  Object.assign(e, { tickets: 0, concedidos: {}, pulls: 0, tut: {}, visitouCidade: false, cacadas: { ativa: null, retorno: null, abates: 0 }, guilda: { contratos: {}, diarios: null }, fazenda: false, oficina: false, calabouco: { run: null, feitos: 0 }, crise: null, hv: {}, ...e });
  e.cacadas = { ativa: null, retorno: null, abates: 0, ...e.cacadas }; e.guilda = { contratos: {}, diarios: null, ...e.guilda }; e.calabouco = { run: null, feitos: 0, ...e.calabouco }; e.hv = e.hv || {}; e.tut = e.tut || {}; e.concedidos = e.concedidos || {};
  return e;
}
export const questFeita = (save, q) => save.quests?.[q] === 'concluida';

// XP da Campanha para a formação ativa (vitória inteira, derrota 30%, chefe ×2)
export function darXpCampanha(idle, { nivel = 1, chefe = false, vitoria = true } = {}, agora = Date.now()) {
  const xp = Math.round((40 + 12 * Math.max(1, nivel)) * (chefe ? 2 : 1) * (vitoria ? 1 : 0.3));
  const membros = membrosFormacao(idle).map(({ m, idx, vaga }) => ({ idx, vaga, ...aplicarXp(m, xp) }));
  ganharXpPasse(idle, vitoria ? (chefe ? 'batalhaChefe' : 'batalha') : 'derrota', null, agora);
  return { xp, membros };
}

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
    case 'descanso':
    case 'equipe': return true;
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

// ---- Banner Permanente (Adventurer: Sombra/trevas e Noctarn ficam fora do permanente) ----
export const BANNER_PERMANENTE_ID = 'adventurer';
const RARIDADES = [['comum', 0.70, 1], ['rara', 0.22, 3], ['epica', 0.07, 4], ['lendaria', 0.01, 5]];
export function poolBanner() {
  const vistos = new Set(), pool = [];
  for (const r of Object.values(REINOS)) {
    for (const l of r.linhagens) {
      if (vistos.has(l.nome)) continue;
      if (ehElementoForaBannerPermanente(l.elemento) || l.nome === NOCTARN_REGRA.especie) continue;
      vistos.add(l.nome);
      const k = [...l.nome].reduce((a, c) => a + c.charCodeAt(0), 0) % 10;
      const raridade = k < 6 ? 'comum' : k < 8 ? 'rara' : k < 9 ? 'epica' : 'lendaria';
      const tier = RARIDADES.find((x) => x[0] === raridade)[2];
      pool.push({ especie: l.nome, elemento: l.elemento, classe: classeDaEspecie(l.nome), raridade, tier });
    }
  }
  // Linhas iniciais no banner permanente (forma inicial, T4 como o inicial escolhido; viram T5 na forma final, no nível 40)
  for (const especie of ['Brasinha', 'Gotalume', 'Sementil']) if (!vistos.has(especie)) {
    vistos.add(especie);
    pool.push({ especie, elemento: ELEMENTO_DA_ESPECIE[especie], classe: classeDaEspecie(especie), raridade: 'epica', tier: 4, inicial: true });
  }
  return pool;
}
export function poolBannerSombra() {
  return [{ especie: NOCTARN_REGRA.especie, elemento: NOCTARN_REGRA.elemento, classe: classeDaEspecie(NOCTARN_REGRA.especie), tier: NOCTARN_REGRA.tier, raridade: 'epica', banner: 'sombra' }];
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
  const tier = RARIDADES.find((x) => x[0] === sorteado.raridade)?.[2] || 1;
  const nivel = 1, estrelas = estrelasIniciais('banner'), idle = save.idle;
  (idle.equipe = idle.equipe || []).push({ especie: sorteado.especie, nivel, xp: 0, tier, raridade: tier, estrelas, forma: 'natural', origem: 'banner', fonteBanner: BANNER_PERMANENTE_ID, uid: `b${e.pulls}_${idle.equipe.length}` });
  return { ok: true, ...sorteado, tier, estrelas };
}
export function invocarMultiplo(save, qtd = 10, rng = Math.random) {
  const n = qtd === 10 ? 10 : 1;
  const e = expDe(save);
  if (e.tickets < n) return { ok: false, motivo: `Precisa de ${n} ticket${n > 1 ? 's' : ''} (você tem ${e.tickets}).` };
  const resultados = [];
  for (let i = 0; i < n; i++) {
    const r = invocar(save, rng);
    if (!r.ok) break;
    resultados.push(r);
  }
  return { ok: true, qtd: resultados.length, resultados };
}

// ---- Guilda e Contratos Diários ----
export function chaveDataLocal(agora = new Date()) {
  if (typeof agora === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(agora)) return agora;
  const d = agora instanceof Date ? agora : new Date(agora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const hashTexto = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h || 1; };
export const diariosLiberados = (save) => expDe(save).guilda.contratos.g3 === 'entregue';
export function contratosDiariosDoDia(agora = new Date()) {
  const data = chaveDataLocal(agora), rng = criarRng(hashTexto(`guilda:${data}`));
  return CONTRATOS_DIARIOS_GRUPOS.map((grupo, idx) => {
    const base = grupo[Math.floor(rng() * grupo.length) % grupo.length];
    return { ...base, id: `d${idx + 1}`, diario: true, data, fim: 'Contrato diário concluído! Novos pedidos chegam à meia-noite.' };
  });
}
export function contratosDiariosEstado(save, agora = new Date()) {
  const e = expDe(save), data = chaveDataLocal(agora), liberado = diariosLiberados(save);
  if (!e.guilda.diarios || e.guilda.diarios.data !== data) e.guilda.diarios = { data, status: {} };
  e.guilda.diarios.status ||= {};
  const lista = contratosDiariosDoDia(data).map((c) => ({
    ...c,
    estado: !liberado ? 'bloqueado' : (e.guilda.diarios.status[c.id] || 'disponivel'),
  }));
  return { liberado, data, status: e.guilda.diarios.status, lista };
}
export const estadoContrato = (save, c, agora = new Date()) => {
  if (c.diario) return contratosDiariosEstado(save, agora).lista.find((x) => x.id === c.id)?.estado || 'bloqueado';
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
// Transfere poções de XP fabricadas na Oficina (Elixir de Foco -> pocao_xp_p) para a mochila de Halloween
export function transferirPocoesFab(save) {
  const s = fabEstado(save), itens = s.gestao?.itens || {}; let mov = 0;
  for (const [k, v] of Object.entries(itens)) if (k.startsWith('pocao_xp') && v > 0) { darPocao(save, k, v); itens[k] = 0; mov += v; }
  return mov;
}
export function avancarFab(save, agora = Date.now()) {
  const ev = avancarGestao(fabEstado(save), FAB, agora);
  const pocoesMovidas = transferirPocoesFab(save);
  return { ...ev, pocoesMovidas };
}
const buscarContrato = (save, id, agora) => CONTRATOS.find((x) => x.id === id) || contratosDiariosEstado(save, agora).lista.find((x) => x.id === id);
const qtdItemDisponivel = (save, k) => {
  const { itens } = estoqueDaFab(save);
  return (itens[k] || 0) + (k.startsWith('pocao_xp') ? (hwDe(save).pocoes[k] || 0) : 0);
};
export function aceitarContrato(save, id, agora = new Date()) {
  const c = buscarContrato(save, id, agora), e = expDe(save);
  if (!c || estadoContrato(save, c, agora) !== 'disponivel') return { ok: false, motivo: 'Contrato indisponível.' };
  if (c.diario) e.guilda.diarios.status[id] = 'ativo';
  else e.guilda.contratos[id] = 'ativo';
  return { ok: true, contrato: c };
}
export function podeEntregar(save, c) {
  const { mat } = estoqueDaFab(save);
  return Object.entries(c.pede.mat || {}).every(([k, v]) => (mat[k] || 0) >= v) && Object.entries(c.pede.itens || {}).every(([k, v]) => qtdItemDisponivel(save, k) >= v);
}
export function entregarContrato(save, id, agora = new Date()) {
  const c = buscarContrato(save, id, agora), e = expDe(save);
  if (!c || estadoContrato(save, c, agora) !== 'ativo') return { ok: false, motivo: 'O contrato precisa estar aceito.' };
  if (!podeEntregar(save, c)) return { ok: false, motivo: 'Faltam itens para entregar.' };
  const s = fabEstado(save);
  for (const [k, v] of Object.entries(c.pede.mat || {})) s.materiais[k] -= v;
  for (const [k, v] of Object.entries(c.pede.itens || {})) {
    const emFab = Math.min(v, s.gestao.itens[k] || 0);
    if (emFab > 0) s.gestao.itens[k] -= emFab;
    const resto = v - emFab;
    if (resto > 0 && k.startsWith('pocao_xp')) hwDe(save).pocoes[k] -= resto;
  }
  if (c.diario) e.guilda.diarios.status[id] = 'entregue'; // uma única vez por dia
  else e.guilda.contratos[id] = 'entregue'; // uma única vez
  save.recompensas.gold += c.recompensa.gold || 0;
  save.recompensas.diamantes += c.recompensa.diamantes || 0;
  if (c.recompensa.tickets) e.tickets += c.recompensa.tickets;
  if (c.libera === 'fazenda') liberarFazenda(save, agora);
  if (c.libera === 'oficina') e.oficina = true;
  ganharXpPasse(save, 'contrato', null, agora);
  return { ok: true, contrato: c };
}
export function liberarFazenda(save, agora = Date.now()) {
  const agoraMs = agora instanceof Date ? agora.getTime() : (Number(agora) || Date.now());
  const e = expDe(save), s = fabEstado(save);
  if (!e.fazenda) {
    e.fazenda = true;
    s.estruturas = { ...s.estruturas, cur: { tipo: 'curral', nivel: 1 }, api: { tipo: 'apiario', nivel: 1 }, gal: { tipo: 'galinheiro', nivel: 1 } };
  }
  avancarGestao(s, FAB, agoraMs);
}

// ---- Cacadas ----
export function materiaisDoAbate(cacada, rng = Math.random) {
  const r = {}; if (rng() > cacada.chance) return r;
  for (const [k, [a, b]] of Object.entries(cacada.materiais)) { const n = a + Math.floor(rng() * (b - a + 1)); if (n) r[k] = n; }
  return r;
}

// ---- Calabouço e Sanidade ----
// Nenhum dos cinco iniciais aparece como inimigo na Região 1
const POOL_CALABOUCO = ['Cervomusgo', 'Xistolim', 'Tatuveludo', 'Fanalino', 'Cobrabúfalo'];
function poderLuta(equipe, nivel, rng) {
  const papeis = {};
  const al = equipe.slice(0, 3).map((m, i) => criarUnidade({ id: `a${i}`, especie: m.especie, nivel: m.nivel || 1, lado: 'a', papeis }));
  const ini = [0, 1].map((i) => criarUnidade({ id: `i${i}`, especie: POOL_CALABOUCO[i % POOL_CALABOUCO.length], nivel, lado: 'i', papeis }));
  const b = criarBatalha(al, ini); let g = 0;
  while (!b.fim && g++ < 200) executar(b, decidir(b, atorAtual(b), rng), rng);
  return { vitoria: b.fim === 'vitoria', hpFinal: al.reduce((a, u) => a + u.hp, 0) / al.reduce((a, u) => a + u.hpMax, 0) };
}
const mediaVidaFormacao = (save, run) => {
  const form = membrosFormacao(save.idle || {});
  if (!form.length) return run.hpMedia ?? 1;
  run.vida ||= {};
  const soma = form.reduce((acc, { m }) => acc + (run.vida[m.uid] ?? run.hpMedia ?? 1), 0);
  return soma / form.length;
};
export function iniciarCalabouco(save) {
  const e = expDe(save);
  if (!aberto(save, 'calabouco')) return { ok: false, motivo: 'O calabouço abre depois de derrotar o Espírito da Floresta.' };
  const vida = {};
  for (const { m } of membrosFormacao(save.idle)) vida[m.uid] = 1;
  e.calabouco.run = { sala: 0, sanidade: CALABOUCO.sanidadeMax, vida, hpMedia: 1, ganhos: {}, salasPagas: {}, luta: null, estado: 'sala', log: [`Você desce às ${CALABOUCO.nome}.`], pago: false, resultado: null };
  return { ok: true };
}
const somar = (run, rec, mult = 1) => { for (const [k, v] of Object.entries(rec)) run.ganhos[k] = (run.ganhos[k] || 0) + Math.round(v * mult); };
export function encerrarCalabouco(save, run, motivo) {
  const e = expDe(save); if (run.pago) return run;
  run.pago = true; run.estado = 'fim'; run.luta = null; run.resultado = motivo;
  const perda = motivo === 'sanidade' || motivo === 'derrota' ? 0.5 : 1; // sair por escolha ou concluir preserva tudo
  const g = {}; for (const [k, v] of Object.entries(run.ganhos)) g[k] = Math.floor(v * perda);
  save.recompensas.gold += g.gold || 0; save.recompensas.diamantes += g.diamantes || 0;
  const s = fabEstado(save); for (const k of ['fibra', 'cristal']) if (g[k]) s.materiais[k] = (s.materiais[k] || 0) + g[k];
  run.pagos = g; if (motivo === 'concluido') e.calabouco.feitos += 1;
  run.log.push(motivo === 'concluido' ? 'Calabouço concluído!' : motivo === 'saiu' ? 'Você saiu com os ganhos.' : motivo === 'sanidade' ? 'A Sanidade acabou: você foi arrastado para fora, perdendo metade dos ganhos.' : 'A equipe caiu: metade dos ganhos foi perdida.');
  return run;
}
// Uso de consumíveis entre salas: Ração reforçada (+40% vida), Tônico de Lucidez (+35 Sanidade) e Tônico Concentrado (+60 Sanidade)
export function usarItemCalabouco(save, itemId) {
  const e = expDe(save), run = e.calabouco.run;
  if (!run || run.pago || run.estado === 'fim') return { ok: false, motivo: 'Sem expedição ativa.' };
  if (run.estado === 'luta') return { ok: false, motivo: 'Conclua o combate atual antes de usar consumíveis.' };
  const s = fabEstado(save), itens = s.gestao?.itens || {};
  if (itemId === 'racao') {
    if (!(itens.racao > 0)) return { ok: false, motivo: 'Você não tem Ração reforçada.' };
    const form = membrosFormacao(save.idle);
    run.vida ||= {};
    const precisa = form.length ? form.some(({ m }) => (run.vida[m.uid] ?? run.hpMedia ?? 1) < 1) : (run.hpMedia ?? 1) < 1;
    if (!precisa) return { ok: false, motivo: 'A equipe já está com a vida cheia.' };
    itens.racao -= 1;
    for (const { m } of form) run.vida[m.uid] = Math.min(1, (run.vida[m.uid] ?? run.hpMedia ?? 1) + CALABOUCO.racao);
    run.hpMedia = form.length ? mediaVidaFormacao(save, run) : Math.min(1, (run.hpMedia ?? 1) + CALABOUCO.racao);
    run.log.push(`Ração reforçada usada: vida da equipe em ${Math.round(run.hpMedia * 100)}%.`);
    return { ok: true, run };
  }
  if (itemId === 'tonico' || itemId === 'tonico_concentrado') {
    const ganho = itemId === 'tonico_concentrado' ? CALABOUCO.tonicoConcentrado : CALABOUCO.tonico;
    const nome = itemId === 'tonico_concentrado' ? 'Tônico Concentrado' : 'Tônico de Lucidez';
    if (!(itens[itemId] > 0)) return { ok: false, motivo: `Você não tem ${nome}.` };
    if (run.sanidade >= CALABOUCO.sanidadeMax) return { ok: false, motivo: 'A Sanidade já está cheia.' };
    itens[itemId] -= 1;
    run.sanidade = Math.min(CALABOUCO.sanidadeMax, run.sanidade + ganho);
    if (run.estado === 'escolha' && run.sanidade > CALABOUCO.limiteEscolha) run.estado = 'sala';
    run.log.push(`${nome} usado: Sanidade ${run.sanidade}.`);
    return { ok: true, run };
  }
  return { ok: false, motivo: 'Item inválido.' };
}
export const usarRacaoCalabouco = (save) => usarItemCalabouco(save, 'racao');
// Prepara os inimigos de uma sala de luta ou chefe para abrir na arena (sem resolver nem pagar ainda)
export function prepararLutaCalabouco(save, rng = Math.random) {
  const e = expDe(save), run = e.calabouco.run;
  if (!run || run.pago) return { ok: false, motivo: 'Sem expedição ativa.' };
  const sala = CALABOUCO.salas[run.sala];
  if (!sala || (sala.tipo !== 'luta' && sala.tipo !== 'chefe')) return { ok: false, motivo: 'Esta sala não é de combate.' };
  run.vida ||= {};
  for (const { m } of membrosFormacao(save.idle)) if (run.vida[m.uid] == null) run.vida[m.uid] = run.hpMedia ?? 1;
  run.hpMedia = mediaVidaFormacao(save, run);
  if (run.luta && run.luta.sala === run.sala) {
    run.estado = 'luta';
    return { ok: true, run, emBatalha: true, luta: run.luta };
  }
  let inimigos;
  if (sala.tipo === 'chefe') {
    const ch = CALABOUCO.chefe;
    inimigos = [
      [ch.especie, sala.nivel, ch.elemento, { chefe: true, nome: ch.nome, bonus: { ...ch.bonus } }],
      ['Xistolim', Math.max(1, sala.nivel - 2)],
      ['Cervomusgo', Math.max(1, sala.nivel - 2)],
    ];
  } else {
    const qtd = sala.nivel >= 6 ? 3 : 2;
    inimigos = Array.from({ length: qtd }, (_, i) => [
      POOL_CALABOUCO[Math.floor(rng() * POOL_CALABOUCO.length) % POOL_CALABOUCO.length],
      Math.max(1, sala.nivel - (i > 1 ? 1 : 0)),
    ]);
  }
  run.luta = {
    sala: run.sala,
    tipo: sala.tipo,
    rotulo: sala.rotulo,
    nivel: sala.nivel,
    arena: sala.arena,
    arenaFallback: sala.arenaFallback,
    chefe: sala.tipo === 'chefe' ? CALABOUCO.chefe : null,
    inimigos,
  };
  run.estado = 'luta';
  return { ok: true, run, emBatalha: true, luta: run.luta };
}
// Resolve o combate preparado na arena: vitória soma os ganhos e persiste a vida; derrota encerra com metade dos ganhos
export function resolverLutaCalabouco(save, { vitoria, vida = null, hpFinal = null } = {}) {
  const e = expDe(save), run = e.calabouco.run;
  if (!run || run.pago) return { ok: false, motivo: 'Sem expedição ativa.' };
  const sala = CALABOUCO.salas[run.sala];
  if (!sala || (sala.tipo !== 'luta' && sala.tipo !== 'chefe')) return { ok: false, motivo: 'Esta sala não é de combate.' };
  run.salasPagas ||= {};
  if (run.salasPagas[run.sala]) return { ok: false, motivo: 'Sala já resolvida.' };
  if (!vitoria) {
    run.vida ||= {};
    for (const { m } of membrosFormacao(save.idle)) run.vida[m.uid] = 0;
    run.hpMedia = 0;
    ganharXpPasse(save, 'derrota');
    return { ok: true, run: encerrarCalabouco(save, run, 'derrota') };
  }
  run.vida ||= {};
  const form = membrosFormacao(save.idle);
  if (vida && typeof vida === 'object') {
    for (const { m } of form) if (vida[m.uid] != null) run.vida[m.uid] = Math.max(0, Math.min(1, vida[m.uid]));
  } else if (typeof hpFinal === 'number' && Number.isFinite(hpFinal)) {
    const p = Math.max(0, Math.min(1, hpFinal));
    for (const { m } of form) run.vida[m.uid] = p;
    if (!form.length) run.hpMedia = p;
  }
  run.hpMedia = mediaVidaFormacao(save, run);
  run.salasPagas[run.sala] = true;
  somar(run, CALABOUCO.recompensas[sala.tipo]);
  ganharXpPasse(save, sala.tipo === 'chefe' ? 'calaboucoChefe' : 'calabouco');
  run.log.push(`${sala.rotulo}: vitória (${Math.round(run.hpMedia * 100)}% de vida).`);
  run.luta = null; run.sala += 1; run.estado = 'sala';
  if (run.sala >= CALABOUCO.salas.length) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
  return { ok: true, run };
}
// Avança uma sala: salas corrompidas afetam Sanidade; salas luta/chefe preparam o combate para a arena.
export function avancarSala(save, rng = Math.random, escolha = null) {
  const e = expDe(save), run = e.calabouco.run; if (!run || run.pago) return { ok: false, motivo: 'Sem expedição ativa.' };
  if (escolha === 'sair') return { ok: true, run: encerrarCalabouco(save, run, 'saiu') };
  const sala = CALABOUCO.salas[run.sala]; if (!sala) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
  if (sala.tipo === 'corrompida') {
    if (run.sanidade <= CALABOUCO.limiteEscolha && !escolha) { run.estado = 'escolha'; return { ok: true, run, precisaEscolher: true }; }
    if (escolha === 'tonico' || escolha === 'tonico_concentrado') {
      const s = fabEstado(save); const itens = s.gestao?.itens || {};
      const ganho = escolha === 'tonico_concentrado' ? CALABOUCO.tonicoConcentrado : CALABOUCO.tonico;
      const nome = escolha === 'tonico_concentrado' ? 'Tônico Concentrado' : 'Tônico de Lucidez';
      if (!(itens[escolha] > 0)) return { ok: false, motivo: `Você não tem ${nome}.` };
      itens[escolha] -= 1; run.sanidade = Math.min(CALABOUCO.sanidadeMax, run.sanidade + ganho); run.log.push(`${nome} usado: Sanidade ${run.sanidade}.`);
    }
    const risco = escolha === 'risco';
    run.sanidade = Math.max(0, run.sanidade - CALABOUCO.perdaCorrompida);
    somar(run, CALABOUCO.recompensas.corrompida, risco ? 2 : 1);
    run.log.push(`${sala.rotulo}: Sanidade ${run.sanidade}${risco ? ' (avançou com risco, ganhos dobrados)' : ''}.`);
    run.sala += 1; run.estado = 'sala';
    if (run.sanidade <= 0) return { ok: true, run: encerrarCalabouco(save, run, 'sanidade') };
    ganharXpPasse(save, 'calaboucoSala');
    if (run.sala >= CALABOUCO.salas.length) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
    return { ok: true, run };
  }
  if (sala.tipo === 'tesouro') {
    somar(run, CALABOUCO.recompensas.tesouro);
    ganharXpPasse(save, 'calaboucoSala');
    run.log.push(`${sala.rotulo}: baú encontrado!`);
    run.sala += 1; run.estado = 'sala';
    if (run.sala >= CALABOUCO.salas.length) return { ok: true, run: encerrarCalabouco(save, run, 'concluido') };
    return { ok: true, run };
  }
  return prepararLutaCalabouco(save, rng);
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
  if (acao === 'conter' && c.estado === 'contaminada') { if (!gasta(save, CRISE.custos.conter)) return { ok: false, motivo: 'Faltam 2 Tônicos de Lucidez.' }; ir(c, 'purificada'); ganharXpPasse(save, 'crise', null, agora); return { ok: true, msg: 'Surto contido: a vila foi purificada.' }; }
  if (acao === 'retomar' && c.estado === 'tomada') {
    if (c.zumbis <= 0) return { ok: false, motivo: 'Não restam zumbis.' };
    const r = poderLuta(save.idle.equipe || [], 5 + c.zumbis, rng);
    if (!r.vitoria) return { ok: false, motivo: 'A equipe foi repelida. Suba o nível dos Oníricos e tente de novo.' };
    c.zumbis = Math.max(0, c.zumbis - 3); ganharXpPasse(save, 'crise', null, agora); return { ok: true, msg: c.zumbis ? `Rua retomada: restam ${c.zumbis} zumbis.` : 'As ruas estão livres de zumbis.' };
  }
  if (acao === 'purificar' && c.estado === 'tomada') { if (c.zumbis > 0) return { ok: false, motivo: 'Retome as ruas antes de purificar.' }; if (!gasta(save, CRISE.custos.purificar)) return { ok: false, motivo: 'Faltam 1 Tônico e 2 Cristais.' }; ir(c, 'purificada'); ganharXpPasse(save, 'crise', null, agora); return { ok: true, msg: 'A vila foi purificada.' }; }
  if (acao === 'reconstruir' && c.estado === 'purificada') { if (!gasta(save, CRISE.custos.reconstruir)) return { ok: false, motivo: 'Faltam 8 Fibras, 4 Cristais e 100 de ouro.' }; ir(c, 'reconstruida'); c.servicoEm = agora; ganharXpPasse(save, 'crise', null, agora); return { ok: true, msg: 'Reconstruída: o Posto de cura reabriu.' }; }
  if (acao === 'servico' && c.estado === 'reconstruida') {
    if (agora - c.servicoEm < CRISE.servico.intervaloMs) return { ok: false, motivo: 'O posto ainda está preparando o próximo tônico.' };
    c.servicoEm = agora; const s = fabEstado(save); (s.gestao ||= { itens: {} }).itens = s.gestao.itens || {}; s.gestao.itens.tonico = (s.gestao.itens.tonico || 0) + 1; c.tonicosDados += 1; ganharXpPasse(save, 'crise', null, agora); return { ok: true, msg: 'O posto entregou 1 Tônico de Lucidez.' };
  }
  return { ok: false, motivo: 'Ação indisponível neste estado.' };
}
export const reiniciarCrise = (save) => { expDe(save).crise = null; return criseDe(save); };

// ---- Herói × Vilão ----
export function falaDialogoHV(linha) {
  const m = String(linha || '').match(/^([^:]+):\s*(.*)$/);
  if (!m) return { quem: '', chave: '', texto: String(linha || ''), busto: null, fallback: null };
  const quem = m[1].trim(), texto = m[2].trim();
  const chave = quem.split(',')[0].trim();
  const info = HV.bustos?.[quem] || HV.bustos?.[chave] || null;
  return { quem, chave, texto, busto: info?.arte || null, fallback: info?.fallback || null };
}
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
  ganharXpPasse(save, 'hv');
  if (n === capitulo(capId).missoes.length) h.fim = true;
  return { ok: true, recompensa: m.recompensa, fim: h.fim, epilogo: h.fim ? capitulo(capId).missoes[n - 1].epilogo?.[h.escolha] : null };
}
