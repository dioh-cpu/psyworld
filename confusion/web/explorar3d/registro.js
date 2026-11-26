// Painel de espólios da exploração. Recebe a mesma lista que a tela de batalha 2D monta:
// cada item é { icone, nome, qtd, cor }. Código puro, sem DOM.

// Itens com quantidade positiva, com o valor já formatado. O primeiro vem marcado,
// como a linha selecionada na tela de referência.
export function linhasDoRegistro(itens) {
  return (itens || []).filter((i) => i.qtd > 0).map((i, k) => ({
    icone: i.icone,
    nome: i.nome,
    cor: i.cor,
    valor: `+${i.qtd}`,
    selecionado: k === 0,
  }));
}

// Exemplo para ver o painel sem batalha (o link com #espolio mostra este exemplo).
export const EXEMPLO_ESPOLIO = [
  { icone: '★', nome: 'Monstrinho capturado', qtd: 1, cor: 'mon' },
  { icone: '▲', nome: 'XP do passe', qtd: 16, cor: 'passe' },
  { icone: '●', nome: 'Gold', qtd: 50, cor: 'gold' },
  { icone: '▣', nome: 'Cápsula de PV I', qtd: 1, cor: 'recurso' },
];
