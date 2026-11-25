// Liberação gradual dos sistemas do Mundo: cada missão da campanha, ao ser concluída, apresenta alguns sistemas.
// Só a interface é afetada: o mundo continua simulando os 50 sistemas por baixo. Dados por região (esta é a da Região 1).
import { QUESTS_POR_ID } from './regiao1-estado.js';

export const LIBERACAO_R1 = {
  q_pegadas: ['01'],
  q_mare_devolveu: ['07', '10'],
  q_ultimo_trem: ['02'],
  q_primeira_partida: ['04'],
  q_guarda_arco: ['06'],
  q_sal_raizes: ['03'],
  q_mulher_mata: ['22'],
  q_coracao_mata: ['26'],
  q_boss_e: ['11', '05'],
  q_acima_mare: ['09'],
  q_floresta_respira: ['15'],
  q_trilha_esporos: ['41'],
  q_enseada_lanternas: ['18'],
  q_boss_d: ['20', '12'],
  q_saida_pedras: ['19'],
  q_mare_esconde: ['40'],
  q_canto_agua: ['36'],
  q_boss_s: ['08', '17'],
  q_brilho_rocha: ['46'],
  q_eco_quartzo: ['14'],
  q_salao_ametista: ['13'],
  q_boss_c: ['35', '30'],
  q_tp_e8: ['21', '25'],
  q_tp_d9: ['23', '27'],
  q_tp_c1: ['16', '24'],
  q_tp_pc7: ['29', '33'],
  q_tp_cc7: ['34', '28'],
  q_sec_canteiro: ['31', '48', '45'],
  q_sec_entrega: ['37', '38', '39', '42', '43', '44', '47', '49', '50', '32'],
};
const concluida = (save, q) => save?.quests?.[q] === 'concluida';
export function sistemasLiberados(save, tabela = LIBERACAO_R1) {
  return new Set(Object.entries(tabela).filter(([q]) => concluida(save, q)).flatMap(([, s]) => s));
}
// Dica do próximo: a primeira missão da campanha, na ordem da tabela, que ainda não foi concluída
export function proximaLiberacao(save, tabela = LIBERACAO_R1) {
  for (const [q, s] of Object.entries(tabela)) if (!concluida(save, q)) return { quest: q, titulo: QUESTS_POR_ID[q]?.titulo || q, sistemas: s };
  return null;
}
// Tutorial do primeiro acesso, montado do próprio sistema: para que serve, onde tocar e a primeira ação
export function tutorialDoSistema(sis) {
  const acoes = Object.values(sis.acoes || {});
  const passivo = acoes.length === 0;
  return {
    passivo,
    serve: `${sis.nome}: ${sis.referencia ? sis.referencia : 'sistema vivo do mundo'}.`,
    onde: passivo ? 'Este sistema é passivo: avança sozinho a cada dia. Acompanhe o efeito no quadro Estado e nos Últimos eventos, logo abaixo.' : 'Toque em um botão da seção Ações (destacada) para agir sobre este sistema.',
    primeira: passivo ? 'Volte depois de alguns dias do mundo e veja o que mudou no quadro Estado.' : `Primeira ação sugerida: "${acoes[0].rotulo}".`,
  };
}
