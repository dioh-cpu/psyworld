#!/usr/bin/env node
/**
 * FONTE ÚNICA DA VERDADE — Dificuldade do Capítulo 1 (1-1 a 1-10) por Inicial
 * (alinhada entre asutaroto291 e dioh292).
 *
 * PREMISSAS REALISTAS DO JOGADOR NOVO (derivadas de confusion/ECONOMIA_PRIMEIRA_HORA.md):
 * 1. Time completo de 4 Oníricos desde 1-1:
 *      Um jogador novo de verdade usa as 10 invocações grátis do Dia 1 no Banner Permanente
 *      (taxas 68% T2 / 22% T3 / 7% T4 / 3% T5, com garantia de T3 no ×10) e já entra na
 *      Campanha Mini com formação de 4 Oníricos:
 *        - Slot 1: Inicial escolhido (T4, 1★) no nível `nv`
 *        - Slot 2: Cervomusgo (T3 garantido do ×10 grátis, 1★) no nível `max(3, nv - 1)`
 *        - Slot 3: Tatuveludo (T2 do ×10 grátis, 1★) no nível `max(2, nv - 2)`
 *        - Slot 4: Fanalino   (T2 do ×10 grátis, 1★) no nível `max(2, nv - 2)`
 * 2. Curva real de XP (Campanha + Auto/AFK nas áreas de Idle, base Nv.5 = 220 XP):
 *      `nv = nivelDe(xpTotal(5) + xpAcumulado)` conforme os blocos da 1ª hora (+5.550 XP totais):
 *        - 1-1: +0 XP    → Nv.5  | 1-2: +180 XP  → Nv.7  | 1-3: +360 XP  → Nv.8
 *        - 1-4: +620 XP  → Nv.10 | 1-5: +1020 XP → Nv.13 | 1-6: +1650 XP → Nv.17 | 1-7: +2200 XP → Nv.19
 *        - 1-8: +2800 XP → Nv.22 | 1-9: +3450 XP → Nv.24 | 1-10: +4120 XP → Nv.27
 * 3. Domador de apoio Azazel no nível real de progressão:
 *      1-1..1-3: Nv.1 | 1-4..1-5: Nv.2 | 1-6..1-7: Nv.3 | 1-8..1-9: Nv.4 | 1-10: Nv.5.
 * 4. Metas de vitória (300 lutas/fase por inicial):
 *      - 1-1 a 1-3: >= 95% para CADA um dos 5 iniciais.
 *      - 1-4 a 1-7: ~85% (equilibrado entre os 5 iniciais).
 *      - 1-8 a 1-10: ~70% (desafio real de fim de Capítulo 1).
 *
 * Uso:
 *   node tools/simular_iniciais_cap1.mjs [--lutas 300] [--json]
 */
import * as M from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
import * as CM from '../confusion/web/teste-quarteirao/regiao1-campanha-mini-regras.js';
import { criarEstadoDomadorBatalha } from '../confusion/web/teste-quarteirao/regiao1-domadores-regras.js';
import { xpTotal, nivelDe } from '../confusion/web/teste-quarteirao/regiao1-progressao.js';

export const INICIAIS = ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'];
export const FASES = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10'];

export const PREMISSAS_CAP1 = [
  { fase: '1-1',  xpAcumulado: 0,    aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-2',  xpAcumulado: 180,  aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-3',  xpAcumulado: 360,  aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-4',  xpAcumulado: 620,  aliados: 4, nivelAzazel: 2, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-5',  xpAcumulado: 1020, aliados: 4, nivelAzazel: 2, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-6',  xpAcumulado: 1650, aliados: 4, nivelAzazel: 3, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-7',  xpAcumulado: 2200, aliados: 4, nivelAzazel: 3, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-8',  xpAcumulado: 2800, aliados: 4, nivelAzazel: 4, metaPct: 70, minIndividualPct: 50 },
  { fase: '1-9',  xpAcumulado: 3450, aliados: 4, nivelAzazel: 4, metaPct: 70, minIndividualPct: 50 },
  { fase: '1-10', xpAcumulado: 4120, aliados: 4, nivelAzazel: 5, metaPct: 70, minIndividualPct: 50 },
];

export function montarTimeRealista(especieInicial, nivelInicial) {
  return [
    M.criarUnidade({ id: 'a0', especie: especieInicial, nivel: nivelInicial, tier: 4, estrelas: 1, lado: 'a' }),
    M.criarUnidade({ id: 'a1', especie: 'Cervomusgo', nivel: Math.max(3, nivelInicial - 1), tier: 3, estrelas: 1, lado: 'a' }),
    M.criarUnidade({ id: 'a2', especie: 'Tatuveludo', nivel: Math.max(2, nivelInicial - 2), tier: 2, estrelas: 1, lado: 'a' }),
    M.criarUnidade({ id: 'a3', especie: 'Fanalino', nivel: Math.max(2, nivelInicial - 2), tier: 2, estrelas: 1, lado: 'a' }),
  ];
}

const args = process.argv.slice(2);
const idxLutas = args.indexOf('--lutas');
const N = idxLutas >= 0 ? Math.max(10, Number(args[idxLutas + 1]) || 300) : 300;
const comoJson = args.includes('--json');

const tabela = [];
for (let i = 0; i < PREMISSAS_CAP1.length; i++) {
  const p = PREMISSAS_CAP1[i];
  const idx = i + 1;
  const f = CM.FASES_CAMPANHA_POR_ID[p.fase];
  const nv = nivelDe(xpTotal(5) + p.xpAcumulado);
  const taxas = {};
  let soma = 0;
  for (const esp of INICIAIS) {
    let vit = 0;
    for (let seed = 1; seed <= N; seed++) {
      const rng = M.criarRng(seed + idx * 1000);
      const al = montarTimeRealista(esp, nv);
      const ondas = f.ondas.map((o, oi) => o.map(([e, nvi, el, op], ei) => M.criarUnidade({
        id: `i${oi}_${ei}`,
        especie: e,
        nivel: nvi,
        elemento: el,
        lado: 'i',
        chefe: Boolean(op?.chefe),
      })));
      const dom = criarEstadoDomadorBatalha({
        idle: { domadores: { equipado: 'azazel', colecao: { azazel: { nivel: p.nivelAzazel, xp: 0 } } } },
      });
      const b = M.criarBatalha(al, ondas[0], { ondas: ondas.slice(1), domador: dom });
      for (let s = 0; s < 500 && !b.fim; s++) M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng);
      if (b.fim === 'vitoria') vit++;
    }
    const pct = Number(((vit / N) * 100).toFixed(1));
    taxas[esp] = pct;
    soma += pct;
  }
  const mediaPct = Number((soma / INICIAIS.length).toFixed(1));
  const abaixoMeta = INICIAIS.filter((esp) => taxas[esp] < p.minIndividualPct);
  tabela.push({
    fase: p.fase,
    nivelInicial: nv,
    nivelAzazel: p.nivelAzazel,
    aliados: p.aliados,
    ondas: f.ondas.length,
    metaPct: p.metaPct,
    minIndividualPct: p.minIndividualPct,
    taxas,
    mediaPct,
    abaixoMeta,
  });
}

if (comoJson) {
  console.log(JSON.stringify({ lutasPorFase: N, iniciais: INICIAIS, premissas: PREMISSAS_CAP1, tabela }, null, 2));
} else {
  console.log(`| Fase | Time realista | Azazel | Ondas | Meta | ${INICIAIS.join(' | ')} | Média |`);
  console.log(`|---|---|---:|---:|---:|${INICIAIS.map(() => '---:').join('|')}|---:|`);
  for (const r of tabela) {
    const metaLabel = r.metaPct === 95 ? '≥95%' : `~${r.metaPct}%`;
    console.log(`| ${r.fase} | ${r.aliados}× (Nv.${r.nivelInicial}) | Nv.${r.nivelAzazel} | ${r.ondas} | ${metaLabel} | ${INICIAIS.map((e) => `${r.taxas[e].toFixed(1)}%`).join(' | ')} | ${r.mediaPct.toFixed(1)}% |`);
  }
}
