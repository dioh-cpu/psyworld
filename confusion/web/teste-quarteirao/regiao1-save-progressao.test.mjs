import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import {
  concluirFaseCampanhaMini,
  coletarBauFase,
  coletarBauCapitulo,
  energiaDe,
} from './regiao1-campanha-mini-regras.js';
import { iniciarParalela, avancarEtapaParalela, coletarMarco } from './regiao1-missoes-regras.js';
import {
  concluirAndarTorreElemental,
  concluirAndarTorreUnica,
} from './regiao1-torres-regras.js';
import { concluirCalaboucoNivel } from './regiao1-calaboucos-regras.js';
import {
  concederReliquia,
  reforcarReliquia,
  equiparReliquia,
  salvarPredefinicaoReliquias,
  criarArmaUnica,
  reforcarArmaUnica,
  equiparArmaUnica,
} from './regiao1-reliquias-regras.js';
import {
  adicionarEssencia,
  adicionarFragmentoSonho,
  evoluirFormaPorFragmentos,
} from './regiao1-regras-sonho.js';
import { validateSave, MAX_SAVE_BYTES } from '../../../api/_lib/confusion-save-lib.js';

test('Save antigo preserva tudo, inicializa os 8 blocos novos e rejeita dados malformados na whitelist', () => {
  const legado = criarEstadoInicial();
  legado.recompensas = { gold: 1234, diamantes: 567, xp: 890 };
  legado.bossesDerrotados = { BOSS_E: true, BOSS_D: true };
  legado.idle = {
    jogador: { xp: 890, hp: 100, sanidade: 95, capturasTotais: 4, atributos: { for: 2, vit: 1, men: 0, vin: 3, sor: 0 } },
    equipe: [
      { uid: 'ini0', especie: 'Noctarn', nivel: 15, xp: 1200, tier: 4, estrelas: 4 },
      { uid: 'u_ban', especie: 'Noctarn', nivel: 10, xp: 400, tier: 4, star: 2, origem: 'banner', fonteBanner: 'sombra' },
    ],
    formacao: ['ini0', 'u_ban', null, null],
    mochila: {
      esferas: { comum: 3 },
      reliquiasPossuidas: ['rel_lamina_sombra'],
      ovos: [{ especie: 'Ignavor', forma: 'natural' }],
    },
    montaria: null,
    // Simula lixo injetado em campos novos
    energia: ['lixo'],
    torres: 'invalido',
  };

  const carregado = desserializarEstado(serializarEstado(legado));
  assert.equal(carregado.idle.energia, undefined);
  assert.equal(carregado.idle.torres, undefined);

  const idle = garantirEstadoIdle(carregado, 100_000_000);
  // Campos legados preservados
  assert.equal(carregado.recompensas.gold, 1234);
  assert.equal(idle.equipe[0].especie, 'Penumbrio');
  assert.equal(idle.equipe[1].especie, 'Noctarn');
  assert.equal(idle.mochila.esferas.comum, 3);
  assert.equal(idle.montaria, null);

  // Todos os blocos novos presentes na lista branca e prontos
  for (const bloco of ['campanhaMini', 'missoes', 'energia', 'torres', 'calaboucos', 'reliquias', 'armasUnicas', 'essencias']) {
    assert.ok(idle[bloco] && typeof idle[bloco] === 'object', `Bloco ausente após migração: ${bloco}`);
  }
});

test('Save lotado (200 relíquias +15, 12 caps, 36 paralelas, torres, calabouços, armas únicas) passa em /api/confusion-save e mantém idempotência após reload', () => {
  const t0 = 86_400_000 * 200;
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, t0);
  s.recompensas = { gold: 5_000_000, diamantes: 10_000, xp: 50_000 };
  s.idle.equipe = [
    { uid: 'f100', especie: 'Brasinha', nivel: 100, xp: 200_000, tier: 4, estrelas: 6 },
    { uid: 'w100', especie: 'Gotalume', nivel: 100, xp: 200_000, tier: 4, estrelas: 6 },
  ];
  s.idle.formacao = ['f100', 'w100', null, null];
  s.idle.reliquias.poReforco = 100_000;

  // 1) Enche os 12 capítulos 3★ na Campanha Mini + recolhe fase 1-1 / baús
  const vitoria3 = { fim: 'vitoria', todosVivos: true, classes: { guerreiro: 1, tanque: 1, mago: 1, assassino: 1, suporte: 1 }, elementos: { planta: 2, fogo: 2, eletrico: 2, voador: 2, aco: 2, agua: 2, pedra: 2, luz: 2 }, supremasUsadas: 2 };
  for (let c = 1; c <= 12; c++) {
    for (let f = 1; f <= 10; f++) {
      s.idle.campanhaMini.fases[`${c}-${f}`] = { vencida: true, estrelas: 3, concluidas: 1 };
    }
    s.idle.campanhaMini.capitulosConcluidos[c] = true;
    s.idle.campanhaMini.primeiraVitoriaPagas[`${c}-10`] = true;
  }
  const rCap = concluirFaseCampanhaMini(s, '1-1', vitoria3, { batalhaId: 'save_cm_1', agoraMs: t0 });
  assert.equal(rCap.ok, true);
  assert.equal(coletarBauFase(s, '1-1').ok, true);
  assert.equal(coletarBauCapitulo(s, 1, 10).ok, true);

  // 2) Missão paralela + Marco
  iniciarParalela(s, 'par_1_1');
  avancarEtapaParalela(s, 'par_1_1');
  avancarEtapaParalela(s, 'par_1_1', { fim: 'vitoria' });
  const fimPar = avancarEtapaParalela(s, 'par_1_1', { fim: 'vitoria' });
  assert.equal(fimPar.concluida, true);
  assert.equal(coletarMarco(s, 'marco_cap_1').ok, true);

  // 3) Torre Elemental + Torre Única + Calabouço
  assert.equal(concluirAndarTorreElemental(s, 'chama', 1, { venceu: true }, { batalhaId: 'save_te_1', agoraMs: t0 }).ok, true);
  assert.equal(concluirAndarTorreUnica(s, 'ascensao', 1, { venceu: true }, { batalhaId: 'save_tu_1', agoraMs: t0 }).ok, true);
  assert.equal(concluirCalaboucoNivel(s, 'forja-rubra', 1, { venceu: true, todosVivos: true }, { batalhaId: 'save_cal_1', agoraMs: t0 }).ok, true);

  // 4) Evolução 1→2 com Essências e operacaoId
  adicionarFragmentoSonho(s, 'fogo', 10);
  adicionarEssencia(s, 'fogo', 'menor', 20);
  adicionarEssencia(s, 'fogo', 'media', 5);
  assert.equal(evoluirFormaPorFragmentos(s, 0, { operacaoId: 'save_evo_1' }).ok, true);

  // 5) Arma única +5 + 200 relíquias (4 equipadas lendárias +15 + predefinição)
  s.idle.armasUnicas.fragmentos.ignavor = 50;
  assert.equal(criarArmaUnica(s, 'Ignavor').ok, true);
  for (let i = 0; i < 5; i++) assert.equal(reforcarArmaUnica(s, 'Ignavor').ok, true);
  assert.equal(equiparArmaUnica(s, 'f100').ok, true);

  for (const parte of ['coroa', 'amuleto', 'anel', 'talisma']) {
    const rel = concederReliquia(s, { parte, elemento: 'fogo', raridade: 'lendaria', conjunto: 'furia' }).reliquia;
    for (let i = 0; i < 15; i++) reforcarReliquia(s, rel.id);
    assert.equal(equiparReliquia(s, 'f100', rel.id).ok, true);
  }
  salvarPredefinicaoReliquias(s, 'f100', 'pve');

  while (s.idle.reliquias.bolsa.length < 200) {
    assert.equal(concederReliquia(s, { parte: 'anel', elemento: 'agua', raridade: 'lendaria', conjunto: 'impeto' }).ok, true);
  }

  // Serializa, recarrega pela whitelist e valida payload da nuvem (/api/confusion-save)
  const json = serializarEstado(s);
  const bytes = Buffer.byteLength(json);
  assert.ok(bytes < MAX_SAVE_BYTES / 2, `Save grande demais (${bytes} bytes)`);

  const rec = desserializarEstado(json);
  garantirEstadoIdle(rec, t0 + 600_000);
  const nuvem = validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta });
  assert.equal(nuvem.ok, true, `Falha em validateSave: ${nuvem.error}`);

  // Preservação pós-reload
  assert.equal(rec.idle.reliquias.bolsa.length, 200);
  assert.equal(rec.idle.reliquias.equipadas.f100.anel.startsWith('rel_'), true);
  assert.equal(rec.idle.reliquias.predefinicoes.f100.pve.coroa, rec.idle.reliquias.equipadas.f100.coroa);
  assert.equal(rec.idle.armasUnicas.possuidas.ignavor.reforco, 5);
  assert.equal(rec.idle.missoes.paralelasConcluidas.par_1_1, true);
  assert.equal(rec.idle.torres.elementais.chama.maiorAndar, 1);
  assert.equal(rec.idle.calaboucos.todosVivos['forja-rubra:1'], true);
  assert.ok(energiaDe(rec, t0 + 600_000).atual >= 0);

  // Idempotência estrita após recarregar
  assert.equal(concluirFaseCampanhaMini(rec, '1-1', vitoria3, { batalhaId: 'save_cm_1' }).jaPago, true);
  assert.equal(coletarBauFase(rec, '1-1').ok, false);
  assert.equal(coletarBauCapitulo(rec, 1, 10).ok, false);
  assert.equal(avancarEtapaParalela(rec, 'par_1_1', { fim: 'vitoria' }).jaConcluida, true);
  assert.equal(coletarMarco(rec, 'marco_cap_1').jaColetado, true);
  assert.equal(concluirAndarTorreElemental(rec, 'chama', 1, { venceu: true }, { batalhaId: 'save_te_1' }).jaPago, true);
  assert.equal(concluirAndarTorreUnica(rec, 'ascensao', 1, { venceu: true }, { agoraMs: t0 + 600_000, batalhaId: 'tu_retry' }).limiteDiario, true);
  assert.equal(concluirCalaboucoNivel(rec, 'forja-rubra', 1, { venceu: true }, { batalhaId: 'save_cal_1' }).jaPago, true);
  assert.equal(evoluirFormaPorFragmentos(rec, 0, { operacaoId: 'save_evo_1' }).jaAplicado, true);
});
