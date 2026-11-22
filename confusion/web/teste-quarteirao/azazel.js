// Azazel no traje de vilão (trevas, gótico). Mesma lógica do jogo principal (criarAzazel em explorar3d/main.js), com a base
// dos arquivos como parâmetro. Andar: vídeos MP4 com fundo verde nas direções frente, esquerda e costas; a direita é o clipe
// da esquerda espelhado. Parado: uma folha com as 4 direções lado a lado. O personagem tem 2,55 de altura visível, com o pé no
// chão. A direção é a do movimento no mundo (não da câmera).
import * as THREE from 'three';

export const ALTURA_JOGADOR = 2.55;

export function criarAzazel(base = 'assets/characters/', altura = ALTURA_JOGADOR) {
  const ALTURA = altura;

  // andar: vídeo de 320x540; a figura vai da linha 26 (topo) até a 533 (pé)
  const VIDEO = { largura: 320, altura: 540, topo: 26, pe: 533 };
  const kVideo = ALTURA / (VIDEO.pe - VIDEO.topo);
  const videos = {};
  const texturas = {};
  for (const nome of ['front', 'left', 'back']) {
    const v = document.createElement('video');
    v.src = `${base}walk-video-v1/gothic-boy-walk-${nome}.mp4`;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.style.display = 'none';
    document.body.appendChild(v);
    videos[nome] = v;
    texturas[nome] = new THREE.VideoTexture(v);
  }
  // o verde do fundo sai no shader: quanto mais verde que o resto, mais transparente; a franja verde é corrigida
  const materialAndar = new THREE.ShaderMaterial({
    uniforms: { map: { value: texturas.front } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        float verde = c.g - max(c.r, c.b);
        float alfa = 1.0 - smoothstep(0.18, 0.34, verde);
        if (alfa < 0.5) discard;
        gl_FragColor = vec4(c.r, min(c.g, max(c.r, c.b) + 0.04), c.b, 1.0);
      }`,
  });
  const larguraAndar = VIDEO.largura * kVideo;
  const andar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialAndar);
  andar.scale.set(larguraAndar, VIDEO.altura * kVideo, 1);
  andar.position.y = (VIDEO.pe - VIDEO.altura / 2) * kVideo;   // o pé fica em y = 0

  // parado: folha 2048x512 com 4 células de 512 (frente, esquerda, direita, costas); topo na linha 21, pé na 501
  const PARADO = { celula: 512, topo: 21, pe: 501 };
  const kParado = ALTURA / (PARADO.pe - PARADO.topo);
  const texParado = new THREE.TextureLoader().load(`${base}idle-video-v1/gothic-boy-basic-4dir.webp`);
  texParado.colorSpace = THREE.SRGBColorSpace;
  texParado.repeat.set(1 / 4, 1);
  const parado = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texParado, alphaTest: 0.5 }));
  parado.scale.set(PARADO.celula * kParado, PARADO.celula * kParado, 1);
  parado.position.y = (PARADO.pe - PARADO.celula / 2) * kParado;

  const malha = new THREE.Group();
  malha.add(andar, parado);

  let ativo = null;   // nome do vídeo que está tocando
  function pausarVideos() {
    if (ativo) videos[ativo].pause();
    ativo = null;
  }
  // rot: direção do movimento no mundo (atan2(dx, dz)); yaw: ângulo da câmera. O quadro vem do movimento em relação à
  // tela: 0 frente (vindo para a câmera), 3 costas, 2 direita, 1 esquerda.
  let ultima = 0;   // último sentido do movimento: é o quadro que fica quando o personagem para
  function atualizar(andando, rot, yaw) {
    const mx = Math.sin(rot);
    const mz = Math.cos(rot);
    const paraCamera = mx * Math.sin(yaw) + mz * Math.cos(yaw);     // a câmera fica em (sin yaw, cos yaw) do personagem
    const paraDireita = mx * Math.cos(yaw) - mz * Math.sin(yaw);    // a direita da tela é (cos yaw, -sin yaw)
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
      andar.scale.x = linha === 2 ? -larguraAndar : larguraAndar;   // direita = esquerda espelhada
      andar.visible = videos[fonte].readyState >= 2;
      parado.visible = !andar.visible;
    } else {
      pausarVideos();
      texParado.offset.set(ultima / 4, 0);   // parado: mantém o último quadro do movimento
      andar.visible = false;
      parado.visible = true;
    }
  }
  return { malha, atualizar };
}
