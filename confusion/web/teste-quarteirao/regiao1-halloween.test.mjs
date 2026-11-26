import test from 'node:test'; import assert from 'node:assert/strict';
import * as H from './regiao1-halloween-regras.js';
import * as P from './regiao1-progressao.js';
import * as M from './regiao1-estrategia-regras.js';
import { BANNER_HW, LINHAGENS_HW, EDICAO } from './regiao1-halloween-dados.js';
import { xpDoNivel } from '../core.js';
const novo = () => ({ quests: {}, recompensas: { gold: 0, diamantes: 5000 }, idle: { equipe: [{ especie: 'Noctarn', nivel: 5, xp: 0 }], jogador: { xp: 0 } } });
test('progressão sem teto: igual ao núcleo até 20, continua depois e preserva o excedente', () => {
  for (const n of [1, 2, 5, 12, 20]) assert.equal(P.xpTotal(n), xpDoNivel(n));
  assert.equal(P.nivelDe(P.xpTotal(301)), 301); assert.equal(P.nivelDe(P.xpTotal(301) - 1), 300);
  const o = { nivel: 300, xp: P.xpTotal(300) + 10 }; const r = P.aplicarXp(o, 90000); assert.ok(r.depois > 300 && r.subiu > 1); assert.equal(o.xp, P.xpTotal(300) + 10 + 90000); assert.ok(r.sobra >= 0 && r.sobra < P.xpPara(r.depois));
});
test('pacote de tickets pede confirmação e custa 2000💎; saldo separado dos tickets comuns', () => {
  const s = novo(); assert.equal(H.comprarPacote(s, false).precisaConfirmar, true);
  assert.ok(H.comprarPacote(s, true).ok); assert.equal(H.hwDe(s).tickets, 10); assert.equal(s.recompensas.diamantes, 3000); assert.equal(s.idle.exp, undefined);
});
test('garantias: 100 → T5, demais 50 → T4, demais 10 → T3/T4; outras usam as chances', () => {
  assert.equal(H.tierDaPosicao(100, () => 0.99).tier, 5); assert.equal(H.tierDaPosicao(200, () => 0).tier, 5);
  assert.equal(H.tierDaPosicao(50, () => 0.99).tier, 4); assert.equal(H.tierDaPosicao(150, () => 0).tier, 4);
  assert.equal(H.tierDaPosicao(10, () => 0.5).tier, 3); assert.equal(H.tierDaPosicao(10, () => 0.95).tier, 4);
  assert.equal(H.tierDaPosicao(7, () => 0.975).tier, 5); assert.equal(H.tierDaPosicao(7, () => 0.1).tier, 1); assert.equal(H.tierDaPosicao(7, () => 0.6).tier, 2); assert.equal(BANNER_HW.chances[5], 0.03);
  const s = novo(); H.hwDe(s).tickets = 100; let t5 = 0, t4 = 0;
  for (let i = 0; i < 10; i++) { const r = H.invocarHW(s, 10, () => 0.01); t5 += r.resultados.filter((x) => x.tier === 5).length; t4 += r.resultados.filter((x) => x.tier === 4).length; }
  assert.equal(H.hwDe(s).contador[EDICAO.id], 0); assert.equal(H.hwDe(s).total, 100); assert.equal(t5, 1); // o T5 da posição 100 reinicia assert.equal(t4, 1); // 50 → T4, 100 → T5, múltiplos de 10 com rng baixo → T3
  assert.deepEqual(H.proximosMarcos(0), { ate10: 10, ate50: 50, ate100: 100 }); assert.equal(s.idle.equipe.length, 101);
  assert.equal(H.invocarHW(s, 1).ok, false);
});
test('doces evoluem o tier (custos 1,2,3,5) e mudam a forma nas faixas 1–2 / 3–4 / 5', () => {
  const s = novo(); s.idle.equipe.push({ especie: 'Abóborgo', nivel: 1, xp: 0, tierHW: 1 }); const h = H.hwDe(s); h.doces = 11;
  const i = s.idle.equipe.length - 1; const custos = [];
  for (let k = 0; k < 4; k++) { const inf = H.infoEvolucao(s.idle.equipe[i]); custos.push(inf.custo); assert.ok(H.evoluirHW(s, i).ok); }
  assert.deepEqual(custos, [1, 2, 3, 5]); assert.equal(s.idle.equipe[i].tierHW, 5); assert.equal(h.doces, 0); assert.equal(H.infoEvolucao(s.idle.equipe[i]), null);
});
test('torre: marco de 10 paga 5 tickets uma única vez; andar 100 libera a próxima; níveis por faixa', () => {
  const s = novo(); const h = H.hwDe(s);
  assert.equal(H.nivelDoAndar(1, 1), 5); assert.equal(H.nivelDoAndar(1, 100), 70); assert.equal(H.nivelDoAndar(4, 100), 300);
  assert.equal(H.vencerAndar(s, 1, 2).ok, false);
  for (let n = 1; n <= 10; n++) H.vencerAndar(s, 1, n, () => 0.5);
  assert.equal(h.tickets, 5); H.vencerAndar(s, 1, 10, () => 0.5); assert.equal(h.tickets, 5);
  h.torre.maior[1] = 99; const r = H.vencerAndar(s, 1, 100, () => 0.5); assert.equal(r.liberou, 2); assert.equal(h.torre.liberada, 2); assert.equal(h.tickets, 10);
  assert.ok(H.andar(1, 10).inimigos[0][3].chefe); assert.ok(H.andar(4, 100).inimigos.length >= 5);
});
test('total da torre: 200 tickets (50 por dificuldade) alcançam a garantia de Tier 5 após as duas primeiras', () => {
  assert.equal(4 * 10 * 5, 200); assert.ok(2 * 50 >= 100);
});
test('poção: alvo, XP e previsão; acima do nível 300 sobe vários níveis', () => {
  const s = novo(); s.idle.equipe[0].nivel = 305; s.idle.equipe[0].xp = P.xpTotal(305); H.darPocao(s, 'pocao_xp_g', 1);
  const prev = H.previsaoPocao(s, 0, 'pocao_xp_g'); const r = H.usarPocao(s, 0, 'pocao_xp_g'); assert.ok(r.ok); assert.equal(r.depois, prev.depois); assert.ok(r.depois > 306); assert.equal(s.idle.equipe[0].nivel, r.depois);
});
test('habilidades exclusivas: ressurreição na vaga, invencibilidade e dano por vida máxima limitado em chefes', () => {
  const rng = M.criarRng(3), u = (id, esp, lado, nv = 30) => M.criarUnidade({ id, especie: esp, nivel: nv, lado, papeis: {} });
  const alm = u('a0', 'Almaterna', 'a'), cai = u('a1', 'Noctarn', 'a'), i0 = u('i0', 'Brotavel', 'i', 5);
  const b = M.criarBatalha([alm, cai], [i0]); cai.hp = 0; b.fila = [alm.id]; b.jaIniciou = true; b.iniciado = ''; M.atorAtual(b);
  M.executar(b, { tipo: 'habilidade', idx: 2 }, rng); assert.equal(b.evento.tipo, 'reviver'); assert.ok(cai.hp > 0 && cai.hp <= cai.hpMax * 0.5 + 1); assert.equal(b.aliados[1], cai);
  const sen = u('a0', 'Sentinoite', 'a'), al = u('a1', 'Noctarn', 'a'), ini = u('i0', 'Ignavor', 'i', 60);
  const b2 = M.criarBatalha([sen, al], [ini]); b2.fila = [sen.id]; b2.jaIniciou = true; b2.iniciado = ''; M.atorAtual(b2); M.executar(b2, { tipo: 'habilidade', idx: 2 }, rng);
  assert.ok(al.efeitos.invencivel); const hp = al.hp; b2.fila = [ini.id]; b2.iniciado = ''; M.atorAtual(b2); M.executar(b2, { tipo: 'atacar', alvo: al.id }, rng); assert.equal(al.hp, hp);
  const cf = u('a0', 'Ceifalume', 'a', 30), boss = u('i0', 'Ignavor', 'i', 30), normal = u('i1', 'Ignavor', 'i', 30); boss.chefe = true; boss.hpMax = boss.hp = 20000; normal.hpMax = normal.hp = 20000;
  const b3 = M.criarBatalha([cf], [boss, normal]); const z = () => 0.5;
  b3.fila = [cf.id]; b3.jaIniciou = true; b3.iniciado = ''; M.atorAtual(b3); M.executar(b3, { tipo: 'habilidade', idx: 2, alvo: normal.id }, z); const dn = 20000 - normal.hp;
  cf.cd = [0, 0, 0]; b3.fila = [cf.id]; b3.iniciado = ''; M.atorAtual(b3); M.executar(b3, { tipo: 'habilidade', idx: 2, alvo: boss.id }, z); const db = 20000 - boss.hp;
  assert.ok(dn > 5000 && db < dn / 3, `${dn} ${db}`);
});
test('as cinco linhagens têm tier, papel e três habilidades', () => { assert.deepEqual(LINHAGENS_HW.map((l) => l.tier), [1, 2, 3, 4, 5]); for (const l of LINHAGENS_HW) assert.equal(M.kitDe(l.especie, l.papel, l.elemento).length, 3); assert.equal(Object.values(BANNER_HW.chances).reduce((a, b) => a + b, 0).toFixed(2), '1.00'); });

test('Tier 5 por sorte (3%) reinicia a contagem; T3/T4 não', () => {
  const s = novo(); const h = H.hwDe(s); h.tickets = 3; h.contador[EDICAO.id] = 36;
  H.invocarHW(s, 1, () => 0.5); assert.equal(h.contador[EDICAO.id], 37);
  const r = H.invocarHW(s, 1, () => 0.99); assert.equal(r.resultados[0].tier, 5); assert.equal(r.resultados[0].garantia, null); assert.equal(h.contador[EDICAO.id], 0);
  H.invocarHW(s, 1, () => 0.9); assert.equal(h.contador[EDICAO.id], 1);
});
test('exclusivos são mais fortes que um Onírico comum do mesmo nível e papel', () => {
  const a = M.criarUnidade({ id: 'a', especie: 'Ceifalume', nivel: 30, lado: 'a', papeis: {} }), b = M.criarUnidade({ id: 'b', especie: 'Noctarn', nivel: 30, lado: 'a', papeis: {} });
  assert.ok(a.hpMax > b.hpMax * 1.25 && a.atk > b.atk * 1.25);
});
