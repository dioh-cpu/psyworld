import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSE_CFG,
  premioNivel,
  premioNivelPremium,
  comprarPassePremium,
  ganharXpPasse,
  resgatarPasse,
  infoPasse,
  trilhaPasse,
} from './regiao1-passe-regras.js';
import {
  CATALOGO_DINOSSAUROS,
  DINOSSAUROS_ELEMENTOS_COBERTOS,
  ELEMENTOS_EXPANSAO_DINOSSAUROS,
} from './regiao1-dinossauros-dados.js';
import {
  MOLDURAS_PERFIL_CATALOGO,
  ICONES_PERFIL_CATALOGO,
  equiparMolduraPerfil,
  equiparIconePerfil,
  desbloquearMolduraPerfil,
  desbloquearIconePerfil,
  listarMoldurasPerfil,
  listarIconesPerfil,
  sincronizarDesbloqueiosPerfil,
} from './regiao1-perfil-regras.js';
import { criarEstadoInicial, serializarEstado, desserializarEstado } from './regiao1-estado.js';
import { garantirEstadoIdle } from './regiao1-idle.js';
import { validateSave } from '../../../api/_lib/confusion-save-lib.js';

const novoSave = () => {
  const s = criarEstadoInicial();
  garantirEstadoIdle(s, Date.UTC(2026, 11, 29, 12, 0, 0));
  return s;
};

test('Passe Premium Dinossauros: 5.000💎, dobro de diamantes, 20+20+20 tickets, molduras/ícones, 2 ovos T5 e save/nuvem', () => {
  assert.equal(PASSE_CFG.precoPremium, 5000);
  const tema = PASSE_CFG.temas[0];
  let diamGratis = 0;
  let diamPremium = 0;
  let tkEvento = 0;
  let tkMensal = 0;
  let tkQuinzenal = 0;
  let ovosT5 = 0;
  let molduras = 0;
  let icones = 0;

  for (let n = 1; n <= 100; n++) {
    const g = premioNivel(n, tema);
    const p = premioNivelPremium(n, tema);
    if (g.tipo === 'diamantes') {
      diamGratis += g.qtd;
      assert.equal(p.tipo, 'diamantes');
      assert.equal(p.qtd, g.qtd * 2);
      diamPremium += p.qtd;
    }
    if (p.tipo === 'ticketsEvento') tkEvento += p.qtd;
    if (p.tipo === 'ticketsMensais') tkMensal += p.qtd;
    if (p.tipo === 'ticketsQuinzenais') tkQuinzenal += p.qtd;
    if (p.tipo === 'ovoT5Permanente' || p.tipo === 'ovoT5Temporada') ovosT5 += 1;
    if (p.tipo === 'molduraPerfil') molduras += 1;
    if (p.tipo === 'iconePerfil') icones += 1;
  }

  assert.equal(diamPremium, diamGratis * 2);
  assert.equal(tkEvento, 20);
  assert.equal(tkMensal, 20);
  assert.equal(tkQuinzenal, 20);
  assert.equal(ovosT5, 2);
  assert.equal(molduras, 4);
  assert.equal(icones, 4);

  // Compra e resgate completo no dia 29 de dezembro/2026 (cota completa liberada)
  const data = new Date(2026, 11, 29, 12, 0, 0);
  const s = novoSave();
  s.recompensas.diamantes = 4000;
  assert.equal(comprarPassePremium(s, data).ok, false);
  s.recompensas.diamantes = 5000;
  assert.equal(comprarPassePremium(s, data).ok, true);
  assert.equal(s.recompensas.diamantes, 0);
  assert.equal(comprarPassePremium(s, data).jaAtivo, true);

  ganharXpPasse(s, 'manual', 100_000, data);
  const res = resgatarPasse(s, data);
  assert.equal(res.nivel, 100);
  assert.equal(res.pagosPremium.length, 100);
  assert.equal(s.idle.exp.ticketsEvento, 20);
  assert.equal(s.idle.exp.ticketsMensais, 20);
  assert.equal(s.idle.exp.ticketsQuinzenais, 20);

  const ovosPrem = s.idle.mochila.ovos.filter((o) => o.origem?.startsWith('passe-premium-'));
  assert.equal(ovosPrem.length, 2);
  assert.ok(ovosPrem.some((o) => o.subtipo === 'ovoT5Permanente' && o.elenco.includes('Ignaraz')));
  assert.ok(ovosPrem.some((o) => o.subtipo === 'ovoT5Temporada' && o.elenco.includes('Tiranox')));

  // Trilha dupla pronta para a UI + idempotência
  const trilha = trilhaPasse(s, data);
  assert.equal(trilha.length, 100);
  assert.equal(trilha[49].premioPremium.tipo, 'ovoT5Permanente');
  assert.equal(trilha[99].estadoPremium, 'coletado');
  assert.equal(infoPasse(s, data).premium, true);
  assert.equal(resgatarPasse(s, data).pagosPremium.length, 0);

  // Round-trip save e nuvem
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.passe.premium, true);
  assert.equal(rec.idle.passe.resgatadoPremium, 100);
  assert.equal(validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta }).ok, true);
});

test('Expansão Dinossauros: 50 Oníricos PT únicos, 18 elementos cobertos, 3 formas, kit de 3 habilidades e descrição de arte', () => {
  assert.equal(CATALOGO_DINOSSAUROS.length, 50);
  assert.equal(DINOSSAUROS_ELEMENTOS_COBERTOS.length, 18);
  for (const el of ELEMENTOS_EXPANSAO_DINOSSAUROS) {
    assert.ok(DINOSSAUROS_ELEMENTOS_COBERTOS.includes(el), `Elemento ausente na expansão Dinossauros: ${el}`);
  }
  const ids = new Set();
  const nomes = new Set();
  for (const d of CATALOGO_DINOSSAUROS) {
    assert.ok(!ids.has(d.id), `ID duplicado: ${d.id}`);
    assert.ok(!nomes.has(d.nome), `Nome duplicado: ${d.nome}`);
    ids.add(d.id);
    nomes.add(d.nome);
    assert.equal(d.formas.length, 3);
    assert.equal(d.kit.length, 3);
    assert.ok(d.descricaoArte && d.descricaoArte.length >= 20);
  }
});

test('Molduras e ícones de perfil: 8 molduras do #156, desbloqueio por Passe/conquista/evento, equipar e save', () => {
  assert.equal(MOLDURAS_PERFIL_CATALOGO.length, 8);
  assert.ok(ICONES_PERFIL_CATALOGO.length >= 7);

  const s = novoSave();
  // Farol vem liberada; Vulcão Adormecido e ícone de evento começam bloqueados
  assert.equal(equiparMolduraPerfil(s, 'farol').ok, true);
  assert.equal(equiparMolduraPerfil(s, 'vulcao-adormecido').bloqueada, true);
  assert.equal(equiparIconePerfil(s, 'icone-halloween').bloqueado, true);

  // Desbloqueio via coleção (Ignaraz) e Passe Premium Dinossauros
  s.idle.equipe.push({ uid: 'ig1', especie: 'Ignaraz', nivel: 40, tier: 5 });
  sincronizarDesbloqueiosPerfil(s);
  assert.equal(equiparMolduraPerfil(s, 'ignaraz').ok, true);

  assert.equal(desbloquearMolduraPerfil(s, 'ambar-fossil').ok, true);
  assert.equal(desbloquearIconePerfil(s, 'icone-tiranox').ok, true);
  assert.equal(equiparMolduraPerfil(s, 'ambar-fossil').ok, true);
  assert.equal(equiparIconePerfil(s, 'icone-tiranox').ok, true);

  assert.ok(listarMoldurasPerfil(s).find((m) => m.id === 'ambar-fossil').equipada);
  assert.ok(listarIconesPerfil(s).find((i) => i.id === 'icone-tiranox').equipado);

  // Save/nuvem preserva moldura, ícone e listas desbloqueadas
  const rec = desserializarEstado(serializarEstado(s));
  assert.equal(rec.idle.jogador.perfil.moldura, 'ambar-fossil');
  assert.equal(rec.idle.jogador.perfil.icone, 'icone-tiranox');
  assert.ok(rec.idle.jogador.perfil.desbloqueadas.includes('ignaraz'));
  assert.ok(rec.idle.jogador.perfil.iconesDesbloqueados.includes('icone-tiranox'));
  assert.equal(validateSave({ game: 'confusion-waves', regiao1: JSON.parse(serializarEstado(rec)), conta: rec.conta }).ok, true);
});
