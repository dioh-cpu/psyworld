import * as THREE from 'three';

export function adicionarIdleNpc(mesh, url) {
  const video = document.createElement('video');
  video.muted = video.defaultMuted = video.loop = video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;pointer-events:none';
  const textura = new THREE.VideoTexture(video);
  const material = new THREE.ShaderMaterial({
    uniforms: { clipe: { value: textura } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: `
      varying vec2 pixel;
      void main() {
        pixel = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      varying vec2 pixel;
      uniform sampler2D clipe;
      void main() {
        vec3 cor = texture2D(clipe, pixel).rgb;
        float base = max(cor.r, cor.b);
        float alfa = 1.0 - smoothstep(.24, .52, cor.g - base);
        if (alfa < .025) discard;
        cor.g = mix(cor.g, min(cor.g, base + .04), 1.0 - alfa);
        gl_FragColor = vec4(cor, alfa);
      }`,
  });
  const idle = new THREE.Mesh(mesh.geometry.clone(), material);
  idle.renderOrder = mesh.renderOrder;
  idle.visible = false;
  mesh.add(idle);
  let carregado = false;
  let timerEspera = null;
  const mapaCoberto = () => {
    try { if (sessionStorage.getItem('cw-gate-ok') !== '1') return true; } catch {}
    const gate = document.getElementById('conta-gate');
    return Boolean(
      !gate || gate.classList.contains('vis')
      || document.getElementById('modal-exp')?.classList.contains('aberto'),
    );
  };
  const iniciarQuandoVisivel = () => {
    if (carregado) return;
    if (document.hidden || mapaCoberto()) {
      clearTimeout(timerEspera);
      timerEspera = setTimeout(iniciarQuandoVisivel, 1200);
      return;
    }
    carregado = true;
    video.preload = 'auto';
    video.src = url;
    video.play().catch(() => {});
  };
  const tocar = () => {
    if (!carregado) { iniciarQuandoVisivel(); return; }
    if (document.hidden) video.pause();
    else if (video.paused) video.play().catch(() => {});
  };
  const mostrar = () => {
    mesh.material.visible = false;
    idle.visible = true;
  };
  const restaurar = () => {
    mesh.material.visible = true;
    idle.visible = false;
  };
  video.addEventListener('playing', mostrar);
  video.addEventListener('error', restaurar);
  document.addEventListener('visibilitychange', tocar);
  window.addEventListener('pointerdown', tocar, { passive: true });
  window.addEventListener('keydown', tocar);
  document.body.append(video);
  iniciarQuandoVisivel();
  mesh.userData.limparIdle = () => {
    clearTimeout(timerEspera);
    document.removeEventListener('visibilitychange', tocar);
    window.removeEventListener('pointerdown', tocar);
    window.removeEventListener('keydown', tocar);
    video.removeEventListener('playing', mostrar);
    video.removeEventListener('error', restaurar);
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    textura.dispose();
  };
}
