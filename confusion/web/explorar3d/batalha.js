// Batalha da exploração 3D. Usa as regras de combate.js (as mesmas da versão 2D) e monta os lutadores a partir dos
// monstrinhos, com a mesma fórmula de poder de core.js. Código puro, sem DOM. O sorteio vem de rnd, então os testes são determinísticos.
import * as C from '../core.js';
import * as CB from '../combate.js';
import * as Y from '../systems.js';
import * as E from '../species.js';

export const TIER_TIME_INICIAL = 3;      // tier do time de exemplo (cada tier é uma raridade do jogo)
export const NIVEL_TIME_INICIAL = 12;
export const RARIDADE_NOME = ['Comum', 'Rara', 'Épica', 'Lendária', 'Mítica'];
export const POCOES_INICIAIS = { pequena: 3, media: 1, grande: 0 };
const CHANCE_POCAO_ESPOLIO = 0.4;        // chance de a vitória deixar uma poção pequena

// Monstrinho com a forma que a fórmula de poder e as habilidades leem (mesma forma do jogo).
export function criarMonstro({ id, species, tier, level, xp, classe = 'comum', variant = 'natural', origem = 'base' }) {
  return {
    id, species, rarity: tier, tier, variant, classe, origem,
    level, xp: xp ?? C.xpDoNivel(level), purity: E.ESPECIES[species].pureza,
    elemento: E.ELEMENTO_DA_ESPECIE[species] ?? 'neutro',
    abilities: E.HABILIDADES_DA_ESPECIE[species].slice(0, 4), extraAbility: null, hybrid: false, abilityLevels: {},
    aptitudes: { ...(E.APTIDOES_DA_ESPECIE[species] || {}) },
    vinculo: 0,
  };
}

// Time de exemplo: os três monstrinhos da linha base. Cada chamada devolve um time novo (as luta mudam o XP).
export function timeInicial() {
  return ['Noctarn', 'Ignavor', 'Vaelith'].map((species, i) => criarMonstro({
    id: `time-${i}`, species, tier: TIER_TIME_INICIAL, level: NIVEL_TIME_INICIAL,
  }));
}

// Selvagem: espécie e raridade sorteadas com os pesos dos encontros do jogo. Raridade mais alta, tier e nível mais altos.
export function sortearSelvagem(rnd) {
  const especies = Y.BASE_SPECIES;
  const species = especies[Math.min(especies.length - 1, Math.floor(rnd() * especies.length))];
  const raridade = C.rarityByWeights(rnd(), Y.ENCOUNTER_WEIGHTS); // 1 a 4
  const monstro = criarMonstro({ id: `selvagem-${Math.floor(rnd() * 1e9)}`, species, tier: raridade + 2, level: 10 + 2 * raridade, origem: 'selvagem' });
  return { monstro, raridade };
}

// Lutador a partir do monstrinho: o poder é o mesmo para os dois lados, então o resultado depende de tier, nível e habilidades.
export const lutadorDo = (m) => CB.criarLutador({
  nome: m.species, poder: C.monsterPower(m), elemento: m.elemento, habilidades: C.activeAbilities(m),
});

// Disco de ações: atacar, uma entrada por habilidade (cinza na recarga) e poção (a menor que ainda tem).
export function opcoesDeAcao(combate, m) {
  const opcoes = [{ id: 'atacar', rotulo: 'Atacar', icone: '⚔', ativa: true, acao: { tipo: 'atacar' } }];
  for (const h of combate.jog.habilidades) {
    opcoes.push({
      id: 'habilidade', rotulo: h.nome, icone: '✦', ativa: CB.habilidadePronta(combate.jog, h.nome, combate.turno),
      acao: { tipo: 'habilidade', nome: h.nome },
    });
  }
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
