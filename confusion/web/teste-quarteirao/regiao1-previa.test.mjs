// Testes integrados da Prévia Jogável da Região 1 (#57 + #58 + #59).
// Cobre os dois percursos de aprovação: (1) Conta nova da escolha do inicial à primeira batalha e
// (2) Save antigo passando por Equipe/Ficha, Evolução por Fragmentos de Sonho, Revanche/Craft de Chefe,
// retorno do Idle e resgate/eclosão do Ovo de Dinossauro T5 do Passe, além da remoção dos controles legados.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { criarEstadoInicial } from './regiao1-estado.js';
import { INICIAIS, prepararContaNova } from './regiao1-conta.js';
import { criarUnidade, criarBatalha, passoAuto } from './regiao1-estrategia-regras.js';
import { resolverEncontroCatalogo, ehEspecieInicial } from './regiao1-encontros-regras.js';
import { garantirEstadoIdle, liquidarPeriodoIdle, resgatarTudoPasse, chocarPrimeiroOvo, comprarEsferaIdle, comprarOuEquiparReliquia, resgatarLojaVoto } from './regiao1-idle.js';
import { fichaOnirico, evoluirFormaOnirico, adicionarFragmentoSonho } from './regiao1-criacao-regras.js';
import { adicionarEssencia } from './regiao1-regras-sonho.js';
import { iniciarRevancheChefe, concluirRevancheChefe, previsaoCraftChefe, craftarChefe, REVANCHE_CFG } from './regiao1-revanche-regras.js';
import { ganharXpPasse } from './regiao1-passe-regras.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));

test('Percurso 1 (Conta nova): escolha do inicial base T4 até a primeira batalha sem iniciais inimigos', () => {
  assert.equal(INICIAIS.length, 5);
  for (const ini of INICIAIS) {
    assert.equal(ini.tier, 4);
    assert.match(ini.moldura, /moldura-4\.png$/);
  }

  const save = criarEstadoInicial();
  garantirEstadoIdle(save);
  prepararContaNova(save, { userId: 'viajante_1', inicial: 'Brasinha' });
  assert.equal(save.conta.inicial, 'Brasinha');
  // Conta nova recebe exclusivamente o inicial escolhido (sem Penumbrio/Noctarn extra)
  assert.equal(save.idle.equipe.length, 1);

  const principal = save.idle.equipe[0];
  assert.equal(principal.especie, 'Brasinha');
  assert.equal(principal.tier, 4);
  assert.equal(principal.estrelas, 1);

  const ficha = fichaOnirico(principal, save);
  assert.equal(ficha.tier, 4);
  assert.equal(ficha.estrelas, 1);
  assert.equal(ficha.arvore.possuiArvore, true);
  assert.equal(ficha.arvore.formas.length, 3);
  assert.equal(ficha.arvore.proxima.custo, 10);
  assert.ok(ficha.habilidades.length >= 1 && ficha.habilidades.length <= 3);

  // Primeira batalha contra encontro resolvido da Região 1 (nunca inicial como inimigo)
  const enc = resolverEncontroCatalogo({ especie: 'Brasinha', nivel: 3 }, { regiao: 1 });
  assert.equal(ehEspecieInicial(enc.especie), false);

  const aliado = criarUnidade({ id: 'a0', especie: principal.especie, nivel: principal.nivel, lado: 'a', tier: principal.tier, estrelas: principal.estrelas });
  const inimigo = criarUnidade({ id: 'i0', especie: enc.especie, nivel: enc.nivel, lado: 'i' });
  const b = criarBatalha([aliado], [inimigo]);
  assert.equal(b.aliados.length, 1);
  assert.equal(b.inimigos.length, 1);

  let passos = 0;
  while (!b.fim && passos < 60) {
    passoAuto(b, () => 0.5);
    passos += 1;
  }
  assert.equal(Boolean(b.fim), true);
  assert.equal(b.fim, 'vitoria');
});

test('Percurso 2 (Save antigo): Equipe/Ficha, Evolução 10/30, Revanche/Craft, Idle e Ovo T5 do Passe', () => {
  const agora = Date.UTC(2026, 6, 15, 12, 0, 0);
  const save = criarEstadoInicial();
  save.bossesDerrotados = { BOSS_E: true };
  save.idle = {
    criadoEm: agora - 40 * 86400_000,
    ultimoTickMs: agora - 60 * 60_000,
    equipe: [
      { uid: 'ini_old', especie: 'Gotalume', nivel: 12, xp: 400, tier: 4, stars: 6, origem: 'inicial', formaFase: 1 },
      { uid: 'noc_old', especie: 'Noctarn', nivel: 15, xp: 900, tier: 4, star: 8 },
      { uid: 'kng_old', especie: 'Cervomusgo', nivel: 10, xp: 200, tier: 2, estrelas: 3, formaFase: 1 },
    ],
    formacao: ['ini_old', 'noc_old', 'kng_old', null],
    mochila: {
      esferas: { comum: 5, rara: 2 },
      reliquiasPossuidas: ['amuleto_antigo'],
      ovos: [],
    },
  };

  // Migração preserva equipe, estrelas, tier e itens legados sem reativar esferas/relíquias
  const idle = garantirEstadoIdle(save, agora);
  assert.equal(idle.equipe[0].estrelas, 6);
  assert.equal(idle.equipe[1].especie, 'Noctarn');
  assert.equal(idle.equipe[1].estrelas, 8);
  assert.equal(idle.mochila.esferas.comum, 5);
  assert.equal(comprarEsferaIdle(save, 'comum').ok, false);
  assert.equal(comprarOuEquiparReliquia(save, 'amuleto_solar').ok, false);
  assert.equal(resgatarLojaVoto(save, 'esferas').ok, false);

  // Equipe & Ficha unificada (#57 + #58 + #59)
  const fichaGot = fichaOnirico(idle.equipe[0], save);
  assert.equal(fichaGot.estrelas, 6);
  assert.equal(fichaGot.tier, 4);
  assert.ok(fichaGot.bonusEstrelas.hp > 0);
  assert.equal(fichaGot.arvore.proxima.custo, 10);

  // Evolução por Fragmentos de Sonho (10/30) + Essências elementais (20m+5med / 30med+10M)
  adicionarFragmentoSonho(save, 'agua', 40);
  adicionarEssencia(save, 'agua', 'menor', 20);
  adicionarEssencia(save, 'agua', 'media', 35);
  adicionarEssencia(save, 'agua', 'maior', 10);
  const evo1 = evoluirFormaOnirico(save, 0);
  assert.equal(evo1.ok, true);
  assert.equal(idle.equipe[0].especie, 'Vaelith');
  assert.equal(idle.equipe[0].tier, 4);
  assert.equal(idle.equipe[0].estrelas, 6);
  const evo2 = evoluirFormaOnirico(save, 0);
  assert.equal(evo2.ok, true);
  assert.equal(idle.equipe[0].especie, 'Vaelirion');
  assert.equal(idle.equipe[0].tier, 5);

  // Não-inicial preserva tier ao evoluir forma
  adicionarFragmentoSonho(save, 'planta', 10);
  adicionarEssencia(save, 'planta', 'menor', 20);
  adicionarEssencia(save, 'planta', 'media', 5);
  const evoReino = evoluirFormaOnirico(save, 2);
  assert.equal(evoReino.ok, true);
  assert.equal(idle.equipe[2].tier, 2);

  // Revanche de Chefe (10 min reais independente de ×3) + Craft com 10 fragmentos (Nv.1 T5 +20%)
  const revIni = iniciarRevancheChefe(save, 'BOSS_E', { agoraMs: agora, velocidade: 3 });
  assert.equal(revIni.ok, true);
  const revFim = concluirRevancheChefe(save, { batalhaId: revIni.batalha.batalhaId, vitoria: true, agoraMs: agora + 30_000, velocidade: 3, rng: () => 0.1 });
  assert.equal(revFim.ok, true);
  assert.equal(revFim.fragmentosGanhos, 1);
  // Bloqueado antes dos 10 min reais
  assert.equal(iniciarRevancheChefe(save, 'BOSS_E', { agoraMs: agora + 30_000 + REVANCHE_CFG.cooldownMs - 1000, velocidade: 3 }).ok, false);
  // Completar 10 fragmentos e craftar chefe
  idle.mochila.fragmentosChefe.BOSS_E = 10;
  const prevCraft = previsaoCraftChefe(save, 'BOSS_E');
  assert.equal(prevCraft.podeCraftar, true);
  assert.match(prevCraft.avisoRegra, /Nível 1/);
  const craft = craftarChefe(save, 'BOSS_E', { agoraMs: agora + 60_000 });
  assert.equal(craft.ok, true);
  assert.equal(craft.unidade.nivel, 1);
  assert.equal(craft.unidade.tier, 5);
  assert.equal(fichaOnirico(craft.unidade, save).categoriaPoder, 'chefe_recrutado');

  // Retorno do Idle: 1 XP de Passe por abate liquidado + ouro/XP + fragmentos de sonho
  const idleRet = liquidarPeriodoIdle(save, { agoraMs: agora, nivelArea: 6, especiePadrao: 'Cervomusgo', rng: () => 0.001 });
  assert.ok(idleRet && idleRet.abates > 0);
  assert.equal(idleRet.xpPasseGanho, idleRet.abates);

  // Passe nível 100: resgate único do Ovo de Dinossauro T5 + eclosão no nível 1
  const diaFim = Date.UTC(2026, 6, 30, 12, 0, 0);
  ganharXpPasse(save, 'manual', 100000, diaFim);
  const resg = resgatarTudoPasse(save, diaFim);
  assert.equal(resg.nivel, 100);
  assert.equal(resg.pagos.filter((x) => x.tipo === 'ovoT5').length, 1);
  assert.equal(idle.mochila.ovos.filter((o) => o.tier === 5).length, 1);
  // Segundo resgate não duplica o ovo T5
  resgatarTudoPasse(save, diaFim);
  assert.equal(idle.mochila.ovos.filter((o) => o.tier === 5).length, 1);
  const ovoT5 = idle.mochila.ovos.find((o) => o.tier === 5);
  assert.ok(ovoT5);
  assert.equal(ovoT5.tier, 5);
  // Move ovoT5 para a frente e choca
  idle.mochila.ovos = [ovoT5];
  const choco = chocarPrimeiroOvo(save, () => 0.25);
  assert.equal(choco.ok, true);
  assert.equal(choco.onirico.tier, 5);
  assert.equal(choco.onirico.nivel, 1);
});

test('Interfaces da Prévia: controles de Esferas/Captura/Relíquias removidos, Revanche/Chefes, kit menus-v1 (#63) e montaria (#claude)', () => {
  const html = fs.readFileSync(path.join(DIR, 'regiao1.html'), 'utf8');
  const uiIdle = fs.readFileSync(path.join(DIR, 'regiao1-ui-idle.js'), 'utf8');
  const expansao = fs.readFileSync(path.join(DIR, 'regiao1-expansao.js'), 'utf8');

  for (const proibido of ['id="ac-capturar"', 'id="mochila-esferas"', 'id="mochila-reliquias"', 'data-voto-loja="esferas"']) {
    assert.equal(html.includes(proibido), false, `HTML não deve mais conter ${proibido}`);
  }
  assert.equal(html.includes('id="mochila-fragmentos"'), true);
  assert.equal(html.includes('menus-v1/mochila/fundo.webp'), true);
  assert.equal(html.includes('menus-v1/passe/fundo.webp'), true);
  assert.equal(html.includes('menus-v1/login/fundo.webp'), true);
  assert.equal(uiIdle.includes('comprarEsferaIdle'), false);
  assert.equal(uiIdle.includes('comprarOuEquiparReliquia'), false);
  assert.equal(uiIdle.includes('passe/recompensa-grande-premio.png'), true);
  assert.equal(uiIdle.includes('login/dia-hoje.png'), true);
  assert.equal(expansao.includes('data-rev-lutar'), true);
  assert.equal(expansao.includes('data-rev-craft'), true);
  assert.equal(expansao.includes('equipe/fundo.webp'), true);
  assert.equal(expansao.includes('menus-v1/ficha/fundo.webp'), true);
  assert.equal(expansao.includes('menus-v1/chefes/fundo.webp'), true);
  assert.equal(expansao.includes('arte: rf.arteForma'), true);
  assert.equal(fs.existsSync(path.join(DIR, 'regiao1-montaria.js')), true);
});

test('Regras Noctarn integradas: Penumbrio → Noctarn bloqueada e cópia de banner preservada em T4', () => {
  const save = criarEstadoInicial();
  garantirEstadoIdle(save);
  prepararContaNova(save, { userId: 'viajante_sombra', inicial: 'Penumbrio' });
  assert.equal(save.idle.equipe.length, 1);
  assert.equal(save.idle.equipe[0].especie, 'Penumbrio');

  // Mesmo com fragmentos suficientes, Penumbrio → Noctarn fica bloqueada
  adicionarFragmentoSonho(save, 'trevas', 50);
  const fichaPen = fichaOnirico(save.idle.equipe[0], save);
  assert.equal(fichaPen.arvore.bloqueada, true);
  assert.ok(fichaPen.arvore.motivoBloqueio);
  const resEvo = evoluirFormaOnirico(save, 0);
  assert.equal(resEvo.ok, false);
  assert.equal(resEvo.bloqueada, true);
  assert.equal(save.idle.equipe[0].especie, 'Penumbrio');

  // Cópia de Noctarn obtida em banner é preservada em T4 após migração
  save.idle.equipe.push({ uid: 'ban_noc', especie: 'Noctarn', nivel: 10, xp: 300, tier: 4, estrelas: 3, origem: 'banner', fonteBanner: 'sombra' });
  garantirEstadoIdle(save);
  const copiaBanner = save.idle.equipe.find((m) => m.uid === 'ban_noc');
  assert.ok(copiaBanner);
  assert.equal(copiaBanner.especie, 'Noctarn');
  assert.equal(copiaBanner.tier, 4);
  assert.equal(copiaBanner.estrelas, 3);
});

test('Ajustes de telas (dioh293): evento semanal sem undefined, Mochila em categorias, Passe sem sobreposição, Descanso, Banner e Halloween', async () => {
  const { resumoEventosAtuais } = await import('./regiao1-idle.js');
  const { aberto } = await import('./regiao1-exp-regras.js');

  const ev = resumoEventosAtuais(Date.UTC(2026, 6, 15, 12, 0, 0));
  assert.ok(ev.semanal.nome && ev.semanal.efeito && !String(ev.semanal.efeito).includes('undefined'));
  assert.ok(ev.mensal.nome && ev.mensal.efeito && !String(ev.mensal.efeito).includes('undefined'));

  const s = criarEstadoInicial();
  garantirEstadoIdle(s);
  assert.equal(aberto(s, 'descanso'), true);

  const html = fs.readFileSync(path.join(DIR, 'regiao1.html'), 'utf8');
  const exp = fs.readFileSync(path.join(DIR, 'regiao1-expansao.js'), 'utf8');
  const hw = fs.readFileSync(path.join(DIR, 'regiao1-halloween.js'), 'utf8');
  assert.equal(html.includes('id="mochila-cats"'), true);
  assert.equal(html.includes('id="mochila-detalhe"'), true);
  assert.equal(html.includes('id="temp-corpo"'), true);
  assert.equal(html.includes('id="m-descanso"'), true);
  assert.equal(exp.includes('function abaDescanso()'), true);
  assert.equal(exp.includes("$('#exp-corpo').scrollTop = 0"), true);
  assert.equal(hw.includes('hw-hero'), true);
  assert.equal(hw.includes("$('#hw-corpo').scrollTop = 0"), true);
});

test('Integração descanso-v1 e invocacao-v1 (PR #68): artes presentes em disco, poses de repouso e banners reais sem invenção', () => {
  const ROOT = path.resolve(DIR, '..', '..', '..');
  const assetsEsperados = [
    'assets/confusion/interface/descanso-v1/sala.webp',
    'assets/confusion/interface/descanso-v1/avatar-azazel.webp',
    'assets/confusion/interface/descanso-v1/iniciais/brasinha.webp',
    'assets/confusion/interface/descanso-v1/iniciais/gotalume.webp',
    'assets/confusion/interface/descanso-v1/iniciais/penumbrio.webp',
    'assets/confusion/interface/descanso-v1/iniciais/sementil.webp',
    'assets/confusion/interface/descanso-v1/iniciais/solinho.webp',
    'assets/confusion/interface/invocacao-v1/palco-adventurer.webp',
    'assets/confusion/interface/invocacao-v1/palco-halloween.webp',
    'assets/confusion/interface/invocacao-v1/capas/adventurer.webp',
    'assets/confusion/interface/invocacao-v1/capas/halloween.webp',
    'assets/confusion/interface/invocacao-v1/miniaturas/adventurer.webp',
    'assets/confusion/interface/invocacao-v1/miniaturas/halloween.webp',
    'assets/confusion/interface/invocacao-v1/tickets/adventurer.png',
    'assets/confusion/interface/invocacao-v1/tickets/halloween.png',
    'assets/confusion/interface/invocacao-v1/elenco/abyssar.webp',
    'assets/confusion/interface/invocacao-v1/elenco/tatuveludo.webp',
  ];
  for (const rel of assetsEsperados) {
    assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `Asset ausente: ${rel}`);
  }
  const exp = fs.readFileSync(path.join(DIR, 'regiao1-expansao.js'), 'utf8');
  const hw = fs.readFileSync(path.join(DIR, 'regiao1-halloween.js'), 'utf8');
  assert.equal(exp.includes('descanso-v1/sala.webp'), true);
  assert.equal(exp.includes('arteRepouso'), true);
  assert.equal(exp.includes('invocacao-v1/palco-adventurer.webp'), true);
  assert.equal(exp.includes('capas/adventurer.webp'), true);
  assert.equal(hw.includes('invocacao-v1/palco-halloween.webp'), true);
  assert.equal(hw.includes('capas/halloween.webp'), true);
  // Sem banners inventados (Elementais/Quinzenal/Mensal genérico fora das edições reais)
  assert.equal(exp.includes('miniaturas/quinzenal.webp'), false);
  assert.equal(exp.includes('miniaturas/elementais.webp'), false);
  assert.equal(hw.includes('miniaturas/quinzenal.webp'), false);
  assert.equal(hw.includes('miniaturas/elementais.webp'), false);
});
