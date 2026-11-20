// Sistemas 31 a 40 do catálogo: fundação de cidades, equipamentos, magias proibidas, contratos,
// autômatos, montarias, caçadores de recompensas, festivais, idiomas antigos e mineração profunda.
import { clamp } from './util.js';

// 31 — Fundação de cidades. Referência: Banished e Frostpunk (fundar um assentamento e mantê-lo vivo).
const CIDADES_MAX = 2;
const fundacao = {
  id: '31', nome: 'Fundação de cidades', referencia: 'Banished e Frostpunk (fundar um assentamento e mantê-lo vivo)',
  criar: () => ({ fundadas: [] }),
  dia(est, ctx) {
    const notas = [];
    let comida = 0;
    for (const c of est.fundadas) {
      if (ctx.r() < 0.5) c.populacao = clamp(c.populacao + 1, 0, 50);
      comida += Math.ceil(c.populacao / 5);
    }
    if (comida) notas.push(`As novas cidades consomem ${comida} comida por dia.`);
    return { notas, efeitos: comida ? { recursos: { comida: -comida } } : {} };
  },
  acoes: {
    fundar: {
      rotulo: `Fundar uma nova cidade (40 madeira e 20 pedra; até ${CIDADES_MAX})`,
      fn(est, ctx) {
        if (est.fundadas.length >= CIDADES_MAX) return { notas: ['Já há cidades demais.'] };
        if ((ctx.recursos.madeira || 0) < 40 || (ctx.recursos.pedra || 0) < 20) return { notas: ['Faltam 40 madeira e 20 pedra.'] };
        est.fundadas = [...est.fundadas, { nome: `Assentamento ${est.fundadas.length + 1}`, populacao: 5 }];
        return { notas: ['Um novo assentamento foi fundado.'], efeitos: { recursos: { madeira: -40, pedra: -20 } } };
      },
    },
  },
  resumo: (est) => `${est.fundadas.length} assentamento(s) · população ${est.fundadas.reduce((a, c) => a + c.populacao, 0)}`,
};

// 32 — Purificação e corrupção de equipamentos. Referência: Dark Souls (armas abençoadas e amaldiçoadas).
const EQUIPAMENTOS = { espada: 'Espada da Vigília', escudo: 'Escudo de Pedra', amuleto: 'Amuleto Antigo' };
const equipamentos = {
  id: '32', nome: 'Purificação e corrupção de equipamentos', referencia: 'Dark Souls (armas abençoadas e amaldiçoadas)',
  criar: () => Object.fromEntries(Object.keys(EQUIPAMENTOS).map((e) => [e, { bonus: 2, pureza: 'neutra' }])),
  dia: () => ({ notas: [] }),
  acoes: {
    purificar: {
      rotulo: 'Purificar a espada (5 pedra): pureza luz, +1 de bônus',
      fn(est, ctx) {
        if ((ctx.recursos.pedra || 0) < 5) return { notas: ['Faltam 5 pedra.'] };
        est.espada = { bonus: est.espada.bonus + 1, pureza: 'luz' };
        return { notas: ['A espada brilhou com luz.'], efeitos: { recursos: { pedra: -5 } } };
      },
    },
    corromper: {
      rotulo: 'Corromper o amuleto (2 cristal): pureza trevas, +2 de bônus, -1 sanidade',
      fn(est, ctx) {
        if ((ctx.recursos.cristal || 0) < 2) return { notas: ['Faltam 2 cristal.'] };
        est.amuleto = { bonus: est.amuleto.bonus + 2, pureza: 'trevas' };
        return { notas: ['O amuleto passou a cobrar um preço.'], efeitos: { recursos: { cristal: -2 }, sanidade: -1 } };
      },
    },
  },
  resumo: (est) => Object.entries(EQUIPAMENTOS).map(([k, n]) => `${n} +${est[k].bonus} (${est[k].pureza})`).join(' · '),
};

// 33 — Magias proibidas. Referência: Dragon Age (magia de sangue com custos) e Persona (o preço da força).
const magias = {
  id: '33', nome: 'Magias proibidas', referencia: 'Dragon Age (magia de sangue com custos); Persona (o preço da força)',
  criar: () => ({ usos: 0, marca: false }),
  dia(est) {
    return { notas: est.marca ? ['A marca da magia pesa na mente.'] : [], efeitos: est.marca ? { sanidade: -1 } : {} };
  },
  acoes: {
    vortice_negro: {
      rotulo: 'Conjurar o Vórtice Negro (-8 sanidade, +20 diamantes; a 3ª vez deixa uma marca)',
      fn(est, ctx) {
        if ((ctx.recursos.cristal || 0) < 1) return { notas: ['Falta 1 cristal para canalizar.'] };
        est.usos += 1;
        if (est.usos >= 3) est.marca = true;
        return { notas: ['O Vórtice Negro consumiu sua mente para dar poder.', ...(est.marca ? ['Uma marca ficou em você.'] : [])], efeitos: { sanidade: -8, diamantes: 20, recursos: { cristal: -1 } } };
      },
    },
  },
  resumo: (est) => `${est.usos} uso(s) · ${est.marca ? 'marcado' : 'sem marca'}`,
};

// 34 — Contratos sobrenaturais. Referência: Shin Megami Tensei (pactos com demônios) e Faust (prazo e cobrança).
const contratos = {
  id: '34', nome: 'Contratos sobrenaturais', referencia: 'Shin Megami Tensei (pactos com demônios); Faust (prazo e cobrança)',
  criar: () => ({ atual: null }),
  dia(est, ctx) {
    const notas = [];
    const efeitos = {};
    const c = est.atual;
    if (c && !c.cumprido) {
      efeitos.sanidade = -1;
      if (ctx.dia >= c.prazo) {
        notas.push('O prazo do contrato acabou. A entidade cobrou sua parte.');
        efeitos.sanidade = -10;
        est.atual = { ...c, falhou: true };
      }
    }
    return { notas, efeitos };
  },
  acoes: {
    assinar_forca: {
      rotulo: 'Assinar o pacto da força (+30 diamantes agora; cumprir pede 3 cristal em 10 dias)',
      fn(est, ctx) {
        if (est.atual && !est.atual.cumprido && !est.atual.falhou) return { notas: ['Você já tem um contrato em aberto.'] };
        est.atual = { tipo: 'forca', prazo: ctx.dia + 10, cumprido: false };
        return { notas: ['A entidade aceitou o pacto.'], efeitos: { diamantes: 30 } };
      },
    },
    cumprir: {
      rotulo: 'Cumprir o contrato (3 cristal)',
      fn(est, ctx) {
        const c = est.atual;
        if (!c || c.cumprido || c.falhou) return { notas: ['Não há contrato a cumprir.'] };
        if ((ctx.recursos.cristal || 0) < 3) return { notas: ['Faltam 3 cristal.'] };
        est.atual = { ...c, cumprido: true };
        return { notas: ['O contrato foi cumprido.'], efeitos: { recursos: { cristal: -3 } } };
      },
    },
  },
  resumo: (est) => (!est.atual ? 'Sem contrato' : est.atual.cumprido ? 'Contrato cumprido' : est.atual.falhou ? 'Contrato quebrado' : `Contrato em aberto até o dia ${est.atual.prazo}`),
};

// 35 — Autômatos e criaturas artificiais. Referência: NieR: Automata (autômatos que sentem e servem).
const automatos = {
  id: '35', nome: 'Autômatos e criaturas artificiais', referencia: 'NieR: Automata (autômatos que servem e se desgastam)',
  criar: () => ({ guardioes: 0, desgaste: 0 }),
  dia(est) {
    const notas = [];
    est.desgaste = clamp(est.desgaste + est.guardioes, 0, 100);
    const efeitos = est.guardioes ? { recursos: { pedra: est.guardioes } } : {};
    if (est.desgaste >= 80 && est.guardioes) {
      notas.push('Os autômatos estão gastos: precisam de manutenção.');
    }
    return { notas, efeitos };
  },
  acoes: {
    montar: {
      rotulo: 'Montar um autômato (3 peças de caça e 5 pedra)',
      fn(est, ctx) {
        if ((ctx.recursos.peca || 0) < 3 || (ctx.recursos.pedra || 0) < 5) return { notas: ['Faltam 3 peças e 5 pedra.'] };
        est.guardioes += 1;
        return { notas: ['Um autômato foi montado e começou a guardar a vila.'], efeitos: { recursos: { peca: -3, pedra: -5 } } };
      },
    },
    manter: {
      rotulo: 'Manter os autômatos (5 pedra, zera o desgaste)',
      fn(est, ctx) {
        if ((ctx.recursos.pedra || 0) < 5) return { notas: ['Faltam 5 pedra.'] };
        est.desgaste = 0;
        return { notas: ['Os autômatos voltaram a funcionar bem.'], efeitos: { recursos: { pedra: -5 } } };
      },
    },
  },
  resumo: (est) => `${est.guardioes} autômato(s) · desgaste ${est.desgaste}`,
};

// 36 — Montarias terrestres, aéreas e aquáticas. Referência: The Legend of Zelda (montarias que abrem o mapa) e Monster Hunter (rotas com monstros).
const montarias = {
  id: '36', nome: 'Montarias terrestres, aéreas e aquáticas', referencia: 'The Legend of Zelda (montarias que abrem o mapa); Monster Hunter (rotas com criaturas)',
  criar: () => ({ tipos: [] }),
  dia: () => ({ notas: [] }),
  acoes: {
    domar_terrestre: {
      rotulo: 'Domar uma montaria terrestre (5 comida)',
      fn(est, ctx) {
        if (est.tipos.includes('terrestre')) return { notas: ['Você já tem uma montaria terrestre.'] };
        if ((ctx.recursos.comida || 0) < 5) return { notas: ['Faltam 5 comida.'] };
        est.tipos = [...est.tipos, 'terrestre'];
        return { notas: ['A montaria terrestre aceitou você.'], efeitos: { recursos: { comida: -5 } } };
      },
    },
    domar_aerea: {
      rotulo: 'Domar uma montaria aérea (precisa da relíquia restaurada)',
      fn(est, ctx) {
        if (!ctx.reliquiaRestaurada) return { notas: ['Só a relíquia restaurada atrai a criatura do céu.'] };
        if (est.tipos.includes('aerea')) return { notas: ['Você já tem uma montaria aérea.'] };
        est.tipos = [...est.tipos, 'aerea'];
        return { notas: ['Uma criatura do céu desceu para você.'] };
      },
    },
    domar_aquatica: {
      rotulo: 'Domar uma montaria aquática (precisa de barco)',
      fn(est, ctx) {
        if (!ctx.temBarco) return { notas: ['Você precisa de um barco.'] };
        if (est.tipos.includes('aquatica')) return { notas: ['Você já tem uma montaria aquática.'] };
        est.tipos = [...est.tipos, 'aquatica'];
        return { notas: ['Uma criatura do mar seguiu seu barco.'] };
      },
    },
  },
  resumo: (est) => (est.tipos.length ? `Montarias: ${est.tipos.join(', ')}` : 'Sem montarias'),
};

// 37 — Caçadores de recompensas. Referência: Red Dead Redemption 2 (cartazes de recompensa) e The Witcher 3 (contratos de caça).
const cacadores = {
  id: '37', nome: 'Caçadores de recompensas', referencia: 'Red Dead Redemption 2 (cartazes de recompensa); The Witcher 3 (contratos de caça)',
  criar: () => ({ contratos: [], caçadas: 0 }),
  dia(est, ctx) {
    const notas = [];
    if (ctx.dia % 4 === 0 && est.contratos.length < 3) {
      const alvo = ctx.r() < 0.5 ? 'criatura' : 'criminoso';
      const recompensa = alvo === 'criatura' ? 12 : 20;
      est.contratos = [...est.contratos, { alvo, recompensa }];
      notas.push(`Um novo cartaz de recompensa: ${alvo} (${recompensa} diamantes).`);
    }
    return { notas };
  },
  acoes: {
    cacar: {
      rotulo: 'Caçar o primeiro contrato (chance de sucesso; falha dá nada)',
      fn(est, ctx) {
        const c = est.contratos[0];
        if (!c) return { notas: ['Não há contratos abertos.'] };
        est.contratos = est.contratos.slice(1);
        if (ctx.r() < 0.6) {
          est.caçadas += 1;
          return { notas: [`Você cumpriu o contrato de ${c.alvo}.`], efeitos: { diamantes: c.recompensa } };
        }
        return { notas: [`A caçada ao ${c.alvo} não deu certo.`] };
      },
    },
  },
  resumo: (est) => `${est.contratos.length} contrato(s) aberto(s) · ${est.caçadas} cumprido(s)`,
};

// 38 — Festivais e culturas. Referência: Stardew Valley (festivais de cada estação) e Animal Crossing (festas e comidas típicas).
const FESTIVAIS = { primavera: 'Festa das Flores', verao: 'Festa do Sol', outono: 'Festa da Colheita', inverno: 'Noite Longa' };
const festivais = {
  id: '38', nome: 'Festivais e culturas', referencia: 'Stardew Valley (festivais de cada estação); Animal Crossing (festas e comidas típicas)',
  criar: () => ({ festivaisVistos: 0 }),
  dia(est, ctx) {
    const notas = [];
    const estacao = ['primavera', 'verao', 'outono', 'inverno'][Math.floor((ctx.dia - 1) / 7) % 4];
    if (ctx.dia % 7 === 0) {
      est.festivaisVistos += 1;
      notas.push(`${FESTIVAIS[estacao]} animou a vila.`);
      return { notas, efeitos: { sanidade: 3, diamantes: 5 } };
    }
    return { notas };
  },
  acoes: {
    cozinhar_festa: {
      rotulo: 'Cozinhar comida típica para a festa (2 comida; o festival rende mais)',
      fn(est, ctx) {
        if ((ctx.recursos.comida || 0) < 2) return { notas: ['Faltam 2 comida.'] };
        return { notas: ['A comida típica ficou pronta.'], efeitos: { recursos: { comida: -2 }, sanidade: 1 } };
      },
    },
  },
  resumo: (est) => `${est.festivaisVistos} festival(is) vivido(s)`,
};

// 39 — Idiomas antigos. Referência: Skyrim (idioma dos dragões que se aprende por palavras de poder).
const idiomas = {
  id: '39', nome: 'Idiomas antigos', referencia: 'Skyrim (idioma antigo que se aprende aos poucos)',
  criar: () => ({ aprendizado: 0, decifradas: 0 }),
  dia: () => ({ notas: [] }),
  acoes: {
    estudar: {
      rotulo: 'Estudar o idioma antigo (+10 de aprendizado)',
      fn(est) {
        est.aprendizado = clamp(est.aprendizado + 10, 0, 100);
        return { notas: [`Você entende mais do idioma antigo (${est.aprendizado}%).`] };
      },
    },
    traduzir: {
      rotulo: 'Traduzir uma inscrição (exige 50% de aprendizado; 5 diamantes)',
      fn(est, ctx) {
        if (est.aprendizado < 50) return { notas: ['Você ainda não entende o suficiente.'] };
        est.decifradas += 1;
        est.aprendizado = clamp(est.aprendizado - 10, 0, 100);
        return { notas: ['Uma inscrição antiga foi decifrada.'], efeitos: { diamantes: 5 } };
      },
    },
  },
  resumo: (est) => `Aprendizado ${est.aprendizado}% · ${est.decifradas} inscrição(ões)`,
};

// 40 — Mineração profunda. Referência: Terraria (camadas com recursos próprios) e Dwarf Fortress (desabamentos e fósseis).
const CAMADAS = [
  { nome: 'Camada rasa', bonus: { pedra: 3 } },
  { nome: 'Camada média', bonus: { cristal: 1 } },
  { nome: 'Camada funda', bonus: { fossil: 1 } },
];
const mineracao = {
  id: '40', nome: 'Mineração profunda', referencia: 'Terraria (camadas com recursos próprios); Dwarf Fortress (desabamentos e fósseis)',
  criar: () => ({ camada: 0, fosseis: 0 }),
  dia(est, ctx) {
    const notas = [];
    if (est.camada >= 2 && ctx.r() < 0.1) {
      est.camada = 1;
      notas.push('Um desabamento na camada funda assustou os mineradores.');
      return { notas, efeitos: { sanidade: -2 } };
    }
    return { notas };
  },
  acoes: {
    escavar: {
      rotulo: 'Escavar a próxima camada (2 comida; a funda rende fósseis)',
      fn(est, ctx) {
        if ((ctx.recursos.comida || 0) < 2) return { notas: ['Faltam 2 comida.'] };
        const prox = Math.min(CAMADAS.length - 1, est.camada);
        const camada = CAMADAS[prox];
        est.camada = Math.min(CAMADAS.length - 1, est.camada + 1);
        const recursos = { comida: -2 };
        for (const [k, v] of Object.entries(camada.bonus)) {
          if (k === 'fossil') est.fosseis += v;
          else recursos[k] = (recursos[k] || 0) + v;
        }
        return { notas: [`Você escavou: ${camada.nome}.`], efeitos: { recursos } };
      },
    },
  },
  resumo: (est) => `Camada ${CAMADAS[Math.min(CAMADAS.length - 1, est.camada)].nome} · ${est.fosseis} fóssil(eis)`,
};

export const SISTEMAS_31 = [fundacao, equipamentos, magias, contratos, automatos, montarias, cacadores, festivais, idiomas, mineracao];
