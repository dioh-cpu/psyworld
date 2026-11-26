import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import {
  ESTRELAS_CFG, TIER_CFG, REPRODUCAO_CFG, EVOLUCAO_CFG,
  custoCopiasEstrela, normalizarUnidade, preverSubirEstrela, subirEstrela, subirTierUnidade,
  podeReproduzir, tentarReproduzir, adicionarFragmentoSonho, arvoreEvolucaoDe, evoluirFormaOnirico, fichaOnirico,
} from './regiao1-criacao-regras.js';
import { INICIAIS, prepararContaNova } from './regiao1-conta.js';
import { aberto, expDe, invocarMultiplo } from './regiao1-exp-regras.js';

test('Estrelas: sequência 1, 2, 4, 8, 10, 15, 20 a partir de 5★→6★, 8º degrau em aberto, preview de cópias e preservação da principal', () => {
  assert.deepEqual(ESTRELAS_CFG.custosCopias, [1, 2, 4, 8, 10, 15, 20]);
  assert.equal(custoCopiasEstrela(4), 0);
  assert.equal(custoCopiasEstrela(5), 1);
  assert.equal(custoCopiasEstrela(6), 2);
  assert.equal(custoCopiasEstrela(7), 4);
  assert.equal(custoCopiasEstrela(8), 8);
  assert.equal(custoCopiasEstrela(9), 10);
  assert.equal(custoCopiasEstrela(10), 15);
  assert.equal(custoCopiasEstrela(11), 20);
  assert.equal(custoCopiasEstrela(12), null); // além do 7º degrau em aberto

  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s);
  idle.equipe = [
    { uid: 'main', especie: 'Noctarn', nivel: 32, xp: 4500, tier: 4, raridade: 4, estrelas: 5, forma: 'abencoada' },
    { uid: 'c1', especie: 'Noctarn', nivel: 1, xp: 0, tier: 1, raridade: 1, estrelas: 1 },
    { uid: 'c2', especie: 'Noctarn', nivel: 5, xp: 80, tier: 2, raridade: 2, estrelas: 1 },
    { uid: 'outro', especie: 'Ignavor', nivel: 1, xp: 0, tier: 1, raridade: 1, estrelas: 1 },
  ];

  // Preview mostra exatamente qual cópia será consumida (a menos evoluída)
  const prev = preverSubirEstrela(idle.equipe, 0);
  assert.equal(prev.ok, true);
  assert.equal(prev.de, 5);
  assert.equal(prev.para, 6);
  assert.equal(prev.custo, 1);
  assert.equal(prev.copias.length, 1);
  assert.equal(prev.copias[0].uid, 'c1');

  const r = subirEstrela(s, 0);
  assert.equal(r.ok, true);
  assert.equal(r.unidade.uid, 'main');
  assert.equal(r.unidade.estrelas, 6);
  // Preserva integralmente a progressão da unidade principal e não altera o tier
  assert.equal(r.unidade.nivel, 32);
  assert.equal(r.unidade.xp, 4500);
  assert.equal(r.unidade.tier, 4);
  assert.equal(r.unidade.forma, 'abencoada');
  assert.equal(idle.equipe.length, 3);

  // Sem cópias suficientes para 6★→7★ (precisa 2, só resta 1 Noctarn)
  assert.equal(subirEstrela(s, 0).ok, false);

  // Além do 7º degrau (12★→13★) fica em aberto
  idle.equipe[0].estrelas = 12;
  const aberto = subirEstrela(s, 0);
  assert.equal(aberto.ok, false);
  assert.match(aberto.motivo, /em aberto/);
});

test('Tier independente de estrelas, só sobe com itens raros até T5 e saves antigos preservam tier/estrelas/nível', () => {
  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s);
  // Save antigo com raridade/nivel sem campo tier explícito
  idle.equipe = [{ uid: 'antigo', especie: 'Vaelith', nivel: 18, xp: 1200, raridade: 3, estrelas: 7 }];
  const sRecarregado = desserializarEstado(serializarEstado(s));
  const u = normalizarUnidade(sRecarregado.idle.equipe[0]);
  assert.equal(u.tier, 3);
  assert.equal(u.estrelas, 7);
  assert.equal(u.nivel, 18);

  // Sem item específico não sobe
  assert.equal(subirTierUnidade(sRecarregado, 0).ok, false);

  // Com o item específico de T3→T4 e T4→T5 sobe até o teto T5 sem mexer em estrelas ou nível
  sRecarregado.idle.mochila.itensTier = {
    [TIER_CFG.itensPorTier[3].id]: 1,
    [TIER_CFG.itensPorTier[4].id]: 2,
  };
  assert.equal(subirTierUnidade(sRecarregado, 0).para, 4);
  assert.equal(u.estrelas, 7);
  assert.equal(u.nivel, 18);
  assert.equal(subirTierUnidade(sRecarregado, 0).para, 5);
  // T5 é o teto
  const teto = subirTierUnidade(sRecarregado, 0);
  assert.equal(teto.ok, false);
  assert.match(teto.motivo, /teto/);
});

test('Reprodução: mesma espécie (inclusive evento), pais permanecem, falha aplica intervalo inteiro (5min T1, 2h T5)', () => {
  assert.equal(REPRODUCAO_CFG.intervaloMsPorTier[1], 5 * 60_000);
  assert.equal(REPRODUCAO_CFG.intervaloMsPorTier[5], 120 * 60_000);

  const s = criarEstadoInicial();
  const idle = garantirEstadoIdle(s);
  idle.equipe = [
    { uid: 'ev1', especie: 'Mortalio', nivel: 20, tier: 1, raridade: 1, estrelas: 3, evento: 'hw-2026' },
    { uid: 'ev2', especie: 'Mortalio', nivel: 15, tier: 1, raridade: 1, estrelas: 2, evento: 'hw-2026' },
    { uid: 't5a', especie: 'Tiranox', nivel: 10, tier: 5, raridade: 5, estrelas: 1 },
    { uid: 't5b', especie: 'Tiranox', nivel: 12, tier: 5, raridade: 5, estrelas: 1 },
  ];

  // Espécies diferentes não cruzam
  assert.equal(tentarReproduzir(s, 0, 2, () => 0.1, 1000).ok, false);

  // T1 falha (rng = 0.99 >= 0.75): pais permanecem e casal aguarda 5 minutos inteiros
  const t0 = 1_000_000;
  const falha = tentarReproduzir(s, 0, 1, () => 0.99, t0);
  assert.equal(falha.ok, true);
  assert.equal(falha.sucesso, false);
  assert.equal(falha.intervaloMs, 5 * 60_000);
  assert.equal(idle.equipe.length, 4); // pais preservados
  assert.equal(podeReproduzir(s, 0, 1, t0 + 4 * 60_000).ok, false);

  // Após 5 min, sucesso gera ovo da mesma espécie (inclusive evento) e pais continuam na coleção
  const suc = tentarReproduzir(s, 0, 1, () => 0.1, t0 + 5 * 60_000);
  assert.equal(suc.ok, true);
  assert.equal(suc.sucesso, true);
  assert.equal(suc.ovo.especie, 'Mortalio');
  assert.equal(suc.ovo.evento, 'hw-2026');
  assert.equal(idle.equipe.length, 4);

  // T5: intervalo inteiro de 2 horas mesmo em falha
  const fT5 = tentarReproduzir(s, 2, 3, () => 0.99, t0);
  assert.equal(fT5.sucesso, false);
  assert.equal(fT5.intervaloMs, 120 * 60_000);
  assert.equal(podeReproduzir(s, 2, 3, t0 + 119 * 60_000).ok, false);
  assert.equal(podeReproduzir(s, 2, 3, t0 + 120 * 60_000).ok, true);
});

test('Iniciais T4→T4→T5, evolução por 10/30 Fragmentos de Sonho, ficha completa, Equipe separada e Invocação ×1/×10', () => {
  // 1) Criação de conta apresenta os 5 iniciais na forma base T4 com moldura aprovada
  assert.equal(INICIAIS.length, 5);
  assert.ok(INICIAIS.every((i) => i.tier === 4 && i.moldura.endsWith('moldura-4.png')));

  const s = criarEstadoInicial();
  garantirEstadoIdle(s);
  prepararContaNova(s, { userId: 'u-test', inicial: 'Penumbrio', novo: true });
  const ini = s.idle.equipe[0];
  assert.equal(ini.especie, 'Penumbrio');
  assert.equal(ini.tier, 4);
  assert.equal(ini.raridade, 4);

  // 2) Ficha completa do Onírico selecionado (stats, classe, elemento, tier, raridade, estrelas, 3 habilidades e árvore de 3 formas)
  const f0 = fichaOnirico(ini, s);
  assert.ok(f0.hp > 0 && f0.ataque > 0 && f0.defesa > 0 && f0.velocidade > 0);
  assert.equal(f0.tier, 4);
  assert.equal(f0.raridade, 'epica');
  assert.equal(f0.estrelas, 1);
  assert.equal(f0.classe, 'Assassino');
  assert.equal(f0.habilidades.length, 3);
  assert.equal(f0.arvore.formas.length, 3);
  assert.equal(f0.arvore.proxima.custo, 10);
  assert.equal(f0.arvore.proxima.saldo, 0);

  // 3) Evolução Base → 2ª custa 10 Fragmentos de Sonho elementais (continua T4); 2ª → 3ª custa 30 (sobe para T5)
  assert.equal(evoluirFormaOnirico(s, 0).ok, false);
  adicionarFragmentoSonho(s, 'trevas', 40);
  const e1 = evoluirFormaOnirico(s, 0);
  assert.equal(e1.ok, true);
  assert.equal(e1.para, 'Noctarn');
  assert.equal(ini.tier, 4);
  assert.equal(e1.saldoRestante, 30);

  const e2 = evoluirFormaOnirico(s, 0);
  assert.equal(e2.ok, true);
  assert.equal(e2.para, 'Noctarion');
  assert.equal(ini.tier, 5);
  assert.equal(e2.saldoRestante, 0);
  assert.equal(arvoreEvolucaoDe(ini, s).proxima, null);

  // 4) Restante do catálogo não deriva tier pela posição na árvore
  const outro = { uid: 'cat1', especie: 'Mortalio', nivel: 10, tier: 2, raridade: 2, estrelas: 1 };
  assert.equal(fichaOnirico(outro, s).tier, 2);
  assert.equal(fichaOnirico(outro, s).arvore.linhagemInicial, false);

  // 5) Equipe é menu próprio sempre aberto e Invocação suporta apenas ×1 e ×10
  assert.equal(aberto(s, 'equipe'), true);
  const e = expDe(s);
  e.tickets = 11;
  const r1 = invocarMultiplo(s, 1, () => 0.5);
  assert.equal(r1.ok, true);
  assert.equal(r1.qtd, 1);
  const r10 = invocarMultiplo(s, 10, () => 0.5);
  assert.equal(r10.ok, true);
  assert.equal(r10.qtd, 10);
  assert.equal(e.tickets, 0);
});

