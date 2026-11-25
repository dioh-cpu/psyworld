// Regras do modo Estratégia (sem DOM, testáveis em Node). Genérico: rotas, inimigos, obras e papéis vêm dos dados da região.
//  - Combate por turnos 6 contra 6, com papéis: ataque (dano), defesa (atrai golpes e resiste), suporte (cura aliados).
//  - Expedição: rota com fases progressivas; cada vitória paga material UMA vez e pode liberar um Onírico novo.
//  - Obras: custo em materiais, efeito visível e prosperidade, com a origem de cada ganho registrada.
import { ELEMENTO_DA_ESPECIE, HABILIDADES_DA_ESPECIE } from '../species.js';
import { multElemento } from '../core.js';

const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
export const criarRng = (semente) => lcg((semente >>> 0) || 1);
const entre = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const sorteia = (r, lista) => lista[Math.min(lista.length - 1, Math.floor(r() * lista.length))];

// ---------- unidades ----------
export const statsDoNivel = (nivel, papel) => {
  const base = { hp: 58 + nivel * 13, atk: 9 + nivel * 2.8, def: 4 + nivel * 1.4 };
  if (papel === 'defesa') return { hp: Math.round(base.hp * 1.3), atk: Math.round(base.atk * 0.75), def: Math.round(base.def * 1.6) };
  if (papel === 'suporte') return { hp: Math.round(base.hp * 0.95), atk: Math.round(base.atk * 0.8), def: Math.round(base.def * 1.0) };
  return { hp: Math.round(base.hp), atk: Math.round(base.atk * 1.15), def: Math.round(base.def) };
};
export function criarUnidade({ id, especie, nivel, lado, papeis, bonus = {} }) {
  const papel = papeis[especie] || 'ataque';
  const s = statsDoNivel(nivel, papel);
  const hpMax = Math.round(s.hp * (1 + (bonus.hp || 0)));
  return {
    id, especie, nivel, lado, papel, elemento: ELEMENTO_DA_ESPECIE[especie] || 'neutro',
    habilidades: HABILIDADES_DA_ESPECIE[especie] || ['Golpe'],
    hpMax, hp: hpMax, atk: Math.round(s.atk * (1 + (bonus.atk || 0))), def: Math.round(s.def * (1 + (bonus.def || 0))),
    defendendo: false, recarga: 0,
  };
}

// ---------- formação inimiga (variável, dentro de faixas previsíveis) ----------
export function gerarInimigos(fase, papeis, rng, extras = []) {
  const n = entre(rng, fase.inimigos[0], fase.inimigos[1]);
  const lista = [];
  const pool = [...fase.especies, ...extras]; // inimigos já avistados voltam a aparecer
  for (let i = 0; i < n; i++) lista.push(criarUnidade({ id: `i${i}`, especie: sorteia(rng, pool), nivel: entre(rng, fase.nivel[0], fase.nivel[1]), lado: 'i', papeis }));
  return lista;
}

// ---------- combate ----------
export function criarBatalha(aliados, inimigos) {
  const unidades = [...aliados, ...inimigos];
  return { aliados, inimigos, rodada: 1, fila: [], log: [], fim: null, ordem: unidades };
}
const vivos = (l) => l.filter((u) => u.hp > 0);
const inimigosDe = (b, u) => (u.lado === 'a' ? b.inimigos : b.aliados);
const aliadosDe = (b, u) => (u.lado === 'a' ? b.aliados : b.inimigos);

function iniciarRodada(b) {
  b.fila = vivos(b.ordem).sort((x, y) => (y.nivel + (y.papel === 'suporte' ? 1 : 0)) - (x.nivel + (x.papel === 'suporte' ? 1 : 0))).map((u) => u.id);
  for (const u of b.ordem) { u.defendendo = false; if (u.recarga > 0) u.recarga--; }
}
export function atorAtual(b) {
  if (b.fim) return null;
  if (!b.fila.length) iniciarRodada(b);
  while (b.fila.length) {
    const u = b.ordem.find((x) => x.id === b.fila[0] && x.lado && x.hp > 0);
    if (u) return u;
    b.fila.shift();
  }
  b.rodada++; iniciarRodada(b);
  return atorAtual(b);
}
function escolherAlvo(b, u, rng) {
  const alvos = vivos(inimigosDe(b, u));
  // defesa atrai golpes: peso 4 contra 1
  const pesos = alvos.map((a) => (a.papel === 'defesa' ? 4 : 1));
  let t = rng() * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < alvos.length; i++) { t -= pesos[i]; if (t <= 0) return alvos[i]; }
  return alvos[alvos.length - 1];
}
function dano(b, u, alvo, mult, rng) {
  const el = multElemento(u.elemento, alvo.elemento);
  const base = u.atk * mult * el * (0.9 + rng() * 0.2);
  const reduz = alvo.def * (alvo.defendendo ? 1.1 : 0.55);
  return Math.max(2, Math.round(base - reduz));
}
// acao: { tipo: 'atacar'|'habilidade'|'defender'|'curar', alvo?: id }
export function executar(b, acao, rng) {
  const u = atorAtual(b); if (!u) return b;
  const alvoPorId = (id, lista) => lista.find((x) => x.id === id && x.hp > 0);
  let tipo = acao.tipo;
  if (tipo === 'curar' && u.papel !== 'suporte') tipo = 'atacar';
  if (tipo === 'habilidade' && u.recarga > 0) tipo = 'atacar';
  if (tipo === 'curar') {
    const a = alvoPorId(acao.alvo, aliadosDe(b, u)) || vivos(aliadosDe(b, u)).sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0];
    const cura = Math.round(u.atk * 2.2 + a.hpMax * 0.1);
    a.hp = Math.min(a.hpMax, a.hp + cura);
    for (const o of vivos(aliadosDe(b, u))) if (o !== a) o.hp = Math.min(o.hpMax, o.hp + Math.round(cura * 0.4)); // o grupo também se recupera um pouco
    b.log.push(`${u.especie} curou ${a.especie} (+${cura}) e o grupo um pouco.`);
    b.evento = { tipo: 'curar', ator: u.id, alvo: a.id, valor: cura };
  } else if (tipo === 'defender') {
    u.defendendo = true;
    b.log.push(`${u.especie} se defende.`);
    b.evento = { tipo: 'defender', ator: u.id, alvo: u.id };
  } else {
    const alvo = alvoPorId(acao.alvo, inimigosDe(b, u)) || escolherAlvo(b, u, rng);
    const habil = tipo === 'habilidade';
    const d = dano(b, u, alvo, habil ? 1.7 : 1, rng);
    alvo.hp = Math.max(0, alvo.hp - d);
    if (habil) u.recarga = 3;
    b.evento = { tipo: habil ? 'habilidade' : 'atacar', ator: u.id, alvo: alvo.id, valor: d, morreu: alvo.hp <= 0, distancia: habil && u.papel !== 'defesa' };
    b.log.push(`${u.especie} ${habil ? `usou ${u.habilidades[Math.min(2, u.habilidades.length - 1)]}` : 'atacou'} ${alvo.especie} (−${d})${alvo.hp <= 0 ? ' e o derrotou' : ''}.`);
  }
  b.fila.shift();
  if (!vivos(b.inimigos).length) b.fim = 'vitoria';
  else if (!vivos(b.aliados).length) b.fim = 'derrota';
  if (b.log.length > 40) b.log = b.log.slice(-40);
  return b;
}
// Decisão automática (usada pelos inimigos e pelo "Atacar automaticamente" do jogador)
export function decidir(b, u, rng) {
  if (u.papel === 'suporte') {
    const ferido = vivos(aliadosDe(b, u)).sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0];
    if (ferido && ferido.hp / ferido.hpMax < 0.65) return { tipo: 'curar', alvo: ferido.id };
  }
  if (u.papel === 'defesa' && vivos(aliadosDe(b, u)).some((a) => a.hp / a.hpMax < 0.4) && rng() < 0.5) return { tipo: 'defender' };
  const fraco = vivos(inimigosDe(b, u)).sort((x, y) => x.hp - y.hp)[0];
  if (u.recarga === 0 && u.papel !== 'suporte') return { tipo: 'habilidade', alvo: rng() < 0.5 ? fraco.id : undefined };
  return { tipo: 'atacar' };
}
export function passoAuto(b, rng) {
  const u = atorAtual(b); if (!u) return b;
  return executar(b, decidir(b, u, rng), rng);
}

// ---------- expedição ----------
export const recompensaDaFase = (fase, rng) => ({
  [fase.material.tipo]: entre(rng, fase.material.faixa[0], fase.material.faixa[1]),
  ...(fase.secundario ? { [fase.secundario.tipo]: entre(rng, fase.secundario.faixa[0], fase.secundario.faixa[1]) } : {}),
});

// Estado da expedição: pagas = fases já pagas (nunca paga duas vezes), mesmo reabrindo o painel ou recarregando a página.
export function novaExpedicao(rotaId, equipeIds) {
  return { id: `${rotaId}-${Date.now()}`, rota: rotaId, fase: 0, equipe: equipeIds, estado: 'preparando', autoAtaque: true, autoAvancar: false, pagas: {}, ganhos: {}, liberados: [], semente: (Date.now() >>> 0) % 100000 };
}
// Paga a vitória da fase. Devolve null se já foi paga.
export function pagarFase(exp, rota, faseIdx, materiais, rng) {
  if (exp.pagas[faseIdx]) return null;
  exp.pagas[faseIdx] = true;
  const rec = recompensaDaFase(rota.fases[faseIdx], rng);
  for (const [k, v] of Object.entries(rec)) { materiais[k] = (materiais[k] || 0) + v; exp.ganhos[k] = (exp.ganhos[k] || 0) + v; }
  return rec;
}

// ---------- obras ----------
export const custoDoNivel = (estr, nivel) => Object.fromEntries(Object.entries(estr.custo).map(([k, v]) => [k, Math.round(v * (1 + (estr.crescimento ?? 0.6) * (nivel - 1)))]));
export const falta = (custo, materiais) => Object.fromEntries(Object.entries(custo).map(([k, v]) => [k, Math.max(0, v - (materiais[k] || 0))]).filter(([, v]) => v > 0));
export function construir(estado, estr, slot) {
  const atual = estado.estruturas[slot];
  if (atual && atual.tipo !== estr.id) return { ok: false, motivo: 'O local está ocupado por outra estrutura.' };
  const nivel = (atual?.nivel || 0) + 1;
  if (nivel > estr.niveis) return { ok: false, motivo: 'Nível máximo.' };
  const custo = custoDoNivel(estr, nivel), f = falta(custo, estado.materiais);
  if (Object.keys(f).length) return { ok: false, motivo: 'Faltam materiais.', falta: f };
  for (const [k, v] of Object.entries(custo)) estado.materiais[k] -= v;
  estado.estruturas[slot] = { tipo: estr.id, nivel };
  return { ok: true, nivel, custo, prosperidade: estr.prosperidade[nivel - 1] };
}
// Prosperidade e a origem de cada ganho
export function prosperidade(estado, regiao) {
  const itens = [];
  let total = regiao.prosperidadeBase;
  itens.push({ origem: 'Cidade em ruínas (base)', valor: regiao.prosperidadeBase });
  for (const [slot, e] of Object.entries(estado.estruturas)) {
    const def = regiao.estruturas.find((x) => x.id === e.tipo); if (!def) continue;
    for (let n = 1; n <= e.nivel; n++) { const v = def.prosperidade[n - 1] || 0; total += v; itens.push({ origem: `${def.nome} nv.${n}`, valor: v }); }
  }
  return { total: Math.min(100, total), itens };
}
// Bônus passivos das estruturas para as expedições
export function bonusDaCidade(estado, regiao) {
  const b = { atk: 0, def: 0, hp: 0, cura: 0 };
  for (const e of Object.values(estado.estruturas)) {
    const def = regiao.estruturas.find((x) => x.id === e.tipo);
    for (const [k, v] of Object.entries(def?.bonus || {})) b[k] = (b[k] || 0) + v * e.nivel;
  }
  return b;
}

// ---------- dificuldade mostrada antes de iniciar ----------
export const poderDaUnidade = (u) => u.hpMax * 0.25 + u.atk * 3 + u.def * 2;
export function dificuldadeDaFase(fase, equipe, papeis) {
  const me = equipe.reduce((s, m) => s + poderDaUnidade(criarUnidade({ id: 'x', especie: m.especie, nivel: m.nivel, lado: 'a', papeis })), 0);
  const nm = (fase.inimigos[0] + fase.inimigos[1]) / 2, lv = (fase.nivel[0] + fase.nivel[1]) / 2;
  const inim = nm * poderDaUnidade(criarUnidade({ id: 'y', especie: fase.especies[0], nivel: lv, lado: 'i', papeis }));
  const r = inim ? me / inim : 9;
  return r >= 1.35 ? { rotulo: 'Fácil', cor: '#4ade80' } : r >= 0.8 ? { rotulo: 'Equilibrada', cor: '#fbbf24' } : { rotulo: 'Difícil', cor: '#fb7185' };
}
