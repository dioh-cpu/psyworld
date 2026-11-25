// Simula os 50 sistemas por N dias com várias sementes e mostra as curvas de recursos, ouro, diamantes e sanidade.
// O jogador "passivo" só deixa o tempo passar; com --ativo ele também usa as ações baratas de vez em quando (como um jogador comum).
// Uso: node tools/simular_mundo.mjs [dias=365] [sementes=20] [--ativo]
import { criarMundo, diaMundo, acaoMundo, SISTEMAS, OPCOES_ACAO } from '../confusion/web/mundo/index.js';
const dias = Number(process.argv[2]) || 365, nSem = Number(process.argv[3]) || 20, ativo = process.argv.includes('--ativo');
const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
const ARMAZEM = (est) => 500 + 100 * (est['05']?.refugios?.length || 0); // igual ao jogo
const PISO_SAN = 10;
const BIOMA = { madeira: 3, raizes: 2, sementes: 1, comida: 0, pedra: 0, cristal: 0, peca: 0 }; // floresta, igual ao jogo
const marcos = [30, 90, 180, 365].filter((d) => d <= dias);
const acc = {};
for (let s = 1; s <= nSem; s++) {
  const r = lcg(s * 99991), est = criarMundo();
  const st = { rec: { madeira: 20, pedra: 15, cristal: 2, comida: 20, peca: 2, sementes: 6, raizes: 6 }, gold: 0, dia: 0, diam: 0, san: 82 };
  const ctx = (d) => ({ dia: d, r, sanidade: st.san, ponteFechada: false, recursos: { ...st.rec }, diamantes: st.diam, monstros: [{ id: 'a', species: 'Noctarn', classe: 'comum' }] });
  const ap = (res, diario = false) => {
    const e = res?.efeitos || {}; st.gold = Math.max(0, st.gold + (e.gold || 0)); st.diam = Math.max(0, st.diam + (e.diamantes || 0));
    st.san = Math.max(0, Math.min(100, diario && e.sanidade < 0 ? Math.max(st.san + e.sanidade, Math.min(st.san, PISO_SAN)) : st.san + (e.sanidade || 0)));
    for (const [k, v] of Object.entries(e.recursos || {})) st.rec[k] = Math.max(0, Math.min(ARMAZEM(est), (st.rec[k] || 0) + v));
  };
  for (let d = 1; d <= dias; d++) {
    for (const [k, v] of Object.entries(BIOMA)) st.rec[k] = Math.min(ARMAZEM(est), st.rec[k] + v);
    ap(diaMundo(est, ctx(d)), true);
    if (ativo && d % 3 === 0) { // um jogador comum usa 1 ação por 3 dias, nas mais baratas primeiro
      const lista = [];
      for (const sis of SISTEMAS) for (const [k] of Object.entries(sis.acoes || {})) { const o = OPCOES_ACAO[`${sis.id}.${k}`]; for (const x of (o ? o(est) : [{ args: {} }])) lista.push([sis.id, k, x.args]); }
      if (lista.length) { const [a, b, c] = lista[Math.floor(r() * lista.length)]; ap(acaoMundo(est, a, b, c, ctx(d))); }
    }
    if (marcos.includes(d)) {
      const m = (acc[d] ||= { rec: {}, gold: [], diam: [], san: [], pop: [], praga: 0, zumbis: [] });
      for (const [k, v] of Object.entries(st.rec)) (m.rec[k] ||= []).push(v);
      m.gold.push(st.gold); m.diam.push(st.diam); m.san.push(st.san);
      m.pop.push(Object.values(est['02'].populacao).reduce((a, b) => a + b, 0)); if (est['15'].ativa) m.praga++;
      m.zumbis.push((est['31'].cidades || []).reduce((a, c) => a + (c.zumbis || 0), 0));
    }
  }
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)]); };
const max = (a) => Math.round(Math.max(...a));
console.log(`${nSem} sementes, ${dias} dias, jogador ${ativo ? 'ativo' : 'passivo'} (mediana / máximo)`);
for (const d of marcos) {
  const m = acc[d];
  console.log(`dia ${d}: ` + Object.entries(m.rec).map(([k, v]) => `${k} ${med(v)}/${max(v)}`).join(' · ') + ` · ouro ${med(m.gold)} · diam ${med(m.diam)}/${max(m.diam)} · san ${med(m.san)} · monstros ${med(m.pop)} · praga ${m.praga}/${nSem} · zumbis ${med(m.zumbis)}`);
}
