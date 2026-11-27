// VFX de batalha em estilo anime: preparação → execução → impacto → dissipação, disparados pelo id da habilidade e pelo resultado do turno
// (alvos e valores já calculados pelo motor). Partículas, cortes, feixes e ondas vêm de regiao1-vfx-motor.js (canvas, mistura aditiva);
// cut-in, números, câmera e reações ficam no DOM. Cada habilidade escrita à mão tem coreografia própria em FX_HABILIDADES (com `clip`
// pronto para clipes do Flow); as geradas por arquétipo usam coreografias por elemento. Ultimates (recarga ≥ 5) têm cut-in.
import * as HAB from './regiao1-batalha-habilidades.js';
import { caixaDoClipe } from './regiao1-vfx-caixas.js';
import { pref, tocar } from './regiao1-sfx.js';
const { EFEITOS } = HAB;
import { camada, particula, rajada, convergir, onda, luz, corte, feixe, relampago, linhasFoco, circulo, coluna, raiosLuz, rachadura, projetil, livre, R, recorte, precarregarRecortes } from './regiao1-vfx-motor.js';
// Paletas de Halloween: abóbora (laranja + amarelo-vela + violeta de bruxa) e fantasma (verde-ecto + verde-túmulo)

const ESP = (ms) => new Promise((r) => setTimeout(r, ms));
const TAU = Math.PI * 2;
export const ELEM = {
  fogo: { cor: '#fb923c', cor2: '#fde047' }, agua: { cor: '#38bdf8', cor2: '#e0f2fe' }, planta: { cor: '#4ade80', cor2: '#bef264' }, terra: { cor: '#c08443', cor2: '#e7cfa6' },
  pedra: { cor: '#94a3b8', cor2: '#e2e8f0' }, inseto: { cor: '#a3e635', cor2: '#fde68a' }, voador: { cor: '#bae6fd', cor2: '#ffffff' }, eletrico: { cor: '#facc15', cor2: '#ffffff' },
  aco: { cor: '#cbd5e1', cor2: '#ffffff' }, trevas: { cor: '#8b5cf6', cor2: '#ddd6fe' }, luz: { cor: '#fcd34d', cor2: '#fffbeb' }, neutro: { cor: '#e5e7eb', cor2: '#ffffff' },
  fantasma: { cor: '#67e8f9', cor2: '#e0e7ff' },
};
// Configuração por habilidade (id): fx (coreografia), ult (cut-in), ms (duração para o ritmo do automático), clip (vídeo do Flow) e impactoMs.
export const FX_HABILIDADES = {
  danca_oito_laminas: { fx: 'oitoLaminas', ms: 1900 }, sincronia_telecinetica: { fx: 'oitoLaminas', ms: 1900 }, tempestade_oito_laminas: { fx: 'oitoLaminas', ult: true, ms: 2300 },
  chama_noturna: { fx: null, ms: 1800 }, // sem o clipe, cai na área genérica de trevas
  mordida_umbral: { fx: 'mordida', ms: 1144 }, chama_violeta: { fx: 'chamaVioleta', ms: 1641 }, veu_noturno: { fx: 'veuNoturno', ult: true, ms: 1986 },
  brasa_imperial: { fx: 'brasaImperial', ms: 1285 }, juba_flamejante: { fx: 'jubaFlamejante', ms: 1092 }, rugido_dourado: { fx: 'rugidoDourado', ult: true, ms: 1491 },
  arco_ciano: { fx: 'arcoCiano', ms: 1086 }, veu_gelado: { fx: 'veuGelado', ms: 1491 }, fenda_estelar: { fx: 'fendaEstelar', ult: true, ms: 1872 },
  raiz_viva: { fx: 'raizViva', ms: 1804 }, espora_verde: { fx: 'esporaVerde', ms: 1431 }, broto_fertil: { fx: 'brotoFertil', ult: true, ms: 1869 },
  raio_dourado: { fx: 'raioDourado', ms: 1032 }, chama_solar: { fx: 'chamaSolar', ms: 1548 }, aurora: { fx: 'aurora', ult: true, ms: 1846 },
  pancada_abobora: { fx: 'pancadaAbobora', ms: 1405 }, casca_encantada: { fx: 'cascaEncantada', ms: 1452 }, muralha_ramas: { fx: 'muralhaRamas', ult: true, ms: 1773 },
  chama_gentil: { fx: 'chamaGentil', ms: 1596 }, vigilia_velas: { fx: 'vigiliaVelas', ms: 1552 }, procissao_luz: { fx: 'procissaoLuz', ult: true, ms: 1838 },
  sopro_etereo: { fx: 'soproEtereo', ms: 1444 }, veu_lamento: { fx: 'veuLamento', ms: 1762 }, retorno_alma: { fx: 'retornoAlma', ult: true, ms: 2475 },
  badalada: { fx: 'badalada', ms: 1182 }, egide_noturna: { fx: 'egideNoturna', ms: 1684 }, noite_imaculada: { fx: 'noiteImaculada', ult: true, ms: 1757 },
  facada: { fx: 'facada', ms: 1016 }, perseguicao: { fx: 'perseguicao', ult: true, ms: 1700 }, hora_terror: { fx: 'horaTerror', ult: true, ms: 2739 },
};
// Cores do cut-in por linha (abóbora, vela, ecto, vitral, sangue)
const CUT = { abobora: ['#c2410c', '#fde047'], vela: ['#b45309', '#fef3c7'], ecto: ['#047857', '#a7f3d0'], vitral: ['#5b21b6', '#fde68a'], sangue: ['#7f1d1d', '#ef4444'] };
for (const [ids, c] of [[['muralha_ramas', 'pancada_abobora', 'casca_encantada'], CUT.abobora], [['procissao_luz'], CUT.vela], [['retorno_alma'], CUT.ecto], [['noite_imaculada'], CUT.vitral], [['facada', 'perseguicao', 'hora_terror'], CUT.sangue]]) for (const id of ids) FX_HABILIDADES[id].cut = c;
// Manto Violeta do Mortálio (contrato do PR #57): clipe do Flow quando publicado; senão, coreografia violeta procedural.
const VIOLETA = HAB.MORTALIO_VIOLETA_CFG || { id: 'manto_violeta', clip: 'assets/confusion/interface/vfx/mortalio-violeta.mp4', impactoMs: 520 };
FX_HABILIDADES[VIOLETA.id] = { fx: 'mantoVioleta', ult: true, ms: 1750, cut: ['#5b21b6', '#ddd6fe'] };
// Clipes do Flow, lote 1 (PR #61). impactoMs = ataque do pico de áudio do próprio clipe; chao = altura relativa do chão do efeito no
// quadro (ancorado nos pés do alvo); escala = largura do clipe em relação ao corpo do alvo. Sem o arquivo, vale a coreografia procedural.
const FLOW8 = 'assets/confusion/interface/vfx/flow-lote-8/';
const FLOW = 'assets/confusion/interface/vfx/flow-lote-1/', FLOW2 = 'assets/confusion/interface/vfx/flow-lote-2/', FLOW3 = 'assets/confusion/interface/vfx/flow-lote-3/', FLOW4 = 'assets/confusion/interface/vfx/flow-lote-4/', FLOW5 = 'assets/confusion/interface/vfx/flow-lote-5/', FLOW6 = 'assets/confusion/interface/vfx/flow-lote-6/', FLOW7 = 'assets/confusion/interface/vfx/flow-lote-7/';
export const CLIPES_FLOW = {
  manto_violeta: { clip: `${FLOW}mortalio-violeta.mp4`, impactoMs: 1250, chao: 0.86, escala: 3.4, duracaoMs: 3000 },
  chama_solar: { clip: `${FLOW}cura-dourada.mp4`, impactoMs: 1200, chao: 0.86, escala: 3.0, duracaoMs: 3000 }, // Solarin: cura de um aliado (chama dourada; também é a cura de fogo)
  // impacto-ciano.mp4 é a cura de água (respingo com símbolos de cura): fica no Véu Gelado; o Arco Ciano volta à coreografia própria
  veu_gelado: { clip: `${FLOW}impacto-ciano.mp4`, impactoMs: 1250, chao: 0.88, escala: 3.0, duracaoMs: 3000 }, // Vaelith: cura do grupo (água)
  espora_verde: { clip: `${FLOW3}cura-planta.mp4`, impactoMs: 800, chao: 0.86, escala: 3.0, duracaoMs: 2400 }, // Brotavel: regeneração e escudo (planta)
  procissao_luz: { clip: `${FLOW}espiral-dourada.mp4`, impactoMs: 1300, chao: 0.86, escala: 2.6, duracaoMs: 3000 }, // Velalume: cura do grupo (ultimate)
  // Lote 2 (linha do Noctarn). centro = altura relativa do centro do efeito no quadro, alinhada ao meio do corpo do alvo.
  mordida_umbral: { clip: `${FLOW2}mordida-umbral.mp4`, impactoMs: 1200, centro: 0.5, escala: 2.4, duracaoMs: 2600 },
  chama_violeta: { clip: `${FLOW2}chama-violeta.mp4`, impactoMs: 650, centro: 0.5, escala: 2.6, duracaoMs: 2400, voa: true }, // projétil rápido: a esfera voa até o alvo e explode
  veu_noturno: { clip: `${FLOW2}veu-noturno.mp4`, impactoMs: 1200, chao: 0.93, escala: 2.2, duracaoMs: 3400 },
  // Noctarion: Chama Noturna, erupção que atinge todos os inimigos (uma erupção larga sobre o grupo, a partir da explosão)
  chama_noturna: { clip: `${FLOW2}chama-noturna.mp4`, impactoMs: 250, chao: 0.93, escala: 3.2, duracaoMs: 2000 },
  // Lote 8 (lote A do Flow): as habilidades dos kits que ainda eram desenhadas no código. Golpe: centro; projétil: vem da esquerda
  // (espelhado quando o atacante está à direita); suporte: aura com base nos pés, cobrindo o corpo (ou o time, em grupo).
  ...Object.fromEntries([...['brasa_imperial', 'raiz_viva', 'badalada', 'pancada_abobora', 'juba_flamejante', 'fenda_estelar', 'broto_fertil'].map((id) => [id, { centro: 0.5, escala: 3.0 }]),
    ...['arco_ciano', 'raio_dourado', 'sopro_etereo'].map((id) => [id, { centro: 0.5, escala: 3.4, espelhar: true }]),
    ...['rugido_dourado', 'aurora', 'muralha_ramas', 'noite_imaculada', 'egide_noturna', 'casca_encantada', 'vigilia_velas', 'retorno_alma', 'chama_gentil', 'veu_lamento'].map((id) => [id, { chao: 0.9, escala: 3.8 }])]
    .map(([id, o]) => [id, { clip: `${FLOW8}${id}.mp4`, impactoMs: 600, duracaoMs: 2400, ...o }])),
};
// Variações de clipe por forma (golpes que mudam só no visual); a Chama Noturna agora é uma habilidade própria do kit
export const CLIPES_POR_ESPECIE = {};
// Lote 3: clipes elementais para as habilidades sem coreografia própria (kits gerados, Reinos 03–12, chefes). Fundo preto, som
// do próprio clipe; o início parado foi cortado na codificação. clipeElemental(hab) escolhe pelo tipo, elemento e efeitos.
export const CLIPES_ELEMENTAIS = {
  raio: { clip: `${FLOW3}raio-violeta.mp4`, impactoMs: 540, centro: 0.49, escala: 2.6, duracaoMs: 2500 },          // elétrico
  explosaoDourada: { clip: `${FLOW3}explosao-dourada.mp4`, impactoMs: 430, centro: 0.5, escala: 2.6, duracaoMs: 2400 }, // luz
  erupcaoFogo: { clip: `${FLOW3}erupcao-fogo.mp4`, impactoMs: 450, chao: 0.85, escala: 2.4, duracaoMs: 2400 },     // fogo
  eclipse: { clip: `${FLOW3}eclipse.mp4`, impactoMs: 500, centro: 0.49, escala: 2.6, duracaoMs: 2200 },             // trevas
  veneno: { clip: `${FLOW3}veneno.mp4`, impactoMs: 400, centro: 0.49, escala: 2.6, duracaoMs: 2200 },              // planta/inseto com veneno
  escudoAgua: { clip: 'assets/confusion/interface/vfx/flow-lote-9/escudo-agua.mp4', impactoMs: 600, chao: 0.98, escala: 2.6, duracaoMs: 2400 }, // escudo de água (cúpula de água)
  cupula: { clip: `${FLOW3}cupula-agua.mp4`, impactoMs: 500, chao: 0.95, escala: 2.4, duracaoMs: 2200 },           // escudo (qualquer elemento)
  fenix: { clip: `${FLOW3}fenix.mp4`, impactoMs: 850, chao: 0.8, escala: 2.6, duracaoMs: 2400 },                   // cura e apoio de luz
  curaFogo: { clip: `${FLOW}cura-dourada.mp4`, impactoMs: 1200, chao: 0.86, escala: 3.0, duracaoMs: 3000 },        // cura de fogo
  curaAgua: { clip: `${FLOW}impacto-ciano.mp4`, impactoMs: 1250, chao: 0.88, escala: 3.0, duracaoMs: 3000 },       // cura de água
  curaPlanta: { clip: `${FLOW3}cura-planta.mp4`, impactoMs: 800, chao: 0.86, escala: 3.0, duracaoMs: 2400 },       // cura de planta
  // Lote 4: um clipe por elemento (18 do Flow, fundo preto)
  tornado: { clip: `${FLOW4}tornado-branco.mp4`, impactoMs: 1000, centro: 0.49, escala: 2.6, duracaoMs: 1600 },      // voador em área
  folhas: { clip: `${FLOW4}folhas-espiral.mp4`, impactoMs: 1000, centro: 0.52, escala: 2.6, duracaoMs: 2000 },       // planta
  bencao: { clip: `${FLOW4}bencao-rosa.mp4`, impactoMs: 770, centro: 0.49, escala: 2.4, duracaoMs: 2600 },          // apoio (bônus) fora de luz
  cruzAco: { clip: `${FLOW4}cruz-aco.mp4`, impactoMs: 720, centro: 0.5, escala: 2.4, duracaoMs: 2600 },             // aço
  gelo: { clip: `${FLOW4}gelo-cristais.mp4`, impactoMs: 600, centro: 0.49, escala: 2.6, duracaoMs: 2400 },          // água em área ou com congelamento
  enxame: { clip: `${FLOW4}enxame-verde.mp4`, impactoMs: 630, centro: 0.51, escala: 2.6, duracaoMs: 2400 },         // inseto
  espiralFogo: { clip: `${FLOW4}espiral-fogo.mp4`, impactoMs: 800, centro: 0.49, escala: 2.4, duracaoMs: 2300 },    // fogo em um alvo
  nevoaToxica: { clip: `${FLOW4}nevoa-toxica.mp4`, impactoMs: 900, centro: 0.48, escala: 2.6, duracaoMs: 2600 },   // veneno em área
  luaRubra: { clip: `${FLOW4}lua-rubra.mp4`, impactoMs: 820, chao: 0.8, escala: 2.8, duracaoMs: 2700, ult: true },  // golpe especial dos chefes
  aneis: { clip: `${FLOW4}aneis-magenta.mp4`, impactoMs: 650, centro: 0.52, escala: 2.6, duracaoMs: 2400 },         // fantasma
  garras: { clip: `${FLOW4}garras-sombrias.mp4`, impactoMs: 730, centro: 0.5, escala: 2.4, duracaoMs: 2400 },       // trevas corpo a corpo
  dragao: { clip: `${FLOW4}dragao-raio.mp4`, impactoMs: 1000, centro: 0.53, escala: 3.2, duracaoMs: 1800, espelhar: true, ult: true }, // suprema elétrica
  galaxia: { clip: `${FLOW4}galaxia-violeta.mp4`, impactoMs: 925, centro: 0.49, escala: 2.6, duracaoMs: 1800 },    // trevas em área
  rochas: { clip: `${FLOW4}rochas.mp4`, impactoMs: 780, centro: 0.5, escala: 2.6, duracaoMs: 2200 },               // terra e pedra
  esfera: { clip: `${FLOW4}esfera-branca.mp4`, impactoMs: 500, centro: 0.49, escala: 2.4, duracaoMs: 2400 },        // neutro
  explosaoRubra: { clip: `${FLOW4}explosao-rubra.mp4`, impactoMs: 300, centro: 0.5, escala: 2.8, duracaoMs: 2400, ult: true }, // suprema de fogo
  tromba: { clip: `${FLOW4}tromba-agua.mp4`, impactoMs: 700, chao: 0.85, escala: 2.4, duracaoMs: 2400 },           // (reserva)
  // Lote 5: golpes em um alvo, um por elemento (carga → explosão → dissipação). chroma = fundo verde recortado em tempo real.
  trevas1: { clip: `${FLOW5}trevas.mp4`, impactoMs: 350, centro: 0.5, escala: 3.0, duracaoMs: 2300 },
  dragaoAgua: { clip: `${FLOW5}dragao-agua.mp4`, impactoMs: 640, centro: 0.5, escala: 2.8, duracaoMs: 2400, espelhar: true, ult: true }, // suprema de água
  normal1: { clip: `${FLOW5}normal.mp4`, impactoMs: 640, centro: 0.5, escala: 3.0, duracaoMs: 2300 },
  fantasma1: { clip: `${FLOW5}fantasma.mp4`, impactoMs: 1060, centro: 0.5, escala: 3.0, duracaoMs: 2400, espelhar: true },
  veneno1: { clip: `${FLOW5}veneno.mp4`, impactoMs: 475, centro: 0.5, escala: 3.0, duracaoMs: 2400 },
  inseto1: { clip: `${FLOW5}inseto.mp4`, impactoMs: 725, centro: 0.5, escala: 3.0, duracaoMs: 2300 },
  gelo1: { clip: `${FLOW5}gelo.mp4`, impactoMs: 680, centro: 0.5, escala: 3.0, duracaoMs: 2400 },
  eletrico1: { clip: `${FLOW5}eletrico.mp4`, impactoMs: 350, centro: 0.5, escala: 3.0, duracaoMs: 2200 },
  fada: { clip: `${FLOW5}fada.mp4`, impactoMs: 390, centro: 0.5, escala: 3.0, duracaoMs: 2400 },                    // apoio (bônus) fora de luz
  aco1: { clip: `${FLOW5}aco-verde.mp4`, impactoMs: 770, centro: 0.5, escala: 3.0, duracaoMs: 2300, chroma: true },
  agua1: { clip: `${FLOW5}agua.mp4`, impactoMs: 770, centro: 0.5, escala: 3.0, duracaoMs: 2300 },
  voador1: { clip: `${FLOW5}voador.mp4`, impactoMs: 770, centro: 0.5, escala: 3.0, duracaoMs: 2300 },
  planta1: { clip: `${FLOW5}planta.mp4`, impactoMs: 560, centro: 0.5, escala: 3.0, duracaoMs: 2400 },
  luta: { clip: `${FLOW5}luta.mp4`, impactoMs: 680, centro: 0.5, escala: 3.0, duracaoMs: 2300, espelhar: true },     // neutro corpo a corpo
  psiquico: { clip: `${FLOW5}psiquico.mp4`, impactoMs: 890, centro: 0.5, escala: 3.0, duracaoMs: 2300 },            // fantasma em área
  // Lote 6: suporte (anel no chão e aura subindo em volta do Onírico; nada explode). Ancorados nos pés.
  ...Object.fromEntries([['curaEletrica', 'cura-eletrica', 750], ['ressurreicao', 'ressurreicao', 800], ['ataque', 'ataque', 800], ['velocidade', 'velocidade', 750],
    ['curaTerra', 'cura-terra', 800], ['defesa', 'defesa', 800], ['invencivel', 'invencivel', 850], ['curaFantasma', 'cura-fantasma', 700], ['curaInseto', 'cura-inseto', 800],
    ['provocacao', 'provocacao', 750], ['regeneracao', 'regeneracao', 750], ['curaVento', 'cura-vento', 700], ['curaTrevas', 'cura-trevas', 850], ['purificacao', 'purificacao', 750]]
    .map(([k, arq, imp]) => [k, { clip: `${FLOW6}${arq}.mp4`, impactoMs: imp, chao: 0.9, escala: 3.8, duracaoMs: 2500 }])),
  fogo1: { clip: `${FLOW7}fogo.mp4`, impactoMs: 350, centro: 0.5, escala: 3.0, duracaoMs: 2300 },  // fogo em um alvo (lote 7)
  terra1: { clip: `${FLOW7}terra.mp4`, impactoMs: 430, centro: 0.5, escala: 3.0, duracaoMs: 2300 }, // terra em um alvo (lote 7)
  pedra1: { clip: `${FLOW5}pedra-verde.mp4`, impactoMs: 810, centro: 0.5, escala: 3.0, duracaoMs: 2400, chroma: true },
  anelEletrico: { clip: `${FLOW3}anel-eletrico.mp4`, impactoMs: 970, centro: 0.5, escala: 2.6, duracaoMs: 1800 },  // elétrico em área
  laminasSombrias: { clip: `${FLOW3}laminas-sombrias.mp4`, impactoMs: 650, centro: 0.49, escala: 2.8, duracaoMs: 2400, ult: true }, // suprema de trevas
  ventoDourado: { clip: `${FLOW3}vento-dourado.mp4`, impactoMs: 600, centro: 0.49, escala: 3.2, duracaoMs: 2400, espelhar: true }, // voador (sopro da esquerda para a direita)
  cortesRubros: { clip: `${FLOW3}cortes-rubros.mp4`, impactoMs: 940, centro: 0.49, escala: 2.4, duracaoMs: 1900 }, // corpo a corpo com sangramento
};
// Abyssar na forma final (T5): a Perseguição vira o clipe dos cortes vermelhos
export const CLIPE_ABYSSAR_FINAL = {
  perseguicao: { clip: `${FLOW3}cortes-rubros-hd.mp4`, impactoMs: 940, centro: 0.49, escala: 3.6, duracaoMs: 2400, ult: true },
  facada: { clip: `${FLOW3}anel-de-cortes-hd.mp4`, impactoMs: 1080, centro: 0.5, escala: 3.4, duracaoMs: 2000 }, // anel de cortes rubros
  // transformação do modo de pânico: o clipe traz o próprio Abyssar, então o retrato some enquanto ele toca
  hora_terror: { clip: `${FLOW4}abyssar-terror-hd.mp4`, impactoMs: 730, centro: 0.47, escala: 2.55, duracaoMs: 3700, posMs: 2400, ocultarAtor: true, ult: true },
};
const CHEFE_ESPECIAL = new Set(Object.values(HAB.KITS_CHEFES || {}).map((k) => k[2]?.id));
for (const k of ['purificacao', 'ressurreicao', 'invencivel']) CLIPES_ELEMENTAIS[k].opacidade = 0.72; // brancos: não estourar a cena
export function clipeElemental(hab) {
  if (!hab || FX_HABILIDADES[hab.id] || hab.clip) return null;
  const C = CLIPES_ELEMENTAIS, efs = (hab.efeitos || []).map((e) => e.id), el = hab.elemento, area = hab.alvo === 'todos', ult = hab.cd >= 5;
  if (hab.reviver) return C.ressurreicao;
  if (hab.escudo || efs.includes('escudo')) return el === 'agua' ? C.escudoAgua : C.cupula;
  const ehCura = hab.tipo === 'cura' || (hab.tipo === 'apoio' && (hab.cura || efs.includes('regeneracao') && !efs.some((e) => ['ataque_alto', 'defesa_alta', 'veloz', 'invencivel'].includes(e))));
  if (ehCura) return { luz: C.fenix, fogo: C.curaFogo, agua: C.curaAgua, planta: C.curaPlanta, trevas: C.curaTrevas, fantasma: C.curaFantasma, eletrico: C.curaEletrica,
    voador: C.curaVento, terra: C.curaTerra, pedra: C.curaTerra, inseto: C.curaInseto }[el] || C.regeneracao;
  if (hab.tipo === 'apoio') {
    if (efs.includes('invencivel')) return C.invencivel;
    if (efs.includes('provocacao')) return C.provocacao;
    if (efs.includes('veloz')) return C.velocidade;
    if (efs.includes('defesa_alta')) return C.defesa;
    if (efs.includes('ataque_alto')) return C.ataque;
    if (efs.includes('regeneracao')) return C.regeneracao;
    if (hab.limpa) return C.purificacao;
    return el === 'luz' ? C.fenix : C.fada;
  }
  if (hab.tipo !== 'dano') return null;
  if (CHEFE_ESPECIAL.has(hab.id)) return C.luaRubra;
  if (efs.includes('veneno')) { if (area) return C.nevoaToxica; if (el === 'planta' || el === 'inseto') return C.veneno1; }
  const perto = !hab.distancia;
  switch (el) {
    case 'eletrico': return ult ? C.dragao : area ? C.anelEletrico : C.eletrico1;
    case 'fogo': return ult ? C.explosaoRubra : area ? C.erupcaoFogo : C.fogo1;
    case 'trevas': return ult ? C.laminasSombrias : area ? C.galaxia : perto ? C.garras : C.trevas1;
    case 'luz': return C.explosaoDourada;
    case 'voador': return area ? C.tornado : C.voador1;
    case 'agua': return ult ? C.dragaoAgua : area ? C.gelo : efs.includes('congelamento') ? C.gelo1 : C.agua1;
    case 'planta': return area ? C.folhas : C.planta1;
    case 'inseto': return area ? C.enxame : C.inseto1;
    case 'terra': return area ? C.rochas : C.terra1;
    case 'pedra': return area ? C.rochas : C.pedra1;
    case 'aco': return area ? C.cruzAco : C.aco1;
    case 'fantasma': return area ? C.psiquico : C.fantasma1;
    default: return area ? C.esfera : perto ? (efs.includes('sangramento') ? C.cortesRubros : C.luta) : C.normal1;
  }
}
for (const [id, c] of Object.entries(CLIPES_FLOW)) Object.assign(FX_HABILIDADES[id], c, { ms: c.impactoMs + 1300 });
// Chuva de meteoros (tomada cinematográfica com cenário): começa depois do corte em que o meteoro central some (≈2,0 s) e só entra
// em combate quando METEOROS_EM_COMBATE for ligado, após revisão; no laboratório pode ser forçada (ctx.cinema).
export const METEOROS_CINEMA = { clip: `${FLOW}chuva-de-meteoros-original.mp4`, inicio: 2.05, impactoMs: 200, duracaoMs: 2600 };
export let METEOROS_EM_COMBATE = false;
for (const c of Object.values(FX_HABILIDADES)) { c.clip ??= null; c.impactoMs ??= 500; }

// ---------- utilidades do DOM ----------
let cssOk = false;
const CSS = `
.fx-cutin{position:absolute;inset:0;z-index:88;pointer-events:none;overflow:hidden}
.fx-cutin .ci-faixa{position:absolute;left:-14%;right:-14%;top:27%;height:44%;transform:skewY(-7deg) scaleY(0);background:linear-gradient(90deg,rgba(6,3,14,.94) 8%,var(--c1) 50%,rgba(6,3,14,.94) 92%);border-block:3px solid var(--c2);box-shadow:0 0 34px var(--c1),inset 0 0 60px rgba(0,0,0,.65);overflow:hidden}
.fx-cutin.ini .ci-faixa{transform:skewY(7deg) scaleY(0)}
.fx-cutin .ci-l{position:absolute;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:ci-l var(--d) linear infinite}
@keyframes ci-l{from{transform:translateX(120vw)}to{transform:translateX(-60vw)}}
.fx-cutin .ci-img{position:absolute;left:12%;bottom:-42%;height:180%;max-width:none;filter:drop-shadow(0 0 14px var(--c2)) drop-shadow(8px 8px 0 rgba(0,0,0,.55))}
.fx-cutin.ini .ci-img{left:auto;right:12%}
.fx-cutin .ci-nome{position:absolute;right:16%;top:50%;transform:translateY(-50%) skewY(7deg);font:italic 900 clamp(22px,5.6vw,54px)/1 system-ui,sans-serif;color:#fff;letter-spacing:.02em;-webkit-text-stroke:1.5px var(--c2);text-shadow:0 0 22px var(--c1),4px 4px 0 rgba(0,0,0,.6);white-space:nowrap;text-align:right}
.fx-cutin.ini .ci-nome{right:auto;left:16%;transform:translateY(-50%) skewY(-7deg);text-align:left}
.fx-cutin .ci-nome small{display:block;font-size:.34em;letter-spacing:.32em;opacity:.9;margin-bottom:.3em;-webkit-text-stroke:0}
.fx-num{position:absolute;pointer-events:none;font:italic 900 21px/1 system-ui,sans-serif;white-space:nowrap;z-index:92;letter-spacing:-.02em}
.fx-num.g{font-size:31px}.fx-num.p{font-size:14px;font-style:normal;font-weight:800}
.fx-combo{position:absolute;pointer-events:none;z-index:93;font:italic 900 30px/1 system-ui,sans-serif;color:#fff;-webkit-text-stroke:1.5px #b91c1c;text-shadow:0 0 14px #ef4444,3px 3px 0 #000;white-space:nowrap}
.fx-combo small{font-size:.5em;margin-left:4px;-webkit-text-stroke:0;color:#fecaca}
.fx-veu{position:absolute;inset:0;pointer-events:none;z-index:3}`;
const injetar = () => { if (cssOk) return; cssOk = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); };

// Velocidade ×1/×2/×3 (preferência do jogador): divide todas as durações. Dano, recarga e resultado não dependem dela.
export function criarCtx({ arena, campo, no, aplicarHp, rapido = false, mobile, velocidade = pref.velocidade }) {
  const m = mobile ?? (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches);
  return { arena, campo, no, aplicarHp, rapido, k: 1 / velocidade, dens: m ? 0.5 : 1, blur: !m, som: !(typeof document !== 'undefined' && document.hidden) };
}
const caixa = (ctx, el) => { const a = ctx.arena.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - a.left, y: r.top + r.height / 2 - a.top, pe: r.bottom - a.top - r.height * 0.06, topo: r.top - a.top, w: r.width, h: r.height, boca: (frente) => ({ x: r.left + r.width / 2 - a.left + frente * r.width * 0.3, y: r.top + r.height * 0.36 - a.top }) }; };
const corpo = (ctx, el) => caixa(ctx, el.querySelector('.un-fig img') || el);
const fig = (el) => el.querySelector('.un-fig') || el;
function novo(ctx, css, html = '', pai = ctx.campo) { const e = document.createElement('i'); e.style.cssText = `position:absolute;pointer-events:none;font-style:normal;${css}`; if (html) e.innerHTML = html; pai.append(e); return e; }
const anim = (e, kf, o) => { const a = e.animate(kf, { fill: 'forwards', ...o }); return a.finished.catch(() => {}).then(() => a); };
const limpa = (e, ms) => setTimeout(() => e.remove(), ms);
function flash(ctx, cor, ms = 180, op = 0.35) { const e = novo(ctx, `inset:0;background:${cor};opacity:0;z-index:95`, '', ctx.arena); e.animate([{ opacity: op }, { opacity: 0 }], { duration: ms * ctx.k }); limpa(e, ms * 2); }
function camera(ctx, foco, { zoom = 1.05, tremor = 0, ms = 420 } = {}) {
  if (ctx.rapido && tremor < 8) tremor *= 0.4;
  ctx.campo.style.transformOrigin = `${foco.x}px ${foco.y}px`;
  const kf = [{ transform: 'scale(1) translate(0,0)' }, { transform: `scale(${zoom}) translate(0,0)`, offset: 0.16 }];
  if (tremor) for (let i = 0; i < 7; i++) { const f = tremor * (1 - i / 8); kf.push({ transform: `scale(${zoom}) translate(${R(-f, f)}px, ${R(-f, f) * 0.7}px)`, offset: 0.16 + (i + 1) * 0.075 }); }
  kf.push({ transform: 'scale(1) translate(0,0)' });
  ctx.campo.animate(kf, { duration: ms * ctx.k, easing: 'ease-out' });
}
// Quadro de impacto (inversão rápida, típico de anime) para golpes pesados
function quadroImpacto(ctx, forte = true) { ctx.campo.animate([{ filter: 'none' }, { filter: forte ? 'invert(1) contrast(1.8) grayscale(1)' : 'brightness(2.2) contrast(1.3)', offset: 0.2 }, { filter: 'brightness(1.6) saturate(.4)', offset: 0.5 }, { filter: 'none' }], { duration: 150 * ctx.k }); }
// Pose de ataque no momento do golpe: troca para a imagem de ataque da forma e volta ao repouso sem piscar (regiao1-poses.js)
function golpePose(ctx, A, ms = 380) { const p = A?._pose; if (p) p.mostrar(true, ms * ctx.k); }
function reacao(ctx, el, dir, forca = 1, cor = '#fff') { fig(el).animate([{ transform: 'translate(0,0)', filter: 'brightness(4) saturate(0)' }, { transform: `translate(${dir * 16 * forca}px,-5px) rotate(${dir * 5 * forca}deg)`, filter: `brightness(1.9) drop-shadow(0 0 10px ${cor})`, offset: 0.25 }, { transform: `translate(${-dir * 4 * forca}px,0)`, offset: 0.62 }, { transform: 'translate(0,0)', filter: 'none' }], { duration: 430 * ctx.k, easing: 'ease-out' }); }
function numero(ctx, el, txt, cor, o = {}) {
  injetar(); const b = corpo(ctx, el);
  const e = novo(ctx, `left:${b.x + (o.dx || 0)}px;top:${b.topo + 6 + (o.dy || 0)}px;color:${cor};text-shadow:0 0 10px ${cor},0 2px 0 #000,0 0 3px #000;opacity:0`, txt); e.className = `fx-num${o.grande ? ' g' : ''}${o.pequeno ? ' p' : ''}`;
  const rot = o.grande ? R(-8, 8) : 0;
  e.animate([{ transform: `translate(-50%,0) scale(${o.grande ? 2.2 : 1.6}) rotate(${rot}deg)`, opacity: 0 }, { transform: `translate(-50%,-10px) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.14 }, { transform: `translate(-50%,-16px) scale(1.05) rotate(${rot}deg)`, opacity: 1, offset: 0.55 }, { transform: `translate(-50%,-50px) scale(.9) rotate(${rot}deg)`, opacity: 0 }], { duration: 1150 * ctx.k, delay: (o.atraso || 0) * ctx.k, easing: 'ease-out', fill: 'forwards' }); limpa(e, 1500 + (o.atraso || 0));
}
function fantasma(ctx, unEl, cor, sombra = false) { const img = unEl.querySelector('img'); if (!img) return; const b = caixa(ctx, img); const g = novo(ctx, `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:47;opacity:.6;transform:translate(-50%,-50%);filter:${sombra ? `brightness(0) drop-shadow(0 0 5px ${cor}) drop-shadow(0 0 2px ${cor})` : `brightness(.3) sepia(1) saturate(4) drop-shadow(0 0 8px ${cor})`}`); const c = img.cloneNode(); c.style.cssText = `width:100%;height:100%;object-fit:contain;transform:${img.style.transform || 'none'};transform-origin:50% 100%`; g.append(c); g.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 380 * ctx.k, fill: 'forwards' }); limpa(g, 560); }
function escurecer(ctx, cor = 'rgba(6,3,14,.62)', ms = 1400) { injetar(); const e = novo(ctx, `background:radial-gradient(ellipse at 50% 60%, transparent 0, ${cor} 70%);opacity:0`); e.className = 'fx-veu'; e.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms * ctx.k, fill: 'forwards' }); limpa(e, ms * ctx.k + 100); }
// Cut-in de ultimate: faixa diagonal com a arte do Onírico e o nome da habilidade
async function cutIn(ctx, A, hab, c1, c2) {
  injetar(); const img = A.querySelector('.un-fig img'); const ini = A.classList.contains('i');
  const box = document.createElement('div'); box.className = `fx-cutin${ini ? ' ini' : ''}`; box.style.cssText = `--c1:${c1};--c2:${c2}`;
  const sx = /scale\((-?[\d.]+)/.exec(img?.style.transform || '')?.[1]; const vira = (Number(sx ?? 1) < 0 ? -1 : 1);
  box.innerHTML = `<div class="ci-faixa">${Array.from({ length: Math.round(16 * ctx.dens + 4) }, () => `<i class="ci-l" style="top:${R(2, 98).toFixed(1)}%;width:${R(20, 60).toFixed(0)}%;--d:${R(0.25, 0.6).toFixed(2)}s;animation-delay:-${R(0, 0.6).toFixed(2)}s;opacity:${R(0.3, 1).toFixed(2)}"></i>`).join('')}${img ? `<img class="ci-img" src="${img.src}" alt="" style="transform:skewY(${ini ? -7 : 7}deg) scaleX(${vira})">` : ''}<b class="ci-nome"><small>${ini ? 'INIMIGO' : 'ULTIMATE'}</small>${hab.nome}</b></div>`;
  ctx.arena.append(box); const f = box.querySelector('.ci-faixa'), im = box.querySelector('.ci-img'), nm = box.querySelector('.ci-nome'), sk = ini ? 7 : -7, s = ini ? 1 : -1;
  f.animate([{ transform: `skewY(${sk}deg) scaleY(0)` }, { transform: `skewY(${sk}deg) scaleY(1.08)`, offset: 0.6 }, { transform: `skewY(${sk}deg) scaleY(1)` }], { duration: 170 * ctx.k, fill: 'forwards', easing: 'ease-out' });
  im?.animate([{ translate: `${s * 40}% 0`, opacity: 0 }, { translate: '0 0', opacity: 1, offset: 0.25 }, { translate: `${-s * 6}% 0`, opacity: 1 }], { duration: 760 * ctx.k, fill: 'forwards', easing: 'cubic-bezier(.2,.9,.3,1)' });
  nm.animate([{ translate: `${-s * 30}% 0`, opacity: 0, letterSpacing: '.5em' }, { translate: '0 0', opacity: 1, letterSpacing: '.02em', offset: 0.3 }, { translate: `${s * 3}% 0`, opacity: 1, letterSpacing: '.02em' }], { duration: 760 * ctx.k, fill: 'forwards', easing: 'cubic-bezier(.2,.9,.3,1)' });
  flash(ctx, c2, 120, 0.35);
  await ESP(640 * ctx.k);
  await anim(f, [{ transform: `skewY(${sk}deg) scaleY(1)`, opacity: 1 }, { transform: `skewY(${sk}deg) scaleY(0) translateX(${s * 8}%)`, opacity: 0.4 }], { duration: 150 * ctx.k, easing: 'ease-in' });
  box.remove();
}
function combo(ctx, el, n) {
  injetar(); const b = corpo(ctx, el); let e = ctx.campo.querySelector('.fx-combo');
  if (!e) { e = novo(ctx, `right:6%;top:22%`); e.className = 'fx-combo'; }
  e.innerHTML = `${n}<small>HITS</small>`; e.animate([{ transform: 'scale(1.6)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: 160, fill: 'forwards' });
  clearTimeout(e._t); e._t = setTimeout(() => { e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); limpa(e, 320); }, 900); void b;
}
// Investida corpo a corpo: avança com imagens residuais até `frac` do caminho; devolve a função de volta
async function investida(ctx, A, T, { cor = '#fff', frac = 0.84, ms = 280, salto = 0, rastro = true } = {}) {
  const a = corpo(ctx, A), t = corpo(ctx, T), dir = t.x > a.x ? 1 : -1, dx = (t.x - a.x) * frac - dir * t.w * 0.18, dy = (t.pe - a.pe) * frac;
  await anim(fig(A), [{ transform: 'translate(0,0) scaleY(1)' }, { transform: `translate(${-dir * 9}px,7px) scaleY(.88)` }], { duration: 190 * ctx.k, easing: 'ease-out' });
  fig(A).animate([{ transform: `translate(${-dir * 9}px,7px) scaleY(.88)` }, { transform: 'translate(0,0) scaleY(1)' }], { duration: 120 * ctx.k, fill: 'forwards' });
  const tr = rastro ? setInterval(() => fantasma(ctx, A, cor), 55 * ctx.k) : 0;
  const kf = salto ? [{ transform: 'translate(0,0)' }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - salto}px) scale(1.06)`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(1.08)` }] : [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(1.08)` }];
  await anim(A, kf, { duration: ms * ctx.k, easing: salto ? 'cubic-bezier(.3,.1,.7,1)' : 'cubic-bezier(.65,0,.9,.45)' }); clearInterval(tr);
  golpePose(ctx, A, 520); // chegou: pose de ataque durante o golpe
  return async () => { await anim(A, [{ transform: `translate(${dx}px,${dy}px) scale(1.08)` }, { transform: 'translate(0,0) scale(1)' }], { duration: 280 * ctx.k, easing: 'ease-out' }); A.getAnimations().forEach((x) => x.cancel()); };
}
// Postura de preparo (abaixa, energia converge, luz no chão)
async function preparo(ctx, M, A, cor, { circ = false, ms = 380, raio } = {}) {
  const a = corpo(ctx, A); luz(M, a.x, a.pe, { cor, raio: raio || a.w * 0.9, vida: ms / 1000 + 0.5, forca: 0.7 });
  if (circ) circulo(M, a.x, a.pe, { cor, raio: a.w * 0.75, vida: ms / 1000 + 0.6 });
  convergir(M, a.x, a.y, { cor, raio: a.w * 0.9, vida: ms / 1000, n: 16 });
  fig(A).animate([{ filter: 'none', transform: 'scale(1)' }, { filter: `brightness(1.5) drop-shadow(0 0 12px ${cor})`, transform: 'scale(1.03)', offset: 0.8 }, { filter: 'none', transform: 'scale(1)' }], { duration: (ms + 120) * ctx.k });
  await ESP(ms * ctx.k);
  if (ctx.poseAtaque) golpePose(ctx, A, 560); // lançamento: pose de ataque enquanto o efeito sai
}

// ---------- status ----------
function statusFx(ctx, M, el, id, i = 0) {
  const d = EFEITOS[id]; if (!d) return; const c = corpo(ctx, el), at = i * 0.12;
  numero(ctx, el, `${d.icone.slice(0, 2)} ${d.nome}`, d.cor, { pequeno: true, dy: -18 - i * 14, atraso: i * 120 });
  if (id === 'queimadura') { for (let k = 0; k < M.n(14); k++) particula(M, { x: c.x + R(-c.w * 0.3, c.w * 0.3), y: c.pe - R(0, c.h * 0.4), vx: R(-20, 20), vy: R(-160, -60), atrito: 1, forma: 'brasa', cor: '#f97316', cor2: '#fde047', tam: R(5, 10), tamFim: 1, vida: R(0.5, 0.9), atraso: at + R(0, 0.3) }); }
  else if (id === 'veneno') { for (let k = 0; k < M.n(10); k++) particula(M, { x: c.x + R(-c.w * 0.3, c.w * 0.3), y: c.pe - R(0, c.h * 0.5), vx: R(-15, 15), vy: R(-70, -30), forma: 'bolha', cor: '#a3e635', tam: R(3, 7), tamFim: 8, vida: R(0.6, 1), atraso: at + R(0, 0.3) }); rajada(M, c.x, c.y, { n: 5, forma: 'fumaca', cor: '#4d7c0f', tam: 18, v: 50, vida: 0.9, atraso: at }); }
  else if (id === 'sangramento') { corte(M, c.x, c.y, { raio: c.w * 0.32, cor: '#dc2626', esp: 7, ang: R(-1, 1), vida: 0.3, atraso: at }); rajada(M, c.x, c.y, { n: 9, forma: 'gota', cor: '#b91c1c', tam: 3.5, v: 160, grav: 600, achata: 1, sobe: 80, vida: 0.7, atraso: at + 0.05, atrito: 0.4 }); }
  else if (id === 'congelamento') { for (let k = 0; k < M.n(10); k++) { const a = R(0, TAU), dd = R(c.w * 0.5, c.w * 0.8); particula(M, { x: c.x + Math.cos(a) * dd, y: c.y + Math.sin(a) * dd * 0.8, vx: -Math.cos(a) * dd * 2.2, vy: -Math.sin(a) * dd * 1.7, forma: 'caco', cor: '#7dd3fc', cor2: '#f0f9ff', tam: R(6, 11), vida: 0.55, atraso: at, atrito: 2 }); } onda(M, c.x, c.pe, { cor: '#bae6fd', r1: c.w * 0.8, vida: 0.6, atraso: at + 0.35 }); fig(el).animate([{ filter: 'none' }, { filter: 'brightness(1.6) saturate(.3) hue-rotate(160deg)' }, { filter: 'none' }], { duration: 900 * ctx.k, delay: 300 * ctx.k }); }
  else if (id === 'atordoamento' || id === 'sono') { orbitar(M, c.x, c.topo + 6, id === 'sono' ? '#a5b4fc' : '#fde047', c.w * 0.32, at); }
  else if (id === 'silencio') { selo(M, c.x, c.y - c.h * 0.15, '#94a3b8', c.w * 0.3, at); }
  else if (id === 'ataque_baixo' || id === 'defesa_baixa') { for (let k = 0; k < M.n(8); k++) particula(M, { x: c.x + R(-c.w * 0.35, c.w * 0.35), y: c.topo + R(0, c.h * 0.3), vy: R(90, 160), vx: 0, atrito: 0.5, forma: 'faisca', cor: d.cor, tam: 5, compr: 26, vida: 0.6, atraso: at + R(0, 0.25) }); }
  else if (id === 'ataque_alto' || id === 'defesa_alta' || id === 'veloz') { for (let k = 0; k < M.n(12); k++) particula(M, { x: c.x + R(-c.w * 0.4, c.w * 0.4), y: c.pe - R(0, c.h * 0.3), vx: id === 'veloz' ? R(-260, -160) : 0, vy: id === 'veloz' ? R(-10, 10) : R(-260, -140), atrito: 0.8, forma: 'faisca', cor: d.cor, tam: 5, compr: 34, vida: 0.6, atraso: at + R(0, 0.3) }); onda(M, c.x, c.pe, { cor: d.cor, r1: c.w * 0.7, vida: 0.5, atraso: at }); }
  else if (id === 'regeneracao') { for (let k = 0; k < M.n(10); k++) particula(M, { x: c.x + R(-c.w * 0.35, c.w * 0.35), y: c.pe - R(0, c.h * 0.3), vx: R(-10, 10), vy: R(-90, -40), forma: k % 3 ? 'brilho' : 'folha', cor: '#4ade80', cor2: '#d9f99d', tam: R(4, 7), vida: R(0.8, 1.2), atraso: at + R(0, 0.4), atrito: 0.6 }); }
  else if (id === 'escudo') bolhaEscudo(M, c, '#38bdf8', at);
  else if (id === 'provocacao') { for (let k = 0; k < 3; k++) onda(M, c.x, c.pe, { cor: '#f97316', r1: c.w * 0.9, esp: 4, vida: 0.6, atraso: at + k * 0.16 }); mira(M, c.x, c.y, '#fb923c', c.w * 0.35, at); }
  else if (id === 'invencivel') redoma(M, c, at);
  else if (id === 'panico') { rajada(M, c.x, c.y, { n: 10, forma: 'fumaca', cor: '#450a0a', tam: 26, v: 80, vida: 1, atraso: at, blend: 'source-over' }); onda(M, c.x, c.pe, { cor: '#ef4444', r1: c.w * 1.2, esp: 7, vida: 0.7, atraso: at }); }
}
function orbitar(M, x, y, cor, raio, atraso) { livre(M, { vida: 1.1, atraso, draw(g, u) { const a = u < 0.15 ? u / 0.15 : 1 - Math.max(0, u - 0.7) / 0.3; g.globalAlpha = a; for (let i = 0; i < 3; i++) { const an = u * TAU * 1.6 + (i * TAU) / 3, px = x + Math.cos(an) * raio, py = y + Math.sin(an) * raio * 0.35; g.save(); g.translate(px, py); g.rotate(u * 8); g.fillStyle = cor; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.6 : 7, q = (k * TAU) / 10; g.lineTo(Math.cos(q) * r, Math.sin(q) * r); } g.closePath(); g.fill(); g.restore(); } } }); }
function selo(M, x, y, cor, raio, atraso) { livre(M, { vida: 0.9, atraso, blend: 'source-over', draw(g, u) { const a = u < 0.2 ? u / 0.2 : 1 - Math.max(0, u - 0.6) / 0.4, s = raio * (1.4 - 0.4 * Math.min(1, u / 0.2)); g.globalAlpha = a; g.strokeStyle = cor; g.lineWidth = 4; g.beginPath(); g.arc(x, y, s, 0, TAU); g.moveTo(x - s * 0.7, y - s * 0.7); g.lineTo(x + s * 0.7, y + s * 0.7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); } }); }
function mira(M, x, y, cor, raio, atraso) { livre(M, { vida: 0.8, atraso, draw(g, u) { const a = 1 - u, s = raio * (1.8 - 0.8 * Math.min(1, u / 0.25)); g.globalAlpha = a; g.strokeStyle = cor; g.lineWidth = 3; g.translate(x, y); g.rotate(u * 2); g.beginPath(); g.arc(0, 0, s, 0, TAU); g.stroke(); for (let i = 0; i < 4; i++) { g.rotate(TAU / 4); g.beginPath(); g.moveTo(s * 0.6, 0); g.lineTo(s * 1.3, 0); g.stroke(); } } }); }
// Bolha de escudo hexagonal
function bolhaEscudo(M, c, cor, atraso = 0, vida = 1) {
  livre(M, { vida, atraso, draw(g, u) {
    const ap = Math.min(1, u / 0.25), a = u < 0.7 ? ap : 1 - (u - 0.7) / 0.3, rx = c.w * 0.62 * (0.7 + 0.3 * ap), ry = c.h * 0.6 * (0.7 + 0.3 * ap);
    g.translate(c.x, c.y); g.globalAlpha = a * 0.3; const gr = g.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, cor); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.clip(); g.globalAlpha = a * 0.55; g.strokeStyle = cor; g.lineWidth = 1.2; const hs = 14;
    for (let yy = -ry; yy < ry; yy += hs * 0.87) for (let xx = -rx + ((Math.round(yy / (hs * 0.87)) & 1) * hs * 0.75); xx < rx; xx += hs * 1.5) { g.beginPath(); for (let k = 0; k <= 6; k++) { const q = (k * TAU) / 6; g.lineTo(xx + Math.cos(q) * hs * 0.5, yy + Math.sin(q) * hs * 0.5); } g.stroke(); }
    g.restore(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, -2.6 + u * 4, -1.4 + u * 4); g.stroke(); g.strokeStyle = cor; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke();
  } });
}
// Redoma dourada de invencibilidade com runas girando
function redoma(M, c, atraso = 0, vida = 1.3) {
  livre(M, { vida, atraso, draw(g, u) {
    const ap = Math.min(1, u / 0.22), a = u < 0.72 ? ap : 1 - (u - 0.72) / 0.28, rx = c.w * 0.68, ry = c.h * 0.66 * ap;
    g.translate(c.x, c.pe); g.globalAlpha = a * 0.35; const gr = g.createRadialGradient(0, -ry * 0.5, 0, 0, -ry * 0.5, rx); gr.addColorStop(0, 'rgba(255,251,235,.1)'); gr.addColorStop(1, '#fbbf24'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI, TAU); g.fill();
    g.globalAlpha = a; g.strokeStyle = '#fde68a'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 0, rx, rx * 0.3, 0, 0, TAU); g.stroke();
    g.fillStyle = '#fff'; for (let i = 0; i < 12; i++) { const q = u * 2.4 + (i * TAU) / 12; if (Math.sin(q) < 0) continue; g.save(); g.translate(Math.cos(q) * rx, -Math.sin(q) * ry * 0.55); g.rotate(q); g.fillRect(-2, -5, 4, 10); g.fillRect(-5, -2, 10, 4); g.restore(); }
    for (const k of [0.35, 0.65]) { g.globalAlpha = a * 0.6; g.beginPath(); g.ellipse(0, -ry * k, rx * Math.sqrt(1 - k * k), rx * 0.3 * Math.sqrt(1 - k * k), 0, 0, TAU); g.stroke(); }
  } });
}
function morteFx(ctx, M, c, cor) { rajada(M, c.x, c.y, { n: 22, forma: 'brilho', cor: cor || '#e9d5ff', tam: 6, v: 220, sobe: 120, vida: 0.9 }); rajada(M, c.x, c.pe, { n: 8, forma: 'fumaca', cor: '#1f1530', tam: 30, v: 70, sobe: 40, vida: 1.1, blend: 'source-over' }); onda(M, c.x, c.pe, { cor: cor || '#fff', r1: c.w * 1.3, esp: 5, vida: 0.6 }); }
function purificarFx(ctx, M, el) { const c = corpo(ctx, el); rajada(M, c.x, c.y, { n: 14, forma: 'estrela', cor: '#e0f2fe', tam: 9, v: 140, sobe: 60, vida: 0.9 }); coluna(M, c.x, c.pe, { cor: '#e0f2fe', larg: c.w * 0.4, alt: c.h * 1.4, vida: 0.8 }); numero(ctx, el, '✨ Purificado', '#e0f2fe', { pequeno: true, dy: -34 }); }

// Aplica o resultado de um alvo: reação, número, vida, absorção/imunidade, efeitos e derrota
function aplicar(ctx, M, el, r, o = {}) {
  const c = corpo(ctx, el), dir = o.dir ?? 1;
  if (o.cura) {
    const cc = o.corCura || ctx.corCura || '#4ade80';
    if (r.valor || r.revivido) brilhoCura(ctx, M, el, cc);
    if (r.valor) numero(ctx, el, `+${r.valor}`, cc, { grande: o.forte });
    if (r.revivido) numero(ctx, el, 'DE VOLTA!', '#fde68a', { grande: true, dy: -26 });
  } else if (r.valor === 0 && r.absorvido > 0) {
    const inv = el.dataset.aura === 'invencivel';
    if (inv) { redoma(M, c, 0, 0.6); numero(ctx, el, 'IMUNE', '#fde68a', { grande: true }); } else { bolhaEscudo(M, c, '#38bdf8', 0, 0.5); numero(ctx, el, `🔰 ${r.absorvido}`, '#7dd3fc'); }
    fig(el).animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dir * 5}px)` }, { transform: 'translateX(0)' }], { duration: 200 * ctx.k });
  } else {
    reacao(ctx, el, dir, o.forca ?? 1, o.cor);
    numero(ctx, el, `${r.valor}`, o.forte ? '#fff7d6' : (o.corNum || '#ffffff'), { grande: o.forte, dx: o.dx || 0 });
    if (r.absorvido) numero(ctx, el, `🔰 ${r.absorvido}`, '#7dd3fc', { pequeno: true, dy: -22, atraso: 120 });
  }
  if (ctx.som && !ctx._somT) { tocar(o.cura ? 'cura' : 'golpe', o.forte ? 3 : 1); ctx._somT = setTimeout(() => { ctx._somT = 0; }, 70); }
  ctx.aplicarHp(r.id);
  if (r.morreu) morteFx(ctx, M, c, o.cor);
  (r.efeitos || []).forEach((id, i) => statusFx(ctx, M, el, id, i));
  if (r.limpos?.length) purificarFx(ctx, M, el);
}
const alvosDe = (ctx, ev) => (ev.alvos || []).map((r) => ({ r, el: ctx.no(r.id) })).filter((x) => x.el);

// ---------- impactos por elemento ----------
const EXPLOSAO_RECORTE = new Set(['fogo', 'trevas', 'luz', 'eletrico', 'fantasma', 'inseto', 'neutro', 'agua']);
function impacto(ctx, M, x, y, elem, { forte = false, dir = 1, pe } = {}) {
  const E = ELEM[elem] || ELEM.neutro, s = forte ? 1.45 : 1, chao = pe ?? y + 30;
  if (EXPLOSAO_RECORTE.has(elem)) recorte(M, 'explosao', x, y, { cor: E.cor, tam: 150 * s, vida: 0.7, ini: 2, fadeOut: 0.35 });
  luz(M, x, y, { cor: E.cor, raio: 70 * s, vida: 0.45, chao: false, forca: 0.9, nucleo: '#fff' });
  if (elem === 'fogo') { rajada(M, x, y, { n: 22 * s, forma: 'brasa', cor: '#f97316', cor2: '#fde047', tam: 7, v: 300 * s, grav: 120, vida: 0.75 }); rajada(M, x, y, { n: 7, forma: 'fumaca', cor: '#3f1d0b', tam: 26 * s, tamFim: 50, v: 60, sobe: 50, vida: 1.1 }); onda(M, x, chao, { cor: E.cor, r1: 120 * s, vida: 0.5 }); }
  else if (elem === 'agua') { rajada(M, x, y, { n: 18 * s, forma: 'gota', cor: '#38bdf8', tam: 4, v: 280 * s, grav: 700, sobe: 140, achata: 1, vida: 0.8, atrito: 0.3 }); onda(M, x, chao, { cor: E.cor, r1: 130 * s, vida: 0.6 }); onda(M, x, chao, { cor: '#e0f2fe', r1: 80 * s, vida: 0.45, esp: 3, atraso: 0.08 }); rajada(M, x, y, { n: 8, forma: 'bolha', cor: '#bae6fd', tam: 5, v: 90, sobe: 40, vida: 0.9 }); }
  else if (elem === 'planta') { rajada(M, x, y, { n: 16 * s, forma: 'folha', cor: '#22c55e', cor2: '#bef264', tam: 7, v: 240 * s, grav: 90, vida: 0.9, vrot: 10 }); rajada(M, x, y, { n: 10, forma: 'brilho', cor: E.cor, tam: 5, v: 160, vida: 0.6 }); onda(M, x, chao, { cor: E.cor, r1: 110 * s, vida: 0.5 }); }
  else if (elem === 'terra' || elem === 'pedra') { rachadura(M, x, chao, { cor: elem === 'terra' ? '#f59e0b' : '#e2e8f0', raio: 80 * s }); rajada(M, x, y, { n: 14 * s, forma: 'caco', cor: E.cor, cor2: E.cor2, tam: 9, v: 320 * s, grav: 900, sobe: 160, achata: 1, vida: 0.9, atrito: 0.4, blend: 'source-over' }); rajada(M, x, chao, { n: 8, forma: 'fumaca', cor: '#a8906e', tam: 24, tamFim: 46, v: 90, vida: 1 }); }
  else if (elem === 'eletrico') { for (let i = 0; i < 4; i++) { const a = R(0, TAU), d = R(40, 80) * s; relampago(M, x, y, x + Math.cos(a) * d, y + Math.sin(a) * d, { cor: E.cor, vida: 0.3, amp: 14, ramos: 1, atraso: i * 0.03 }); } rajada(M, x, y, { n: 16, forma: 'faisca', cor: E.cor, tam: 4, v: 420, vida: 0.4 }); flash(ctx, '#fef9c3', 110, 0.25); }
  else if (elem === 'luz') { raiosLuz(M, x, y, { cor: E.cor, raio: 140 * s, vida: 0.6, n: 9 }); rajada(M, x, y, { n: 12, forma: 'estrela', cor: E.cor, tam: 8, v: 220 * s, vida: 0.7 }); onda(M, x, chao, { cor: E.cor, r1: 120 * s, vida: 0.5 }); }
  else if (elem === 'trevas') { rajada(M, x, y, { n: 10, forma: 'fumaca', cor: '#1e0b36', tam: 26 * s, tamFim: 46, v: 110, vida: 1, blend: 'source-over' }); rajada(M, x, y, { n: 18 * s, forma: 'faisca', cor: E.cor, tam: 4, v: 340 * s, vida: 0.5 }); onda(M, x, chao, { cor: E.cor, r1: 110 * s, vida: 0.55 }); }
  else if (elem === 'fantasma') { rajada(M, x, y, { n: 16 * s, forma: 'brilho', cor: E.cor, tam: 7, v: 140, sobe: 120, vida: 1, onda: 2, ondaAmp: 2 }); rajada(M, x, y, { n: 6, forma: 'fumaca', cor: '#c7d2fe', tam: 24, tamFim: 44, v: 60, sobe: 40, vida: 1 }); onda(M, x, chao, { cor: E.cor, r1: 100 * s, vida: 0.55 }); }
  else if (elem === 'voador') { corte(M, x, y, { raio: 50 * s, cor: '#e0f2fe', esp: 6, ang: -0.3, vida: 0.3 }); corte(M, x, y, { raio: 60 * s, cor: '#bae6fd', esp: 5, ang: 2.6, sentido: -1, vida: 0.3, atraso: 0.05 }); onda(M, x, chao, { cor: '#fff', r1: 120 * s, vida: 0.5, esp: 3 }); rajada(M, x, y, { n: 10, forma: 'pena', cor: '#f8fafc', cor2: '#cbd5e1', tam: 6, v: 180, grav: 80, vida: 0.9 }); }
  else if (elem === 'inseto') { rajada(M, x, y, { n: 24 * s, forma: 'brilho', cor: E.cor, tam: 3.5, v: 260, vida: 0.7, onda: 4, ondaAmp: 3 }); onda(M, x, chao, { cor: E.cor, r1: 100 * s, vida: 0.5 }); }
  else if (elem === 'aco') { corte(M, x, y, { raio: 46 * s, cor: '#e2e8f0', esp: 8, ang: -0.8, vida: 0.26 }); corte(M, x, y, { raio: 46 * s, cor: '#e2e8f0', esp: 8, ang: 0.8 + Math.PI, sentido: -1, vida: 0.26, atraso: 0.06 }); rajada(M, x, y, { n: 22 * s, forma: 'faisca', cor: '#fff', tam: 3, v: 480, grav: 400, vida: 0.45 }); }
  else { rajada(M, x, y, { n: 16 * s, forma: 'faisca', cor: E.cor, tam: 4, v: 330 * s, vida: 0.45 }); onda(M, x, chao, { cor: E.cor, r1: 100 * s, vida: 0.45 }); }
  if (forte) { linhasFoco(M, x, y, { vida: 0.4, alfa: 0.45 }); camera(ctx, { x, y }, { zoom: 1.06, tremor: 8, ms: 460 }); } else camera(ctx, { x, y }, { zoom: 1.02, tremor: 3, ms: 320 });
  void dir;
}

// ---------- coreografias genéricas (kits por arquétipo) ----------
async function genCorpo(ctx, M, A, ev, hab, elem) {
  const E = ELEM[elem] || ELEM.neutro, alvos = alvosDe(ctx, ev); if (!alvos.length) return; const T = alvos[0].el, dir = corpo(ctx, T).x > corpo(ctx, A).x ? 1 : -1, forte = (hab?.mult || 1) >= 1.8;
  luz(M, corpo(ctx, A).x, corpo(ctx, A).pe, { cor: E.cor, raio: 70, vida: 0.6 });
  const volta = await investida(ctx, A, T, { cor: E.cor });
  const t = corpo(ctx, T); corte(M, t.x, t.y, { raio: t.w * 0.42, cor: E.cor, ang: dir > 0 ? -0.7 : Math.PI + 0.7, sentido: dir, esp: forte ? 18 : 13 });
  if (!ctx.rapido) await ESP(60);
  impacto(ctx, M, t.x, t.y, elem, { forte, dir, pe: t.pe });
  for (const x of alvos) aplicar(ctx, M, x.el, x.r, { dir, forte, cor: E.cor });
  await ESP(200 * ctx.k); await volta();
}
async function genTiro(ctx, M, A, ev, hab, elem) {
  const E = ELEM[elem] || ELEM.neutro, alvos = alvosDe(ctx, ev); if (!alvos.length) return; const a = corpo(ctx, A), t = corpo(ctx, alvos[0].el), dir = t.x > a.x ? 1 : -1, b = a.boca(dir), forte = (hab?.mult || 1) >= 1.8;
  await preparo(ctx, M, A, E.cor, { ms: forte ? 420 : 300, circ: forte });
  if (elem === 'eletrico') { relampago(M, b.x, b.y, t.x, t.y, { cor: E.cor, vida: 0.4, ramos: 3, amp: 34 }); await ESP(90 * ctx.k); }
  else if (elem === 'luz') { feixe(M, b.x, b.y, t.x, t.y, { cor: E.cor, larg: forte ? 22 : 14, vida: 0.5 }); await ESP(120 * ctx.k); }
  else { const tipo = { fogo: 'cometa', planta: 'folhas', pedra: 'rocha', terra: 'rocha', fantasma: 'fantasma', voador: 'flecha', aco: 'flecha' }[elem] || 'orbe'; await projetil(M, b.x, b.y, t.x, t.y, { tipo, cor: E.cor, cor2: E.cor2, tam: forte ? 20 : 14, arco: tipo === 'rocha' ? 70 : 26, vida: 0.4, onda: elem === 'agua' || elem === 'fantasma' ? 2 : 0 }); }
  impacto(ctx, M, t.x, t.y, elem, { forte, dir, pe: t.pe }); if (forte) quadroImpacto(ctx, false);
  for (const x of alvos) aplicar(ctx, M, x.el, x.r, { dir, forte, cor: E.cor });
  await ESP(380 * ctx.k);
}
async function genArea(ctx, M, A, ev, hab, elem) {
  if (elem === 'terra' || elem === 'pedra') return terremoto(ctx, M, A, ev, hab, elem);
  if (elem === 'agua') return maremoto(ctx, M, A, ev, hab);
  if (elem === 'fogo') return meteoros(ctx, M, A, ev, hab);
  if (elem === 'planta') return raizesArea(ctx, M, A, ev, hab);
  const E = ELEM[elem] || ELEM.neutro, alvos = alvosDe(ctx, ev); if (!alvos.length) return; const a = corpo(ctx, A), cs = alvos.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1;
  const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cy = cs.reduce((s, c) => s + c.pe, 0) / cs.length;
  await preparo(ctx, M, A, E.cor, { ms: 360, circ: true });
  circulo(M, cx, cy, { cor: E.cor, raio: Math.max(120, Math.abs(cs[0].x - cs[cs.length - 1].x) * 0.7), vida: 1.2, giro: 3 });
  await ESP(260 * ctx.k);
  for (let i = 0; i < cs.length; i++) { const c = cs[i]; setTimeout(() => {
    recorte(M, 'erupcao', c.x, c.pe, { cor: E.cor, tam: c.w * 2.1, vida: 1.0, fadeIn: 0.08, fadeOut: 0.4 });
    if (elem === 'eletrico') relampago(M, c.x + R(-20, 20), -10, c.x, c.y, { cor: E.cor, vida: 0.35, ramos: 2, amp: 40 });
    else if (elem === 'luz') coluna(M, c.x, c.pe, { cor: E.cor, larg: c.w * 0.4, alt: c.h * 2, vida: 0.6 });
    else if (elem === 'planta' || elem === 'terra' || elem === 'pedra') espinhos(M, c, E.cor, E.cor2);
    else feixe(M, c.x + R(-30, 30), -20, c.x, c.y, { cor: E.cor, larg: 12, vida: 0.32 });
    setTimeout(() => { impacto(ctx, M, c.x, c.y, elem, { dir, pe: c.pe }); aplicar(ctx, M, alvos[i].el, alvos[i].r, { dir, cor: E.cor }); }, 120 * ctx.k);
  }, i * 110 * ctx.k); }
  await ESP((360 + cs.length * 110) * ctx.k);
}
async function genApoio(ctx, M, A, ev, hab, elem) {
  const cura = hab?.tipo === 'cura', E = cura ? { cor: corCura(elem), cor2: '#ffffff' } : ELEM[elem] || ELEM.luz, alvos = alvosDe(ctx, ev);
  await preparo(ctx, M, A, E.cor, { ms: 300, circ: true });
  for (const { el } of alvos) { const c = corpo(ctx, el); circulo(M, c.x, c.pe, { cor: E.cor, raio: c.w * 0.6, vida: 1 }); for (let k = 0; k < M.n(14); k++) particula(M, { x: c.x + R(-c.w * 0.35, c.w * 0.35), y: c.pe - R(0, 10), vx: 0, vy: R(-160, -70), atrito: 0.6, forma: cura ? (k % 3 ? 'brilho' : 'folha') : 'faisca', cor: E.cor, cor2: E.cor2, tam: R(4, 7), compr: 30, vida: R(0.7, 1.1), atraso: R(0, 0.35) }); }
  await ESP(420 * ctx.k);
  alvos.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); onda(M, c.x, c.pe, { cor: E.cor, r1: c.w, vida: 0.55 }); aplicar(ctx, M, el, r, { cura: true }); }, i * 90 * ctx.k));
  await ESP((480 + alvos.length * 90) * ctx.k);
}
// Espinhos/raízes que irrompem do chão sob o alvo
function espinhos(M, c, cor, cor2, n = 6, atraso = 0, base = '#14532d') {
  const sp = Array.from({ length: n }, (_, i) => ({ dx: (i - (n - 1) / 2) * c.w * 0.14 + R(-6, 6), h: c.h * R(0.45, 0.85), ang: (i - (n - 1) / 2) * 0.16 + R(-0.1, 0.1), w: R(7, 12) }));
  livre(M, { vida: 0.8, atraso, blend: 'source-over', draw(g, u) {
    const cresce = Math.min(1, u / 0.18), some = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
    for (const s of sp) { g.save(); g.translate(c.x + s.dx, c.pe); g.rotate(s.ang); g.scale(1, cresce * (0.85 + 0.15 * some)); g.globalAlpha = some; const gr = g.createLinearGradient(0, 0, 0, -s.h); gr.addColorStop(0, base); gr.addColorStop(0.6, cor); gr.addColorStop(1, cor2); g.fillStyle = gr; g.beginPath(); g.moveTo(-s.w, 0); g.quadraticCurveTo(-s.w * 0.3, -s.h * 0.5, 0, -s.h); g.quadraticCurveTo(s.w * 0.3, -s.h * 0.5, s.w, 0); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.stroke(); g.restore(); }
  } });
}

// ---------- tremor, cura por elemento e peças especiais ----------
// Tremor forte da tela (terremotos, maremotos, meteoros, quedas pesadas)
function tremer(ctx, forca = 10, ms = 700) {
  const n = Math.max(6, Math.round(ms / 34)), kf = [];
  for (let i = 0; i <= n; i++) { const q = 1 - i / n, f = forca * Math.pow(q, 1.2); kf.push({ transform: `scale(${1 + 0.035 * q}) translate(${R(-f, f)}px, ${R(-f, f) * 0.8}px)` }); }
  kf[n] = { transform: 'none' }; ctx.campo.style.transformOrigin = '50% 60%';
  ctx.campo.animate(kf, { duration: ms * ctx.k, easing: 'linear' });
}
const corCura = (elem) => ({ luz: '#fde047', fogo: '#fbbf24', eletrico: '#fde047', planta: '#4ade80', inseto: '#a3e635', terra: '#86efac', pedra: '#86efac', trevas: '#c084fc', fantasma: '#c084fc', agua: '#5eead4' })[elem] || '#4ade80';
// O alvo curado brilha na cor do elemento (amarelo, verde, roxo…), com cruzes e partículas subindo
function brilhoCura(ctx, M, el, cor) {
  const c = corpo(ctx, el);
  fig(el).animate([{ filter: 'none' }, { filter: `brightness(1.75) drop-shadow(0 0 8px ${cor}) drop-shadow(0 0 20px ${cor})`, offset: 0.22 }, { filter: `brightness(1.3) drop-shadow(0 0 6px ${cor})`, offset: 0.6 }, { filter: 'none' }], { duration: 1150 * ctx.k });
  luz(M, c.x, c.pe, { cor, raio: c.w * 0.9, vida: 1, forca: 0.9 });
  luz(M, c.x, c.y, { cor, raio: c.w * 0.7, vida: 0.7, chao: false, forca: 0.5 });
  for (let k = 0; k < M.n(16); k++) particula(M, { x: c.x + R(-c.w * 0.42, c.w * 0.42), y: c.pe - R(0, c.h * 0.55), vx: R(-12, 12), vy: R(-140, -60), atrito: 0.7, forma: k % 4 === 0 ? 'cruz' : 'brilho', cor, tam: k % 4 === 0 ? R(5, 8) : R(3, 6), vida: R(0.8, 1.3), atraso: R(0, 0.35) });
  onda(M, c.x, c.pe, { cor, r1: c.w * 1.1, esp: 4, vida: 0.6 });
}
// Carantonha: rosto de abóbora gigante que se acende
function carantonha(M, x, y, tam, atraso = 0, vida = 0.9) {
  livre(M, { vida, atraso, draw(g, u) {
    const ap = Math.min(1, u / 0.15), a = (u < 0.6 ? ap : 1 - (u - 0.6) / 0.4) * (0.82 + 0.18 * Math.random()), s = tam * (0.7 + 0.3 * ap + 0.12 * u);
    g.globalAlpha = a * 0.55; g.drawImage(brilhoCor('#f97316'), x - s * 1.5, y - s * 1.2, s * 3, s * 2.4); g.globalAlpha = a; g.fillStyle = '#fde047';
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x + k * s * 0.12, y - s * 0.1); g.lineTo(x + k * s * 0.58, y - s * 0.02); g.lineTo(x + k * s * 0.4, y - s * 0.5); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - s * 0.09, y + s * 0.14); g.lineTo(x + s * 0.09, y + s * 0.14); g.fill();
    g.beginPath(); g.moveTo(x - s * 0.66, y + s * 0.2); for (let k = 0; k <= 8; k++) g.lineTo(x - s * 0.66 + (k * s * 1.32) / 8, y + s * (k % 2 ? 0.3 : 0.44)); g.lineTo(x + s * 0.66, y + s * 0.2); g.quadraticCurveTo(x, y + s * 0.9, x - s * 0.66, y + s * 0.2); g.fill();
    g.fillStyle = '#fff7ed'; g.globalAlpha = a * 0.7; for (const k of [-1, 1]) { g.beginPath(); g.arc(x + k * s * 0.36, y - s * 0.16, s * 0.06, 0, TAU); g.fill(); }
  } });
}
// Teia de aranha
function teia(M, x, y, raio, o = {}) {
  const n = 8; livre(M, { vida: o.vida || 1.4, atraso: o.atraso, blend: 'source-over', draw(g, u) {
    const ap = Math.min(1, u / 0.3), a = u < 0.75 ? ap : 1 - (u - 0.75) / 0.25, r = raio * ap; g.globalAlpha = a * 0.8; g.strokeStyle = o.cor || 'rgba(235,235,245,.9)'; g.lineWidth = 1.1; g.translate(x, y); g.rotate(o.rot || 0);
    for (let i = 0; i < n; i++) { const q = (i * TAU) / n; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(q) * r, Math.sin(q) * r); g.stroke(); }
    for (let k = 1; k <= 5; k++) { const rr = (r * k) / 5; g.beginPath(); for (let i = 0; i <= n; i++) { const q = (i * TAU) / n, q2 = ((i - 0.5) * TAU) / n; if (i) g.quadraticCurveTo(Math.cos(q2) * rr * 0.8, Math.sin(q2) * rr * 0.8, Math.cos(q) * rr, Math.sin(q) * rr); else g.moveTo(Math.cos(q) * rr, Math.sin(q) * rr); } g.stroke(); }
  } });
}
// Lápide que sobe do chão
function lapide(M, x, pe, alt, atraso = 0, vida = 1.6) {
  livre(M, { vida, atraso, blend: 'source-over', chao: true, draw(g, u) {
    const sob = Math.min(1, u / 0.3), a = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2, w = alt * 0.55, y0 = pe - alt * sob; g.globalAlpha = a;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#374151'); gr.addColorStop(1, '#9ca3af'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w / 2, pe); g.lineTo(x - w / 2, y0 + w / 2); g.arc(x, y0 + w / 2, w / 2, Math.PI, TAU); g.lineTo(x + w / 2, pe); g.closePath(); g.fill(); g.strokeStyle = '#111827'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1f2937'; g.fillRect(x - 2, y0 + w * 0.32, 4, w * 0.7); g.fillRect(x - w * 0.18, y0 + w * 0.48, w * 0.36, 4);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.55; g.drawImage(brilhoCor('#34d399'), x - w, y0 - w * 0.3, w * 2, w);
  } });
}
// Mãos esqueléticas que brotam do chão e agarram
function maos(M, c, atraso = 0, vida = 1.2, cor = '#e7f5ec') {
  const hs = [-0.36, 0.32].map((k) => ({ x: c.x + k * c.w, ang: k * 0.7 }));
  livre(M, { vida, atraso, blend: 'source-over', draw(g, u) {
    const sob = Math.min(1, u / 0.3), fecha = Math.max(0, Math.min(1, (u - 0.3) / 0.2)), a = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; g.globalAlpha = a;
    for (const h of hs) { g.save(); g.translate(h.x, c.pe); g.rotate(h.ang); const L = c.h * 0.5 * sob; g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.45; g.drawImage(brilhoCor('#34d399'), -22, -L - 34, 44, 44); g.globalCompositeOperation = 'source-over'; g.globalAlpha = a; g.strokeStyle = cor; g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L); g.stroke();
      for (let f = -2; f <= 2; f++) { const fa = f * 0.3 * (1 - fecha * 0.7), fx = Math.sin(fa) * 18, fy = -L - Math.cos(fa) * 18; g.lineWidth = 3; g.beginPath(); g.moveTo(f * 2, -L); g.lineTo(fx, fy); g.lineTo(fx - f * 4 * fecha, fy + 9 * fecha); g.stroke(); }
      g.restore(); }
  } });
}
function nevoaChao(M, x0, x1, y, cor = '#a78bfa', vida = 1.6, atraso = 0) { for (let i = 0; i < M.n(18); i++) particula(M, { x: R(x0, x1), y: y + R(-14, 8), vx: R(-40, 40), vy: R(-6, 2), atrito: 0.2, forma: 'fumaca', cor, tam: R(24, 40), tamFim: R(50, 70), vida: vida * R(0.7, 1), atraso: atraso + R(0, 0.4), fadeIn: 0.3, alfa: 0.7 }); }
function morcegos(M, x, y, n = 8, o = {}) { rajada(M, x, y, { n, forma: 'morcego', cor: '#12061c', cor2: o.olho || '#fb923c', tam: o.tam || 12, v: o.v || 260, sobe: o.sobe ?? 120, vida: o.vida || 1.1, atrito: 0.5, bate: 30, ang: o.ang, abre: o.abre, atraso: o.atraso, espalhaT: o.espalhaT, fadeIn: 0.05 }); }
// Raízes que sobem do chão e se enrolam no alvo (parte de trás no chão, parte da frente por cima do corpo)
function raizesPrendendo(M, c, { cor = '#16a34a', cor2 = '#bef264', vida = 1.4, atraso = 0, n = 3 } = {}) {
  const vs = Array.from({ length: n }, (_, i) => ({ fase: (i * TAU) / n + R(-0.3, 0.3), voltas: R(1.3, 1.8), larg: R(5, 8), dx: R(-0.12, 0.12) }));
  const desenha = (g, u, frente) => {
    const cresce = Math.min(1, u / 0.35), aperta = u > 0.38 && u < 0.6 ? 1 - Math.sin(((u - 0.38) / 0.22) * Math.PI) * 0.14 : 1, some = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2;
    g.globalAlpha = some; g.lineCap = 'round';
    for (const v of vs) { const N = 40, k = Math.max(2, Math.floor(N * cresce)); let px = null, py = null;
      for (let i = 0; i <= k; i++) { const t = i / N, q = v.fase + t * v.voltas * TAU, rx = c.w * 0.44 * aperta * (1 - t * 0.35), x = c.x + c.w * v.dx + Math.cos(q) * rx, y = c.pe - t * c.h * 0.85 + Math.sin(q) * rx * 0.25;
        if (px !== null && (Math.sin(q) > 0) === frente) { const w = v.larg * (1 - t * 0.55); g.strokeStyle = '#14532d'; g.lineWidth = w + 3; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); g.strokeStyle = cor; g.lineWidth = w; g.stroke(); if (i % 6 === 0) { g.fillStyle = cor2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y - 5); g.lineTo(x + 1, y + 3); g.fill(); } }
        px = x; py = y; } }
  };
  livre(M, { vida, atraso, blend: 'source-over', chao: true, draw: (g, u) => desenha(g, u, false) });
  livre(M, { vida, atraso, blend: 'source-over', draw: (g, u) => desenha(g, u, true) });
}
function luaCheia(M, x, y, r, atraso = 0, vida = 2) { livre(M, { vida, atraso, draw(g, u) { const a = u < 0.2 ? u / 0.2 : 1 - Math.max(0, u - 0.8) / 0.2; g.globalAlpha = a * 0.35; g.drawImage(brilhoCor('#fdba74'), x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); g.globalAlpha = a; g.globalCompositeOperation = 'source-over'; const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); gr.addColorStop(0, '#fffbeb'); gr.addColorStop(1, '#fcd34d'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(180,83,9,.25)'; for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.4, 0.12]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, k * r, 0, TAU); g.fill(); } } }); }
// Aura demoníaca: línguas de fogo vermelho-negro ao redor do corpo, brasas e fumaça
function auraDemoniaca(M, a, vida = 2.6) {
  const N = 16, ls = Array.from({ length: N }, (_, i) => ({ q: (i * TAU) / N + R(-0.15, 0.15), h: R(0.7, 1.3), f: R(8, 14), w: R(0.09, 0.16) }));
  const desenha = (g, u, frente) => {
    const ap = Math.min(1, u / 0.15), a2 = u < 0.85 ? ap : 1 - (u - 0.85) / 0.15, T = u * vida;
    if (!frente) { g.globalAlpha = a2 * 0.65; g.drawImage(brilhoCor('#dc2626'), a.x - a.w * 1.1, a.pe - a.h * 1.25, a.w * 2.2, a.h * 1.5); }
    for (const l of ls) { const sn = Math.sin(l.q); if ((sn > 0) !== frente) continue;
      const bx = a.x + Math.cos(l.q) * a.w * 0.55, by = a.pe + sn * a.w * 0.12, H = a.h * l.h * ap * (0.72 + 0.28 * Math.sin(T * l.f + l.q * 3)) * (frente ? 0.5 : 1), W = a.w * l.w, sw = Math.sin(T * 6 + l.q) * W * 1.2;
      const gr = g.createLinearGradient(0, by, 0, by - H); gr.addColorStop(0, '#7f1d1d'); gr.addColorStop(0.35, '#dc2626'); gr.addColorStop(0.72, '#f97316'); gr.addColorStop(1, 'rgba(249,115,22,0)');
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = a2 * (frente ? 0.5 : 0.92); g.fillStyle = gr;
      g.beginPath(); g.moveTo(bx - W, by); g.quadraticCurveTo(bx - W * 0.6 + sw, by - H * 0.55, bx + sw * 1.6, by - H); g.quadraticCurveTo(bx + W * 0.6 + sw, by - H * 0.55, bx + W, by); g.closePath(); g.fill();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = a2 * 0.6; g.fillStyle = '#0a0004'; g.beginPath(); g.moveTo(bx - W * 0.45, by); g.quadraticCurveTo(bx + sw * 0.6, by - H * 0.4, bx + sw, by - H * 0.62); g.quadraticCurveTo(bx + W * 0.3, by - H * 0.3, bx + W * 0.45, by); g.closePath(); g.fill(); }
  };
  livre(M, { vida, chao: true, draw: (g, u) => desenha(g, u, false) });
  livre(M, { vida, draw: (g, u) => desenha(g, u, true) });
  for (let i = 0; i < M.n(44); i++) { const br = i % 3 !== 0; particula(M, { x: a.x + R(-a.w * 0.6, a.w * 0.6), y: a.pe - R(0, a.h * 0.3), vx: R(-20, 20), vy: R(-210, -90), atrito: 0.4, forma: br ? 'brasa' : 'fumaca', cor: br ? '#ef4444' : '#14020a', cor2: '#fca5a5', tam: br ? R(3, 6) : R(18, 30), tamFim: br ? 1 : 52, vida: R(0.8, 1.3), atraso: R(0, Math.max(0.1, vida - 1.1)), blend: br ? undefined : 'source-over' }); }
}
// Avanço de sombra (Abyssar): silhuetas escuras, rastro no chão e fumaça
async function sombraDash(ctx, M, A, a, de, para, ms) {
  const tr = setInterval(() => fantasma(ctx, A, '#dc2626', true), 16);
  const x0 = a.x + de.x, y0 = a.pe + de.y, x1 = a.x + para.x, y1 = a.pe + para.y;
  livre(M, { vida: 0.45, chao: true, blend: 'source-over', draw(g, u) { g.globalAlpha = (1 - u) * 0.75; g.strokeStyle = '#0a0206'; g.lineCap = 'round'; g.lineWidth = 18 * (1 - u * 0.5); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#991b1b'; g.lineWidth = 3; g.stroke(); } });
  for (let i = 0; i < M.n(8); i++) { const t = i / 8; particula(M, { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - a.h * R(0.15, 0.6), vx: R(-30, 30), vy: R(-50, -10), forma: 'fumaca', cor: '#12030a', tam: 18, tamFim: 32, vida: 0.5, atraso: (t * ms) / 1000 }); }
  await anim(A, [{ transform: `translate(${de.x}px,${de.y}px)` }, { transform: `translate(${para.x}px,${para.y}px)` }], { duration: ms * ctx.k, easing: 'cubic-bezier(.7,0,.3,1)' });
  clearInterval(tr);
}
function sangue(M, t, dir, k = 1) { rajada(M, t.x, t.y, { n: 14 * k, forma: 'gota', cor: '#7f1d1d', tam: 3.8, v: 380, vMin: 120, grav: 900, ang: dir > 0 ? -0.2 : Math.PI + 0.2, abre: 0.8, achata: 1, vida: 0.75, atrito: 0.3 }); rajada(M, t.x, t.y, { n: 10 * k, forma: 'faisca', cor: '#ef4444', tam: 3.5, v: 420, vida: 0.35 }); }
function estocada(M, t, dir) { feixe(M, t.x - dir * t.w * 0.55, t.y, t.x + dir * t.w * 0.7, t.y + R(-6, 6), { cor: '#fecaca', cor2: '#fff', larg: 5, vida: 0.16 }); particula(M, { x: t.x, y: t.y, forma: 'estrela', cor: '#fca5a5', tam: 22, tamFim: 6, vida: 0.28 }); }

// ---------- áreas por elemento ----------
// Terremoto: pisão, rachaduras atravessando o campo, espinhos de pedra sob cada alvo e tremor longo
async function terremoto(ctx, M, A, ev, hab, elem) {
  const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), cs = al.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1, E = ELEM[elem] || ELEM.terra;
  await preparo(ctx, M, A, E.cor, { ms: 280 });
  await anim(fig(A), [{ transform: 'translateY(0)' }, { transform: 'translateY(-34px) scale(1.05)' }], { duration: 200 * ctx.k, easing: 'ease-out' });
  await anim(fig(A), [{ transform: 'translateY(-34px) scale(1.05)' }, { transform: 'translateY(4px) scaleY(.9)' }], { duration: 110 * ctx.k, easing: 'ease-in' }); fig(A).getAnimations().forEach((x) => x.cancel());
  tremer(ctx, 17, 1500); quadroImpacto(ctx, false); onda(M, a.x, a.pe, { cor: E.cor2, r1: 260, esp: 8, vida: 0.7 }); rachadura(M, a.x, a.pe, { cor: '#f59e0b', raio: 90 });
  const xMax = dir > 0 ? Math.max(...cs.map((c) => c.x)) : Math.min(...cs.map((c) => c.x)), yM = cs.reduce((s, c) => s + c.pe, 0) / cs.length;
  for (let i = 1; i <= 5; i++) { const t = i / 5; rachadura(M, a.x + (xMax - a.x) * t, a.pe + (yM - a.pe) * t, { cor: '#f59e0b', raio: 70, n: 5, atraso: t * 0.35 }); }
  for (let i = 0; i < M.n(18); i++) particula(M, { x: R(0, M.w), y: -10, vx: R(-20, 20), vy: R(100, 200), grav: 700, atrito: 0.1, forma: 'caco', cor: E.cor, cor2: E.cor2, tam: R(4, 8), vida: 1, atraso: R(0.1, 0.8), blend: 'source-over' });
  cs.forEach((c, i) => setTimeout(() => {
    espinhos(M, c, '#a8a29e', '#f5f5f4', 7, 0, '#44403c'); rajada(M, c.x, c.pe, { n: 12, forma: 'caco', cor: E.cor, cor2: E.cor2, tam: 9, v: 300, grav: 900, sobe: 200, achata: 1, vida: 0.9, atrito: 0.3, blend: 'source-over' }); rajada(M, c.x, c.pe, { n: 8, forma: 'fumaca', cor: '#a8906e', tam: 26, tamFim: 54, v: 90, vida: 1.1 });
    aplicar(ctx, M, al[i].el, al[i].r, { dir, cor: E.cor, forca: 1.4 });
  }, (200 + (Math.abs(c.x - a.x) / Math.max(1, Math.abs(xMax - a.x))) * 380) * ctx.k));
  await ESP(1300 * ctx.k);
}
// Maremoto: uma onda gigante varre o campo inimigo, com espuma, respingos e tremor
async function maremoto(ctx, M, A, ev) {
  const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), cs = al.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1;
  await preparo(ctx, M, A, '#38bdf8', { ms: 320, circ: true });
  const x0 = a.x + dir * a.w * 0.3, x1 = dir > 0 ? Math.max(...cs.map((c) => c.x)) + 180 : Math.min(...cs.map((c) => c.x)) - 180, base = Math.max(...cs.map((c) => c.pe)) + 16, alt = base - Math.min(...cs.map((c) => c.topo)) + 50, dur = 1.05;
  livre(M, { vida: dur, blend: 'source-over', draw(g, u) {
    const fr = x0 + (x1 - x0) * u, a2 = u < 0.82 ? 1 : 1 - (u - 0.82) / 0.18, h = alt * Math.min(1, u * 2.2) * (1 - Math.max(0, u - 0.7) * 1.4), tras = x0 - dir * 120;
    g.globalAlpha = a2 * 0.9; const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, '#e0f2fe'); gr.addColorStop(0.2, '#38bdf8'); gr.addColorStop(0.7, '#0369a1'); gr.addColorStop(1, '#082f49'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(tras, base); for (let i = 0; i <= 26; i++) { const t = i / 26, xx = tras + (fr - tras) * t, yy = base - h * Math.pow(t, 1.5) * (0.92 + 0.08 * Math.sin(t * 22 + u * 30)); g.lineTo(xx, yy); }
    g.quadraticCurveTo(fr + dir * h * 0.4, base - h * 1.08, fr + dir * h * 0.28, base - h * 0.55); g.lineTo(fr + dir * 30, base); g.closePath(); g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(240,249,255,.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(fr - dir * h * 0.3, base - h * 0.85); g.quadraticCurveTo(fr + dir * h * 0.4, base - h * 1.08, fr + dir * h * 0.28, base - h * 0.55); g.stroke();
    for (let k = 0; k < 2; k++) particula(M, { x: fr + dir * h * 0.2, y: base - h * R(0.6, 1.05), vx: dir * R(60, 220), vy: R(-260, -80), grav: 800, atrito: 0.2, forma: 'gota', cor: '#bae6fd', tam: R(2.5, 4.5), vida: 0.7 });
  } });
  tremer(ctx, 15, 1250);
  cs.forEach((c, i) => setTimeout(() => { impacto(ctx, M, c.x, c.y, 'agua', { forte: true, dir, pe: c.pe }); aplicar(ctx, M, al[i].el, al[i].r, { dir, cor: '#38bdf8', forca: 1.6 }); }, (Math.abs(c.x - x0) / Math.max(1, Math.abs(x1 - x0))) * dur * 1000 * ctx.k));
  await ESP((dur * 1000 + 380) * ctx.k);
}
// Chuva de meteoros: céu em brasa, meteoros diagonais e explosões com tremor
async function meteoros(ctx, M, A, ev) {
  const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), cs = al.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1;
  const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length; escurecer(ctx, 'rgba(45,10,0,.62)', 1600 + cs.length * 200);
  await preparo(ctx, M, A, '#f97316', { ms: 340, circ: true });
  if (ctx.cinema || METEOROS_EM_COMBATE) { // tomada cinematográfica do Flow, impacto sincronizado com o som do clipe
    const cin = await cinemaMeteoros(ctx);
    if (cin) { const somAntes = ctx.som; if (cin.comSom) ctx.som = false;
      cs.forEach((c, i) => setTimeout(() => { impacto(ctx, M, c.x, c.y, 'fogo', { forte: true, dir, pe: c.pe }); tremer(ctx, 10, 340); aplicar(ctx, M, al[i].el, al[i].r, { dir, forte: true, cor: '#f97316', forca: 1.5 }); }, i * 160 * ctx.k));
      await ESP((cs.length * 160 + 200) * ctx.k); ctx.som = somAntes; await cin.fim(); return; }
  }
  luz(M, cx, -20, { cor: '#f97316', raio: 320, chao: false, vida: 1.6, forca: 0.6 });
  const quedas = [...cs.map((c, i) => ({ c, i })), ...Array.from({ length: 3 }, () => ({ c: { x: cx + R(-200, 200), y: cs[0].pe - 20, pe: cs[0].pe + R(-20, 30), w: 60, h: 60 }, i: -1 }))].sort(() => Math.random() - 0.5);
  quedas.forEach(({ c, i }, k) => setTimeout(() => {
    projetil(M, c.x - dir * R(150, 260), -70, c.x, i >= 0 ? c.y : c.pe, { tipo: 'cometa', cor: '#f97316', cor2: '#fde047', tam: i >= 0 ? 26 : 18, arco: 0, vida: 0.36, ease: 'linear' }).then(() => {
      impacto(ctx, M, c.x, i >= 0 ? c.y : c.pe, 'fogo', { forte: i >= 0, dir, pe: c.pe }); rachadura(M, c.x, c.pe, { cor: '#f97316', raio: 60 });
      recorte(M, 'erupcao', c.x, c.pe, { cor: '#f97316', tam: (c.w || 60) * 2.2, vida: 0.95, fadeIn: 0.06, fadeOut: 0.45 }); tremer(ctx, i >= 0 ? 10 : 6, 340);
      if (i >= 0) aplicar(ctx, M, al[i].el, al[i].r, { dir, forte: true, cor: '#f97316', forca: 1.5 });
    });
  }, (120 + k * 170) * ctx.k));
  await ESP((120 + quedas.length * 170 + 700) * ctx.k);
}
// Raízes do chão prendem cada alvo e apertam
async function raizesArea(ctx, M, A, ev, hab) {
  const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), cs = al.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1, forte = (hab?.cd || 0) >= 5;
  await preparo(ctx, M, A, '#4ade80', { ms: 320, circ: true });
  fig(A).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(6px) scaleY(.9)', offset: 0.5 }, { transform: 'translateY(0)' }], { duration: 300 * ctx.k });
  tremer(ctx, 6, 600);
  cs.forEach((c, i) => setTimeout(() => {
    rachadura(M, c.x, c.pe, { cor: '#4ade80', raio: 60 }); raizesPrendendo(M, c, { vida: 1.4 }); espinhos(M, { ...c, w: c.w * 1.4 }, '#16a34a', '#bef264', 5, 0.25);
    setTimeout(() => { impacto(ctx, M, c.x, c.y, 'planta', { forte, dir, pe: c.pe }); aplicar(ctx, M, al[i].el, al[i].r, { dir, forte, cor: '#4ade80', forca: 0.6 }); }, 560 * ctx.k);
  }, i * 120 * ctx.k));
  await ESP((1050 + cs.length * 120) * ctx.k);
}

// ---------- coreografias próprias ----------
// Manipulador das Oito Lâminas: as 8 lâminas (arte própria) saem em órbita do domador e cortam por telecinese; o retrato troca para a
// pose da habilidade enquanto ela dura.
const OITO = 'assets/confusion/interface/personagens/oito-laminas/';
const POSE_OITO = { danca_oito_laminas: 'danca-das-oito-laminas.webp', sincronia_telecinetica: 'sincronia-telecinetica.webp', tempestade_oito_laminas: 'tempestade-das-oito-laminas.webp' };
function laminaEl(ctx, x, y, w) { const e = document.createElement('img'); e.src = `../../../${OITO}lamina.webp`; e.alt = ''; e.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - w * 0.16}px;width:${w}px;pointer-events:none;z-index:88;filter:drop-shadow(0 0 6px #e2e8f0) drop-shadow(0 0 12px #94a3b8)`; ctx.campo.append(e); return e; }
async function fxOitoLaminas(ctx, M, A, ev, hab) {
  const img = A.querySelector('.un-fig img'), orig = img?.getAttribute('src');
  if (img && POSE_OITO[hab.id]) img.setAttribute('src', `../../../${OITO}${POSE_OITO[hab.id]}`);
  const a = corpo(ctx, A), w = a.w * 0.55, alvos = alvosDe(ctx, ev), apoio = hab.tipo !== 'dano';
  const lams = Array.from({ length: 8 }, (_, k) => { const ang = (k / 8) * TAU; return { e: laminaEl(ctx, a.x, a.y, w), ang }; });
  const orb = (t) => lams.forEach(({ e, ang }) => { const g = ang + t * 6; e.style.transform = `translate(${Math.cos(g) * a.w * 0.75}px,${Math.sin(g) * a.h * 0.32}px) rotate(${g * 57.3 + 90}deg)`; });
  for (let t = 0; t < 1; t += 0.05) { orb(t); await ESP(22 * ctx.k); }
  if (apoio) {
    await Promise.all(lams.map(({ e }, k) => { const al = alvos[k % alvos.length]; if (!al) return null; const c = corpo(ctx, al.el); return e.animate([{ transform: e.style.transform }, { transform: `translate(${c.x - a.x}px,${c.y - a.y}px) rotate(${720 + k * 45}deg)` }], { duration: 420 * ctx.k, fill: 'forwards', easing: 'ease-out' }).finished.catch(() => {}); }));
    for (const al of alvos) { const c = corpo(ctx, al.el); onda(M, c.x, c.pe, { cor: '#cbd5e1', r1: c.w, vida: 0.5 }); aplicar(ctx, M, al.el, al.r, { cura: true }); }
  } else {
    for (let k = 0; k < 8; k++) {
      const al = alvos[k % alvos.length]; if (!al) break; const c = corpo(ctx, al.el), { e } = lams[k];
      e.animate([{ transform: e.style.transform, opacity: 1 }, { transform: `translate(${c.x - a.x}px,${c.y - a.y}px) rotate(${Math.atan2(c.y - a.y, c.x - a.x) * 57.3}deg)`, opacity: 1 }], { duration: 160 * ctx.k, fill: 'forwards', easing: 'ease-in' });
      await ESP(120 * ctx.k);
      corte(M, c.x, c.y, { raio: c.w * 0.35, cor: '#e2e8f0', esp: 6, ang: R(-1.2, 1.2), vida: 0.22 }); rajada(M, c.x, c.y, { n: 8, forma: 'faisca', cor: '#f8fafc', tam: 3, v: 260, vida: 0.35 });
      if (k >= 8 - alvos.length) { const r = al.r; aplicar(ctx, M, al.el, r, { forte: hab.cd >= 5, cor: '#e2e8f0' }); }
    }
    if (hab.cd >= 5) tremer(ctx, 10, 420);
  }
  await ESP(260 * ctx.k);
  for (const { e } of lams) e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 * ctx.k, fill: 'forwards' }).finished.then(() => e.remove());
  if (img && orig) setTimeout(() => img.setAttribute('src', orig), 300 * ctx.k);
}
const FX = {
  oitoLaminas: fxOitoLaminas,
  // ===== Noctarn (trevas violeta) =====
  async mordida(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const T = al[0].el, a = corpo(ctx, A), dir = corpo(ctx, T).x > a.x ? 1 : -1;
    luz(M, a.x, a.pe, { cor: '#7c3aed', raio: 90, vida: 0.8 }); rajada(M, a.x, a.pe, { n: 8, forma: 'fumaca', cor: '#2e1065', tam: 22, v: 60, vida: 0.7, blend: 'source-over' });
    const volta = await investida(ctx, A, T, { cor: '#7c3aed', ms: 260 }); const t = corpo(ctx, T);
    if (!ctx.rapido) await ESP(60);
    corte(M, t.x, t.y - t.h * 0.08, { raio: t.w * 0.38, cor: '#a855f7', ang: -Math.PI / 2, abre: 2.2, esp: 16, vida: 0.3, achata: 0.7 });
    corte(M, t.x, t.y + t.h * 0.08, { raio: t.w * 0.38, cor: '#a855f7', ang: Math.PI / 2, abre: 2.2, esp: 16, vida: 0.3, achata: 0.7, sentido: -1, atraso: 0.04 });
    linhasFoco(M, t.x, t.y, { vida: 0.35, alfa: 0.4 }); camera(ctx, t, { zoom: 1.05, tremor: 5 });
    rajada(M, t.x, t.y, { n: 18, forma: 'faisca', cor: '#c084fc', tam: 4, v: 380, vida: 0.45 }); rajada(M, t.x, t.y, { n: 8, forma: 'gota', cor: '#9f1239', tam: 3.5, v: 200, grav: 700, sobe: 100, achata: 1, vida: 0.7, atrito: 0.3 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#a855f7', forca: 1.2 });
    await ESP(220 * ctx.k); await volta();
  },
  async chamaVioleta(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1, b = a.boca(dir);
    circulo(M, a.x, a.pe, { cor: '#8b5cf6', raio: a.w * 0.8, vida: 1.1 }); luz(M, a.x, a.pe, { cor: '#7c3aed', raio: 120, vida: 1 });
    convergir(M, b.x, b.y, { cor: '#c4b5fd', raio: 110, n: 24, vida: 0.45 });
    const orbe = livre(M, { vida: 0.5, draw(g, u) { const s = 6 + 26 * u * (1 + 0.1 * Math.sin(u * 50)); g.drawImage(brilhoVioleta(), b.x - s * 1.6, b.y - s * 1.6, s * 3.2, s * 3.2); } }); void orbe;
    fig(A).animate([{ transform: 'translateX(0) scale(1)' }, { transform: `translateX(${-dir * 8}px) scale(1.05)`, offset: 0.85 }, { transform: 'translateX(0) scale(1)' }], { duration: 560 * ctx.k });
    await ESP(480 * ctx.k); golpePose(ctx, A, 560);
    await projetil(M, b.x, b.y, t.x, t.y, { tipo: 'cometa', cor: '#8b5cf6', cor2: '#f5d0fe', tam: 24, arco: 40, vida: 0.42 });
    quadroImpacto(ctx, false); flash(ctx, '#7c3aed', 200, 0.3); camera(ctx, t, { zoom: 1.09, tremor: 10, ms: 560 });
    luz(M, t.x, t.y, { cor: '#a855f7', raio: t.w * 1.3, vida: 0.6, chao: false, forca: 1, nucleo: '#fff' });
    onda(M, t.x, t.pe, { cor: '#c4b5fd', r1: 230, esp: 7, vida: 0.6 }); onda(M, t.x, t.pe, { cor: '#7c3aed', r1: 150, esp: 4, vida: 0.5, atraso: 0.06 });
    rajada(M, t.x, t.y, { n: 30, forma: 'brasa', cor: '#a855f7', cor2: '#fdf4ff', tam: 8, v: 360, grav: 160, vida: 0.9 }); rajada(M, t.x, t.y, { n: 14, forma: 'brasa', cor: '#fb923c', cor2: '#fde047', tam: 5, v: 280, grav: 200, vida: 0.8 });
    rajada(M, t.x, t.y - 10, { n: 8, forma: 'fumaca', cor: '#2e1065', tam: 34, tamFim: 60, v: 60, sobe: 70, vida: 1.2, blend: 'source-over' }); rachadura(M, t.x, t.pe, { cor: '#a855f7', raio: 80 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, forte: true, cor: '#a855f7', forca: 1.8 });
    await ESP(620 * ctx.k);
  },
  async veuNoturno(ctx, M, A, ev) {
    const a = corpo(ctx, A); escurecer(ctx, 'rgba(10,3,24,.7)', 2200);
    for (let i = 0; i < M.n(10) + 2; i++) particula(M, { x: a.x + R(-a.w * 0.45, a.w * 0.45), y: a.pe, vx: 0, vy: R(-260, -140), atrito: 0.5, forma: 'fumaca', cor: '#2e1065', tam: 16, tamFim: 40, vida: 1.1, atraso: i * 0.04, blend: 'source-over' });
    circulo(M, a.x, a.pe, { cor: '#7c3aed', cor2: '#ddd6fe', raio: a.w * 0.95, vida: 1.8, lados: 5 });
    lua(M, a.x, a.topo - 20, 0.15);
    await ESP(520 * ctx.k);
    livre(M, { vida: 1.1, draw(g, u) { const ap = Math.min(1, u / 0.6), al = u < 0.75 ? ap : 1 - (u - 0.75) / 0.25; g.translate(a.x, a.y); g.rotate(u * 4); g.globalAlpha = al * 0.8; for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.strokeStyle = i % 2 ? '#a78bfa' : '#4c1d95'; g.lineWidth = 10 - i * 2; g.beginPath(); g.ellipse(0, 0, a.w * 0.55 * (0.6 + 0.4 * ap), a.h * 0.55 * (0.6 + 0.4 * ap), 0, 0, 2.2); g.stroke(); } } });
    for (let i = 0; i < M.n(14); i++) particula(M, { x: a.x + R(-a.w * 0.4, a.w * 0.4), y: a.pe - R(0, a.h * 0.6), vx: 0, vy: R(-90, -40), forma: 'estrela', cor: '#c4b5fd', tam: R(5, 9), vida: 0.9, atraso: R(0, 0.6) });
    await ESP(820 * ctx.k);
    onda(M, a.x, a.pe, { cor: '#c4b5fd', r1: a.w * 1.5, vida: 0.6 }); flash(ctx, '#4c1d95', 160, 0.2);
    for (const x of alvosDe(ctx, ev)) aplicar(ctx, M, x.el, x.r, { cura: true, forte: true });
    await ESP(520 * ctx.k);
  },
  // ===== Ignavor (fogo dourado, leão) =====
  async brasaImperial(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const T = al[0].el, dir = corpo(ctx, T).x > corpo(ctx, A).x ? 1 : -1;
    luz(M, corpo(ctx, A).x, corpo(ctx, A).pe, { cor: '#f97316', raio: 90, vida: 0.7 });
    const volta = await investida(ctx, A, T, { cor: '#f97316', salto: 46, ms: 300 }); const t = corpo(ctx, T);
    for (let i = 0; i < 3; i++) corte(M, t.x + (i - 1) * t.w * 0.12, t.y, { raio: t.w * 0.4, cor: i === 1 ? '#fbbf24' : '#f97316', ang: dir > 0 ? -1.1 : Math.PI + 1.1, sentido: dir, abre: 1.6, esp: 11, vida: 0.3, atraso: i * 0.05, rot: dir * 0.5 });
    await ESP(120 * ctx.k);
    impacto(ctx, M, t.x, t.y, 'fogo', { dir, pe: t.pe }); quadroImpacto(ctx, false);
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#f97316', forca: 1.2 });
    await ESP(240 * ctx.k); await volta();
  },
  async jubaFlamejante(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); const a = corpo(ctx, A), dir = al[0] && corpo(ctx, al[0].el).x > a.x ? 1 : -1;
    await preparo(ctx, M, A, '#f97316', { ms: 360 });
    raiosLuz(M, a.x, a.y, { cor: '#f97316', raio: a.w * 1.4, vida: 0.7, n: 14 });
    for (let i = 0; i < M.n(26); i++) { const q = R(0, TAU); particula(M, { x: a.x + Math.cos(q) * a.w * 0.3, y: a.y + Math.sin(q) * a.h * 0.25, vx: Math.cos(q) * 140, vy: Math.sin(q) * 100 - 60, forma: 'brasa', cor: '#f97316', cor2: '#fde047', tam: R(7, 12), vida: 0.6 }); }
    fig(A).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 500 * ctx.k });
    // onda de fogo varre o campo inimigo
    const x0 = a.x, xs = al.map((x) => corpo(ctx, x.el)); const x1 = xs.length ? Math.max(...xs.map((c) => c.x * dir)) * dir + dir * 60 : a.x + dir * 400; const yC = xs.length ? xs.reduce((s, c) => s + c.pe, 0) / xs.length : a.pe;
    livre(M, { vida: 0.7, draw(g, u) { const px = x0 + (x1 - x0) * u, a2 = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; g.globalAlpha = a2; g.translate(px, yC); g.scale(1, 1.6); g.drawImage(brilhoFogo(), -60, -70, 120, 120); for (let k = 0; k < 3; k++) particula(M, { x: px + R(-20, 20), y: yC + R(-60, 10), vx: dir * R(40, 120), vy: R(-200, -80), forma: 'brasa', cor: '#f97316', cor2: '#fde047', tam: R(8, 14), vida: 0.55 }); } });
    camera(ctx, { x: (x0 + x1) / 2, y: yC }, { zoom: 1.04, tremor: 6, ms: 700 });
    xs.forEach((c, i) => setTimeout(() => { coluna(M, c.x, c.pe, { cor: '#f97316', larg: c.w * 0.35, alt: c.h * 1.5, vida: 0.6 }); impacto(ctx, M, c.x, c.y, 'fogo', { dir, pe: c.pe }); aplicar(ctx, M, al[i].el, al[i].r, { dir, cor: '#f97316' }); }, (Math.abs(c.x - x0) / Math.abs(x1 - x0 || 1)) * 700 * ctx.k));
    await ESP(1000 * ctx.k);
  },
  async rugidoDourado(ctx, M, A, ev) {
    const a = corpo(ctx, A), b = a.boca(A.classList.contains('i') ? -1 : 1);
    await preparo(ctx, M, A, '#fbbf24', { ms: 300 });
    fig(A).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14) translateY(-4px)', offset: 0.25 }, { transform: 'scale(1)' }], { duration: 900 * ctx.k });
    for (let i = 0; i < 4; i++) onda(M, b.x, b.y, { cor: '#fde047', r1: 420, esp: 6, vida: 0.7, chao: false, achata: 0.8, atraso: i * 0.12 });
    linhasFoco(M, b.x, b.y, { vida: 0.8, alfa: 0.5 }); camera(ctx, b, { zoom: 1.06, tremor: 12, ms: 800 }); flash(ctx, '#fde68a', 160, 0.25);
    await ESP(520 * ctx.k);
    const al = alvosDe(ctx, ev);
    al.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); coluna(M, c.x, c.pe, { cor: '#fbbf24', larg: c.w * 0.4, alt: c.h * 1.6, vida: 0.9 }); aplicar(ctx, M, el, r, { cura: true }); }, i * 100 * ctx.k));
    await ESP((560 + al.length * 100) * ctx.k);
  },
  // ===== Vaelith (água astral) =====
  async arcoCiano(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1, b = a.boca(dir);
    convergir(M, b.x, b.y, { cor: '#67e8f9', raio: 70, n: 14, vida: 0.32 }); luz(M, a.x, a.pe, { cor: '#22d3ee', raio: 90, vida: 0.7 });
    livre(M, { vida: 0.35, draw(g, u) { g.globalAlpha = 1 - u; g.strokeStyle = '#a5f3fc'; g.lineWidth = 3; g.beginPath(); g.arc(b.x - dir * 10, b.y, 26 + u * 4, dir > 0 ? -1.2 : Math.PI - 1.2, dir > 0 ? 1.2 : Math.PI + 1.2); g.stroke(); } });
    await ESP(300 * ctx.k); golpePose(ctx, A, 560);
    await projetil(M, b.x, b.y, t.x, t.y, { tipo: 'flecha', cor: '#22d3ee', tam: 16, arco: 8, vida: 0.24, ease: 'linear' });
    impacto(ctx, M, t.x, t.y, 'agua', { dir, pe: t.pe }); corte(M, t.x, t.y, { raio: t.w * 0.3, cor: '#67e8f9', esp: 8, ang: dir > 0 ? 0 : Math.PI, abre: 1.4, vida: 0.25 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#22d3ee' });
    await ESP(420 * ctx.k);
  },
  async veuGelado(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); await preparo(ctx, M, A, '#7dd3fc', { ms: 280, circ: true });
    const cs = al.map((x) => corpo(ctx, x.el)), x0 = Math.min(...cs.map((c) => c.x)) - 60, x1 = Math.max(...cs.map((c) => c.x)) + 60;
    for (let i = 0; i < M.n(40); i++) particula(M, { x: R(x0, x1), y: R(-20, M.h * 0.3), vx: R(-20, 20), vy: R(80, 150), atrito: 0.2, forma: i % 4 ? 'neve' : 'estrela', cor: '#bae6fd', tam: R(3, 6), vida: R(1, 1.4), atraso: R(0, 0.5), onda: 1, ondaAmp: 1.2 });
    livre(M, { vida: 1.3, draw(g, u) { const a2 = (u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7) * 0.5; const gr = g.createLinearGradient(0, 0, 0, M.h); gr.addColorStop(0, `rgba(186,230,253,${a2})`); gr.addColorStop(1, 'rgba(186,230,253,0)'); g.fillStyle = gr; for (let k = 0; k < 6; k++) { const xx = x0 + ((x1 - x0) * k) / 5 + Math.sin(u * 6 + k) * 10; g.fillRect(xx - 14, 0, 28, M.h * (0.4 + 0.3 * Math.sin(k + u * 3))); } } });
    await ESP(560 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); onda(M, c.x, c.pe, { cor: '#7dd3fc', r1: c.w, vida: 0.6 }); rajada(M, c.x, c.y, { n: 8, forma: 'caco', cor: '#bae6fd', cor2: '#fff', tam: 6, v: 120, vida: 0.6 }); aplicar(ctx, M, el, r, { cura: true }); }, i * 100 * ctx.k));
    await ESP((520 + al.length * 100) * ctx.k);
  },
  async fendaEstelar(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), cs = al.map((x) => corpo(ctx, x.el)), dir = cs[0].x > a.x ? 1 : -1;
    const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length; escurecer(ctx, 'rgba(2,6,23,.78)', 2400);
    convergir(M, a.x, a.y, { cor: '#a5f3fc', raio: 120, n: 22, vida: 0.4 });
    // a fenda se abre no céu
    livre(M, { vida: 1.5, draw(g, u) { const ab = Math.min(1, u / 0.25), al2 = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2, L = 260 * ab, y = M.h * 0.12; g.globalAlpha = al2; g.translate(cx, y); g.rotate(-0.18); const gr = g.createLinearGradient(-L, 0, L, 0); gr.addColorStop(0, 'rgba(56,189,248,0)'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, 'rgba(56,189,248,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, L, 6 + 18 * ab * (0.8 + 0.2 * Math.sin(u * 40)), 0, 0, TAU); g.fill(); g.globalAlpha = al2 * 0.5; g.drawImage(brilhoAzul(), -L * 1.1, -60, L * 2.2, 120); } });
    for (let i = 0; i < M.n(30); i++) particula(M, { x: cx + R(-240, 240), y: M.h * 0.12 + R(-30, 30), vx: 0, vy: R(-20, 20), forma: 'estrela', cor: '#a5f3fc', tam: R(3, 7), vida: R(0.8, 1.4), atraso: R(0.1, 0.6) });
    await ESP(620 * ctx.k);
    cs.forEach((c, i) => setTimeout(() => {
      projetil(M, c.x + R(-120, 120), M.h * 0.1, c.x, c.y, { tipo: 'cometa', cor: '#38bdf8', cor2: '#f0f9ff', tam: 18, arco: 0, vida: 0.26, ease: 'linear' }).then(() => {
        impacto(ctx, M, c.x, c.y, 'agua', { forte: true, dir, pe: c.pe }); rajada(M, c.x, c.y, { n: 10, forma: 'estrela', cor: '#e0f2fe', tam: 8, v: 220, vida: 0.7 }); aplicar(ctx, M, al[i].el, al[i].r, { dir, forte: true, cor: '#38bdf8' });
      });
    }, i * 150 * ctx.k));
    await ESP((520 + cs.length * 150) * ctx.k); quadroImpacto(ctx, true); await ESP(400 * ctx.k);
  },
  // ===== Brotavel (planta) =====
  async raizViva(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1;
    await preparo(ctx, M, A, '#4ade80', { ms: 300 });
    fig(A).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(6px) scaleY(.9)', offset: 0.5 }, { transform: 'translateY(0)' }], { duration: 300 * ctx.k });
    livre(M, { vida: 0.4, chao: true, draw(g, u) { const px = a.x + (t.x - a.x) * u, py = a.pe + (t.pe - a.pe) * u; g.globalAlpha = 1 - u * 0.5; g.drawImage(brilhoVerde(), px - 30, py - 12, 60, 24); rajada(M, px, py, { n: 1, forma: 'folha', cor: '#22c55e', cor2: '#bef264', tam: 5, v: 80, sobe: 60, vida: 0.5 }); } });
    await ESP(360 * ctx.k);
    rachadura(M, t.x, t.pe, { cor: '#4ade80', raio: 70 }); raizesPrendendo(M, t, { vida: 1.3 }); tremer(ctx, 4, 300);
    await ESP(520 * ctx.k);
    impacto(ctx, M, t.x, t.y, 'planta', { dir, pe: t.pe });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#4ade80', forca: 0.6 });
    await ESP(500 * ctx.k);
  },
  async esporaVerde(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev), a = corpo(ctx, A); await preparo(ctx, M, A, '#86efac', { ms: 280, circ: true });
    for (let i = 0; i < M.n(30); i++) particula(M, { x: a.x + R(-30, 30), y: a.y + R(-20, 20), vx: R(-160, 160), vy: R(-160, -40), atrito: 1.4, forma: 'brilho', cor: '#bef264', tam: R(3, 6), vida: R(1, 1.5), onda: 2, ondaAmp: 1.5 });
    await ESP(420 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { aplicar(ctx, M, el, r, { cura: true }); }, i * 110 * ctx.k));
    await ESP((560 + al.length * 110) * ctx.k);
  },
  async brotoFertil(ctx, M, A, ev, hab) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const cs = al.map((x) => corpo(ctx, x.el)), cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cy = cs.reduce((s, c) => s + c.pe, 0) / cs.length;
    escurecer(ctx, 'rgba(5,20,10,.6)', 2300); circulo(M, cx, cy, { cor: '#22c55e', cor2: '#d9f99d', raio: 210, vida: 1.8, lados: 8, giro: 2 });
    for (let i = 0; i < M.n(24); i++) particula(M, { x: cx + R(-200, 200), y: cy + R(-20, 20), vx: 0, vy: R(-120, -50), forma: 'petala', cor: '#f9a8d4', cor2: '#fdf2f8', tam: R(4, 7), vida: R(1, 1.6), atraso: R(0, 0.6), vrot: 6 });
    await raizesArea(ctx, M, A, ev, hab);
    for (const c of cs) rajada(M, c.x, c.y, { n: 8, forma: 'fumaca', cor: '#4d7c0f', tam: 26, tamFim: 50, v: 80, sobe: 30, vida: 1.1 });
    await ESP(300 * ctx.k);
  },
  // ===== Solarin (luz solar) =====
  async raioDourado(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1, b = a.boca(dir);
    convergir(M, b.x, b.y, { cor: '#fde047', raio: 80, n: 18, vida: 0.35 }); raiosLuz(M, b.x, b.y, { cor: '#fde047', raio: 80, vida: 0.5, n: 8 });
    await ESP(340 * ctx.k); golpePose(ctx, A, 560);
    feixe(M, b.x, b.y, t.x, t.y, { cor: '#fbbf24', larg: 18, vida: 0.55 }); flash(ctx, '#fffbeb', 120, 0.25);
    await ESP(110 * ctx.k);
    impacto(ctx, M, t.x, t.y, 'luz', { dir, pe: t.pe });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#fbbf24' });
    await ESP(460 * ctx.k);
  },
  async chamaSolar(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), b = a.boca(t.x >= a.x ? 1 : -1);
    convergir(M, b.x, b.y, { cor: '#fbbf24', raio: 70, n: 16, vida: 0.35 });
    await ESP(320 * ctx.k);
    await projetil(M, b.x, b.y, t.x, t.y, { tipo: 'orbe', cor: '#fbbf24', cor2: '#fff7ed', tam: 18, arco: 60, vida: 0.5 });
    raiosLuz(M, t.x, t.y, { cor: '#fde68a', raio: t.w, vida: 0.8 }); onda(M, t.x, t.pe, { cor: '#fbbf24', r1: t.w * 1.2, vida: 0.6 }); rajada(M, t.x, t.y, { n: 14, forma: 'estrela', cor: '#fde68a', tam: 7, v: 150, sobe: 60, vida: 0.8 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { cura: true, forte: true });
    await ESP(600 * ctx.k);
  },
  async aurora(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); escurecer(ctx, 'rgba(8,10,30,.55)', 2300); await preparo(ctx, M, A, '#fde68a', { ms: 260 });
    livre(M, { vida: 1.9, draw(g, u) { const a2 = (u < 0.2 ? u / 0.2 : u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1) * 0.55; for (const [cor, off, amp] of [['#34d399', 0, 22], ['#a78bfa', 1.4, 18], ['#fde68a', 2.6, 14]]) { g.globalAlpha = a2; const gr = g.createLinearGradient(0, 0, 0, M.h * 0.4); gr.addColorStop(0, alfaHex(cor, 0)); gr.addColorStop(0.5, cor); gr.addColorStop(1, alfaHex(cor, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, M.h * 0.05); for (let x = 0; x <= M.w; x += 24) g.lineTo(x, M.h * 0.12 + Math.sin(x * 0.012 + u * 5 + off) * amp); for (let x = M.w; x >= 0; x -= 24) g.lineTo(x, M.h * 0.3 + Math.sin(x * 0.01 + u * 4 + off) * amp * 1.5); g.closePath(); g.fill(); } } });
    for (let i = 0; i < M.n(36); i++) particula(M, { x: R(0, M.w * 0.6), y: R(0, M.h * 0.25), vx: R(-10, 10), vy: R(60, 120), forma: 'estrela', cor: '#fef3c7', tam: R(3, 6), vida: R(1, 1.5), atraso: R(0.2, 0.9) });
    await ESP(700 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); coluna(M, c.x, c.pe, { cor: '#fde68a', larg: c.w * 0.45, alt: c.h * 2.2, vida: 1 }); aplicar(ctx, M, el, r, { cura: true, forte: true }); }, i * 120 * ctx.k));
    await ESP((700 + al.length * 120) * ctx.k);
  },
  // ===== Mortálio: Manto Violeta (regeneração, velocidade, defesa e escudo por 3 turnos) =====
  async mantoVioleta(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A);
    escurecer(ctx, 'rgba(20,6,40,.6)', 1900); circulo(M, a.x, a.pe, { cor: '#8b5cf6', cor2: '#ddd6fe', raio: a.w * 0.9, vida: 1.6, lados: 6 });
    convergir(M, a.x, a.y, { cor: '#c4b5fd', raio: a.w * 1.1, n: 22, vida: 0.4 });
    await ESP(380 * ctx.k);
    const CORES = ['#4ade80', '#a5f3fc', '#60a5fa', '#38bdf8']; // regeneração, velocidade, defesa, escudo
    for (const { el } of al) { const c = corpo(ctx, el);
      livre(M, { vida: 0.9, draw(g, u) { const ap = Math.min(1, u / 0.5), al2 = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; g.translate(c.x, c.y); g.rotate(u * 5); g.globalAlpha = al2 * 0.85; for (let k = 0; k < 3; k++) { g.rotate(TAU / 3); g.strokeStyle = k % 2 ? '#c4b5fd' : '#6d28d9'; g.lineWidth = 9 - k * 2; g.beginPath(); g.ellipse(0, 0, c.w * 0.56 * (0.5 + 0.5 * ap), c.h * 0.56 * (0.5 + 0.5 * ap), 0, 0, 2.4); g.stroke(); } } });
      CORES.forEach((cor, k) => livre(M, { vida: 0.85, draw(g, u) { const q = u * TAU * 1.5 + (k * TAU) / 4, r = c.w * 0.75 * (1 - u * 0.9); g.globalAlpha = 1 - Math.max(0, u - 0.85) / 0.15; g.drawImage(brilhoCor(cor), c.x + Math.cos(q) * r - 12, c.y + Math.sin(q) * r * 0.5 - 12, 24, 24); } }));
      rajada(M, c.x, c.y, { n: 6, forma: 'fumaca', cor: '#4c1d95', tam: 22, tamFim: 40, v: 60, vida: 0.9, blend: 'source-over' });
    }
    await ESP(((FX_HABILIDADES[VIOLETA.id]?.impactoMs || 520) + 300) * ctx.k);
    flash(ctx, '#7c3aed', 160, 0.25);
    al.forEach(({ el, r }) => { const c = corpo(ctx, el); onda(M, c.x, c.pe, { cor: '#a78bfa', r1: c.w * 1.4, esp: 5, vida: 0.6 }); aplicar(ctx, M, el, r, { cura: true, corCura: '#c084fc' }); });
    await ESP(700 * ctx.k);
  },
  // ===== Abobrisco (abóbora de Halloween: laranja, amarelo-vela e violeta de bruxa) =====
  async pancadaAbobora(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const T = al[0].el, a = corpo(ctx, A), dir = corpo(ctx, T).x > a.x ? 1 : -1;
    rajada(M, a.x, a.pe, { n: 10, forma: 'folha', cor: '#c2410c', cor2: '#fbbf24', tam: 7, v: 130, sobe: 70, vida: 0.9 });
    const volta = await investida(ctx, A, T, { cor: '#f97316', salto: 110, ms: 420, rastro: false }); const t = corpo(ctx, T);
    carantonha(M, t.x, t.y - t.h * 0.2, t.w * 0.8, 0, 0.85);
    rachadura(M, t.x, t.pe, { cor: '#f59e0b', raio: 110 }); onda(M, t.x, t.pe, { cor: '#fb923c', r1: 220, esp: 8, vida: 0.6 }); onda(M, t.x, t.pe, { cor: '#a855f7', r1: 150, esp: 4, vida: 0.5, atraso: 0.06 });
    rajada(M, t.x, t.pe - 10, { n: 6, forma: 'abobora', tam: 9, v: 300, grav: 900, sobe: 240, achata: 1, vida: 1, atrito: 0.3 });
    rajada(M, t.x, t.pe - 10, { n: 12, forma: 'caco', cor: '#ea580c', cor2: '#fdba74', tam: 8, v: 320, grav: 900, sobe: 200, achata: 1, vida: 0.9, atrito: 0.3, blend: 'source-over' });
    morcegos(M, t.x, t.y, 9, { olho: '#fde047' }); tremer(ctx, 13, 650); quadroImpacto(ctx, false);
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#f97316', forca: 1.5 });
    await ESP(320 * ctx.k); await volta();
  },
  async cascaEncantada(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); await preparo(ctx, M, A, '#fb923c', { ms: 300, circ: true });
    const a = corpo(ctx, A); rajada(M, a.x, a.y, { n: 12, forma: 'estrela', cor: '#a855f7', tam: 7, v: 180, vida: 0.8 });
    for (const { el } of al) { const c = corpo(ctx, el); rajada(M, c.x, c.y, { n: 10, forma: 'folha', cor: '#ea580c', cor2: '#fbbf24', tam: 6, v: 130, vida: 0.9, vrot: 8 }); for (let k = 0; k < 3; k++) particula(M, { x: c.x + (k - 1) * c.w * 0.4, y: c.pe - 6, vx: 0, vy: -26, atrito: 0.5, forma: 'abobora', tam: 7, vida: 1.3, atraso: k * 0.08, vrot: 2 }); }
    await ESP(380 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { bolhaEscudo(M, corpo(ctx, el), '#fb923c', 0, 1.2); aplicar(ctx, M, el, { ...r, efeitos: (r.efeitos || []).filter((x) => x !== 'escudo') }, { cura: true, corCura: '#fb923c' }); }, i * 100 * ctx.k));
    await ESP((640 + al.length * 100) * ctx.k);
  },
  async muralhaRamas(ctx, M, A, ev) {
    const a = corpo(ctx, A); escurecer(ctx, 'rgba(25,8,32,.62)', 2200); nevoaChao(M, a.x - a.w * 1.5, a.x + a.w * 1.5, a.pe, '#7c3aed', 1.8);
    for (let i = 0; i < 3; i++) espinhos(M, { ...a, w: a.w * (1.3 + i * 0.25), h: a.h * (1.15 - i * 0.15) }, '#15803d', '#fdba74', 9, i * 0.12);
    for (let k = 0; k < 6; k++) particula(M, { x: a.x + (k - 2.5) * a.w * 0.32, y: a.pe + 4, vx: 0, vy: -20, atrito: 0.5, forma: 'abobora', tam: R(8, 12), vida: 1.8, atraso: 0.2 + k * 0.06, vrot: 1 });
    rachadura(M, a.x, a.pe, { cor: '#f59e0b', raio: 120 }); tremer(ctx, 10, 800);
    await ESP(450 * ctx.k);
    carantonha(M, a.x, a.topo - a.h * 0.15, a.w * 1.15, 0, 1.2); morcegos(M, a.x, a.topo, 12, { olho: '#fde047', v: 300 });
    await ESP(400 * ctx.k);
    bolhaEscudo(M, a, '#fb923c', 0, 1.2); for (let k = 0; k < 3; k++) onda(M, a.x, a.pe, { cor: k % 2 ? '#a855f7' : '#f97316', r1: a.w * 1.3, esp: 5, vida: 0.6, atraso: k * 0.15 });
    for (const x of alvosDe(ctx, ev)) aplicar(ctx, M, x.el, { ...x.r, efeitos: (x.r.efeitos || []).filter((e) => e !== 'escudo') }, { cura: true, corCura: '#fb923c' });
    await ESP(800 * ctx.k);
  },
  // ===== Velalume (velas, lanternas e fogo-fátuo) =====
  async chamaGentil(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el);
    luz(M, a.x, a.pe, { cor: '#fcd34d', raio: 80, vida: 0.8 }); vela(M, a.x, a.topo + 10, 0, 0.8); await ESP(260 * ctx.k);
    await projetil(M, a.x, a.topo + a.h * 0.2, t.x, t.y, { tipo: 'orbe', cor: '#fbbf24', cor2: '#fff7ed', tam: 12, arco: 70, vida: 0.6, onda: 2, ondaAmp: 6 });
    vela(M, t.x, t.pe + 4, 0, 1.1); for (let k = 0; k < M.n(8); k++) particula(M, { x: t.x + R(-t.w * 0.4, t.w * 0.4), y: t.pe - R(0, t.h * 0.4), vx: 0, vy: R(-70, -30), forma: 'brasa', cor: '#34d399', cor2: '#d9f99d', tam: R(5, 8), vida: 1, atraso: R(0, 0.3), onda: 1.5, ondaAmp: 1.2 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { cura: true });
    await ESP(620 * ctx.k);
  },
  async vigiliaVelas(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); escurecer(ctx, 'rgba(10,6,20,.55)', 1900); await preparo(ctx, M, A, '#fcd34d', { ms: 260 });
    rajada(M, 40, 40, { n: 8, forma: 'morcego', cor: '#12061c', cor2: '#fde047', tam: 11, v: 260, ang: 0.4, abre: 0.4, sobe: 0, vida: 1.4, atrito: 0.2, bate: 28 });
    for (const { el } of al) { const c = corpo(ctx, el); for (let k = 0; k < 3; k++) vela(M, c.x + (k - 1) * c.w * 0.35, c.pe + 4 + (k === 1 ? 6 : 0), k * 0.08, 1.3); }
    await ESP(560 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => aplicar(ctx, M, el, r, { cura: true }), i * 100 * ctx.k));
    await ESP((600 + al.length * 100) * ctx.k);
  },
  async procissaoLuz(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); escurecer(ctx, 'rgba(10,6,20,.7)', 2500);
    const cs = al.map((x) => corpo(ctx, x.el)), y0 = cs.length ? cs.reduce((s, c) => s + c.y, 0) / cs.length : M.h * 0.5, yp = cs.length ? Math.max(...cs.map((c) => c.pe)) : M.h * 0.7;
    nevoaChao(M, 0, M.w * 0.6, yp, '#6d28d9', 2);
    for (let i = 0; i < 8; i++) particula(M, { x: -30 - i * 50, y: y0 - 40 + Math.sin(i) * 26, vx: 420, vy: 0, atrito: 0, forma: i % 2 ? 'abobora' : 'brilho', cor: '#fde68a', tam: i % 2 ? 11 : 14, vida: 1.6, onda: 1.5, ondaAmp: 1.5, fadeIn: 0.1 });
    for (let i = 0; i < 6; i++) projetil(M, -40, y0 + R(-60, 20), M.w * 0.6, y0 - 60, { tipo: 'fantasma', cor: '#6ee7b7', tam: 9, arco: 20, vida: 1.2, atraso: 0.1 + i * 0.1, ease: 'linear', onda: 1.5, ondaAmp: 10 });
    await ESP(850 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); coluna(M, c.x, c.pe, { cor: '#fde68a', larg: c.w * 0.5, alt: c.h * 2.2, vida: 1.1 }); raiosLuz(M, c.x, c.y, { cor: '#fef3c7', raio: c.w * 1.2, vida: 0.9 }); aplicar(ctx, M, el, r, { cura: true, forte: true }); }, i * 120 * ctx.k));
    await ESP((800 + al.length * 120) * ctx.k);
  },
  // ===== Mortálio (fantasma: verde-ecto e verde-túmulo) =====
  async soproEtereo(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1, b = a.boca(dir);
    rajada(M, b.x, b.y, { n: 10, forma: 'fumaca', cor: '#a7f3d0', tam: 14, tamFim: 30, v: 60, vida: 0.7 }); convergir(M, b.x, b.y, { cor: '#34d399', raio: 70, n: 12, vida: 0.32 });
    await ESP(320 * ctx.k); golpePose(ctx, A, 560);
    for (let i = 0; i < 3; i++) onda(M, b.x + dir * i * 30, b.y, { cor: '#6ee7b7', r0: 10, r1: 40 + i * 14, esp: 3, vida: 0.4, chao: false, achata: 1.3, atraso: i * 0.08 });
    await projetil(M, b.x, b.y, t.x, t.y, { tipo: 'caveira', cor: '#34d399', cor2: '#ecfdf5', tam: 18, arco: 30, vida: 0.55, onda: 2.5, ondaAmp: 12 });
    impacto(ctx, M, t.x, t.y, 'fantasma', { dir, pe: t.pe }); rajada(M, t.x, t.y, { n: 5, forma: 'caveira', cor: '#34d399', cor2: '#d1fae5', tam: 7, v: 90, sobe: 120, vida: 1, atrito: 0.6 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#34d399' });
    await ESP(460 * ctx.k);
  },
  async veuLamento(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const t = corpo(ctx, al[0].el); await preparo(ctx, M, A, '#a78bfa', { ms: 280 });
    for (let i = 0; i < 4; i++) { const q = (i * TAU) / 4, d = t.w * 1.1; projetil(M, t.x + Math.cos(q) * d, t.y + Math.sin(q) * d * 0.6, t.x, t.y, { tipo: 'fantasma', cor: '#c4b5fd', tam: 11, arco: 30, vida: 0.7, atraso: i * 0.08, onda: 1.5, ondaAmp: 8 }); }
    for (let i = 0; i < M.n(22); i++) particula(M, { x: t.x + R(-t.w * 0.5, t.w * 0.5), y: t.topo - R(40, 120), vx: 0, vy: R(160, 240), atrito: 0.1, forma: 'gota', cor: '#c4b5fd', tam: R(2.5, 4), vida: 0.7, atraso: R(0, 0.5) });
    await ESP(800 * ctx.k);
    for (const x of al) aplicar(ctx, M, x.el, x.r, { cura: true, forte: true });
    await ESP(560 * ctx.k);
  },
  async retornoAlma(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const r0 = al[0], t = corpo(ctx, r0.el);
    escurecer(ctx, 'rgba(4,10,16,.75)', 2800); nevoaChao(M, t.x - t.w * 1.4, t.x + t.w * 1.4, t.pe, '#34d399', 2.2);
    if (r0.r.revivido) fig(r0.el).style.opacity = '0';
    lapide(M, t.x + t.w * 0.45, t.pe - 4, t.h * 0.75, 0, 2.2); maos(M, t, 0.15, 1.3);
    await ESP(500 * ctx.k);
    await projetil(M, t.x + t.w * 0.45, t.pe - t.h * 0.75, t.x, t.y, { tipo: 'fantasma', cor: '#a7f3d0', tam: 16, arco: 60, vida: 0.6, onda: 1.5, ondaAmp: 12 });
    coluna(M, t.x, t.pe, { cor: '#c084fc', larg: t.w * 0.6, alt: M.h, vida: 1.4 }); raiosLuz(M, t.x, t.y, { cor: '#a7f3d0', raio: t.w * 1.8, vida: 1.2, n: 14 });
    circulo(M, t.x, t.pe, { cor: '#34d399', cor2: '#e9d5ff', raio: t.w * 0.9, vida: 1.5, lados: 6 }); asas(M, t, 0.1);
    for (let i = 0; i < M.n(16); i++) particula(M, { x: t.x + R(-t.w * 0.6, t.w * 0.6), y: t.topo - R(0, 120), vx: R(-30, 30), vy: R(30, 80), atrito: 0.3, forma: 'pena', cor: '#ffffff', cor2: '#d8b4fe', tam: R(6, 10), vida: R(1.2, 1.7), atraso: R(0, 0.4), vrot: 3 });
    await ESP(450 * ctx.k);
    if (r0.r.revivido) { fig(r0.el).style.opacity = ''; fig(r0.el).animate([{ opacity: 0, transform: 'translateY(-30px) scale(.85)', filter: 'brightness(4)' }, { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'brightness(1.6)', offset: 0.6 }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 800 * ctx.k }); flash(ctx, '#f5f3ff', 200, 0.4); }
    onda(M, t.x, t.pe, { cor: '#c084fc', r1: t.w * 1.8, esp: 6, vida: 0.7 });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { cura: true, forte: true });
    await ESP(800 * ctx.k);
  },
  // ===== Vitrarco (sino, vitral, morcegos e teias) =====
  async badalada(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), t = corpo(ctx, al[0].el), dir = t.x > a.x ? 1 : -1;
    fig(A).animate([{ transform: 'rotate(0)' }, { transform: `rotate(${-dir * 10}deg)`, offset: 0.3 }, { transform: `rotate(${dir * 8}deg)`, offset: 0.6 }, { transform: 'rotate(0)' }], { duration: 520 * ctx.k });
    await ESP(220 * ctx.k); golpePose(ctx, A, 560);
    for (let i = 0; i < 5; i++) { const u0 = i / 5; onda(M, a.x + (t.x - a.x) * u0, a.y + (t.y - a.y) * u0, { cor: i % 2 ? '#c4b5fd' : '#8b5cf6', r0: 14, r1: 50 + i * 12, esp: 4, vida: 0.35, chao: false, achata: 1.2, atraso: i * 0.05 }); }
    const vx = (t.x - a.x) * 1.9, vy = (t.y - a.y) * 1.9; for (let i = 0; i < M.n(12); i++) particula(M, { x: a.x + R(-20, 20), y: a.y + R(-30, 10), vx: vx * R(0.85, 1.1), vy: vy + R(-40, 40), atrito: 0.4, forma: 'morcego', cor: '#12061c', cor2: '#c084fc', tam: R(9, 13), vida: 0.75, atraso: R(0, 0.15), onda: 3, ondaAmp: 2, bate: 30, fadeIn: 0.05 });
    await ESP(380 * ctx.k);
    onda(M, t.x, t.y, { cor: '#ddd6fe', r1: t.w * 1.2, esp: 6, vida: 0.45, chao: false, achata: 1 });
    rajada(M, t.x, t.y, { n: 16, forma: 'caco', cor: '#7c3aed', cor2: '#f0abfc', tam: 8, v: 300, grav: 500, vida: 0.8, atrito: 0.6 }); teia(M, t.x, t.y, t.w * 0.55, { vida: 0.9 });
    impacto(ctx, M, t.x, t.y, 'trevas', { dir, pe: t.pe });
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#8b5cf6' });
    await ESP(460 * ctx.k);
  },
  async egideNoturna(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; await preparo(ctx, M, A, '#c4b5fd', { ms: 300, circ: true });
    const t = corpo(ctx, al[0].el); vitral(M, t, 0, 1.3); teia(M, t.x, t.pe - t.h * 0.45, t.w * 0.55, { vida: 1.2, atraso: 0.2, cor: 'rgba(253,230,138,.8)' }); morcegos(M, t.x, t.topo, 6, { olho: '#fde68a', v: 200 });
    await ESP(560 * ctx.k);
    for (const x of al) aplicar(ctx, M, x.el, { ...x.r, efeitos: (x.r.efeitos || []).filter((e) => e !== 'escudo') }, { cura: true });
    await ESP(700 * ctx.k);
  },
  async noiteImaculada(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); escurecer(ctx, 'rgba(3,3,18,.82)', 2600);
    luaCheia(M, M.w * 0.5, M.h * 0.17, 34, 0, 2.2); teia(M, 0, 0, 120, { vida: 2.1 }); teia(M, M.w, 0, 120, { vida: 2.1, rot: Math.PI / 2 });
    rajada(M, -20, M.h * 0.22, { n: 14, forma: 'morcego', cor: '#0b0414', cor2: '#fbbf24', tam: 12, v: 420, vMin: 260, ang: -0.08, abre: 0.25, sobe: 0, vida: 1.8, atrito: 0, bate: 26, espalhaT: 0.6, onda: 2, ondaAmp: 2 });
    for (let i = 0; i < M.n(30); i++) particula(M, { x: R(0, M.w), y: R(0, M.h * 0.45), vx: 0, vy: 0, forma: 'estrela', cor: '#e0e7ff', tam: R(2, 5), vida: R(1.2, 2), atraso: R(0, 0.5), pulsar: 3 });
    await ESP(750 * ctx.k);
    al.forEach(({ el, r }, i) => setTimeout(() => { const c = corpo(ctx, el); redoma(M, c, 0, 1.4); coluna(M, c.x, c.pe, { cor: '#fde68a', larg: c.w * 0.35, alt: c.h * 1.8, vida: 0.8 }); aplicar(ctx, M, el, r, { cura: true }); }, i * 120 * ctx.k));
    await ESP((800 + al.length * 120) * ctx.k);
  },
  // ===== Abyssar (T5 macabro: sombra, faca e sangue) =====
  async facada(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), T = al[0].el, t = corpo(ctx, T), dir = t.x > a.x ? 1 : -1;
    fig(A).animate([{ filter: 'none' }, { filter: 'brightness(.45) contrast(1.7) drop-shadow(0 0 10px #dc2626)' }], { duration: 150 * ctx.k, fill: 'forwards' });
    rajada(M, a.x, a.pe, { n: 8, forma: 'fumaca', cor: '#12030a', tam: 26, v: 60, vida: 0.6, blend: 'source-over' });
    await ESP(140 * ctx.k);
    const ida = { x: t.x - dir * t.w * 0.45 - a.x, y: t.pe - a.pe };
    await sombraDash(ctx, M, A, a, { x: 0, y: 0 }, ida, 130);
    fig(A).animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dir * 24}px) scaleX(1.06)`, offset: 0.35 }, { transform: 'translateX(0)' }], { duration: 230 * ctx.k });
    await ESP(60 * ctx.k);
    golpePose(ctx, A, 420); estocada(M, t, dir); corte(M, t.x, t.y, { raio: t.w * 0.45, cor: '#dc2626', ang: dir > 0 ? -0.5 : Math.PI + 0.5, sentido: dir, abre: 1.8, esp: 14, vida: 0.22 });
    if (!ctx.rapido) await ESP(90); // congela no impacto
    quadroImpacto(ctx, true); linhasFoco(M, t.x, t.y, { vida: 0.35, cor: '#fecaca', alfa: 0.5 }); camera(ctx, t, { zoom: 1.07, tremor: 8 });
    sangue(M, t, dir, 1.2);
    for (const x of al) aplicar(ctx, M, x.el, x.r, { dir, cor: '#ef4444', forca: 1.3 });
    await ESP(150 * ctx.k);
    corte(M, t.x, t.y, { raio: t.w * 0.4, cor: '#7f1d1d', ang: dir > 0 ? Math.PI + 0.6 : -0.6, sentido: -dir, abre: 1.6, esp: 10, vida: 0.2 });
    await ESP(140 * ctx.k);
    await sombraDash(ctx, M, A, a, ida, { x: 0, y: 0 }, 150);
    A.getAnimations().forEach((x) => x.cancel()); fig(A).getAnimations().forEach((x) => x.cancel());
  },
  async perseguicao(ctx, M, A, ev) {
    const al = alvosDe(ctx, ev); if (!al.length) return; const a = corpo(ctx, A), golpes = ev.hab?.golpes || 5;
    escurecer(ctx, 'rgba(30,0,6,.74)', 800 + al.length * 260);
    fig(A).animate([{ filter: 'none' }, { filter: 'brightness(.42) contrast(1.8) drop-shadow(0 0 12px #dc2626)' }], { duration: 120 * ctx.k, fill: 'forwards' });
    let pos = { x: 0, y: 0 }, n = 0;
    for (const { el, r } of al) {
      n += 1; const t = corpo(ctx, el), sx = t.x > a.x ? 1 : -1, lado = n % 2 ? 1 : -1, d = sx * lado;
      if (n > 1 && (n - 1) % golpes === 0) { numero(ctx, A, 'REINICIA!', '#fca5a5', { grande: true }); flash(ctx, '#7f1d1d', 160, 0.35); rajada(M, a.x + pos.x, a.pe + pos.y - a.h * 0.4, { n: 16, forma: 'faisca', cor: '#ef4444', tam: 4, v: 360, vida: 0.4 }); await ESP(150 * ctx.k); }
      const alvoPos = { x: t.x - d * t.w * 0.42 - a.x, y: t.pe - a.pe };
      await sombraDash(ctx, M, A, a, pos, alvoPos, 95); pos = alvoPos;
      fig(A).animate([{ transform: 'translateX(0)' }, { transform: `translateX(${d * 18}px)`, offset: 0.4 }, { transform: 'translateX(0)' }], { duration: 150 * ctx.k });
      golpePose(ctx, A, 200); corte(M, t.x, t.y, { raio: t.w * 0.48, cor: '#dc2626', ang: R(-1.2, 1.2) + (d > 0 ? 0 : Math.PI), sentido: d, abre: 2.2, esp: 15, vida: 0.2 });
      if (n % 3 === 0) estocada(M, t, d);
      sangue(M, t, d, 0.7); camera(ctx, t, { zoom: 1.03, tremor: 5, ms: 180 }); combo(ctx, el, n);
      aplicar(ctx, M, el, r, { dir: d, cor: '#ef4444', forca: 0.9, dx: R(-16, 16) });
      if (!ctx.rapido) await ESP(55);
    }
    quadroImpacto(ctx, true); flash(ctx, '#450a0a', 200, 0.3);
    await sombraDash(ctx, M, A, a, pos, { x: 0, y: 0 }, 140);
    A.getAnimations().forEach((x) => x.cancel()); fig(A).getAnimations().forEach((x) => x.cancel());
    statusFx(ctx, M, A, 'veloz', 0); await ESP(240 * ctx.k);
  },
  async horaTerror(ctx, M, A, ev) {
    const a = corpo(ctx, A), D = 2.6; escurecer(ctx, 'rgba(35,0,0,.84)', 2900);
    auraDemoniaca(M, a, D); circulo(M, a.x, a.pe, { cor: '#dc2626', cor2: '#7f1d1d', raio: a.w * 1.15, vida: D, lados: 5, giro: 1.2 });
    fig(A).animate([{ filter: 'none' }, { filter: 'brightness(.35) contrast(1.8) saturate(1.6) drop-shadow(0 0 14px #dc2626) drop-shadow(0 0 30px #7f1d1d)', offset: 0.15 }, { filter: 'brightness(.5) contrast(1.6) drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 40px #991b1b)', offset: 0.65 }, { filter: 'none' }], { duration: D * 1000 * ctx.k });
    for (let i = 0; i < 4; i++) setTimeout(() => { flash(ctx, '#450a0a', 160, 0.35); tremer(ctx, 4 + i * 2, 280); onda(M, a.x, a.pe, { cor: '#ef4444', r1: a.w * (1.2 + i * 0.3), esp: 5, vida: 0.5 }); }, (250 + i * 420) * ctx.k);
    for (let i = 0; i < 6; i++) setTimeout(() => relampago(M, a.x + R(-a.w, a.w), a.topo - R(20, 80), a.x + R(-a.w * 0.4, a.w * 0.4), a.pe - R(0, 20), { cor: '#ef4444', vida: 0.25, ramos: 1, amp: 22 }), (300 + i * 280) * ctx.k);
    rajada(M, a.x, a.y, { n: 6, forma: 'caveira', cor: '#dc2626', cor2: '#2a0a0f', tam: 10, v: 110, sobe: 140, vida: 1.6, atrito: 0.8, espalhaT: 1.2, atraso: 0.3 });
    // olhos demoníacos se abrindo na escuridão
    livre(M, { vida: 1.9, draw(g, u) { const ab = Math.min(1, Math.max(0, (u - 0.1) / 0.25)), a2 = u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; g.globalAlpha = a2;
      for (const [ox, oy, s] of [[-1, -0.5, 1], [1, -0.5, 1], [-0.55, -1.0, 0.75], [0.55, -1.0, 0.75], [0, -1.32, 0.6]]) { const x = a.x + ox * a.w * 1.05, y = a.y + oy * a.h * 0.6, w = 30 * s, h = 11 * s * ab;
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = a2 * 0.5; g.drawImage(brilhoVermelho(), x - w * 1.5, y - w * 0.8, w * 3, w * 1.6); g.globalAlpha = a2; g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#fde68a'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - h * 1.6, x + w, y); g.quadraticCurveTo(x, y + h * 1.6, x - w, y); g.fill();
        g.fillStyle = '#b91c1c'; g.beginPath(); g.ellipse(x, y, w * 0.12, Math.max(0.5, h * 1.25), 0, 0, TAU); g.fill(); } } });
    await ESP(1900 * ctx.k);
    onda(M, a.x, a.pe, { cor: '#ef4444', r1: a.w * 2.2, esp: 9, vida: 0.7 }); linhasFoco(M, a.x, a.y, { vida: 0.6, cor: '#fecaca', alfa: 0.55 }); quadroImpacto(ctx, true); tremer(ctx, 14, 520);
    for (const x of alvosDe(ctx, ev)) aplicar(ctx, M, x.el, x.r, { cura: true, corCura: '#ef4444' });
    await ESP(700 * ctx.k);
  },
};
// sprites de brilho prontos
const brilhoCor = (c) => { const k = '_b' + c; if (FX[k]) return FX[k]; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.2, '#fff'); gr.addColorStop(0.45, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); FX[k] = cv; return cv; };
const brilhoVioleta = () => brilhoCor('#8b5cf6'), brilhoFogo = () => brilhoCor('#f97316'), brilhoAzul = () => brilhoCor('#38bdf8'), brilhoVerde = () => brilhoCor('#22c55e'), brilhoVermelho = () => brilhoCor('#dc2626');
const alfaHex = (c, a) => c + Math.round(a * 255).toString(16).padStart(2, '0');
function lua(M, x, y, atraso = 0, vida = 1.6) { livre(M, { vida, atraso, draw(g, u) { const a = u < 0.2 ? u / 0.2 : 1 - Math.max(0, u - 0.75) / 0.25; g.globalAlpha = a; g.drawImage(brilhoCor('#c4b5fd'), x - 70, y - 70, 140, 140); g.fillStyle = '#f5f3ff'; g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x + 11, y - 6, 23, 0, TAU); g.fill(); } }); }
function vela(M, x, y, atraso = 0, vida = 1) { livre(M, { vida, atraso, draw(g, u) { const a = u < 0.15 ? u / 0.15 : 1 - Math.max(0, u - 0.7) / 0.3, f = 1 + 0.15 * Math.sin(u * 60); g.globalAlpha = a; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fef3c7'; g.fillRect(x - 4, y - 18, 8, 18); g.globalCompositeOperation = 'lighter'; g.drawImage(brilhoCor('#f59e0b'), x - 18 * f, y - 40 * f, 36 * f, 36 * f); g.fillStyle = '#fff7ed'; g.beginPath(); g.ellipse(x, y - 25, 3.5, 7 * f, 0, 0, TAU); g.fill(); } }); }
function asas(M, c, atraso = 0) { livre(M, { vida: 1.4, atraso, draw(g, u) { const ab = Math.min(1, u / 0.35), a = u < 0.7 ? ab : 1 - (u - 0.7) / 0.3; g.globalAlpha = a * 0.75; for (const s of [-1, 1]) { g.save(); g.translate(c.x, c.y - c.h * 0.1); g.scale(s, 1); g.rotate(-0.3 * ab); for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? 'rgba(224,242,254,.55)' : 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(c.w * (0.35 + k * 0.12) * ab, -k * 9, c.w * 0.3 * ab, 8, -0.4 - k * 0.12, 0, TAU); g.fill(); } g.restore(); } } }); }
function vitral(M, c, atraso = 0, vida = 1.2) { livre(M, { vida, atraso, draw(g, u) { const ap = Math.min(1, u / 0.25), a = u < 0.72 ? ap : 1 - (u - 0.72) / 0.28, rx = c.w * 0.62, ry = c.h * 0.62 * ap; g.translate(c.x, c.pe); g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI, TAU); g.closePath(); g.clip(); const cores = ['#7c3aed', '#db2777', '#2563eb', '#f59e0b', '#059669']; for (let i = 0; i < 10; i++) { g.globalAlpha = a * 0.35; g.fillStyle = cores[i % 5]; const a0 = Math.PI + (i * Math.PI) / 10; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, rx * 1.2, a0, a0 + Math.PI / 10); g.closePath(); g.fill(); } g.restore(); g.globalAlpha = a; g.strokeStyle = '#fde68a'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI, TAU); g.stroke(); for (let i = 1; i < 10; i++) { const q = Math.PI + (i * Math.PI) / 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(q) * rx, Math.sin(q) * ry); g.stroke(); } } }); }

// ---------- início de turno (dano/cura contínuos, turno perdido) ----------
function inicioDeTurno(ctx, M, x) {
  if (x.tipo === 'enxameFim') { const v = ctx.campo.querySelector(`[data-enxame="${x.id}"]`); if (v) { v.loop = false; dissolverClipe(ctx, v); } return; }
  if (x.efeito === 'enxame') { // picadas do enxame no começo da rodada
    const el = ctx.no(x.alvo); if (!el) return; const c = corpo(ctx, el);
    rajada(M, c.x, c.y, { n: 12, forma: 'brilho', cor: '#facc15', tam: 3.5, v: 180, vida: 0.5, onda: 4, ondaAmp: 3 });
    reacao(ctx, el, 1, 0.35, '#facc15'); numero(ctx, el, `🐝 ${x.valor}`, '#fde047'); if (x.veneno) numero(ctx, el, '☠️ Veneno', '#a3e635', { pequeno: true, dy: -18 }); ctx.aplicarHp(x.alvo); return;
  }
  const el = ctx.no(x.alvo); if (!el) return; const c = corpo(ctx, el), d = EFEITOS[x.efeito] || {};
  if (x.tipo === 'dot') {
    if (x.efeito === 'queimadura') { rajada(M, c.x, c.pe - c.h * 0.2, { n: 16, forma: 'brasa', cor: '#f97316', cor2: '#fde047', tam: 9, v: 120, sobe: 160, vida: 0.7 }); luz(M, c.x, c.pe, { cor: '#f97316', raio: c.w * 0.8, vida: 0.6 }); }
    else if (x.efeito === 'veneno') { for (let k = 0; k < M.n(10); k++) particula(M, { x: c.x + R(-c.w * 0.3, c.w * 0.3), y: c.y + R(-10, c.h * 0.3), vx: 0, vy: R(-60, -20), forma: 'bolha', cor: '#a3e635', tam: R(3, 7), tamFim: 9, vida: 0.7, atraso: R(0, 0.2) }); }
    else { corte(M, c.x, c.y, { raio: c.w * 0.3, cor: '#dc2626', esp: 7, ang: R(-1, 1), vida: 0.26 }); rajada(M, c.x, c.y, { n: 8, forma: 'gota', cor: '#b91c1c', tam: 3.5, v: 140, grav: 700, sobe: 80, achata: 1, vida: 0.6, atrito: 0.3 }); }
    reacao(ctx, el, 1, 0.4, d.cor); numero(ctx, el, `${(d.icone || '').slice(0, 2)} ${x.valor}`, d.cor || '#fff'); ctx.aplicarHp(x.alvo);
  } else if (x.tipo === 'regen') { for (let k = 0; k < M.n(10); k++) particula(M, { x: c.x + R(-c.w * 0.35, c.w * 0.35), y: c.pe - R(0, 10), vx: 0, vy: R(-120, -60), atrito: 0.5, forma: k % 3 ? 'brilho' : 'folha', cor: '#4ade80', cor2: '#d9f99d', tam: R(4, 7), vida: 0.9 }); numero(ctx, el, `💚 +${x.valor}`, '#4ade80'); ctx.aplicarHp(x.alvo); }
  else if (x.tipo === 'pular') {
    if (x.efeito === 'congelamento') { rajada(M, c.x, c.y, { n: 12, forma: 'caco', cor: '#7dd3fc', cor2: '#f0f9ff', tam: 8, v: 160, grav: 500, vida: 0.7 }); fig(el).animate([{ transform: 'translateX(0)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 260 * ctx.k, iterations: 2 }); }
    else orbitar(M, c.x, c.topo + 6, d.cor || '#fde047', c.w * 0.32, 0);
    numero(ctx, el, `${(d.icone || '').slice(0, 2)} perde o turno`, d.cor || '#fff', { pequeno: true });
  }
}

// ---------- entrada principal ----------
export async function tocarEvento(ctx, ev) {
  injetar(); precarregarRecortes(); const M = camada(ctx); ctx.corCura = corCura(ev.hab?.elemento);
  ctx.poseAtaque = ev.hab ? ev.hab.tipo === 'dano' : ev.tipo === 'atacar'; ctx.no(ev.ator)?._pose?.preparar();
  for (const x of ev.antes || []) inicioDeTurno(ctx, M, x);
  if (ev.antes?.length) await ESP(560 * ctx.k);
  const A = ctx.no(ev.ator); if (!A) return;
  const hab = ev.hab, cfg = hab && FX_HABILIDADES[hab.id], elem = hab?.elemento || 'neutro';
  const E = ELEM[elem] || ELEM.neutro, ult = cfg?.ult || (hab && hab.cd >= 5);
  if (ult && hab) await cutIn(ctx, A, hab, cfg?.cut?.[0] || E.cor, cfg?.cut?.[1] || E.cor2);
  const finalAbyssar = A.dataset.especie === 'Abyssar' && /\/abyssar\/03/.test(A.querySelector('.un-fig img')?.getAttribute('src') || '');
  const varForma = hab && (CLIPES_POR_ESPECIE[A.dataset.especie]?.[hab.id] || (finalAbyssar && CLIPE_ABYSSAR_FINAL[hab.id])); // variação da forma
  const cfgClip = varForma ? { ...(cfg || {}), ...varForma } : cfg || clipeElemental(hab);
  const clip = cfgClip?.clip || hab?.clip; // o clipe publicado tem prioridade sobre o caminho previsto no kit
  const enx = Boolean(hab?.enxame && ev.enxame) && await enxameInicio(ctx, M, A, ev); // abelhas em loop sobre o time alvo
  if (!enx && clip && hab?.tipo === 'dano' && !clipesFalhos.has(clip)) await preparo(ctx, M, A, E.cor, { ms: 220 }); // o atacante se prepara antes do clipe no alvo
  if (enx) { /* enxame já aplicou o golpe */ }
  else if (clip && await tocarClipe(ctx, M, { ...(cfgClip || {}), ult }, ev, clip, A)) { /* clipe tocou */ }
  else if (cfg?.fx && FX[cfg.fx]) await FX[cfg.fx](ctx, M, A, ev, hab);
  else if (ev.tipo === 'reviver') await FX.retornoAlma(ctx, M, A, ev, hab);
  else if (ev.tipo === 'atacar') await genCorpo(ctx, M, A, ev, hab, 'neutro');
  else if (ev.tipo === 'habilidade') { if (ev.area) await genArea(ctx, M, A, ev, hab, elem); else if (hab?.distancia) await genTiro(ctx, M, A, ev, hab, elem); else await genCorpo(ctx, M, A, ev, hab, elem); }
  else if (ev.tipo === 'defender') { const c = corpo(ctx, A); bolhaEscudo(M, c, '#60a5fa', 0, 0.9); onda(M, c.x, c.pe, { cor: '#60a5fa', r1: c.w, vida: 0.5 }); numero(ctx, A, '🛡️ Defesa', '#93c5fd', { pequeno: true }); ctx.aplicarHp(ev.ator); await ESP(520 * ctx.k); }
  else await genApoio(ctx, M, A, ev, hab, elem);
  for (const r of ev.alvos || []) {
    ctx.aplicarHp(r.id);
    const elAlvo = ctx.no(r.id);
    if (!elAlvo) continue;
    if (r.critico) {
      const ca = corpo(ctx, elAlvo);
      onda(M, ca.x, ca.y, { cor: '#fde047', r1: ca.w * 1.4, vida: 0.45 });
      flash(ctx, '#fde047', 110, 0.24);
      tremer(ctx, 8, 220);
      numero(ctx, elAlvo, '💥 CRÍTICO!', '#fde047', { grande: true, dy: -26 });
    }
    if (r.contra) {
      const ca = corpo(ctx, elAlvo);
      onda(M, ca.x, ca.y, { cor: '#38bdf8', r1: ca.w * 1.15, vida: 0.4 });
      numero(ctx, elAlvo, `⚔️ Contra −${r.contra}`, '#7dd3fc', { dy: -16 });
    }
  }
  for (const caEv of ev.contraAtaques || []) {
    const elAlvo = ctx.no(caEv.alvoId || caEv.id);
    if (!elAlvo) continue;
    const ca = corpo(ctx, elAlvo);
    onda(M, ca.x, ca.y, { cor: '#38bdf8', r1: ca.w * 1.25, vida: 0.45 });
    numero(ctx, elAlvo, `⚔️ Contra-ataque${caEv.dano ? ` −${caEv.dano}` : '!'}`, '#7dd3fc', { grande: true, dy: -20 });
    ctx.aplicarHp(caEv.alvoId || caEv.id);
  }
  if (hab?.tipo === 'dano' && (hab.efeitos || []).some((e) => e.id === 'provocacao') && CLIPES_ELEMENTAIS.provocacao) {
    const pc = CLIPES_ELEMENTAIS.provocacao; tocarClipe(ctx, M, { ...pc, impactoMs: 500 }, { tipo: 'apoio', alvos: [], ator: ev.ator, hab: { alvo: 'si', tipo: 'apoio' } }, pc.clip, A).catch(() => {});
  }
  for (const f of ev.fases || []) await furiaChefe(ctx, M, f);
  for (const r of ev.alvos || []) { const n = r.morreu ? ctx.no(r.id) : null; if (n?.dataset?.chefe) await derrotaChefe(ctx, n); }
  // roubo de vida (modo de pânico)
  if (ev.roubo) { const c = corpo(ctx, A); for (const r of ev.alvos || []) { const el = ctx.no(r.id); if (!el) continue; const t = corpo(ctx, el); for (let k = 0; k < M.n(5); k++) projetil(M, t.x + R(-10, 10), t.y + R(-10, 10), c.x, c.y, { tipo: 'orbe', cor: '#dc2626', cor2: '#fecaca', tam: 6, arco: R(20, 60), vida: 0.45, atraso: k * 0.04 }); } numero(ctx, A, `🩸 +${ev.roubo}`, '#86efac', { dy: -20 }); ctx.aplicarHp(ev.ator); }
  A._pose?.mostrar(false); // garante o retorno ao repouso ao fim do evento
  return ev;
}

// VFX dedicado à ação automática do Domador (b.eventoDomador): pulso no retrato, ondas nos alvos e números flutuantes.
export async function tocarEventoDomador(ctx, evDom) {
  if (!evDom) return;
  injetar();
  const M = camada(ctx);
  const elDom = ctx.arena?.querySelector?.('.tb-domador');
  if (elDom) {
    elDom.animate([
      { boxShadow: '0 0 0 0 rgba(251,191,36,.85)', transform: 'scale(1)' },
      { boxShadow: '0 0 22px 4px rgba(251,191,36,.75)', transform: 'scale(1.06)', offset: 0.35 },
      { boxShadow: '0 3px 12px rgba(0,0,0,.55)', transform: 'scale(1)' },
    ], { duration: Math.round(520 * ctx.k) });
  }
  flash(ctx, '#f59e0b', 120, 0.16);
  for (const r of evDom.alvos || []) {
    const elAlvo = ctx.no(r.id);
    if (!elAlvo) continue;
    const c = corpo(ctx, elAlvo);
    const ehCura = (r.cura || 0) > 0 || r.tipo === 'buff';
    const cor = ehCura ? '#4ade80' : '#fbbf24';
    onda(M, c.x, c.y, { cor, r1: c.w * 1.25, vida: 0.5 });
    const txt = r.dano ? `✨ −${r.dano}` : r.cura ? `✨ +${r.cura}` : `✨ ${evDom.hab?.nome || 'Apoio'}`;
    numero(ctx, elAlvo, txt, cor, { grande: Boolean(r.dano), dy: -14 });
    ctx.aplicarHp(r.id);
  }
  await ESP(360 * ctx.k);
}
// Fúria do chefe: tela escurece, faixa com o nome, onda vermelha nos pés, tremor e o número "Fúria!"
async function furiaChefe(ctx, M, f) {
  const B = ctx.no(f.id); if (!B) return;
  ctx.aplicarHp(f.id);
  const c = corpo(ctx, B);
  escurecer(ctx, 'rgba(40,0,6,.66)', 1300);
  await cutIn(ctx, B, { nome: 'Fúria', icone: '👑' }, '#7f1d1d', '#f87171');
  onda(M, c.x, c.pe, { cor: '#ef4444', r1: c.w * 1.6, vida: 0.7 });
  onda(M, c.x, c.pe, { cor: '#fca5a5', r1: c.w * 2.4, vida: 0.9 });
  tremer(ctx, 12, 700); flash(ctx, '#ef4444', 160, 0.3);
  numero(ctx, B, '👑 Fúria!', '#fca5a5', { grande: true });
  await ESP(620 * ctx.k);
}
// Clipe do Flow: toca o vídeo sobre o alvo (ou no centro dos alvos, em habilidades de grupo) e aplica o resultado no impactoMs.
// Devolve false se o vídeo não carregar, para a coreografia procedural assumir.
const clipesFalhos = new Set(); // não tenta de novo um clipe que não carregou nesta sessão
// Bordas suaves em todo clipe: o desvanecer termina na borda do próprio vídeo ou na beira da tela, o que vier antes, para o efeito
// nunca acabar numa linha reta (nem quando o clipe passa da arena). Coordenadas no espaço do vídeo; espelhado inverte esquerda/direita.
function mascaraClipe(ctx, left, top, w, h, espelhado) {
  const W = ctx.campo.clientWidth || w, H = ctx.campo.clientHeight || h;
  let l = Math.max(0, -left), r = Math.min(w, W - left); const t = Math.max(0, -top), b = Math.min(h, H - top);
  if (espelhado) [l, r] = [w - r, w - l];
  const fx = Math.max(24, (r - l) * 0.12), fy = Math.max(20, (b - t) * 0.12);
  const g = `linear-gradient(90deg,transparent ${l}px,#000 ${l + fx}px,#000 ${r - fx}px,transparent ${r}px),linear-gradient(180deg,transparent ${t}px,#000 ${t + fy}px,#000 ${b - fy}px,transparent ${b}px)`;
  return `;-webkit-mask-image:${g};-webkit-mask-composite:source-in;mask-image:${g};mask-composite:intersect`;
}
async function tocarClipe(ctx, M, cfg, ev, src, A = null) {
  if (clipesFalhos.has(src)) return false;
  const els = alvosDe(ctx, ev).map((x) => x.el), base = els.length ? els : [ctx.no(ev.alvo) || ctx.no(ev.ator)].filter(Boolean); if (!base.length) return false;
  const v = await carregarVideo(src); if (!v) return false;
  // ancora: o chão do efeito nos pés do alvo (grupo: no centro da formação, largura cobrindo todos). porAlvo: um clipe em cada alvo.
  const grupos = cfg.porAlvo && base.length > 1 ? base.map((e) => [e]) : [base];
  const vs = [v, ...(await Promise.all(grupos.slice(1).map(() => carregarVideo(src))))].filter(Boolean);
  // Área (todos/aliados): o clipe cai no centro do time inteiro daquele lado (as 4 vagas, vivas ou não) e o EFEITO (não só o quadro
  // do vídeo) cobre a formação toda (caixa medida de cada clipe em regiao1-vfx-caixas.js).
  const emArea = grupos.length === 1 && (base.length > 1 || ['todos', 'aliados'].includes(ev.hab?.alvo));
  const ladoArea = base[0]?.classList.contains('i') ? 'i' : 'a';
  const time = emArea ? [...ctx.campo.querySelectorAll(`.un.${ladoArea}`)].filter((e) => e.isConnected) : [];
  const montar = (grupo, vid) => {
    const prop = vid.videoHeight / vid.videoWidth || 9 / 16;
    let x, larg, top;
    // Cobertura pela caixa real do efeito: em área, a caixa do time inteiro (das cabeças aos pés mais baixos, com margem); no suporte
    // em um alvo, o corpo todo. Efeito de chão (chao): a base do efeito fica nos pés mais baixos; senão, centralizado.
    const cobrir = emArea && time.length ? time : (cfg.chao != null && ev.hab && ev.hab.tipo !== 'dano' ? grupo : null);
    if (cobrir) {
      const cs = cobrir.map((e) => corpo(ctx, e)), [cx0, cy0, cx1, cy1] = caixaDoClipe(src);
      const X0 = Math.min(...cs.map((c) => c.x - c.w / 2)), X1 = Math.max(...cs.map((c) => c.x + c.w / 2)), Y0 = Math.min(...cs.map((c) => c.topo)), Y1 = Math.max(...cs.map((c) => c.pe));
      const mx = (X1 - X0) * 0.08, my = (Y1 - Y0) * 0.1, wT = X1 - X0 + mx * 2, hT = Y1 - Y0 + my * 2;
      larg = Math.max(wT / (cx1 - cx0), hT / ((cy1 - cy0) * prop)); const alt0 = larg * prop;
      x = (X0 + X1) / 2 + larg * (0.5 - (cx0 + cx1) / 2);
      top = cfg.chao != null ? Y1 + my * 0.6 - alt0 * cy1 : (Y0 + Y1) / 2 - alt0 * ((cy0 + cy1) / 2);
    } else {
      const cs = grupo.map((e) => corpo(ctx, e)), pe = Math.max(...cs.map((c) => c.pe)), meio = cs.reduce((s, c) => s + c.y, 0) / cs.length;
      x = cs.reduce((s, c) => s + c.x, 0) / cs.length;
      larg = cs.length > 1 ? (Math.max(...cs.map((c) => c.x + c.w / 2)) - Math.min(...cs.map((c) => c.x - c.w / 2))) * 1.25 : Math.max(...cs.map((c) => c.w)) * (cfg.escala || 3);
      top = cfg.centro != null ? meio - larg * prop * cfg.centro : pe - larg * prop * (cfg.chao ?? 0.86);
    }
    if (emArea) { const W = ctx.campo.clientWidth || 0, l0 = x - larg / 2, r0 = x + larg / 2, lim = larg * 0.18; if (W) { if (l0 < 0 && r0 < W) x += Math.min(-l0, W - r0, lim); else if (r0 > W && l0 > 0) x -= Math.min(r0 - W, l0, lim); } }
    const alt = larg * prop;
    const esp = cfg.espelhar && A && corpo(ctx, A).x > x, left = x - larg / 2, el = cfg.chroma ? telaChroma(vid) : vid; // fundo verde: recorte em canvas
    el.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${larg}px;height:${alt}px;mix-blend-mode:${cfg.chroma ? 'normal' : 'plus-lighter'};filter:${cfg.chroma ? 'none' : 'contrast(1.18) saturate(1.25)'};z-index:${cfg.atras ? 3 : 87};pointer-events:none;opacity:0${mascaraClipe(ctx, left, top, larg, alt, esp)}${esp ? ';transform:scaleX(-1)' : ''}`;
    return { el, v: vid, x, top, alt };
  };
  const pecas = grupos.slice(0, vs.length).map((g, k) => montar(g, vs[k])), { el, x, top, alt } = pecas[0];
  const figAtor = cfg.ocultarAtor && A ? A.querySelector('.un-fig') : null; if (figAtor) figAtor.style.visibility = 'hidden';
  ligarAudio(ctx, v); // o som sai só do primeiro clipe
  for (const pc of pecas) { ctx.campo.append(pc.el); if (pc.el !== pc.v) { pc.el._vivo = true; pc.v.style.display = 'none'; ctx.campo.append(pc.v); } pc.el.animate([{ opacity: 0 }, { opacity: cfg.opacidade ?? 1 }], { duration: 120, fill: 'forwards' }); }
  await Promise.all(pecas.map((pc) => pc.v.play().catch(() => {})));
  if (cfg.voa && A) { // projétil rápido: o clipe sai da boca do atacante e voa até o alvo, chegando no instante da explosão
    const a = corpo(ctx, A), dir = x > a.x ? 1 : -1, b = a.boca(dir), voo = Math.max(250, (cfg.impactoMs || 500) - 230);
    const dx = b.x - x, dy = b.y - (top + alt * (cfg.centro ?? 0.5));
    el.style.transformOrigin = `50% ${(cfg.centro ?? 0.5) * 100}%`;
    el.animate([{ transform: `translate(${dx}px,${dy}px) scale(.35)`, clipPath: 'inset(0 0 42% 0)' }, { transform: 'translate(0,0) scale(1)', clipPath: 'inset(0 0 42% 0)', offset: 0.97 }, { transform: 'translate(0,0) scale(1)', clipPath: 'inset(0 0 0 0)' }], { duration: voo * ctx.k, easing: 'cubic-bezier(.55,0,.85,.4)', fill: 'forwards' });
    projetil(M, b.x, b.y, x, top + alt * (cfg.centro ?? 0.5), { tipo: 'cometa', cor: '#8b5cf6', cor2: '#f5d0fe', tam: 14, arco: 0, vida: voo / 1000, ease: 'linear' }); // rastro do deslocamento
    for (let i = 0; i < 4; i++) setTimeout(() => fantasma(ctx, A, '#8b5cf6'), i * 40 * ctx.k);
  }
  await ESP((cfg.impactoMs || 500) * ctx.k);
  const cura = ev.tipo === 'cura' || ev.tipo === 'apoio' || ev.tipo === 'reviver', somAntes = ctx.som; if (!v.muted) ctx.som = false; // o clipe já traz o som do impacto
  for (const a of alvosDe(ctx, ev)) aplicar(ctx, M, a.el, a.r, { cura, cor: '#fff', forte: cfg.ult });
  ctx.som = somAntes;
  await ESP((cfg.posMs ?? Math.min(1000, Math.max(400, (cfg.duracaoMs || 3000) - (cfg.impactoMs || 500)))) * ctx.k);
  for (const pc of pecas) dissolverClipe(ctx, pc.el, pc.v); // o vídeo segue tocando (ou fica no último quadro) enquanto some; o próximo turno não espera
  if (figAtor) { figAtor.style.visibility = ''; figAtor.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420 * ctx.k, easing: 'ease-out' }); }
  await ESP(140 * ctx.k);
  return true;
}
// Saída do clipe: perde a opacidade aos poucos, escurecendo e expandindo de leve (dissipação); se o vídeo acabar antes, o último
// quadro fica parado e desvanece junto. Remove ao terminar.
function dissolverClipe(ctx, el, v = el) {
  const t = Math.max(0, (v.duration || 0) - v.currentTime) * 1000, ms = Math.max(520, Math.min(900, t || 700)) * ctx.k;
  const o0 = parseFloat(getComputedStyle(el).opacity) || 1;
  const a = el.animate([{ opacity: o0, filter: 'brightness(1)', scale: '1' }, { opacity: o0 * 0.55, filter: 'brightness(.8)', scale: '1.02', offset: 0.45 }, { opacity: 0, filter: 'brightness(.55)', scale: '1.05' }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
  a.finished.catch(() => {}).then(() => { v.pause(); v.remove(); el.remove(); });
}
// Fundo verde chapado: cada quadro do vídeo vai para um canvas com o verde virando transparência (borda suave) e sem respingo verde
// no efeito. O laço para quando o canvas sai da página.
function telaChroma(v) {
  const c = document.createElement('canvas'); c.width = v.videoWidth || 640; c.height = v.videoHeight || 360;
  const g = c.getContext('2d', { willReadFrequently: true });
  const passo = () => {
    if (c._vivo && !c.isConnected) return;
    if (v.readyState >= 2) {
      g.drawImage(v, 0, 0, c.width, c.height); const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const m = Math.max(p[i], p[i + 2]), k = p[i + 1] - m; if (k <= 0) continue;
        p[i + 3] = Math.round(255 * Math.max(0, Math.min(1, 1 - (k - 28) / 60))); p[i + 1] = m + Math.min(k, 12); // alfa pelo excesso de verde; despill
      }
      g.putImageData(d, 0, 0);
    }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo); return c;
}
// ---------- Chefes: entrada (quando a batalha começa) e derrota (quando cai) ----------
// Clipes do lote 7 por elemento; a caixa do efeito cobre o corpo inteiro do chefe (base nos pés). Sem clipe, nada acontece.
const ENTRADA_CHEFE = { luz: 'entrada-luz', eletrico: 'entrada-luz', inseto: 'entrada-inseto', fogo: 'entrada-fogo', agua: 'entrada-agua', voador: 'entrada-vento',
  terra: 'entrada-terra', pedra: 'entrada-pedra', planta: 'entrada-planta', aco: 'entrada-aco', trevas: 'trevas-estilhaco', gelo: 'entrada-gelo', neutro: 'entrada-planta-2', fantasma: 'trevas-estilhaco' };
const ENTRADA_POR_NOME = { 'Urso da Aurora Fraturada': 'entrada-gelo' };
const DERROTA_ESCURA = new Set(['trevas', 'agua', 'pedra', 'aco', 'fantasma']);
export const DURACAO_ENTRADA_CHEFE = 2300, DURACAO_DERROTA_CHEFE = 1700;
async function clipeNoCorpo(ctx, el, arq, { ms = 2000, chao = true, escala = 1.25 } = {}) {
  const src = `${FLOW7}${arq}.mp4`; const v = await carregarVideo(src); if (!v || !el?.isConnected) return;
  const c = corpo(ctx, el), [cx0, cy0, cx1, cy1] = caixaDoClipe(src), prop = v.videoHeight / v.videoWidth || 9 / 16;
  const wT = c.w * escala, hT = c.h * escala, larg = Math.max(wT / (cx1 - cx0), hT / ((cy1 - cy0) * prop)), alt = larg * prop;
  const left = c.x + larg * (0.5 - (cx0 + cx1) / 2) - larg / 2, top = chao ? c.pe + c.h * 0.04 - alt * cy1 : c.y - alt * ((cy0 + cy1) / 2);
  v.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${larg}px;height:${alt}px;mix-blend-mode:plus-lighter;filter:contrast(1.18) saturate(1.25);z-index:87;pointer-events:none;opacity:0${mascaraClipe(ctx, left, top, larg, alt, false)}`;
  ligarAudio(ctx, v); ctx.campo.append(v); v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'forwards' });
  await v.play().catch(() => {}); await ESP(ms * ctx.k); dissolverClipe(ctx, v);
}
export async function entradaChefe(ctx) {
  injetar(); const chefes = [...ctx.campo.querySelectorAll('.un[data-chefe]')]; if (!chefes.length) return 0;
  await Promise.all(chefes.map((el) => clipeNoCorpo(ctx, el, ENTRADA_POR_NOME[el.dataset.especie] || ENTRADA_CHEFE[el.dataset.elemento] || 'entrada-planta-2', { ms: DURACAO_ENTRADA_CHEFE - 300 })));
  return DURACAO_ENTRADA_CHEFE;
}
async function derrotaChefe(ctx, el) {
  const fig = el.querySelector('.un-fig'); if (fig) fig.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 0, filter: 'brightness(2.2)' }], { duration: 900 * ctx.k, fill: 'forwards', easing: 'ease-in' });
  await clipeNoCorpo(ctx, el, DERROTA_ESCURA.has(el.dataset.elemento) ? 'trevas-estilhaco' : 'derrota-luz', { ms: DURACAO_DERROTA_CHEFE - 200, chao: false, escala: 1.15 });
}
// Enxame Dourado: o trecho das abelhas voando (enxame-loop.mp4, emenda sem corte) fica em loop sobre o time alvo, cobrindo os 4,
// até o motor avisar que o enxame acabou (enxameFim). O golpe imediato é aplicado quando o enxame chega.
async function enxameInicio(ctx, M, A, ev) {
  const src = `${FLOW7}enxame-loop.mp4`; const v = await carregarVideo(src); if (!v) return false;
  const lado = ev.enxame.lado, time = [...ctx.campo.querySelectorAll(`.un.${lado}`)]; if (!time.length) return false;
  const cs = time.map((e) => corpo(ctx, e)), [cx0, cy0, cx1, cy1] = caixaDoClipe(src), prop = v.videoHeight / v.videoWidth || 9 / 16;
  const X0 = Math.min(...cs.map((c) => c.x - c.w / 2)), X1 = Math.max(...cs.map((c) => c.x + c.w / 2)), Y0 = Math.min(...cs.map((c) => c.topo)), Y1 = Math.max(...cs.map((c) => c.pe));
  const larg = Math.max(((X1 - X0) * 1.12) / (cx1 - cx0), ((Y1 - Y0) * 1.15) / ((cy1 - cy0) * prop)), alt = larg * prop;
  const left = (X0 + X1) / 2 - larg * ((cx0 + cx1) / 2), top = (Y0 + Y1) / 2 - alt * ((cy0 + cy1) / 2);
  ctx.campo.querySelector(`[data-enxame="${ev.enxame.id}"]`)?.remove();
  v.dataset.enxame = ev.enxame.id; v.loop = true;
  v.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${larg}px;height:${alt}px;mix-blend-mode:screen;z-index:86;pointer-events:none;opacity:0${mascaraClipe(ctx, left, top, larg, alt, false)}`;
  ctx.campo.append(v); v.animate([{ opacity: 0 }, { opacity: 0.95 }], { duration: 380 * ctx.k, fill: 'forwards' });
  await v.play().catch(() => {});
  if (A) await preparo(ctx, M, A, '#facc15', { ms: 220 });
  await ESP(380 * ctx.k);
  for (const a of alvosDe(ctx, ev)) aplicar(ctx, M, a.el, a.r, { cor: '#facc15' });
  await ESP(420 * ctx.k);
  return true;
}
const blobs = new Map(), BLOBS_MAX = 8; // LRU: guarda os 8 clipes mais recentes e libera a memória dos antigos
function guardarBlob(url, fonte) {
  blobs.delete(url); blobs.set(url, fonte);
  while (blobs.size > BLOBS_MAX) { const [velho, f] = blobs.entries().next().value; blobs.delete(velho); try { URL.revokeObjectURL(f); } catch {} }
}
async function carregarVideo(src, inicio = 0) {
  if (clipesFalhos.has(src)) return null;
  const url = /^(https?:|\/|\.\.\/|blob:|data:)/.test(src) ? src : `../../../${src}`;
  let fonte = url; if (inicio) { try { fonte = blobs.get(url) || URL.createObjectURL(await (await fetch(url)).blob()); guardarBlob(url, fonte); } catch { clipesFalhos.add(src); return null; } } // em memória, a busca do ponto de início funciona em qualquer servidor
  const v = document.createElement('video'); v.src = fonte; v.playsInline = true; v.preload = 'auto'; v.muted = true;
  const ok = await new Promise((fim) => { const t = setTimeout(() => fim(false), 2500); v.addEventListener('canplay', () => { clearTimeout(t); fim(true); }, { once: true }); v.addEventListener('error', () => { clearTimeout(t); fim(false); }, { once: true }); v.load(); });
  if (!ok) { clipesFalhos.add(src); return null; }
  if (inicio) { // espera o trecho carregar (servidores sem Range só deixam buscar no que já baixou) e então busca o ponto de início
    for (let t = 0; t < 40 && !(v.buffered.length && v.buffered.end(v.buffered.length - 1) >= inicio + 0.3); t++) await ESP(50);
    v.currentTime = inicio; await new Promise((fim) => { v.addEventListener('seeked', fim, { once: true }); setTimeout(fim, 800); });
    if (v.currentTime < inicio - 0.2) { clipesFalhos.add(src); return null; } // sem conseguir pular o corte, não usa a tomada
  }
  return v;
}
// Áudio do clipe: volume da preferência, mudo com a aba oculta ou volume zero; ×2/×3 aceleram o clipe junto com o resto
function ligarAudio(ctx, v) { v.playbackRate = 1 / ctx.k; v.muted = !ctx.som || pref.volume <= 0; v.volume = Math.min(1, pref.volume); v.preservesPitch = true; }
// Tomada cinematográfica dos meteoros (tela inteira, composição normal por causa do cenário)
async function cinemaMeteoros(ctx) {
  const c = METEOROS_CINEMA, v = await carregarVideo(c.clip, c.inicio); if (!v) return null;
  v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:89;pointer-events:none;opacity:0';
  ligarAudio(ctx, v); ctx.arena.append(v); v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 * ctx.k, fill: 'forwards' });
  await v.play().catch(() => {}); await ESP(c.impactoMs * ctx.k);
  return { fim: async () => { await ESP(Math.max(0, c.duracaoMs - c.impactoMs - 900) * ctx.k); await v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420 * ctx.k, fill: 'forwards' }).finished.catch(() => {}); v.pause(); v.remove(); }, comSom: !v.muted };
}
// Duração aproximada (para o ritmo do automático). Precisa cobrir a coreografia inteira.
export const duracaoEstimada = (ev, rapido = false, velocidade = pref.velocidade) => {
  if (!ev) return 0; const k = 1 / velocidade, hab = ev.hab, cfg = hab && FX_HABILIDADES[hab.id], n = ev.alvos?.length || 0;
  const formaFinal = hab && /\/abyssar\/03/.test(ev.arteAtor || '') && CLIPE_ABYSSAR_FINAL[hab.id];
  if (formaFinal) return (formaFinal.impactoMs + 220 + (formaFinal.posMs ?? Math.min(1000, Math.max(400, formaFinal.duracaoMs - formaFinal.impactoMs))) + 240 + (formaFinal.ult ? 820 : 0) + (ev.antes?.length ? 560 : 0)) * k;
  const ult = cfg?.ult || (hab && hab.cd >= 5);
  let base;
  if (cfg?.fx === 'perseguicao') base = Math.max(700 + n * 215 + (ev.repeticoes || 0) * 160, 2200);
  else if (hab?.enxame && ev.enxame) base = 1450;
  else if (cfg?.clip) base = cfg.impactoMs + (cfg.posMs ?? Math.min(1000, Math.max(400, (cfg.duracaoMs || 3000) - cfg.impactoMs))) + 200 + (hab.tipo === 'dano' ? 220 : 0); // clipe: impacto, tempo depois e saída
  else if (cfg) base = cfg.ms + Math.max(0, n - 1) * 130;
  else if (clipeElemental(hab)) { const c = clipeElemental(hab); base = c.impactoMs + Math.min(1000, Math.max(400, c.duracaoMs - c.impactoMs)) + 240 + (hab.tipo === 'dano' ? 220 : 0); }
  else if (ev.tipo === 'atacar') base = 1250;
  else if (ev.tipo === 'habilidade' && ev.area) { const el = hab?.elemento; base = el === 'terra' || el === 'pedra' ? 1950 : el === 'agua' ? 1800 : el === 'fogo' ? 1250 + n * 170 : el === 'planta' ? 1400 + n * 120 : 1150 + n * 110; }
  else if (ev.tipo === 'habilidade') base = hab?.distancia ? 1400 : 1300;
  else if (ev.tipo === 'reviver') base = FX_HABILIDADES.retorno_alma.ms;
  else if (ev.tipo === 'defender') base = 650;
  else base = 1250 + n * 90;
  return (base + (ult ? 820 : 0) + (ev.antes?.length ? 560 : 0) + (ev.fases?.length || 0) * 1430 + (ev.alvos || []).filter((r) => r.morreu && r.chefe).length * DURACAO_DERROTA_CHEFE) * k;
};
