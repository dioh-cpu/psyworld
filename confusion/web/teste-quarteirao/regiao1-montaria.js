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
    // Recortes do PR #65 (vídeo 1080p, grade 4×2): folhas de caminhada e quadros de repouso com transparência; a grade, o topo e a
    // linha dos cascos estão em brumacervo.json (gerado no recorte)
    clipes: { tipo: 'folha', meta: 'brumacervo.json' },
    base: 'assets/characters/montado/brumacervo/',
    alturaRelativa: 1.3, // altura do conjunto (cabeça do domador até os cascos) em relação ao domador a pé
  },
};
// Equipamento (contrato com as regras): save.idle.montaria = id equipado; posse em save.idle.colecao.montarias (prêmios do Passe, #58).
// O Brumacervo é a montaria do domador e dispensa posse. Id sem apresentação cadastrada (ex.: montarias do Passe ainda sem clipes)
// fica equipado, mas o domador aparece a pé.
export const montariasPossuidas = (save) => ['brumacervo', ...(Array.isArray(save?.idle?.colecao?.montarias) ? save.idle.colecao.montarias : [])];
// Sem escolha gravada, o domador usa o Brumacervo (decisão: domador montado visivelmente); null/'' grava a escolha de andar a pé.
export const montariaEquipada = (save) => { const v = save?.idle?.montaria; const id = v === undefined ? 'brumacervo' : v; return id && montariasPossuidas(save).includes(id) ? id : null; };
export const apresentacaoMontaria = (save) => { const id = montariaEquipada(save); return id && MONTARIAS[id] ? MONTARIAS[id] : null; };
// Montado de verdade só quando a montaria está equipada e os clipes estão prontos; senão, a pé.
export const montadoVisivel = (save) => Boolean(apresentacaoMontaria(save)?.clipes);
export const multVelocidade = (save) => (montadoVisivel(save) ? apresentacaoMontaria(save).velocidade : 1);
