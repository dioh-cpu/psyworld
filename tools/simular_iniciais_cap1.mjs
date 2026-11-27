#!/usr/bin/env node
/**
 * FONTE ÚNICA DA VERDADE — Dificuldade da Campanha Mini (Capítulos 1 a 12) por Inicial
 * (alinhada entre asutaroto291 e dioh292).
 *
 * CRITÉRIO OFICIAL DE BALANCEAMENTO:
 * - O jogador normal usa as 10 invocações grátis do Dia 1 logo no começo (time completo de 4)
 *   e sobe nível com Auto-Caça + AFK nas áreas de Idle (nunca o inicial sozinho).
 * - Capítulos 2 a 12 refletem a progressão acumulada de dias seguintes: invocações grátis
 *   acumuladas (garantias 10→T3, 30→T4, 50→T5), evoluções (Forma 2 no Cap. 2, Forma 3 T5 a
 *   partir do Nv.40 no Cap. 3+), relíquias + Arma Única (até +60%, dentro do teto de +70%)
 *   e Domador Azazel no nível real.
 * - Metas por capítulo: fases 1–3 ~95% (Cap. 1 >=95% por inicial), 4–7 ~85%, 8–10 ~70%.
 *
 * Uso:
 *   node tools/simular_iniciais_cap1.mjs                    # Cap. 1 (300 lutas/fase, padrão)
 *   node tools/simular_iniciais_cap1.mjs --cap 3            # Capítulo específico (1..12)
 *   node tools/simular_iniciais_cap1.mjs --todos --lutas 80 # Resumo dos 12 capítulos
 *   node tools/simular_iniciais_cap1.mjs [--json]
 */
import * as M from '../confusion/web/teste-quarteirao/regiao1-estrategia-regras.js';
import * as CM from '../confusion/web/teste-quarteirao/regiao1-campanha-mini-regras.js';
import { criarEstadoDomadorBatalha } from '../confusion/web/teste-quarteirao/regiao1-domadores-regras.js';
import { xpTotal, nivelDe, REGIOES } from '../confusion/web/teste-quarteirao/regiao1-progressao.js';

export const INICIAIS = ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'];
export const FORMAS_INICIAIS = {
  1: ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'],
  2: ['Ignavor', 'Vaelith', 'Brotavel', 'Solarin', 'Noctarn'],
  3: ['Ignaraz', 'Vaelirion', 'Florivel', 'Helíssio', 'Noctarion'],
};

export const PREMISSAS_CAP1 = [
  { fase: '1-1',  xpAcumulado: 0,    aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-2',  xpAcumulado: 180,  aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-3',  xpAcumulado: 360,  aliados: 4, nivelAzazel: 1, metaPct: 95, minIndividualPct: 95 },
  { fase: '1-4',  xpAcumulado: 620,  aliados: 4, nivelAzazel: 2, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-5',  xpAcumulado: 1020, aliados: 4, nivelAzazel: 2, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-6',  xpAcumulado: 1650, aliados: 4, nivelAzazel: 3, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-7',  xpAcumulado: 2200, aliados: 4, nivelAzazel: 3, metaPct: 85, minIndividualPct: 65 },
  { fase: '1-8',  xpAcumulado: 2800, aliados: 4, nivelAzazel: 4, metaPct: 70, minIndividualPct: 45 },
  { fase: '1-9',  xpAcumulado: 3450, aliados: 4, nivelAzazel: 4, metaPct: 70, minIndividualPct: 45 },
  { fase: '1-10', xpAcumulado: 4120, aliados: 4, nivelAzazel: 5, metaPct: 70, minIndividualPct: 45 },
];

export const PERFIS_CAPITULOS_2_12 = {
  2:  { dia: 'Dias 2–3',   forma: 2, tierIni: 4, est: 2, eq: 0.12, az: [6, 10],  aliados: [['Cervomusgo', 3, 2], ['Tatuveludo', 3, 1], ['Fanalino', 2, 2]] },
  3:  { dia: 'Dias 4–6',   forma: 3, tierIni: 5, est: 2, eq: 0.20, az: [11, 16], aliados: [['Cervomusgo', 4, 2], ['Tatuveludo', 3, 2], ['Cobrabúfalo', 3, 2]] },
  4:  { dia: 'Dias 7–10',  forma: 3, tierIni: 5, est: 3, eq: 0.26, az: [17, 24], aliados: [['Vaelirion', 5, 2],  ['Cervomusgo', 4, 2], ['Cobrabúfalo', 4, 2]] },
  5:  { dia: 'Dias 11–14', forma: 3, tierIni: 5, est: 3, eq: 0.32, az: [25, 32], aliados: [['Vaelirion', 5, 3],  ['Cervomusgo', 4, 3], ['Cobrabúfalo', 4, 3]] },
  6:  { dia: 'Semana 3',   forma: 3, tierIni: 5, est: 4, eq: 0.36, az: [33, 40], aliados: [['Vaelirion', 5, 3],  ['Florivel', 5, 3],   ['Cobrabúfalo', 4, 3]] },
  7:  { dia: 'Semana 4',   forma: 3, tierIni: 5, est: 4, eq: 0.40, az: [41, 48], aliados: [['Vaelirion', 5, 4],  ['Florivel', 5, 3],   ['Cobrabúfalo', 4, 4]] },
  8:  { dia: 'Semana 5',   forma: 3, tierIni: 5, est: 4, eq: 0.44, az: [49, 56], aliados: [['Vaelirion', 5, 4],  ['Florivel', 5, 4],   ['Ignaraz', 5, 3]] },
  9:  { dia: 'Semana 6',   forma: 3, tierIni: 5, est: 5, eq: 0.48, az: [57, 64], aliados: [['Vaelirion', 5, 4],  ['Florivel', 5, 4],   ['Ignaraz', 5, 4]] },
  10: { dia: 'Semana 7',   forma: 3, tierIni: 5, est: 5, eq: 0.52, az: [65, 72], aliados: [['Vaelirion', 5, 5],  ['Florivel', 5, 4],   ['Ignaraz', 5, 4]] },
  11: { dia: 'Semana 8',   forma: 3, tierIni: 5, est: 5, eq: 0.56, az: [73, 80], aliados: [['Vaelirion', 5, 5],  ['Florivel', 5, 5],   ['Ignaraz', 5, 5]] },
  12: { dia: 'Endgame',    forma: 3, tierIni: 5, est: 5, eq: 0.60, az: [81, 90], aliados: [['Vaelirion', 5, 5],  ['Florivel', 5, 5],   ['Ignaraz', 5, 5]] },
};

export function montarTimeRealista(especieInicial, nivelInicial, cap = 1) {
  if (cap === 1) {
    return [
      M.criarUnidade({ id: 'a0', especie: especieInicial, nivel: nivelInicial, tier: 4, estrelas: 1, lado: 'a' }),
      M.criarUnidade({ id: 'a1', especie: 'Cervomusgo', nivel: Math.max(3, nivelInicial - 1), tier: 3, estrelas: 1, lado: 'a' }),
      M.criarUnidade({ id: 'a2', especie: 'Tatuveludo', nivel: Math.max(2, nivelInicial - 2), tier: 2, estrelas: 1, lado: 'a' }),
      M.criarUnidade({ id: 'a3', especie: 'Fanalino', nivel: Math.max(2, nivelInicial - 2), tier: 2, estrelas: 1, lado: 'a' }),
    ];
  }
  const pf = PERFIS_CAPITULOS_2_12[cap];
  const equip = { vidaPct: pf.eq, ataquePct: pf.eq, defesaPct: pf.eq * 0.6, critico: pf.eq * 0.25 };
  return [
    M.criarUnidade({ id: 'a0', especie: especieInicial, nivel: nivelInicial, tier: pf.tierIni, estrelas: pf.est, lado: 'a', equip }),
    ...pf.aliados.map(([ae, at, as], k) => M.criarUnidade({
      id: `a${k + 1}`,
      especie: ae === especieInicial ? 'Noctarion' : ae,
      nivel: Math.max(1, nivelInicial - 1 - Math.floor(k / 2)),
      tier: at,
      estrelas: as,
      lado: 'a',
      equip,
    })),
  ];
}

export function simularCapitulo(cap = 1, N = 300) {
  const [a, b] = REGIOES[cap - 1];
  const pf = cap === 1 ? null : PERFIS_CAPITULOS_2_12[cap];
  const inis = cap === 1 ? INICIAIS : FORMAS_INICIAIS[pf.forma];
  const tabela = [];

  for (let idx = 1; idx <= 10; idx++) {
    const fid = `${cap}-${idx}`;
    const f = CM.FASES_CAMPANHA_POR_ID[fid];
    const nv = cap === 1
      ? nivelDe(xpTotal(5) + PREMISSAS_CAP1[idx - 1].xpAcumulado)
      : Math.round(a + 3 + ((b - a - 1) * (idx - 1)) / 9);
    const nvAz = cap === 1
      ? PREMISSAS_CAP1[idx - 1].nivelAzazel
      : Math.round(pf.az[0] + ((pf.az[1] - pf.az[0]) * (idx - 1)) / 9);
    const metaPct = idx <= 3 ? 95 : idx <= 7 ? 85 : 70;
    const minInd = cap === 1 ? PREMISSAS_CAP1[idx - 1].minIndividualPct : (idx <= 3 ? 80 : idx <= 7 ? 60 : 40);

    const taxas = {};
    let soma = 0;
    for (let j = 0; j < inis.length; j++) {
      const esp = inis[j];
      const chave = INICIAIS[j];
      let vit = 0;
      for (let seed = 1; seed <= N; seed++) {
        const rng = M.criarRng(seed + (cap === 1 ? idx * 1000 : cap * 10000 + idx * 100));
        const al = montarTimeRealista(esp, nv, cap);
        const ondas = f.ondas.map((o, oi) => o.map(([e, nvi, el, op], ei) => M.criarUnidade({
          id: `i${oi}_${ei}`,
          especie: e,
          nivel: nvi,
          elemento: el,
          lado: 'i',
          chefe: Boolean(op?.chefe),
          bonus: op?.bonus || {},
        })));
        const dom = criarEstadoDomadorBatalha({
          idle: { domadores: { equipado: 'azazel', colecao: { azazel: { nivel: nvAz, xp: 0 } } } },
        });
        const bat = M.criarBatalha(al, ondas[0], { ondas: ondas.slice(1), domador: dom });
        for (let s = 0; s < 500 && !bat.fim; s++) M.executar(bat, M.decidir(bat, M.atorAtual(bat), rng), rng);
        if (bat.fim === 'vitoria') vit++;
      }
      const pct = Number(((vit / N) * 100).toFixed(1));
      taxas[chave] = pct;
      soma += pct;
    }
    const mediaPct = Number((soma / INICIAIS.length).toFixed(1));
    const abaixoMeta = INICIAIS.filter((k) => taxas[k] < minInd);
    tabela.push({
      fase: fid,
      capitulo: cap,
      nivelInicial: nv,
      nivelAzazel: nvAz,
      aliados: 4,
      ondas: f.ondas.length,
      metaPct,
      minIndividualPct: minInd,
      taxas,
      mediaPct,
      abaixoMeta,
    });
  }
  return tabela;
}

const arg1 = process.argv[1] || '';
const isCli = arg1 && (import.meta.url === `file:///${arg1.replace(/\\/g, '/')}` || arg1.endsWith('simular_iniciais_cap1.mjs'));
if (isCli) {
  const args = process.argv.slice(2);
  const idxLutas = args.indexOf('--lutas');
  const idxCap = args.indexOf('--cap');
  const todos = args.includes('--todos');
  const comoJson = args.includes('--json');
  const cap = idxCap >= 0 ? Math.max(1, Math.min(12, Number(args[idxCap + 1]) || 1)) : 1;
  const N = idxLutas >= 0 ? Math.max(10, Number(args[idxLutas + 1]) || (todos ? 60 : 300)) : (todos ? 60 : 300);

  if (todos) {
    const resumo = [];
    for (let c = 1; c <= 12; c++) {
      const tab = simularCapitulo(c, N);
      const mediaFaixa = (ini, fim) => Number((tab.slice(ini - 1, fim).reduce((s, r) => s + r.mediaPct, 0) / (fim - ini + 1)).toFixed(1));
      resumo.push({
        capitulo: c,
        faixaNivel: `${REGIOES[c - 1][0]}–${REGIOES[c - 1][1]}`,
        ritmo: c === 1 ? 'Dia 1 (0–60 min)' : PERFIS_CAPITULOS_2_12[c].dia,
        equipPct: c === 1 ? 0 : Math.round(PERFIS_CAPITULOS_2_12[c].eq * 100),
        f1a3: mediaFaixa(1, 3),
        f4a7: mediaFaixa(4, 7),
        f8a9: mediaFaixa(8, 9),
        f10Chefe: tab[9].mediaPct,
      });
    }
    if (comoJson) {
      console.log(JSON.stringify({ lutasPorFase: N, iniciais: INICIAIS, resumo }, null, 2));
    } else {
      console.log('| Cap. | Faixa Nv. | Ritmo | Relíquias | Fases 1–3 (~95%) | Fases 4–7 (~85%) | Fases 8–9 (~70%) | Chefe 10 (~70%) |');
      console.log('|---:|---|---|---:|---:|---:|---:|---:|');
      for (const r of resumo) {
        console.log(`| ${r.capitulo} | ${r.faixaNivel} | ${r.ritmo} | +${r.equipPct}% | ${r.f1a3.toFixed(1)}% | ${r.f4a7.toFixed(1)}% | ${r.f8a9.toFixed(1)}% | ${r.f10Chefe.toFixed(1)}% |`);
      }
    }
  } else {
    const tabela = simularCapitulo(cap, N);
    if (comoJson) {
      console.log(JSON.stringify({ capitulo: cap, lutasPorFase: N, iniciais: INICIAIS, tabela }, null, 2));
    } else {
      console.log(`| Fase | Time realista | Azazel | Ondas | Meta | ${INICIAIS.join(' | ')} | Média |`);
      console.log(`|---|---|---:|---:|---:|${INICIAIS.map(() => '---:').join('|')}|---:|`);
      for (const r of tabela) {
        const metaLabel = r.metaPct === 95 ? '≥95%' : `~${r.metaPct}%`;
        console.log(`| ${r.fase} | ${r.aliados}× (Nv.${r.nivelInicial}) | Nv.${r.nivelAzazel} | ${r.ondas} | ${metaLabel} | ${INICIAIS.map((e) => `${r.taxas[e].toFixed(1)}%`).join(' | ')} | ${r.mediaPct.toFixed(1)}% |`);
      }
    }
  }
}
