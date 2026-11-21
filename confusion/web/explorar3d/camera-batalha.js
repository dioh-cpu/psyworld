// Pontos de vista da câmera da batalha. Código puro, sem three.js: a cena 3D só suaviza a passagem de uma vista para a outra.
// Até 3 aliados ficam à esquerda e até 3 inimigos à direita. A câmera fica sempre do lado de cá (z positivo).
const MEIO_CORPO = 1.1;   // altura do ponto que a câmera mira num lutador

// Posições dos aliados, na ordem do time (o da frente é o primeiro).
export const POSICOES_ALIADOS = [
  { x: -2.9, y: 0, z: 1.2 },
  { x: -4.0, y: 0, z: -0.4 },
  { x: -2.2, y: 0, z: -1.9 },
];

// Posições dos inimigos conforme quantos são (1, 2 ou 3): o grupo fica centralizado à direita.
export const POSICOES_INIMIGOS = [
  [{ x: 2.5, y: 0, z: -0.7 }],
  [{ x: 3.0, y: 0, z: 0.6 }, { x: 2.0, y: 0, z: -2.0 }],
  [{ x: 2.6, y: 0, z: 1.2 }, { x: 3.8, y: 0, z: -0.6 }, { x: 2.0, y: 0, z: -2.6 }],
];

export const posicaoDoInimigo = (quantidade, i) => {
  const grupo = POSICOES_INIMIGOS[Math.min(3, Math.max(1, quantidade)) - 1];
  return grupo[Math.min(i, grupo.length - 1)];
};

// Um só lutador de cada lado (como era antes): usado pela vista de abertura e de vitória.
export const POSICAO = {
  jogador: POSICOES_ALIADOS[0],
  inimigo: POSICOES_INIMIGOS[0][0],
};

// pos: onde a câmera fica; olha: para onde mira; fov: campo de visão vertical em graus.
export const VISTAS = {
  panoramica: { pos: [0, 4.4, 10.8], olha: [0, 0.8, 0], fov: 46 },
  abertura: { pos: [0, 7.5, 15], olha: [0, 1.0, 0], fov: 52 },
  // o foco aproxima quem age, mas o outro lutador continua na tela (o olhar fica entre os dois, puxado para quem age)
  'foco-jogador': { pos: [-1.2, 2.3, 7.4], olha: [POSICAO.jogador.x * 0.5, MEIO_CORPO, 0.6], fov: 42 },
  'foco-inimigo': { pos: [1.4, 2.4, 7.0], olha: [POSICAO.inimigo.x * 0.5, MEIO_CORPO, -0.3], fov: 42 },
  vitoria: { pos: [-3.6, 0.9, 4.2], olha: [POSICAO.jogador.x + 0.2, 1.4, POSICAO.jogador.z], fov: 38 },
  derrota: { pos: [0, 5.6, 11], olha: [0, 0.9, 0], fov: 50 },
};

export function vistaDaCamera(modo) {
  const v = VISTAS[modo];
  if (!v) throw new Error(`vista desconhecida: ${modo}`);
  return v;
}

// Vista de foco sobre quem age.
export const modoDoFoco = (lado) => (lado === 'jogador' ? 'foco-jogador' : 'foco-inimigo');

// Vista presa num lutador (o alvo escolhido): a câmera fica do lado de cá e mira o meio do corpo dele.
// Os outros lutadores podem sair da tela; o alvo é o que importa nesse momento.
export function vistaDoAlvo(p) {
  return { pos: [p.x * 0.45 - 0.8, 2.4, p.z + 6.6], olha: [p.x * 0.6, MEIO_CORPO, p.z], fov: 40 };
}
