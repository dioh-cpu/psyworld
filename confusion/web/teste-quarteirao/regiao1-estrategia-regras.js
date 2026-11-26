// Regras do modo Estratégia (sem DOM, testáveis em Node). Genérico: rotas, inimigos, obras e papéis vêm dos dados da região.
//  - Combate por turnos 6 contra 6, com papéis: ataque (dano), defesa (atrai golpes e resiste), suporte (cura aliados).
//  - Expedição: rota com fases progressivas; cada vitória paga material UMA vez e pode liberar um Onírico novo.
//  - Obras: custo em materiais, efeito visível e prosperidade, com a origem de cada ganho registrada.
import { ELEMENTO_DA_ESPECIE, HABILIDADES_DA_ESPECIE } from '../species.js';
import { multElemento } from '../core.js';
import { EFEITOS, kitDe, PAPEL_PADRAO, PODER_EXCLUSIVO } from './regiao1-batalha-habilidades.js';
export { KITS, kitDe, EFEITOS, temKitProprio } from './regiao1-batalha-habilidades.js';

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
export function criarUnidade({ id, especie, nivel, lado, papeis, bonus = {}, elemento = ELEMENTO_DA_ESPECIE[especie] || 'neutro' }) {
  const papel = papeis[especie] || PAPEL_PADRAO[especie] || 'ataque';
  const s = statsDoNivel(nivel, papel);
  const ex = PODER_EXCLUSIVO[especie]; if (ex) bonus = { ...bonus, hp: (bonus.hp || 0) + ex.hp, atk: (bonus.atk || 0) + ex.atk, def: (bonus.def || 0) + ex.def };
  const hpMax = Math.round(s.hp * (1 + (bonus.hp || 0)));
  return {
    id, especie, nivel, lado, papel, elemento,
    habilidades: HABILIDADES_DA_ESPECIE[especie] || ['Golpe'],
    kit: kitDe(especie, papel, elemento, HABILIDADES_DA_ESPECIE[especie] || []), cd: [0, 0, 0], efeitos: {},
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
export const LIMITE_ALIADOS = 4;
// Até quatro combatentes de cada lado em campo, com dois reforços exclusivos dos inimigos.
export function criarBatalha(aliados, inimigos, { ativos = LIMITE_ALIADOS } = {}) {
  const vagas = Math.min(ativos, LIMITE_ALIADOS);
  const emCampoA = aliados.slice(0, vagas), emCampoI = inimigos.slice(0, vagas);
  return { aliados: emCampoA, inimigos: emCampoI, esperaI: inimigos.slice(vagas, vagas + 2), rodada: 1, fila: [], log: [], fim: null, ordem: [...emCampoA, ...emCampoI], turnos: 0 };
}
export const vivos = (l) => l.filter((u) => u.hp > 0);
const inimigosDe = (b, u) => (u.lado === 'a' ? b.inimigos : b.aliados);
const aliadosDe = (b, u) => (u.lado === 'a' ? b.aliados : b.inimigos);
export const temEfeito = (u, id) => Boolean(u.efeitos?.[id]);
// ataque e defesa efetivos, com buffs e debuffs
const efetivo = (u, k) => { const alto = temEfeito(u, `${k}_alto`) ? 0.3 : 0, baixo = temEfeito(u, `${k}_baixo`) || temEfeito(u, `${k}_baixa`) ? 0.3 : 0; return Math.max(1, u[k] * (1 + alto - baixo)); };

function iniciarRodada(b) {
  // velocidade: nível, um pouco a mais para suporte, multiplicado pelos efeitos de velocidade (Perseguição +50%, Pânico +100%)
  const vel = (u) => (u.nivel + (u.papel === 'suporte' ? 1 : 0)) * (1 + Object.keys(u.efeitos || {}).reduce((a, id) => a + (EFEITOS[id]?.velocidade || 0), 0));
  b.fila = vivos(b.ordem).sort((x, y) => vel(y) - vel(x)).map((u) => u.id);
  for (const u of b.ordem) { u.defendendo = false; u.cd = (u.cd || [0, 0, 0]).map((c) => Math.max(0, c - 1)); u.recarga = Math.max(...u.cd); }
}
const antes = (b, e) => { (b.antes ||= []).push(e); };
// Dano direto: o escudo absorve primeiro. Sono acaba ao apanhar.
function receberDano(alvo, d) {
  if (alvo.efeitos?.invencivel) return { perdido: 0, abs: d, invencivel: true }; // invencibilidade anula o golpe e o dano por turno
  let abs = 0;
  if (alvo.efeitos?.escudo) { abs = Math.min(alvo.efeitos.escudo.valor, d); alvo.efeitos.escudo.valor -= abs; if (alvo.efeitos.escudo.valor <= 0) delete alvo.efeitos.escudo; }
  const perdido = d - abs; alvo.hp = Math.max(0, alvo.hp - perdido);
  if (perdido > 0 && alvo.efeitos?.sono) delete alvo.efeitos.sono;
  return { perdido, abs };
}
// Aplica um efeito (com chance). Devolve o id aplicado, ou null.
function aplicarEfeito(alvo, fonte, e, rng) {
  if (alvo.hp <= 0 || rng() > (e.chance ?? 1)) return null;
  const def = EFEITOS[e.id]; if (!def) return null;
  let valor = 0;
  if (e.id === 'sangramento') valor = Math.max(2, Math.round(fonte.atk * (e.valorMult || 0.45)));
  else if (e.id === 'queimadura') valor = Math.max(3, Math.round(fonte.atk * 0.6));
  else if (e.id === 'veneno') valor = Math.max(3, Math.round(alvo.hpMax * 0.05));
  else if (e.id === 'regeneracao') valor = Math.max(2, Math.round(alvo.hpMax * 0.07));
  // efeito em si mesmo ganha +1 porque o turno de quem usou termina logo em seguida
  (alvo.efeitos ||= {})[e.id] = { turnos: (e.turnos || 2) + (alvo === fonte ? 1 : 0), valor, fonte: fonte.id };
  return e.id;
}
const limpar = (alvo) => { const tirados = []; for (const id of Object.keys(alvo.efeitos || {})) if (EFEITOS[id]?.debuff) { delete alvo.efeitos[id]; tirados.push(id); } return tirados; };
// Início do turno: energia, dano e cura por turno. Quem está sob controle perde o turno.
function iniciarTurno(b, u) {
  for (const [id, e] of Object.entries(u.efeitos || {})) {
    if (EFEITOS[id]?.dot) { const r = receberDano(u, e.valor); antes(b, { tipo: 'dot', efeito: id, alvo: u.id, valor: r.perdido }); b.log.push(`${u.especie} sofre ${EFEITOS[id].nome.toLowerCase()} (−${r.perdido}).`); }
    else if (id === 'regeneracao') { const c = Math.min(e.valor, u.hpMax - u.hp); u.hp += c; if (c) antes(b, { tipo: 'regen', alvo: u.id, valor: c }); }
  }
}
function fimDoTurno(u) {
  for (const [id, e] of Object.entries(u.efeitos || {})) { e.turnos -= 1; if (e.turnos <= 0) delete u.efeitos[id]; }
}
const verificarFim = (b) => { if (!vivos(b.inimigos).length && !b.esperaI.length) b.fim = 'vitoria'; else if (!vivos(b.aliados).length) b.fim = 'derrota'; };
export function atorAtual(b) {
  if (b.fim) return null;
  for (let guarda = 0; guarda < 400; guarda++) {
    if (!b.fila.length) { if (b.jaIniciou) b.rodada++; b.jaIniciou = true; iniciarRodada(b); }
    const u = b.ordem.find((x) => x.id === b.fila[0] && x.hp > 0);
    if (!u) { b.fila.shift(); continue; }
    if (b.iniciado !== `${b.rodada}:${u.id}`) {
      b.iniciado = `${b.rodada}:${u.id}`; iniciarTurno(b, u); reforcar(b); verificarFim(b);
      if (b.fim) return null;
      if (u.hp <= 0) { b.fila.shift(); continue; }
      const cc = Object.keys(u.efeitos || {}).find((id) => EFEITOS[id]?.cc);
      if (cc) { antes(b, { tipo: 'pular', alvo: u.id, efeito: cc }); b.log.push(`${u.especie} perde o turno (${EFEITOS[cc].nome.toLowerCase()}).`); fimDoTurno(u); b.fila.shift(); continue; }
    }
    return u;
  }
  return null;
}
function escolherAlvo(b, u, rng) {
  const alvos = vivos(inimigosDe(b, u));
  // provocação atrai com peso 8; defesa, 4; os demais, 1
  const pesos = alvos.map((a) => (temEfeito(a, 'provocacao') ? 8 : a.papel === 'defesa' ? 4 : 1));
  let t = rng() * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < alvos.length; i++) { t -= pesos[i]; if (t <= 0) return alvos[i]; }
  return alvos[alvos.length - 1];
}
function dano(b, u, alvo, mult, rng) {
  const el = multElemento(u.elemento, alvo.elemento);
  const base = efetivo(u, 'atk') * mult * el * (0.9 + rng() * 0.2);
  const reduz = efetivo(alvo, 'def') * (alvo.defendendo ? 1.1 : 0.55);
  return Math.max(2, Math.round(base - reduz));
}
// acao: { tipo: 'atacar'|'habilidade'|'defender', idx?: 0..2, alvo?: id }. Cada ação gera b.evento (que a tela toca uma vez).
export function executar(b, acao, rng) {
  const u = atorAtual(b); if (!u) return b;
  const alvoPorId = (id, lista) => lista.find((x) => x.id === id && x.hp > 0);
  let tipo = acao.tipo, idx = Number.isInteger(acao.idx) ? acao.idx : 1, hab = null;
  if (tipo === 'habilidade') { hab = u.kit[idx]; if (!hab || (u.cd?.[idx] || 0) > 0 || temEfeito(u, 'silencio')) { tipo = 'atacar'; hab = null; } }
  b.turnos = (b.turnos || 0) + 1;
  const ev = { tipo: 'atacar', hab, idx, ator: u.id, alvos: [], antes: b.antes || [] }; b.antes = [];
  if (hab) { u.cd[idx] = hab.cd; u.recarga = Math.max(...u.cd); }
  const aliados = vivos(aliadosDe(b, u)), inimigos = vivos(inimigosDe(b, u));
  if (hab && (hab.tipo === 'cura' || hab.tipo === 'apoio')) {
    ev.tipo = hab.tipo;
    // Ressurreição: volta um aliado caído na vaga dele (se ninguém tomou o lugar), com vida parcial
    const caido = hab.reviver ? aliadosDe(b, u).find((x) => x.hp <= 0 && !x.substituido) : null;
    if (caido) {
      caido.hp = Math.max(1, Math.round(caido.hpMax * hab.reviver)); caido.efeitos = {}; caido.cd = [0, 0, 0];
      ev.tipo = 'reviver'; ev.alvos.push({ id: caido.id, valor: caido.hp, efeitos: [], limpos: [], revivido: true }); ev.alvo = caido.id; ev.valor = caido.hp;
      b.log.push(`${u.especie} usou ${hab.nome}: ${caido.especie} volta à luta (+${caido.hp}).`);
    }
    const quem = caido ? [] : hab.alvo === 'si' ? [u] : hab.alvo === 'aliados' ? aliados : [alvoPorId(acao.alvo, aliados) || [...aliados].sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0]];
    for (const a of quem) {
      const r = { id: a.id, valor: 0, efeitos: [], limpos: [] };
      const pct = hab.tipo === 'cura' ? hab.mult : (hab.cura || 0);
      if (pct) { const c = Math.min(a.hpMax - a.hp, Math.round(a.hpMax * pct + u.atk * 0.6)); a.hp += c; r.valor = c; }
      if (hab.limpa) r.limpos = limpar(a);
      if (hab.escudo) { a.efeitos ||= {}; a.efeitos.escudo = { turnos: 3, valor: Math.round(a.hpMax * hab.escudo), fonte: u.id }; r.efeitos.push('escudo'); }
      for (const e of hab.efeitos || []) { const ok = aplicarEfeito(a, u, e, rng); if (ok) r.efeitos.push(ok); }
      ev.alvos.push(r);
    }
    ev.alvo = ev.alvos[0]?.id; ev.valor = ev.alvos[0]?.valor || 0;
    if (!caido) b.log.push(`${u.especie} usou ${hab.nome}${hab.alvo === 'si' ? '' : hab.alvo === 'aliados' ? ' no grupo' : ''}${ev.valor ? ` (+${ev.valor})` : ''}.`);
  } else if (tipo === 'defender') {
    u.defendendo = true; ev.tipo = 'defender'; ev.alvo = u.id; ev.alvos = [{ id: u.id, valor: 0, efeitos: [] }];
    b.log.push(`${u.especie} se defende.`);
  } else {
    const principal = alvoPorId(acao.alvo, inimigos) || escolherAlvo(b, u, rng);
    ev.tipo = hab ? 'habilidade' : 'atacar'; ev.distancia = Boolean(hab?.distancia); ev.roubo = 0;
    // Um golpe: dano, parte pela vida máxima (limitada em chefes), efeitos da habilidade e, no modo de pânico, roubo de vida e sangramento
    const golpear = (a, mult) => {
      let d = dano(b, u, a, mult, rng);
      if (hab?.pctVidaMax) { let extra = Math.round(a.hpMax * hab.pctVidaMax); if (a.chefe) extra = Math.min(extra, Math.round(u.atk * (hab.limiteChefe || 4))); d += extra; }
      const r = receberDano(a, d);
      const rr = { id: a.id, valor: r.perdido, absorvido: r.abs, morreu: a.hp <= 0, efeitos: [], limpos: [] };
      if (a.hp > 0) for (const e of hab?.efeitos || []) { const ok = aplicarEfeito(a, u, e, rng); if (ok) rr.efeitos.push(ok); }
      const pan = u.efeitos?.panico && EFEITOS.panico;
      if (pan) {
        const c = Math.min(u.hpMax - u.hp, Math.round(r.perdido * pan.rouboVida)); u.hp += c; ev.roubo += c;
        if (a.hp > 0) { const ok = aplicarEfeito(a, u, { id: 'sangramento', ...pan.sangraNoGolpe }, rng); if (ok && !rr.efeitos.includes(ok)) rr.efeitos.push(ok); }
      }
      ev.alvos.push(rr); return rr;
    };
    if (hab?.alvo === 'aleatorio') {
      // Perseguição: N impactos em inimigos vivos sorteados; +X% por vaga inimiga vazia; ao derrotar alguém, reinicia com metade do dano
      let fator = 1, rep = 0;
      do {
        let derrotou = false;
        for (let g = 0; g < (hab.golpes || 1); g++) {
          const vivosI = vivos(inimigosDe(b, u)); if (!vivosI.length) break;
          const vazias = Math.min(3, Math.max(0, 4 - vivosI.length));
          const a = vivosI[Math.floor(rng() * vivosI.length) % vivosI.length];
          if (golpear(a, hab.mult * fator * (1 + (hab.bonusVagaVazia || 0) * vazias)).morreu) derrotou = true;
        }
        if (!derrotou || !hab.reinicia || rep >= hab.reinicia.max || !vivos(inimigosDe(b, u)).length) break;
        rep += 1; fator *= hab.reinicia.fator; b.log.push(`${u.especie} reinicia a ${hab.nome} (${Math.round(fator * 100)}% do dano).`);
      } while (true);
      ev.repeticoes = rep; ev.area = true;
    } else {
      const alvos = hab && hab.alvo === 'todos' ? inimigos : [principal];
      ev.area = alvos.length > 1;
      for (const a of alvos) golpear(a, hab ? hab.mult : 1);
    }
    for (const e of hab?.efeitosSi || []) aplicarEfeito(u, u, e, rng);
    ev.alvo = ev.alvos[0]?.id || principal.id; ev.valor = ev.alvos[0]?.valor || 0; ev.morreu = ev.alvos[0]?.morreu;
    b.log.push(`${u.especie} ${hab ? `usou ${hab.nome} em` : 'atacou'} ${ev.alvos.length > 1 ? `${ev.alvos.length} golpes` : principal.especie} (−${ev.alvos.map((x) => x.valor).join('/−')})${ev.alvos.some((x) => x.morreu) ? ' e derrotou' : ''}${ev.roubo ? `, roubando ${ev.roubo} de vida` : ''}.`);
    if (ev.alvos.some((x) => x.efeitos.length)) b.log.push(`Efeitos: ${ev.alvos.flatMap((x) => x.efeitos).map((id) => EFEITOS[id].nome).join(', ')}.`);
  }
  b.evento = ev;
  fimDoTurno(u); b.fila.shift();
  reforcar(b); verificarFim(b);
  if (b.log.length > 40) b.log = b.log.slice(-40);
  return b;
}
// O reforço entra na vaga do derrotado, no mesmo ponto do campo
function reforcar(b) {
  for (let i = 0; i < b.inimigos.length && b.esperaI.length; i++) {
    const caido = b.inimigos[i];
    if (caido.hp > 0) continue;
    const novo = b.esperaI.shift();
    b.inimigos[i] = novo;
    b.ordem.push(novo);
    novo.entrouNaVaga = i;
    b.log.push(`Reforço: ${novo.especie} entra no lugar de ${caido.especie}.`);
    const reforco = { sai: caido.id, entra: novo.id, lado: 'inimigo', vaga: i };
    if (b.evento) b.evento.reforco = reforco;
    else antes(b, { tipo: 'reforco', ...reforco });
  }
}
// Decisão automática (inimigos e "Atacar automaticamente"): usa a melhor habilidade disponível e acessível
export function decidir(b, u, rng) {
  const vivosA = vivos(aliadosDe(b, u)), inim = vivos(inimigosDe(b, u));
  const pode = (h, i) => (u.cd?.[i] || 0) === 0 && !temEfeito(u, 'silencio');
  const ferida = vivosA.reduce((m, a) => Math.min(m, a.hp / a.hpMax), 1), debuffs = vivosA.some((a) => Object.keys(a.efeitos || {}).some((id) => EFEITOS[id]?.debuff));
  let melhor = null;
  const temCaido = aliadosDe(b, u).some((x) => x.hp <= 0 && !x.substituido);
  u.kit.forEach((h, i) => {
    if (!pode(h, i)) return;
    let pts = 0;
    if (h.reviver && temCaido) pts = 5;
    else if (h.efeitos?.some((e) => e.id === 'invencivel')) pts = ferida < 0.5 ? 4 : 0;
    else
    if (h.tipo === 'dano') pts = h.mult * (h.pctVidaMax ? 1.6 : 1) * (h.alvo === 'todos' ? Math.min(inim.length, 4) * 0.8 : 1) * (1 + 0.15 * (h.efeitos?.length || 0)) + h.cd * 0.1;
    else if (h.tipo === 'cura') pts = ferida < 0.7 ? (1.2 - ferida) * 3 + (h.alvo === 'aliados' ? 0.5 : 0) + (h.limpa && debuffs ? 0.8 : 0) : 0;
    else pts = (h.limpa && debuffs ? 2.2 : 0) + (b.turnos < 3 || ferida < 0.8 ? 1.4 : 0.6);
    if (h.tipo === 'cura' && h.alvo === 'si' && u.hp / u.hpMax > 0.6 && !(h.limpa && Object.keys(u.efeitos || {}).some((id) => EFEITOS[id]?.debuff))) pts = 0;
    if (pts > 0 && (!melhor || pts > melhor.pts)) melhor = { pts, i, h };
  });
  if (melhor && (melhor.h.tipo !== 'dano' || rng() < 0.9)) {
    const fraco = [...inim].sort((x, y) => x.hp - y.hp)[0], ferido = [...vivosA].sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0];
    return { tipo: 'habilidade', idx: melhor.i, alvo: melhor.h.tipo === 'dano' ? (rng() < 0.5 ? fraco?.id : undefined) : ferido?.id };
  }
  if (u.papel === 'defesa' && ferida < 0.4 && rng() < 0.5) return { tipo: 'defender' };
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
