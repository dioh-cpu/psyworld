// Evento mensal de Halloween (dados). Números e textos configuráveis. Artes das linhagens pendentes: o caminho esperado fica em `arte`.
export const EDICAO = { id: 'halloween-2026', nome: 'Banner Mensal de Halloween', inicio: '2026-10-01', fim: '2026-11-30' };
export const BANNER_HW = {
  chances: { 1: 0.50, 2: 0.28, 3: 0.15, 4: 0.06, 5: 0.01 },
  garantia10: { 3: 0.8, 4: 0.2 },   // múltiplos de 10 (que não são de 50 nem de 100)
  marco50: 4, marco100: 5,
  pacote: { tickets: 10, diamantes: 2000 },
};
// Rotação semanal: calendário, elenco e contador próprios (o elenco será escolhido em outra etapa)
export const SEMANAL = { ativo: false, calendario: [], elenco: [], contadorId: (semana) => `semanal-${semana}` };

const PASTA = 'assets/events/halloween/oniricos';
const arte = (slug) => [1, 2, 3].map((n) => `${PASTA}/${slug}/0${n}.png`);
// Cinco exclusivos, um por tier inicial. Nomes provisórios até as artes ficarem prontas.
export const LINHAGENS_HW = [
  { especie: 'Abóborgo', slug: 'aboborgo', tier: 1, papel: 'defesa', elemento: 'planta', resumo: 'Vanguarda: provoca e protege com escudos.', arte: arte('aboborgo') },
  { especie: 'Candelúmia', slug: 'candelumia', tier: 2, papel: 'suporte', elemento: 'luz', resumo: 'Cura contínua no início do turno de cada aliado.', arte: arte('candelumia') },
  { especie: 'Almaterna', slug: 'almaterna', tier: 3, papel: 'suporte', elemento: 'fantasma', resumo: 'Traz de volta um aliado caído, na vaga dele.', arte: arte('almaterna') },
  { especie: 'Sentinoite', slug: 'sentinoite', tier: 4, papel: 'defesa', elemento: 'trevas', resumo: 'Concede invencibilidade temporária.', arte: arte('sentinoite') },
  { especie: 'Ceifalume', slug: 'ceifalume', tier: 5, papel: 'ataque', elemento: 'trevas', resumo: 'Finalizador: dano pela vida máxima do alvo (limitado em chefes).', arte: arte('ceifalume') },
];
// Forma pela faixa de tier: base (1–2), segunda (3–4), final (5)
export const formaDoTier = (t) => (t >= 5 ? 2 : t >= 3 ? 1 : 0);
// Doces de Halloween: evolução de tier e moeda da Loja da Torre
export const DOCES = { custos: [1, 2, 3, 5], chanceAbate: 0.001, chanceAndar: 0.01 };
export const BONUS_TIER = (t) => ({ hp: 0.15 * (t - 1), atk: 0.15 * (t - 1), def: 0.12 * (t - 1) });
export const LOJA_TORRE = [
  { id: 'pocao_xp_p', nome: 'Poção de XP pequena', custo: 1, tipo: 'pocao' },
  { id: 'pocao_xp_m', nome: 'Poção de XP média', custo: 3, tipo: 'pocao' },
  { id: 'pocao_xp_g', nome: 'Poção de XP grande', custo: 8, tipo: 'pocao' },
  { id: 'acelerador', nome: 'Acelerador de obra (15 min)', custo: 2, tipo: 'acelerador' },
  { id: 'materiais', nome: 'Caixa de materiais (20 madeira + 20 pedra)', custo: 2, tipo: 'materiais' },
];
// Torre de Halloween: 4 dificuldades de 100 andares
export const TORRE = {
  marco: 'q_mare_devolveu', // compatível com uma equipe de nível 5
  dificuldades: [{ nivel: [5, 70] }, { nivel: [70, 150] }, { nivel: [150, 220] }, { nivel: [220, 300] }],
  ticketsPorMarco: 5, chancePocao: 0.04,
  arenas: ['assets/confusion/interface/estrategia/madeira-01.webp', 'assets/confusion/interface/estrategia/madeira-03.webp', 'assets/confusion/interface/estrategia/pedra-02.webp', 'assets/confusion/interface/estrategia/reinos/02/arena-ruinas.webp', 'assets/confusion/interface/estrategia/reinos/01/arena-chefe.webp'],
};
