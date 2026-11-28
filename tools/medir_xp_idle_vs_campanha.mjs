#!/usr/bin/env node
/**
 * Mede XP por Onírico: Idle (abate ativo e offline/AFK) × Campanha Mini (vitória), por nível da área/fase.
 * Usa XP_IDLE_CFG real do jogo; a fórmula da Campanha espelha darXpCampanha (regiao1-exp-regras.js):
 * round((40+12*nivel) * (chefe?2:1) * (vitoria?1:0.3)).
 * Uso: node tools/medir_xp_idle_vs_campanha.mjs [--json] [--abates-ativo-min 6]
 */
import { XP_IDLE_CFG as C } from '../confusion/web/teste-quarteirao/regiao1-idle.js';
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? Number(process.argv[i + 1]) : d; };
const abatesAtivoMin = arg('--abates-ativo-min', 6); // premissa: abates/min no Auto-Caça ativo
const campanha = (nv, chefe = false, vit = true) => Math.round((40 + 12 * Math.max(1, nv)) * (chefe ? 2 : 1) * (vit ? 1 : 0.3));
const ativo = (nv) => Math.round(C.ativoOniricoBase + nv * C.ativoOniricoPorNivel);
const offline = (nv) => Math.round(C.offlineOniricoBase + nv * C.offlineOniricoPorNivel);
const niveis = [1, 5, 10, 20, 40, 60, 80, 100];
const linhas = niveis.map((nv) => ({
  nivel: nv,
  idleAtivoPorAbate: ativo(nv),
  idleOfflinePorAbate: offline(nv),
  idleAtivoPorHora: ativo(nv) * abatesAtivoMin * 60,
  idleOfflinePorHora: Math.round(offline(nv) * C.offlineAbatesPorMinuto * 60),
  campanhaVitoria: campanha(nv),
  campanhaChefe: campanha(nv, true),
  razaoIdleAtivoPorAbate_vs_Campanha: +(ativo(nv) / campanha(nv)).toFixed(2),
}));
if (process.argv.includes('--json')) console.log(JSON.stringify({ cfg: C, abatesAtivoMin, linhas }, null, 2));
else {
  console.log(`XP por Onírico (premissa ativo=${abatesAtivoMin} abates/min)`);
  console.table(linhas);
}
