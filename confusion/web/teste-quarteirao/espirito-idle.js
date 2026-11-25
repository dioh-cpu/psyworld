// Espírito da Floresta jogável. Por direção (frente, esquerda, costas) há um MP4 de idle e um de walk (voo), ambos em
// loop contínuo sem B-frames e com fundo verde. A direita é o clipe da esquerda espelhado. Parado toca o idle; andando
// toca o walk da direção do movimento em relação à tela. Cada clipe tem sua própria geometria (tamanho do quadro,
// centro horizontal do tronco, linha do pé e altura de referência) para manter escala e eixo constantes.
import * as THREE from 'three';

const BASE = '../../../assets/confusion/interface/animacoes/';
const VERSAO_CLIPES = 'loop3';
const DIRECOES = ['frente', 'esquerda', 'esquerda', 'costas'];   // 0 frente, 1 esquerda, 2 direita (= esquerda espelhada), 3 costas
const WALK = ['frente', 'esquerda', 'costas'];

const GEO = {
  'idle-frente':   { largura: 376, altura: 720, pe: 595, centroX: 188, figRef: 500 },
  'idle-esquerda': { largura: 376, altura: 720, pe: 595, centroX: 176, figRef: 500, escalaX: 1.22 },
  'idle-costas':   { largura: 376, altura: 720, pe: 595, centroX: 184, figRef: 500 },
  'walk-frente':   { largura: 560, altura: 720, pe: 582, centroX: 280, figRef: 435 },
  'walk-esquerda': { largura: 560, altura: 720, pe: 568, centroX: 210, figRef: 425 },
  'walk-costas':   { largura: 560, altura: 720, pe: 592, centroX: 290, figRef: 450 },
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
    videos[`idle-${nome}`] = criarVideo(`${BASE}espirito-idle-${nome}.mp4?v=${VERSAO_CLIPES}`);
    if (WALK.includes(nome)) {
      videos[`walk-${nome}`] = criarVideo(`${BASE}espirito-walk-${nome}.mp4?v=${VERSAO_CLIPES}`);
    }
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

  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  let espelhado = false;
  let chaveExibida = 'idle-frente';

  function ajustarGeometria(chave, esp) {
    const g = GEO[chave];
    const escala = altura / g.figRef;
    const sinal = esp ? -1 : 1;
    // Corrige o perfil parado ao redor do tronco, mantendo altura e linha do pé.
    const escalaX = escala * (g.escalaX ?? 1) * sinal;
    sprite.scale.set(g.largura * escalaX, g.altura * escala, 1);
    const dx = (g.largura / 2 - g.centroX) * escalaX;
    sprite.position.set(dx, (g.pe - g.altura / 2) * escala, 0);   // pé em y = 0 e tronco centrado em x = 0
  }
  ajustarGeometria('idle-frente', false);
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

    // Só troca a textura quando o clipe novo já tem quadro, e nunca esconde o personagem depois do primeiro quadro
    if (videos[ativo].readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      material.uniforms.map.value = texturas[ativo];
      chaveExibida = ativo;
      ajustarGeometria(chaveExibida, espelhado);
      sprite.visible = true;
    } else if (sprite.visible && chaveExibida === ativo) {
      ajustarGeometria(chaveExibida, espelhado);
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
