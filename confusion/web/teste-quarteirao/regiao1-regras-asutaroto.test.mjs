import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  criarEstadoInicial,
  serializarEstado,
  desserializarEstado,
} from './regiao1-estado.js';
import {
  XP_IDLE_CFG,
  garantirEstadoIdle,
  calcularStatusDetalhado,
  distribuirAtributoDomador,
  resolverAbateAuto,
  calcularGanhoOffline,
  aplicarGanhoOffline,
  comprarEsferaIdle,
  comprarOuEquiparReliquia,
  resgatarLoginDiario,
  resgatarTudoPasse,
  resgatarLojaVoto,
  chocarPrimeiroOvo,
  MISSOES_CAPTURA_LEGADAS,
} from './regiao1-idle.js';
import {
  FRAGMENTOS_SONHO_CFG,
  IDENTIFICADORES_RECURSOS,
  NOCTARN_REGRA,
  ehElementoForaBannerPermanente,
  idFragmentoSonho,
  adicionarFragmentoSonho,
  saldoFragmentoSonho,
  sortearDropFragmentoSonho,
  aplicarDropsOfflineFragmentos,
  aplicarDropsBatalhaManual,
  consultarEvolucaoForma,
  evoluirFormaPorFragmentos,
  criarUnidadeInicial,
  migrarInicialNoctarn,
  aplicarInicialContaNova,
} from './regiao1-regras-sonho.js';
import { poolBanner, poolBannerSombra, invocar, expDe, aceitarContrato, entregarContrato, estoqueDaFab, fabEstado, podeEntregar } from './regiao1-exp-regras.js';
import { CONTRATOS, FAB } from './regiao1-exp-dados.js';
import { coletarTudo, prontoParaColetar } from './regiao1-gestao-regras.js';
import { ganharXpPasse, resgatarPasse } from './regiao1-passe-regras.js';
import { decidirEntradaConta, prepararContaNova } from './regiao1-conta.js';
import { invocarHW, hwDe } from './regiao1-halloween-regras.js';
import {
  ESPECIES_INICIAIS_TODAS,
  formaPorNivelCampanha,
  resolverEncontroCatalogo,
  REFORCOS_CHEFES_R1,
  reforcosDoChefe,
  equipeAliadaPreservada,
} from './regiao1-encontros-regras.js';
import {
  REVANCHE_CFG,
  CHEFES_REVANCHE_CATALOGO,
  saldoFragmentosChefe,
  statusRevancheChefe,
  iniciarRevancheChefe,
  concluirRevancheChefe,
  previsaoCraftChefe,
  craftarChefe,
  compararPoderEquivalente,
  bonusCategoriaPoder,
} from './regiao1-revanche-regras.js';
import { MONSTROS_SELVAGENS } from './regiao1-entidades.js';
import { ESTRATEGIA_C1 } from './regiao1-estrategia-c1.js';
import { CACADAS, CALABOUCO, HV } from './regiao1-exp-dados.js';
import { criarUnidade } from './regiao1-estrategia-regras.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 1_000_000);
  return s;
};

test('Save antigo preserva equipe, itens legados, progresso e Vínculo útil sem reativar esferas/captura/relíquias', () => {
  const antigo = criarEstadoInicial();
  antigo.mapaAtual = 'C1';
  antigo.recompensas = { gold: 500, diamantes: 120, xp: 300 };
  antigo.idle = {
    jogador: { xp: 300, hp: 120, sanidade: 100, capturasTotais: 7, atributos: { for: 1, vit: 0, men: 0, vin: 4, sor: 0 } },
    autoCaca: { ativo: false, autoCapturar: true },
    mochila: {
      esferas: { comum: 5, rara: 2, epica: 1, lendaria: 0, mitica: 0 },
      reliquiasPossuidas: ['rel_lamina_sombra', 'rel_selo_onirico'],
      equipada: { arma: 'rel_lamina_sombra', amuleto: null, selo: 'rel_selo_onirico' },
      ovos: [{ especie: 'Vaelith', forma: 'natural', obtidoEm: 123 }],
      ingredientes: { erva_costeira: 4 },
    },
    equipe: [
      { especie: 'Noctarn', nivel: 12, xp: 1000, raridade: 4, tier: 4, estrelas: 3, forma: 'natural', uid: 'ini0' },
      { especie: 'Noctarn', nivel: 7, xp: 300, raridade: 3, forma: 'natural', origem: 'banner', fonteBanner: 'sombra', uid: 'bn0' },
      { especie: 'Noctarn', nivel: 9, xp: 500, raridade: 3, forma: 'natural', uid: 'unk0' },
    ],
    formacao: ['ini0', 'bn0', null, null],
    diarias: {
      dia: Math.floor(1_000_000 / 86400000),
      rerollsRestantes: 2,
      itens: [
        { id: 'dm_capturas_3', titulo: 'Capturar 3 Oníricos', tipo: 'capturas', meta: 3, progresso: 1, resgatada: false },
        { id: 'dm_abates_15', titulo: 'Caçar 15 monstros selvagens', tipo: 'abates', meta: 15, progresso: 4, resgatada: false },
      ],
    },
  };

  const carregado = desserializarEstado(serializarEstado(antigo));
  const idle = garantirEstadoIdle(carregado, 1_000_000);

  // Não apaga itens legados sem política de compensação
  assert.equal(idle.mochila.esferas.comum, 5);
  assert.deepEqual(idle.mochila.reliquiasPossuidas, ['rel_lamina_sombra', 'rel_selo_onirico']);
  assert.equal(idle.mochila.ovos.length, 1);
  assert.equal(idle.mochila.ingredientes.erva_costeira, 4);
  // Inicial identificável (ini0) migra para Penumbrio T4; cópia de banner e cópia sem origem identificável ficam Noctarn T4
  assert.equal(idle.equipe[0].especie, 'Penumbrio');
  assert.equal(idle.equipe[0].tier, 4);
  assert.equal(idle.equipe[0].estrelas, 3);
  assert.equal(idle.equipe[0].uid, 'ini0');
  assert.equal(idle.equipe[1].especie, 'Noctarn');
  assert.equal(idle.equipe[1].tier, 4);
  assert.equal(idle.equipe[1].origem, 'banner');
  assert.equal(idle.equipe[2].especie, 'Noctarn');
  assert.equal(idle.equipe[2].tier, 4);
  assert.equal(equipeAliadaPreservada(idle)[0].especie, 'Penumbrio');
  assert.equal(equipeAliadaPreservada(idle)[1].especie, 'Noctarn');

  // Missão de captura substituída mantendo IDs declarados para dioh293 e preservando outras missões
  assert.ok(MISSOES_CAPTURA_LEGADAS.includes('dm_capturas_3'));
  assert.equal(idle.diarias.itens.some((m) => m.id === 'dm_capturas_3' || m.tipo === 'capturas'), false);
  assert.equal(idle.diarias.itens[0].id, 'dm_batalhas_3');
  assert.equal(idle.diarias.itens[1].progresso, 4);

  // Vínculo útil (XP), captura e relíquias removidos dos atributos ativos
  const st = calcularStatusDetalhado(carregado);
  assert.equal(st.capturaExtra, 0);
  assert.ok(st.xpMult > 1.1);
  assert.equal(st.fontes.some((f) => /Captura|Relíquias/i.test(f.nome + f.detalhe)), false);

  // Compra de esfera, relíquia e loja de voto bloqueadas; abate não captura nem gasta esfera
  assert.equal(comprarEsferaIdle(carregado, 'comum').ok, false);
  assert.equal(comprarOuEquiparReliquia(carregado, 'rel_amuleto_cristal').ok, false);
  idle.votos.voteCash = 5;
  assert.equal(resgatarLojaVoto(carregado, 'esferas').ok, false);
  const abate = resolverAbateAuto(carregado, { especie: 'Fanalino', nivel: 5 }, () => 0.005);
  assert.equal(abate.capturado, false);
  assert.equal(idle.mochila.esferas.comum, 5);
  assert.equal(idle.jogador.capturasTotais, 7);

  // Login e Passe não entregam esferas novas
  const login = resgatarLoginDiario(carregado, 1_000_000 + 86400000);
  if (login.ok) assert.equal(Object.values(login.recompensa.esferas).reduce((a, b) => a + b, 0), 0);
  idle.passe.xp = 300;
  const passe = resgatarTudoPasse(carregado);
  assert.equal(Object.values(passe.reward.esferas).reduce((a, b) => a + b, 0), 0);

  // Save continua válido na nuvem
  const valid = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(carregado)), conta: carregado.conta });
  assert.equal(valid.ok, true);
});

test('Fragmentos de Sonho: drop 1%, idempotência (ativo e Idle offline) e separação de identificadores', () => {
  const s = novoSave();
  assert.notEqual(IDENTIFICADORES_RECURSOS.fragmentoSonho.pastaSave, IDENTIFICADORES_RECURSOS.fragmentoChefe.pastaSave);
  assert.notEqual(IDENTIFICADORES_RECURSOS.fragmentoSonho.prefixo, IDENTIFICADORES_RECURSOS.itensTier.prefixo);
  assert.equal(idFragmentoSonho('fogo'), 'frag_sonho:fogo');

  // Limite exato de 1%
  const falha = sortearDropFragmentoSonho(s, { derrotaId: 'd_fail', especie: 'Fanalino', elemento: 'inseto', rng: () => 0.01 });
  assert.equal(falha.dropou, false);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), 0);
  // Mesmo derrotaId não re-rola
  const retryFail = sortearDropFragmentoSonho(s, { derrotaId: 'd_fail', especie: 'Fanalino', elemento: 'inseto', rng: () => 0.001 });
  assert.equal(retryFail.jaPago, true);
  assert.equal(retryFail.dropou, false);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), 0);

  const sucesso = sortearDropFragmentoSonho(s, { derrotaId: 'd_ok', especie: 'Fanalino', elemento: 'inseto', rng: () => 0.009 });
  assert.equal(sucesso.dropou, true);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), 1);
  // Repetição não paga duas vezes
  const dup = sortearDropFragmentoSonho(s, { derrotaId: 'd_ok', especie: 'Fanalino', elemento: 'inseto', rng: () => 0.001 });
  assert.equal(dup.jaPago, true);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), 1);

  // Idle offline: paga no máximo uma vez por lote e usa elemento dos encontros
  const off1 = aplicarDropsOfflineFragmentos(s, { loteId: 'off_1', abates: 5, elemento: 'agua', rng: () => 0.005 });
  assert.equal(off1.totalDropado, 5);
  assert.equal(saldoFragmentoSonho(s, 'agua'), 5);
  const offDup = aplicarDropsOfflineFragmentos(s, { loteId: 'off_1', abates: 5, elemento: 'agua', rng: () => 0.005 });
  assert.equal(offDup.jaPago, true);
  assert.equal(saldoFragmentoSonho(s, 'agua'), 5);

  // Integração com aplicarGanhoOffline sem duplicar
  const t0 = 5_000_000;
  s.idle.ultimoTickMs = t0 - 600_000;
  const resumo = calcularGanhoOffline(s, 5, t0);
  const rOff = aplicarGanhoOffline(s, resumo, 'Cobrabúfalo', t0, () => 0.002);
  assert.equal(rOff.fragmentosSonho.totalDropado, resumo.abates);
});

test('Evolução de forma: custos 9/10 e 10/10 (29/30 e 30/30), preserva nível/estrelas/tier e promove T4→T5 apenas nos iniciais', () => {
  const s = novoSave();
  s.idle.equipe = [
    criarUnidadeInicial('Brasinha', { nivel: 18, uid: 'ini_b', estrelas: 7 }),
    { especie: 'Fanalino', nivel: 24, xp: 5000, tier: 2, raridade: 2, estrelas: 4, forma: 'natural', formaFase: 1, uid: 'nat_f' },
  ];

  // 9/10 falha sem descontar
  adicionarFragmentoSonho(s, 'fogo', 9);
  const c9 = consultarEvolucaoForma(s, 0);
  assert.equal(c9.custo, 10);
  assert.equal(c9.saldo, 9);
  assert.equal(c9.podeEvoluir, false);
  assert.equal(evoluirFormaPorFragmentos(s, 0).ok, false);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 9);
  assert.equal(s.idle.equipe[0].especie, 'Brasinha');

  // 10/10 evolui base→segunda mantendo T4, nível 18 e 7 estrelas
  adicionarFragmentoSonho(s, 'fogo', 1);
  const ev1 = evoluirFormaPorFragmentos(s, 0);
  assert.equal(ev1.ok, true);
  assert.equal(ev1.para, 'Ignavor');
  assert.equal(s.idle.equipe[0].especie, 'Ignavor');
  assert.equal(s.idle.equipe[0].tier, 4);
  assert.equal(s.idle.equipe[0].nivel, 18);
  assert.equal(s.idle.equipe[0].estrelas, 7);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 0);

  // 29/30 falha; 30/30 evolui segunda→terceira promovendo inicial T4→T5 e preservando nível/estrelas
  adicionarFragmentoSonho(s, 'fogo', 29);
  assert.equal(evoluirFormaPorFragmentos(s, 0).ok, false);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 29);

  adicionarFragmentoSonho(s, 'fogo', 1);
  const ev2 = evoluirFormaPorFragmentos(s, 0);
  assert.equal(ev2.ok, true);
  assert.equal(s.idle.equipe[0].especie, 'Ignaraz');
  assert.equal(s.idle.equipe[0].tier, 5);
  assert.equal(s.idle.equipe[0].nivel, 18);
  assert.equal(s.idle.equipe[0].estrelas, 7);
  assert.equal(saldoFragmentoSonho(s, 'fogo'), 0);

  // Não-inicial preserva seu tier T2 ao evoluir de forma!
  adicionarFragmentoSonho(s, 'inseto', 40);
  const nf1 = evoluirFormaPorFragmentos(s, 1);
  const nf2 = evoluirFormaPorFragmentos(s, 1);
  assert.equal(nf1.ok && nf2.ok, true);
  assert.equal(s.idle.equipe[1].formaFase, 3);
  assert.equal(s.idle.equipe[1].tier, 2);
  assert.equal(s.idle.equipe[1].nivel, 24);
  assert.equal(s.idle.equipe[1].estrelas, 4);
});

test('Limites de nível 20/21 e 40/41 e ausência total de iniciais como inimigos na Região 1 (com arte existente em disco)', () => {
  assert.equal(formaPorNivelCampanha(1), 1);
  assert.equal(formaPorNivelCampanha(20), 1);
  assert.equal(formaPorNivelCampanha(21), 2);
  assert.equal(formaPorNivelCampanha(40), 2);
  assert.equal(formaPorNivelCampanha(41), 3);

  // Nenhum inicial aparece como inimigo na Região 1 (selvagens, reforços de chefe, Estratégia, Caçadas, Calabouço, HV)
  for (const m of MONSTROS_SELVAGENS) {
    assert.equal(ESPECIES_INICIAIS_TODAS.has(m.especie), false, `Inicial selvagem proibido na R1: ${m.id} (${m.especie})`);
    assert.ok(m.forma === 1 || m.forma === 2, `Forma inválida na R1 em ${m.id}: ${m.forma}`);
    assert.equal(m.nome, m.especie);
    assert.equal(m.elementoDrop, m.elemento);
    assert.ok(m.kit.length === 3);
  }
  const segundasR1 = MONSTROS_SELVAGENS.filter((m) => m.forma === 2);
  assert.ok(segundasR1.length > 0 && segundasR1.length <= 6);
  assert.ok(segundasR1.every((m) => ['E10', 'D11', 'PC9', 'CC9'].includes(m.mapa)));

  const raiz = fileURLToPath(new URL('../../../', import.meta.url));
  for (const m of MONSTROS_SELVAGENS) {
    assert.ok(m.arteForma && fs.existsSync(raiz + m.arteForma), `Arte ausente em disco: ${m.arteForma}`);
  }

  for (const bossId of Object.keys(REFORCOS_CHEFES_R1)) {
    const refs = reforcosDoChefe(bossId, 14);
    assert.equal(refs.length, 2);
    for (const r of refs) assert.equal(ESPECIES_INICIAIS_TODAS.has(r.especie), false);
  }

  for (const rota of ESTRATEGIA_C1.rotas) {
    for (const f of rota.fases) {
      for (const esp of f.especies) assert.equal(ESPECIES_INICIAIS_TODAS.has(esp), false, esp);
      assert.equal(ESPECIES_INICIAIS_TODAS.has(f.libera.inimigo), false, f.libera.inimigo);
    }
  }
  for (const c of CACADAS) for (const esp of c.onir) assert.equal(ESPECIES_INICIAIS_TODAS.has(esp), false, esp);
  assert.equal(ESPECIES_INICIAIS_TODAS.has(CALABOUCO.chefe.especie), false);
  for (const m of HV.capitulos[0].missoes) {
    const listas = [m.inimigos || [], ...Object.values(m.porEscolha || {}).map((v) => v.inimigos || [])];
    for (const lista of listas) {
      for (const [esp] of lista) assert.equal(ESPECIES_INICIAIS_TODAS.has(esp), false, esp);
    }
  }

  // Tentativa explícita de resolver inicial como inimigo na R1 é substituída; na R2 só entra 3ª forma em nível 41+
  const r1Tent = resolverEncontroCatalogo({ especie: 'Noctarion', nivel: 45, mapa: 'E1' }, { regiao: 1 });
  assert.equal(ESPECIES_INICIAIS_TODAS.has(r1Tent.especie), false);
  assert.equal(r1Tent.substituido, 'Noctarion');

  const r2Nv40 = resolverEncontroCatalogo({ especie: 'Noctarion', nivel: 40 }, { regiao: 2 });
  assert.equal(r2Nv40.especie, 'Noctarn');
  assert.equal(r2Nv40.forma, 2);

  const r2Nv41 = resolverEncontroCatalogo({ especie: 'Noctarion', nivel: 41 }, { regiao: 2 });
  assert.equal(r2Nv41.especie, 'Noctarion');
  assert.equal(r2Nv41.forma, 3);

  // Todos os 5 iniciais do jogador nascem na forma base T4
  for (const linId of ['noctarn', 'ignavor', 'vaelith', 'brotavel', 'solarin']) {
    const ini = criarUnidadeInicial(linId);
    assert.equal(ini.tier, 4);
    assert.equal(ini.formaFase, 1);
    assert.equal(ini.nivel, 5);
  }
});

test('Revanche de chefe: cooldown 10 min reais independente de ×2/×3, sem concorrência/pagamento duplo e craft 10 fragmentos', () => {
  const s = novoSave();
  s.bossesDerrotados.BOSS_E = true;
  const t0 = 10_000_000;

  const ini = iniciarRevancheChefe(s, 'BOSS_E', { agoraMs: t0, batalhaId: 'bat_e1', velocidade: 3 });
  assert.equal(ini.ok, true);
  assert.ok(ini.reforcos.every((r) => !ESPECIES_INICIAIS_TODAS.has(r.especie)));

  // Batalha concorrente bloqueada (mesmo em outro chefe)
  s.bossesDerrotados.BOSS_D = true;
  assert.equal(iniciarRevancheChefe(s, 'BOSS_D', { agoraMs: t0 + 1000 }).ok, false);

  // Conclusão com velocidade ×3 aplica exatamente 10 min reais
  const fim1 = concluirRevancheChefe(s, { batalhaId: 'bat_e1', vitoria: true, agoraMs: t0 + 5000, rng: () => 0.1, velocidade: 3 });
  assert.equal(fim1.ok, true);
  assert.equal(fim1.fragmentosGanhos, 1);
  assert.equal(saldoFragmentosChefe(s, 'BOSS_E'), 1);
  assert.equal(fim1.drops.length, 1);
  assert.equal(fim1.cooldownAte, t0 + 5000 + REVANCHE_CFG.cooldownMs);

  // Pagamento duplo bloqueado pelo mesmo batalhaId
  const dup = concluirRevancheChefe(s, { batalhaId: 'bat_e1', vitoria: true, agoraMs: t0 + 6000, rng: () => 0.1 });
  assert.equal(dup.jaPago, true);
  assert.equal(saldoFragmentosChefe(s, 'BOSS_E'), 1);

  // Cooldown persiste após serializar/desserializar; 9m59s bloqueia, 10m00s libera
  const recarregado = desserializarEstado(serializarEstado(s));
  garantirEstadoIdle(recarregado, t0 + 5000 + 599_000);
  assert.equal(statusRevancheChefe(recarregado, 'BOSS_E', t0 + 5000 + 599_000).emCooldown, true);
  assert.equal(iniciarRevancheChefe(recarregado, 'BOSS_E', { agoraMs: t0 + 5000 + 599_000 }).ok, false);
  assert.equal(iniciarRevancheChefe(recarregado, 'BOSS_E', { agoraMs: t0 + 5000 + 600_000, batalhaId: 'bat_e2' }).ok, true);

  // Craft de chefe: declara nível 1, exige 10 fragmentos daquele mesmo chefe (sem aceitar de outro)
  const prev = previsaoCraftChefe(recarregado, 'BOSS_E');
  assert.equal(prev.nivelInicial, 1);
  assert.match(prev.avisoRegra, /Nível 1/);
  recarregado.idle.mochila.fragmentosChefe.BOSS_E = 9;
  recarregado.idle.mochila.fragmentosChefe.BOSS_D = 10;
  assert.equal(craftarChefe(recarregado, 'BOSS_E').ok, false);

  recarregado.idle.mochila.fragmentosChefe.BOSS_E = 10;
  const cr = craftarChefe(recarregado, 'BOSS_E', { agoraMs: t0 + 700_000, operacaoId: 'craft_e1' });
  assert.equal(cr.ok, true);
  assert.equal(cr.unidade.nivel, 1);
  assert.equal(cr.unidade.tier, 5);
  assert.equal(cr.unidade.chefeRecrutado, true);
  assert.equal(saldoFragmentosChefe(recarregado, 'BOSS_E'), 0);
  assert.equal(saldoFragmentosChefe(recarregado, 'BOSS_D'), 10);
  // Idempotência do craft
  assert.equal(craftarChefe(recarregado, 'BOSS_E', { operacaoId: 'craft_e1' }).jaAplicado, true);
  assert.ok(CHEFES_REVANCHE_CATALOGO.BOSS_C);
});

test('Comparação de poder: chefe recrutado +20% e exclusivo de banner +30% sobre T5 comum equivalente, sem empilhar', () => {
  const cmp = compararPoderEquivalente({ nivel: 40, forma: 2, estrelas: 5, papel: 'ataque' });
  assert.ok(Math.abs(cmp.razoes.chefeVsComum.hp - 1.2) < 0.02);
  assert.ok(Math.abs(cmp.razoes.chefeVsComum.atk - 1.2) < 0.02);
  assert.ok(Math.abs(cmp.razoes.chefeVsComum.def - 1.2) < 0.02);
  assert.ok(Math.abs(cmp.razoes.bannerVsComum.hp - 1.3) < 0.02);
  assert.ok(Math.abs(cmp.razoes.bannerVsComum.atk - 1.3) < 0.02);
  assert.ok(Math.abs(cmp.razoes.bannerVsComum.def - 1.3) < 0.02);

  // Não empilha os dois bônus (+20% + +30% = +50% proibido)
  const duplo = bonusCategoriaPoder({ especie: 'Abyssar', chefeRecrutado: true, exclusivoBanner: true });
  assert.equal(duplo.hp, 0.3);
  assert.equal(duplo.atk, 0.3);
  assert.equal(duplo.def, 0.3);
  assert.equal(duplo.empilhamentoBloqueado, true);

  const uChefe = criarUnidade({ id: 'c', especie: 'Fanalino', nivel: 30, lado: 'a', papeis: {}, chefeRecrutado: true });
  const uComum = criarUnidade({ id: 'n', especie: 'Fanalino', nivel: 30, lado: 'a', papeis: {} });
  assert.equal(uChefe.categoriaPoder, 'chefe_recrutado');
  assert.ok(Math.abs(uChefe.hpMax / uComum.hpMax - 1.2) < 0.02);
  assert.ok(Math.abs(uChefe.atk / uComum.atk - 1.2) < 0.02);
});

test('Noctarn e Sombra ficam fora do banner permanente (Adventurer); Noctarn é T4 e banner marca origem', () => {
  const perm = poolBanner();
  assert.equal(perm.some((p) => p.especie === 'Noctarn'), false);
  assert.equal(perm.some((p) => ehElementoForaBannerPermanente(p.elemento)), false);
  assert.equal(NOCTARN_REGRA.tier, 4);
  assert.equal(NOCTARN_REGRA.noBannerPermanente, false);

  const sombra = poolBannerSombra();
  assert.equal(sombra[0].especie, 'Noctarn');
  assert.equal(sombra[0].tier, 4);

  const s = novoSave();
  expDe(s).tickets = 1;
  const rAdv = invocar(s, () => 0.1);
  assert.equal(rAdv.ok, true);
  assert.notEqual(rAdv.especie, 'Noctarn');
  const criadoAdv = s.idle.equipe[s.idle.equipe.length - 1];
  assert.equal(criadoAdv.origem, 'banner');
  assert.equal(criadoAdv.fonteBanner, 'adventurer');

  hwDe(s).tickets = 1;
  const rHw = invocarHW(s, 1, () => 0.1);
  assert.equal(rHw.ok, true);
  const criadoHw = s.idle.equipe[s.idle.equipe.length - 1];
  assert.equal(criadoHw.origem, 'banner');

  // Penumbrio não evolui para Noctarn (única fonte do Noctarn é banner), mas Noctarn de banner evolui para Noctarion (T5)
  s.idle.equipe = [
    criarUnidadeInicial('Penumbrio', { nivel: 15, uid: 'pen0', estrelas: 2 }),
    { especie: 'Noctarn', nivel: 15, xp: 2000, tier: 4, raridade: 4, estrelas: 2, forma: 'natural', origem: 'banner', fonteBanner: 'sombra', uid: 'noc_b' },
  ];
  adicionarFragmentoSonho(s, 'trevas', 40);
  const cPen = consultarEvolucaoForma(s, 0);
  assert.equal(cPen.podeEvoluir, false);
  assert.equal(cPen.bloqueada, true);
  const evPen = evoluirFormaPorFragmentos(s, 0);
  assert.equal(evPen.ok, false);
  assert.equal(evPen.bloqueada, true);
  assert.equal(s.idle.equipe[0].especie, 'Penumbrio');
  assert.equal(saldoFragmentoSonho(s, 'trevas'), 40);

  const evNoc = evoluirFormaPorFragmentos(s, 1);
  assert.equal(evNoc.ok, true);
  assert.equal(s.idle.equipe[1].especie, 'Noctarion');
  assert.equal(s.idle.equipe[1].tier, 5);
  assert.equal(s.idle.equipe[1].origem, 'banner');
  assert.equal(saldoFragmentoSonho(s, 'trevas'), 10);
});

test('Percurso 1 (Conta nova): escolha do inicial → primeira batalha e drop 1% idempotente', () => {
  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s, 2_000_000);
  // Offline padrão começa com Penumbrio provisório T4
  assert.equal(idle.equipe[0].especie, 'Penumbrio');
  assert.equal(idle.equipe[0].tier, 4);

  // Escolha do inicial na conta nova substitui o provisório sem duplicar vaga inicial
  aplicarInicialContaNova(s, { userId: 'conta_nova_1', inicial: 'Brasinha', agora: 2_000_000, novo: true });
  assert.equal(idle.equipe.filter((m) => m.inicial).length, 1);
  assert.equal(idle.equipe[0].especie, 'Brasinha');
  assert.equal(idle.equipe[0].tier, 4);
  assert.equal(idle.formacao[0], idle.equipe[0].uid);
  assert.equal(s.recompensas.diamantes, 20000);

  // Primeiro encontro selvagem da Região 1 é do catálogo resolvido, nunca inicial, com mesmo sprite/elemento/kit
  const encontro = MONSTROS_SELVAGENS.find((m) => m.mapa === 'E1');
  assert.ok(encontro);
  assert.equal(encontro._resolvido, true);
  assert.equal(ESPECIES_INICIAIS_TODAS.has(encontro.especie), false);

  const ab1 = resolverAbateAuto(s, { ...encontro, derrotaId: 'p1_bat_1' }, () => 0.005);
  assert.equal(ab1.fragmentoSonho.dropou, true);
  assert.equal(saldoFragmentoSonho(s, encontro.elementoDrop), 1);

  const abDup = resolverAbateAuto(s, { ...encontro, derrotaId: 'p1_bat_1' }, () => 0.001);
  assert.equal(abDup.fragmentoSonho.jaPago, true);
  assert.equal(saldoFragmentoSonho(s, encontro.elementoDrop), 1);

  const rec = desserializarEstado(serializarEstado(s));
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(val.ok, true);
});

test('Percurso 2 (Save antigo): equipe → evolução → revanche 10m → retorno Idle → ovo T5 do Passe', () => {
  const t0 = 20_000_000;
  const antigo = criarEstadoInicial();
  antigo.conta = { uid: 'conta_antiga_1', inicial: 'Noctarn', bonusEm: 1000 };
  antigo.bossesDerrotados.BOSS_E = true;
  antigo.idle = {
    jogador: { xp: 400, hp: 140, sanidade: 100, atributos: { for: 2, vit: 1, men: 0, vin: 2, sor: 1 } },
    ultimoTickMs: t0 - 3 * 3600_000, // 3h fora
    montaria: 'brumacervo',
    mochila: {
      esferas: { comum: 4 },
      reliquiasPossuidas: ['rel_lamina_sombra'],
      equipada: { arma: 'rel_lamina_sombra' },
      ovos: [{ tipo: 'ovoT5', especie: 'Tiranox', tier: 5, temporada: '2026-11', origem: 'passe-100' }],
    },
    equipe: [
      { especie: 'Noctarn', nivel: 12, xp: 1000, raridade: 3, estrelas: 3, forma: 'natural', inicial: true, uid: 'ini0' },
      { especie: 'Noctarn', nivel: 10, xp: 720, raridade: 3, estrelas: 2, forma: 'natural', origem: 'banner', fonteBanner: 'sombra', uid: 'bn_sombra' },
    ],
    formacao: ['ini0', 'bn_sombra', null, null],
    passe: { v: 2, edicao: '2026-11', xp: 10000, resgatado: 99, comprados: 0, descartado: 0, t5Pagos: { '2026-11': true } },
    diarias: {
      dia: Math.floor(t0 / 86400000),
      rerollsRestantes: 3,
      itens: [{ id: 'dm_capturas_3', titulo: 'Capturar 3 Oníricos', tipo: 'capturas', meta: 3, progresso: 0, resgatada: false }],
    },
  };

  // 1) Equipe e migração ao carregar
  const s = desserializarEstado(serializarEstado(antigo));
  const idle = garantirEstadoIdle(s, t0);
  assert.equal(idle.montaria, 'brumacervo');
  assert.equal(idle.equipe[0].especie, 'Penumbrio');
  assert.equal(idle.equipe[0].tier, 4);
  assert.equal(idle.equipe[0].estrelas, 3);
  assert.equal(idle.equipe[1].especie, 'Noctarn');
  assert.equal(idle.equipe[1].tier, 4);
  assert.equal(idle.equipe[1].origem, 'banner');
  assert.equal(idle.diarias.itens[0].id, 'dm_batalhas_3');
  assert.equal(migrarInicialNoctarn(s).migrou, false); // idempotente

  // 2) Evolução por Fragmentos de Sonho: Penumbrio bloqueado de virar Noctarn; Noctarn de banner evolui 30/30 → Noctarion T5 mantendo nível e estrelas
  adicionarFragmentoSonho(s, 'trevas', 30);
  const evPen = evoluirFormaPorFragmentos(s, 0, { operacaoId: 'p2_ev_pen' });
  assert.equal(evPen.ok, false);
  assert.equal(evPen.bloqueada, true);
  assert.equal(idle.equipe[0].especie, 'Penumbrio');
  assert.equal(saldoFragmentoSonho(s, 'trevas'), 30);

  const evNoc = evoluirFormaPorFragmentos(s, 1, { operacaoId: 'p2_ev_noc' });
  assert.equal(evNoc.ok, true);
  assert.equal(idle.equipe[1].especie, 'Noctarion');
  assert.equal(idle.equipe[1].tier, 5);
  assert.equal(idle.equipe[1].nivel, 10);
  assert.equal(idle.equipe[1].estrelas, 2);
  assert.equal(idle.equipe[1].origem, 'banner');
  assert.equal(saldoFragmentoSonho(s, 'trevas'), 0);

  // 3) Revanche com ×3 mantém 10 minutos reais e sem pagamento duplo
  const revIni = iniciarRevancheChefe(s, 'BOSS_E', { agoraMs: t0, batalhaId: 'p2_rev1', velocidade: 3 });
  assert.equal(revIni.ok, true);
  const revFim = concluirRevancheChefe(s, { batalhaId: 'p2_rev1', vitoria: true, agoraMs: t0 + 1000, velocidade: 3 });
  assert.equal(revFim.fragmentosGanhos, 1);
  assert.equal(statusRevancheChefe(s, 'BOSS_E', t0 + 1000 + 599_000).emCooldown, true);
  assert.equal(statusRevancheChefe(s, 'BOSS_E', t0 + 1000 + 600_000).emCooldown, false);

  // 4) Retorno do Idle paga apenas uma vez (inclusive fragmentos 1%)
  const off = calcularGanhoOffline(s, 6, t0);
  assert.ok(off && off.abates > 100);
  const rOff1 = aplicarGanhoOffline(s, off, 'Fanalino', t0, () => 0.004);
  assert.equal(rOff1.jaPago, false);
  const fragsInseto = saldoFragmentoSonho(s, 'inseto');
  assert.equal(fragsInseto, off.abates);
  const rOff2 = aplicarGanhoOffline(s, off, 'Fanalino', t0, () => 0.004);
  assert.equal(rOff2.jaPago, true);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), fragsInseto);

  // 5) Resgate/eclosão do ovo T5 do Passe nasce Nv.1 T5 e valida save final
  const choc = chocarPrimeiroOvo(s);
  assert.equal(choc.ok, true);
  assert.equal(choc.onirico.especie, 'Tiranox');
  assert.equal(choc.onirico.nivel, 1);
  assert.equal(choc.onirico.tier, 5);
  assert.equal(choc.onirico.temporada, '2026-11');

  const finalRec = desserializarEstado(serializarEstado(s));
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(finalRec)), conta: finalRec.conta });
  assert.equal(val.ok, true);
});

test('Batalha manual: drop de 1% por inimigo derrotado, idempotente e integrado em regiao1.js', () => {
  const s = novoSave();
  const inimigosSelv = [
    { especie: 'Cervomusgo', elemento: 'planta' },
    { especie: 'Tatuveludo', elementoDrop: 'terra' },
    ['Tatuveludo', 10, undefined, { forma: 1 }], // elemento resolvido pelo catálogo de REINOS
  ];

  // Derrota/recuo não paga nem consome pagamento
  const derrota = aplicarDropsBatalhaManual(s, { batalhaId: 'bat_man_1', inimigos: inimigosSelv, vitoria: false, rng: () => 0.001 });
  assert.equal(derrota.totalDropado, 0);
  assert.equal(derrota.jaPago, false);
  assert.equal(saldoFragmentoSonho(s, 'planta'), 0);
  assert.equal(saldoFragmentoSonho(s, 'terra'), 0);

  // Vitória com 3 inimigos sorteia 1% por inimigo derrotado; repetição do mesmo batalhaId não paga duplicado
  const vit = aplicarDropsBatalhaManual(s, { batalhaId: 'bat_man_1', inimigos: inimigosSelv, vitoria: true, rng: () => 0.009 });
  assert.equal(vit.jaPago, false);
  assert.equal(vit.totalDropado, 3);
  assert.deepEqual(vit.porElemento, { planta: 1, terra: 2 });
  assert.equal(saldoFragmentoSonho(s, 'planta'), 1);
  assert.equal(saldoFragmentoSonho(s, 'terra'), 2);
  assert.deepEqual(s.idle.mochila.fragmentosChefe || {}, {});
  assert.deepEqual(s.idle.mochila.itensTier || {}, {});

  const dup = aplicarDropsBatalhaManual(s, { batalhaId: 'bat_man_1', inimigos: inimigosSelv, vitoria: true, rng: () => 0.0001 });
  assert.equal(dup.jaPago, true);
  assert.equal(dup.totalDropado, 0);
  assert.equal(saldoFragmentoSonho(s, 'planta'), 1);
  assert.equal(saldoFragmentoSonho(s, 'terra'), 2);

  // Limite exato de 1% (0.01 não dropa) e suporte a tuplas de chefe + reforços
  const bossTuplas = [
    ['Espírito da Floresta', 12, 'planta', { chefe: true }],
    ['Cervomusgo', 12, 'planta', { forma: 1 }],
    ['Fanalino', 12, 'inseto', { forma: 1 }],
  ];
  const falha = aplicarDropsBatalhaManual(s, { batalhaId: 'bat_man_2', inimigos: bossTuplas, vitoria: true, rng: () => 0.01 });
  assert.equal(falha.totalDropado, 0);
  assert.equal(saldoFragmentoSonho(s, 'inseto'), 0);

  // Mesmo sem dropar, bat_man_2 fica marcado como pago e não re-rola
  const retry = aplicarDropsBatalhaManual(s, { batalhaId: 'bat_man_2', inimigos: bossTuplas, vitoria: true, rng: () => 0.001 });
  assert.equal(retry.jaPago, true);
  assert.equal(retry.totalDropado, 0);

  // Verifica integração mínima em regiao1.js (import, batalhaId em iniciarBatalha e aplicação em encerrarBatalha)
  const regiao1Src = fs.readFileSync(new URL('./regiao1.js', import.meta.url), 'utf8');
  assert.match(regiao1Src, /import\s*\{\s*aplicarDropsBatalhaManual\s*\}\s*from\s*'\.\/regiao1-regras-sonho\.js'/);
  assert.match(regiao1Src, /batalhaAtiva\.batalhaId\s*=/);
  assert.match(regiao1Src, /aplicarDropsBatalhaManual\(save,\s*\{\s*batalhaId:\s*b\.batalhaId,\s*inimigos:\s*b\.inimigosDrop/);
});

test('Save da montaria: padrão brumacervo (#66), preservação de escolha a pé (null), colecao.montarias e derrotaId no Auto-Caça', () => {
  // Conta nova começa com brumacervo (#66: sem escolha gravada o domador anda montado)
  const nova = novoSave();
  assert.equal(nova.idle.montaria, 'brumacervo');

  // Save antigo sem montaria (sem _pronto e com _pronto: true) migra para brumacervo
  const antigoSemPronto = criarEstadoInicial();
  antigoSemPronto.idle = { jogador: { xp: 10, hp: 100 } };
  garantirEstadoIdle(antigoSemPronto, 3_000_000);
  assert.equal(antigoSemPronto.idle.montaria, 'brumacervo');

  const antigoComPronto = novoSave();
  delete antigoComPronto.idle.montaria;
  garantirEstadoIdle(antigoComPronto, 3_000_000);
  assert.equal(antigoComPronto.idle.montaria, 'brumacervo');

  // Escolha explícita a pé (null) é preservada após carregar e serializar/desserializar
  const aPe = novoSave();
  aPe.idle.montaria = null;
  const aPeRec = desserializarEstado(serializarEstado(aPe));
  garantirEstadoIdle(aPeRec, 3_000_000);
  assert.equal(aPeRec.idle.montaria, null);

  // Montaria do Passe + colecao.montarias preservadas e save válido para nuvem
  const comPasse = novoSave();
  comPasse.idle.colecao = { montarias: ['dinossauros-montaria-1'] };
  comPasse.idle.montaria = 'dinossauros-montaria-1';
  const comPasseRec = desserializarEstado(serializarEstado(comPasse));
  garantirEstadoIdle(comPasseRec, 3_000_000);
  assert.equal(comPasseRec.idle.montaria, 'dinossauros-montaria-1');
  assert.deepEqual(comPasseRec.idle.colecao.montarias, ['dinossauros-montaria-1']);
  const val = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(comPasseRec)), conta: comPasseRec.conta });
  assert.equal(val.ok, true);

  // Checagem estática de Auto-Caça idempotente em regiao1.js
  const regiao1Src = fs.readFileSync(new URL('./regiao1.js', import.meta.url), 'utf8');
  assert.match(regiao1Src, /if\s*\(alvoAutoCaca\._abatido\)\s*return;\s*alvoAutoCaca\._abatido\s*=\s*true;/);
  assert.match(regiao1Src, /resolverAbateAuto\(save,\s*\{\s*\.\.\.morto,\s*derrotaId:/);
});

test('XP do Idle ativo e offline: Oníricos da formação ganham XP, banco fica intacto e Domador progride mais devagar', () => {
  const s = novoSave();
  s.idle.equipe = [
    criarUnidadeInicial('Brasinha', { nivel: 5, uid: 'f0' }),
    { especie: 'Fanalino', nivel: 1, xp: 0, tier: 2, raridade: 2, estrelas: 1, forma: 'natural', uid: 'f1' },
    { especie: 'Cervomusgo', nivel: 1, xp: 0, tier: 1, raridade: 1, estrelas: 1, forma: 'natural', uid: 'res0' }, // fora da formação
  ];
  s.idle.formacao = ['f0', 'f1', null, null];

  // 10 minutos de farm ativo (~30 abates Nv.6): Domador lento, formação sobe bem, reserva não recebe
  const domXpAntes = s.idle.jogador.xp;
  const f0XpAntes = s.idle.equipe[0].xp;
  for (let i = 0; i < 30; i++) {
    const r = resolverAbateAuto(s, { especie: 'Fanalino', nivel: 6, derrotaId: `xp_at_${i}` }, () => 0.9);
    assert.ok(r.xpOniricos > r.xp, 'Formação deve ganhar mais XP que o Domador por abate');
  }
  const ganhoDomAtivo = s.idle.jogador.xp - domXpAntes;
  const ganhoFormAtivo = s.idle.equipe[0].xp - f0XpAntes;
  assert.equal(ganhoDomAtivo, 30 * (XP_IDLE_CFG.ativoDomadorBase + 6 * XP_IDLE_CFG.ativoDomadorPorNivel)); // 300 XP (antes era 1380 XP)
  assert.equal(ganhoFormAtivo, 30 * (XP_IDLE_CFG.ativoOniricoBase + 6 * XP_IDLE_CFG.ativoOniricoPorNivel)); // 1080 XP (antes era 0 XP)
  assert.ok(s.idle.equipe[0].nivel > 5);
  assert.ok(s.idle.equipe[1].nivel > 1);
  assert.equal(s.idle.equipe[2].xp, 0); // reserva fora da formação

  // 10 minutos de farm offline (Nv.6 = 16 abates): Domador recebe 120 XP (antes 608), formação recebe 448 XP (antes 0)
  const t0 = 50_000_000;
  s.idle.ultimoTickMs = t0 - 10 * 60_000;
  const resumo = calcularGanhoOffline(s, 6, t0);
  assert.equal(resumo.minutos, 10);
  assert.equal(resumo.abates, 16);
  assert.equal(resumo.xp, 120);
  assert.equal(resumo.xpOniricos, 448);

  const domAntesOff = s.idle.jogador.xp;
  const f1AntesOff = s.idle.equipe[1].xp;
  const off = aplicarGanhoOffline(s, resumo, 'Fanalino', t0, () => 0.9);
  assert.equal(s.idle.jogador.xp - domAntesOff, 120);
  assert.equal(s.idle.equipe[1].xp - f1AntesOff, 448);
  assert.equal(off.oniricosXp.length, 2);
  assert.equal(s.idle.equipe[2].xp, 0);
});

test('Cadastro e boas-vindas (20.000 diamantes): elegibilidade única e preservação de saves existentes', () => {
  // 1) Conta elegível sem nuvem recebe 20.000 diamantes + 10d VIP uma única vez
  const decNova = decidirEntradaConta({ remoto: null, local: novoSave(), userId: 'u_novo' });
  assert.equal(decNova.acao, 'preparar');
  assert.equal(decNova.novo, true);

  const sNova = novoSave();
  prepararContaNova(sNova, { userId: 'u_novo', inicial: 'Gotalume', agora: 1_000_000, novo: decNova.novo });
  assert.equal(sNova.recompensas.diamantes, 20000);
  assert.equal(sNova.conta.bonusEm, 1_000_000);
  assert.equal(sNova.conta.vipAte, 1_000_000 + 10 * 86400000);

  // Reentrando com a mesma conta após bônus já pago: não duplica
  const decDup = decidirEntradaConta({ remoto: { conta: sNova.conta }, local: sNova, userId: 'u_novo' });
  assert.equal(decDup.novo, false);
  prepararContaNova(sNova, { userId: 'u_novo', inicial: 'Gotalume', agora: 2_000_000, novo: decDup.novo });
  assert.equal(sNova.recompensas.diamantes, 20000);

  // 2) Conta que existia no jogo raiz (/) sem save de Região 1 e sem bonusEm: elegível sem perder cloudExtra
  const decLegadoRaiz = decidirEntradaConta({ remoto: { game: 'confusion-waves', monsters: [{ id: 1 }] }, local: novoSave(), userId: 'u_raiz' });
  assert.equal(decLegadoRaiz.acao, 'preparar');
  assert.equal(decLegadoRaiz.novo, true);

  // 3) Save existente em Região 1 na nuvem é preservado (não reseta nem paga bônus de novo)
  const sExistente = novoSave();
  sExistente.recompensas.diamantes = 777;
  sExistente.idle.ultimoTickMs = 5_000_000;
  sExistente.conta = { uid: 'u_exist', inicial: 'Brasinha', bonusEm: 1000 };
  const decExist = decidirEntradaConta({ remoto: { regiao1: sExistente, conta: sExistente.conta }, local: novoSave(), userId: 'u_exist' });
  assert.equal(decExist.acao, 'usar-remoto');
  assert.equal(decExist.novo, false);

  // 4) Dispositivo compartilhado com outro uid reseta save local anterior; guest local sem uid é preservado
  const localOutro = novoSave();
  localOutro.conta = { uid: 'outro_uid', bonusEm: 500 };
  assert.equal(decidirEntradaConta({ remoto: null, local: localOutro, userId: 'u_novo_2' }).resetarLocal, true);

  const localGuest = novoSave();
  localGuest.recompensas.gold = 321;
  const decGuest = decidirEntradaConta({ remoto: null, local: localGuest, userId: 'u_guest_virou_conta' });
  assert.equal(decGuest.resetarLocal, false);
  assert.equal(decGuest.novo, true);
  prepararContaNova(localGuest, { userId: 'u_guest_virou_conta', inicial: 'Solinho', agora: 3_000_000, novo: decGuest.novo });
  assert.equal(localGuest.recompensas.gold, 321);
  assert.equal(localGuest.recompensas.diamantes, 20000);
});

test('Contrato Leite fresco: desbloqueio da Fazenda (g1) → Curral gera leite e Galinheiro gera ovos → coleta abastece Guilda (g2)', () => {
  const s = novoSave();
  const t0 = 10_000_000;
  const fab = fabEstado(s);
  fab.materiais.fibra = 6;

  // Aceita e conclui g1 ("Fibras para o balcão") -> desbloqueia Fazenda com timestamps iniciais em t0
  assert.equal(aceitarContrato(s, 'g1', t0).ok, true);
  const resG1 = entregarContrato(s, 'g1', t0);
  assert.equal(resG1.ok, true);
  assert.equal(expDe(s).fazenda, true);
  assert.equal(fab.estruturas.cur.tipo, 'curral');
  assert.equal(fab.estruturas.gal.tipo, 'galinheiro');
  assert.equal(fab.gestao.producao.cur.desde, t0);
  assert.equal(fab.gestao.producao.gal.desde, t0);

  // Aceita g2 ("Leite fresco"): ainda sem leite suficiente
  assert.equal(aceitarContrato(s, 'g2', t0).ok, true);
  assert.equal(podeEntregar(s, CONTRATOS[1]), false);

  // Após 20 minutos: Curral (12/h) gera 4 leites e Galinheiro (10/h) gera 3 ovos de produção
  const tDepois = t0 + 20 * 60_000;
  const col = coletarTudo(fab, FAB, tDepois);
  assert.equal(col.recebido.leite, 4);
  assert.equal(col.recebido.ovos, 3);
  assert.equal(Object.keys(prontoParaColetar(fab, FAB)).length, 0);

  // Itens coletados entram exatamente no estoque lido pela Guilda (sem misturar com mochila.ovos de Oníricos)
  assert.equal(estoqueDaFab(s).mat.leite, 4);
  assert.equal(estoqueDaFab(s).mat.ovos, 3);
  assert.equal(s.idle.mochila.ovos.length, 0);
  assert.equal(podeEntregar(s, CONTRATOS[1]), true);

  // Entrega "Leite fresco" (g2) e libera a Oficina
  const resG2 = entregarContrato(s, 'g2', tDepois);
  assert.equal(resG2.ok, true);
  assert.equal(estoqueDaFab(s).mat.leite, 1); // 4 - 3
  assert.equal(expDe(s).oficina, true);
});

test('Passe sem Noctarn em nenhum ovo (novos e legados), preservando cópias obtidas em banner', () => {
  const s = novoSave();
  // Coloca 1 cópia obtida em banner + 1 ovo legado de Passe contaminado com Noctarn
  s.idle.equipe.push({ especie: 'Noctarn', nivel: 12, xp: 1000, tier: 4, raridade: 4, estrelas: 2, forma: 'natural', origem: 'banner', fonteBanner: 'sombra', uid: 'noc_banner' });
  s.idle.mochila.ovos.push({ especie: 'Noctarn', forma: 'natural', tier: 1, origem: 'passe-2026-11', obtidoEm: 100 });

  garantirEstadoIdle(s, Date.UTC(2026, 10, 28, 12, 0, 0));
  assert.notEqual(s.idle.mochila.ovos[0].especie, 'Noctarn');
  assert.equal(s.idle.equipe.find((m) => m.uid === 'noc_banner')?.especie, 'Noctarn');
  assert.equal(s.idle.equipe.find((m) => m.uid === 'noc_banner')?.tier, 4);

  // Resgata todos os 100 níveis do Passe e valida que nenhum ovo gerado contém Noctarn
  ganharXpPasse(s, 'manual', 100_000, new Date(2026, 10, 28, 12, 0, 0));
  resgatarPasse(s, new Date(2026, 10, 28, 12, 0, 0));
  assert.ok(s.idle.mochila.ovos.some((o) => o.origem?.startsWith('passe-')));
  for (const ovo of s.idle.mochila.ovos) {
    assert.notEqual(ovo.especie, 'Noctarn');
    assert.equal((ovo.elenco || []).includes('Noctarn'), false);
  }
  // Cópia obtida em banner continua preservada intacta
  const bannerCopia = s.idle.equipe.find((m) => m.uid === 'noc_banner');
  assert.equal(bannerCopia.especie, 'Noctarn');
  assert.equal(bannerCopia.tier, 4);
  assert.equal(bannerCopia.origem, 'banner');
});
