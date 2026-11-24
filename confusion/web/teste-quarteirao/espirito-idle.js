// Espírito da Floresta jogável. Quatro MP4 curtos (1280×720, fundo verde), um por direção, cada um em loop
// (ida e volta em torno do quadro de frente pura daquela direção, então nunca gira para outro lado):
// frente, esquerda, direita e costas. Andando, toca o clipe da direção do movimento em relação à tela.
// Parado, continua em loop na última direção. Com ?giro=1 na URL, parado volta ao giro completo de 10 s.
import * as THREE from 'three';

const BASE = '../../../assets/confusion/interface/animacoes/';
const DIRECOES = ['frente', 'esquerda', 'direita', 'costas'];   // índice = linha (0 frente, 1 esquerda, 2 direita, 3 costas)

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
  const usarGiro = new URLSearchParams(location.search).get('giro') === '1';
  const videos = {};
  const texturas = {};
  for (const nome of DIRECOES) videos[nome] = criarVideo(`${BASE}espirito-${nome}.mp4`);
  if (usarGiro) videos.giro = criarVideo(`${BASE}espirito-idle.mp4`);
  for (const nome in videos) texturas[nome] = new THREE.VideoTexture(videos[nome]);

  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: texturas.frente } },
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
        float alfa = 1.0 - smoothstep(0.23, 0.48, verde);
        if (alfa < 0.025) discard;
        cor.g = mix(cor.g, min(cor.g, base + 0.05), 1.0 - alfa);
        gl_FragColor = vec4(cor, alfa);
      }`,
  });

  // Escala e âncora fixas para os quadros 1280 × 720 (mesmos dos clipes por direção).
  const escala = altura / 440;
  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1280 * escala, 720 * escala), material);
  sprite.position.set(20 * escala, (624 - 360) * escala, 0);
  const malha = new THREE.Group();
  malha.add(sprite);

  let ativo = null;      // nome do vídeo que deve estar tocando
  let ultima = 0;        // última direção do movimento
  let pausado = true;

  function trocar(nome) {
    if (ativo === nome && !pausado) {
      if (videos[nome].paused) videos[nome].play().catch(() => {});
      return;
    }
    if (ativo && ativo !== nome) videos[ativo].pause();
    ativo = nome;
    pausado = false;
    const v = videos[nome];
    if (v.paused) v.play().catch(() => {});
    material.uniforms.map.value = texturas[nome];
  }

  // Desbloqueia o autoplay no primeiro toque/tecla e retoma o vídeo ativo se o navegador o pausou
  function desbloquear() {
    for (const nome in videos) {
      const v = videos[nome];
      if (v.readyState < 2) v.play().then(() => { if (ativo !== nome || pausado) v.pause(); }).catch(() => {});
    }
    if (ativo && !pausado && videos[ativo].paused) videos[ativo].play().catch(() => {});
  }
  window.addEventListener('pointerdown', desbloquear, { passive: true });
  window.addEventListener('keydown', desbloquear);

  function pausar() {
    pausado = true;
    for (const nome in videos) videos[nome].pause();
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
    trocar(!andando && usarGiro ? 'giro' : DIRECOES[ultima]);
    sprite.visible = videos[ativo].readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  }

  return {
    malha,
    atualizar,
    pausar,
    get direcao() { return DIRECOES[ultima]; },
    get videoAtivo() { return ativo; },
    videos,
  };
}
