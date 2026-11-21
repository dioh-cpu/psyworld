// Sistemas 01 a 10 do catálogo: cidades, ecossistema, facções, NPCs, refúgios, personalidade,
// clima, masmorras, investigação e economia. Cada sistema: criar(), dia(est, ctx), acoes, resumo(est).
import { clamp, escolha, hash } from './util.js';
import { ESPECIES_BASE } from '../species.js';

// 01 — Cidades vivas. Referência: Stardew Valley (o centro comunitário é restaurado) e Animal Crossing (a cidade reage ao jogador).
const VILAS = [
  { id: 'norte', nome: 'Vila do Norte' },
  { id: 'sul', nome: 'Vila do Sul' },
  { id: 'porto', nome: 'Porto Cinza', depende: 'ponte' },
];
export const servicosAtivos = (est, id) => est[id].prosperidade >= 40 && est[id].corrupcao < 70;
const cidadesVivas = {
  id: '01', nome: 'Cidades vivas', referencia: 'Stardew Valley (restauração do centro comunitário); Animal Crossing (a cidade reage ao jogador)',
  criar: () => Object.fromEntries(VILAS.map((v) => [v.id, { nome: v.nome, prosperidade: 60, corrupcao: 0 }])),
  dia(est, ctx) {
    const notas = [];
    for (const v of VILAS) {
      const c = est[v.id];
      const sofre = v.depende === 'ponte' && ctx.ponteFechada;
      c.prosperidade = clamp(c.prosperidade + (sofre ? -3 : 1) - Math.floor(c.corrupcao / 25), 0, 100);
      // Corrupção sobe com sanidade muito baixa (abaixo de 30) e recua 1 por dia quando a sanidade está razoável: a vila pode se recuperar.
      c.corrupcao = clamp(c.corrupcao + (ctx.sanidade < 30 ? 2 : -1) + (ctx.r() < 0.1 ? 1 : 0), 0, 100);
      if (c.corrupcao >= 70 && ctx.r() < 0.3) notas.push(`${c.nome} está corrompida: os serviços param.`);
    }
    return { notas };
  },
  acoes: {
    reconstruir: {
      rotulo: 'Reconstruir a vila mais arruinada (30 madeira e 30 pedra)',
      fn(est, ctx) {
        const id = VILAS.map((v) => v.id).sort((a, b) => est[a].prosperidade - est[b].prosperidade)[0];
        if ((ctx.recursos.madeira || 0) < 30 || (ctx.recursos.pedra || 0) < 30) return { notas: ['Faltam 30 madeira e 30 pedra.'] };
        est[id].prosperidade = clamp(est[id].prosperidade + 30, 0, 100);
        est[id].corrupcao = Math.max(0, est[id].corrupcao - 20);
        return { notas: [`${est[id].nome} foi reconstruída.`], efeitos: { recursos: { madeira: -30, pedra: -30 } } };
      },
    },
  },
  resumo: (est) => VILAS.map((v) => `${est[v.id].nome}: prosperidade ${est[v.id].prosperidade}, corrupção ${est[v.id].corrupcao}`).join(' · '),
};

// 02 — Ecossistema de monstros. Referência: Monster Hunter (território, ninhos) e Pokémon Legends: Arceus (criaturas selvagens).
const ECOSSISTEMA_MAX = 20;
export const pesoEncontro = (est, especie) => {
  const total = Object.values(est.populacao).reduce((a, b) => a + b, 0);
  return total ? est.populacao[especie] / total : 0;
};
const ecossistema = {
  id: '02', nome: 'Ecossistema de monstros', referencia: 'Monster Hunter (território e ninhos); Pokémon Legends: Arceus (comportamento selvagem)',
  criar: () => ({ populacao: Object.fromEntries(ESPECIES_BASE.map((e) => [e, 12])), ninho: {} }),
  dia(est, ctx) {
    const notas = [];
    for (const e of ESPECIES_BASE) {
      const p = est.populacao[e];
      const protegido = (est.ninho[e] || 0) > 0;
      // Crescimento logístico: nascem mais quando há espaço; em populações pequenas nasce pelo menos 1.
      const taxa = protegido ? 0.25 : 0.15;
      const nascem = p > 0 ? Math.max(1, Math.round(p * taxa * (1 - p / ECOSSISTEMA_MAX))) : 0;
      const morrem = Math.round(p * 0.05) + (p > 4 && ctx.r() < 0.2 ? 1 : 0);
      let novo = p + nascem - morrem;
      if (novo <= 0 && ctx.r() < 0.05) { novo = 1; notas.push(`${e} voltou à região vindo de outro lugar.`); }
      est.populacao[e] = clamp(Math.min(novo, ECOSSISTEMA_MAX), 0, ECOSSISTEMA_MAX);
      if (protegido) est.ninho[e] -= 1;
    }
    return { notas };
  },
  acoes: {
    cacar: {
      rotulo: 'Caçar a espécie mais numerosa (rende 1 peça)',
      fn(est) {
        const e = ESPECIES_BASE.slice().sort((a, b) => est.populacao[b] - est.populacao[a])[0];
        if (est.populacao[e] <= 0) return { notas: ['Não há criaturas para caçar.'] };
        est.populacao[e] -= 1;
        return { notas: [`Você caçou um ${e}.`], efeitos: { recursos: { peca: 1 } } };
      },
    },
    proteger: {
      rotulo: 'Proteger o ninho da espécie mais ameaçada (5 madeira, dura 5 dias)',
      fn(est, ctx) {
        const e = ESPECIES_BASE.slice().sort((a, b) => est.populacao[a] - est.populacao[b])[0];
        if ((ctx.recursos.madeira || 0) < 5) return { notas: ['Faltam 5 madeira.'] };
        est.ninho[e] = 5;
        return { notas: [`Ninho de ${e} protegido por 5 dias.`], efeitos: { recursos: { madeira: -5 } } };
      },
    },
  },
  resumo: (est) => ESPECIES_BASE.map((e) => `${e} ${est.populacao[e]}`).join(' · '),
};

// 03 — Facções. Referência: The Witcher 3 (facções reagem às escolhas) e Red Dead Redemption 2 (honra e reputação).
const FACCOES = { guardioes: 'Guardiões da Luz', culto: 'Culto das Sombras', guilda: 'Guilda do Porto' };
const RIVAIS = { guardioes: 'culto', culto: 'guardioes' };
const faccoes = {
  id: '03', nome: 'Facções', referencia: 'The Witcher 3 (facções reagem às escolhas); Red Dead Redemption 2 (reputação e honra)',
  criar: () => Object.fromEntries(Object.keys(FACCOES).map((f) => [f, 0])),
  dia(est) {
    const notas = [];
    const efeitos = {};
    for (const f of Object.keys(FACCOES)) {
      if (est[f] > 0) est[f] -= 1;
      else if (est[f] < 0) est[f] += 1;
    }
    if (est.guilda >= 50) { efeitos.diamantes = 5; notas.push('A Guilda do Porto paga os aliados.'); }
    if (est.culto >= 30) { efeitos.sanidade = -2; notas.push('O Culto cobra a sua parte.'); }
    return { notas, efeitos };
  },
  acoes: Object.fromEntries(Object.entries(FACCOES).map(([f, nome]) => [`ajudar_${f}`, {
    rotulo: `Ajudar ${nome} (+15 de reputação; a rival perde 5)`,
    fn(est) {
      est[f] = clamp(est[f] + 15, -100, 100);
      const rival = RIVAIS[f];
      if (rival) est[rival] = clamp(est[rival] - 5, -100, 100);
      return { notas: [`Sua reputação com ${nome} subiu.`] };
    },
  }])),
  resumo: (est) => Object.entries(FACCOES).map(([f, nome]) => `${nome} ${est[f]}`).join(' · '),
};

// 04 — NPCs com memória e rotina. Referência: Stardew Valley (horários) e Persona 5 (vínculos com personagens).
const FASES = ['manha', 'tarde', 'noite'];
export const faseDo = (dia) => FASES[(dia - 1) % 3];
export const NPCS = [
  { id: 'ana', nome: 'Ana, ferreira', disponivel: ['manha', 'tarde'], recompensa: { pedra: 1 } },
  { id: 'teo', nome: 'Teo, curandeiro', disponivel: ['noite'], recompensa: { raizes: 1 } },
  { id: 'lia', nome: 'Lia, cartógrafa', disponivel: ['tarde'], recompensa: { madeira: 1 } },
];
const npcs = {
  id: '04', nome: 'NPCs com memória e rotina', referencia: 'Stardew Valley (horários e amizade); Persona 5 (vínculos que crescem com conversas)',
  criar: () => Object.fromEntries(NPCS.map((n) => [n.id, { confianca: 0, memorias: [], ultimo: 0 }])),
  dia(est, ctx) {
    const notas = [];
    const recursos = {};
    for (const n of NPCS) {
      const st = est[n.id];
      if (ctx.dia - st.ultimo > 3 && st.confianca > 0) st.confianca = clamp(st.confianca - 1, 0, 100);
      if (st.confianca >= 50) for (const [k, v] of Object.entries(n.recompensa)) recursos[k] = (recursos[k] || 0) + v;
    }
    return { notas, efeitos: Object.keys(recursos).length ? { recursos } : {} };
  },
  acoes: Object.fromEntries(NPCS.map((n) => [`conversar_${n.id}`, {
    rotulo: `Conversar com ${n.nome} (só ${n.disponivel.join(' ou ')})`,
    fn(est, ctx) {
      const fase = faseDo(ctx.dia);
      if (!n.disponivel.includes(fase)) return { notas: [`${n.nome} não está disponível de ${fase}.`] };
      const st = est[n.id];
      st.confianca = clamp(st.confianca + 6, 0, 100);
      st.memorias = [...st.memorias, `dia ${ctx.dia}: conversa`].slice(-5);
      st.ultimo = ctx.dia;
      return { notas: [`${n.nome} lembrou da conversa (confiança ${st.confianca}).`] };
    },
  }])),
  resumo: (est) => NPCS.map((n) => `${n.nome} ${est[n.id].confianca}`).join(' · '),
};

// 05 — Refúgios e fortalezas. Referência: Frostpunk (abrigos que sustentam a população) e Don't Starve (abrigo na noite).
const REFUGIO_MAX = 3;
export const protecaoContraPragas = (est) => Math.min(0.6, est.refugios.length * 0.2);
const refugios = {
  id: '05', nome: 'Refúgios e fortalezas', referencia: 'Frostpunk (abrigos sustentam a população); Don\'t Starve (abrigo contra a noite)',
  criar: () => ({ refugios: [] }),
  dia(est, ctx) {
    const notas = [];
    let sanidade = 0;
    for (const r of est.refugios) {
      r.abrigados = clamp(r.abrigados + (ctx.r() < 0.5 ? 1 : 0), 0, 5);
      if (r.abrigados > 0) sanidade += 1;
    }
    // Descanso básico: sem refúgio, a sanidade ainda se recupera devagar até 60 (senão a sanidade baixa virava armadilha).
    if (ctx.sanidade < 60) sanidade += 1;
    return { notas, efeitos: sanidade ? { sanidade: Math.min(3, sanidade) } : {} };
  },
  acoes: {
    construir: {
      rotulo: `Construir um refúgio (20 madeira e 10 pedra; até ${REFUGIO_MAX})`,
      fn(est, ctx) {
        if (est.refugios.length >= REFUGIO_MAX) return { notas: ['Já há refúgios demais.'] };
        if ((ctx.recursos.madeira || 0) < 20 || (ctx.recursos.pedra || 0) < 10) return { notas: ['Faltam 20 madeira e 10 pedra.'] };
        est.refugios.push({ nome: `Refúgio ${est.refugios.length + 1}`, abrigados: 0 });
        return { notas: ['Um refúgio foi erguido.'], efeitos: { recursos: { madeira: -20, pedra: -10 } } };
      },
    },
  },
  resumo: (est) => `${est.refugios.length} refúgio(s) · proteção contra pragas ${Math.round(protecaoContraPragas(est) * 100)}%`,
};

// 06 — Personalidade e vínculo dos monstros. Referência: Pokémon (amizade) e Palworld (trabalho depende do jeito do monstro).
export const TEMPERAMENTOS = ['corajoso', 'calmo', 'curioso', 'teimoso', 'gentil'];
export const temperamentoDe = (id) => TEMPERAMENTOS[hash(id) % TEMPERAMENTOS.length];
export const modificadorTrabalho = (temperamento) => (temperamento === 'teimoso' ? 0.9 : temperamento === 'curioso' ? 1.1 : 1);
const personalidade = {
  id: '06', nome: 'Personalidade e vínculo dos monstros', referencia: 'Pokémon (amizade cresce com cuidado); Palworld (o trabalho depende do jeito do monstro)',
  criar: () => ({ monstros: {} }),
  dia(est, ctx) {
    const notas = [];
    const efeitos = { diamantes: 0 };
    for (const m of ctx.monstros) {
      const st = est.monstros[m.id] || (est.monstros[m.id] = { vinculo: 0, treino: 0, cuidado: 0 });
      const t = temperamentoDe(m.id);
      if (t === 'calmo') st.vinculo = clamp(st.vinculo + 1, 0, 100);
      if (t === 'gentil' && ctx.dia % 2 === 0) st.vinculo = clamp(st.vinculo + 1, 0, 100);
      if (t === 'teimoso' && ctx.dia - st.cuidado > 3) st.vinculo = clamp(st.vinculo - 1, 0, 100);
      if (st.vinculo >= 60) {
        if (t === 'curioso') efeitos.diamantes += 2;
        if (t === 'corajoso') st.treino += 1;
        notas.push(`${m.species} mostra uma resposta própria (${t}).`);
      }
    }
    return { notas, efeitos: efeitos.diamantes ? { diamantes: efeitos.diamantes } : {} };
  },
  acoes: {
    cuidar: {
      rotulo: 'Cuidar do monstro com o vínculo mais baixo (+10 vínculo)',
      fn(est, ctx) {
        if (!ctx.monstros.length) return { notas: ['Você ainda não tem monstros.'] };
        const alvo = ctx.monstros.slice().sort((a, b) => (est.monstros[a.id]?.vinculo || 0) - (est.monstros[b.id]?.vinculo || 0))[0];
        const st = est.monstros[alvo.id] || (est.monstros[alvo.id] = { vinculo: 0, treino: 0, cuidado: 0 });
        st.vinculo = clamp(st.vinculo + 10, 0, 100);
        st.cuidado = ctx.dia;
        st.treino += 1;
        return { notas: [`${alvo.species} se sentiu cuidado (vínculo ${st.vinculo}).`] };
      },
    },
  },
  resumo: (est) => `${Object.keys(est.monstros).length} monstro(s) com vínculo registrado`,
};

// 07 — Clima, estações e fenômenos. Referência: Stardew Valley (estações) e Don't Starve (clima e noite).
export const ESTACOES = ['primavera', 'verao', 'outono', 'inverno'];
export const estacaoDo = (dia) => ESTACOES[Math.floor((dia - 1) / 7) % 4];
export const modificadorColheita = (clima) => ({ sol: 1.2, chuva: 1.1, vento: 1, neve: 0.7, tempestade: 0.6 }[clima] ?? 1);
const clima = {
  id: '07', nome: 'Clima, estações e fenômenos', referencia: 'Stardew Valley (estações); Don\'t Starve (clima que muda a rotina)',
  criar: () => ({ clima: 'sol', aurora: false, estacao: 'primavera' }),
  dia(est, ctx) {
    const notas = [];
    est.estacao = estacaoDo(ctx.dia);
    const r = ctx.r();
    const inverno = est.estacao === 'inverno';
    est.clima = r < 0.5 ? 'sol' : r < 0.8 ? (inverno ? 'neve' : 'chuva') : r < 0.95 ? 'vento' : 'tempestade';
    if (est.clima === 'tempestade') notas.push('Tempestade: rotas fechadas e colheita reduzida.');
    est.aurora = ctx.r() < 0.03;
    const efeitos = est.aurora ? { sanidade: 2 } : {};
    if (est.aurora) notas.push('Uma aurora cruza o céu: a sanidade se acalma.');
    return { notas, efeitos };
  },
  resumo: (est) => `${est.estacao} · clima ${est.clima}${est.aurora ? ' · aurora' : ''}`,
};

// 08 — Masmorras dinâmicas. Referência: Dark Souls (áreas que mudam com o progresso) e Hollow Knight (áreas com ameaças próprias).
const MASMORRAS = {
  catacumba: { nome: 'Catacumba Úmida', infestacao: 30, tesouro: { cristal: 1 } },
  mina: { nome: 'Mina Abandonada', infestacao: 10, tesouro: { pedra: 2 } },
  templo: { nome: 'Templo Caído', infestacao: 50, tesouro: { diamantes: 2 } },
};
export const dificuldadeMasmorra = (est, id) => (est[id].infestacao >= 70 ? 'alta' : est[id].infestacao >= 40 ? 'média' : 'baixa');
const masmorras = {
  id: '08', nome: 'Masmorras dinâmicas', referencia: 'Dark Souls (áreas que mudam com o progresso); Hollow Knight (áreas com ameaças próprias)',
  criar: () => Object.fromEntries(Object.entries(MASMORRAS).map(([k, m]) => [k, { infestacao: m.infestacao }])),
  dia(est, ctx) {
    const notas = [];
    const efeitos = { recursos: {} };
    for (const [id, m] of Object.entries(MASMORRAS)) {
      const st = est[id];
      st.infestacao = clamp(st.infestacao + 1 + (ctx.sanidade < 40 ? 1 : 0), 0, 100);
      if (st.infestacao < 30 && ctx.r() < 0.2) {
        for (const [k, v] of Object.entries(m.tesouro)) {
          if (k === 'diamantes') efeitos.diamantes = (efeitos.diamantes || 0) + v;
          else efeitos.recursos[k] = (efeitos.recursos[k] || 0) + v;
        }
        notas.push(`Tesouro encontrado em ${m.nome}.`);
      }
    }
    if (!Object.keys(efeitos.recursos).length) delete efeitos.recursos;
    return { notas, efeitos };
  },
  acoes: {
    purificar: {
      rotulo: 'Purificar a masmorra mais infestada (10 pedra, -25 infestação)',
      fn(est, ctx) {
        const id = Object.keys(MASMORRAS).sort((a, b) => est[b].infestacao - est[a].infestacao)[0];
        if ((ctx.recursos.pedra || 0) < 10) return { notas: ['Faltam 10 pedra.'] };
        est[id].infestacao = clamp(est[id].infestacao - 25, 0, 100);
        return { notas: [`${MASMORRAS[id].nome} foi purificada um pouco.`], efeitos: { recursos: { pedra: -10 } } };
      },
    },
  },
  resumo: (est) => Object.entries(MASMORRAS).map(([id, m]) => `${m.nome} ${dificuldadeMasmorra(est, id)} (${est[id].infestacao})`).join(' · '),
};

// 09 — Investigação e mistérios. Referência: Disco Elysium (percepção e pensamentos) e Ace Attorney (testemunhos e provas).
const CASO_PISTAS = ['Pegadas que levam ao rio', 'Testemunho: a costureira viu uma luz', 'Carta rasgada no beco'];
const investigacao = {
  id: '09', nome: 'Investigação e mistérios', referencia: 'Disco Elysium (percepção e pensamentos); Ace Attorney (testemunhos e provas)',
  criar: () => ({ caso: { nome: 'O desaparecimento na vila', encontradas: 0, resolvido: false, diasAberto: 0 } }),
  dia(est) {
    const notas = [];
    const efeitos = {};
    if (!est.caso.resolvido) {
      est.caso.diasAberto += 1;
      if (est.caso.diasAberto > 10 && est.caso.diasAberto % 5 === 0) {
        efeitos.sanidade = -1;
        notas.push('A dúvida sobre o caso pesa na cabeça.');
      }
    }
    return { notas, efeitos };
  },
  acoes: {
    investigar: {
      rotulo: 'Investigar o caso (chance maior com sanidade alta)',
      fn(est, ctx) {
        const c = est.caso;
        if (c.resolvido) return { notas: ['O caso já está resolvido.'] };
        const chance = ctx.sanidade >= 50 ? 0.7 : 0.35;
        if (ctx.r() >= chance) return { notas: ['Você não encontrou nada novo desta vez.'] };
        c.encontradas += 1;
        const notas = [`Pista encontrada: ${CASO_PISTAS[c.encontradas - 1]}.`];
        if (c.encontradas >= CASO_PISTAS.length) {
          c.resolvido = true;
          notas.push('O caso foi resolvido.');
          return { notas, efeitos: { diamantes: 10, sanidade: 3 } };
        }
        return { notas };
      },
    },
  },
  resumo: (est) => est.caso.resolvido ? 'Caso resolvido' : `Caso aberto: ${est.caso.encontradas}/${CASO_PISTAS.length} pistas`,
};

// 10 — Economia regional e rotas. Referência: Stardew Valley e Animal Crossing (preços que sobem e descem), Mount & Blade II (caravanas).
const BENS_BASE = { madeira: 10, pedra: 12, cristal: 40, comida: 8 };
const economia = {
  id: '10', nome: 'Economia regional e rotas', referencia: 'Stardew Valley (preços de mercado); Mount & Blade II (caravanas e rotas)',
  criar: () => ({ precos: { ...BENS_BASE }, caravanas: 0 }),
  dia(est, ctx) {
    const notas = [];
    for (const [bem, base] of Object.entries(BENS_BASE)) {
      const p = est.precos[bem] + (ctx.r() < 0.5 ? -1 : 1) + (ctx.ponteFechada ? 1 : 0);
      est.precos[bem] = clamp(p, Math.floor(base / 2), base * 2);
    }
    if (ctx.dia % 4 === 0 && !ctx.ponteFechada) {
      est.caravanas += 1;
      est.precos.madeira = Math.max(Math.floor(BENS_BASE.madeira / 2), est.precos.madeira - 1);
      notas.push('Uma caravana chegou: a madeira ficou mais barata hoje.');
    }
    return { notas };
  },
  acoes: {
    vender_madeira: {
      rotulo: 'Vender 5 madeira ao mercado',
      fn(est, ctx) {
        if ((ctx.recursos.madeira || 0) < 5) return { notas: ['Faltam 5 madeira.'] };
        const ganho = Math.floor((5 * est.precos.madeira) / 4);
        return { notas: [`Você vendeu 5 madeira por ${ganho} gold.`], efeitos: { recursos: { madeira: -5 }, gold: ganho } };
      },
    },
  },
  resumo: (est) => Object.entries(est.precos).map(([b, p]) => `${b} ${p}`).join(' · '),
};

export const SISTEMAS_01 = [cidadesVivas, ecossistema, faccoes, npcs, refugios, personalidade, clima, masmorras, investigacao, economia];
