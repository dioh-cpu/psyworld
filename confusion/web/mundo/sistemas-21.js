// Sistemas 21 a 30 do catálogo: crimes, companheiros, portais, cicatrizes, guerras, adaptações,
// eventos históricos, mistérios coletivos, memória do mundo e criaturas gigantes.
import { clamp, escolha } from './util.js';

// 21 — Crimes e julgamentos. Referência: Ace Attorney (testemunhas e provas) e Red Dead Redemption 2 (procurado).
const crimes = {
  id: '21', nome: 'Crimes e julgamentos', referencia: 'Ace Attorney (testemunhas e provas); Red Dead Redemption 2 (nível de procurado)',
  criar: () => ({ crimes: 0, testemunhas: 0, multa: 0, procurado: 0 }),
  dia(est, ctx) {
    const notas = [];
    const efeitos = {};
    if (ctx.sanidade < 30 && ctx.r() < 0.15) {
      est.crimes += 1;
      est.testemunhas = Math.floor(ctx.r() * 3);
      notas.push(`Um crime aconteceu. ${est.testemunhas} testemunha(s) viram.`);
      if (est.testemunhas >= 2) est.procurado = clamp(est.procurado + 10, 0, 100);
      if (est.testemunhas >= 1) efeitos.diamantes = -5;
    }
    if (est.procurado > 0 && est.crimes === 0) est.procurado = clamp(est.procurado - 1, 0, 100);
    return { notas, efeitos };
  },
  acoes: {
    provar_inocencia: {
      rotulo: 'Provar inocência no julgamento (5 diamantes; sem testemunhas é mais fácil)',
      fn(est, ctx) {
        if ((ctx.diamantes || 0) < 5) return { notas: ['Faltam 5 diamantes.'] };
        const chance = est.testemunhas === 0 ? 0.9 : 0.4;
        if (ctx.r() < chance) {
          est.procurado = clamp(est.procurado - 30, 0, 100);
          return { notas: ['O juiz absolveu você.'], efeitos: { diamantes: -5 } };
        }
        est.procurado = clamp(est.procurado + 10, 0, 100);
        return { notas: ['O julgamento pesou contra você.'], efeitos: { diamantes: -5 } };
      },
    },
  },
  resumo: (est) => `Crimes ${est.crimes} · procurado ${est.procurado}`,
};

// 22 — Companheiros com histórias. Referência: Persona 5 (Confidants com histórias próprias) e Hades (relações que avançam em capítulos).
const companheiro = {
  id: '22', nome: 'Companheiros com histórias', referencia: 'Persona 5 (Confidants com histórias próprias); Hades (relações que avançam em capítulos)',
  criar: () => ({ mira: { afinidade: 10, historia: 0, ultimo: 0 } }),
  dia(est, ctx) {
    const notas = [];
    const m = est.mira;
    if (ctx.dia - m.ultimo > 3) m.afinidade = clamp(m.afinidade - 1, 0, 100);
    if (m.afinidade >= 60 && m.historia < 3) {
      m.historia += 1;
      m.afinidade = clamp(m.afinidade - 10, 0, 100);
      notas.push(`Mira abriu mais um capítulo da história dela (capítulo ${m.historia}).`);
    }
    return { notas, efeitos: m.afinidade >= 30 ? { recursos: { madeira: 1 } } : {} };
  },
  acoes: {
    conversar: {
      rotulo: 'Conversar com Mira (+8 de afinidade)',
      fn(est, ctx) {
        est.mira.afinidade = clamp(est.mira.afinidade + 8, 0, 100);
        est.mira.ultimo = ctx.dia;
        return { notas: [`Mira respondeu com carinho (afinidade ${est.mira.afinidade}).`] };
      },
    },
  },
  resumo: (est) => `Mira: afinidade ${est.mira.afinidade} · capítulo ${est.mira.historia}/3`,
};

// 23 — Portais dimensionais. Referência: Ori and the Will of the Wisps (áreas com regras próprias) e Hollow Knight (reinos ligados).
const portais = {
  id: '23', nome: 'Portais dimensionais', referencia: 'Ori and the Will of the Wisps (áreas com regras próprias); Hollow Knight (reinos ligados)',
  criar: () => ({ portal: 'lua', visitas: 0 }),
  dia(est, ctx) {
    const aberto = ctx.reliquiaRestaurada && ctx.dia % 3 === 0;
    return { notas: aberto ? ['O portal da lua está aberto hoje.'] : [], efeitos: {} };
  },
  acoes: {
    atravessar: {
      rotulo: 'Atravessar o portal da lua (precisa da relíquia restaurada e de um dia certo)',
      fn(est, ctx) {
        if (!ctx.reliquiaRestaurada) return { notas: ['O portal só responde à relíquia restaurada.'] };
        if (ctx.dia % 3 !== 0) return { notas: ['O portal está fechado hoje.'] };
        est.visitas += 1;
        return { notas: ['Você atravessou. Do outro lado há criaturas de outra física.'], efeitos: { diamantes: 8, sanidade: -1 } };
      },
    },
  },
  resumo: (est) => `Portal da lua · ${est.visitas} travessia(s)`,
};

// 24 — Cicatrizes e traumas. Referência: Disco Elysium (pensamentos que se internalizam) e Hellblade (o peso das lembranças).
const cicatrizes = {
  id: '24', nome: 'Cicatrizes e traumas', referencia: 'Disco Elysium (pensamentos que se internalizam); Hellblade (o peso das lembranças)',
  criar: () => ({ cicatrizes: [] }),
  dia(est) {
    let sanidade = 0;
    est.cicatrizes = est.cicatrizes.map((c) => ({ ...c, dias: c.superada ? c.dias : c.dias + 1 }));
    for (const c of est.cicatrizes) if (!c.superada) sanidade -= 1;
    return { notas: [], efeitos: sanidade ? { sanidade: Math.max(-3, sanidade) } : {} };
  },
  acoes: {
    sofrer_trauma: {
      rotulo: 'Sofrer um trauma (para testar; deixa uma cicatriz)',
      fn(est, ctx) {
        est.cicatrizes = [...est.cicatrizes, { origem: 'trauma da vila', dias: 0, superada: false }].slice(-6);
        return { notas: ['Uma cicatriz ficou.'], efeitos: { sanidade: -4 } };
      },
    },
    superar: {
      rotulo: 'Superar a cicatriz mais antiga (exige sanidade 40)',
      fn(est, ctx) {
        if (ctx.sanidade < 40) return { notas: ['Você ainda não se sente forte o bastante.'] };
        const i = est.cicatrizes.findIndex((c) => !c.superada);
        if (i < 0) return { notas: ['Nenhuma cicatriz pesa agora.'] };
        est.cicatrizes[i] = { ...est.cicatrizes[i], superada: true };
        return { notas: [`Você superou: ${est.cicatrizes[i].origem}.`], efeitos: { sanidade: 5 } };
      },
    },
  },
  resumo: (est) => `${est.cicatrizes.filter((c) => !c.superada).length} cicatriz(es) ativa(s)`,
};

// 25 — Guerras territoriais e cercos. Referência: Mount & Blade II: Bannerlord (cercos e facções) e Total War (territórios).
const guerras = {
  id: '25', nome: 'Guerras territoriais e cercos', referencia: 'Mount & Blade II: Bannerlord (cercos e facções); Total War (disputa de territórios)',
  criar: () => ({ guerra: false, cerco: 0 }),
  dia(est, ctx) {
    const notas = [];
    const rep = ctx.reputacao || { guardioes: 0, culto: 0 };
    const opostos = rep.guardioes >= 40 && rep.culto <= -40 || rep.culto >= 40 && rep.guardioes <= -40;
    if (!est.guerra && opostos) { est.guerra = true; notas.push('As facções entraram em guerra.'); }
    if (est.guerra) {
      est.cerco += 1;
      if (est.cerco === 5) notas.push('O cerco chegou à Vila do Norte: a prosperidade caiu.');
      return { notas, efeitos: est.cerco >= 5 ? { sanidade: -1 } : {} };
    }
    return { notas };
  },
  acoes: {
    mediar: {
      rotulo: 'Mediar a guerra (10 diamantes encerram o cerco)',
      fn(est, ctx) {
        if (!est.guerra) return { notas: ['Não há guerra para mediar.'] };
        if ((ctx.diamantes || 0) < 10) return { notas: ['Faltam 10 diamantes.'] };
        est.guerra = false;
        est.cerco = 0;
        return { notas: ['A paz foi negociada.'], efeitos: { diamantes: -10 } };
      },
    },
  },
  resumo: (est) => (est.guerra ? `Guerra em curso · cerco ${est.cerco} dia(s)` : 'Sem guerra'),
};

// 26 — Adaptações ambientais. Referência: Pokémon (formas regionais que se adaptam ao bioma) e Ark (treino em ambientes).
const ADAPTACAO_MAX = 3;
const adaptacoes = {
  id: '26', nome: 'Adaptações ambientais', referencia: 'Pokémon (formas regionais que se adaptam ao bioma); ARK: Survival Evolved (treino em ambientes)',
  criar: () => ({ niveis: {} }),
  dia: () => ({ notas: [] }),
  acoes: {
    treinar_bioma: {
      rotulo: 'Treinar o primeiro monstro na floresta (+1 resistência, até 3)',
      fn(est, ctx) {
        if (!ctx.monstros.length) return { notas: ['Você ainda não tem monstros.'] };
        const m = ctx.monstros[0];
        const niveis = est.niveis[m.id] || 0;
        if (niveis >= ADAPTACAO_MAX) return { notas: [`${m.species} já se adaptou ao máximo.`] };
        est.niveis = { ...est.niveis, [m.id]: niveis + 1 };
        return { notas: [`${m.species} ganhou resistência da floresta (${niveis + 1}).`] };
      },
    },
  },
  resumo: (est) => `${Object.keys(est.niveis).length} monstro(s) treinado(s) no bioma`,
};

// 27 — Eventos históricos provocados. Referência: Frostpunk (decisões que mudam a cidade) e Civilization (o registro da história).
const EVENTOS_HISTORIA = {
  fundacao: 'A fundação de uma nova comunidade',
  revolta: 'Uma revolta nas vilas',
  descoberta: 'Uma descoberta que mudou a região',
};
const historicos = {
  id: '27', nome: 'Eventos históricos provocados', referencia: 'Frostpunk (decisões que mudam a cidade); Civilization (o registro da história)',
  criar: () => ({ registro: [] }),
  dia: () => ({ notas: [] }),
  acoes: {
    provocar_evento: {
      rotulo: 'Provocar um evento histórico (escolha pela opção)',
      fn(est, ctx, args = {}) {
        const evento = EVENTOS_HISTORIA[args.evento];
        if (!evento) return { notas: ['Evento desconhecido.'] };
        est.registro = [...est.registro, { dia: ctx.dia, texto: evento }].slice(-20);
        const efeitos = args.evento === 'descoberta' ? { diamantes: 10 } : args.evento === 'revolta' ? { sanidade: -3 } : { recursos: { madeira: 5 } };
        return { notas: [`Para o registro do mundo: ${evento}.`], efeitos };
      },
    },
  },
  resumo: (est) => `${est.registro.length} evento(s) no registro`,
};

// 28 — Mistérios coletivos. Referência: Outer Wilds (pistas espalhadas que levam a um segredo).
const PISTAS_COLETIVAS = ['Uma pedra com runas', 'Um diário molhado', 'Um mapa de estrelas', 'Uma canção repetida'];
const misteriosColetivos = {
  id: '28', nome: 'Mistérios coletivos', referencia: 'Outer Wilds (pistas espalhadas que levam a um segredo)',
  criar: () => ({ pistas: [], segredo: false }),
  dia(est, ctx) {
    const notas = [];
    if (!est.segredo && est.pistas.length < PISTAS_COLETIVAS.length && ctx.r() < 0.1) {
      const nova = PISTAS_COLETIVAS.find((p) => !est.pistas.includes(p));
      est.pistas = [...est.pistas, nova];
      notas.push(`Uma pista apareceu pelo mundo: ${nova}.`);
    }
    return { notas };
  },
  acoes: {
    juntar_pistas: {
      rotulo: 'Juntar as pistas (com 4 pistas, revela o segredo)',
      fn(est) {
        if (est.segredo) return { notas: ['O segredo já foi revelado.'] };
        if (est.pistas.length < PISTAS_COLETIVAS.length) return { notas: [`Faltam pistas (${est.pistas.length}/${PISTAS_COLETIVAS.length}).`] };
        est.segredo = true;
        return { notas: ['As pistas se encaixaram: um santuário escondido se revelou.'], efeitos: { diamantes: 15, sanidade: 3 } };
      },
    },
  },
  resumo: (est) => (est.segredo ? 'Segredo revelado' : `${est.pistas.length}/${PISTAS_COLETIVAS.length} pistas`),
};

// 29 — Memória do Mundo. Referência: Animal Crossing (árvores plantadas crescem e marcam o tempo).
const memoriaMundo = {
  id: '29', nome: 'Memória do Mundo', referencia: 'Animal Crossing (árvores plantadas crescem e marcam o tempo)',
  criar: () => ({ arvores: [], monumentos: 0 }),
  dia(est, ctx) {
    const notas = [];
    let sanidade = 0;
    est.arvores = est.arvores.map((a) => {
      const stage = ctx.dia % 3 === 0 && a.stage < 3 ? a.stage + 1 : a.stage;
      if (stage === 3 && a.stage < 3) notas.push('Uma árvore plantada cresceu por completo.');
      return { ...a, stage };
    });
    sanidade += est.arvores.filter((a) => a.stage === 3).length > 0 ? 1 : 0;
    return { notas, efeitos: sanidade ? { sanidade } : {} };
  },
  acoes: {
    plantar_arvore: {
      rotulo: 'Plantar uma árvore (2 sementes)',
      fn(est, ctx) {
        if ((ctx.recursos.sementes || 0) < 2) return { notas: ['Faltam 2 sementes.'] };
        est.arvores = [...est.arvores, { stage: 0 }].slice(-12);
        return { notas: ['Uma árvore foi plantada.'], efeitos: { recursos: { sementes: -2 } } };
      },
    },
    erguer_monumento: {
      rotulo: 'Erguer um monumento (30 pedra)',
      fn(est, ctx) {
        if ((ctx.recursos.pedra || 0) < 30) return { notas: ['Faltam 30 pedra.'] };
        est.monumentos += 1;
        return { notas: ['Um monumento marca este tempo.'], efeitos: { recursos: { pedra: -30 }, sanidade: 2 } };
      },
    },
  },
  resumo: (est) => `${est.arvores.length} árvore(s) · ${est.arvores.filter((a) => a.stage === 3).length} crescida(s) · ${est.monumentos} monumento(s)`,
};

// 30 — Criaturas gigantes exploráveis. Referência: Monster Hunter (criaturas enormes) e Shadow of the Colossus (seres gigantes).
const GIGANTES_REGIOES = ['norte', 'sul', 'leste'];
const gigantes = {
  id: '30', nome: 'Criaturas gigantes exploráveis', referencia: 'Monster Hunter (criaturas enormes); Shadow of the Colossus (seres gigantes)',
  criar: () => ({ regiao: 'norte', diasAte: 4, montadas: 0 }),
  dia(est) {
    const notas = [];
    est.diasAte -= 1;
    if (est.diasAte <= 0) {
      const i = GIGANTES_REGIOES.indexOf(est.regiao);
      est.regiao = GIGANTES_REGIOES[(i + 1) % GIGANTES_REGIOES.length];
      est.diasAte = 4;
      notas.push(`A criatura gigante migrou para o ${est.regiao}.`);
    }
    return { notas };
  },
  acoes: {
    montar: {
      rotulo: 'Montar a criatura gigante (só quando ela está no norte)',
      fn(est) {
        if (est.regiao !== 'norte') return { notas: ['A criatura está em outra região.'] };
        est.montadas += 1;
        return { notas: ['Você subiu na criatura e atravessou a região.'], efeitos: { diamantes: 5 } };
      },
    },
  },
  resumo: (est) => `Criatura gigante no ${est.regiao} (em ${est.diasAte} dia(s))`,
};

export const SISTEMAS_21 = [crimes, companheiro, portais, cicatrizes, guerras, adaptacoes, historicos, misteriosColetivos, memoriaMundo, gigantes];
