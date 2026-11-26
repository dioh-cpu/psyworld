// Mundo: junta os 50 sistemas do catálogo, passa o contexto cruzado entre eles e expõe as ações.
import { SISTEMAS_01, protecaoContraPragas } from './sistemas-01.js';
import { SISTEMAS_11 } from './sistemas-11.js';
import { SISTEMAS_21 } from './sistemas-21.js';
import { SISTEMAS_31 } from './sistemas-31.js';
export { EQUIPAMENTOS } from './sistemas-31.js';
import { SISTEMAS_41 } from './sistemas-41.js';
import { resultadoVazio, somarResultado } from './util.js';

export const SISTEMAS = [...SISTEMAS_01, ...SISTEMAS_11, ...SISTEMAS_21, ...SISTEMAS_31, ...SISTEMAS_41];
const porId = Object.fromEntries(SISTEMAS.map((s) => [s.id, s]));

export function criarMundo() {
  return Object.fromEntries(SISTEMAS.map((s) => [s.id, s.criar()]));
}

// Carrega o estado salvo. Saves de antes da campanha (cidades fundadas pelo jogador) recomeçam só o sistema 31.
export function carregarMundo(salvo) {
  const m = { ...criarMundo(), ...(salvo || {}) };
  if (!m['31'].cidades) m['31'] = porId['31'].criar();
  return m;
}

// Valores que um sistema pode precisar de outro. Calculados a partir do estado antes de cada rodada.
function cruzados(estado, ctx) {
  const construcoes = (estado['05']?.refugios.length || 0)
    + (estado['48']?.canais || 0) + (estado['29']?.monumentos || 0);
  return {
    ...ctx,
    protecaoPragas: protecaoContraPragas(estado['05']),
    reputacao: estado['03'],
    pragaAtiva: Boolean(estado['15']?.ativa),
    pragaNivel: estado['15']?.ativa ? (estado['15'].nivel || 0) : 0,
    reliquiaRestaurada: estado['19']?.estado === 'restaurada',
    temBarco: estado['18']?.barco || false,
    chefesDerrotados: Object.values(estado['11']?.chefes || {}).filter((e) => e !== 'vivo').length,
    eventosHistoricos: estado['27']?.registro.length || 0,
    construcoes,
  };
}

// Uma rodada de dia: todos os sistemas avançam e os efeitos se somam.
export function diaMundo(estado, ctx) {
  const c = cruzados(estado, ctx);
  const acc = resultadoVazio();
  for (const s of SISTEMAS) somarResultado(acc, s.dia(estado[s.id], c));
  return acc;
}

// Uma ação do jogador em um sistema. args vêm da escolha (ex.: opção do sonho, profissão).
export function acaoMundo(estado, sistemaId, acaoId, args, ctx) {
  const s = porId[sistemaId];
  const a = s?.acoes?.[acaoId];
  if (!a) return { notas: ['Ação desconhecida.'], efeitos: {} };
  const res = a.fn(estado[s.id], cruzados(estado, ctx), args || {}) || { notas: [], efeitos: {} };
  // Um sistema pode pedir uma cicatriz para o sistema 24 (ele não muda o estado de outro sistema diretamente).
  if (res.cicatriz) {
    const c = estado['24'];
    c.cicatrizes = [...c.cicatrizes, { origem: res.cicatriz, dias: 0, superada: false }].slice(-6);
  }
  return res;
}

// Escolhas que uma ação precisa (ex.: responder um sonho). Chave: "sistema.acao".
export const OPCOES_ACAO = {
  '14.responder': (estado) => (estado['14'].sonho ? estado['14'].sonho.opcoes.map((o, i) => ({ rotulo: o, args: { opcao: i } })) : []),
  '20.praticar': () => ['cozinheiro', 'ferreiro', 'alquimista', 'fazendeiro'].map((p) => ({ rotulo: p, args: { profissao: p } })),
  '27.provocar_evento': () => ['fundacao', 'revolta', 'descoberta'].map((e) => ({ rotulo: e, args: { evento: e } })),
};

export const resumoMundo = (estado) => SISTEMAS.map((s) => `${s.id} ${s.nome}: ${s.resumo(estado[s.id])}`);
