// Sistemas 31 a 40 do catálogo: fundação de cidades, equipamentos, magias proibidas, contratos,
// autômatos, montarias, caçadores de recompensas, festivais, idiomas antigos e mineração profunda.
import { clamp } from './util.js';

// 31 — Fundação de cidades. Referência: Banished e Frostpunk (fundar um assentamento e mantê-lo vivo); The Last of Us (infecção que se espalha).
const CIDADES_MAX = 2;
const FAZENDA_POR_CIDADE = 3;      // comida produzida por cidade por dia
const POCO_POR_CIDADE = 4;         // água produzida por cidade por dia (poço)
const ESTOQUE_MINIMO_CRESCER = 20; // a população só cresce com esse estoque de comida
const CHANCE_LEVANTAR = 0.2;       // um morador que morre de fome ou de sede pode se levantar como zumbi
const CHANCE_CONTAGIO = 0.1;       // por dia, cada zumbi transforma um morador com essa chance
const ZUMBIS_MAX = 30;
const comerDe = (pop) => Math.ceil(pop / 5); // comida por dia
const beberDe = (pop) => Math.ceil(pop / 4); // água por dia: as pessoas bebem mais do que comem
const fundacao = {
  id: '31', nome: 'Fundação de cidades', referencia: 'Banished e Frostpunk (fundar um assentamento e mantê-lo vivo); The Last of Us (infecção que se espalha)',
  criar: () => ({ fundadas: [], surto: false }),
  dia(est, ctx) {
    // Cada cidade tem fazendas (comida) e poço (água). A população consome as duas e só cresce com sobra.
    // Sem comida ou sem água, os moradores morrem. Alguns mortos se levantam como zumbis, que transformam outros moradores.
    // O primeiro levante marca o surto: pretexto de uma arma biológica lançada sobre a região.
    const notas = [];
    for (const c of est.fundadas) c.zumbis = c.zumbis || 0; // estados salvos antes do surto não têm o campo
    const estoqueComida = ctx.recursos?.comida || 0;
    const estoqueAgua = ctx.recursos?.agua || 0;
    const n = est.fundadas.length;
    const producaoComida = n * FAZENDA_POR_CIDADE;
    const producaoAgua = n * POCO_POR_CIDADE;
    const consumoComida = () => est.fundadas.reduce((a, c) => a + comerDe(c.populacao), 0);
    const consumoAgua = () => est.fundadas.reduce((a, c) => a + beberDe(c.populacao), 0);
    const faltaComida = n > 0 && estoqueComida + producaoComida - consumoComida() < 0;
    const faltaAgua = n > 0 && estoqueAgua + producaoAgua - consumoAgua() < 0;
    if (faltaComida || faltaAgua) {
      const causa = faltaComida && faltaAgua ? 'Falta comida e água' : faltaComida ? 'Falta comida' : 'Falta água';
      let mortos = 0;
      let levantados = 0;
      for (const c of est.fundadas) {
        if (c.populacao <= 0) continue;
        c.populacao -= 1;
        mortos += 1;
        if (ctx.r() < CHANCE_LEVANTAR) {
          c.zumbis = Math.min(ZUMBIS_MAX, c.zumbis + 1);
          levantados += 1;
        }
      }
      if (mortos) notas.push(`${causa}: ${mortos} morador(es) morreram.`);
      if (levantados) {
        notas.push(`${levantados} dos mortos se levantaram como zumbis.`);
        if (!est.surto) {
          est.surto = true;
          notas.push('Os mortos voltaram a andar. Tudo indica que uma arma biológica foi lançada sobre a região.');
        }
      }
    }
    // Contágio: cada zumbi pode transformar um morador por dia.
    let convertidos = 0;
    for (const c of est.fundadas) {
      for (let i = 0; i < c.zumbis; i++) {
        if (c.populacao > 0 && ctx.r() < CHANCE_CONTAGIO) {
          c.populacao -= 1;
          c.zumbis = Math.min(ZUMBIS_MAX, c.zumbis + 1);
          convertidos += 1;
        }
      }
    }
    if (convertidos) notas.push(`${convertidos} morador(es) se transformaram em zumbis.`);
    // Zumbis sem moradores para infectar se desfazem.
    for (const c of est.fundadas) {
      if (c.populacao === 0 && c.zumbis > 0) c.zumbis = Math.max(0, c.zumbis - 2);
    }
    // Crescimento: só em cidade sem zumbis, com comida em estoque e com sobra de comida e de água.
    for (const c of est.fundadas) {
      const sobra = producaoComida - consumoComida() > 0 && producaoAgua - consumoAgua() > 0;
      if (c.zumbis === 0 && estoqueComida >= ESTOQUE_MINIMO_CRESCER && sobra && ctx.r() < 0.5) {
        c.populacao = clamp(c.populacao + 1, 0, 50);
      }
    }
    const recursos = {};
    const saldoComida = producaoComida - consumoComida();
    const saldoAgua = producaoAgua - consumoAgua();
    if (saldoComida) recursos.comida = saldoComida;
    if (saldoAgua) recursos.agua = saldoAgua;
    return { notas, efeitos: Object.keys(recursos).length ? { recursos } : {} };
  },
  acoes: {
    conter_surto: {
      rotulo: 'Conter o surto: queimar corpos e isolar a cidade mais infestada (20 madeira; -3 zumbis)',
      fn(est, ctx) {
        const alvo = [...est.fundadas].sort((a, b) => b.zumbis - a.zumbis)[0];
        if (!alvo || alvo.zumbis === 0) return { notas: ['Não há zumbis para conter.'] };
        if ((ctx.recursos.madeira || 0) < 20) return { notas: ['Faltam 20 madeira.'] };
        alvo.zumbis = Math.max(0, alvo.zumbis - 3);
        return { notas: [`${alvo.nome}: os zumbis foram contidos (${alvo.zumbis} restante(s)).`], efeitos: { recursos: { madeira: -20 } } };
      },
    },
    purificar_cidade: {
      rotulo: 'Purificar a cidade mais infestada (só no caminho do herói; 15 pedra e 10 água; os zumbis voltam a ser moradores)',
      fn(est, ctx) {
        if (ctx.caminho !== 'heroi') return { notas: ['Só o caminho do herói pode purificar as cidades.'] };
        const alvo = [...est.fundadas].sort((a, b) => b.zumbis - a.zumbis)[0];
        if (!alvo || alvo.zumbis === 0) return { notas: ['Não há zumbis para purificar.'] };
        if ((ctx.recursos.pedra || 0) < 15 || (ctx.recursos.agua || 0) < 10) return { notas: ['Faltam 15 pedra e 10 água.'] };
        const voltam = alvo.zumbis;
        alvo.populacao = Math.min(50, alvo.populacao + voltam);
        alvo.zumbis = 0;
        return { notas: [`${alvo.nome} foi purificada: ${voltam} morador(es) voltaram a ser humanos.`], efeitos: { recursos: { pedra: -15, agua: -10 } } };
      },
    },
    fundar: {
      rotulo: `Fundar uma nova cidade (40 madeira e 20 pedra; até ${CIDADES_MAX})`,
      fn(est, ctx) {
        if (est.fundadas.length >= CIDADES_MAX) return { notas: ['Já há cidades demais.'] };
        if ((ctx.recursos.madeira || 0) < 40 || (ctx.recursos.pedra || 0) < 20) return { notas: ['Faltam 40 madeira e 20 pedra.'] };
        est.fundadas = [...est.fundadas, { nome: `Assentamento ${est.fundadas.length + 1}`, populacao: 5, zumbis: 0 }];
        return { notas: ['Um novo assentamento foi fundado.'], efeitos: { recursos: { madeira: -40, pedra: -20 } } };
      },
    },
  },
  resumo: (est) => {
    const pop = est.fundadas.reduce((a, c) => a + c.populacao, 0);
    const zumbis = est.fundadas.reduce((a, c) => a + c.zumbis, 0);
    return `${est.fundadas.length} assentamento(s) · população ${pop}${zumbis ? ` · zumbis ${zumbis}` : ''}${est.surto ? ' · surto ativo' : ''}`;
  },
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
    // Desgaste alto tem efeito: com 80 ou mais, os autômatos param de produzir pedra até a manutenção.
    const gastos = est.desgaste >= 80;
    if (gastos && est.guardioes) notas.push('Os autômatos estão gastos e não produzem pedra: precisam de manutenção.');
    const efeitos = est.guardioes && !gastos ? { recursos: { pedra: est.guardioes } } : {};
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
      rotulo: 'Manter os autômatos (2 peças, zera o desgaste)',
      fn(est, ctx) {
        // Manutenção em peças, não em pedra: com desgaste alto a pedra para de entrar, e a manutenção não podia ser paga.
        if ((ctx.recursos.peca || 0) < 2) return { notas: ['Faltam 2 peças.'] };
        est.desgaste = 0;
        return { notas: ['Os autômatos voltaram a funcionar bem.'], efeitos: { recursos: { peca: -2 } } };
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
