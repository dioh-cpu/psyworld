import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { expDe, invocar } from './regiao1-exp-regras.js';
import { consultarEvolucaoForma, adicionarFragmentoSonho } from './regiao1-regras-sonho.js';
import { evoluirFormaOnirico } from './regiao1-criacao-regras.js';
import { adicionarEssencia } from './regiao1-campanha-mini-regras.js';
import {
  progressoGuiaJogadorNovo,
  renderGuiaJogadorNovo,
  tratarCliqueTutorialModo,
} from './regiao1-tutoriais-modos.js';
import { urlFundoTela } from './regiao1-perf-mobile.js';

const INICIAIS_BANNER = new Set(['Brasinha', 'Gotalume', 'Sementil']);

function criarRngDeterministico(seed = 20261127) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

test('banner Adventurer: invocar até sair um inicial (Brasinha, Gotalume ou Sementil) confirma T4 e bloqueio da forma T5 antes do nível 40', () => {
  const save = criarEstadoInicial();
  save.idle = save.idle || {};
  save.idle.equipe = [];
  expDe(save).tickets = 400;

  const rng = criarRngDeterministico(42);
  let obtido = null;
  let tentativas = 0;
  while (!obtido && tentativas < 400) {
    tentativas += 1;
    const res = invocar(save, rng);
    assert.equal(res.ok, true);
    if (INICIAIS_BANNER.has(res.especie)) obtido = res;
  }

  assert.ok(obtido, 'Deve sortear ao menos um inicial (Brasinha, Gotalume ou Sementil) no banner Adventurer');
  assert.equal(obtido.tier, 4, `Inicial ${obtido.especie} deve sair como T4 no banner`);

  const idx = save.idle.equipe.findIndex((m) => m.especie === obtido.especie && m.origem === 'banner');
  assert.ok(idx >= 0, 'Inicial sorteado deve constar na equipe do save');
  const unidade = save.idle.equipe[idx];
  assert.equal(unidade.tier, 4);

  // Concede Fragmentos e Essências sobrando para testar apenas a trava de nível
  for (const el of ['fogo', 'agua', 'planta', 'trevas', 'luz', 'neutro']) {
    adicionarFragmentoSonho(save, el, 200);
  }
  for (const par of ['ignea', 'mares', 'verde', 'mineral', 'solar', 'sombria']) {
    adicionarEssencia(save, par, 'menor', 60);
    adicionarEssencia(save, par, 'media', 60);
    adicionarEssencia(save, par, 'maior', 30);
  }

  // Evolui forma 1 (base) -> forma 2 (intermediária) no nível 20
  unidade.nivel = 20;
  const cBase = consultarEvolucaoForma(save, idx);
  assert.equal(cBase.podeEvoluir, true);
  const ev1 = evoluirFormaOnirico(save, idx);
  assert.equal(ev1.ok, true);

  // Forma 2 -> forma final T5 bloqueada no nível 39 mesmo com recursos sobrando
  unidade.nivel = 39;
  const c39 = consultarEvolucaoForma(save, idx);
  assert.equal(c39.podeEvoluir, false);
  assert.equal(c39.faltaNivel, 1);
  assert.match(c39.motivo, /nível 40/i);
  assert.equal(evoluirFormaOnirico(save, idx).ok, false);

  // No nível 40 libera e evolui para T5
  unidade.nivel = 40;
  const c40 = consultarEvolucaoForma(save, idx);
  assert.equal(c40.podeEvoluir, true);
  assert.equal(c40.faltaNivel, 0);
  const ev2 = evoluirFormaOnirico(save, idx);
  assert.equal(ev2.ok, true);
});

test('guia passo a passo do jogador novo acompanha inicial -> 1a batalha -> evoluir -> invocar sem repetir', () => {
  const save = criarEstadoInicial();
  save.idle = { equipe: [], exp: { pulls: 0, tut: {} } };

  // Passo 1: sem inicial
  assert.equal(progressoGuiaJogadorNovo(save).atual.id, 'inicial');

  // Passo 2: escolheu inicial -> pede 1ª batalha
  save.idle.equipe.push({ uid: 'ini_1', especie: 'Brasinha', nivel: 1, formaFase: 1 });
  assert.equal(progressoGuiaJogadorNovo(save).atual.id, 'batalha');
  assert.ok(renderGuiaJogadorNovo(save).includes('data-guia-novo="batalha"'));

  // Passo 3: venceu 1ª batalha -> pede evoluir
  save.idle.campanhaMini = { fases: { '1-1': { vencida: true, estrelas: 2 } } };
  assert.equal(progressoGuiaJogadorNovo(save).atual.id, 'evoluir');

  // Passo 4: evoluiu -> pede invocar
  save.idle.equipe[0].especie = 'Ignavor';
  save.idle.equipe[0].formaFase = 2;
  assert.equal(progressoGuiaJogadorNovo(save).atual.id, 'invocar');

  // Concluído ao fazer 1ª invocação: some definitivamente
  save.idle.exp.pulls = 1;
  assert.equal(progressoGuiaJogadorNovo(save).concluido, true);
  assert.equal(renderGuiaJogadorNovo(save), '');

  // Dispensa manual persiste após reload
  const save2 = criarEstadoInicial();
  save2.idle = { equipe: [{ uid: 'ini_2', especie: 'Gotalume', nivel: 1, formaFase: 1 }] };
  assert.equal(tratarCliqueTutorialModo({ guiaNovoOk: '1' }, { save: save2 }), true);
  const rec = desserializarEstado(serializarEstado(save2));
  assert.equal(progressoGuiaJogadorNovo(rec).dispensado, true);
  assert.equal(renderGuiaJogadorNovo(rec), '');
});

test('urlFundoTela seleciona versão 1280 mobile no celular e 2560 no desktop', () => {
  const mob = urlFundoTela('equipe', { mobile: true, fallback: 'assets/fallback.webp' });
  assert.equal(mob.principal, 'assets/confusion/interface/telas-v2/mobile/equipe.webp');
  assert.equal(mob.alternativo, 'assets/confusion/interface/telas-v2/equipe.webp');
  assert.equal(mob.fallback, 'assets/fallback.webp');

  const desk = urlFundoTela('equipe', { mobile: false, fallback: 'assets/fallback.webp' });
  assert.equal(desk.principal, 'assets/confusion/interface/telas-v2/equipe.webp');
  assert.equal(desk.alternativo, null);
});
