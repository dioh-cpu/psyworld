// Pontos de vista da câmera da batalha. Código puro, sem three.js: a cena 3D só suaviza a passagem de uma vista para a outra.
// Os dois monstrinhos ficam na arena, de frente um para o outro. A câmera fica sempre do lado de cá (z positivo).
export const POSICAO = {
  jogador: { x: -1.7, y: 0, z: 0.2 },
  inimigo: { x: 1.7, y: 0, z: -0.2 },
};
const MEIO_CORPO = 1.3;   // altura do ponto que a câmera mira num monstrinho

// pos: onde a câmera fica; olha: para onde mira; fov: campo de visão vertical em graus.
export const VISTAS = {
  panoramica: { pos: [0, 3.4, 8.4], olha: [0, 1.0, 0], fov: 46 },
  abertura: { pos: [0, 6.5, 13], olha: [0, 0.9, 0], fov: 52 },
  // o foco aproxima quem age, mas o outro lutador continua na tela (o olhar fica entre os dois, puxado para quem age)
  'foco-jogador': { pos: [-0.5, 1.9, 5.2], olha: [POSICAO.jogador.x * 0.55, MEIO_CORPO, 0.1], fov: 44 },
  'foco-inimigo': { pos: [0.5, 1.9, 5.2], olha: [POSICAO.inimigo.x * 0.55, MEIO_CORPO, -0.1], fov: 44 },
  vitoria: { pos: [-3.0, 0.9, 3.2], olha: [POSICAO.jogador.x + 0.1, 1.5, 0.1], fov: 36 },
  derrota: { pos: [0, 4.6, 9.5], olha: [0, 0.9, 0], fov: 50 },
};

export function vistaDaCamera(modo) {
  const v = VISTAS[modo];
  if (!v) throw new Error(`vista desconhecida: ${modo}`);
  return v;
}

// Vista de foco sobre quem age.
export const modoDoFoco = (lado) => (lado === 'jogador' ? 'foco-jogador' : 'foco-inimigo');
