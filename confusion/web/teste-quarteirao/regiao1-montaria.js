// Domador montado (substitui a antiga transformação Azazel ↔ Noctarn). Montaria e Onírico aliado são entidades separadas:
// a montaria só muda como o domador aparece e anda no mapa; a equipe de batalha não é afetada.
// Seleção/equipamento e dados da montaria vêm das regras (save.idle.montaria = id da montaria equipada). Aqui ficam só a
// apresentação e o contrato visual dos clipes. Enquanto os clipes finais do Flow não estiverem prontos (recortados, com alfa
// ou chroma tratado), o domador aparece a pé com o sprite atual: nenhum MP4 de fundo verde é carregado sem o recorte.
export const MONTARIAS = {
  brumacervo: {
    nome: 'Brumacervo',
    velocidade: 2.0, // multiplicador de movimento quando montado (mesmo ganho da antiga Conexão Onírica)
    // Clipes do domador montado (Azazel no Brumacervo): preencher quando o pacote Confusion-Flow-Azazel estiver recortado.
    // Formato esperado (igual ao Azazel a pé): repouso-<dir> e caminhada-<dir> com dir ∈ frente, esquerda, costas (direita = espelho),
    // fundo transparente (WebM VP9 com alfa ou PNG em folha) ou chroma #11E720 com despill; pés/cascos na mesma linha de base.
    clipes: null,
    base: 'assets/characters/montado/brumacervo/',
    quadro: { largura: 960, altura: 540, topo: 26, pe: 513 }, // topo da cabeça do domador e linha dos cascos
    alturaRelativa: 1.45, // altura total (domador + montaria) em relação ao domador a pé
  },
};
// Equipamento (contrato com as regras): save.idle.montaria = id equipado; posse em save.idle.colecao.montarias (prêmios do Passe, #58).
// O Brumacervo é a montaria do domador e dispensa posse. Id sem apresentação cadastrada (ex.: montarias do Passe ainda sem clipes)
// fica equipado, mas o domador aparece a pé.
export const montariasPossuidas = (save) => ['brumacervo', ...(Array.isArray(save?.idle?.colecao?.montarias) ? save.idle.colecao.montarias : [])];
export const montariaEquipada = (save) => { const id = save?.idle?.montaria; return id && montariasPossuidas(save).includes(id) ? id : null; };
export const apresentacaoMontaria = (save) => { const id = montariaEquipada(save); return id && MONTARIAS[id] ? MONTARIAS[id] : null; };
// Montado de verdade só quando a montaria está equipada e os clipes estão prontos; senão, a pé.
export const montadoVisivel = (save) => Boolean(apresentacaoMontaria(save)?.clipes);
export const multVelocidade = (save) => (montadoVisivel(save) ? apresentacaoMontaria(save).velocidade : 1);
