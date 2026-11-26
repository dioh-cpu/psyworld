// Progressão sem teto (Domador e Oníricos). Até o nível 20 a curva é idêntica à do núcleo, então os saves antigos ficam no mesmo nível.
// Depois do 20 a curva continua crescendo de forma linear, sem limite. O nível 300 é a referência do último andar da Torre.
export const xpPara = (n) => 30 + 10 * n;                                   // XP entre o nível n e o seguinte
export const xpTotal = (n) => (n <= 1 ? 0 : 30 * (n - 1) + 5 * (n - 1) * n);  // soma fechada de xpPara(1..n-1)
export function nivelDe(xp) {                                               // inverso de xpTotal (sem laço longo)
  const x = Math.max(0, xp || 0); let n = Math.max(1, Math.floor((-25 + Math.sqrt(625 + 20 * x)) / 10) + 1);
  while (xpTotal(n + 1) <= x) n++; while (n > 1 && xpTotal(n) > x) n--; return n;
}
// Soma XP preservando o excedente: sobe quantos níveis couberem e guarda o resto
export function aplicarXp(obj, xp) {
  const antes = obj.nivel || nivelDe(obj.xp || 0);
  obj.xp = Math.max(obj.xp || 0, xpTotal(antes)) + Math.max(0, Math.round(xp));
  obj.nivel = nivelDe(obj.xp);
  return { antes, depois: obj.nivel, subiu: obj.nivel - antes, sobra: obj.xp - xpTotal(obj.nivel), proximo: xpPara(obj.nivel) };
}
export const previsaoXp = (obj, xp) => { const c = { nivel: obj.nivel, xp: obj.xp }; return aplicarXp(c, xp); };

// Poções de XP (podem cair em combate, ser fabricadas na Oficina dos Reinos e vir de missões)
export const POCOES = {
  pocao_xp_p: { nome: 'Poção de XP pequena', icone: '🧪', xp: 1500 },
  pocao_xp_m: { nome: 'Poção de XP média', icone: '⚗️', xp: 12000 },
  pocao_xp_g: { nome: 'Poção de XP grande', icone: '🍶', xp: 90000 },
};
// Faixas de nível das 12 regiões planejadas (configuráveis): cada região aumenta a dificuldade
export const REGIOES = [[1, 25], [20, 45], [40, 70], [65, 95], [90, 120], [115, 150], [145, 180], [175, 210], [205, 240], [235, 265], [260, 285], [280, 300]];
export const nivelDaRegiao = (r, t) => { const [a, b] = REGIOES[Math.max(0, Math.min(REGIOES.length - 1, r - 1))]; return Math.round(a + (b - a) * Math.max(0, Math.min(1, t))); };
