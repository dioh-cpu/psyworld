// Espírito da Floresta jogável. Por direção (frente, esquerda, costas) há um MP4 de idle e um de walk (voo), ambos em
// loop contínuo sem B-frames, com cauda de 16 quadros (cópia de 0..15) e fundo verde. A direita é o clipe da esquerda
// espelhado. Cada clipe usa deck duplo de <video> para trocar de volta ao quadro 0 durante a cauda, eliminando 100% da
// travada/seek do <video loop> nativo em Chrome, Android e Safari.
import * as THREE from 'three';

const BASE = '../../../assets/confusion/interface/animacoes/';
const VERSAO_CLIPES = 'loop2';
const DIRECOES = ['frente', 'esquerda', 'esquerda', 'costas'];   // 0 frente, 1 esquerda, 2 direita (= esquerda espelhada), 3 costas
const WALK = ['frente', 'esquerda', 'costas'];

// Geometria e duração exata do ciclo (sem a cauda de 16 quadros) de cada clipe em 24 fps.
// O idle tem ~500 px de altura de figura; isso define a escala em pixels do jogo.
const ALTURA_FIGURA_IDLE = 500;
const GEO = {
  'idle-frente':   { largura: 376, altura: 720, pe: 595, loopDur: 55 / 24 },
  'idle-esquerda': { largura: 376, altura: 720, pe: 595, loopDur: 61 / 24 },
  'idle-costas':   { largura: 376, altura: 720, pe: 595, loopDur: 62 / 24 },
  'walk-frente':   { largura: 560, altura: 720, pe: 586, loopDur: 82 / 24 },
  'walk-esquerda': { largura: 560, altura: 720, pe: 576, loopDur: 49 / 24 },
  'walk-costas':   { largura: 560, altura: 720, pe: 584, loopDur: 48 / 24 },
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

// Deck duplo sem costura: o vídeo principal toca 0 -> loopDur; ao entrar na cauda (loopDur .. loopDur + 0.667s,
// idêntica aos quadros 0..15), o deck reserva já pré-carregado no keyframe 0 começa a tocar em fase e assume assim
// que decodifica o primeiro quadro — zero engasgo de seek no navegador.
function criarDeckDuplo(src, loopDur) {
  const decks = [criarVideo(src), criarVideo(src)];
  const texturas = decks.map((v) => {
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });

  let frente = 0;
  let tocando = false;
  let trocando = false;

  const videoFrente = () => decks[frente];
  const texturaFrente = () => texturas[frente];

  function recuarParaZero(v) {
    v.pause();
    try {
      if (v.currentTime > 0.01) v.currentTime = 0;
    } catch {}
  }

  function tocar() {
    tocando = true;
    const vf = decks[frente];
    if (vf.paused) vf.play().catch(() => {});
    if (!trocando) {
      const vb = decks[1 - frente];
      if (!vb.paused || vb.currentTime > 0.02) recuarParaZero(vb);
    }
  }

  function pausar() {
    tocando = false;
    trocando = false;
    decks[0].pause();
    decks[1].pause();
  }

  function atualizarDeck() {
    const vf = decks[frente];
    const vb = decks[1 - frente];
    if (!tocando) return;

    if (vf.paused) vf.play().catch(() => {});

    // Inicia o deck reserva em 0 exatamente quando o deck da frente cruza loopDur (entrando na cauda)
    if (!trocando && vf.currentTime >= loopDur) {
      trocando = true;
      try {
        if (vb.currentTime > 0.02) vb.currentTime = 0;
      } catch {}
      vb.play().catch(() => {});
    }

    if (trocando) {
      if (vb.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !vb.paused && vb.currentTime >= 0.015) {
        const antigo = vf;
        frente = 1 - frente;
        trocando = false;
        recuarParaZero(antigo);
      } else if (vf.currentTime < loopDur * 0.5) {
        // Fallback seguro caso o loop nativo já tenha dado volta antes do reserva acordar
        trocando = false;
        recuarParaZero(vb);
      }
    }
  }

  function desbloquear() {
    for (let i = 0; i < 2; i++) {
      const v = decks[i];
      if (v.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        v.play().then(() => {
          const ehAtivo = tocando && (i === frente || trocando);
          if (!ehAtivo) recuarParaZero(v);
        }).catch(() => {});
      }
    }
    if (tocando && decks[frente].paused) decks[frente].play().catch(() => {});
  }

  return { decks, texturas, videoFrente, texturaFrente, tocar, pausar, atualizarDeck, desbloquear };
}

export function criarEspiritoIdle(altura) {
  const nomes = ['frente', 'esquerda', 'costas'];
  const clipes = {};
  const videos = {};
  for (const nome of nomes) {
    const kIdle = `idle-${nome}`;
    clipes[kIdle] = criarDeckDuplo(`${BASE}espirito-${kIdle}.mp4?v=${VERSAO_CLIPES}`, GEO[kIdle].loopDur);
    videos[kIdle] = clipes[kIdle].decks[0];
    if (WALK.includes(nome)) {
      const kWalk = `walk-${nome}`;
      clipes[kWalk] = criarDeckDuplo(`${BASE}espirito-${kWalk}.mp4?v=${VERSAO_CLIPES}`, GEO[kWalk].loopDur);
      videos[kWalk] = clipes[kWalk].decks[0];
    }
  }

  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: clipes['idle-frente'].texturaFrente() } },
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
  let chaveExibida = 'idle-frente';

  function ajustarGeometria(chave) {
    const g = GEO[chave];
    sprite.scale.set(g.largura * escala * (espelhado ? -1 : 1), g.altura * escala, 1);
    sprite.position.set(0, (g.pe - g.altura / 2) * escala, 0);   // o pé fica em y = 0
  }
  ajustarGeometria('idle-frente');
  sprite.visible = false;   // aparece no primeiro quadro pronto
  const malha = new THREE.Group();
  malha.add(sprite);

  let ativo = null;      // chave do clipe que deve estar tocando
  let ultima = 0;        // última direção do movimento
  let pausado = true;

  function trocar(chave, espelhar) {
    espelhado = espelhar;
    if (ativo === chave && !pausado) {
      clipes[chave].tocar();
      return;
    }
    if (ativo && ativo !== chave) clipes[ativo].pausar();
    ativo = chave;
    pausado = false;
    clipes[chave].tocar();
  }

  // Desbloqueia o autoplay no primeiro toque/tecla e pré-carrega os decks
  function desbloquear() {
    for (const k in clipes) clipes[k].desbloquear();
  }
  window.addEventListener('pointerdown', desbloquear, { passive: true });
  window.addEventListener('keydown', desbloquear);

  function pausar() {
    pausado = true;
    for (const k in clipes) clipes[k].pausar();
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

    const clipe = clipes[ativo];
    clipe.atualizarDeck();
    const vf = clipe.videoFrente();
    if (vf.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      material.uniforms.map.value = clipe.texturaFrente();
      chaveExibida = ativo;
      ajustarGeometria(chaveExibida);
      sprite.visible = true;
    } else if (sprite.visible) {
      // Mantém o espelhamento sincronizado mesmo antes do clipe novo decodificar
      ajustarGeometria(chaveExibida);
    }
  }

  return {
    malha,
    atualizar,
    pausar,
    get direcao() { return ['frente', 'esquerda', 'direita', 'costas'][ultima]; },
    get videoAtivo() { return ativo; },
    videos,
    clipes,
  };
}
