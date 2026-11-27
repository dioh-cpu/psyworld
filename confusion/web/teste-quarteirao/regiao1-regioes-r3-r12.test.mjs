import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGO_REGIOES_3_12,
  REGIOES_3_12_POR_ID,
  encontrosDaAreaRegiao,
  sortearEncontroAreaRegiao,
  encontroChefeRegiao,
} from './regiao1-regioes-r3-r12-regras.js';
import {
  CATALOGO_REGIOES,
  REGIOES_POR_ID,
  regiaoDoMapa,
  registrarVitoriaChefeRegiao,
} from './regiao1-regioes-regras.js';
import { saldoEssencia } from './regiao1-regras-sonho.js';
import { expDe } from './regiao1-exp-regras.js';
import { LINHAS, ESPECIES } from '../species.js';
import { LINHAGENS_REINOS, CHEFES_REINOS } from './regiao1-kits-reinos.js';
import { criarEstadoInicial } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';

const INICIAIS = new Set(LINHAS.flatMap((l) => [l.inicial, l.atual, l.evolucao]));

test('Regiões 3–12: áreas interligadas sem saída sem volta, encontros por área das 5 linhagens e chefes alinhados a CHEFES_REINOS', () => {
  assert.equal(CATALOGO_REGIOES_3_12.length, 10);

  for (const reg of CATALOGO_REGIOES_3_12) {
    assert.ok(reg.numero >= 3 && reg.numero <= 12);
    assert.equal(reg.mapaEntrada, `R${reg.numero}_C0`);
    assert.equal(reg.mapaChefe, `R${reg.numero}_CHEFE`);

    // Chefe bate com CHEFES_REINOS (ex.: R11 trevas, R12 eletrico)
    const chOficial = CHEFES_REINOS.find((c) => c.reino === reg.numero);
    assert.equal(reg.chefe.nome, chOficial.nome);
    assert.equal(reg.chefe.elemento, chOficial.elemento);
    assert.equal(reg.chefe.spec[3].chefe, true);

    // Todas as áreas têm saída bidirecional dentro da região (exceto portal externo em C0)
    const ids = Object.keys(reg.areas);
    assert.equal(ids.length, 8);
    const visitadas = new Set([reg.mapaEntrada]);
    for (const idArea of visitadas) {
      for (const saida of reg.areas[idArea].saidas) {
        if (saida.tipo === 'portal') continue;
        assert.ok(reg.areas[saida.destino], `Destino inexistente em ${reg.id}: ${saida.destino}`);
        assert.ok(reg.areas[saida.destino].saidas.some((v) => v.destino === idArea), `Saída sem volta ${idArea} -> ${saida.destino}`);
        visitadas.add(saida.destino);
      }
    }
    assert.equal(visitadas.size, ids.length, `Área inacessível em ${reg.id}`);

    // Encontros por área usam as linhagens do reino, espécies válidas, dentro da faixa de nível e sem iniciais
    const esperadasReino = new Set(LINHAGENS_REINOS.filter((l) => l.reino === reg.numero).map((l) => l.nome));
    const vistasReino = new Set();
    for (const areaId of reg.ordemAreas.slice(1, 7)) {
      const lista = encontrosDaAreaRegiao(reg.id, areaId);
      assert.equal(lista.length, 4);
      for (const e of lista) {
        assert.ok(ESPECIES[e.especie], `Espécie ausente em ESPECIES: ${e.especie}`);
        assert.equal(INICIAIS.has(e.especie), false);
        assert.ok(esperadasReino.has(e.linhagem));
        assert.ok(e.nivel >= reg.faixaNivel[0] && e.nivel <= reg.faixaNivel[1]);
        vistasReino.add(e.linhagem);
      }
      assert.ok(sortearEncontroAreaRegiao(reg.id, areaId, () => 0.3)?.especie);
    }
    assert.equal(vistasReino.size, 5);
    assert.ok(encontroChefeRegiao(reg.id).inimigos.length === 3);
    assert.equal(regiaoDoMapa(`R${reg.numero}_C0`), reg.id);
    assert.equal(CATALOGO_REGIOES[reg.numero - 1].mapaEntrada, `R${reg.numero}_C0`);
  }
});

test('Regiões 3–12: recompensa estendida de 1ª vitória (gold, diamantes, tickets, Essências e relíquia) paga 1 única vez', () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, 70_000_000);
  s.regioes.chefesDerrotados.r1 = true;
  s.regioes.chefesDerrotados.r2 = true;

  const gold0 = s.recompensas.gold;
  const diam0 = s.recompensas.diamantes;
  const tickets0 = expDe(s).tickets;
  const bolsas0 = s.idle.reliquias.bolsa.length;
  const r3Info = REGIOES_POR_ID.r3;

  const v1 = registrarVitoriaChefeRegiao(s, 'r3');
  assert.equal(v1.ok, true);
  assert.equal(v1.primeiraVez, true);
  assert.equal(v1.proximaDesbloqueada, 'r4');
  assert.equal(s.recompensas.gold, gold0 + r3Info.recompensaPrimeiraVitoria.gold);
  assert.equal(s.recompensas.diamantes, diam0 + r3Info.recompensaPrimeiraVitoria.diamantes);
  assert.equal(expDe(s).tickets, tickets0 + REGIOES_3_12_POR_ID.r3.recompensaPrimeiraVitoria.ticketsPermanentes);
  assert.ok(saldoEssencia(s, 'fogo', 'menor') > 0);
  assert.equal(s.idle.reliquias.bolsa.length, bolsas0 + 1);

  // Vitória repetida não paga nenhum prêmio de novo
  const v2 = registrarVitoriaChefeRegiao(s, 'r3');
  assert.equal(v2.primeiraVez, false);
  assert.equal(expDe(s).tickets, tickets0 + REGIOES_3_12_POR_ID.r3.recompensaPrimeiraVitoria.ticketsPermanentes);
  assert.equal(s.idle.reliquias.bolsa.length, bolsas0 + 1);
});
