// Batalha em equipe da exploração 3D: até 3 aliados (o time) contra 1 a 3 inimigos. Código puro, sem DOM.
// Turno: cada aliado vivo planeja a ação (atacar, habilidade ou poção) e o alvo. Quando todos planejaram, a equipe
// resolve tudo em ordem de poder (o mais forte primeiro; empate vai para o aliado). Os inimigos escolhem sozinhos.
// As regras de dano são as de combate.js (golpe, elemento, erro, crítico, vampirismo, recarga das habilidades).
import * as CB from '../combate.js';

export const TAMANHO_MAX = 3;

export function criarBatalhaEquipe({ aliados, inimigos, pocoes = {} }) {
  if (aliados.length < 1 || aliados.length > TAMANHO_MAX) throw new Error('aliados: de 1 a 3');
  if (inimigos.length < 1 || inimigos.length > TAMANHO_MAX) throw new Error('inimigos: de 1 a 3');
  return {
    turno: 1,
    aliados,
    inimigos,
    pocoes: { ...pocoes },
    planos: aliados.map(() => null),
    eventos: [],          // o que aconteceu no último turno resolvido, em ordem (para o roteiro da cena)
    log: [],
    fim: false,
    resultado: null,
  };
}

const vivo = (u) => u.hp > 0;
const indicesVivos = (lista) => lista.flatMap((u, i) => (vivo(u) ? [i] : []));
export const aliadosVivos = (e) => indicesVivos(e.aliados);
export const inimigosVivos = (e) => indicesVivos(e.inimigos);
const unidade = (e, ref) => (ref.lado === 'aliado' ? e.aliados[ref.i] : e.inimigos[ref.i]);
const fracaoDeVida = (lista) => lista.reduce((s, u) => s + u.hp, 0) / lista.reduce((s, u) => s + u.hpMax, 0);

// Ordem de ação de um turno (só quem está vivo): poder, do maior para o menor; empate vai para o aliado.
export function ordemDoTurno(e) {
  const todos = [
    ...aliadosVivos(e).map((i) => ({ lado: 'aliado', i, poder: e.aliados[i].poder })),
    ...inimigosVivos(e).map((i) => ({ lado: 'inimigo', i, poder: e.inimigos[i].poder })),
  ];
  const empate = (x, y) => (x.lado === y.lado ? x.i - y.i : x.lado === 'aliado' ? -1 : 1);
  return todos.sort((x, y) => (y.poder - x.poder) || empate(x, y));
}

// Próximo aliado vivo que ainda não planejou a ação deste turno (null quando todos planejaram).
export function proximoAliadoSemPlano(e) {
  const i = e.aliados.findIndex((a, k) => vivo(a) && !e.planos[k]);
  return i >= 0 ? i : null;
}

export const prontoParaResolver = (e) => !e.fim && proximoAliadoSemPlano(e) === null;

// Poções que ainda podem ser planejadas: o estoque menos o que outros aliados já planejaram usar.
export function pocoesLivres(e, nome, ignorar = -1) {
  const planejadas = e.planos.filter((p, k) => k !== ignorar && p && p.tipo === 'pocao' && p.pocao === nome).length;
  return (e.pocoes[nome] || 0) - planejadas;
}

// Planeja a ação de um aliado vivo. Atacar e habilidade pedem um alvo inimigo (índice); poção cura o próprio aliado.
export function planejar(e, i, acao) {
  if (e.fim) throw new Error('batalha encerrada');
  const a = e.aliados[i];
  if (!a || !vivo(a)) throw new Error('aliado indisponível');
  if (acao.tipo === 'pocao') {
    if (!CB.POCOES[acao.pocao]) throw new Error('poção desconhecida');
    if (pocoesLivres(e, acao.pocao, i) <= 0) throw new Error('sem essa poção');
    e.planos[i] = { tipo: 'pocao', pocao: acao.pocao, alvo: null };
    return e;
  }
  if (!Number.isInteger(acao.alvo) || !e.inimigos[acao.alvo] || !vivo(e.inimigos[acao.alvo])) throw new Error('alvo inválido');
  if (acao.tipo === 'habilidade') {
    if (!CB.habilidadePronta(a, acao.nome, e.turno)) throw new Error('habilidade indisponível neste turno');
    e.planos[i] = { tipo: 'habilidade', nome: acao.nome, alvo: acao.alvo };
  } else if (acao.tipo === 'atacar') {
    e.planos[i] = { tipo: 'atacar', alvo: acao.alvo };
  } else {
    throw new Error(`ação desconhecida: ${acao.tipo}`);
  }
  return e;
}

// Se o alvo planejado já caiu, o aliado ataca o inimigo vivo mais próximo da lista (o primeiro). Poção não muda.
function alvoAtual(e, plano) {
  if (plano.tipo === 'pocao') return plano;
  if (e.inimigos[plano.alvo] && vivo(e.inimigos[plano.alvo])) return plano;
  const novo = inimigosVivos(e)[0];
  return novo === undefined ? null : { ...plano, alvo: novo };
}

// Escolha do inimigo: habilidade com chance, se houver alguma pronta; senão ataca um aliado vivo ao acaso.
function escolhaInimigo(e, k, rnd) {
  const alvos = aliadosVivos(e);
  const alvo = alvos[Math.floor(rnd() * alvos.length)];
  const inimigo = e.inimigos[k];
  const prontas = inimigo.habilidades.filter((h) => h.ultimoTurno < e.turno - 1);
  if (prontas.length && rnd() < CB.COMBATE.chanceHabilidadeInimigo) {
    const h = prontas[Math.floor(rnd() * prontas.length)];
    return { tipo: 'habilidade', nome: h.nome, alvo };
  }
  return { tipo: 'atacar', alvo };
}

const eficaciaDoEvento = (m) => (m === 0 ? 'nulo' : m > 1 ? 'super' : m < 1 ? 'pouco' : null);

function registrar(e, evento) {
  e.eventos.push({ ...evento, hp: { aliados: e.aliados.map((a) => a.hp), inimigos: e.inimigos.map((n) => n.hp) } });
}

function executar(e, ator, acao, rnd) {
  const u = unidade(e, ator);
  if (acao.tipo === 'pocao') {
    e.pocoes[acao.pocao] -= 1;
    const antes = u.hp;
    u.hp = Math.min(u.hpMax, u.hp + Math.round(u.hpMax * CB.POCOES[acao.pocao].cura));
    const cura = u.hp - antes;
    e.log.push(`${u.nome} usou ${CB.POCOES[acao.pocao].nome} (+${cura} de vida).`);
    registrar(e, { tipo: 'cura', ator, alvo: ator, habilidade: null, dano: cura, critico: false, eficacia: null, absorvido: false, errou: false });
    return;
  }
  const alvoRef = { lado: ator.lado === 'aliado' ? 'inimigo' : 'aliado', i: acao.alvo };
  const alvo = unidade(e, alvoRef);
  const habilidade = acao.tipo === 'habilidade' ? acao.nome : null;
  if (habilidade) u.habilidades.find((h) => h.nome === habilidade).ultimoTurno = e.turno;
  const mult = habilidade ? CB.COMBATE.habilidadeMult : 1;
  const r = CB.golpe(u, alvo, mult, rnd);
  const texto = habilidade ? `${u.nome} usou ${habilidade}` : `${u.nome} atacou`;
  const base = { ator, alvo: alvoRef, habilidade, critico: false, eficacia: null, absorvido: false };
  if (r.errou) {
    e.log.push(`${texto}, mas errou.`);
    registrar(e, { ...base, tipo: 'erro', dano: 0, errou: true });
    return;
  }
  const eficacia = eficaciaDoEvento(r.eficacia);
  if (r.dano === 0) {
    e.log.push(`${texto}, sem efeito.`);
    registrar(e, { ...base, tipo: 'dano', dano: 0, eficacia: 'nulo', errou: false });
    return;
  }
  const marcas = [r.critico ? 'crítico!' : null, CB.rotuloEficacia(r.eficacia)].filter(Boolean);
  const sufixo = marcas.length ? ` (${marcas.join(', ')})` : '';
  if (alvo.vampirismo && r.elemento === alvo.elemento) {
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + r.dano);
    e.log.push(`${texto}: ${r.dano} de dano${sufixo}, absorvido por ${alvo.nome} (vampirismo elemental: curou ${alvo.hp - antes}).`);
    registrar(e, { ...base, tipo: 'dano', dano: r.dano, critico: r.critico, eficacia, absorvido: true, errou: false });
    return;
  }
  alvo.hp = Math.max(0, alvo.hp - r.dano);
  e.log.push(`${texto}: ${r.dano} de dano${sufixo}.`);
  registrar(e, { ...base, tipo: 'dano', dano: r.dano, critico: r.critico, eficacia, errou: false });
}

function fechar(e, resultado) {
  e.fim = true;
  e.resultado = resultado;
  e.log.push(resultado === 'vitoria' ? 'A equipe venceu.' : 'Os inimigos venceram.');
  return e;
}

// Resolve o turno inteiro: cada ator vivo age na ordem de poder. Depois avança para o próximo turno.
export function resolverTurno(e, rnd = Math.random) {
  if (e.fim) return e;
  if (!prontoParaResolver(e)) throw new Error('falta planejar algum aliado');
  e.eventos = [];
  for (const ator of ordemDoTurno(e)) {
    if (e.fim) break;
    const u = unidade(e, ator);
    if (!vivo(u)) continue;   // caiu antes de agir neste turno
    const acao = ator.lado === 'aliado' ? alvoAtual(e, e.planos[ator.i]) : escolhaInimigo(e, ator.i, rnd);
    if (!acao) continue;
    executar(e, ator, acao, rnd);
    if (!inimigosVivos(e).length) return fechar(e, 'vitoria');
    if (!aliadosVivos(e).length) return fechar(e, 'derrota');
  }
  if (e.fim) return e;
  e.turno += 1;
  e.planos = e.aliados.map(() => null);
  if (e.turno > CB.COMBATE.turnosMax) {
    const pj = fracaoDeVida(e.aliados);
    const pi = fracaoDeVida(e.inimigos);
    e.log.push(`Tempo esgotado: ${Math.round(pj * 100)}% x ${Math.round(pi * 100)}%.`);
    return fechar(e, pj > pi ? 'vitoria' : 'derrota');
  }
  return e;
}
