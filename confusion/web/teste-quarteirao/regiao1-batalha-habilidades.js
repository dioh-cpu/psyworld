// Habilidades e efeitos de batalha por turnos (dados + gerador de kits). Cada Onírico tem 3 habilidades; cada uma tem só tempo de
// recarga (em rodadas), sem custo. Quanto maior a recarga, maior o dano, a cura ou o buff. O motor (regiao1-estrategia-regras.js) só lê estes dados.

// Efeitos de status. dot: dano a cada turno; cc: perde o turno; debuff: removido por purificação.
export const EFEITOS = {
  sangramento: { nome: 'Sangramento', icone: '🩸', debuff: true, dot: true, cor: '#ef4444' },
  queimadura: { nome: 'Queimadura', icone: '🔥', debuff: true, dot: true, cor: '#fb923c' },
  veneno: { nome: 'Veneno', icone: '☠️', debuff: true, dot: true, cor: '#84cc16' },
  atordoamento: { nome: 'Atordoamento', icone: '💫', debuff: true, cc: true, cor: '#fde047' },
  congelamento: { nome: 'Congelamento', icone: '❄️', debuff: true, cc: true, cor: '#7dd3fc' },
  sono: { nome: 'Sono', icone: '💤', debuff: true, cc: true, quebraAoDano: true, cor: '#a5b4fc' },
  silencio: { nome: 'Silêncio', icone: '🔇', debuff: true, cor: '#94a3b8' },
  ataque_baixo: { nome: 'Ataque reduzido', icone: '⚔️⬇', debuff: true, cor: '#f87171' },
  defesa_baixa: { nome: 'Defesa reduzida', icone: '🛡️⬇', debuff: true, cor: '#fb7185' },
  ataque_alto: { nome: 'Ataque elevado', icone: '⚔️⬆', cor: '#facc15' },
  defesa_alta: { nome: 'Defesa elevada', icone: '🛡️⬆', cor: '#60a5fa' },
  regeneracao: { nome: 'Regeneração', icone: '💚', cor: '#4ade80' },
  escudo: { nome: 'Escudo', icone: '🔰', cor: '#38bdf8' },
  provocacao: { nome: 'Provocação', icone: '🎯', cor: '#f97316' },
  invencivel: { nome: 'Invencível', icone: '✨', cor: '#fde68a' },
  veloz: { nome: 'Velocidade +50%', icone: '💨', cor: '#a5f3fc', velocidade: 0.5 },
  panico: { nome: 'Pânico', icone: '😱', cor: '#f87171', velocidade: 1.0, rouboVida: 0.3, sangraNoGolpe: { chance: 0.7, turnos: 3, valorMult: 2.0 } },
};
export const DEBUFFS = Object.keys(EFEITOS).filter((k) => EFEITOS[k].debuff);

const slug = (n) => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ef = (id, turnos = 3, chance = 1, extra = {}) => ({ id, turnos, chance, ...extra });

// ---- kits escritos à mão ----
// tipo: 'dano' | 'cura' | 'apoio'. alvo: 'um' | 'todos' | 'aliado' | 'aliados' | 'si'. distancia: projétil (senão, corpo a corpo).
export const KITS = {
  // ---- Linhas iniciais (todas as formas da linha usam o kit da linha) ----
  Ignavor: [
    { id: 'brasa_imperial', nome: 'Brasa Imperial', icone: '🔥', tipo: 'dano', alvo: 'um', mult: 1.25, cd: 1, elemento: 'fogo', efeitos: [ef('queimadura', 3, 0.7)] },
    { id: 'juba_flamejante', nome: 'Juba Flamejante', icone: '🦁', tipo: 'dano', alvo: 'todos', mult: 1.0, cd: 3, distancia: true, elemento: 'fogo', efeitos: [ef('queimadura', 2, 0.5)] },
    { id: 'rugido_dourado', nome: 'Rugido Dourado', icone: '📣', tipo: 'apoio', alvo: 'aliados', cd: 5, elemento: 'fogo', efeitos: [ef('ataque_alto', 2), ef('defesa_alta', 2)] },
  ],
  Vaelith: [
    { id: 'arco_ciano', nome: 'Arco Ciano', icone: '🌊', tipo: 'dano', alvo: 'um', mult: 1.1, cd: 1, distancia: true, elemento: 'agua', efeitos: [ef('ataque_baixo', 2, 0.6)] },
    { id: 'veu_gelado', nome: 'Véu Gelado', icone: '❄️', tipo: 'cura', alvo: 'aliados', mult: 0.2, cd: 3, elemento: 'agua', limpa: true, efeitos: [] },
    { id: 'fenda_estelar', nome: 'Fenda Estelar', icone: '✨', tipo: 'dano', alvo: 'todos', mult: 1.2, cd: 5, distancia: true, elemento: 'agua', efeitos: [ef('congelamento', 1, 0.45)] },
  ],
  Brotavel: [
    { id: 'raiz_viva', nome: 'Raiz Viva', icone: '🌱', tipo: 'dano', alvo: 'um', mult: 1.0, cd: 1, elemento: 'planta', efeitos: [ef('provocacao', 2)] },
    { id: 'espora_verde', nome: 'Espora Verde', icone: '🍃', tipo: 'apoio', alvo: 'aliados', cd: 3, elemento: 'planta', escudo: 0.1, efeitos: [ef('regeneracao', 3)] },
    { id: 'broto_fertil', nome: 'Broto Fértil', icone: '🌿', tipo: 'dano', alvo: 'todos', mult: 1.1, cd: 5, elemento: 'planta', efeitos: [ef('veneno', 3, 0.7)] },
  ],
  Solarin: [
    { id: 'raio_dourado', nome: 'Raio Dourado', icone: '☀️', tipo: 'dano', alvo: 'um', mult: 1.15, cd: 1, distancia: true, elemento: 'luz', efeitos: [ef('silencio', 1, 0.4)] },
    { id: 'chama_solar', nome: 'Chama Solar', icone: '🔆', tipo: 'cura', alvo: 'aliado', mult: 0.3, cd: 3, elemento: 'luz', efeitos: [ef('ataque_alto', 2)] },
    { id: 'aurora', nome: 'Aurora', icone: '🌅', tipo: 'cura', alvo: 'aliados', mult: 0.25, cd: 5, elemento: 'luz', limpa: true, efeitos: [ef('regeneracao', 2)] },
  ],
  // ---- Exclusivos do Banner Mensal de Halloween ----
  'Abobrisco': [
    { id: 'pancada_abobora', nome: 'Pancada de Abóbora', icone: '🎃', tipo: 'dano', alvo: 'um', mult: 1.1, cd: 1, elemento: 'planta', efeitos: [ef('provocacao', 2)] },
    { id: 'casca_encantada', nome: 'Casca Encantada', icone: '🔰', tipo: 'apoio', alvo: 'aliados', cd: 3, elemento: 'planta', escudo: 0.15, efeitos: [ef('defesa_alta', 2)] },
    { id: 'muralha_ramas', nome: 'Muralha de Ramas', icone: '🛡️', tipo: 'apoio', alvo: 'si', cd: 5, elemento: 'planta', escudo: 0.4, efeitos: [ef('provocacao', 3), ef('defesa_alta', 3)] },
  ],
  'Velalume': [
    { id: 'chama_gentil', nome: 'Chama Gentil', icone: '🕯️', tipo: 'cura', alvo: 'aliado', mult: 0.16, cd: 1, elemento: 'luz', efeitos: [ef('regeneracao', 3)] },
    { id: 'vigilia_velas', nome: 'Vigília de Velas', icone: '🌟', tipo: 'cura', alvo: 'aliados', mult: 0.12, cd: 3, elemento: 'luz', efeitos: [ef('regeneracao', 4)] },
    { id: 'procissao_luz', nome: 'Procissão de Luz', icone: '☀️', tipo: 'cura', alvo: 'aliados', mult: 0.3, cd: 5, elemento: 'luz', limpa: true, efeitos: [ef('regeneracao', 3)] },
  ],
  'Mortálio': [
    { id: 'sopro_etereo', nome: 'Sopro Etéreo', icone: '👻', tipo: 'dano', alvo: 'um', mult: 1.05, cd: 1, distancia: true, elemento: 'fantasma', efeitos: [ef('ataque_baixo', 2, 0.7)] },
    { id: 'veu_lamento', nome: 'Véu de Lamento', icone: '💧', tipo: 'cura', alvo: 'aliado', mult: 0.3, cd: 3, elemento: 'fantasma', limpa: true, efeitos: [] },
    { id: 'retorno_alma', nome: 'Retorno da Alma', icone: '🕊️', tipo: 'cura', alvo: 'aliado', mult: 0.2, cd: 5, elemento: 'fantasma', reviver: 0.5, efeitos: [] },
  ],
  'Vitrarco': [
    { id: 'badalada', nome: 'Badalada Sombria', icone: '🔔', tipo: 'dano', alvo: 'um', mult: 1.15, cd: 1, elemento: 'trevas', efeitos: [ef('defesa_baixa', 2, 0.7)] },
    { id: 'egide_noturna', nome: 'Égide Noturna', icone: '✨', tipo: 'apoio', alvo: 'aliado', cd: 3, elemento: 'trevas', escudo: 0.12, efeitos: [ef('invencivel', 1)] },
    { id: 'noite_imaculada', nome: 'Noite Imaculada', icone: '🌙', tipo: 'apoio', alvo: 'aliados', cd: 6, elemento: 'trevas', efeitos: [ef('invencivel', 2)] },
  ],
  // Abyssar: valores configuráveis em ABYSSAR (recargas 1, 4 e 6; velocidade 2 turnos; pânico 3 turnos)
  Abyssar: [
    { id: 'facada', nome: 'Facada', icone: '🔪', tipo: 'dano', alvo: 'um', mult: 1.0, cd: 1, elemento: 'trevas', pctVidaMax: 0.10, limiteChefe: 4, efeitos: [{ id: 'sangramento', turnos: 3, chance: 0.5, valorMult: 2.0 }] },
    { id: 'perseguicao', nome: 'Perseguição', icone: '🏃', tipo: 'dano', alvo: 'aleatorio', golpes: 5, mult: 2.0, bonusVagaVazia: 0.2, reinicia: { fator: 0.5, max: 3 }, cd: 4, elemento: 'trevas', distancia: true, efeitosSi: [{ id: 'veloz', turnos: 2 }], efeitos: [] },
    { id: 'hora_terror', nome: 'Hora do Terror', icone: '😱', tipo: 'apoio', alvo: 'si', cd: 6, elemento: 'trevas', efeitos: [{ id: 'panico', turnos: 3 }] },
  ],

  Noctarn: [
    { id: 'mordida_umbral', nome: 'Mordida Umbral', icone: '🦷', tipo: 'dano', alvo: 'um', mult: 1.3, cd: 1, elemento: 'trevas', efeitos: [ef('sangramento', 3, 0.85)] },
    { id: 'chama_violeta', nome: 'Chama Violeta', icone: '🔥', tipo: 'dano', alvo: 'um', mult: 2.1, cd: 3, distancia: true, elemento: 'trevas', efeitos: [ef('queimadura', 3, 0.75)] },
    { id: 'veu_noturno', nome: 'Véu Noturno', icone: '🌙', tipo: 'cura', alvo: 'si', mult: 0.34, cd: 5, elemento: 'trevas', limpa: true, escudo: 0.15, efeitos: [ef('regeneracao', 2)] },
  ],
};

// Papel padrão de espécies que não dependem dos dados de uma região
// Exclusivos de banner pago (Halloween): poder base +30% sobre T5 comum equivalente (HP/ATQ/DEF)
export { CLASSES_ONIRICOS, CLASSE_DA_ESPECIE, classeDaEspecie, infoClasse } from './regiao1-progressao.js';
export const PODER_EXCLUSIVO = { 'Abobrisco': { hp: 0.3, atk: 0.3, def: 0.3 }, 'Velalume': { hp: 0.3, atk: 0.3, def: 0.3 }, 'Mortálio': { hp: 0.3, atk: 0.3, def: 0.3 }, 'Vitrarco': { hp: 0.3, atk: 0.3, def: 0.3 }, Abyssar: { hp: 0.3, atk: 0.3, def: 0.3 } };
export const PAPEL_PADRAO = { Penumbrio: 'ataque', Brasinha: 'ataque', Gotalume: 'suporte', Sementil: 'defesa', Solinho: 'suporte', Noctarn: 'ataque', Ignavor: 'ataque', Vaelith: 'suporte', Brotavel: 'defesa', Solarin: 'suporte', 'Abobrisco': 'defesa', 'Velalume': 'suporte', 'Mortálio': 'suporte', 'Vitrarco': 'defesa', Abyssar: 'ataque' };

// Habilidade rara preparada para o VFX violeta do Mortálio:
// regeneração, aumento de velocidade, aumento de defesa e escudo por 3 turnos.
// Alvo ('si' | 'aliado' | 'aliados'), valores (escudo, cura, cd) e vagaKit (null ou 0 | 1 | 2) ficam em aberto para fechamento.
export const MORTALIO_VIOLETA_CFG = {
  id: 'manto_violeta',          // id estável para FX_HABILIDADES.manto_violeta em regiao1-vfx.js (Claude)
  nome: 'Manto Violeta',
  icone: '🔮',
  raridade: 'rara',
  elemento: 'fantasma',
  vagaKit: null,                // null = preparada fora das 3 vagas ativas; 0, 1 ou 2 substitui a vaga correspondente no kit do Mortálio
  alvo: 'aliado',               // em aberto: 'si' | 'aliado' | 'aliados'
  cd: 4,                        // em aberto
  cura: 0,                      // em aberto (fração opcional do hpMax)
  escudo: 0.20,                 // em aberto (fração do hpMax do alvo)
  turnos: 3,                    // 3 turnos para os quatro efeitos
  clip: 'assets/confusion/interface/vfx/mortalio-violeta.mp4', // caminho previsto para o clipe violeta ligado pelo Claude
  impactoMs: 520,
};

export function habilidadeVioletaMortalio(opcoes = {}) {
  const c = { ...MORTALIO_VIOLETA_CFG, ...opcoes };
  return {
    id: c.id,
    nome: c.nome,
    icone: c.icone,
    tipo: 'apoio',
    raridade: c.raridade,
    alvo: c.alvo,
    cd: c.cd,
    cura: c.cura,
    elemento: c.elemento,
    escudo: c.escudo,
    escudoTurnos: c.turnos,
    clip: c.clip,
    impactoMs: c.impactoMs,
    efeitos: [
      ef('regeneracao', c.turnos),
      ef('veloz', c.turnos),
      ef('defesa_alta', c.turnos),
    ],
  };
}

export function kitMortalio(opcoes = {}) {
  const base = [...KITS['Mortálio']];
  const vaga = opcoes.vagaKit !== undefined ? opcoes.vagaKit : MORTALIO_VIOLETA_CFG.vagaKit;
  if (Number.isInteger(vaga) && vaga >= 0 && vaga < base.length) base[vaga] = habilidadeVioletaMortalio(opcoes);
  return base;
}
KITS['Mortálio'].preparadaVioleta = habilidadeVioletaMortalio();

// ---- gerador por arquétipo (papel) e elemento ----
const POR_ELEMENTO = {
  fogo: { dot: 'queimadura', cc: 'atordoamento', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  planta: { dot: 'veneno', cc: 'sono', debuff: 'defesa_baixa', buff: 'regeneracao' },
  agua: { dot: 'sangramento', cc: 'congelamento', debuff: 'ataque_baixo', buff: 'regeneracao' },
  terra: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  pedra: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  inseto: { dot: 'veneno', cc: 'sono', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  voador: { dot: 'sangramento', cc: 'silencio', debuff: 'defesa_baixa', buff: 'ataque_alto' },
  eletrico: { dot: 'queimadura', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'ataque_alto' },
  aco: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  trevas: { dot: 'sangramento', cc: 'sono', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  luz: { dot: 'queimadura', cc: 'silencio', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  neutro: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'ataque_alto' },
};
// Formas base e finais usam o kit da linha
export const LINHA_DO_KIT = { Penumbrio: 'Noctarn', Noctarion: 'Noctarn', Brasinha: 'Ignavor', Ignaraz: 'Ignavor', Gotalume: 'Vaelith', Vaelirion: 'Vaelith', Sementil: 'Brotavel', Florivel: 'Brotavel', Solinho: 'Solarin', 'Helíssio': 'Solarin' };
export const temKitProprio = (esp) => Boolean(KITS[esp] || KITS[LINHA_DO_KIT[esp]]);
export function kitDe(especie, papel, elemento, nomes = []) {
  if (especie === 'Mortálio') return Number.isInteger(MORTALIO_VIOLETA_CFG.vagaKit) ? kitMortalio() : KITS['Mortálio'];
  if (KITS[especie]) return KITS[especie];
  if (KITS[LINHA_DO_KIT[especie]]) return KITS[LINHA_DO_KIT[especie]];
  const E = POR_ELEMENTO[elemento] || POR_ELEMENTO.neutro, n = (i) => nomes[Math.min(i, nomes.length - 1)] || 'Golpe';
  const mk = (i, h) => ({ id: slug(n(i)), nome: n(i), elemento, ...h });
  if (papel === 'defesa') return [
    mk(0, { icone: '🛡️', tipo: 'dano', alvo: 'um', mult: 1.1, cd: 1, efeitos: [ef('provocacao', 2)] }),
    mk(1, { icone: '🔰', tipo: 'apoio', alvo: 'aliados', cd: 3, escudo: 0.12, efeitos: [ef('defesa_alta', 3)] }),
    mk(2, { icone: '💥', tipo: 'dano', alvo: 'todos', mult: 1.5, cd: 5, distancia: true, efeitos: [ef(E.cc, 1, 0.55)] }),
  ];
  if (papel === 'suporte') return [
    mk(0, { icone: '💚', tipo: 'cura', alvo: 'aliado', mult: 0.2, cd: 1, efeitos: [] }),
    mk(1, { icone: '🌿', tipo: 'cura', alvo: 'aliados', mult: 0.24, cd: 3, efeitos: [ef('regeneracao', 3)] }),
    mk(2, { icone: '✨', tipo: 'apoio', alvo: 'aliados', cd: 5, limpa: true, cura: 0.14, efeitos: [ef(E.buff === 'regeneracao' ? 'ataque_alto' : E.buff, 3)] }),
  ];
  return [
    mk(0, { icone: '⚔️', tipo: 'dano', alvo: 'um', mult: 1.2, cd: 1, efeitos: [ef(E.dot, 3, 0.7)] }),
    mk(1, { icone: '🌪️', tipo: 'dano', alvo: 'todos', mult: 1.05, cd: 3, distancia: true, efeitos: [ef(E.debuff, 2, 0.6)] }),
    mk(2, { icone: '💢', tipo: 'dano', alvo: 'um', mult: 2.9, cd: 5, distancia: true, efeitos: [ef(E.cc, 1, 0.6)] }),
  ];
}
