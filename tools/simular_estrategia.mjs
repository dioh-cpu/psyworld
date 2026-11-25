// Simula expedições da Estratégia com a equipe que o jogador TEM (limitada pelas vagas; vagas e inimigos avistados crescem a cada fase nova). Uso: node tools/simular_estrategia.mjs [tentativas=400]
import { ESTRATEGIA_C1 as R } from '../confusion/web/teste-quarteirao/regiao1-estrategia-c1.js';
import { criarRng, criarUnidade, gerarInimigos, criarBatalha, passoAuto } from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
const N = Number(process.argv[2]) || 400;
const pct = (x) => `${Math.round((100 * x) / N)}%`;
function rodar(rota, elenco, bonus, seed, vagas0 = elenco.length) { // jogador com as vagas já abertas para o elenco que tem
  const rng = criarRng(seed); let ganhou = 0; let hp = null; let vagas = vagas0; const extras = [];
  for (let f = 0; f < 3; f++) {
    const equipe = elenco.slice(0, vagas);
    const al = equipe.map(([e, n], i) => criarUnidade({ id: `a${i}`, especie: e, nivel: n, lado: 'a', papeis: R.papeis, bonus }));
    if (hp) al.forEach((u, i) => { if (hp[i] != null) u.hp = Math.max(1, Math.min(u.hpMax, hp[i])); });
    const b = criarBatalha(al, gerarInimigos(rota.fases[f], R.papeis, rng, extras));
    let n = 0; while (!b.fim && n++ < 600) passoAuto(b, rng);
    if (b.fim !== 'vitoria') break;
    ganhou++; hp = b.aliados.map((u) => Math.min(u.hpMax, (u.hp > 0 ? u.hp : u.hpMax * 0.5) + u.hpMax * (bonus.cura || 0)));
    const lib = rota.fases[f].libera; if (lib && !extras.includes(lib.inimigo)) extras.push(lib.inimigo);
    vagas = Math.min(6, vagas + 1); while (hp.length < Math.min(vagas, elenco.length)) hp.push(null);
  }
  return ganhou;
}
const T = (...l) => l;
const cenarios = [
  ['Floresta: só o Noctarn nv5 (1 Onírico)', R.rotas[0], T(['Noctarn', 5]), {}],
  ['Floresta: 3 Oníricos (ataque, defesa, suporte)', R.rotas[0], T(['Noctarn', 5], ['Brotavel', 5], ['Vaelith', 5]), {}],
  ['Floresta: 3 só de ataque', R.rotas[0], T(['Noctarn', 5], ['Ignavor', 5], ['Noctarn', 5]), {}],
  ['Floresta: 4 equilibrados', R.rotas[0], T(['Noctarn', 5], ['Ignavor', 4], ['Brotavel', 5], ['Vaelith', 5]), {}],
  ['Floresta: 4 só de ataque', R.rotas[0], T(['Noctarn', 5], ['Ignavor', 4], ['Ignavor', 4], ['Noctarn', 5]), {}],
  ['Floresta: 6 equilibrados', R.rotas[0], T(['Noctarn', 5], ['Ignavor', 5], ['Brotavel', 5], ['Cristalino', 5], ['Vaelith', 5], ['Solarin', 5]), {}],
  ['Pedreira: 4 equilibrados + quartel 2', R.rotas[1], T(['Noctarn', 5], ['Ignavor', 4], ['Brotavel', 5], ['Vaelith', 5]), { atk: 0.08, def: 0.08 }],
  ['Pedreira: 6 equilibrados', R.rotas[1], T(['Noctarn', 5], ['Ignavor', 5], ['Brotavel', 5], ['Cristalino', 5], ['Vaelith', 5], ['Solarin', 5]), {}],
];
for (const [nome, rota, elenco, bonus] of cenarios) {
  const c = [0, 0, 0, 0];
  for (let s = 1; s <= N; s++) c[rodar(rota, elenco, bonus, s * 7919)]++;
  console.log(`${nome.padEnd(48)} 0 fases ${pct(c[0])} · 1 ${pct(c[1])} · 2 ${pct(c[2])} · limpa 3 ${pct(c[3])}`);
}
