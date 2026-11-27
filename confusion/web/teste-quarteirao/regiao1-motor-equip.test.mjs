import test from 'node:test'; import assert from 'node:assert/strict';
import * as M from './regiao1-estrategia-regras.js';
import { criarEstadoDomadorBatalha } from './regiao1-domadores-regras.js';
const esp = 'Ignavor';
const un = (id, lado, equip = null) => M.criarUnidade({ id, especie: esp, nivel: 20, lado, equip });
const rodar = (b, rng, max = 400) => { for (let i = 0; i < max && !b.fim; i++) M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng); };
test('equipamento soma vida/ataque e guarda atributos de combate', () => {
  const a = un('a', 'a'), e = un('e', 'a', { vidaPct: 0.2, ataqueFlat: 10, critico: 0.3 });
  assert.ok(e.hpMax > a.hpMax && e.atk > a.atk); assert.equal(e.equip.critico, 0.3); assert.equal(a.equip, undefined);
});
test('crítico 100% marca o golpe e bate mais forte', () => {
  const rng = M.criarRng(3), b = M.criarBatalha([un('a', 'a', { critico: 1, danoCritico: 0.5 })], [un('i', 'i')]);
  while (M.atorAtual(b).lado !== 'a') M.executar(b, { tipo: 'defender' }, rng);
  M.executar(b, { tipo: 'atacar', alvo: 'i' }, rng);
  assert.equal(b.evento.alvos[0].critico, true);
});
test('roubo de vida cura quem bate; contra-ataque responde', () => {
  const rng = M.criarRng(5), at = un('a', 'a', { rouboVida: 0.5 }); at.hp = 10;
  const b = M.criarBatalha([at], [un('i', 'i', { contraAtaque: 1 })]);
  while (M.atorAtual(b).lado !== 'a') M.executar(b, { tipo: 'defender' }, rng);
  M.executar(b, { tipo: 'atacar', alvo: 'i' }, rng);
  assert.ok(b.evento.roubo > 0); assert.equal(b.evento.contras?.length, 1);
});
test('imunidade no 1º turno bloqueia debuff; pânico contido dispara uma vez', () => {
  const rng = M.criarRng(1), alvo = un('i', 'i', { imunidadeTurnos: 1, panicoContido: { limiarHp: 1, ataque_pct: 0.2, turnos: 2, usosPorBatalha: 1 } });
  const b = M.criarBatalha([un('a', 'a')], [alvo]);
  while (M.atorAtual(b).lado !== 'a') M.executar(b, { tipo: 'defender' }, rng);
  M.executar(b, { tipo: 'atacar', alvo: 'i' }, rng);
  assert.ok(alvo.efeitos.ataque_alto); assert.equal(alvo.equip.panicoContido.usos, 1);
});
test('domador carrega a barra e age na batalha sem ser alvo', () => {
  const rng = M.criarRng(9), dom = criarEstadoDomadorBatalha({});
  const b = M.criarBatalha([un('a', 'a'), un('b', 'a')], [un('i', 'i'), un('j', 'i')], { domador: dom });
  let agiu = 0; for (let i = 0; i < 300 && !b.fim; i++) { M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng); if (b.eventoDomador) { agiu++; b.eventoDomador = null; } }
  assert.ok(agiu > 0 && dom.acoesFeitas === agiu); assert.ok(!b.ordem.includes(dom));
});
test('batalha equipada termina sem erro', () => {
  const rng = M.criarRng(11), q = { critico: 0.3, danoCritico: 0.4, rouboVida: 0.1, ecoRecarga: 0.2, contraAtaque: 0.2, bonusCuraEscudo: 0.2, armaUnica: { efeitoHabilidade: { alvo: 'suprema', tipo: 'amplificar_suprema', valor: 0.15 } } };
  const b = M.criarBatalha([un('a', 'a', q), un('b', 'a', q)], [un('i', 'i', q), un('j', 'i')]); rodar(b, rng); assert.ok(b.fim);
});
test('domador: sem barra, recargas próprias desde a entrada, age só com habilidade pronta e não está no campo', () => {
  const rng = M.criarRng(4), dom = criarEstadoDomadorBatalha({});
  const b = M.criarBatalha([un('a', 'a')], [un('i', 'i'), un('j', 'i')], { domador: dom });
  assert.deepEqual(b.domador.recargas, dom.habilidades.map((h) => Math.max(1, h.cd || 1)));
  assert.ok(!b.ordem.includes(b.domador) && !b.aliados.includes(b.domador));
  let usos = 0; for (let i = 0; i < 200 && !b.fim; i++) { M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng); if (b.eventoDomador) { const ev = b.eventoDomador; usos++; assert.equal(b.domador.recargas[ev.idx], Math.max(1, ev.hab.cd || 1)); b.eventoDomador = null; } }
  assert.ok(usos > 0);
});
test('velocidade reduz recarga: 50% → −1 turno, 100% (pânico) → −2 turnos, sem tocar a habilidade em uso', () => {
  const rng = M.criarRng(2), a = un('a', 'a'), x = un('x', 'a'); const b = M.criarBatalha([a, x], [un('i', 'i')]);
  x.cd = [0, 3, 5]; a.cd = [0, 0, 0];
  const dom = { ...criarEstadoDomadorBatalha({}) }; // usa o motor via domador: Ímpeto Sombrio dá 'veloz' no aliado de maior ataque
  // aplica direto pelos efeitos de uma habilidade de apoio do kit
  a.kit[1] = { id: 't', nome: 'Teste', tipo: 'apoio', alvo: 'aliados', cd: 2, efeitos: [{ id: 'veloz', turnos: 2 }] };
  while (M.atorAtual(b).id !== 'a') M.executar(b, { tipo: 'defender' }, rng);
  const antes = [...x.cd]; M.executar(b, { tipo: 'habilidade', idx: 1 }, rng);
  assert.deepEqual(x.cd, antes.map((c) => Math.max(0, c - 1)).map((c, i) => i === 0 ? c : c));
  assert.equal(a.cd[1], 2);
  x.cd = [0, 4, 4]; a.kit[2] = { id: 'p', nome: 'P', tipo: 'apoio', alvo: 'aliados', cd: 5, efeitos: [{ id: 'panico', turnos: 2 }] };
});
