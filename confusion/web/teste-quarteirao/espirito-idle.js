// Espírito da Floresta jogável. Por direção (frente, esquerda, costas) há um MP4 de idle e um de walk (voo), ambos em
// loop sem emenda e com fundo verde. A direita é o clipe da esquerda espelhado. Parado toca o idle; andando toca o walk
// da direção do movimento em relação à tela. Cada clipe tem sua própria geometria (tamanho do quadro e linha do pé);
// a escala em pixels é a mesma para todos, então o personagem mantém o tamanho ao trocar de clipe.
import * as THREE from 'three';

const BASE = '../../../assets/confusion/interface/animacoes/';
const DIRECOES = ['frente', 'esquerda', 'esquerda', 'costas'];   // índice = linha (0 frente, 1 esquerda, 2 direita = esquerda espelhada, 3 costas)
const WALK = ['frente', 'esquerda', 'costas'];

// Geometria de cada clipe, em pixels do vídeo: tamanho do quadro e linha do pé (o personagem fica centrado na largura).
// O idle tem 500 px de altura de figura (topo 96, pé 595); isso define a escala em pixels do jogo.
const ALTURA_FIGURA_IDLE = 500;
const GEO = {
  'idle-frente':   { largura: 376, altura: 720, pe: 595 },
  'idle-esquerda': { largura: 376, altura: 720, pe: 595 },
  'idle-costas':   { largura: 376, altura: 720, pe: 595 },
  'walk-frente':   { largura: 560, altura: 720, pe: 593 },
  'walk-esquerda': { largura: 560, altura: 720, pe: 576 },
  'walk-costas':   { largura: 560, altura: 720, pe: 608 },
};

function criarVideo(src) {
  const v = document.createElement('video');
  v.src = src;
  v.loop = true;
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  // Evita display:none, que pausa a decodificação em navegadores móveis
  v.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0.001;pointer-events:none;';
  document.body.appendChild(v);
  return v;
}

export function criarEspiritoIdle(altura) {
  const nomes = ['frente', 'esquerda', 'costas'];
  const videos = {};
  const texturas = {};
  for (const nome of nomes) {
    videos[`idle-${nome}`] = criarVideo(`${BASE}espirito-idle-${nome}.mp4`);
    if (WALK.includes(nome)) videos[`walk-${nome}`] = criarVideo(`${BASE}espirito-walk-${nome}.mp4`);
  }
  for (const k in videos) {
    texturas[k] = new THREE.VideoTexture(videos[k]);
    texturas[k].colorSpace = THREE.SRGBColorSpace;
  }

  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: texturas['idle-frente'] } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        vec3 cor = texture2D(map, vUv).rgb;
        float base = max(cor.r, cor.b);
        float verde = cor.g - base;
        float alfa = 1.0 - smoothstep(0.17, 0.38, verde);
        if (alfa < 0.04) discard;
        // tira o verde do fundo que sobra nas bordas e na pele: perto da borda (alfa baixo) o verde é cortado quase todo;
        // no miolo opaco o verde das folhas fica
        float limite = base + mix(0.02, 0.24, alfa * alfa * alfa);
        cor.g = min(cor.g, limite);
        gl_FragColor = vec4(cor, alfa);
      }`,
  });

  const escala = altura / ALTURA_FIGURA_IDLE;
  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  let espelhado = false;
  function ajustarGeometria(chave) {
    const g = GEO[chave];
    sprite.scale.set(g.largura * escala * (espelhado ? -1 : 1), g.altura * escala, 1);
    sprite.position.set(0, (g.pe - g.altura / 2) * escala, 0);   // o pé fica em y = 0
  }
  ajustarGeometria('idle-frente');
  sprite.visible = false;   // aparece no primeiro quadro pronto
  const malha = new THREE.Group();
  malha.add(sprite);

  let ativo = null;      // chave do vídeo que deve estar tocando
  let ultima = 0;        // última direção do movimento
  let pausado = true;

  function trocar(chave, espelhar) {
    espelhado = espelhar;
    if (ativo === chave && !pausado) {
      if (videos[chave].paused) videos[chave].play().catch(() => {});
      return;
    }
    if (ativo && ativo !== chave) videos[ativo].pause();
    ativo = chave;
    pausado = false;
    const v = videos[chave];
    if (v.paused) v.play().catch(() => {});
  }

  // Desbloqueia o autoplay no primeiro toque/tecla e retoma o vídeo ativo se o navegador o pausou
  function desbloquear() {
    for (const k in videos) {
      const v = videos[k];
      if (v.readyState < 2) v.play().then(() => { if (ativo !== k || pausado) v.pause(); }).catch(() => {});
    }
    if (ativo && !pausado && videos[ativo].paused) videos[ativo].play().catch(() => {});
  }
  window.addEventListener('pointerdown', desbloquear, { passive: true });
  window.addEventListener('keydown', desbloquear);

  function pausar() {
    pausado = true;
    for (const k in videos) videos[k].pause();
  }

  // rot: direção do movimento no mundo (atan2(dx, dz)); yaw: ângulo da câmera em volta do personagem.
  function atualizar(andando, rot = 0, yaw = 0) {
    if (andando) {
      const mx = Math.sin(rot);
      const mz = Math.cos(rot);
      const paraCamera = mx * Math.sin(yaw) + mz * Math.cos(yaw);
      const paraDireita = mx * Math.cos(yaw) - mz * Math.sin(yaw);
      ultima = Math.abs(paraCamera) >= Math.abs(paraDireita)
        ? (paraCamera >= 0 ? 0 : 3)
        : (paraDireita >= 0 ? 2 : 1);
    }
    if (document.hidden) {
      pausar();
      return;
    }
    const nome = DIRECOES[ultima];
    const tipo = andando && WALK.includes(nome) ? 'walk' : 'idle';
    trocar(`${tipo}-${nome}`, ultima === 2);
    // Só troca a imagem quando o clipe novo já tem quadro, e nunca esconde o personagem depois do primeiro quadro:
    // na volta do loop o navegador faz um seek (readyState cai por ~2 quadros) e antes isso fazia o personagem piscar.
    if (videos[ativo].readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      material.uniforms.map.value = texturas[ativo];
      ajustarGeometria(ativo);   // geometria junto com a textura, para não esticar um quadro na troca de clipe
      sprite.visible = true;
    }
  }

  return {
    malha,
    atualizar,
    pausar,
    get direcao() { return ['frente', 'esquerda', 'direita', 'costas'][ultima]; },
    get videoAtivo() { return ativo; },
    videos,
  };
}
