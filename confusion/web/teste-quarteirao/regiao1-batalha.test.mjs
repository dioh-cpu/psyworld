import test from 'node:test'; import assert from 'node:assert/strict';
import * as M from './regiao1-estrategia-regras.js';
import { ESPECIES } from '../species.js';
import { EFEITOS, DEBUFFS } from './regiao1-batalha-habilidades.js';
import { indicesEquipeCombate } from './regiao1-exp-regras.js';
const rng = M.criarRng(7);
const u = (id, esp, lado, nivel = 10, papeis = {}) => M.criarUnidade({ id, especie: esp, nivel, lado, papeis });
const rodarAte = (b, f, max = 300) => { for (let i = 0; i < max && !b.fim && !f(b); i++) M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng); };
test('toda espécie tem 3 habilidades só com recarga (sem custo), e mais recarga = mais efeito', () => {
  for (const [nome] of Object.entries(ESPECIES)) for (const papel of ['ataque', 'defesa', 'suporte']) {
    const k = M.kitDe(nome, papel, 'fogo', ESPECIES[nome].habilidades); assert.equal(k.length, 3, nome);
    assert.ok(k[0].cd < k[1].cd && k[1].cd < k[2].cd, `${nome}/${papel}`);
    const forca = (h) => (h.tipo === 'dano' ? h.mult * (h.alvo === 'todos' ? 2 : 1) : h.tipo === 'cura' ? (h.mult + (h.alvo === 'aliados' ? 0.1 : 0)) * 5 : ((h.escudo || 0) + (h.cura || 0)) * 5 + (h.limpa ? 1 : 0.2) + (h.efeitos?.length || 0) * 0.4);
    if (M.KITS[nome]) continue; // kits escritos à mão
    assert.ok(forca(k[0]) <= forca(k[1]) + 1e-9 || papel === 'defesa', `${nome}/${papel} s1<=s2`); assert.ok(forca(k[2]) >= forca(k[1]) - 1e-9 || papel === 'defesa', `${nome}/${papel} s3>=s2`);
  }
  const kn = M.kitDe('Noctarn', 'ataque', 'trevas'); assert.deepEqual(kn.map((h) => h.id), ['mordida_umbral', 'chama_violeta', 'veu_noturno']);
});
test('variedade: há cura, purificação, ataque em área e efeitos de sangramento, queimadura e veneno', () => {
  const todos = Object.keys(ESPECIES).flatMap((n) => ['ataque', 'defesa', 'suporte'].flatMap((p) => M.kitDe(n, p, ['fogo', 'planta', 'agua', 'terra', 'inseto', 'voador', 'eletrico', 'aco', 'trevas', 'luz', 'pedra'][n.length % 11], ESPECIES[n].habilidades)));
  assert.ok(todos.some((h) => h.tipo === 'cura')); assert.ok(todos.some((h) => h.limpa)); assert.ok(todos.some((h) => h.alvo === 'todos'));
  const ids = new Set(todos.flatMap((h) => (h.efeitos || []).map((e) => e.id))); for (const e of ['sangramento', 'queimadura', 'veneno', 'atordoamento']) assert.ok(ids.has(e), e);
});
test('reforço: 4 em campo, até 2 na fila; entra na vaga e a vitória só vem com a fila vazia', () => {
  const al = [0, 1, 2, 3].map((i) => u(`a${i}`, 'Noctarn', 'a', 40)), ini = [0, 1, 2, 3, 4, 5].map((i) => u(`i${i}`, 'Brotavel', 'i', 3));
  const b = M.criarBatalha(al, ini); assert.equal(b.inimigos.length, 4); assert.equal(b.esperaI.length, 2);
  let reforcos = 0; for (let i = 0; i < 200 && !b.fim; i++) { M.executar(b, M.decidir(b, M.atorAtual(b), rng), rng); if (b.evento?.reforco) reforcos++; }
  assert.equal(b.fim, 'vitoria'); assert.equal(b.esperaI.length, 0); assert.ok(reforcos >= 2); assert.equal(b.ordem.filter((x) => x.lado === 'i' && x.hp <= 0).length, 6);
});
test('o save mantém os seis Oníricos, mas só quatro entram e os aliados não têm reforço', () => {
  const equipe = Array.from({ length: 6 }, (_, i) => ({ especie: 'Noctarn', nivel: i + 1 }));
  const idle = { equipe, equipeCombate: [5, 3, 5, 4, 2, 1, 0, 9] };
  assert.deepEqual(indicesEquipeCombate(idle), [5, 3, 4, 2]);
  assert.deepEqual(indicesEquipeCombate({ equipe }), [0, 1, 2, 3]);
  const aliados = equipe.map((m, i) => u(`a${i}`, m.especie, 'a', m.nivel));
  const b = M.criarBatalha(aliados, [u('i0', 'Ignavor', 'i', 40)], { ativos: 6 });
  assert.deepEqual(b.aliados.map(m => m.id), ['a0', 'a1', 'a2', 'a3']);
  aliados.slice(0, 4).forEach(m => { m.hp = 0; });
  assert.equal(M.atorAtual(b), null);
  assert.equal(b.fim, 'derrota');
  assert.equal(idle.equipe.length, 6);
});
test('recarga, custo de energia e efeitos: sangramento causa dano por turno; atordoado perde o turno; purificar remove', () => {
  const a = u('a0', 'Noctarn', 'a', 30), i0 = u('i0', 'Brotavel', 'i', 10), i1 = u('i1', 'Brotavel', 'i', 10);
  const b = M.criarBatalha([a], [i0, i1]);
  M.atorAtual(b); M.executar(b, { tipo: 'habilidade', idx: 0, alvo: 'i0' }, () => 0); // rng 0: efeito sempre aplica
  assert.ok(i0.efeitos.sangramento); assert.equal(a.cd[0], 1); assert.ok(M.kitDe('Noctarn', 'ataque', 'trevas').every((h) => h.custo === undefined));
  i0.efeitos.atordoamento = { turnos: 1, valor: 0 };
  const hp0 = i0.hp; for (let k = 0; k < 6; k++) { M.executar(b, M.decidir(b, M.atorAtual(b), () => 0.99), () => 0.99); if (b.evento?.antes?.some((x) => x.tipo === 'pular' && x.alvo === 'i0')) break; }
  assert.ok(b.log.some((l) => /perde o turno/.test(l))); assert.ok(i0.hp < hp0 || i0.hp <= 0);
  a.efeitos = { veneno: { turnos: 3, valor: 1 }, ataque_baixo: { turnos: 2, valor: 0 }, escudo: { turnos: 2, valor: 5 } };
  a.cd = [0, 0, 0]; b.fila = [a.id]; b.iniciado = ''; M.atorAtual(b); M.executar(b, { tipo: 'habilidade', idx: 2 }, () => 0);
  assert.ok(!a.efeitos.veneno && !a.efeitos.ataque_baixo); assert.ok(a.efeitos.escudo.valor > 5); assert.equal(a.cd[2], 5);
  assert.ok(DEBUFFS.every((d) => EFEITOS[d].debuff));
});
test('área atinge todos; em recarga, a habilidade vira ataque básico', () => {
  const a = u('a0', 'Noctarn', 'a', 30, {}), ini = [0, 1, 2].map((i) => u(`i${i}`, 'Brotavel', 'i', 5));
  a.kit = M.kitDe('Brotavel', 'ataque', 'fogo', ['A', 'B', 'C']); const b = M.criarBatalha([a], ini); M.atorAtual(b);
  M.executar(b, { tipo: 'habilidade', idx: 1 }, rng); assert.equal(b.evento.alvos.length, 3); assert.ok(b.evento.area);
  const b2 = M.criarBatalha([u('a0', 'Noctarn', 'a', 30)], [u('i0', 'Brotavel', 'i', 5)]); M.atorAtual(b2); b2.aliados[0].cd[2] = 3; M.executar(b2, { tipo: 'habilidade', idx: 2 }, rng); assert.equal(b2.evento.tipo, 'atacar');
});
