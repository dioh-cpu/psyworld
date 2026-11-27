import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarMundo } from '../mundo/index.js';
import { caminhoArte } from '../mundo/artes.js';
import {
  elementosDoMundo,
  statusVilaMapa,
  investigacaoNpcInfo,
  rotasDisponiveisDaCidade,
  NPCS_PISTA_09,
} from './regiao1-mundo-integracao.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..', '..');

test('Sistemas 01–10 no mapa: vilas, refúgios, masmorras, NPCs e rotas têm artes reais em disco', () => {
  const m = criarMundo();
  m['05'].refugios = [{ nome: 'Refúgio 1', abrigados: 2 }, { nome: 'Refúgio 2', abrigados: 1 }, { nome: 'Fortaleza', abrigados: 4 }];
  const els = elementosDoMundo(m, { dia: 1 }).filter((e) => Number(e.sis) <= 10);
  assert.ok(els.length >= 15, `Esperava >= 15 elementos 01-10 no mapa, veio ${els.length}`);

  for (const el of els) {
    const rel = caminhoArte(el.sis, el.vaga);
    assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `Arte ausente em disco: ${rel}`);
  }
  for (const p of NPCS_PISTA_09) {
    const rel = caminhoArte('09', p.arte);
    assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `Arte de pista ausente: ${rel}`);
  }
});

test('Sistema 01 (Vilas): serviços abrem com prosperidade ≥ 40 e corrupção < 70 e fecham ao corromper ou arruinar', () => {
  const m = criarMundo();
  assert.equal(statusVilaMapa(m, 'sul').servicosAbertos, true);
  assert.equal(statusVilaMapa(m, 'sul').vaga, 'vila-saudavel');

  m['01'].sul.corrupcao = 75;
  assert.equal(statusVilaMapa(m, 'sul').servicosAbertos, false);
  assert.equal(statusVilaMapa(m, 'sul').vaga, 'vila-corrompida');

  m['01'].norte.corrupcao = 0;
  m['01'].norte.prosperidade = 10;
  assert.equal(statusVilaMapa(m, 'norte').servicosAbertos, false);
  assert.equal(statusVilaMapa(m, 'norte').vaga, 'vila-ruinas');
});

test('Sistema 05 (Refúgio): terreno inicial aparece em C1 e R2_C0 sem refúgios e vira refúgio após construir', () => {
  const m = criarMundo();
  const semRef = elementosDoMundo(m).filter((e) => e.sis === '05');
  assert.equal(semRef.length, 2);
  assert.ok(semRef.some((e) => e.mapa === 'C1' && e.dados.tipo === 'terreno_refugio'));
  assert.ok(semRef.some((e) => e.mapa === 'R2_C0' && e.dados.tipo === 'terreno_refugio'));

  m['05'].refugios.push({ nome: 'Refúgio 1', abrigados: 1 });
  const comRef = elementosDoMundo(m).filter((e) => e.sis === '05');
  assert.equal(comRef.length, 2);
  assert.ok(comRef.every((e) => e.vaga === 'refugio' && e.dados.tipo === 'refugio'));
});

test('Sistema 08 (Masmorras): entradas da Região 1 (E4, CC2, PC8) e Região 2 (R2_CRI) refletem infestação e dificuldade', () => {
  const m = criarMundo();
  m['08'].catacumba.infestacao = 80;
  const masm = elementosDoMundo(m).filter((e) => e.sis === '08');
  assert.equal(masm.length, 4);
  const cat = masm.find((e) => e.dados.masmorraId === 'catacumba');
  assert.equal(cat.mapa, 'E4');
  assert.equal(cat.dados.dificuldade, 'alta');
  assert.ok(masm.some((e) => e.mapa === 'R2_CRI'));
});

test('Sistema 09 (Pistas em NPCs): associa cada etapa aos NPCs da campanha e encerra ao resolver o caso', () => {
  const m = criarMundo();
  const p0 = investigacaoNpcInfo(m, 'npc_pescadora');
  assert.ok(p0 && p0.correspondente && p0.arte === 'pista-1');
  assert.equal(investigacaoNpcInfo(m, 'npc_zeladora_c1').correspondente, false);

  m['09'].caso.encontradas = 1;
  assert.equal(investigacaoNpcInfo(m, 'npc_zeladora_c1').correspondente, true);
  assert.equal(investigacaoNpcInfo(m, 'npc_zeladora_c1').arte, 'pista-2');

  m['09'].caso.encontradas = 2;
  assert.equal(investigacaoNpcInfo(m, 'npc_maquinista').correspondente, true);
  assert.equal(investigacaoNpcInfo(m, 'npc_maquinista').arte, 'pista-3');

  m['09'].caso.resolvido = true;
  assert.equal(investigacaoNpcInfo(m, 'npc_pescadora'), null);
});

test('Sistema 10 (Rotas entre cidades): rotas fecham em tempestade ou quando a vila destino fecha serviços', () => {
  const m = criarMundo();
  const abertas = rotasDisponiveisDaCidade(m, 'C1');
  assert.equal(abertas.length, 4);
  assert.equal(abertas.every((r) => r.aberta), true);

  m['01'].norte.corrupcao = 80;
  const parcial = rotasDisponiveisDaCidade(m, 'C1');
  assert.equal(parcial.find((r) => r.mapa === 'C2').aberta, false);
  assert.equal(parcial.find((r) => r.mapa === 'C0').aberta, true);

  m['07'].clima = 'tempestade';
  const fechadas = rotasDisponiveisDaCidade(m, 'C1');
  assert.equal(fechadas.every((r) => !r.aberta), true);
});
