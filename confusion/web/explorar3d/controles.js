// Controle de toque: vetor do joystick virtual. Funções puras, sem DOM, testáveis no node.

// dx, dy: deslocamento do dedo a partir do centro do joystick, em pixels (y cresce para baixo).
// raio: raio útil do joystick em pixels. morta: zona morta, em fração do raio.
// Devolve { x, z }: x para a direita, z para a frente (para cima na tela). A norma fica entre 0 e 1.
export function vetorJoystick(dx, dy, raio, morta = 0.15) {
  const d = Math.hypot(dx, dy);
  if (d < 1e-6 || raio <= 0) return { x: 0, z: 0 };
  const k = Math.min(d, raio) / raio;
  if (k <= morta) return { x: 0, z: 0 };
  const f = (k - morta) / (1 - morta);
  return { x: (dx / d) * f, z: (-dy / d) * f };
}
