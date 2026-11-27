#!/usr/bin/env node
/**
 * FONTE ÚNICA DA VERDADE — Simulação de dificuldade do Capítulo 1 (1-1 a 1-10)
 * para os 5 iniciais (Brasinha, Gotalume, Sementil, Solinho, Penumbrio).
 *
 * Premissas oficiais do JOGADOR REAL (alinhadas com confusion/ECONOMIA_PRIMEIRA_HORA.md):
 * - O jogador novo usa as 10 invocações grátis logo no começo e já monta um TIME DE 4:
 *     * Vaga 1: Inicial escolhido (Tier 4, 1★, forma base)
 *     * Vaga 2: 1× Onírico T3 (garantia da 10ª invocação grátis, ex.: Cervomusgo)
 *     * Vagas 3–4: 2× Oníricos T2 (sorteio comum das 10 grátis, ex.: Tatuveludo e Fanalino)
 * - Também ganha XP no Auto/AFK das áreas de idle ao longo do Cap. 1:
 *     * 1-1: Inicial Nv.5  + 3 aliados Nv.3  · Azazel Nv.1
 *     * 1-2: Inicial Nv.7  + 3 aliados Nv.5  · Azazel Nv.1
 *     * 1-3: Inicial Nv.9  + 3 aliados Nv.7  · Azazel Nv.2
 *     * 1-4: Inicial Nv.12 + 3 aliados Nv.10 · Azazel Nv.2
 *     * 1-5: Inicial Nv.14 + 3 aliados Nv.12 · Azazel Nv.3
 *     * 1-6: Inicial Nv.17 + 3 aliados Nv.15 · Azazel Nv.4
 *     * 1-7: Inicial Nv.19 + 3 aliados Nv.17 · Azazel Nv.4
 *     * 1-8: Inicial Nv.22 + 3 aliados Nv.20 · Azazel Nv.5
 *     * 1-9: Inicial Nv.24 + 3 aliados Nv.22 · Azazel Nv.6
 *     * 1-10: Inicial Nv.26 + 3 aliados Nv.24 · Azazel Nv.7
 * - Metas: 1-1..1-3 ≥ 95%; 1-4..1-7 ~85%; 1-8..1-10 ~70%.
 *
 * Uso:
 *   node tools/simular_iniciais_cap1.mjs [--lutas 300] [--json]
 */
import * as M from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
import * as CM from '../confusion/web/teste-quarteirao/regiao1-campanha-mini-regras.js';
import { criarEstadoDomadorBatalha } from '../confusion/web/teste-quarteirao/regiao1-domadores-regras.js';

export const INICIAIS = ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'];

export const PREMISSAS_CAP1 = [
  { fase: '1-1',  nivelInicial: 5,  nivelAliados: 3,  nivelDomador: 1, metaPct: 95 },
  { fase: '1-2',  nivelInicial: 7,  nivelAliados: 5,  nivelDomador: 1, metaPct: 95 },
  { fase: '1-3',  nivelInicial: 9,  nivelAliados: 7,  nivelDomador: 2, metaPct: 95 },
  { fase: '1-4',  nivelInicial: 12, nivelAliados: 10, nivelDomador: 2, metaPct: 85 },
  { fase: '1-5',  nivelInicial: 14, nivelAliados: 12, nivelDomador: 3, metaPct: 85 },
  { fase: '1-6',  nivelInicial: 17, nivelAliados: 15, nivelDomador: 4, metaPct: 85 },
  { fase: '1-7',  nivelInicial: 19, nivelAliados: 17, nivelDomador: 4, metaPct: 85 },
  { fase: '1-8',  nivelInicial: 22, nivelAliados: 20, nivelDomador: 5, metaPct: 70 },
  { fase: '1-9',  nivelInicial: 24, nivelAliados: 22, nivelDomador: 6, metaPct: 70 },
  { fase: '1-10', nivelInicial: 26, nivelAliados: 24, nivelDomador: 7, metaPct: 70 },
];

const ALIADOS_10_GRATIS = [
  { especie: 'Cervomusgo', tier: 3 },
  { especie: 'Tatuveludo', tier: 2 },
  { especie: 'Fanalino', tier: 2 },
];

const args = process.argv.slice(2);
const idxLutas = args.indexOf('--lutas');
const N = idxLutas >= 0 ? Math.max(10, Number(args[idxLutas + 1]) || 300) : 300;
const comoJson = args.includes('--json');

const tabela = [];
for (let i = 0; i < PREMISSAS_CAP1.length; i++) {
  const p = PREMISSAS_CAP1[i];
  const f = CM.FASES_CAMPANHA_POR_ID[p.fase];
  const taxas = {};
  let soma = 0;
  for (const esp of INICIAIS) {
    let vit = 0;
    for (let seed = 1; seed <= N; seed++) {
      const rng = M.criarRng(seed + (i + 1) * 1000);
      const al = [
        M.criarUnidade({ id: 'a0', especie: esp, nivel: p.nivelInicial, tier: 4, estrelas: 1, lado: 'a' }),
        ...ALIADOS_10_GRATIS.map((a, idx) => M.criarUnidade({
          id: `a${idx + 1}`,
          especie: a.especie,
          nivel: p.nivelAliados,
          tier: a.tier,
          estrelas: 1,
          lado: 'a',
        })),
      ];
      const ondas = f.ondas.map((o, oi) => o.map(([e, nvi, el, op], ei) => M.criarUnidade({
        id: `i${oi}_${ei}`,
        especie: e,
        nivel: nvi,
        elemento: el,
        lado: 'i',
        chefe: Boolean(op?.chefe),
        bonus: op?.bonus || {},
      })));
      const saveFake = { idle: { domadores: { ativo: 'azazel', niveis: { azazel: p.nivelDomador } } } };
      const b = M.criarBatalha(al, ondas[0], { ondas: ondas.slice(1), domador: criarEstadoDomadorBatalha(saveFake, 'azazel') });
      while (!b.fim) M.passoAuto(b, rng);
      if (b.fim === 'vitoria') vit++;
    }
    const pct = Number(((vit / N) * 100).toFixed(1));
    taxas[esp] = pct;
    soma += pct;
  }
  const media = Number((soma / INICIAIS.length).toFixed(1));
  const abaixoMeta = INICIAIS.filter((esp) => taxas[esp] < (i < 3 ? 95 : p.metaPct - 15));
  tabela.push({
    fase: p.fase,
    nivelInicial: p.nivelInicial,
    nivelAliados: p.nivelAliados,
    aliados: 4,
    nivelDomador: p.nivelDomador,
    ondas: f.ondas.length,
    metaPct: p.metaPct,
    media,
    taxas,
    abaixoMeta,
  });
}

if (comoJson) {
  console.log(JSON.stringify({ lutasPorFase: N, iniciais: INICIAIS, modo: 'time-4-banner-gratis', tabela }, null, 2));
} else {
  console.log(`| Fase | Time real (4 vagas, 10 grátis) | Domador | Ondas | Meta | ${INICIAIS.join(' | ')} | Média |`);
  console.log(`|---|---|---:|---:|---:|${INICIAIS.map(() => '---:').join('|')}|---:|`);
  for (const r of tabela) {
    console.log(`| ${r.fase} | 1×T4 Nv.${r.nivelInicial} + 3×(T3/T2) Nv.${r.nivelAliados} | Azazel Nv.${r.nivelDomador} | ${r.ondas} | ≥${r.metaPct}% | ${INICIAIS.map((e) => `${r.taxas[e].toFixed(1)}%`).join(' | ')} | **${r.media.toFixed(1)}%** |`);
  }
}
