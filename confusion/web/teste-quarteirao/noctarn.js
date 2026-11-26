// Noctarn como personagem controlado (início da campanha em C0 e alternável com Azazel).
// Mesmo contrato de criarAzazel: { malha, atualizar(andando, rot, yaw) }, ancorado pelos pés em y = 0.
import * as THREE from 'three';

export function criarNoctarn(base = '../../../assets/monsters/noctarn/', altura = 3.8 * 1.30) {
  const ALTURA = altura;

  // Vídeos de caminhada (960x540, fundo verde #11E720; corpo vai de y=26 até y=513)
  const VIDEO = { largura: 960, altura: 540, topo: 26, pe: 513 };
  const kVideo = ALTURA / (VIDEO.pe - VIDEO.topo);
  const videos = {};
  const texturas = {};
  for (const nome of ['front', 'left', 'back']) {
    const v = document.createElement('video');
    v.src = `${base}walk-${nome}.mp4`;
    v.loop = true;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0.001;pointer-events:none;';
    document.body.appendChild(v);
    videos[nome] = v;
    texturas[nome] = new THREE.VideoTexture(v);
  }

  let ativo = null;
  const desbloquear = () => {
    for (const nome of ['front', 'left', 'back']) {
      const v = videos[nome];
      if (v.readyState < 2) {
        v.play().then(() => { if (ativo !== nome) v.pause(); }).catch(() => {});
      }
    }
  };
  window.addEventListener('pointerdown', desbloquear, { once: true, passive: true });
  window.addEventListener('keydown', desbloquear, { once: true, passive: true });

  const materialAndar = new THREE.ShaderMaterial({
    uniforms: { map: { value: texturas.front } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        float verde = c.g - max(c.r, c.b);
        float alfa = 1.0 - smoothstep(0.16, 0.34, verde);
        if (alfa < 0.5) discard;
        gl_FragColor = vec4(c.r, min(c.g, max(c.r, c.b) + 0.04), c.b, 1.0);
      }`,
  });

  const larguraAndar = VIDEO.largura * kVideo;
  const andar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialAndar);
  andar.scale.set(larguraAndar, VIDEO.altura * kVideo, 1);
  andar.position.y = (VIDEO.pe - VIDEO.altura / 2) * kVideo;

  // Parado: folha 2560x512 = 4 células de 640x512 (frente, esquerda, direita, costas), patas em y=500
  const PARADO = { largura: 640, altura: 512, topo: 24, pe: 500 };
  const kParado = ALTURA / (PARADO.pe - PARADO.topo);
  const texParado = new THREE.TextureLoader().load(`${base}noctarn-idle-4dir.webp`);
  texParado.colorSpace = THREE.SRGBColorSpace;
  texParado.repeat.set(1 / 4, 1);
  const parado = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texParado, transparent: true, alphaTest: 0.45 })
  );
  parado.scale.set(PARADO.largura * kParado, PARADO.altura * kParado, 1);
  parado.position.y = (PARADO.pe - PARADO.altura / 2) * kParado;

  const malha = new THREE.Group();
  malha.add(andar, parado);

  function pausarVideos() {
    if (ativo) videos[ativo].pause();
    ativo = null;
  }

  let ultima = 0;
  function atualizar(andando, rot, yaw) {
    const mx = Math.sin(rot);
    const mz = Math.cos(rot);
    const paraCamera = mx * Math.sin(yaw) + mz * Math.cos(yaw);
    const paraDireita = mx * Math.cos(yaw) - mz * Math.sin(yaw);
    const linha = Math.abs(paraCamera) >= Math.abs(paraDireita)
      ? (paraCamera >= 0 ? 0 : 3)
      : (paraDireita >= 0 ? 2 : 1);

    if (andando) {
      ultima = linha;
      const fonte = ['front', 'left', 'left', 'back'][linha];
      if (ativo !== fonte) {
        pausarVideos();
        ativo = fonte;
        videos[fonte].play().catch(() => {});
      }
      materialAndar.uniforms.map.value = texturas[fonte];
      andar.scale.x = linha === 2 ? -larguraAndar : larguraAndar;
      andar.visible = videos[fonte].readyState >= 2;
      parado.visible = !andar.visible;
    } else {
      pausarVideos();
      texParado.offset.set(ultima / 4, 0);
      andar.visible = false;
      parado.visible = true;
    }
  }

  return { malha, atualizar, pausar: pausarVideos };
}
