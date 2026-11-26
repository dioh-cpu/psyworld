import test from 'node:test'; import assert from 'node:assert/strict';
import { ESTRATEGIA_C1 as D } from './regiao1-estrategia-c1.js';
import { ESTRATEGIA_R2 } from './regiao1-estrategia-r2.js';
import { FAB } from './regiao1-exp-dados.js';
import { gestaoDe, enfileirarObras, avancar, coletarTudo, prontoParaColetar, fabricarLote, repetirUltimoLote, previsaoLote, acelerarObra, nivelProfissao, bonusProfissao, HORA } from './regiao1-gestao-regras.js';
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
test('Reino 2 tem gestão própria (mel e cera), 30 terrenos com ids preservados e fallback de mapa', () => {
  const s = novo({ mel: 100, cera: 100 }); const r = enfileirarObras(s, ESTRATEGIA_R2, ['a1'], T0);
  assert.equal(r.entraram.length, 1); assert.ok(r.custo.mel > 0 && r.custo.madeira === undefined);
  assert.ok(ESTRATEGIA_R2.rotas.every((x) => x.fases.length === 3));
  assert.equal(ESTRATEGIA_R2.fundo, 'assets/confusion/interface/estrategia/reinos/02/cidade-expansao-30.webp');
  assert.equal(ESTRATEGIA_R2.fundoFallback, 'assets/confusion/interface/estrategia/reinos/02/cidade-conceito.webp');
  assert.equal(ESTRATEGIA_R2.locais.length, 30);
  assert.deepEqual(ESTRATEGIA_R2.locais.map((l) => l.id).sort(), D.locais.map((l) => l.id).sort());
});
test('construções concluídas: fila não conta, conclusão conta uma vez; saves antigos contam níveis existentes', () => {
  const s = novo(); s.estruturas = { a1: { tipo: 'casas', nivel: 2 }, e1: { tipo: 'quartel', nivel: 1 } };
  assert.equal(gestaoDe(s, T0).concluidas, 3);
  enfileirarObras(s, D, ['a2'], T0); assert.equal(gestaoDe(s).concluidas, 3);
  avancar(s, D, T0 + 40_000); avancar(s, D, T0 + 80_000); assert.equal(gestaoDe(s).concluidas, 4);
});
test('profissões: nível, teto de 40% no tempo, +1 por lote a cada 3 níveis, nivelMin e lotes em andamento intactos', () => {
  assert.equal(nivelProfissao(0), 1); assert.equal(nivelProfissao(5), 2); assert.equal(nivelProfissao(20), 3); assert.equal(nivelProfissao(80), 5);
  assert.deepEqual(bonusProfissao(20), { nivel: 3, reducaoTempo: 0.1, extraLote: 1 });
  assert.equal(bonusProfissao(9999).reducaoTempo, 0.4); // teto de 40%
  assert.equal(bonusProfissao(180).extraLote, 2); // nv.7 -> floor(7/3) = 2

  const s = { materiais: { fibra: 80, cristal: 40, leite: 40, mel: 40, ovos: 40 }, estruturas: {}, trabalho: {}, profissoes: { alquimia: 0, cozinha: 0 } };
  // nivelMin bloqueia receitas avançadas até subir o nível da profissão
  assert.equal(fabricarLote(s, FAB, 'torta', 1, T0).ok, false);
  assert.equal(fabricarLote(s, FAB, 'elixir', 1, T0).ok, false);
  assert.equal(fabricarLote(s, FAB, 'tonico_concentrado', 1, T0).ok, false);

  // Enfileira 2 lotes no nível 1: o lote 1 vai subir Alquimia para nv.3 (10 unidades = +20 XP), mas o lote 2 já enfileirado mantém seg=20 e extra=0
  assert.ok(fabricarLote(s, FAB, 'tonico', 10, T0).ok);
  assert.ok(fabricarLote(s, FAB, 'tonico', 2, T0).ok);
  const g = gestaoDe(s);
  assert.equal(g.fabricacao[0].seg, 20); assert.equal(g.fabricacao[0].extra, 0);
  assert.equal(g.fabricacao[1].seg, 20); assert.equal(g.fabricacao[1].extra, 0);

  // Conclui o lote 1 -> ganha 20 XP nas regras (Alquimia nv.3), mas lote 2 continua com seg=20 e extra=0
  avancar(s, FAB, T0 + 200_000);
  assert.equal(s.profissoes.alquimia, 20);
  assert.equal(nivelProfissao(s.profissoes.alquimia), 3);
  assert.equal(g.itens.tonico, 10);
  assert.equal(g.fabricacao[0].seg, 20); assert.equal(g.fabricacao[0].extra, 0);

  // Novo lote enfileirado agora já grava seg=18 (−10%) e extra=1 (+1 unidade no lote), e libera Elixir de Foco (nv.3)
  const r3 = fabricarLote(s, FAB, 'elixir', 2, T0 + 200_000);
  assert.ok(r3.ok);
  assert.equal(r3.previsao.seg, 36); // 40s * 0.9
  assert.equal(r3.previsao.extra, 1);
  assert.deepEqual(r3.previsao.saida, { pocao_xp_p: 3 }); // 2 + 1 extra

  // Termina lote 2 (40s do nível antigo) e lote 3 (72s do nível 3)
  avancar(s, FAB, T0 + 240_000);
  assert.equal(g.itens.tonico, 12); // sem extra no lote antigo
  avancar(s, FAB, T0 + 312_000);
  assert.equal(g.itens.pocao_xp_p, 3);
});
