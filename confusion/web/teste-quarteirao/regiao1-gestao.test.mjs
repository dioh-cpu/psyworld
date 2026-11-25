import test from 'node:test'; import assert from 'node:assert/strict';
import { ESTRATEGIA_C1 as D } from './regiao1-estrategia-c1.js';
import { ESTRATEGIA_R2 } from './regiao1-estrategia-r2.js';
import { gestaoDe, enfileirarObras, avancar, coletarTudo, prontoParaColetar, fabricarLote, repetirUltimoLote, previsaoLote, acelerarObra, HORA } from './regiao1-gestao-regras.js';
const novo = (mat = { madeira: 200, pedra: 200 }) => ({ materiais: { ...mat }, estruturas: {}, trabalho: {} });
const T0 = 1_000_000;
test('obras: respeitam vagas e materiais, com resumo do que ficou pendente', () => {
  const s = novo({ madeira: 40, pedra: 10 });
  const r = enfileirarObras(s, D, ['a1', 'a2', 'r1'], T0);
  assert.equal(r.entraram.length, 2); assert.equal(r.pendentes.length, 1);
  assert.match(r.pendentes[0].motivo, /Sem vaga/);
  assert.equal(s.materiais.madeira, 40 - 24); // 2 casas
  assert.equal(enfileirarObras(s, D, ['a1'], T0).pendentes[0].motivo, 'Já há uma obra neste local.');
});
test('obras terminam uma única vez, mesmo chamando avancar de novo', () => {
  const s = novo(); enfileirarObras(s, D, ['a1'], T0);
  assert.equal(avancar(s, D, T0 + 10_000).concluidas.length, 0);
  assert.equal(avancar(s, D, T0 + 40_000).concluidas.length, 1);
  assert.equal(avancar(s, D, T0 + 50_000).concluidas.length, 0);
  assert.equal(s.estruturas.a1.nivel, 1);
  assert.equal(gestaoDe(s).log.filter((x) => /Obra concluída/.test(x.t)).length, 1);
});
test('produção por tempo decorrido, teto de estoque e pendência', () => {
  const s = novo({ madeira: 145, pedra: 0 }); s.estruturas = { a1: { tipo: 'casas', nivel: 2 }, e1: { tipo: 'quartel', nivel: 1 } };
  avancar(s, D, T0); const g = gestaoDe(s, T0); for (const p of Object.values(g.producao)) p.desde = T0;
  avancar(s, D, T0 + 3 * HORA);
  assert.deepEqual(prontoParaColetar(s, D), { a1: { tipo: 'madeira', qtd: 60 }, e1: { tipo: 'pedra', qtd: 24 } });
  const r = coletarTudo(s, D, T0 + 3 * HORA);
  assert.equal(r.recebido.madeira, 5); assert.equal(r.pendente.madeira, 55); assert.equal(r.recebido.pedra, 24);
  assert.equal(s.materiais.madeira, 150);
  assert.equal(coletarTudo(s, D, T0 + 3 * HORA).recebido.pedra, undefined); // não coleta duas vezes
  avancar(s, D, T0 + 100 * HORA); // teto de 8h por prédio
  assert.ok(g.producao.a1.acum <= 20 * 8 + 1e-6);
});
test('fabricação: previsão, fila, repetir último lote e conclusão única', () => {
  const s = novo({ madeira: 30, pedra: 0 });
  const p = previsaoLote(s, D, 'tabua', 5); assert.deepEqual(p.insumos, { madeira: 10 }); assert.deepEqual(p.saida, { tabua: 5 }); assert.equal(p.duracao, 100_000);
  assert.ok(fabricarLote(s, D, 'tabua', 5, T0).ok); assert.equal(s.materiais.madeira, 20);
  assert.ok(repetirUltimoLote(s, D, T0).ok); assert.equal(s.materiais.madeira, 10);
  assert.equal(avancar(s, D, T0 + 100_000).fabricados.length, 1); assert.equal(gestaoDe(s).itens.tabua, 5);
  assert.equal(avancar(s, D, T0 + 100_000).fabricados.length, 0);
  avancar(s, D, T0 + 300_000); assert.equal(gestaoDe(s).itens.tabua, 10);
  const sem = novo({ madeira: 1, pedra: 0 }); assert.equal(fabricarLote(sem, D, 'tabua', 5, T0).motivo, 'Faltam insumos.');
});
test('acelerar custa diamantes e falha sem saldo', () => {
  const s = novo(); const [o] = enfileirarObras(s, D, ['a1'], T0).entraram;
  const d = { valor: 0 }; assert.equal(acelerarObra(s, D, o.id, d, T0).ok, false);
  d.valor = 5; const r = acelerarObra(s, D, o.id, d, T0); assert.ok(r.ok); assert.equal(d.valor, 4); assert.equal(s.estruturas.a1.nivel, 1);
});
test('Reino 2 tem gestão própria (mel e cera)', () => {
  const s = novo({ mel: 100, cera: 100 }); const r = enfileirarObras(s, ESTRATEGIA_R2, ['a1'], T0);
  assert.equal(r.entraram.length, 1); assert.ok(r.custo.mel > 0 && r.custo.madeira === undefined);
  assert.ok(ESTRATEGIA_R2.rotas.every((x) => x.fases.length === 3));
});
