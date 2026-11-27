// Evento mensal de Halloween (dados). Números e textos configuráveis. Artes das linhagens pendentes: o caminho esperado fica em `arte`.
export const EDICAO = { id: 'halloween-2026', nome: 'Banner Mensal de Halloween', inicio: '2026-10-01', fim: '2026-11-30' };
export const BANNER_HW = {
  chances: { 1: 0.48, 2: 0.28, 3: 0.15, 4: 0.06, 5: 0.03 }, // T5 também pode sair por sorte (3%); ao sair, o contador reinicia
  garantia10: { 3: 0.8, 4: 0.2 },   // múltiplos de 10 (que não são de 50 nem de 100)
  marco50: 4, marco100: 5,
  pacote: { tickets: 10, diamantes: 2000 },
};
// Rotação semanal: calendário, elenco e contador próprios (o elenco será escolhido em outra etapa)
export const SEMANAL = { ativo: false, calendario: [], elenco: [], contadorId: (semana) => `semanal-${semana}` };

const PASTA = 'assets/confusion/interface/eventos/halloween/oniricos';
const arte = (slug) => [1, 2, 3].map((n) => `${PASTA}/${slug}/0${n}.png`);
export const ARTES_HW = {
  banner: 'assets/confusion/interface/eventos/halloween/banner.webp', torre: 'assets/confusion/interface/eventos/halloween/torre.webp', loja: 'assets/confusion/interface/eventos/halloween/loja.webp',
  ticket: 'assets/confusion/interface/eventos/halloween/itens/ticket.webp', doce: 'assets/confusion/interface/eventos/halloween/itens/doce.webp',
  pocao_xp_p: 'assets/confusion/interface/eventos/halloween/itens/pocao_xp_p.webp', pocao_xp_m: 'assets/confusion/interface/eventos/halloween/itens/pocao_xp_m.webp', pocao_xp_g: 'assets/confusion/interface/eventos/halloween/itens/pocao_xp_g.webp',
  arenas: [1, 2, 3, 4].map((n) => `assets/confusion/interface/eventos/halloween/arenas/0${n}.webp`),
};
// Cinco exclusivos do Banner Mensal, um por tier inicial (catalogo.json). Também são as cinco opções de inicial no cadastro (T1, nível 5).
export const LINHAGENS_HW = [
  { especie: 'Abobrisco', slug: 'abobrisco', tier: 1, classe: 'tanque', papel: 'defesa', elemento: 'planta', resumo: 'Vanguarda: provoca e protege com escudos.', arte: arte('abobrisco') },
  { especie: 'Velalume', slug: 'velalume', tier: 2, classe: 'suporte', papel: 'suporte', elemento: 'luz', resumo: 'Cura contínua no início do turno de cada aliado.', arte: arte('velalume') },
  { especie: 'Mortálio', slug: 'mortalio', tier: 3, classe: 'mago', papel: 'suporte', elemento: 'fantasma', resumo: 'Traz de volta um aliado caído, na vaga dele.', arte: arte('mortalio') },
  { especie: 'Vitrarco', slug: 'vitrarco', tier: 4, classe: 'guerreiro', papel: 'defesa', elemento: 'trevas', resumo: 'Concede invencibilidade temporária.', arte: arte('vitrarco') },
  { especie: 'Abyssar', slug: 'abyssar', tier: 5, classe: 'assassino', papel: 'ataque', elemento: 'trevas', resumo: 'Finalizador: facada que sangra, perseguição em cadeia e modo de pânico.', arte: arte('abyssar').map(() => `${PASTA}/abyssar/03.png`) /* a forma de quatro patas saiu: o Abyssar é sempre o demônio do banner */ },
];
// Nomes provisórios de versões anteriores → definitivos (preserva tier, XP e evolução dos já adquiridos)
export const RENOMEAR_HW = { 'Abóborgo': 'Abobrisco', 'Candelúmia': 'Velalume', 'Almaterna': 'Mortálio', 'Sentinoite': 'Vitrarco', 'Ceifalume': 'Abyssar' };
export const arteDoIndividuo = (m) => { const l = LINHAGENS_HW.find((x) => x.especie === m.especie); return l ? l.arte[formaDoTierLocal(m.tierHW || 1)] : null; };
const formaDoTierLocal = (t) => (t >= 5 ? 2 : t >= 3 ? 1 : 0);
// Forma pela faixa de tier: base (1–2), segunda (3–4), final (5)
export const formaDoTier = (t) => (t >= 5 ? 2 : t >= 3 ? 1 : 0);
// Doces de Halloween: evolução de tier e moeda da Loja da Torre
export const DOCES = { custos: [1, 2, 3, 5], chanceAbate: 0.001, chanceAndar: 0.01 };
// Ganho por tier (somado ao poder base dos exclusivos, que já é maior que o dos Oníricos comuns: ver PODER_EXCLUSIVO)
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
  arenas: [1, 2, 3, 4].map((n) => `assets/confusion/interface/eventos/halloween/arenas/0${n}.webp`), // uma arena própria por dificuldade
};
