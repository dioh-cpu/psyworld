// Simula expedições da Estratégia (equipe cresce com os recrutas liberados, como no jogo). Uso: node tools/simular_estrategia.mjs [tentativas=400]
import { ESTRATEGIA_C1 as R } from '../confusion/web/teste-quarteirao/regiao1-estrategia-c1.js';
import { criarRng, criarUnidade, gerarInimigos, criarBatalha, passoAuto } from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
const N = Number(process.argv[2]) || 400;
const pct = (x) => `${Math.round((100 * x) / N)}%`;
function rodar(rota, elenco, bonus, seed, opcoes = {}) {
  const rng = criarRng(seed); const time = [...elenco]; let ganhou = 0; let hp = null;
  for (let f = 0; f < 3; f++) {
    const equipe = time.slice(0, 6);
    const al = equipe.map(([e, n], i) => criarUnidade({ id: `a${i}`, especie: e, nivel: n, lado: 'a', papeis: R.papeis, bonus }));
    if (hp) al.forEach((u, i) => { if (hp[i] != null) u.hp = Math.max(1, Math.min(u.hpMax, hp[i])); });
    const b = criarBatalha(al, gerarInimigos(rota.fases[f], R.papeis, rng));
    let n = 0; while (!b.fim && n++ < 600) passoAuto(b, rng);
    if (b.fim !== 'vitoria') break;
    ganhou++; hp = b.aliados.map((u) => Math.min(u.hpMax, (u.hp > 0 ? u.hp : u.hpMax * 0.5) + u.hpMax * (bonus.cura || 0)));
    const lib = rota.fases[f].libera; if (lib && !time.some(([e]) => e === lib.especie)) { time.push([lib.especie, lib.nivel]); hp.push(null); }
  }
  return ganhou;
}
const cenarios = [
  ['Floresta, equipe inicial (1 Noctarn nv5)', R.rotas[0], [['Noctarn', 5]], {}],
  ['Floresta, inicial + quartel1 + enfermaria1', R.rotas[0], [['Noctarn', 5]], { atk: 0.04, def: 0.04, cura: 0.12 }],
  ['Pedreira, equipe inicial', R.rotas[1], [['Noctarn', 5]], {}],
  ['Pedreira, após a Floresta (4 recrutas)', R.rotas[1], [['Noctarn', 5], ['Ignavor', 4], ['Brotavel', 5], ['Vaelith', 5]], {}],
  ['Pedreira, após Floresta + quartel2', R.rotas[1], [['Noctarn', 5], ['Ignavor', 4], ['Brotavel', 5], ['Vaelith', 5]], { atk: 0.08, def: 0.08 }],
  ['Floresta, 4 só de ataque (sem suporte/defesa)', R.rotas[0], [['Noctarn', 5], ['Ignavor', 4], ['Ignavor', 4], ['Noctarn', 5]], {}],
  ['Floresta, 4 equilibrados', R.rotas[0], [['Noctarn', 5], ['Ignavor', 4], ['Brotavel', 5], ['Vaelith', 5]], {}],
];
for (const [nome, rota, elenco, bonus] of cenarios) {
  const c = [0, 0, 0, 0];
  for (let s = 1; s <= N; s++) c[rodar(rota, elenco, bonus, s * 7919)]++;
  console.log(`${nome.padEnd(48)} 0 fases ${pct(c[0])} · 1 ${pct(c[1])} · 2 ${pct(c[2])} · limpa 3 ${pct(c[3])}`);
}
