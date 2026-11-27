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
    if (M.temKitProprio(nome)) continue; // kits escritos à mão
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
  a.kit = M.kitDe('Genérico', 'ataque', 'fogo', ['A', 'B', 'C']); const b = M.criarBatalha([a], ini); M.atorAtual(b);
  M.executar(b, { tipo: 'habilidade', idx: 1 }, rng); assert.equal(b.evento.alvos.length, 3); assert.ok(b.evento.area);
  const b2 = M.criarBatalha([u('a0', 'Noctarn', 'a', 30)], [u('i0', 'Brotavel', 'i', 5)]); M.atorAtual(b2); b2.aliados[0].cd[2] = 3; M.executar(b2, { tipo: 'habilidade', idx: 2 }, rng); assert.equal(b2.evento.tipo, 'atacar');
});

// Expansão 1 · kits das linhagens dos Reinos 03–12
test('reinos 03–12: 50 linhagens, 5 por reino, cada uma com kit próprio de 3 habilidades e ids únicos', async () => {
  const H = await import('./regiao1-batalha-habilidades.js');
  const { LINHAGENS_REINOS } = await import('./regiao1-kits-reinos.js');
  assert.equal(LINHAGENS_REINOS.length, 50);
  for (let r = 3; r <= 12; r++) {
    const doReino = LINHAGENS_REINOS.filter((l) => l.reino === r);
    assert.equal(doReino.length, 5, `reino ${r}`);
    assert.ok(doReino.some((l) => l.classe === 'tanque') && doReino.some((l) => l.classe === 'suporte'), `reino ${r} tem tanque e suporte`);
  }
  const ids = new Set(Object.values(H.KITS).flat().map((h) => h.id));
  for (const l of LINHAGENS_REINOS) {
    const kit = H.kitDe(l.nome, 'ataque', 'neutro');
    assert.equal(kit, H.KITS_REINOS[l.nome]);
    assert.deepEqual(kit.map((h) => h.cd), [1, 3, 5]);
    for (const h of kit) {
      assert.match(h.id, /^[a-z0-9_]+$/);
      assert.ok(!ids.has(h.id), `id repetido: ${h.id}`); ids.add(h.id);
      assert.equal(h.elemento, l.elemento);
      for (const e of h.efeitos) assert.ok(H.EFEITOS[e.id], `${h.id}: efeito ${e.id}`);
    }
    assert.equal(H.PAPEL_PADRAO[l.nome], { tanque: 'defesa', suporte: 'suporte' }[l.classe] || 'ataque');
  }
});
test('reinos 03–12: linhagem nova entra em batalha com o kit e o papel da classe', () => {
  const b = M.criarBatalha([u('a', 'Pedrapica', 'a', 30), u('b', 'Corujalva', 'a', 30)], [u('x', 'Magmora', 'i', 30), u('y', 'Mantaré', 'i', 30)]);
  assert.equal(b.aliados[0].papel, 'defesa'); assert.equal(b.aliados[0].kit[0].id, 'bico_de_pedra');
  assert.equal(b.inimigos[0].kit[2].id, 'erupcao_da_caldeira');
  rodarAte(b, () => false);
  assert.ok(b.fim);
});
test('chefes dos reinos: kit próprio, tupla de batalha e fúria uma única vez', async () => {
  const H = await import('./regiao1-batalha-habilidades.js');
  const { CHEFES_REINOS, specChefeReino } = await import('./regiao1-kits-reinos.js');
  assert.equal(CHEFES_REINOS.length, 12);
  const ids = new Set([...Object.values(H.KITS), ...Object.values(H.KITS_REINOS)].flat().map((h) => h.id));
  for (const c of CHEFES_REINOS) for (const h of H.kitDe(c.nome)) { assert.ok(!ids.has(h.id), h.id); ids.add(h.id); }
  const [nome, nv, el, op] = specChefeReino(3, 40);
  const chefe = Object.assign(M.criarUnidade({ id: 'x', especie: nome, nivel: nv, lado: 'i', elemento: el, bonus: op.bonus }), { chefe: true });
  assert.equal(chefe.kit[2].id, 'chama_do_basilisco');
  const b = M.criarBatalha([u('a', 'Ignavor', 'a', 40), u('b', 'Vaelith', 'a', 40)], [chefe]);
  assert.equal(chefe.furia, 0.5);
  chefe.hp = Math.round(chefe.hpMax * 0.51); chefe.efeitos = { veneno: { turnos: 3, valor: 5 } }; chefe.cd = [0, 0, 4];
  let viu = 0;
  const passo = () => { const a = M.atorAtual(b); if (!a) return false; M.executar(b, M.decidir(b, a, rng), rng); if (b.evento?.fases) viu += b.evento.fases.length; return true; };
  while (!chefe.emFuria && passo());
  assert.equal(viu, 1); assert.ok(chefe.emFuria);
  assert.ok(!chefe.efeitos.veneno && chefe.efeitos.ataque_alto && chefe.efeitos.defesa_alta);
  assert.equal(chefe.cd[2], 0);
  for (let i = 0; i < 400 && passo(););
  assert.ok(b.fim); assert.equal(viu, 1);
});
test('reinos 03–12: formas base e final herdam o kit e o papel da linhagem', async () => {
  const H = await import('./regiao1-batalha-habilidades.js');
  const { FORMAS_LINHAGENS_REINOS } = await import('../formas-reinos.js');
  const { LINHAGENS_REINOS } = await import('./regiao1-kits-reinos.js');
  assert.equal(Object.keys(FORMAS_LINHAGENS_REINOS).length, 50);
  for (const l of LINHAGENS_REINOS) {
    const f = FORMAS_LINHAGENS_REINOS[l.nome]; assert.ok(f, l.nome);
    for (const n of [f.base, f.final]) { assert.equal(H.kitDe(n, 'ataque', 'neutro'), H.KITS_REINOS[l.nome], n); assert.equal(H.PAPEL_PADRAO[n], H.PAPEL_PADRAO[l.nome]); }
  }
  assert.equal(M.criarUnidade({ id: 'q', especie: 'Rocacrista', nivel: 50, lado: 'a' }).kit[2].id, 'avalanche_da_crista');
});
test('Enxame Dourado: pica todos do time alvo por 3 rodadas, com chance de veneno, e some', async () => {
  const { specChefeReino } = await import('./regiao1-kits-reinos.js');
  const [nome, nv, el, op] = specChefeReino(2, 40);
  const rainha = Object.assign(M.criarUnidade({ id: 'x', especie: nome, nivel: nv, lado: 'i', elemento: el, bonus: op.bonus }), { chefe: true });
  assert.equal(rainha.kit[1].nome, 'Enxame Dourado'); assert.deepEqual(rainha.kit[1].enxame, { turnos: 3, mult: 0.35, chance: 0.4 });
  const time = ['Ignavor', 'Vaelith', 'Brotavel', 'Solarin'].map((e, i) => u(`a${i}`, e, 'a', 40));
  for (const a of time) { a.hpMax *= 50; a.hp = a.hpMax; }
  const b = M.criarBatalha(time, [rainha]); M.atorAtual(b);
  b.fila = ['x', ...b.fila.filter((id) => id !== 'x')]; b.iniciado = `${b.rodada}:x`;
  M.executar(b, { tipo: 'habilidade', idx: 1 }, rng);
  assert.ok(b.evento.enxame); assert.equal(b.campos.length, 1); assert.equal(b.campos[0].lado, 'a');
  let picadas = 0, fim = 0, rodadas = 0, r0 = b.rodada;
  for (let i = 0; i < 200 && !fim; i++) {
    const at = M.atorAtual(b); if (!at) break;
    for (const e of b.antes || []) { if (e.efeito === 'enxame') picadas++; if (e.tipo === 'enxameFim') fim++; }
    b.antes = []; rodadas = b.rodada - r0;
    M.executar(b, M.decidir(b, at, rng), rng);
  }
  assert.equal(fim, 1); assert.equal(rodadas, 3); assert.equal(picadas, 12); assert.equal(b.campos.length, 0);
});
test('resumoBatalha: todos vivos no fim (reviver conta), classes, elementos e supremas do time', async () => {
  const time = ['Ignavor', 'Vaelith', 'Brotavel', 'Solarin'].map((e, i) => u(`a${i}`, e, 'a', 60));
  const b = M.criarBatalha(time, [u('x', 'Fanalino', 'i', 5)]);
  b.aliados[1].hp = 0; // caiu
  b.aliados[1].hp = 50; // revivido antes do fim
  b.inimigos[0].hp = 0; b.fim = 'vitoria'; b.supremas = { a: 2, i: 1 };
  const r = M.resumoBatalha(b);
  assert.equal(r.venceu, true); assert.equal(r.todosVivos, true); assert.equal(r.vivosNoFim, 4); assert.equal(r.supremasUsadas, 2);
  assert.equal(Object.values(r.classes).reduce((a, n) => a + n, 0), 4); assert.equal(r.elementos.fogo, 1); assert.equal(r.elementos.agua, 1);
  b.aliados[2].hp = 0; assert.equal(M.resumoBatalha(b).todosVivos, false);
  // supremas contadas pelo motor ao usar habilidade de recarga 5
  const b2 = M.criarBatalha([u('s', 'Solarin', 'a', 40)], [u('y', 'Fanalino', 'i', 40)]); M.atorAtual(b2);
  b2.fila = ['s', ...b2.fila.filter((id) => id !== 's')]; b2.iniciado = `${b2.rodada}:s`;
  M.executar(b2, { tipo: 'habilidade', idx: 2 }, rng);
  assert.equal(M.resumoBatalha(b2).supremasUsadas, 1);
});
test('chefes da Região 2 com elementos do Reino 2 e kits próprios', async () => {
  const H = await import('./regiao1-batalha-habilidades.js');
  const { CHEFES_REGIAO, CHEFE_POR_NOME, specChefeReino } = await import('./regiao1-kits-reinos.js');
  assert.deepEqual(CHEFES_REGIAO.map((c) => [c.nome, c.elemento]), [['Ferroada Rubra', 'fogo'], ['Matriarca de Resina', 'voador'], ['Sentinela de Geoda', 'eletrico']]);
  assert.equal(specChefeReino(2, 45)[2], 'aco');
  const ids = new Set([...Object.values(H.KITS), ...Object.values(H.KITS_REINOS)].flat().map((h) => h.id));
  for (const nome of Object.keys(H.KITS_CHEFES)) for (const h of H.KITS_CHEFES[nome]) { assert.ok(!ids.has(h.id), h.id); ids.add(h.id); }
  for (const c of CHEFES_REGIAO) { assert.equal(H.kitDe(c.nome)[0].elemento, c.elemento); assert.equal(CHEFE_POR_NOME[c.nome].furia, 0.5); }
});
