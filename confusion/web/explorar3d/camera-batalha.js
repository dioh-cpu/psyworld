// Pontos de vista da câmera da batalha. Código puro, sem three.js: a cena 3D só suaviza a passagem de uma vista para a outra.
// Visão isométrica, de cima: os aliados ficam perto da câmera, de costas para ela, e os inimigos ao fundo, de frente.
// A arena se espalha pela altura da tela, que no celular é a dimensão que sobra.
const MEIO_CORPO = 1.1;   // altura do ponto que a câmera mira num lutador

// Aliados: o da frente é o primeiro (slot 0); os outros dois ficam atrás dele, em triângulo.
export const POSICOES_ALIADOS = [
  { x: 0.0, y: 0, z: 1.9 },
  { x: -1.8, y: 0, z: 0.6 },
  { x: 1.8, y: 0, z: 0.6 },
];

// Inimigos conforme quantos são (1, 2 ou 3): ficam ao fundo da arena, de frente para a câmera.
export const POSICOES_INIMIGOS = [
  [{ x: 0.0, y: 0, z: -1.8 }],
  [{ x: -1.8, y: 0, z: -1.6 }, { x: 1.8, y: 0, z: -2.4 }],
  [{ x: -2.1, y: 0, z: -1.5 }, { x: 0.0, y: 0, z: -2.6 }, { x: 2.1, y: 0, z: -1.5 }],
];

export const posicaoDoInimigo = (quantidade, i) => {
  const grupo = POSICOES_INIMIGOS[Math.min(3, Math.max(1, quantidade)) - 1];
  return grupo[Math.min(i, grupo.length - 1)];
};

// Um só lutador de cada lado: usado pela vista de abertura, de vitória e de derrota.
export const POSICAO = {
  jogador: POSICOES_ALIADOS[0],
  inimigo: POSICOES_INIMIGOS[0][0],
};

// pos: onde a câmera fica; olha: para onde mira; fov: campo de visão vertical em graus.
export const VISTAS = {
  panoramica: { pos: [0, 7.8, 6.8], olha: [0, 0.4, -0.6], fov: 52 },
  abertura: { pos: [0, 11.8, 12.6], olha: [0, 0.4, -0.6], fov: 52 },
  // o foco aproxima quem age; o outro lado continua na tela (o olhar fica entre os dois)
  'foco-jogador': { pos: [-0.6, 6.2, 7.0], olha: [0, 1.0, 0.6], fov: 50 },
  'foco-inimigo': { pos: [0.6, 6.2, 6.0], olha: [0, 1.0, -1.4], fov: 50 },
  vitoria: { pos: [-3.4, 1.0, 5.4], olha: [0, 1.2, 1.0], fov: 40 },
  derrota: { pos: [0, 11.0, 9.8], olha: [0, 0.4, -0.6], fov: 54 },
};

export function vistaDaCamera(modo) {
  const v = VISTAS[modo];
  if (!v) throw new Error(`vista desconhecida: ${modo}`);
  return v;
}

// Vista de foco sobre quem age.
export const modoDoFoco = (lado) => (lado === 'jogador' ? 'foco-jogador' : 'foco-inimigo');

// Vista presa num lutador (o alvo escolhido): isométrica, do lado de cá, mirando o meio do corpo dele.
// Os outros lutadores podem sair da tela; o alvo é o que importa nesse momento.
export function vistaDoAlvo(p) {
  return { pos: [p.x * 0.4 - 0.6, 6.8, p.z + 6.8], olha: [p.x * 0.6, MEIO_CORPO, p.z], fov: 46 };
}
