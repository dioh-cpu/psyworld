// Dados do modo Estratégia para o Reino 2 (Altos do Âmbar). Monta rotas a partir do elenco em ../reinos.js: cada área é uma rota de 3 fases.
// A forma do inimigo é definida pela fase do encontro (01 base, 02 intermediária, 03 final), não pelo nível de combate.
import { ESTRATEGIA_C1 } from './regiao1-estrategia-c1.js';
import { REINOS, elencoDaArea, linhagensDoReino } from '../reinos.js';

const TROCA = { madeira: 'mel', pedra: 'cera' };
const trocaCusto = (c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [TROCA[k] || k, Math.round(v * 1.4)]));
const PAPEL_DO_TIPO = { inseto: 'ataque', fogo: 'ataque', eletrico: 'ataque', voador: 'ataque', aco: 'defesa', pedra: 'defesa', terra: 'defesa', planta: 'suporte', agua: 'suporte' };

const AREAS = {
  apiarios: { mat: 'mel', sec: 'cera', fases: ['Colmeias baixas', 'Corredor de favos', 'Rainha dos zangões'] },
  falesias: { mat: 'mel', sec: 'cera', fases: ['Beira do penhasco', 'Ninhos suspensos', 'Cume ventoso'] },
  cristas: { mat: 'cera', sec: 'mel', fases: ['Pastos eriçados', 'Crista de raios', 'Olho da tempestade'] },
  fornos: { mat: 'cera', sec: 'mel', fases: ['Pátio dos fornos', 'Galeria de cera quente', 'Caldeirão âmbar'] },
  ruinas: { mat: 'cera', sec: 'mel', fases: ['Portão de bronze', 'Salão oxidado', 'Cofre dourado'] },
};
const NIVEIS = [[3, 4], [4, 6], [6, 8]], QTD = [[2, 3], [3, 4], [4, 5]], FAIXA = [[12, 16], [17, 23], [24, 32]], SEC = [[2, 4], [3, 5], [4, 6]];

const rotas = Object.entries(REINOS[2].areas).map(([id, a]) => {
  const cfg = AREAS[id], nomes = elencoDaArea(2, id).map((l) => l.nome);
  return {
    id, nome: a.nome, icone: a.icone, arena: `assets/confusion/interface/estrategia/reinos/02/arena-${id === 'apiarios' ? 'apiarios' : id === 'falesias' ? 'falesias' : id === 'cristas' ? 'cristas' : id === 'fornos' ? 'fornos' : 'ruinas'}.webp`, material: cfg.mat, descricao: `Inimigos de ${a.tipos.join(', ')}. As formas evoluem a cada fase da rota.`,
    fases: cfg.fases.map((nome, i) => ({ nome, inimigos: QTD[i], nivel: NIVEIS[i], especies: nomes, material: { tipo: cfg.mat, faixa: FAIXA[i] }, secundario: { tipo: cfg.sec, faixa: SEC[i] }, libera: { inimigo: nomes[(i * 2) % nomes.length] } })),
  };
});

export const ESTRATEGIA_R2 = {
  ...ESTRATEGIA_C1,
  id: 'r2', titulo: 'Altos do Âmbar (Reino 2)', fundo: 'assets/confusion/interface/estrategia/reinos/02/cidade-conceito.webp',
  desbloqueio: { de: 'r1', terrenos: 30, texto: 'Tenha 30 terrenos distintos do Reino 1 com prédios concluídos.' },
  prosperidadeBase: 30,
  materiais: { mel: { nome: 'Mel', icone: '🍯' }, cera: { nome: 'Cera', icone: '🕯️' } },
  inicial: { mel: 0, cera: 0 },
  vagasIniciais: 3,
  papeis: Object.fromEntries(linhagensDoReino(2).map((l) => [l.nome, PAPEL_DO_TIPO[l.elemento] || 'ataque'])),
  estruturas: ESTRATEGIA_C1.estruturas.map((e) => ({ ...e, custo: trocaCusto(e.custo), producao: e.producao && { ...e.producao, tipo: TROCA[e.producao.tipo] } })),
  gestao: {
    vagasObra: 2, capacidade: { mel: 200, cera: 200 }, capProducaoHoras: 8, filaFabricacao: 3,
    receitas: [
      { id: 'balsamo', nome: 'Bálsamo', icone: '🧴', insumos: { mel: 2, cera: 1 }, saida: { balsamo: 1 }, seg: 30 },
      { id: 'vela', nome: 'Vela de cera', icone: '🕯️', insumos: { cera: 2 }, saida: { vela: 1 }, seg: 20 },
    ],
    itens: { balsamo: { nome: 'Bálsamo', icone: '🧴' }, vela: { nome: 'Vela de cera', icone: '🕯️' } },
  },
  rotas,
  // arte da forma pela fase do encontro
  arteInimigo: (especie, faseIdx) => linhagensDoReino(2).find((l) => l.nome === especie)?.formas[Math.min(2, faseIdx)],
};
