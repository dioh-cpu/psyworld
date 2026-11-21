// Mundo 3D: chão com arte por região, areia na costa, estradas, prédios com janelas e telhado, árvores e objetos
// em sprite (recortes de assets/mundo), pedras e lago em forma simples. A colisão vem de CAIXAS (mundo.js).
// Os desenhos de chão, parede e telhado são procedurais (no canvas), iguais em todo carregamento.
import * as THREE from 'three';
import { REGIOES, EDIFICIOS, CIDADES_MUNDO, ARVORES, PEDRAS, LAGO, ESTRADAS, regiaoDe } from './mundo.js';

const COR_TRONCO = '#6b4a2e';
const COR_MORTA = '#7a7468';
const COR_PINHEIRO = '#2f5d43';          // pinheiro: copa de árvore tingida de verde escuro, até ter arte própria
const COR_PEDRA = ['#8a8f99', '#7b7f88', '#9ea3ab'];
const COR_LAGO = '#3f86b8';
const COR_LAGO_BORDA = '#c2b48a';
const COR_LAGO_REFLEXO = '#5fa3cf';
const COR_AREIA = '#d6c08c';
const TAMANHO_TILE = 12;                 // unidades do mundo por repetição da textura do chão
const ALTURA_COPA = { pequena: 3.6, media: 5.0, grande: 6.2 };
const ITENS_NAVIO = [['ancora', 2.2], ['barril', 1.9], ['corda', 1.1], ['madeira-amarrada', 1.5], ['roda', 2.0], ['tabua', 1.0]];

const carregador = new THREE.TextureLoader();
const imagens = new Map();               // caminho -> { tex, sprites }: cada imagem é carregada uma vez

// ---- números e texturas procedurais ----
function gerador(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (texto) => [...texto].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

function texturaDeDesenho(semente, desenhar) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  desenhar(c.getContext('2d'), 256, gerador(semente));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function pontos(g, n, r, cores, quantidade, tamanho) {
  for (let i = 0; i < quantidade; i++) {
    g.fillStyle = cores[Math.floor(r() * cores.length)];
    g.fillRect(r() * n, r() * n, tamanho * (0.5 + r()), tamanho * (0.4 + r() * 0.6));
  }
}
function tufos(g, n, r, cor, quantidade) {
  g.strokeStyle = cor;
  g.lineWidth = 1.5;
  for (let i = 0; i < quantidade; i++) {
    const x = r() * n;
    const y = r() * n;
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(x + k * 2, y);
      g.lineTo(x + k * 3, y - 5 - r() * 4);
      g.stroke();
    }
  }
}
function rachaduras(g, n, r, cor, quantidade) {
  g.strokeStyle = cor;
  g.lineWidth = 1.5;
  for (let i = 0; i < quantidade; i++) {
    let x = r() * n;
    let y = r() * n;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 20;
      y += (r() - 0.5) * 20;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}
function nevoa(g, n, r, cor, quantidade) {
  for (let i = 0; i < quantidade; i++) {
    g.globalAlpha = 0.18 + r() * 0.15;
    g.fillStyle = cor;
    g.beginPath();
    g.arc(r() * n, r() * n, 20 + r() * 30, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

// arte do chão de cada região: praça de pedra, mata escura, vale de cinzas, pradaria e bosque
const ARTE_CHAO = {
  Centro(g, n, r) {
    g.fillStyle = '#8e8b7d';
    g.fillRect(0, 0, n, n);
    const t = n / 4;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = `rgba(255,255,255,${(0.03 + r() * 0.05).toFixed(3)})`;
        g.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
      }
    }
    g.strokeStyle = '#6a675a';
    g.lineWidth = 3;
    for (let k = 0; k <= 4; k++) {
      g.beginPath(); g.moveTo(k * t, 0); g.lineTo(k * t, n); g.stroke();
      g.beginPath(); g.moveTo(0, k * t); g.lineTo(n, k * t); g.stroke();
    }
    pontos(g, n, r, ['#7d7a6c', '#a6a293'], 200, 3);
  },
  Norte(g, n, r) {
    g.fillStyle = '#56685a';
    g.fillRect(0, 0, n, n);
    pontos(g, n, r, ['#466050', '#6b7f6b'], 420, 4);
    tufos(g, n, r, '#3d5244', 110);
  },
  Leste(g, n, r) {
    g.fillStyle = '#8d8064';
    g.fillRect(0, 0, n, n);
    pontos(g, n, r, ['#b0a58a', '#7d7260'], 260, 3);
    rachaduras(g, n, r, '#5f5444', 16);
  },
  Sul(g, n, r) {
    g.fillStyle = '#4d4663';
    g.fillRect(0, 0, n, n);
    pontos(g, n, r, ['#3d3754', '#5b5275'], 380, 4);
    nevoa(g, n, r, '#6a5f86', 8);
  },
  Oeste(g, n, r) {
    g.fillStyle = '#5e7463';
    g.fillRect(0, 0, n, n);
    pontos(g, n, r, ['#7c9476', '#4a5d4f'], 420, 4);
    tufos(g, n, r, '#4a5d4f', 90);
  },
};
const ARTE_ESTRADA = (g, n, r) => {
  g.fillStyle = '#9b7f57';
  g.fillRect(0, 0, n, n);
  pontos(g, n, r, ['#7d6442', '#b59a6e'], 320, 3);
};
const ARTE_AREIA = (g, n, r) => {
  g.fillStyle = COR_AREIA;
  g.fillRect(0, 0, n, n);
  pontos(g, n, r, ['#c4ab74', '#e4d2a6'], 320, 3);
};

// paredes: fiadas de pedra e duas colunas de janelas (algumas acesas) em cada faixa
const cacheParedes = new Map();
function paredeDe(cor) {
  if (!cacheParedes.has(cor)) {
    cacheParedes.set(cor, texturaDeDesenho(hash(cor), (g, n, r) => {
      g.fillStyle = cor;
      g.fillRect(0, 0, n, n);
      g.strokeStyle = 'rgba(0,0,0,0.13)';
      g.lineWidth = 2;
      for (let y = 0; y < n; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(n, y); g.stroke(); }
      for (let y = 36; y < n - 30; y += 96) {
        for (const x of [40, 150]) {
          g.fillStyle = r() < 0.5 ? '#f4d27a' : '#2b3a55';
          g.fillRect(x, y, 42, 50);
          g.fillStyle = '#efe3c2';
          g.fillRect(x - 4, y + 50, 50, 5);
        }
      }
    }));
  }
  return cacheParedes.get(cor);
}

// telhados: fiadas de telha com juntas alternadas
const cacheTelhados = new Map();
function telhadoDe(cor) {
  if (!cacheTelhados.has(cor)) {
    cacheTelhados.set(cor, texturaDeDesenho(hash(cor) + 1, (g, n, r) => {
      g.fillStyle = cor;
      g.fillRect(0, 0, n, n);
      g.strokeStyle = 'rgba(0,0,0,0.22)';
      g.lineWidth = 2;
      for (let y = 0; y < n; y += 18) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(n, y); g.stroke();
        for (let x = (y / 18) % 2 ? 0 : 16; x < n; x += 32) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 18); g.stroke();
        }
      }
      pontos(g, n, r, ['rgba(255,255,255,0.08)'], 60, 6);
    }));
  }
  return cacheTelhados.get(cor);
}

// ---- sprites: uma imagem carregada uma vez e usada em quantos objetos forem preciso ----
const ajustarEscala = (s, altura, img) => s.scale.set((altura * img.width) / img.height, altura, 1);

function spriteArte(caminho, altura, x, z, { cor = '#ffffff' } = {}) {
  let entrada = imagens.get(caminho);
  if (!entrada) {
    entrada = { tex: null, sprites: [] };
    entrada.tex = carregador.load(caminho, (t) => {
      for (const item of entrada.sprites) ajustarEscala(item.s, item.altura, t.image);
    });
    entrada.tex.colorSpace = THREE.SRGBColorSpace;
    imagens.set(caminho, entrada);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: entrada.tex, color: cor, alphaTest: 0.5 }));
  s.center.set(0.5, 0);            // a base do sprite fica no chão
  s.position.set(x, 0, z);
  s.scale.set(altura, altura, 1);  // enquanto a imagem não carrega
  entrada.sprites.push({ s, altura });
  if (entrada.tex.image) ajustarEscala(s, altura, entrada.tex.image);
  return s;
}

// ---- partes do mundo ----
function chao(scene, material) {
  for (const [nome, r] of Object.entries(REGIOES)) {
    const tex = texturaDeDesenho(hash(nome), ARTE_CHAO[nome]);
    tex.repeat.set((r.x1 - r.x0) / TAMANHO_TILE, (r.z1 - r.z0) / TAMANHO_TILE);
    const malha = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), material('#ffffff', tex));
    malha.rotation.x = -Math.PI / 2;
    malha.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
    scene.add(malha);
  }
}

// faixa de areia em cada lado da ilha que dá para o mar (fica um pouco abaixo do chão, então só aparece na borda)
function areia(scene, material) {
  const base = texturaDeDesenho(99, ARTE_AREIA);
  const faixa = (x0, x1, z0, z1, y) => {
    const tex = base.clone();
    tex.repeat.set((x1 - x0) / TAMANHO_TILE, (z1 - z0) / TAMANHO_TILE);
    tex.needsUpdate = true;
    const malha = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), material('#ffffff', tex));
    malha.rotation.x = -Math.PI / 2;
    malha.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    scene.add(malha);
  };
  for (const r of Object.values(REGIOES)) {
    const cx = (r.x0 + r.x1) / 2;
    const cz = (r.z0 + r.z1) / 2;
    if (regiaoDe(cx, r.z0 - 1) === null) faixa(r.x0 - 2, r.x1 + 2, r.z0 - 2, r.z0, -0.12);
    if (regiaoDe(cx, r.z1 + 1) === null) faixa(r.x0 - 2, r.x1 + 2, r.z1, r.z1 + 2, -0.12);
    if (regiaoDe(r.x0 - 1, cz) === null) faixa(r.x0 - 2, r.x0, r.z0 - 2, r.z1 + 2, -0.115);
    if (regiaoDe(r.x1 + 1, cz) === null) faixa(r.x1, r.x1 + 2, r.z0 - 2, r.z1 + 2, -0.115);
  }
}

function estradas(scene, material) {
  const base = texturaDeDesenho(7, ARTE_ESTRADA);
  for (const e of ESTRADAS) {
    const horizontal = e.z0 === e.z1;
    const comprimento = horizontal ? Math.abs(e.x1 - e.x0) : Math.abs(e.z1 - e.z0);
    const tex = base.clone();
    tex.repeat.set(horizontal ? comprimento / 6 : e.largura / 6, horizontal ? e.largura / 6 : comprimento / 6);
    tex.needsUpdate = true;
    const malha = new THREE.Mesh(
      new THREE.PlaneGeometry(horizontal ? comprimento : e.largura, horizontal ? e.largura : comprimento),
      material('#ffffff', tex),
    );
    malha.rotation.x = -Math.PI / 2;
    malha.position.set((e.x0 + e.x1) / 2, 0.015, (e.z0 + e.z1) / 2);
    scene.add(malha);
  }
}

// prédio: caixa com janelas, telhado de quatro águas, porta na frente; a prefeitura tem mastro e bandeira
function predio(scene, material, contorno, e) {
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h, e.d), material('#ffffff', paredeDe(e.cor)));
  corpo.position.set(e.x, e.h / 2, e.z);
  contorno(corpo);
  scene.add(corpo);

  const altoTelhado = e.central ? 1.8 : 1.2;
  const telhado = new THREE.Mesh(
    new THREE.ConeGeometry(Math.hypot(e.w, e.d) / 2, altoTelhado, 4),
    material('#ffffff', telhadoDe(e.telhado)),
  );
  telhado.rotation.y = Math.PI / 4;
  telhado.position.set(e.x, e.h + altoTelhado / 2, e.z);
  contorno(telhado);
  scene.add(telhado);

  const porta = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.12), material('#4a2f1e'));
  porta.position.set(e.x, 0.65, e.z + e.d / 2 + 0.03);
  scene.add(porta);

  if (e.central) {
    const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6), material('#7a5230'));
    mastro.position.set(e.x, e.h + altoTelhado + 1.1, e.z);
    const bandeira = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), material('#c0392b'));
    bandeira.position.set(e.x + 0.5, e.h + altoTelhado + 1.8, e.z);
    scene.add(mastro, bandeira);
  }
}

// árvore: copa em sprite (tamanho pela escala, variação pelo giro); morta em forma simples
function arvore(scene, material, contorno, a, arteDe) {
  if (a.tipo === 'morta') {
    const grupo = new THREE.Group();
    grupo.position.set(a.x, 0, a.z);
    grupo.rotation.y = a.giro;
    grupo.scale.setScalar(a.escala);
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 3, 5), material(COR_MORTA));
    tronco.position.y = 1.5;
    contorno(tronco);
    grupo.add(tronco);
    scene.add(grupo);
    return;
  }
  const tamanho = a.escala < 1.05 ? 'pequena' : a.escala < 1.2 ? 'media' : 'grande';
  const variante = 1 + Math.min(3, Math.floor((a.giro / (Math.PI * 2)) * 4));
  scene.add(spriteArte(arteDe(`arvores/copa-${tamanho}-${variante}.webp`), ALTURA_COPA[tamanho] * a.escala, a.x, a.z, {
    cor: a.tipo === 'pinheiro' ? COR_PINHEIRO : '#ffffff',
  }));
}

function pedra(scene, material, contorno, p) {
  const malha = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material(COR_PEDRA[p.tom]));
  malha.scale.set(p.r, p.altura, p.r);
  malha.position.set(p.x, p.altura * 0.4, p.z);
  malha.rotation.y = p.giro;
  contorno(malha);
  scene.add(malha);
}

// lago: anel de areia, água e um reflexo claro, acima do chão da região Oeste
function lago(scene, material) {
  const borda = new THREE.Mesh(new THREE.CircleGeometry(1, 48), material(COR_LAGO_BORDA));
  borda.rotation.x = -Math.PI / 2;
  borda.scale.set(LAGO.rx + 0.6, LAGO.rz + 0.6, 1);
  borda.position.set(LAGO.x, 0.025, LAGO.z);
  const agua = new THREE.Mesh(new THREE.CircleGeometry(1, 48), material(COR_LAGO));
  agua.rotation.x = -Math.PI / 2;
  agua.scale.set(LAGO.rx, LAGO.rz, 1);
  agua.position.set(LAGO.x, 0.045, LAGO.z);
  const reflexo = new THREE.Mesh(new THREE.CircleGeometry(1, 32), material(COR_LAGO_REFLEXO));
  reflexo.rotation.x = -Math.PI / 2;
  reflexo.scale.set(LAGO.rx * 0.35, LAGO.rz * 0.22, 1);
  reflexo.position.set(LAGO.x - LAGO.rx * 0.25, 0.05, LAGO.z - LAGO.rz * 0.2);
  scene.add(borda, agua, reflexo);
}

// portal de pedra e madeira no começo de cada estrada que sai de uma cidade (passa por cima, sem colisão)
function portais(scene, arteDe) {
  CIDADES_MUNDO.forEach((c, i) => {
    const estrada = ESTRADAS.find((e) => e.x0 === c.x && e.z0 === c.z);
    if (!estrada) return;
    const comprimento = Math.hypot(estrada.x1 - estrada.x0, estrada.z1 - estrada.z0);
    const distancia = Math.min(11, comprimento);
    const dx = (estrada.x1 - estrada.x0) / comprimento;
    const dz = (estrada.z1 - estrada.z0) / comprimento;
    scene.add(spriteArte(arteDe(`portais/portal-${(i % 4) + 1}.webp`), 7, c.x + dx * distancia, c.z + dz * distancia));
  });
}

// peças de navio espalhadas na areia, em pontos da costa (decoração, sem colisão)
function navios(scene, arteDe) {
  let semente = 1;
  const sorteio = () => gerador(semente++)();
  for (const r of Object.values(REGIOES)) {
    const lados = [
      { de: [r.x0, r.z0], ate: [r.x1, r.z0], fora: [0, -1] },
      { de: [r.x0, r.z1], ate: [r.x1, r.z1], fora: [0, 1] },
      { de: [r.x0, r.z0], ate: [r.x0, r.z1], fora: [-1, 0] },
      { de: [r.x1, r.z0], ate: [r.x1, r.z1], fora: [1, 0] },
    ];
    for (const l of lados) {
      const meio = [(l.de[0] + l.ate[0]) / 2, (l.de[1] + l.ate[1]) / 2];
      if (regiaoDe(meio[0] + l.fora[0], meio[1] + l.fora[1]) !== null) continue;   // o outro lado é outra região
      const comprimento = Math.hypot(l.ate[0] - l.de[0], l.ate[1] - l.de[1]);
      const dirX = (l.ate[0] - l.de[0]) / comprimento;
      const dirZ = (l.ate[1] - l.de[1]) / comprimento;
      for (let t = 5; t < comprimento - 4; t += 13) {
        if (sorteio() > 0.4) continue;
        const x = l.de[0] + dirX * t - l.fora[0] * 1.8;
        const z = l.de[1] + dirZ * t - l.fora[1] * 1.8;
        const [nome, altura] = ITENS_NAVIO[Math.floor(sorteio() * ITENS_NAVIO.length)];
        const v = 1 + Math.floor(sorteio() * 4);
        scene.add(spriteArte(arteDe(`navio/${nome}-${v}.webp`), altura, x, z));
      }
    }
  }
}

// Monta o mundo inteiro. `material(cor, mapa)` e `contorno(malha)` vêm de main.js; `raiz` é o caminho até a raiz do site.
export function montarMundo(scene, { material, contorno, raiz = '' }) {
  const arteDe = (nome) => `${raiz}assets/mundo/${nome}`;
  chao(scene, material);
  areia(scene, material);
  estradas(scene, material);
  for (const e of EDIFICIOS) predio(scene, material, contorno, e);
  lago(scene, material);
  for (const a of ARVORES) arvore(scene, material, contorno, a, arteDe);
  for (const p of PEDRAS) pedra(scene, material, contorno, p);
  portais(scene, arteDe);
  navios(scene, arteDe);
}
