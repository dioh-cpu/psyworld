import * as THREE from 'three';

export function criarEspiritoIdle(altura) {
  const video = document.createElement('video');
  video.src = '../../../assets/confusion/interface/animacoes/espirito-idle.mp4';
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(video);

  const textura = new THREE.VideoTexture(video);
  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: textura } },
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

  // Escala e âncora fixas para os 240 quadros do MP4 (1280 × 720).
  const escala = altura / 440;
  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1280 * escala, 720 * escala), material);
  sprite.position.set(20 * escala, (624 - 360) * escala, 0);
  const malha = new THREE.Group();
  malha.add(sprite);

  let deveTocar = false;
  function tocar() {
    if (deveTocar && video.paused) video.play().catch(() => {});
  }
  window.addEventListener('pointerdown', tocar, { passive: true });
  window.addEventListener('keydown', tocar);

  function pausar() {
    deveTocar = false;
    video.pause();
  }

  function atualizar(andando) {
    sprite.visible = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const ocioso = !andando && !document.hidden;
    if (ocioso === deveTocar) return;
    if (ocioso) {
      deveTocar = true;
      tocar();
    } else {
      pausar();
    }
  }

  return { malha, atualizar, pausar };
}
