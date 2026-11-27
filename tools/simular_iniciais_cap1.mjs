#!/usr/bin/env node
/**
 * Simula 300 lutas por fase na Campanha Mini 1-1 a 1-10 para os 5 iniciais
 * (Brasinha, Gotalume, Sementil, Solinho, Penumbrio) e imprime tabela Markdown + JSON.
 *
 * Uso:
 *   node tools/simular_iniciais_cap1.mjs [--lutas 300] [--json]
 */
import * as M from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
import * as CM from '../confusion/web/teste-quarteirao/regiao1-campanha-mini-regras.js';
import { criarEstadoDomadorBatalha } from '../confusion/web/teste-quarteirao/regiao1-domadores-regras.js';

const INICIAIS = ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'];
const FASES = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10'];

const args = process.argv.slice(2);
const idxLutas = args.indexOf('--lutas');
const N = idxLutas >= 0 ? Math.max(10, Number(args[idxLutas + 1]) || 300) : 300;
const comoJson = args.includes('--json');

const tabela = [];
for (let i = 0; i < FASES.length; i++) {
  const fid = FASES[i];
  const f = CM.FASES_CAMPANHA_POR_ID[fid];
  const idx = i + 1;
  const nv = 4 + idx; // 1-1: Nv.5 ... 1-10: Nv.14
  const meta = idx <= 3 ? 95 : idx <= 7 ? 85 : 70;
  const taxas = {};
  for (const esp of INICIAIS) {
    let vit = 0;
    for (let seed = 1; seed <= N; seed++) {
      const rng = M.criarRng(seed + idx * 1000);
      const al = [M.criarUnidade({ id: 'a0', especie: esp, nivel: nv, tier: 4, estrelas: 1, lado: 'a' })];
      if (idx >= 4) al.push(M.criarUnidade({ id: 'a1', especie: 'Cervomusgo', nivel: nv - 1, tier: 3, estrelas: 1, lado: 'a' }));
      if (idx >= 8) al.push(M.criarUnidade({ id: 'a2', especie: 'Tatuveludo', nivel: nv - 1, tier: 3, estrelas: 1, lado: 'a' }));
      const ondas = f.ondas.map((o, oi) => o.map(([e, nvi, el, op], ei) => M.criarUnidade({
        id: `i${oi}_${ei}`,
        especie: e,
        nivel: nvi,
        elemento: el,
        lado: 'i',
        chefe: Boolean(op?.chefe),
      })));
      const b = M.criarBatalha(al, ondas[0], { ondas: ondas.slice(1), domador: criarEstadoDomadorBatalha({}) });
      for (let s = 0; s < 500 && !b.fim; s++) M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng);
      if (b.fim === 'vitoria') vit++;
    }
    taxas[esp] = Number(((vit / N) * 100).toFixed(1));
  }
  const abaixoMeta = INICIAIS.filter((esp) => taxas[esp] < (idx <= 3 ? 95 : meta - 15));
  tabela.push({ fase: fid, nivelInicial: nv, aliados: idx <= 3 ? 1 : idx <= 7 ? 2 : 3, ondas: f.ondas.length, metaPct: meta, taxas, abaixoMeta });
}

if (comoJson) {
  console.log(JSON.stringify({ lutasPorFase: N, iniciais: INICIAIS, tabela }, null, 2));
} else {
  console.log(`| Fase | Time realista | Ondas | Meta | ${INICIAIS.join(' | ')} |`);
  console.log(`|---|---|---:|---:|${INICIAIS.map(() => '---:').join('|')}|`);
  for (const r of tabela) {
    console.log(`| ${r.fase} | ${r.aliados}× (Nv.${r.nivelInicial}) | ${r.ondas} | ≥${r.metaPct}% | ${INICIAIS.map((e) => `${r.taxas[e].toFixed(1)}%`).join(' | ')} |`);
  }
}
