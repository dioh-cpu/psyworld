// Sistemas 41 a 50 do catálogo: simbiose, labirintos temporais, reputação lendária, arenas,
// expedições, astronomia, santuários de memória, engenharia, criaturas que aprendem e evolução do mundo.
import { clamp, hash } from './util.js';

// 41 — Simbiose e parasitismo. Referência: Spore (criaturas que vivem juntas) e Terraria (plantas e criaturas que se ajudam).
const LIMITE_VINCULOS = 3;
const simbiose = {
  id: '41', nome: 'Simbiose e parasitismo', referencia: 'Spore (criaturas que vivem juntas); Terraria (plantas e criaturas que se ajudam)',
  criar: () => ({ vinculos: [] }),
  dia(est) {
    const recursos = {};
    for (const v of est.vinculos) recursos.comida = (recursos.comida || 0) + (v.tipo === 'simbiose' ? 1 : -1);
    return { notas: [], efeitos: Object.keys(recursos).length ? { recursos } : {} };
  },
  acoes: {
    associar_simbiose: {
      rotulo: 'Criar uma simbiose com o primeiro monstro (+1 comida por dia; máximo 3 vínculos)',
      fn(est, ctx) {
        if (est.vinculos.length >= LIMITE_VINCULOS) return { notas: ['O limite de vínculos foi atingido.'] };
        if (!ctx.monstros.length) return { notas: ['Você ainda não tem monstros.'] };
        est.vinculos = [...est.vinculos, { tipo: 'simbiose', com: ctx.monstros[0].id }];
        return { notas: ['Uma planta e um monstro passaram a se ajudar.'] };
      },
    },
    associar_parasita: {
      rotulo: 'Aceitar um parasita (-1 comida por dia; dá 5 diamantes agora)',
      fn(est, ctx) {
        if (est.vinculos.length >= LIMITE_VINCULOS) return { notas: ['O limite de vínculos foi atingido.'] };
        est.vinculos = [...est.vinculos, { tipo: 'parasita', com: 'planta' }];
        return { notas: ['Um parasita se instalou. Ele cobra o seu alimento.'], efeitos: { diamantes: 5 } };
      },
    },
  },
  resumo: (est) => `${est.vinculos.filter((v) => v.tipo === 'simbiose').length} simbiose(s) · ${est.vinculos.filter((v) => v.tipo === 'parasita').length} parasita(s)`,
};

// 42 — Labirintos temporais. Referência: The Legend of Zelda: Majora's Mask (três dias que se repetem) e Outer Wilds (o tempo que volta).
const labirintos = {
  id: '42', nome: 'Labirintos temporais', referencia: 'The Legend of Zelda: Majora\'s Mask (três dias que se repetem); Outer Wilds (o tempo que volta)',
  criar: () => ({ instancia: null, ecos: 0, concluidos: 0 }),
  dia: () => ({ notas: [] }),
  acoes: {
    entrar: {
      rotulo: 'Entrar no labirinto temporal (5 passos)',
      fn(est) {
        if (est.instancia) return { notas: ['Você já está dentro de um labirinto.'] };
        est.instancia = { passo: 0, max: 5 };
        return { notas: ['O tempo se dobrou ao seu redor.'] };
      },
    },
    avancar: {
      rotulo: 'Dar um passo no labirinto (pode achar um eco do passado)',
      fn(est, ctx) {
        const i = est.instancia;
        if (!i) return { notas: ['Você não está em um labirinto.'] };
        i.passo += 1;
        const notas = [];
        let efeitos = {};
        if (ctx.r() < 0.5) { est.ecos += 1; notas.push('Você viu um eco do passado.'); efeitos = { sanidade: 1 }; }
        if (i.passo >= i.max) {
          est.instancia = null;
          est.concluidos += 1;
          notas.push('Você saiu do labirinto. A linha do tempo principal continua igual.');
          efeitos = { ...efeitos, diamantes: 5 + est.ecos * 2 };
        }
        return { notas, efeitos };
      },
    },
  },
  resumo: (est) => (est.instancia ? `Dentro do labirinto: passo ${est.instancia.passo}/${est.instancia.max}` : `Fora · ${est.concluidos} labirinto(s) concluído(s)`),
};

// 43 — Reputação lendária. Referência: Hades (diálogos que lembram suas façanhas) e Elden Ring (títulos que mudam o mundo).
const TITULOS = [
  { id: 'guardiao', nome: 'Guardião da vila', ok: (c) => c.reputacao.guardioes >= 50 },
  { id: 'amigo_guilda', nome: 'Amigo da Guilda', ok: (c) => c.reputacao.guilda >= 50 },
  { id: 'vencedor', nome: 'Vencedor de chefes', ok: (c) => (c.chefesDerrotados || 0) >= 1 },
];
const lendaria = {
  id: '43', nome: 'Reputação lendária', referencia: 'Hades (diálogos que lembram suas façanhas); Elden Ring (títulos que mudam o mundo)',
  criar: () => ({ titulos: [] }),
  dia(est, ctx) {
    const notas = [];
    let diamantes = 0;
    for (const t of TITULOS) {
      if (!est.titulos.includes(t.id) && t.ok(ctx)) {
        est.titulos = [...est.titulos, t.id];
        notas.push(`Título conquistado: ${t.nome}.`);
        diamantes += 5;
      }
    }
    return { notas, efeitos: diamantes ? { diamantes } : {} };
  },
  acoes: {},
  resumo: (est) => `${est.titulos.length} título(s): ${est.titulos.map((t) => TITULOS.find((x) => x.id === t)?.nome).join(', ') || 'nenhum'}`,
};

// 44 — Arenas e competições. Referência: Pokémon (ginásios, divisões e torneios) e Super Smash Bros. (regras de torneio).
const DIVISOES = ['bronze', 'prata', 'ouro'];
const arenas = {
  id: '44', nome: 'Arenas e competições', referencia: 'Pokémon (ginásios e divisões de torneio); Super Smash Bros. (regras de arena)',
  criar: () => ({ vitorias: 0, divisao: 0 }),
  dia: () => ({ notas: [] }),
  acoes: {
    duelar: {
      rotulo: 'Duelar na arena com o primeiro monstro (vence pela sorte e pelo nível da divisão)',
      fn(est, ctx) {
        if (!ctx.monstros.length) return { notas: ['Você ainda não tem monstros.'] };
        const chance = 0.5 - est.divisao * 0.05;
        if (ctx.r() < chance) {
          est.vitorias += 1;
          const notas = [`Você venceu o duelo (${DIVISOES[est.divisao]}).`];
          if (est.vitorias % 3 === 0 && est.divisao < DIVISOES.length - 1) {
            est.divisao += 1;
            notas.push(`Você subiu para a divisão ${DIVISOES[est.divisao]}!`);
          }
          return { notas, efeitos: { diamantes: 5 + est.divisao * 5 } };
        }
        return { notas: ['Você perdeu o duelo. Tente de novo.'] };
      },
    },
  },
  resumo: (est) => `Divisão ${DIVISOES[est.divisao]} · ${est.vitorias} vitória(s)`,
};

// 45 — Expedições autônomas de NPCs. Referência: Dwarf Fortress (grupos que saem sozinhos) e Stardew Valley (amigos que trazem presentes).
const EXPEDICAO_PREMIOS = [{ madeira: 6 }, { pedra: 6 }, { cristal: 1 }];
const expedicoes = {
  id: '45', nome: 'Expedições autônomas de NPCs', referencia: 'Dwarf Fortress (grupos que saem sozinhos); Stardew Valley (amigos que trazem presentes)',
  criar: () => ({ em: [] }),
  dia(est, ctx) {
    const notas = [];
    const recursos = {};
    est.em = est.em.map((e) => ({ ...e, dias: e.dias - 1 })).filter((e) => {
      if (e.dias > 0) return true;
      const premio = EXPEDICAO_PREMIOS[Math.min(EXPEDICAO_PREMIOS.length - 1, Math.floor(ctx.r() * EXPEDICAO_PREMIOS.length))];
      for (const [k, v] of Object.entries(premio)) recursos[k] = (recursos[k] || 0) + v;
      notas.push(`A expedição de ${e.npc} voltou com recursos.`);
      return false;
    });
    return { notas, efeitos: Object.keys(recursos).length ? { recursos } : {} };
  },
  acoes: {
    enviar: {
      rotulo: 'Enviar Ana numa expedição de 3 dias (3 comida)',
      fn(est, ctx) {
        if (est.em.some((e) => e.npc === 'Ana')) return { notas: ['Ana já está em expedição.'] };
        if ((ctx.recursos.comida || 0) < 3) return { notas: ['Faltam 3 comida.'] };
        est.em = [...est.em, { npc: 'Ana', dias: 3 }];
        return { notas: ['Ana partiu com uma equipe.'], efeitos: { recursos: { comida: -3 } } };
      },
    },
  },
  resumo: (est) => (est.em.length ? est.em.map((e) => `${e.npc} volta em ${e.dias} dia(s)`).join(' · ') : 'Nenhuma expedição'),
};

// 46 — Astronomia e constelações. Referência: Pokémon Sol e Lua (ciclos de dia e noite e eventos lunares).
const CONSTELACOES = ['Lobo', 'Ponte', 'Coruja', 'Espada'];
const astronomia = {
  id: '46', nome: 'Astronomia e constelações', referencia: 'Pokémon Sol e Lua (ciclos de dia e noite e eventos lunares)',
  criar: () => ({ observatorio: false, vistas: 0 }),
  dia(est, ctx) {
    const notas = [];
    const constelacao = CONSTELACOES[Math.floor(ctx.dia / 12) % CONSTELACOES.length];
    const dia = ctx.dia % 12 === 0;
    if (dia) {
      notas.push(`Surge no céu a constelação do ${constelacao}.`);
      if (est.observatorio) { est.vistas += 1; return { notas: [...notas, 'O observatório registrou o ciclo.'], efeitos: { recursos: { sementes: 1 } } }; }
    }
    return { notas };
  },
  acoes: {
    construir_observatorio: {
      rotulo: 'Construir um observatório (25 pedra): prevê os ciclos e rende sementes',
      fn(est, ctx) {
        if (est.observatorio) return { notas: ['Você já tem um observatório.'] };
        if ((ctx.recursos.pedra || 0) < 25) return { notas: ['Faltam 25 pedra.'] };
        est.observatorio = true;
        return { notas: ['O observatório está pronto.'], efeitos: { recursos: { pedra: -25 } } };
      },
    },
  },
  resumo: (est) => `${est.observatorio ? 'Observatório ativo' : 'Sem observatório'} · ${est.vistas} ciclo(s) registrado(s)`,
};

// 47 — Santuários de memória. Referência: Chrono Trigger (o passado que volta a aparecer) e Hollow Knight (ecos dos que se foram).
const CATEDRAL_CHANCE_AGUA = 0.08; // chance de um onírico de Luz deixar água purificada numa visita
const CATEDRAL_VISITAS_DIA = 3;
const santuarios = {
  id: '47', nome: 'Santuários de memória', referencia: 'Chrono Trigger (o passado que volta a aparecer); Hollow Knight (ecos dos que se foram)',
  criar: () => ({ santuarios: 0, ecos: 0 }),
  dia(est, ctx) {
    const notas = [];
    const eventos = ctx.eventosHistoricos || 0;
    if (eventos > 0 && ctx.dia % 5 === 0 && ctx.r() < 0.5 + est.santuarios * 0.1) {
      est.ecos += 1;
      notas.push('Um santuário mostrou um eco de um acontecimento do passado.');
      return { notas, efeitos: { sanidade: 1 } };
    }
    return { notas };
  },
  acoes: {
    visitar_catedral: {
      rotulo: `Visitar a catedral (só herói; oníricos de Luz podem deixar água purificada; até ${CATEDRAL_VISITAS_DIA} visitas por dia)`,
      fn(est, ctx) {
        if (ctx.caminho !== 'heroi') return { notas: ['Só o caminho do herói pode entrar na catedral.'] };
        if (est.visitasDia !== ctx.dia) { est.visitasDia = ctx.dia; est.visitas = 0; }
        if (est.visitas >= CATEDRAL_VISITAS_DIA) return { notas: ['Você já visitou a catedral o bastante por hoje.'] };
        est.visitas += 1;
        if (ctx.r() < CATEDRAL_CHANCE_AGUA) return { notas: ['Um onírico de Luz deixou água purificada.'], efeitos: { recursos: { agua_purificadora: 1 } } };
        return { notas: ['Os oníricos de Luz passaram sem deixar nada.'] };
      },
    },
    construir_santuario: {
      rotulo: 'Erguer um santuário de memória (20 pedra; aumenta a chance de ecos)',
      fn(est, ctx) {
        if ((ctx.recursos.pedra || 0) < 20) return { notas: ['Faltam 20 pedra.'] };
        est.santuarios += 1;
        return { notas: ['Um santuário foi erguido em memória dos que partiram.'], efeitos: { recursos: { pedra: -20 } } };
      },
    },
  },
  resumo: (est) => `${est.santuarios} santuário(s) · ${est.ecos} eco(s)`,
};

// 48 — Engenharia e infraestrutura. Referência: Cities: Skylines (pontes, canais e circulação) e Frostpunk (infraestrutura que sustenta a cidade).
const engenharia = {
  id: '48', nome: 'Engenharia e infraestrutura', referencia: 'Cities: Skylines (pontes, canais e circulação); Frostpunk (infraestrutura que sustenta a cidade)',
  criar: () => ({ pontes: 0, canais: 0 }),
  dia(est, ctx) {
    const notas = [];
    const efeitos = {};
    if (est.canais) efeitos.recursos = { comida: est.canais };
    if (est.pontes && ctx.ponteFechada) notas.push('A ponte reforçada mantém algum comércio mesmo fechada.');
    return { notas, efeitos };
  },
  acoes: {
    construir_canal: {
      rotulo: 'Construir um canal de irrigação (20 madeira e 20 pedra; +1 comida por dia)',
      fn(est, ctx) {
        if ((ctx.recursos.madeira || 0) < 20 || (ctx.recursos.pedra || 0) < 20) return { notas: ['Faltam 20 madeira e 20 pedra.'] };
        est.canais += 1;
        return { notas: ['Um canal leva água aos campos.'], efeitos: { recursos: { madeira: -20, pedra: -20 } } };
      },
    },
    reforcar_ponte: {
      rotulo: 'Reforçar a ponte (40 pedra)',
      fn(est, ctx) {
        if ((ctx.recursos.pedra || 0) < 40) return { notas: ['Faltam 40 pedra.'] };
        est.pontes += 1;
        return { notas: ['A ponte foi reforçada.'], efeitos: { recursos: { pedra: -40 } } };
      },
    },
  },
  resumo: (est) => `${est.canais} canal(is) · ${est.pontes} ponte(s) reforçada(s)`,
};

// 49 — Criaturas que aprendem com o jogador. Referência: Digimon (evolução por treino e cuidado) e Pokémon (especialização pelo uso).
const ESPECIALIZACOES = {
  mineiro: { nome: 'Mineiro', bonus: { pedra: 1 } },
  curandeiro: { nome: 'Curandeiro', bonus: { raizes: 1 } },
  guerreiro: { nome: 'Guerreiro', bonus: { diamantes: 1 } },
};
const LIMITE_ESPEC = 5;
const aprendem = {
  id: '49', nome: 'Criaturas que aprendem com o jogador', referencia: 'Digimon (evolução por treino e cuidado); Pokémon (especialização pelo uso)',
  criar: () => ({ monstros: {} }),
  dia(est) {
    const recursos = {};
    let diamantes = 0;
    for (const st of Object.values(est.monstros)) {
      if (!st.especializacao) continue;
      const b = ESPECIALIZACOES[st.especializacao].bonus;
      for (const [k, v] of Object.entries(b)) {
        if (k === 'diamantes') diamantes += v;
        else recursos[k] = (recursos[k] || 0) + v;
      }
    }
    const efeitos = {};
    if (Object.keys(recursos).length) efeitos.recursos = recursos;
    if (diamantes) efeitos.diamantes = diamantes;
    return { notas: [], efeitos };
  },
  acoes: {
    treinar: {
      rotulo: 'Treinar o primeiro monstro (5 treinos viram uma especialização)',
      fn(est, ctx) {
        if (!ctx.monstros.length) return { notas: ['Você ainda não tem monstros.'] };
        const m = ctx.monstros[0];
        const st = est.monstros[m.id] || (est.monstros[m.id] = { usos: 0, especializacao: null });
        if (st.especializacao) return { notas: [`${m.species} já é ${ESPECIALIZACOES[st.especializacao].nome}.`] };
        st.usos += 1;
        if (st.usos >= LIMITE_ESPEC) {
          const tipos = Object.keys(ESPECIALIZACOES);
          st.especializacao = tipos[hash(m.species) % tipos.length];
          return { notas: [`${m.species} se especializou: ${ESPECIALIZACOES[st.especializacao].nome}.`] };
        }
        return { notas: [`${m.species} aprendeu com o treino (${st.usos}/${LIMITE_ESPEC}).`] };
      },
    },
  },
  resumo: (est) => `${Object.values(est.monstros).filter((s) => s.especializacao).length} especializado(s)`,
};

// 50 — Evolução autônoma do mundo. Referência: Civilization (o mundo avança com o tempo) e Dwarf Fortress (a história continua sem o jogador).
const MARCOS = [
  { limite: 30, texto: 'O primeiro marco: a região cresceu. Isso não volta atrás.' },
  { limite: 60, texto: 'Um novo marco: as rotas se consolidaram.' },
  { limite: 90, texto: 'O último marco: a história do mundo mudou para sempre.' },
];
const evolucao = {
  id: '50', nome: 'Evolução autônoma do mundo', referencia: 'Civilization (o mundo avança com o tempo); Dwarf Fortress (a história segue sem o jogador)',
  criar: () => ({ progresso: 0, marcos: 0 }),
  dia(est, ctx) {
    const notas = [];
    est.progresso = clamp(est.progresso + 1 + (ctx.construcoes || 0), 0, 1000);
    while (est.marcos < MARCOS.length && est.progresso >= MARCOS[est.marcos].limite) {
      notas.push(MARCOS[est.marcos].texto);
      est.marcos += 1;
    }
    return { notas };
  },
  acoes: {},
  resumo: (est) => `Progresso ${est.progresso} · ${est.marcos}/${MARCOS.length} marco(s) irreversíveis`,
};

export const SISTEMAS_41 = [simbiose, labirintos, lendaria, arenas, expedicoes, astronomia, santuarios, engenharia, aprendem, evolucao];
