import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial } from './regiao1-estado.js';
import {
  garantirEstadoIdle,
  bonusCodex,
  registrarCodexArea,
  registrarCodexEspecie,
  calcularStatusDetalhado,
  pontosDomadorDisponiveis,
  distribuirAtributoDomador,
  resetarAtributosDomador,
  comprarEsferaIdle,
  avaliarRiscoArea,
  resolverAbateAuto,
  calcularGanhoOffline,
  aplicarGanhoOffline,
  trocarMissaoDiaria,
  resgatarLoginDiario,
  resgatarTudoPasse,
  comprarOuEquiparReliquia,
  registrarVotoPortal,
  resgatarLojaVoto,
} from './regiao1-idle.js';

test('Idle: ganho offline (AFK) respeita teto de 12h e aplica XP, Gold, Ovos e Fazenda', () => {
  const s = criarEstadoInicial();
  s.desbloqueios.fazenda = true;
  const t0 = Date.UTC(2026, 10, 23, 12, 0, 0);
  const idle = garantirEstadoIdle(s, t0);
  idle.ultimoTickMs = t0 - 3 * 3600000; // 3h fora

  const ganho = calcularGanhoOffline(s, 8, t0);
  assert.ok(ganho && ganho.minutos === 180);
  assert.ok(ganho.abates > 100);
  assert.ok(ganho.colheitaFazenda > 0);

  aplicarGanhoOffline(s, ganho, 'Vaelith', t0);
  assert.ok(s.recompensas.gold >= ganho.gold);
  assert.ok(idle.jogador.abatesTotais >= ganho.abates);
});

test('Codex Onírico concede bônus permanentes e entra no breakdown de Status', () => {
  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s);
  const antes = bonusCodex(idle);

  for (const area of ['C1', 'E1', 'E4', 'E8', 'PC1', 'CC7', 'D9']) registrarCodexArea(idle, area);
  registrarCodexEspecie(idle, 'Vaelith', { abate: true, captura: true });
  registrarCodexEspecie(idle, 'Solarin', { abate: true, captura: true });
  idle.codex.bosses.BOSS_E = true;

  const depois = bonusCodex(idle);
  assert.ok(depois.marcos > antes.marcos);
  assert.ok(depois.atkPct > 0 && depois.hpPct > 0);

  const st = calcularStatusDetalhado(s);
  assert.ok(st.fontes.length >= 5);
  assert.ok(st.atk > 22);
});

test('Auto-Caça: abate concede XP, Gold, avança Passe de 30 níveis e diárias', () => {
  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s);
  const risco = avaliarRiscoArea(1, 10);
  assert.equal(risco.selo, 'Arriscado');

  const r = resolverAbateAuto(s, { especie: 'Brotavel', nivel: 6 }, () => 0.1);
  assert.ok(r.gold > 0 && r.xp > 0);
  assert.ok(idle.passe.xp > 0);
  assert.equal(idle.diarias.itens[0].progresso, 1);

  // Reroll de missão diária funciona e desconta contador
  const rTroca = trocarMissaoDiaria(s, idle.diarias.itens[0].id);
  assert.equal(rTroca.ok, true);
  assert.equal(idle.diarias.rerollsRestantes, 2);
});

test('Login 7 dias, Passe (systems.js), Relíquias e Vote & Ganhe funcionam integrados', () => {
  const s = criarEstadoInicial();
  const t0 = Date.UTC(2026, 10, 23, 15, 0, 0);
  const idle = garantirEstadoIdle(s, t0);

  const l1 = resgatarLoginDiario(s, t0);
  assert.equal(l1.ok, true);
  assert.equal(l1.dia, 1);
  assert.equal(resgatarLoginDiario(s, t0).ok, false);

  idle.passe.xp = 2000;
  const p = resgatarTudoPasse(s, t0);
  assert.ok(p.nivel >= 2);

  s.recompensas.gold = 500;
  const rel = comprarOuEquiparReliquia(s, 'rel_amuleto_cristal');
  assert.equal(rel.ok, true);
  assert.equal(idle.mochila.equipada.amuleto, 'rel_amuleto_cristal');

  assert.equal(registrarVotoPortal(s, 'topidle', t0).ok, true);
  assert.equal(registrarVotoPortal(s, 'topidle', t0 + 1000).ok, false);
  assert.equal(resgatarLojaVoto(s, 'esferas').ok, true);
});

test('Nível do Domador concede +3 pontos por nível, distribui/reseta atributos e exibe Sanidade válida', () => {
  const s = criarEstadoInicial();
  // Simula XP vindo da Campanha (sincronizado automaticamente com Domador)
  s.recompensas.xp = 400;
  const st0 = calcularStatusDetalhado(s);
  assert.ok(st0.nivel >= 3, `esperava nível >= 3, veio ${st0.nivel}`);
  assert.equal(pontosDomadorDisponiveis(s), (st0.nivel - 1) * 3);
  assert.ok(st0.bandaSanidade && st0.bandaSanidade !== 'undefined');
  assert.ok(!st0.fontes.some((f) => String(f.detalhe).includes('undefined')));

  const atkAntes = st0.atk;
  const hpAntes = st0.hpMax;
  assert.equal(distribuirAtributoDomador(s, 'for', 2).ok, true);
  assert.equal(distribuirAtributoDomador(s, 'vit', 1).ok, true);
  assert.equal(distribuirAtributoDomador(s, 'sor', 1).ok, true);

  const st1 = calcularStatusDetalhado(s);
  assert.ok(st1.atk >= atkAntes + 6);
  assert.ok(st1.hpMax >= hpAntes + 15);
  assert.ok(st1.goldMult > 1);

  const res = resetarAtributosDomador(s);
  assert.equal(res.ok, true);
  assert.equal(res.disponiveis, (st0.nivel - 1) * 3);
});
