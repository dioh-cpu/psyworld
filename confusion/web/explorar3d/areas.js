// Áreas da ilha para a temática da batalha. Cada área é uma região do mapa e tem nome, o elemento do ambiente e as cores da arena.
// Os temas saem dos nomes das cidades de cada região e são provisórios: ajustar com a história do jogo.
// Código puro, sem three.js e sem DOM.
import { COR } from '../variacoes.js';

export const AREAS = {
  Centro: {
    nome: 'Praça central',
    descricao: 'Encruzilhada da ilha. Piso de pedra, sem elemento dominante.',
    elemento: 'neutro',
    arena: { fundoTopo: '#3c4f6a', fundoBase: '#0c1420', disco: '#4a5566', anel: '#dfe6ee' },
  },
  Norte: {
    nome: 'Bosque do Norte',
    descricao: 'Aldeia Verde, Pedra Alta e Rio Fundo. Mata úmida e vida que brota da terra.',
    elemento: 'planta',
    arena: { fundoTopo: '#2f6b4a', fundoBase: '#08180f', disco: '#2c5a3e', anel: '#9be38a' },
  },
  Leste: {
    nome: 'Vale das Cinzas',
    descricao: 'Vale Cinzento e Monte Brasa. Cinza, pedra e calor de vulcão apagado.',
    elemento: 'terra',
    arena: { fundoTopo: '#6b4a2e', fundoBase: '#1d130a', disco: '#5a4130', anel: '#e0b872' },
  },
  Sul: {
    nome: 'Mata Sombria',
    descricao: 'Mata Sombria, Campo Dourado e Ponte Partida. Sombra densa, com trilhas de luz no campo.',
    elemento: 'trevas',
    arena: { fundoTopo: '#2b1f4f', fundoBase: '#07050f', disco: '#2a2140', anel: '#b78cff' },
  },
  Oeste: {
    nome: 'Lago do Oeste',
    descricao: 'Lago Espelho, Fazenda Mansa e Forte Velho. Água parada e névoa sobre o lago.',
    elemento: 'agua',
    arena: { fundoTopo: '#1f5a8a', fundoBase: '#06182b', disco: '#1d4f77', anel: '#7fdcff' },
  },
};

// Área de uma região do mapa (nome vindo de mundo.js). Fora da ilha, não há área.
export function areaDaRegiao(regiao) {
  if (!regiao) return null;
  return AREAS[regiao] ?? AREAS.Centro;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// Confere se cada área tem o que a cena precisa: elemento válido, cores em hexadecimal e nome.
export function validarAreas(areas = AREAS) {
  const erros = [];
  for (const [chave, a] of Object.entries(areas)) {
    if (!a.nome) erros.push(`${chave}: sem nome`);
    if (!COR[a.elemento]) erros.push(`${chave}: elemento desconhecido (${a.elemento})`);
    for (const [parte, cor] of Object.entries(a.arena || {})) {
      if (!HEX.test(cor)) erros.push(`${chave}: cor inválida em ${parte} (${cor})`);
    }
    for (const parte of ['fundoTopo', 'fundoBase', 'disco', 'anel']) {
      if (!a.arena?.[parte]) erros.push(`${chave}: falta ${parte}`);
    }
  }
  return erros;
}
