import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from './regiao1-progressao.js';
import * as M from './regiao1-estrategia-regras.js';
import * as H from './regiao1-halloween-regras.js';
import { LINHAGENS_HW, BONUS_TIER } from './regiao1-halloween-dados.js';
import { ESPECIES, CLASSE_DA_ESPECIE, ELEMENTO_DA_ESPECIE } from '../species.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

test('sistema de 30 estrelas: 5 faixas históricas de cor, bônus crescente configurável, custos e tier 1–5 preservado', () => {
  assert.equal(P.ESTRELAS_MAX, 30);
  assert.deepEqual(
    P.FAIXAS_ESTRELAS.map((f) => [f.id, f.de, f.ate, f.cor, Boolean(f.arcoIris)]),
    [
      ['dourada', 1, 6, '#facc15', false],
      ['vermelha', 7, 12, '#ef4444', false],
      ['roxa', 13, 18, '#c084fc', false],
      ['laranja', 19, 24, '#fb923c', false],
      ['arco-iris', 25, 30, '#f472b6', true],
    ],
  );
  assert.equal(P.faixaEstrela(1).nivelNaFaixa, 1);
  assert.equal(P.faixaEstrela(7).id, 'vermelha');
  assert.equal(P.faixaEstrela(7).nivelNaFaixa, 1);
  assert.equal(P.faixaEstrela(30).arcoIris, true);
  assert.equal(P.faixaEstrela(30).nivelNaFaixa, 6);

  // Bônus estritamente crescente estrela por estrela (1..30) e ganho marginal maior nas faixas superiores
  let ant = P.bonusEstrelas(1);
  assert.deepEqual(ant, { hp: 0, atk: 0, def: 0 });
  for (let s = 2; s <= 30; s++) {
    const cur = P.bonusEstrelas(s);
    assert.ok(cur.hp > ant.hp && cur.atk > ant.atk && cur.def > ant.def, `estrela ${s}`);
    ant = cur;
  }
  const passoDourada = P.bonusEstrelas(2).atk - P.bonusEstrelas(1).atk;
  const passoArcoIris = P.bonusEstrelas(30).atk - P.bonusEstrelas(29).atk;
  assert.ok(passoArcoIris > passoDourada);

  // Bônus de tier 1–5 preservado integralmente
  for (const t of [1, 2, 3, 4, 5]) {
    assert.deepEqual(P.bonusTier(t), {
      hp: Math.round(BONUS_TIER(t).hp * 10000) / 10000,
      atk: Math.round(BONUS_TIER(t).atk * 10000) / 10000,
      def: Math.round(BONUS_TIER(t).def * 10000) / 10000,
    });
  }

  // Origem, custos de evolução e valores configuráveis para balanceamento
  const cfgCustom = {
    ...P.ESTRELAS_CFG,
    origem: { ...P.ESTRELAS_CFG.origem, banner: 3 },
    custosPorFaixa: { ...P.ESTRELAS_CFG.custosPorFaixa, dourada: { fragmentos: 4, gold: 50 } },
    ganhoPorFaixa: { ...P.ESTRELAS_CFG.ganhoPorFaixa, dourada: { hp: 0.05, atk: 0.04, def: 0.03 } },
  };
  assert.equal(P.estrelasIniciais('banner', cfgCustom), 3);
  assert.deepEqual(P.bonusEstrelas(3, cfgCustom), { hp: 0.1, atk: 0.08, def: 0.06 });

  const save = { recompensas: { gold: 200 }, idle: { fragmentosEstrela: 10, equipe: [{ especie: 'Noctarn', nivel: 10, tier: 2, estrelas: 3 }] } };
  const evo = P.evoluirEstrela(save, 0, cfgCustom);
  assert.equal(evo.ok, true);
  assert.equal(save.idle.equipe[0].estrelas, 4);
  assert.equal(save.idle.equipe[0].tier, 2); // tier permanece separado das estrelas
  assert.equal(save.idle.fragmentosEstrela, 6);
  assert.equal(save.recompensas.gold, 150);
});

test('save antigo: preserva estrelas existentes (star, stars e estrelas), migra tier 1–5 e passa em /api/confusion-save', () => {
  const antigo = criarEstadoInicial();
  antigo.conta = { uid: 'u-legado', inicial: 'Penumbrio' };
  antigo.recompensas = { gold: 900, diamantes: 120, xp: 80 };
  antigo.idle = {
    jogador: { xp: 80, hp: 100, sanidade: 100 },
    equipe: [
      { especie: 'Fanalino', nivel: 18, xp: P.xpTotal(18), raridade: 2, star: 9, forma: 'natural' },          // campo antigo star
      { especie: 'Almaterna', nivel: 25, xp: P.xpTotal(25), tierHW: 3, stars: 26, forma: 'natural' },        // campo antigo stars + nome provisório HW
      { especie: 'Vitrarco', nivel: 30, xp: P.xpTotal(30), tier: 4, tierHW: 4, estrelas: 15, forma: 'natural' }, // campo estrelas atual
      { especie: 'Brotavel', nivel: 10, xp: P.xpTotal(10), raridade: 1, forma: 'natural' },                  // sem estrelas salvas
    ],
  };

  const carregado = desserializarEstado(serializarEstado(antigo));
  garantirEstadoIdle(carregado, 100_000);
  H.migrarHW(carregado);

  assert.equal(carregado.idle.equipe[0].estrelas, 9);
  assert.equal(carregado.idle.equipe[0].tier, 2);
  assert.equal(carregado.idle.equipe[1].especie, 'Mortálio');
  assert.equal(carregado.idle.equipe[1].estrelas, 26);
  assert.equal(carregado.idle.equipe[1].tier, 3);
  assert.equal(carregado.idle.equipe[1].tierHW, 3);
  assert.equal(carregado.idle.equipe[2].estrelas, 15);
  assert.equal(carregado.idle.equipe[2].tier, 4);
  assert.equal(carregado.idle.equipe[3].estrelas, 1);
  assert.equal(carregado.idle.equipe[3].tier, 1);

  const redondo = desserializarEstado(serializarEstado(carregado));
  assert.deepEqual(redondo.idle.equipe.map((m) => [m.tier, m.estrelas]), [[2, 9], [3, 26], [4, 15], [1, 1]]);
  const nuvem = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(redondo)), conta: redondo.conta });
  assert.equal(nuvem.ok, true);
});

test('combate: dois Oníricos do mesmo nível e tier com estrelas diferentes têm cálculo compartilhado consistente e o de mais estrelas vence', () => {
  const mBaixo = { especie: 'Ignavor', nivel: 30, tier: 3, estrelas: 1 };
  const mAlto = { especie: 'Ignavor', nivel: 30, tier: 3, estrelas: 18 };

  // Via bonusDoMembro (usado por tela.abrir / Campanha / Torre / Calabouço / HV / Estratégia) vs passagem direta em criarUnidade
  const uBaixoViaMembro = M.criarUnidade({ id: 'i0', especie: mBaixo.especie, nivel: mBaixo.nivel, lado: 'i', bonus: H.bonusDoMembro(mBaixo) });
  const uBaixoDireto = M.criarUnidade({ id: 'i0', especie: mBaixo.especie, nivel: mBaixo.nivel, lado: 'i', tier: 3, estrelas: 1 });
  assert.equal(uBaixoViaMembro.hpMax, uBaixoDireto.hpMax);
  assert.equal(uBaixoViaMembro.atk, uBaixoDireto.atk);
  assert.equal(uBaixoViaMembro.def, uBaixoDireto.def);

  const uAlto = M.criarUnidade({ id: 'a0', especie: mAlto.especie, nivel: mAlto.nivel, lado: 'a', bonus: H.bonusDoMembro(mAlto) });
  const uAltoDireto = M.criarUnidade({ id: 'a0', especie: mAlto.especie, nivel: mAlto.nivel, lado: 'a', tier: 3, estrelas: 18 });
  assert.equal(uAlto.hpMax, uAltoDireto.hpMax);
  assert.equal(uAlto.atk, uAltoDireto.atk);
  assert.equal(uAlto.def, uAltoDireto.def);

  // Ambos preservam o mesmo tier (T3), mas 18★ supera 1★ nos três atributos
  assert.equal(uAlto.tier, 3);
  assert.equal(uBaixoViaMembro.tier, 3);
  assert.ok(uAlto.hpMax > uBaixoViaMembro.hpMax);
  assert.ok(uAlto.atk > uBaixoViaMembro.atk);
  assert.ok(uAlto.def > uBaixoViaMembro.def);

  // Duelo 1v1 em combate real com o mesmo nível (30), mesma espécie (Ignavor) e mesmo tier (T3)
  const rng = M.criarRng(42);
  const b = M.criarBatalha([uAlto], [uBaixoViaMembro]);
  for (let guarda = 0; guarda < 80 && !b.fim; guarda++) {
    const ator = M.atorAtual(b);
    if (!ator) break;
    M.executar(b, M.decidir(b, ator, rng), rng);
  }
  assert.equal(b.fim, 'vitoria');
  assert.ok(uAlto.hp > 0 && uBaixoViaMembro.hp === 0);
});

test('classes cadastradas separadamente de elemento e tier: Velalume Suporte, Mortálio Mago, Abyssar Assassino, Abobrisco Tanque e Vitrarco Guerreiro', () => {
  const esperado = {
    Velalume: 'suporte',
    'Mortálio': 'mago',
    Abyssar: 'assassino',
    Abobrisco: 'tanque',
    Vitrarco: 'guerreiro',
  };
  for (const [esp, cls] of Object.entries(esperado)) {
    assert.equal(P.classeDaEspecie(esp), cls);
    assert.equal(CLASSE_DA_ESPECIE[esp], cls);
    assert.equal(ESPECIES[esp].classe, cls);
    const lin = LINHAGENS_HW.find((l) => l.especie === esp);
    assert.equal(lin.classe, cls);
    assert.notEqual(lin.classe, lin.elemento);
    assert.equal(typeof lin.tier, 'number');
    const u = M.criarUnidade({ id: 'u', especie: esp, nivel: 10, lado: 'a' });
    assert.equal(u.classe, cls);
  }
  assert.equal(P.CLASSES_ONIRICOS.suporte.nome, 'Suporte');
  assert.equal(P.CLASSES_ONIRICOS.mago.nome, 'Mago');
  assert.equal(P.CLASSES_ONIRICOS.assassino.nome, 'Assassino');
  assert.equal(P.CLASSES_ONIRICOS.tanque.nome, 'Tanque');
  assert.equal(P.CLASSES_ONIRICOS.guerreiro.nome, 'Guerreiro');
});

test('Mortálio: habilidade rara do VFX violeta preparada e duração exata de 3 turnos dos quatro efeitos (regeneração, velocidade, defesa e escudo)', () => {
  // Por padrão a vaga fica em aberto (vagaKit === null) sem alterar as 3 habilidades ativas atuais do Mortálio
  assert.equal(M.MORTALIO_VIOLETA_CFG.vagaKit, null);
  assert.equal(M.kitDe('Mortálio').length, 3);
  assert.equal(M.KITS['Mortálio'].preparadaVioleta.id, 'manto_violeta');
  assert.equal(M.KITS['Mortálio'].preparadaVioleta.raridade, 'rara');

  const quatro = ['regeneracao', 'veloz', 'defesa_alta', 'escudo'];

  // 1) Aplicada num aliado: os 4 efeitos entram com 3 turnos e duram exatamente 3 turnos desse aliado
  {
    const rng = M.criarRng(7);
    const mort = M.criarUnidade({ id: 'a0', especie: 'Mortálio', nivel: 30, lado: 'a' });
    mort.kit = M.kitMortalio({ vagaKit: 1, alvo: 'aliado', escudo: 0.25, cd: 4 });
    const aliado = M.criarUnidade({ id: 'a1', especie: 'Noctarn', nivel: 25, lado: 'a' });
    const inimigo = M.criarUnidade({ id: 'i0', especie: 'Brotavel', nivel: 10, lado: 'i' });
    aliado.hp = Math.round(aliado.hpMax * 0.6); // ferido para observar a regeneração sem estourar o escudo

    const b = M.criarBatalha([mort, aliado], [inimigo]);
    b.fila = [mort.id]; b.jaIniciou = true; b.iniciado = '';
    M.atorAtual(b);
    M.executar(b, { tipo: 'habilidade', idx: 1, alvo: aliado.id }, rng);

    for (const efId of quatro) {
      assert.equal(aliado.efeitos[efId]?.turnos, 3, `aliado deve receber ${efId} por 3 turnos`);
    }

    // Avança 3 turnos completos do aliado (inimigo apenas defende para não quebrar o escudo por dano)
    for (const restamEsperado of [2, 1, 0]) {
      b.fila = [aliado.id]; b.iniciado = '';
      const hpAntes = aliado.hp;
      M.atorAtual(b);
      if (aliado.hpAntes !== undefined) void hpAntes;
      assert.ok(aliado.hp >= hpAntes); // regeneração ativa no início do turno
      M.executar(b, { tipo: 'defender' }, rng);
      for (const efId of quatro) {
        if (restamEsperado > 0) assert.equal(aliado.efeitos[efId]?.turnos, restamEsperado, `${efId} após turno`);
        else assert.equal(aliado.efeitos[efId], undefined, `${efId} deve expirar após 3 turnos`);
      }
    }
  }

  // 2) Aplicada em si mesmo (alvo: 'si'): compensa o fimDoTurno do conjurador e mantém exatamente 3 turnos nos 4 efeitos
  {
    const rng = M.criarRng(11);
    const mort = M.criarUnidade({ id: 'a0', especie: 'Mortálio', nivel: 30, lado: 'a' });
    mort.kit = M.kitMortalio({ vagaKit: 1, alvo: 'si', escudo: 0.25, cd: 4 });
    const inimigo = M.criarUnidade({ id: 'i0', especie: 'Brotavel', nivel: 10, lado: 'i' });

    const b = M.criarBatalha([mort], [inimigo]);
    b.fila = [mort.id]; b.jaIniciou = true; b.iniciado = '';
    M.atorAtual(b);
    M.executar(b, { tipo: 'habilidade', idx: 1 }, rng);

    for (const efId of quatro) {
      assert.equal(mort.efeitos[efId]?.turnos, 3, `autoalvo deve ficar com ${efId} por 3 turnos após usar`);
    }

    for (const restamEsperado of [2, 1, 0]) {
      b.fila = [mort.id]; b.iniciado = '';
      M.atorAtual(b);
      M.executar(b, { tipo: 'defender' }, rng);
      for (const efId of quatro) {
        if (restamEsperado > 0) assert.equal(mort.efeitos[efId]?.turnos, restamEsperado, `${efId} autoalvo`);
        else assert.equal(mort.efeitos[efId], undefined, `${efId} autoalvo deve expirar após 3 turnos`);
      }
    }
  }
});
