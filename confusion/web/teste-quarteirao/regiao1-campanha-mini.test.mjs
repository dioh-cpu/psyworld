import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENERGIA_CFG,
  CAPITULOS_CAMPANHA_MINI,
  ESPECIES_CAPITULO_2,
  energiaDe,
  gastarEnergia,
  darPocaoEnergia,
  usarPocaoEnergia,
  saldoEssencia,
  faseDesbloqueada,
  statusCapitulo,
  avaliarEstrelasFase,
  iniciarFaseCampanhaMini,
  concluirFaseCampanhaMini,
  batalhaRapidaCampanhaMini,
  coletarBauFase,
  coletarBauCapitulo,
} from './regiao1-campanha-mini-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { criarUnidade, criarBatalha, resumoBatalha } from './regiao1-estrategia-regras.js';
import { hwDe } from './regiao1-halloween-regras.js';
import { expDe } from './regiao1-exp-regras.js';
import { ENCONTROS_ALTOS_AMBAR } from './regiao2-altos-ambar.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 10_000_000);
  s.idle.equipe = [
    { uid: 'a0', especie: 'Brasinha', nivel: 30, xp: 0, tier: 4, estrelas: 1 },
    { uid: 'a1', especie: 'Gotalume', nivel: 30, xp: 0, tier: 4, estrelas: 1 },
  ];
  s.idle.formacao = ['a0', 'a1', null, null];
  return s;
};

test('Campanha Mini: 12 capítulos × 10 fases + fase escondida e elenco real do Capítulo 2 (Altos do Âmbar)', () => {
  assert.equal(CAPITULOS_CAMPANHA_MINI.length, 12);
  for (const cap of CAPITULOS_CAMPANHA_MINI) {
    assert.equal(cap.fases.length, 10);
    assert.equal(cap.fases[4].tipo, 'elite');
    assert.equal(cap.fases[4].energia, 0);
    assert.equal(cap.fases[9].tipo, 'chefe');
    assert.equal(cap.fases[9].energia, 0);
    assert.equal(cap.faseEscondida.escondida, true);
    assert.equal(cap.faseEscondida.requisitoEstrelas, 30);
    assert.equal(cap.fases[9].inimigos[0][3].chefe, true);
  }

  // Capítulo 2: usa todas as 18 linhagens selvagens de ENCONTROS_ALTOS_AMBAR
  const espera18 = new Set(ENCONTROS_ALTOS_AMBAR.map((e) => e.especie));
  assert.equal(espera18.size, 18);
  assert.equal(ESPECIES_CAPITULO_2.length, 18);
  const cap2 = CAPITULOS_CAMPANHA_MINI[1];
  const vistasCap2 = new Set();
  for (const f of cap2.fases.slice(0, 9)) {
    for (const [esp] of f.inimigos) if (espera18.has(esp)) vistasCap2.add(esp);
  }
  assert.equal(vistasCap2.size, 18);

  // Formas 01 nas primeiras fases (1-4, não-chefe) e 02 nas finais (6-10)
  assert.equal(cap2.fases[0].inimigos.every(([, , , op]) => op.forma === 1), true);
  assert.equal(cap2.fases[1].inimigos.every(([, , , op]) => op.forma === 1), true);
  assert.equal(cap2.fases[5].inimigos.every(([, , , op]) => op.forma === 2), true);
  assert.equal(cap2.fases[8].inimigos.slice(1).every(([, , , op]) => op.forma === 2), true);

  // Fases especiais do Cap 2 e Rainha na fase 10 (alinhados com CHEFES_REGIAO/CHEFES_REINOS do Reino 2)
  assert.equal(cap2.fases[2].inimigos[0][0], 'Ferroada Rubra');
  assert.equal(cap2.fases[2].inimigos[0][2], 'fogo');
  assert.equal(cap2.fases[2].inimigos[0][3].chefe, true);
  assert.ok(cap2.fases[2].inimigos[0][3].bonus?.hp > 0);
  assert.equal(cap2.fases[4].inimigos[0][0], 'Matriarca de Resina');
  assert.equal(cap2.fases[4].inimigos[0][2], 'voador');
  assert.equal(cap2.fases[4].inimigos[0][3].chefe, true);
  assert.ok(cap2.fases[4].inimigos[0][3].bonus?.hp > 0);
  assert.equal(cap2.fases[7].inimigos[0][0], 'Sentinela de Geoda');
  assert.equal(cap2.fases[7].inimigos[0][2], 'eletrico');
  assert.equal(cap2.fases[7].inimigos[0][3].chefe, true);
  assert.ok(cap2.fases[7].inimigos[0][3].bonus?.hp > 0);
  assert.equal(cap2.fases[9].inimigos[0][0], 'Rainha da Colmeia Dourada');
  assert.equal(cap2.fases[9].inimigos[0][2], 'aco');
  assert.equal(cap2.fases[9].inimigos[0][3].chefe, true);
  assert.ok(cap2.fases[9].inimigos[0][3].bonus?.hp > 0);
});

test('Campanha Mini: 3 estrelas via resumoBatalha(b) (reviver conta), liberação em fila, escondida em 30★ e recompensas únicas', () => {
  const s = novoSave();
  const t0 = 50_000_000;

  assert.equal(faseDesbloqueada(s, '1-1'), true);
  assert.equal(faseDesbloqueada(s, '1-2'), false);
  assert.equal(faseDesbloqueada(s, '1-escondida'), false);
  assert.equal(faseDesbloqueada(s, '2-1'), false);

  // Monta batalha real e usa resumoBatalha(b) para avaliar 3★ com reviver
  const u = (id, especie, elemento, classe) => criarUnidade({ id, especie, nivel: 20, lado: 'a', elemento, classe });
  const aliados = [
    u('a0', 'Brasinha', 'fogo', 'guerreiro'),
    u('a1', 'Ignavor', 'fogo', 'tanque'),
    u('a2', 'Gotalume', 'agua', 'mago'),
    u('a3', 'Solinho', 'luz', 'suporte'),
  ];
  const ini = criarUnidade({ id: 'i0', especie: 'Fanalino', nivel: 5, lado: 'i' });
  const b = criarBatalha(aliados, [ini]);
  // Caiu e foi revivido antes do fim -> todos vivos no último turno!
  b.aliados[2].hp = 0;
  b.aliados[2].hp = 40;
  b.inimigos[0].hp = 0;
  b.fim = 'vitoria';
  b.supremas = { a: 2, i: 0 };

  // Verifica 3★ garantidas no resumo real
  const resumo = resumoBatalha(b);
  assert.equal(resumo.todosVivos, true);

  // Joga fases 1..10 do Cap 1 (forçando 3★ com equipe cobrindo classe/elemento/suprema)
  const aliadosFull = [
    u('x0', 'Cervomusgo', 'planta', 'tanque'),
    u('x1', 'Brotavel', 'planta', 'guerreiro'),
    u('x2', 'Mortalio', 'fantasma', 'mago'),
    u('x3', 'Noctarn', 'trevas', 'assassino'),
    u('x4', 'Solarin', 'luz', 'suporte'),
  ].slice(0, 4);

  const recarregueEnergia = (ts) => { darPocaoEnergia(s, 5); usarPocaoEnergia(s, 5, ts); };
  recarregueEnergia(t0);

  for (let num = 1; num <= 10; num++) {
    const faseId = `1-${num}`;
    const iniF = iniciarFaseCampanhaMini(s, faseId, { agoraMs: t0 + num * 1000, batalhaId: `b_${faseId}` });
    assert.equal(iniF.ok, true, `Falhou ao iniciar ${faseId}: ${iniF.motivo}`);

    const fDef = iniF.fase;
    // Ajusta time para satisfazer a condição da fase
    const cond = fDef.condicaoEstrela3;
    const eq = [
      u('e0', 'Brasinha', cond.tipo === 'elemento' ? cond.valor : 'planta', cond.tipo === 'classe' ? cond.valor : 'guerreiro'),
      u('e1', 'Cervomusgo', cond.tipo === 'elemento' ? cond.valor : 'planta', 'suporte'),
    ];
    const bFase = criarBatalha(eq, [ini]);
    bFase.inimigos[0].hp = 0;
    bFase.fim = 'vitoria';
    bFase.supremas = { a: 1, i: 0 };
    if (num === 5) bFase.aliados[1].hp = 10; // todos vivos
    void aliadosFull;

    const fim = concluirFaseCampanhaMini(s, faseId, bFase, { batalhaId: `b_${faseId}`, agoraMs: t0 + num * 1000 });
    assert.equal(fim.ok, true);
    assert.equal(fim.estrelas, 3);
    // Repetição com mesmo batalhaId não paga novamente
    const dup = concluirFaseCampanhaMini(s, faseId, bFase, { batalhaId: `b_${faseId}` });
    assert.equal(dup.jaPago, true);
  }

  // Após 10 fases 3★: Cap 2 abriu, fase escondida do Cap 1 abriu, 10 tickets permanentes pagos 1×, relíquia comum da elite caiu
  assert.equal(faseDesbloqueada(s, '2-1'), true);
  assert.equal(faseDesbloqueada(s, '1-escondida'), true);
  assert.equal(expDe(s).tickets, 10);
  assert.ok(s.idle.reliquias.bolsa.some((r) => r.fonte === 'cm:1-5' && r.raridade === 'comum'));
  assert.ok(hwDe(s).pocoes.pocao_xp_p >= 10);
  assert.equal(hwDe(s).pocoes.pocao_xp_m, 1);

  // Fase escondida garante relíquia rara na 1ª vitória
  const escRes = concluirFaseCampanhaMini(s, '1-escondida', b, { batalhaId: 'b_esc_1' });
  assert.equal(escRes.ok, true);
  assert.ok(s.idle.reliquias.bolsa.some((r) => r.fonte === 'cm:1-escondida' && r.raridade === 'rara'));

  // Baús 3★ de fase e 10/20/30★ de capítulo pagam uma única vez
  const diamAntes = s.recompensas.diamantes;
  const bf1 = coletarBauFase(s, '1-1');
  assert.equal(bf1.ok, true);
  assert.equal(s.recompensas.diamantes, diamAntes + 20);
  assert.equal(coletarBauFase(s, '1-1').ok, false);

  assert.equal(coletarBauCapitulo(s, 1, 10).premios.diamantes, 50);
  assert.equal(coletarBauCapitulo(s, 1, 20).premios.pocao_xp_g, 1);
  assert.equal(coletarBauCapitulo(s, 1, 30).premios.reliquia.raridade, 'rara');
  assert.equal(coletarBauCapitulo(s, 1, 30).ok, false);

  // Batalha rápida em 3★ não gasta energia (livre) e paga 50%
  const enAntes = energiaDe(s, t0 + 60_000).atual;
  const rap = batalhaRapidaCampanhaMini(s, '1-1', { agoraMs: t0 + 60_000, rng: () => 0.1 });
  assert.equal(rap.ok, true);
  assert.equal(rap.energiaRestante, enAntes);
  assert.equal(rap.premios.ouro, 100);
  assert.equal(rap.premios.essencia.qtd, 1);

  // Capítulos 3, 6, 9, 12 dão +10 tickets semanais cada
  const cm = s.idle.campanhaMini;
  for (const c of [2, 3]) {
    cm.fases[`${c}-9`] = { vencida: true, estrelas: 3, concluidas: 1 };
    cm.fases[`${c - 1}-10`] = { vencida: true, estrelas: 3, concluidas: 1 };
    const rChefe = concluirFaseCampanhaMini(s, `${c}-10`, b, { batalhaId: `b_${c}_10` });
    assert.equal(rChefe.ok, true);
  }
  assert.equal(expDe(s).tickets, 30); // Cap 1 + 2 + 3
  assert.equal(expDe(s).ticketsSemanais, 10); // Cap 3
  assert.equal(statusCapitulo(s, 1).estrelas, 30);
});

test('Campanha Mini em ondas: fases 1-3 têm 2 ondas, 4-10 e escondida têm 3 ondas, sem custo de energia', async () => {
  const { CAPITULOS_CAMPANHA_MINI, ENERGIA_TEXTO_EXPLICATIVO } = await import('./regiao1-campanha-mini-regras.js');
  assert.equal(ENERGIA_CFG.ativa, false);
  assert.ok(ENERGIA_TEXTO_EXPLICATIVO.resumo.includes('livres'));
  assert.ok(ENERGIA_TEXTO_EXPLICATIVO.custos.length >= 4);
  for (const cap of CAPITULOS_CAMPANHA_MINI) {
    for (const f of cap.fases) {
      const esp = f.numero <= 3 ? 2 : 3;
      assert.equal(f.ondas.length, esp, `Fase ${f.id} deveria ter ${esp} ondas`);
      assert.ok(f.ondas.every((o) => Array.isArray(o) && o.length >= 1));
      assert.deepEqual(f.inimigos, f.ondas[f.ondas.length - 1]);
    }
    assert.equal(cap.faseEscondida.ondas.length, 3);
  }
});

test('Dificuldade do Cap.1 calibrada em ondas: 1-1..1-3 >= 95% para CADA um dos 5 iniciais (time realista de 4)', async () => {
  const { CAPITULOS_CAMPANHA_MINI } = await import('./regiao1-campanha-mini-regras.js');
  const { criarUnidade, criarBatalha, passoAuto, criarRng } = await import('./regiao1-estrategia-regras.js');
  const { criarEstadoDomadorBatalha } = await import('./regiao1-domadores-regras.js');
  const INICIAIS = ['Brasinha', 'Gotalume', 'Sementil', 'Solinho', 'Penumbrio'];
  const NIVEIS_INICIAL = [5, 7, 8]; // alinhado a tools/simular_iniciais_cap1.mjs e ECONOMIA_PRIMEIRA_HORA.md
  const cap1 = CAPITULOS_CAMPANHA_MINI[0];
  for (let idx = 0; idx < 3; idx++) {
    const fase = cap1.fases[idx];
    const nvIni = NIVEIS_INICIAL[idx];
    for (const ini of INICIAIS) {
      let wins = 0;
      for (let s = 0; s < 50; s++) {
        const rng = criarRng(100 + s * 17 + fase.numero);
        const sv = novoSave();
        const dom = criarEstadoDomadorBatalha(sv, 'azazel');
        const aliados = [
          criarUnidade({ id: 'a0', especie: ini, nivel: nvIni, lado: 'a', tier: 4, estrelas: 1 }),
          criarUnidade({ id: 'a1', especie: 'Cervomusgo', nivel: Math.max(3, nvIni - 1), lado: 'a', tier: 3, estrelas: 1 }),
          criarUnidade({ id: 'a2', especie: 'Tatuveludo', nivel: Math.max(2, nvIni - 2), lado: 'a', tier: 2, estrelas: 1 }),
          criarUnidade({ id: 'a3', especie: 'Fanalino', nivel: Math.max(2, nvIni - 2), lado: 'a', tier: 2, estrelas: 1 }),
        ];
        const ondasUn = fase.ondas.map((o, w) => o.map(([esp, nv, el, opts], i) => criarUnidade({ id: `w${w}_${i}`, especie: esp, nivel: nv, lado: 'i', elemento: el, chefe: Boolean(opts?.chefe), bonus: opts?.bonus || {} })));
        const b = criarBatalha(aliados, ondasUn[0], { domador: dom, ondas: ondasUn.slice(1) });
        while (!b.fim) passoAuto(b, rng);
        if (b.fim === 'vitoria') wins++;
      }
      assert.ok(wins >= 48, `Fase ${fase.id} com ${ini} ficou abaixo de 95%: ${wins * 2}%`);
    }
  }
});

test('Campanha Mini: sem bloqueio de energia e whitelist no save/nuvem sem perdas', () => {
  const s = novoSave();
  const t0 = 100_000_000;
  s.idle.energia = { atual: 0, max: 120, pocoes: 0, ultimoTickMs: t0 };
  const g = gastarEnergia(s, 18, t0);
  assert.equal(g.ok, true);
  assert.equal(g.gasto, 0);
  assert.equal(iniciarFaseCampanhaMini(s, '1-1', { agoraMs: t0 }).ok, true);

  // Save serializa, desserializa na whitelist e passa na validação da nuvem
  concluirFaseCampanhaMini(s, '1-1', { fim: 'vitoria', aliados: [{ hp: 10, classe: 'guerreiro', elemento: 'fogo' }], supremas: { a: 1 } }, { batalhaId: 'w1', agoraMs: t0 });
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.campanhaMini.fases['1-1'].vencida, true);
  assert.equal(rec.idle.energia.atual, 0);
  assert.ok(saldoEssencia(rec, 'verde') !== undefined);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);
  assert.equal(avaliarEstrelasFase('1-1', { fim: 'derrota', aliados: [] }).total, 0);
});

test('Calibração dos Capítulos 2–12 cobre todos os 11 capítulos com bônus válidos nas ondas', async () => {
  const { CALIBRACAO_CAPITULOS_2_12, CAPITULOS_CAMPANHA_MINI } = await import('./regiao1-campanha-mini-regras.js');
  for (let cap = 2; cap <= 12; cap++) {
    const cfg = CALIBRACAO_CAPITULOS_2_12[cap];
    assert.ok(cfg, `Faltou calibração do Cap. ${cap}`);
    for (const k of ['inicio', 'meio', 'fim', 'chefe']) assert.equal(typeof cfg[k], 'number');
    const c = CAPITULOS_CAMPANHA_MINI[cap - 1];
    for (const f of c.fases) {
      for (const onda of f.ondas) {
        for (const [, , , op] of onda) {
          assert.ok(op && op.bonus && Number.isFinite(op.bonus.hp) && Number.isFinite(op.bonus.atk) && Number.isFinite(op.bonus.def), `Bônus inválido em ${f.id}`);
        }
      }
    }
  }
});
