// Sistemas 11 a 20 do catálogo: chefes, herança, civilizações subterrâneas, sonhos, doenças,
// espionagem, guardiões, ilhas, arqueologia e profissões.
import { clamp, escolha } from './util.js';

// 11 — Chefes persistentes. Referência: Hollow Knight e Dark Souls (chefes lembram o que você fez com eles).
const CHEFES = {
  guardiao_nevoa: { nome: 'Guardião da Névoa' },
  rainha_sombras: { nome: 'Rainha das Sombras' },
  espectro_mina: { nome: 'Espectro da Mina' },
  colosso_templo: { nome: 'Colosso do Templo' },
};
const primeiroVivo = (est) => Object.keys(CHEFES).find((c) => est.chefes[c] === 'vivo');
const decidirChefe = (desfecho, fn) => ({
  rotulo: `${desfecho} o primeiro chefe vivo`,
  fn(est, ctx) {
    const id = primeiroVivo(est);
    if (!id) return { notas: ['Não há chefes vivos.'] };
    const r = fn(est, ctx, id);
    if (r.ok) est.chefes[id] = r.estado;
    if (r.ok) est.registro = [...est.registro, `${CHEFES[id].nome}: ${r.estado}`].slice(-10);
    return { notas: [r.nota], efeitos: r.efeitos || {} };
  },
});
const chefesPersistentes = {
  id: '11', nome: 'Chefes persistentes', referencia: 'Hollow Knight (chefes marcados pelo que você fez); Dark Souls (o mundo lembra as escolhas)',
  criar: () => ({ chefes: Object.fromEntries(Object.keys(CHEFES).map((c) => [c, 'vivo'])), registro: [] }),
  dia(est) {
    const notas = [];
    let sanidade = 0;
    for (const [id, estado] of Object.entries(est.chefes)) {
      if (estado === 'purificado') sanidade += 1;
      if (estado === 'corrompido') sanidade -= 1;
    }
    return { notas, efeitos: sanidade ? { sanidade } : {} };
  },
  acoes: {
    derrotar: decidirChefe('Derrotar', () => ({ ok: true, estado: 'derrotado', nota: 'Você venceu o chefe.', efeitos: { diamantes: 15, sanidade: -5 } })),
    purificar: decidirChefe('Purificar', (est, ctx) => (ctx.sanidade < 50 || (ctx.recursos.pedra || 0) < 15
      ? { ok: false, nota: 'Precisa de sanidade 50 e 15 pedra.' }
      : { ok: true, estado: 'purificado', nota: 'O chefe se acalmou e deixou a região em paz.', efeitos: { recursos: { pedra: -15 } } })),
    aprisionar: decidirChefe('Aprisionar', (est, ctx) => ((ctx.recursos.cristal || 0) < 2
      ? { ok: false, nota: 'Precisa de 2 cristal.' }
      : { ok: true, estado: 'aprisionado', nota: 'O chefe foi selado em cristal.', efeitos: { recursos: { cristal: -2 }, diamantes: 5 } })),
    corromper: decidirChefe('Corromper', () => ({ ok: true, estado: 'corrompido', nota: 'O poder do chefe passou para você, com um preço.', efeitos: { sanidade: -4, recursos: { cristal: 3 } } })),
  },
  resumo: (est) => Object.entries(est.chefes).map(([c, s]) => `${CHEFES[c].nome}: ${s}`).join(' · '),
};

// 12 — Herança de monstros. Referência: Pokémon (herança de atributos e movimentos) e Monster Rancher (linhagens).
const TRACOS = ['asas', 'garras', 'escamas', 'chifres', 'cauda longa', 'brilho'];
export const familiaPorSanidade = (sanidade) => (sanidade <= 49 ? 'natural ou mutante' : sanidade === 50 ? 'natural' : 'natural ou abençoada');
export function herdarTracos(tracosPai, tracosMae, r) {
  const uniao = [...new Set([...tracosPai, ...tracosMae])];
  const pool = uniao.length ? uniao : TRACOS;
  const escolhidos = [];
  for (let i = 0; i < 2 && escolhidos.length < pool.length; i++) {
    const t = pool[Math.min(pool.length - 1, Math.floor((r + i * 0.37) % 1 * pool.length))];
    if (!escolhidos.includes(t)) escolhidos.push(t);
  }
  return escolhidos;
}
const heranca = {
  id: '12', nome: 'Herança de monstros', referencia: 'Pokémon (herança de atributos e movimentos); Monster Rancher (linhagens)',
  criar: () => ({ linhagens: [] }),
  dia: () => ({ notas: [] }),
  acoes: {
    registrar_ninhada: {
      rotulo: 'Registrar uma ninhada (2 traços herdados; família pela sanidade)',
      fn(est, ctx) {
        const pai = [TRACOS[Math.floor(ctx.r() * TRACOS.length)]];
        const mae = [TRACOS[Math.floor(ctx.r() * TRACOS.length)]];
        const tracos = herdarTracos(pai, mae, ctx.r());
        const familia = familiaPorSanidade(ctx.sanidade);
        est.linhagens = [...est.linhagens, { dia: ctx.dia, tracos, familia }].slice(-10);
        return { notas: [`Ninhada registrada: ${tracos.join(', ')} (família: ${familia}).`] };
      },
    },
  },
  resumo: (est) => `${est.linhagens.length} ninhada(s) registrada(s)`,
};

// 13 — Civilizações subterrâneas. Referência: Terraria (biomas subterrâneos) e Dwarf Fortress (cidades sob a montanha).
const REGIOES_SUB = {
  rio_subterraneo: { nome: 'Rio Subterrâneo' },
  templo_fundo: { nome: 'Templo do Fundo' },
};
const subterraneo = {
  id: '13', nome: 'Civilizações subterrâneas', referencia: 'Terraria (biomas subterrâneos); Dwarf Fortress (cidades sob a montanha)',
  criar: () => ({ entradas: Object.fromEntries(Object.keys(REGIOES_SUB).map((r) => [r, false])), visitadas: 0 }),
  dia(est, ctx) {
    const notas = [];
    // A ponte fechada (dias 4 a 7, ver bridgeState em core.js) revela uma entrada com 10% ao dia.
    // No último dia fechado, se nada apareceu, uma entrada é revelada: a região não fica inacessível.
    const semEntrada = !Object.values(est.entradas).some(Boolean);
    if (ctx.ponteFechada && (ctx.r() < 0.1 || (ctx.dia === 7 && semEntrada))) {
      const alvo = Object.keys(REGIOES_SUB).find((r) => !est.entradas[r]);
      if (alvo) {
        est.entradas[alvo] = true;
        notas.push(`A mudança na superfície revelou a entrada do ${REGIOES_SUB[alvo].nome}.`);
      }
    }
    return { notas };
  },
  acoes: {
    descer: {
      rotulo: 'Descer à região revelada mais próxima (1 cristal ganho, -1 sanidade)',
      fn(est) {
        const alvo = Object.keys(REGIOES_SUB).find((r) => est.entradas[r]);
        if (!alvo) return { notas: ['Nenhuma entrada foi revelada ainda.'] };
        est.visitadas += 1;
        return { notas: [`Você desceu ao ${REGIOES_SUB[alvo].nome}.`], efeitos: { recursos: { cristal: 1 }, sanidade: -1 } };
      },
    },
  },
  resumo: (est) => `${Object.keys(REGIOES_SUB).filter((r) => est.entradas[r]).length} entrada(s) revelada(s) · ${est.visitadas} visita(s)`,
};

// 14 — Sonhos e pesadelos. Referência: Yume Nikki e Silent Hill 2 (sonhos que pedem interpretação).
const SONHOS = [
  { pergunta: 'Uma porta sem maçaneta. O que você faz?', opcoes: ['Bater', 'Atravessar', 'Ignorar'], correta: 1 },
  { pergunta: 'Um espelho mostra alguém que você não reconhece. Quem é?', opcoes: ['Você mais jovem', 'Uma criatura', 'Ninguém'], correta: 0 },
  { pergunta: 'A chuva cai para cima. O que a chuva quer dizer?', opcoes: ['Algo está voltando', 'Nada', 'Um aviso de perigo'], correta: 0 },
];
const sonhos = {
  id: '14', nome: 'Sonhos e pesadelos', referencia: 'Yume Nikki e Silent Hill 2 (sonhos que pedem interpretação)',
  criar: () => ({ sonho: null, acertos: 0 }),
  dia: () => ({ notas: [] }),
  acoes: {
    sonhar: {
      rotulo: 'Descansar e sonhar (abre uma cena com enigma)',
      fn(est, ctx) {
        if (est.sonho) return { notas: ['Você ainda está no sonho anterior.'] };
        const s = escolha(SONHOS, ctx.r());
        est.sonho = s;
        return { notas: [`Sonho: ${s.pergunta}`] };
      },
    },
    responder: {
      rotulo: 'Responder ao sonho (escolha pela opção)',
      fn(est, ctx, args = {}) {
        if (!est.sonho) return { notas: ['Não há sonho para responder.'] };
        const i = Number(args.opcao);
        const correta = est.sonho.correta === i;
        const sonho = est.sonho;
        est.sonho = null;
        if (correta) est.acertos += 1;
        return { notas: [`Você escolheu "${sonho.opcoes[i]}": ${correta ? 'a mente se acalma' : 'o pesadelo deixa marcas'}.`], efeitos: { sanidade: correta ? 4 : -3 } };
      },
    },
  },
  resumo: (est) => (est.sonho ? `Sonho em aberto: ${est.sonho.pergunta}` : `Sem sonho em aberto · ${est.acertos} acerto(s)`),
};

// 15 — Doenças e pragas. Referência: Stardew Valley (corvos e pragas nas plantações) e RimWorld (doenças que se espalham).
const doencas = {
  id: '15', nome: 'Doenças e pragas', referencia: 'Stardew Valley (pragas nas plantações); RimWorld (doenças que se espalham)',
  criar: () => ({ nivel: 0, ativa: false }),
  dia(est, ctx) {
    const notas = [];
    // Piso de 2%: refúgios reduzem a chance de praga, mas não a eliminam (com 3 refúgios a praga sumia de vez).
    const chance = Math.max(0.02, 0.1 - (ctx.protecaoPragas || 0));
    if (!est.ativa && ctx.r() < chance) { est.ativa = true; est.nivel = 10; notas.push('Uma praga apareceu nas plantações.'); }
    if (est.ativa) est.nivel = clamp(est.nivel + 5, 0, 100);
    return { notas, efeitos: est.ativa ? { recursos: { comida: -1 } } : {} };
  },
  acoes: {
    tratar: {
      rotulo: 'Tratar as plantações (3 raízes, reduz a praga)',
      fn(est, ctx) {
        if (!est.ativa) return { notas: ['Não há praga para tratar.'] };
        if ((ctx.recursos.raizes || 0) < 3) return { notas: ['Faltam 3 raízes.'] };
        est.nivel = clamp(est.nivel - 40, 0, 100);
        if (est.nivel <= 0) est.ativa = false;
        return { notas: ['As plantações foram tratadas.'], efeitos: { recursos: { raizes: -3 } } };
      },
    },
  },
  resumo: (est) => (est.ativa ? `Praga ativa (${est.nivel})` : 'Sem praga'),
};

// 16 — Espionagem e disfarces. Referência: Metal Gear Solid (detecção e disfarce) e Hitman (identidade e suspeita).
const espionagem = {
  id: '16', nome: 'Espionagem e disfarces', referencia: 'Metal Gear Solid (detecção e disfarce); Hitman (identidade e suspeita)',
  criar: () => ({ disfarce: 0, suspeita: 0 }),
  dia(est, ctx) {
    const notas = [];
    est.disfarce = clamp(est.disfarce - 2, 0, 100);
    if (ctx.sanidade < 30) est.suspeita = clamp(est.suspeita + 10, 0, 100);
    else est.suspeita = clamp(est.suspeita - 5, 0, 100);
    if (est.suspeita >= 60 && ctx.r() < 0.2) {
      est.disfarce = 0;
      est.suspeita = 0;
      notas.push('Seus impulsos denunciaram o disfarce.');
      return { notas, efeitos: { sanidade: -2 } };
    }
    return { notas };
  },
  acoes: {
    disfarcar: {
      rotulo: 'Vestir um disfarce (10 madeira, dura pouco)',
      fn(est, ctx) {
        if ((ctx.recursos.madeira || 0) < 10) return { notas: ['Faltam 10 madeira.'] };
        est.disfarce = 60;
        return { notas: ['Você se disfarçou de viajante.'], efeitos: { recursos: { madeira: -10 } } };
      },
    },
    infiltrar: {
      rotulo: 'Infiltrar-se no Culto das Sombras',
      fn(est, ctx) {
        if (est.disfarce <= 0) return { notas: ['Sem disfarce, o Culto percebe você.'] };
        if (ctx.r() < est.disfarce / 100) return { notas: ['Você ouviu o plano do Culto.'], efeitos: { diamantes: 5 } };
        est.disfarce = 0;
        est.suspeita = clamp(est.suspeita + 30, 0, 100);
        return { notas: ['Sua infiltração falhou. O disfarce caiu.'], efeitos: { sanidade: -2 } };
      },
    },
  },
  resumo: (est) => `Disfarce ${est.disfarce} · suspeita ${est.suspeita}`,
};

// 17 — Guardiões ancestrais. Referência: Shadow of the Colossus (guardiões gigantes) e Okami (guardiões que testam quem chega).
const GUARDIOES = {
  norte: { nome: 'Guardião do Norte', forca: 40 },
  sul: { nome: 'Guardião do Sul', forca: 60 },
};
const guardioes = {
  id: '17', nome: 'Guardiões ancestrais', referencia: 'Shadow of the Colossus (guardiões gigantes); Okami (guardiões que testam quem chega)',
  criar: () => ({ forca: Object.fromEntries(Object.keys(GUARDIOES).map((g) => [g, GUARDIOES[g].forca])) }),
  dia(est) {
    for (const g of Object.keys(est.forca)) est.forca[g] = clamp(est.forca[g] + 1, 0, 100);
    return { notas: [] };
  },
  acoes: {
    negociar: {
      rotulo: 'Negociar com o guardião mais fraco (10 diamantes, enfraquece o guardião)',
      fn(est, ctx) {
        if ((ctx.diamantes || 0) < 10) return { notas: ['Faltam 10 diamantes.'] };
        const g = Object.keys(est.forca).sort((a, b) => est.forca[a] - est.forca[b])[0];
        est.forca[g] = clamp(est.forca[g] - 10, 0, 100);
        return { notas: [`${GUARDIOES[g].nome} aceitou passar pela região.`], efeitos: { diamantes: -10 } };
      },
    },
    desafiar: {
      rotulo: 'Desafiar o guardião mais fraco (chance pela força; derrota custa sanidade e pode deixar cicatriz)',
      fn(est, ctx) {
        const g = Object.keys(est.forca).sort((a, b) => est.forca[a] - est.forca[b])[0];
        if (ctx.r() * 100 > est.forca[g]) {
          est.forca[g] = clamp(est.forca[g] + 5, 0, 100);
          return { notas: [`${GUARDIOES[g].nome} venceu você.`], efeitos: { sanidade: -3 }, cicatriz: `derrota para ${GUARDIOES[g].nome}` };
        }
        est.forca[g] = clamp(est.forca[g] - 20, 0, 100);
        return { notas: [`Você venceu ${GUARDIOES[g].nome}.`], efeitos: { recursos: { cristal: 2 } } };
      },
    },
  },
  resumo: (est) => Object.entries(est.forca).map(([g, f]) => `${GUARDIOES[g].nome} ${f}`).join(' · '),
};

// 18 — Oceanos e ilhas. Referência: The Legend of Zelda: The Wind Waker (mar, ilhas e marés) e Animal Crossing (ilhas).
const ilhas = {
  id: '18', nome: 'Oceanos e ilhas', referencia: 'The Legend of Zelda: The Wind Waker (mar, ilhas e marés); Animal Crossing (ilhas)',
  criar: () => ({ mare: 'alta', barco: false, visitas: 0 }),
  dia(est, ctx) {
    est.mare = ctx.dia % 2 === 0 ? 'baixa' : 'alta';
    return { notas: est.mare === 'baixa' ? ['A maré baixou: a ilha ficou acessível.'] : [] };
  },
  acoes: {
    construir_barco: {
      rotulo: 'Construir um barco (10 madeira)',
      fn(est, ctx) {
        if (est.barco) return { notas: ['Você já tem um barco.'] };
        if ((ctx.recursos.madeira || 0) < 10) return { notas: ['Faltam 10 madeira.'] };
        est.barco = true;
        return { notas: ['O barco está pronto.'], efeitos: { recursos: { madeira: -10 } } };
      },
    },
    navegar: {
      rotulo: 'Navegar à ilha (precisa de barco e maré baixa)',
      fn(est) {
        if (!est.barco) return { notas: ['Você precisa de um barco.'] };
        if (est.mare !== 'baixa') return { notas: ['A maré está alta demais.'] };
        est.visitas += 1;
        return { notas: ['Você chegou à ilha e colheu frutas.'], efeitos: { recursos: { comida: 2 }, diamantes: 3 } };
      },
    },
  },
  resumo: (est) => `Maré ${est.mare} · ${est.barco ? 'com barco' : 'sem barco'} · ${est.visitas} visita(s)`,
};

// 19 — Arqueologia e relíquias. Referência: The Legend of Zelda: Tears of the Kingdom (relíquias e inscrições) e Uncharted (fragmentos e enigmas).
const arqueologia = {
  id: '19', nome: 'Arqueologia e relíquias', referencia: 'Zelda: Tears of the Kingdom (relíquias e inscrições); Uncharted (fragmentos e enigmas)',
  criar: () => ({ fragmentos: 0, estado: 'oculta' }),
  dia(est, ctx) {
    const notas = [];
    if (est.estado === 'oculta' && est.fragmentos < 3 && ctx.r() < 0.15) {
      est.fragmentos += 1;
      notas.push(`Você achou um fragmento de relíquia (${est.fragmentos}/3).`);
    }
    return { notas };
  },
  acoes: {
    restaurar: {
      rotulo: 'Restaurar a relíquia com 3 fragmentos',
      fn(est) {
        if (est.fragmentos < 3 || est.estado !== 'oculta') return { notas: ['Faltam fragmentos.'] };
        est.estado = 'restaurada';
        return { notas: ['A relíquia voltou a brilhar.'], efeitos: { sanidade: 5, diamantes: 20 } };
      },
    },
    corromper: {
      rotulo: 'Corromper a relíquia com 3 fragmentos (ganha cristal, perde sanidade)',
      fn(est) {
        if (est.fragmentos < 3 || est.estado !== 'oculta') return { notas: ['Faltam fragmentos.'] };
        est.estado = 'corrompida';
        return { notas: ['A relíquia escureceu, e o poder veio com ela.'], efeitos: { sanidade: -5, recursos: { cristal: 5 } } };
      },
    },
  },
  resumo: (est) => `Fragmentos ${est.fragmentos}/3 · relíquia ${est.estado}`,
};

// 20 — Guildas e profissões. Referência: Stardew Valley (níveis de habilidade) e Skyrim (ofícios que evoluem com a prática).
const PROFISSOES = {
  cozinheiro: { nome: 'Cozinheiro', bonus: { comida: 1 } },
  ferreiro: { nome: 'Ferreiro', bonus: { pedra: 1 } },
  alquimista: { nome: 'Alquimista', bonus: { raizes: 1 } },
  fazendeiro: { nome: 'Fazendeiro', bonus: { sementes: 1 } },
};
const nivelDe = (st) => Math.min(5, Math.floor(st.praticas / 3));
const guildas = {
  id: '20', nome: 'Guildas e profissões', referencia: 'Stardew Valley (níveis de habilidade); Skyrim (ofícios que crescem com a prática)',
  criar: () => Object.fromEntries(Object.keys(PROFISSOES).map((p) => [p, { praticas: 0 }])),
  dia(est) {
    const recursos = {};
    for (const [p, st] of Object.entries(est)) {
      if (nivelDe(st) >= 2) for (const [k, v] of Object.entries(PROFISSOES[p].bonus)) recursos[k] = (recursos[k] || 0) + v;
    }
    return { notas: [], efeitos: Object.keys(recursos).length ? { recursos } : {} };
  },
  acoes: {
    praticar: {
      rotulo: 'Praticar uma profissão (escolha pela opção; sobe um nível a cada 3 práticas)',
      fn(est, ctx, args = {}) {
        const p = args.profissao;
        if (!PROFISSOES[p]) return { notas: ['Profissão desconhecida.'] };
        est[p].praticas += 1;
        return { notas: [`${PROFISSOES[p].nome} praticado (nível ${nivelDe(est[p])}).`] };
      },
    },
  },
  resumo: (est) => Object.entries(PROFISSOES).map(([p, d]) => `${d.nome} ${nivelDe(est[p])}`).join(' · '),
};

export const SISTEMAS_11 = [chefesPersistentes, heranca, subterraneo, sonhos, doencas, espionagem, guardioes, ilhas, arqueologia, guildas];
