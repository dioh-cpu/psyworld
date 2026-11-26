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
export const montariaEquipada = (save) => { const id = save?.idle?.montaria; return id && MONTARIAS[id] ? id : null; };
// Montado de verdade só quando a montaria está equipada e os clipes estão prontos; senão, a pé.
export const montadoVisivel = (save) => { const id = montariaEquipada(save); return Boolean(id && MONTARIAS[id].clipes); };
export const multVelocidade = (save) => (montadoVisivel(save) ? MONTARIAS[montariaEquipada(save)].velocidade : 1);
