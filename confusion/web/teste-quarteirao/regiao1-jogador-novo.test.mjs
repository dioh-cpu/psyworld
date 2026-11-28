import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import {
  expDe,
  invocar,
  invocacoesGratisDe,
  INVOCACOES_GRATIS_CFG,
  GARANTIAS_BANNER,
  poolBanner,
} from './regiao1-exp-regras.js';
import {
  BOAS_VINDAS,
  MENSAGEM_BONUS_BOAS_VINDAS,
  ehConvidadoComProgresso,
  decidirEntradaConta,
  prepararInicialLocal,
  prepararContaNova,
  consumirToastBonusBoasVindas,
  vipAtivo,
  diasVip,
} from './regiao1-conta.js';
import { consultarEvolucaoForma, adicionarFragmentoSonho } from './regiao1-regras-sonho.js';
import { evoluirFormaOnirico } from './regiao1-criacao-regras.js';
import { adicionarEssencia } from './regiao1-campanha-mini-regras.js';
import {
  progressoGuiaJogadorNovo,
  renderGuiaJogadorNovo,
  tratarCliqueTutorialModo,
} from './regiao1-tutoriais-modos.js';
import { urlFundoTela, urlAnimacaoOnirico, coletarAnimacoesEmCampo } from './regiao1-perf-mobile.js';

const INICIAIS_BANNER = new Set(['Brasinha', 'Gotalume', 'Sementil']);
const T5_ESPERADOS = new Set(['Ignaraz', 'Vaelirion', 'Florivel']);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

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

  // Evolui forma 1 (base) -> forma 2 (intermediária) a partir do nível 41
  unidade.nivel = 40;
  assert.equal(consultarEvolucaoForma(save, idx).podeEvoluir, false);
  unidade.nivel = 41;
  const cBase = consultarEvolucaoForma(save, idx);
  assert.equal(cBase.podeEvoluir, true);
  const ev1 = evoluirFormaOnirico(save, idx);
  assert.equal(ev1.ok, true);

  // Forma 2 -> forma final T5 bloqueada no nível 80 mesmo com recursos sobrando
  unidade.nivel = 80;
  const c80 = consultarEvolucaoForma(save, idx);
  assert.equal(c80.podeEvoluir, false);
  assert.equal(c80.faltaNivel, 1);
  assert.match(c80.motivo, /nível 81/i);
  assert.equal(evoluirFormaOnirico(save, idx).ok, false);

  // No nível 81 libera e evolui para T5
  unidade.nivel = 81;
  const c81 = consultarEvolucaoForma(save, idx);
  assert.equal(c81.podeEvoluir, true);
  assert.equal(c81.faltaNivel, 0);
  const ev2 = evoluirFormaOnirico(save, idx);
  assert.equal(ev2.ok, true);
});

test('banner Adventurer: 10 grátis/dia acumulando até 100, garantias 10→T3 / 30→T4 / 50→T5 e T5 só Ignaraz/Vaelirion/Florivel', () => {
  const DIA = 86400000;
  const baseMs = Date.UTC(2026, 10, 1, 12, 0, 0);
  const save = criarEstadoInicial();
  save.idle = save.idle || {};
  save.idle.equipe = [];

  // Dia 1: 10 grátis
  const g1 = invocacoesGratisDe(save, baseMs);
  assert.equal(g1.porDia, 10);
  assert.equal(g1.max, 100);
  assert.equal(g1.saldo, 10);

  // +4 dias sem gastar -> 50 grátis
  const g5 = invocacoesGratisDe(save, baseMs + 4 * DIA);
  assert.equal(g5.saldo, 50);

  // +10 dias sem gastar -> teto de 100
  const g15 = invocacoesGratisDe(save, baseMs + 14 * DIA);
  assert.equal(g15.saldo, INVOCACOES_GRATIS_CFG.max);
  assert.equal(g15.proximaEmMs, null);

  // Pool T5 contém exclusivamente Ignaraz, Vaelirion e Florivel
  const t5Pool = poolBanner().filter((p) => p.tier === 5);
  assert.deepEqual(new Set(t5Pool.map((p) => p.especie)), T5_ESPERADOS);
  assert.equal(t5Pool.length, 3);

  // Garantias exatas com RNG no pior caso (0 -> comum fora das garantias)
  assert.deepEqual(GARANTIAS_BANNER, { rara: 10, epica: 30, lendaria: 50 });
  const resultados = [];
  for (let i = 1; i <= 50; i++) {
    const r = invocar(save, () => 0, baseMs + 14 * DIA);
    assert.equal(r.ok, true);
    assert.equal(r.gratis, true);
    resultados.push(r);
  }
  assert.equal(resultados[9].tier, 3, '10ª invocação deve garantir T3');
  assert.equal(resultados[29].tier, 4, '30ª invocação deve garantir T4');
  assert.equal(resultados[49].tier, 5, '50ª invocação deve garantir T5');
  assert.ok(T5_ESPERADOS.has(resultados[49].especie), `T5 garantido (${resultados[49].especie}) deve estar em Ignaraz/Vaelirion/Florivel`);
  assert.equal(expDe(save).gratis.saldo, 50, '50 invocações grátis consumidas de 100 devem deixar 50');
});

test('convidado -> criar conta: preserva progresso, paga bônus único 20.000💎 + 10d VIP e consome toast 1x', () => {
  const agora = Date.UTC(2026, 10, 27, 12, 0, 0);
  const save = criarEstadoInicial();
  prepararInicialLocal(save, 'Brasinha', agora);
  save.recompensas.gold = 350;
  save.recompensas.xp = 120;
  assert.equal(ehConvidadoComProgresso(save), true);
  assert.equal(save.recompensas.diamantes, BOAS_VINDAS.diamantes);
  assert.equal(vipAtivo(save, agora), true);

  const dec1 = decidirEntradaConta({ remoto: null, local: save, userId: 'usr-qa-1' });
  assert.equal(dec1.acao, 'preparar');
  assert.equal(dec1.novo, true);

  prepararContaNova(save, { userId: 'usr-qa-1', inicial: 'Brasinha', agora, novo: dec1.novo });
  assert.equal(save.conta.uid, 'usr-qa-1');
  assert.equal(save.recompensas.diamantes, BOAS_VINDAS.diamantes);
  assert.equal(vipAtivo(save, agora), true);
  assert.equal(diasVip(save, agora), BOAS_VINDAS.vipDias);
  assert.equal(save.recompensas.gold, 350, 'Progresso de gold do convidado deve ser preservado');

  // Segunda entrada com a mesma conta NÃO paga o bônus novamente
  const dec2 = decidirEntradaConta({ remoto: null, local: save, userId: 'usr-qa-1' });
  assert.equal(dec2.novo, false);
  prepararContaNova(save, { userId: 'usr-qa-1', inicial: 'Brasinha', agora: agora + 1000, novo: dec2.novo });
  assert.equal(save.recompensas.diamantes, BOAS_VINDAS.diamantes);

  // Toast pendente é consumido uma única vez
  const store = new Map([['cw-bonus-boas-vindas-toast', '1']]);
  const fakeStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    removeItem: (k) => store.delete(k),
  };
  assert.match(MENSAGEM_BONUS_BOAS_VINDAS, /20\.000.*10 dias de VIP/i);
  assert.equal(consumirToastBonusBoasVindas(fakeStorage), true);
  assert.equal(consumirToastBonusBoasVindas(fakeStorage), false);
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

test('urlFundoTela seleciona versão 1280 mobile no celular e 2560 no desktop, com paridade em telas-v2/mobile/', () => {
  const mob = urlFundoTela('equipe', { mobile: true, fallback: 'assets/fallback.webp' });
  assert.equal(mob.principal, 'assets/confusion/interface/telas-v2/mobile/equipe.webp');
  assert.equal(mob.alternativo, 'assets/confusion/interface/telas-v2/equipe.webp');
  assert.equal(mob.fallback, 'assets/fallback.webp');

  const desk = urlFundoTela('equipe', { mobile: false, fallback: 'assets/fallback.webp' });
  assert.equal(desk.principal, 'assets/confusion/interface/telas-v2/equipe.webp');
  assert.equal(desk.alternativo, null);

  // Confere que todas as artes 2560px em telas-v2/ têm versão otimizada em telas-v2/mobile/ menor em bytes
  const dirDesk = path.join(REPO_ROOT, 'assets/confusion/interface/telas-v2');
  const dirMob = path.join(dirDesk, 'mobile');
  const arquivos = fs.readdirSync(dirDesk).filter((f) => f.endsWith('.webp'));
  assert.ok(arquivos.length >= 13, `Esperava >= 13 fundos telas-v2, encontrou ${arquivos.length}`);
  for (const arq of arquivos) {
    const pDesk = path.join(dirDesk, arq);
    const pMob = path.join(dirMob, arq);
    assert.ok(fs.existsSync(pMob), `Falta versão mobile em telas-v2/mobile/${arq}`);
    assert.ok(
      fs.statSync(pMob).size < fs.statSync(pDesk).size,
      `Versão mobile ${arq} deve ser menor que desktop 2560px`,
    );
  }
});

test('coletarAnimacoesEmCampo carrega apenas os Oníricos em campo (aliados à direita, inimigos à esquerda)', () => {
  const b = {
    aliados: [{ especie: 'Brasinha' }, { especie: 'Cervomusgo' }, { especie: 'Brasinha' }],
    inimigos: [{ especie: 'Abobrisco' }],
  };
  const urls = coletarAnimacoesEmCampo(b);
  assert.deepEqual(urls, [
    'assets/confusion/animacoes/brasinha/idle-direita.webm',
    'assets/confusion/animacoes/brasinha/andar-direita.webm',
    'assets/confusion/animacoes/cervomusgo/idle-direita.webm',
    'assets/confusion/animacoes/cervomusgo/andar-direita.webm',
    'assets/confusion/animacoes/abobrisco/idle-esquerda.webm',
    'assets/confusion/animacoes/abobrisco/andar-esquerda.webm',
  ]);
  assert.equal(
    urlAnimacaoOnirico('Ignavor', 'andar', 'costas', { formato: 'webp' }),
    'assets/confusion/animacoes/ignavor/andar-costas.webp',
  );
});

test('Cervomusgo: animações idle e andar nas 4 direções (.webm + .webp) para as 3 formas (cervomusgo-f1/f2/f3) e abaixo de 600 KB', () => {
  for (const forma of ['f1', 'f2', 'f3']) {
  const dir = path.join(REPO_ROOT, `assets/confusion/animacoes/cervomusgo-${forma}`);
  assert.ok(fs.existsSync(dir), `Pasta ${dir} deve existir`);
  for (const ac of ['idle', 'andar']) {
    for (const d of ['frente', 'direita', 'costas', 'esquerda']) {
      for (const ext of ['webm', 'webp']) {
        const p = path.join(dir, `${ac}-${d}.${ext}`);
        assert.ok(fs.existsSync(p), `Falta ${p}`);
        const kb = fs.statSync(p).size / 1024;
        assert.ok(kb > 1 && kb <= 600, `${path.basename(p)} deve pesar <= 600 KB (atual: ${kb.toFixed(1)} KB)`);
      }
    }
  }
  }
});



