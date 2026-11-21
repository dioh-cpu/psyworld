// Pontos de vista da câmera da batalha. Código puro, sem three.js: a cena 3D só suaviza a passagem de uma vista para a outra.
// Os dois monstrinhos ficam na arena, de frente um para o outro. A câmera fica sempre do lado de cá (z positivo).
export const POSICAO = {
  jogador: { x: -2.5, y: 0, z: 1.3 },   // à esquerda e mais perto da câmera
  inimigo: { x: 2.5, y: 0, z: -0.7 },   // à direita e mais ao fundo
};
const MEIO_CORPO = 1.1;   // altura do ponto que a câmera mira num monstrinho

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
