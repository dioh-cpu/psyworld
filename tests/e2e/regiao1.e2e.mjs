// Testes de ponta a ponta da Região 1 (Chromium via Playwright). Uso: node tests/e2e/regiao1.e2e.mjs [filtro]
// Sobe um servidor local sozinho se não houver um. Sai com código 1 se algum teste falhar.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORTA = 8799;
const URL = `http://localhost:${PORTA}/confusion/web/teste-quarteirao/regiao1.html?semtutorial=1`;
const filtro = process.argv[2];
let servidor = null;
try { await fetch(`http://localhost:${PORTA}/`); } catch { servidor = spawn('python3', ['-m', 'http.server', String(PORTA)], { cwd: RAIZ, stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 1200)); }

const navegador = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const resultados = [];
async function pagina(w = 1280, h = 576, extra = '') {
  const p = await navegador.newPage({ viewport: { width: w, height: h }, hasTouch: true });
  p.erros = []; p.on('pageerror', (e) => p.erros.push(e.message));
  await p.goto(URL + extra, { waitUntil: 'load' });
  await p.waitForFunction(() => window.regiao1 && window.regiaoMundo, null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  try { await p.getByText('Pular', { exact: true }).click({ timeout: 600 }); } catch {}
  await p.evaluate(() => window.regiao1.resetarSave());
  return p;
}
async function teste(nome, fn, extra = '') {
  if (filtro && !nome.includes(filtro)) return;
  const t0 = Date.now(); let p;
  try { p = await pagina(1280, 576, extra); await fn(p); if (p.erros.length) throw new Error('erro de página: ' + p.erros[0]); resultados.push([nome, true, Date.now() - t0]); }
  catch (e) { resultados.push([nome, false, Date.now() - t0, e.message]); }
  finally { await p?.close(); }
}
const ok = (c, msg) => { if (!c) throw new Error(msg); };

await teste('48 mapas abrem sem erro', async (p) => {
  const ids = await p.evaluate(async () => (await import('./regiao1-mapas.js')).ORDEM_MAPAS);
  ok(ids.length === 48, `esperava 48 mapas, achei ${ids.length}`);
  for (const id of ids) { await p.evaluate((id) => window.regiao1.irPara(id), id); await p.waitForTimeout(250); ok(await p.evaluate(() => window.regiao1.mapaAtual()) === id, `não entrou em ${id}`); }
});

await teste('mundo: 50 menus abrem, cabem na tela e as ações funcionam', async (p) => {
  await p.evaluate(() => window.regiaoMundo.passarDia(10));
  const ids = await p.evaluate(async () => (await import('/confusion/web/mundo/artes.js')).ARTES.map((s) => s.id));
  ok(ids.length === 50, 'catálogo sem 50 sistemas');
  let acoes = 0;
  for (const id of ids) {
    await p.evaluate((id) => window.regiaoMundo.abrirSistema(id), id);
    const m = await p.evaluate(() => { const c = document.querySelector('#modal-mundo .modal-card').getBoundingClientRect(); return { top: c.top, bottom: c.bottom, vh: innerHeight, btns: document.querySelectorAll('#modal-mundo .mundo-acoes [data-acao]').length }; });
    ok(m.top >= 0 && m.bottom <= m.vh + 1, `menu ${id} estoura a tela`);
    for (let i = 0; i < m.btns; i++) { await p.evaluate((i) => document.querySelectorAll('#modal-mundo .mundo-acoes [data-acao]')[i]?.click(), i); acoes++; await p.evaluate((id) => window.regiaoMundo.abrirSistema(id), id); }
  }
  ok(acoes >= 70, `poucas ações clicadas (${acoes})`);
  const s = await p.evaluate(() => { const v = window.regiao1.save().idle.jogador.sanidade; return v >= 0 && v <= 100 && !/NaN/.test(JSON.stringify(window.regiaoMundo.estado().mundo)); });
  ok(s, 'estado inválido (NaN ou sanidade fora de 0 a 100)');
});

await teste('mundo: armazém tem teto e save sobrevive a recarregar', async (p) => {
  await p.evaluate(() => window.regiaoMundo.passarDia(400));
  const rec = await p.evaluate(() => window.regiaoMundo.estado().meta.recursos);
  ok(Object.values(rec).every((v) => v <= 500), 'recurso passou do teto de 500: ' + JSON.stringify(rec));
  const dia = await p.evaluate(() => { window.regiao1.salvar(); return window.regiaoMundo.estado().meta.dia; });
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.regiaoMundo); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => window.regiaoMundo.estado().meta.dia) === dia, 'o dia do mundo não sobreviveu ao recarregar');
});

await teste('mundo: tutorial, diário e clima na tela', async (p) => {
  await p.evaluate(() => window.regiaoMundo.abrir());
  ok(await p.evaluate(() => /Como funciona o Mundo/.test(document.getElementById('modal-mundo').innerText)), 'tutorial não apareceu na primeira abertura');
  await p.evaluate(() => document.querySelector('#modal-mundo [data-entendi]').click());
  ok(!(await p.evaluate(() => /Como funciona o Mundo/.test(document.getElementById('modal-mundo').innerText))), 'tutorial não fechou');
  await p.evaluate(() => window.regiaoMundo.passarDia(12));
  await p.evaluate(() => document.getElementById('mundo-diario').click());
  ok(await p.evaluate(() => /Dia \d+/.test(document.getElementById('mundo-corpo').innerText)), 'diário vazio depois de 12 dias');
  await p.evaluate(() => document.getElementById('mundo-fechar').click());
  // chuva: o canvas de clima desenha partículas
  await p.evaluate(async () => { await window.regiao1.irPara('C0'); window.regiaoMundo.estado().mundo['07'].clima = 'tempestade'; });
  await p.waitForTimeout(1500);
  const desenhou = await p.evaluate(() => { const c = document.getElementById('efeito-clima'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  ok(desenhou > 500, `o efeito de tempestade não desenhou nada (${desenhou} pixels)`);
  await p.evaluate(async () => { await window.regiao1.irPara('CC2'); }); await p.waitForTimeout(800);
  const caverna = await p.evaluate(() => { const c = document.getElementById('efeito-clima'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  ok(caverna === 0, `a chuva apareceu dentro da caverna (${caverna} pixels)`);
});

await teste('mundo: facções, praga, clima e ecossistema mexem na caça', async (p) => {
  const r = await p.evaluate(() => {
    const M = window.regiaoMundo, e = M.estado().mundo; e['05'].refugios = [];
    e['15'] = { ativa: false, nivel: 0 }; e['07'].clima = 'vento'; e['03'] = { guardioes: 0, culto: 0, guilda: 0 };
    const base = M.modificadores();
    e['03'] = { guardioes: 65, culto: 35, guilda: 65 };
    const fac = M.modificadores();
    e['15'] = { ativa: true, nivel: 100 }; e['07'].clima = 'tempestade';
    const mal = M.modificadores();
    e['02'].populacao.Noctarn = 1; const rara = M.tempoRespawn('Noctarn'); e['02'].populacao.Noctarn = 30; const farta = M.tempoRespawn('Noctarn'); e['02'].populacao.Noctarn = 10; const normal = M.tempoRespawn('Noctarn');
    return { base, fac, mal, rara, farta, normal };
  });
  ok(r.base.dano === 1 && r.base.ouro === 1, 'sem efeitos o multiplicador deveria ser 1');
  ok(r.fac.dano > 1.06 && r.fac.ouro > 1.09, `facções não deram bônus (${JSON.stringify(r.fac)})`);
  ok(r.mal.dano < r.fac.dano, 'praga e tempestade não reduziram o dano');
  ok(r.rara > r.normal && r.normal > r.farta, `respawn por população errado (${r.rara}/${r.normal}/${r.farta})`);
});

await teste('save: corrompido volta pelo backup, sem recomeçar do zero', async (p) => {
  await p.evaluate(async () => { await window.regiao1.irPara('E3'); window.regiaoMundo.passarDia(7); window.regiao1.salvar(); });
  await p.evaluate(() => { window.regiao1.salvar(); }); // garante o save bom
  const dia = await p.evaluate(() => window.regiaoMundo.estado().meta.dia);
  // força um backup bom e estraga o save principal
  await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.includes('regiao1') && !x.includes('.')) || Object.keys(localStorage).find((x) => /regiao1/i.test(x) && !/backup|corrompido/.test(x)); const bom = localStorage.getItem(k); localStorage.setItem(k + '.backup', bom); localStorage.setItem(k, '{"quebrado":'); });
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.regiaoMundo); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.regiaoMundo.estado().meta.dia) === dia, 'não restaurou o backup (dia do mundo diferente)');
  ok(await p.evaluate(() => /corrompido/i.test(document.body.innerText)), 'não avisou que o save estava corrompido');
});

await teste('mundo no mapa: objetos aparecem, bloqueiam e abrem o menu', async (p) => {
  await p.evaluate(() => {
    const m = window.regiaoMundo.estado().mundo;
    m['05'].refugios = [{ nome: 'R1' }, { nome: 'R2' }, { nome: 'F' }]; m['29'] = { arvores: [{ stage: 3 }], monumentos: 2 }; m['47'].santuarios = 2;
  });
  let solidos = 0, invadidos = 0;
  for (const id of ['C0', 'C1']) {
    await p.evaluate((id) => window.regiao1.irPara(id), id); await p.waitForTimeout(700);
    const r = await p.evaluate(async () => {
      const els = window.regiaoMundo.noMapa.elementos(); let inv = 0, n = 0;
      for (const e of els.filter((x) => x.r > 0)) {
        n++; window.regiao1.moverPx(Math.round((e.x / 106 + 0.5) * 1024), Math.round((e.z / (106 * 571 / 1024) + 0.5) * 571));
        await new Promise((r) => setTimeout(r, 250));
        const j = window.regiao1.estado(); if (Math.hypot(j.x - e.x, j.z - e.z) < e.r + 0.3) inv++;
      }
      return { n: els.length, inv, solidos: n };
    });
    solidos += r.solidos; invadidos += r.inv;
  }
  ok(solidos > 0, 'nenhum objeto sólido apareceu'); ok(invadidos === 0, `${invadidos} objeto(s) deixaram o jogador entrar`);
});

await teste('auto-caça: abate, alimenta o mundo e não trava', async (p) => {
  await p.evaluate(async () => { await window.regiao1.irPara('D11'); }); await p.waitForTimeout(600);
  const pop0 = await p.evaluate(() => Object.values(window.regiaoMundo.estado().mundo['02'].populacao).reduce((a, b) => a + b, 0));
  await p.evaluate(() => window.regiao1.definirAutoCaca(true));
  let ult = null, parado = 0, maxParado = 0;
  for (let t = 0; t < 50; t++) { await p.waitForTimeout(500); const e = await p.evaluate(() => window.regiao1.estado()); if (ult && Math.hypot(e.x - ult.x, e.z - ult.z) < 0.05) { parado++; maxParado = Math.max(maxParado, parado); } else parado = 0; ult = e; }
  const r = await p.evaluate(() => ({ abates: window.regiaoMundo.estado().meta.abates || 0, pop: Object.values(window.regiaoMundo.estado().mundo['02'].populacao).reduce((a, b) => a + b, 0) }));
  ok(r.abates >= 5, `poucos abates em 25 s (${r.abates})`); ok(maxParado <= 8, `ficou parado ${maxParado / 2} s`); ok(r.pop < pop0, 'o ecossistema não perdeu monstros');
});

await teste('auto-caça: vídeo do NPC não é recriado a cada abate', async (p) => {
  await p.evaluate(async () => { await window.regiao1.irPara('E3'); }); await p.waitForTimeout(2000);
  const antes = await p.evaluate(() => { const vs = [...document.querySelectorAll('video')].filter((v) => /halloween\/idle/.test(v.src)); vs.forEach((v) => { v.__m = 1; }); return vs.length; });
  ok(antes > 0, 'nenhum vídeo de NPC em E3');
  await p.evaluate(() => window.regiao1.definirAutoCaca(true)); await p.waitForTimeout(25000);
  const marcados = await p.evaluate(() => [...document.querySelectorAll('video')].filter((v) => /halloween\/idle/.test(v.src) && v.__m).length);
  ok(marcados === antes, `vídeos de NPC recriados (${marcados}/${antes} sobreviveram)`);
});

await teste('diálogo de NPC cabe em paisagem', async (p) => {
  for (const [w, h] of [[1280, 576], [800, 360]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(async () => { await window.regiao1.irPara('C1', [421, 235]); }); await p.waitForTimeout(800);
    await p.keyboard.press('e'); await p.waitForTimeout(900);
    const m = await p.evaluate(() => { const q = (s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { t: r.top, b: r.bottom, l: r.left, r: r.right }; }; return { vh: innerHeight, vw: innerWidth, aberto: document.getElementById('modal-dialogo').classList.contains('aberto'), itens: ['#modal-dialogo .modal-card', '#dlg-retrato', '#dlg-texto', '.dialogo-rodape', '#modal-dialogo .btn-fechar'].map(q) }; });
    ok(m.aberto, `diálogo não abriu em ${w}x${h}`);
    ok(m.itens.every((x) => x && x.t >= -1 && x.b <= m.vh + 1 && x.l >= -1 && x.r <= m.vw + 1), `algo ficou fora da tela em ${w}x${h}`);
    await p.evaluate(() => document.querySelector('#modal-dialogo .btn-fechar').click());
  }
});

await teste('Espírito: toca o clipe da direção e volta ao idle', async (p) => {
  const ativos = () => p.evaluate(() => [...document.querySelectorAll('video')].filter((v) => /espirito/.test(v.src) && !v.paused).map((v) => v.src.split('/').pop().split('?')[0]));
  const casos = [['s', 'walk-frente'], ['a', 'walk-esquerda'], ['d', 'walk-esquerda'], ['w', 'walk-costas']];
  for (const [k, esperado] of casos) {
    await p.keyboard.down(k); await p.waitForTimeout(1500); const a = await ativos(); await p.keyboard.up(k);
    ok(a.some((n) => n.includes(esperado)), `tecla ${k}: esperava ${esperado}, tocando ${a}`);
    await p.waitForTimeout(600); ok((await ativos()).some((n) => n.includes('idle')), `tecla ${k}: não voltou ao idle`);
  }
}, '&idle=espirito');

await navegador.close(); servidor?.kill();
const falhas = resultados.filter((r) => !r[1]);
for (const [n, okk, ms, msg] of resultados) console.log(`${okk ? '✓' : '✗'} ${n} (${(ms / 1000).toFixed(1)} s)${okk ? '' : `\n    ${msg}`}`);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} passaram`);
process.exit(falhas.length ? 1 : 0);
