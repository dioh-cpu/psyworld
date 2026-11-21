// Batalha da exploração 3D. Usa as regras de combate.js (as mesmas da versão 2D) e monta os lutadores a partir dos
// monstrinhos, com a mesma fórmula de poder de core.js. Código puro, sem DOM. O sorteio vem de rnd, então os testes são determinísticos.
import * as C from '../core.js';
import * as CB from '../combate.js';
import * as Y from '../systems.js';
import * as E from '../species.js';
import * as V from '../variacoes.js';

export const TIER_TIME_INICIAL = 3;      // tier do time de exemplo (cada tier é uma raridade do jogo)
export const NIVEL_TIME_INICIAL = 12;
export const RARIDADE_NOME = ['Comum', 'Rara', 'Épica', 'Lendária', 'Mítica'];
export const POCOES_INICIAIS = { pequena: 3, media: 1, grande: 0 };
export const SLOTS = 4;                  // habilidades ativas por monstrinho, numeradas de 1 a 4
const CHANCE_POCAO_ESPOLIO = 0.4;        // chance de a vitória deixar uma poção pequena

// Variações de cor (oníricos) vêm do módulo compartilhado: elemento, giro de cor e habilidades.
export const habilidadesDisponiveis = V.habilidadesDoMonstro;
export const giroDoMonstro = V.giroDoMonstro;
export const nomeDaVariante = (m) => V.nomeDaVariacao(m.variante);

// Monstrinho com a forma que a fórmula de poder e as habilidades leem (mesma forma do jogo).
// `abilities` é o conjunto de slots, na ordem em que aparecem no disco de ações (1 a 4).
export function criarMonstro({ id, species, tier, level, xp, classe = 'comum', variant = 'natural', origem = 'base', variante = null }) {
  const m = {
    id, species, rarity: tier, tier, variant, classe, origem,
    level, xp: xp ?? C.xpDoNivel(level), purity: E.ESPECIES[species].pureza,
    elemento: E.ELEMENTO_DA_ESPECIE[species] ?? 'neutro',
    abilities: E.HABILIDADES_DA_ESPECIE[species].slice(0, SLOTS),
    extraAbility: null, hybrid: false, abilityLevels: {},
    aptitudes: { ...(E.APTIDOES_DA_ESPECIE[species] || {}) },
    vinculo: 0,
  };
  return V.aplicarVariacao(m, variante);
}

// Time de exemplo: os três monstrinhos da linha base. Cada chamada devolve um time novo (as luta mudam o XP).
export function timeInicial() {
  return ['Noctarn', 'Ignavor', 'Vaelith'].map((species, i) => criarMonstro({
    id: `time-${i}`, species, tier: TIER_TIME_INICIAL, level: NIVEL_TIME_INICIAL,
  }));
}

// Troca a habilidade de um slot (0 a 3). Se a habilidade já está em outro slot, os dois trocam de lugar.
export function definirSlot(m, slot, nome) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS) throw new Error('slot inválido');
  if (!habilidadesDisponiveis(m).includes(nome)) throw new Error('habilidade não disponível para esta espécie');
  const lista = [...m.abilities];
  const outro = lista.indexOf(nome);
  if (outro >= 0) [lista[slot], lista[outro]] = [lista[outro], lista[slot]];
  else lista[slot] = nome;
  m.abilities = lista;
  return m;
}

// Selvagem: espécie e raridade sorteadas com os pesos dos encontros do jogo. Raridade mais alta, tier e nível mais altos.
// A variação de cor segue a regra da exploração (batalhas ao redor do mundo).
export function sortearSelvagem(rnd) {
  const especies = Y.BASE_SPECIES;
  const species = especies[Math.min(especies.length - 1, Math.floor(rnd() * especies.length))];
  const raridade = C.rarityByWeights(rnd(), Y.ENCOUNTER_WEIGHTS); // 1 a 4
  const variante = V.sortearVariacao(species, 'explorar', rnd);
  const monstro = criarMonstro({
    id: `selvagem-${Math.floor(rnd() * 1e9)}`, species, tier: raridade + 2, level: 10 + 2 * raridade, origem: 'selvagem', variante,
  });
  return { monstro, raridade };
}

// Lutador a partir do monstrinho: o poder é o mesmo para os dois lados, então o resultado depende de tier, nível e habilidades.
export const lutadorDo = (m) => CB.criarLutador({
  nome: m.species, poder: C.monsterPower(m), elemento: m.elemento, habilidades: C.activeAbilities(m),
});

// Disco de ações: atacar, uma entrada por slot (número 1 a 4, cinza na recarga) e poção (a menor que ainda tem).
export function opcoesDeAcao(combate, m) {
  const opcoes = [{ id: 'atacar', rotulo: 'Atacar', icone: '⚔', ativa: true, acao: { tipo: 'atacar' } }];
  combate.jog.habilidades.forEach((h, i) => {
    opcoes.push({
      id: 'habilidade', slot: i, numero: i + 1, rotulo: h.nome, icone: String(i + 1),
      ativa: CB.habilidadePronta(combate.jog, h.nome, combate.turno),
      acao: { tipo: 'habilidade', nome: h.nome },
    });
  });
  const pocao = Object.keys(CB.POCOES).find((p) => (combate.pocoes[p] || 0) > 0);
  opcoes.push({
    id: 'pocao', rotulo: pocao ? `${CB.POCOES[pocao].nome} (${combate.pocoes[pocao]})` : 'Sem poções',
    icone: '✚', ativa: Boolean(pocao), acao: pocao ? { tipo: 'pocao', pocao } : null,
  });
  return opcoes;
}

// XP do monstrinho pela luta, como na versão 2D: vitória dá XP; derrota tira XP, mas nunca abaixo do nível atual.
export function aplicarResultado(m, vitoria) {
  if (vitoria) {
    const r = C.ganharXp(m, C.XP_FONTE.batalhaVitoria);
    return { xp: r.ganho, subiu: r.subiu, nivel: r.nivel };
  }
  const antesXp = m.xp || 0;
  const piso = C.xpDoNivel(m.level ?? C.nivelDeXp(antesXp));
  m.xp = Math.max(piso, antesXp - C.XP_FONTE.batalhaDerrota);
  m.level = C.nivelDeXp(m.xp);
  return { xp: m.xp - antesXp, subiu: 0, nivel: m.level };
}

// Recompensa do selvagem: vitória paga gold pela raridade (5 x raridade, como no encontro) e pode deixar uma poção.
export function recompensaDaBatalha({ vitoria, raridade, rnd }) {
  if (!vitoria) return { gold: 0, pocao: 0 };
  return { gold: Y.goldEncontro(raridade), pocao: rnd() < CHANCE_POCAO_ESPOLIO ? 1 : 0 };
}

// Linhas do registro (formato de espólio da versão 2D). Derrota não deixa espólio.
export function itensDoEspolio({ vitoria, nomeMonstro, xp, gold, pocao }) {
  if (!vitoria) return [];
  return [
    { icone: '★', nome: `XP de ${nomeMonstro}`, qtd: xp, cor: 'mon' },
    { icone: '●', nome: 'Gold', qtd: gold, cor: 'gold' },
    { icone: '✚', nome: 'Poção pequena', qtd: pocao, cor: 'recurso' },
  ];
}

// Golpes do turno a partir das linhas novas do log. A primeira ação é sempre a do jogador; a segunda, a do inimigo.
export function eventosDoTurno(linhas) {
  const acoes = linhas.filter((l) => /atacou|usou/.test(l));
  return acoes.map((texto, i) => {
    const quem = i === 0 ? 'jogador' : 'inimigo';
    const alvo = quem === 'jogador' ? 'inimigo' : 'jogador';
    if (/Poção/.test(texto)) {
      const cura = /\+(\d+) de vida/.exec(texto);
      return { tipo: 'cura', quem, alvo: quem, dano: cura ? Number(cura[1]) : 0 };
    }
    const habilidade = !/atacou/.test(texto);
    // tipagem vem do rótulo do log: super efetivo, pouco efetivo ou sem efeito (neutro não tem rótulo)
    const eficacia = /super efetivo/.test(texto) ? 'super' : /pouco efetivo/.test(texto) ? 'pouco' : /sem efeito/.test(texto) ? 'nulo' : null;
    if (/errou/.test(texto)) return { tipo: 'erro', quem, alvo, habilidade, dano: 0, critico: false, eficacia: null };
    const dano = /(\d+) de dano/.exec(texto);
    return { tipo: 'dano', quem, alvo, habilidade, dano: dano ? Number(dano[1]) : 0, critico: /crítico/.test(texto), eficacia };
  });
}

// Vida (absoluta) de jogador e inimigo depois de cada evento. Um golpe tira vida do alvo; uma poção devolve até o máximo.
export function hpAposEventos(inicio, eventos, hpMax = CB.COMBATE.hpMax) {
  let atual = { j: inicio.j, i: inicio.i };
  return eventos.map((e) => {
    if (e.tipo === 'dano') {
      atual = e.alvo === 'inimigo'
        ? { ...atual, i: Math.max(0, atual.i - e.dano) }
        : { ...atual, j: Math.max(0, atual.j - e.dano) };
    } else if (e.tipo === 'cura') {
      atual = { ...atual, j: Math.min(hpMax, atual.j + e.dano) };
    }
    return { ...atual };
  });
}

// Tempos de cada passo do roteiro (segundos). A câmera vai até quem age antes de cada golpe.
export const DURACAO = { foco: 0.8, golpe: 0.55, erro: 0.5, cura: 0.7, pausa: 0.35, fim: 1.2 };

// Roteiro do turno: uma lista de passos que a cena 3D executa em ordem, cada um com a vida mostrada ao final dele.
export function roteiroDoTurno({ eventos, hpInicio, resultado = null }) {
  const vida = hpAposEventos(hpInicio, eventos);
  const passos = [];
  eventos.forEach((e, k) => {
    passos.push({ tipo: 'foco', lado: e.quem, dur: DURACAO.foco });
    const tipo = e.tipo === 'erro' ? 'erro' : e.tipo === 'cura' ? 'cura' : 'golpe';
    passos.push({
      tipo, lado: e.quem, alvo: e.alvo, dano: e.dano, critico: e.critico, habilidade: e.habilidade,
      eficacia: e.eficacia ?? null, hp: vida[k], dur: DURACAO[tipo],
    });
  });
  passos.push({ tipo: 'pausa', dur: DURACAO.pausa });
  if (resultado) passos.push({ tipo: 'fim', resultado, dur: DURACAO.fim });
  return passos;
}
