// Combate por turnos (v1.37). Código puro, sem DOM. O sorteio vem de `rnd`, então os testes são determinísticos.
// Cada turno: o jogador age (atacar, habilidade ou poção) e depois o inimigo age.
// Sem empate: no limite de turnos vence quem tem mais % de vida; empate vai para o inimigo.
import { multElemento } from './core.js';

export const COMBATE = {
  hpMax: 60,                // vida de cada lado
  turnosMax: 30,            // limite de turnos
  variacao: 0.6,            // dano varia ±60%: a luta fica gradual, não em degrau
  erro: 0.3,                // 30% de chance de errar (calibrado: 50% de vitória com a força do inimigo x0,5)
  critico: 0.2,             // 20% de chance de crítico (x1,5)
  habilidadeMult: 1.4,      // habilidade vale 1,4x o ataque comum
  chanceHabilidadeInimigo: 0.3,
  escalaDano: 0.1,          // dano base = poder x 0,1, antes do elemento
  escalaInimigo: 0.5,       // poder do inimigo é multiplicado por isto (calibração com a tabela antiga)
};

export const poderInimigo = (poder) => poder * COMBATE.escalaInimigo;

export const POCOES = {
  pequena: { nome: 'Poção pequena', cura: 0.3, preco: 20 },
  media: { nome: 'Poção média', cura: 0.6, preco: 60 },
  grande: { nome: 'Poção grande', cura: 1, preco: 180 },
};

// vampirismo: passiva que cura, em vez de receber dano, quando o golpe é do próprio elemento do lutador.
export const criarLutador = ({ nome, poder, elemento, habilidades = [], vampirismo = false }) => ({
  nome, poder, elemento, vampirismo,
  hpMax: COMBATE.hpMax,
  hp: COMBATE.hpMax,
  habilidades: habilidades.map((h) => ({ nome: h, ultimoTurno: -99 })),
});

// jog e ini são lutadores. pocoes é a contagem de poções do jogador (é consumida durante a luta).
export const criarCombate = (jog, ini, pocoes) => ({
  turno: 1, jog, ini, pocoes: { ...pocoes }, log: [], fim: false, resultado: null, acoes: 0,
});

// Uma habilidade só pode ser usada se não foi usada no turno anterior (recarga de 1 turno).
export const habilidadePronta = (lutador, nome, turno) => {
  const h = lutador.habilidades.find((x) => x.nome === nome);
  return Boolean(h) && h.ultimoTurno < turno - 1;
};

// Rótulo da tipagem para o log: sem efeito (0), super efetivo (acima de 1), pouco efetivo (abaixo de 1). Neutro não tem rótulo.
export const rotuloEficacia = (m) => (m === 0 ? 'sem efeito' : m > 1 ? 'super efetivo!' : m < 1 ? 'pouco efetivo' : null);

export function golpe(a, d, mult, rnd) {
  if (rnd() < COMBATE.erro) return { errou: true, dano: 0, critico: false, eficacia: 1 };
  const critico = rnd() < COMBATE.critico;
  const variacao = 1 + COMBATE.variacao * (2 * rnd() - 1);
  const eficacia = multElemento(a.elemento, d.elemento);
  const base = a.poder * COMBATE.escalaDano * eficacia * mult * variacao;
  const dano = eficacia === 0 ? 0 : Math.max(1, Math.round(base * (critico ? 1.5 : 1)));
  return { errou: false, dano, critico, eficacia, elemento: a.elemento };
}

function aplicar(e, alvo, r, texto) {
  if (r.errou) { e.log.push(`${texto}, mas errou.`); return; }
  if (r.dano === 0) { e.log.push(`${texto}, sem efeito.`); return; }
  const marcas = [r.critico ? 'crítico!' : null, rotuloEficacia(r.eficacia)].filter(Boolean);
  const sufixo = marcas.length ? ` (${marcas.join(', ')})` : '';
  if (alvo.vampirismo && r.elemento === alvo.elemento) {
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + r.dano);
    e.log.push(`${texto}: ${r.dano} de dano${sufixo}, absorvido por ${alvo.nome} (vampirismo elemental: curou ${alvo.hp - antes}).`);
    return;
  }
  alvo.hp = Math.max(0, alvo.hp - r.dano);
  e.log.push(`${texto}: ${r.dano} de dano${sufixo}.`);
}

function fechar(e, resultado) {
  e.fim = true;
  e.resultado = resultado;
  e.log.push(resultado === 'vitoria' ? `${e.jog.nome} venceu.` : `${e.ini.nome} venceu.`);
}

// Ação do jogador. Depois, se a luta não acabou, age o inimigo. Devolve o próprio estado (muda no lugar).
export function agir(e, acao, rnd = Math.random) {
  if (e.fim) return e;
  const j = e.jog;
  const i = e.ini;
  if (acao.tipo === 'pocao') {
    if ((e.pocoes[acao.pocao] || 0) <= 0) throw new Error('sem essa poção');
    e.pocoes[acao.pocao] -= 1;
    const antes = j.hp;
    j.hp = Math.min(j.hpMax, j.hp + Math.round(j.hpMax * POCOES[acao.pocao].cura));
    e.log.push(`${j.nome} usou ${POCOES[acao.pocao].nome} (+${j.hp - antes} de vida).`);
  } else if (acao.tipo === 'habilidade') {
    if (!habilidadePronta(j, acao.nome, e.turno)) throw new Error('habilidade indisponível neste turno');
    j.habilidades.find((x) => x.nome === acao.nome).ultimoTurno = e.turno;
    aplicar(e, i, golpe(j, i, COMBATE.habilidadeMult, rnd), `${j.nome} usou ${acao.nome}`);
  } else {
    aplicar(e, i, golpe(j, i, 1, rnd), `${j.nome} atacou`);
  }
  e.acoes += 1;
  if (i.hp <= 0) { fechar(e, 'vitoria'); return e; }

  // Turno do inimigo: usa habilidade com chance, se houver alguma pronta; senão ataca.
  const prontas = i.habilidades.filter((h) => h.ultimoTurno < e.turno - 1);
  if (prontas.length && rnd() < COMBATE.chanceHabilidadeInimigo) {
    const h = prontas[Math.floor(rnd() * prontas.length)];
    h.ultimoTurno = e.turno;
    aplicar(e, j, golpe(i, j, COMBATE.habilidadeMult, rnd), `${i.nome} usou ${h.nome}`);
  } else {
    aplicar(e, j, golpe(i, j, 1, rnd), `${i.nome} atacou`);
  }
  if (j.hp <= 0) { fechar(e, 'derrota'); return e; }

  e.turno += 1;
  if (e.turno > COMBATE.turnosMax) {
    const pj = j.hp / j.hpMax;
    const pi = i.hp / i.hpMax;
    e.log.push(`Tempo esgotado: ${j.nome} ${Math.round(pj * 100)}% x ${Math.round(pi * 100)}%.`);
    fechar(e, pj > pi ? 'vitoria' : 'derrota');
    return e;
  }
  return e;
}

// Política automática: poção se a vida cair do limiar (na ordem marcada); senão a primeira habilidade pronta da lista; senão ataca.
export function escolherAuto(e, prefs) {
  const j = e.jog;
  if (j.hp / j.hpMax <= prefs.limiarPocao) {
    const p = (prefs.pocoes || []).find((k) => (e.pocoes[k] || 0) > 0);
    if (p) return { tipo: 'pocao', pocao: p };
  }
  const h = (prefs.habilidades || []).find((n) => habilidadePronta(j, n, e.turno));
  if (h) return { tipo: 'habilidade', nome: h };
  return { tipo: 'atacar' };
}

// Esfera automática: a primeira da lista de prioridade que ainda tem na mão. Sem nenhuma, devolve null.
export const escolherEsfera = (esferas, prioridade) => (prioridade || []).find((k) => (esferas[k] || 0) > 0) ?? null;
