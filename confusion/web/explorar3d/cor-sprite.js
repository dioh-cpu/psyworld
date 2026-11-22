// Material de sprite com giro de cor: matiz, saturação, brilho, e coloração do desenho prateado.
// Usado pela batalha e pelos monstrinhos do mapa. O three.js entra por parâmetro, então o módulo não depende da cena.
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// O giro de matiz segue a matriz de hue-rotate do CSS, para o azul de cá ser o mesmo que no painel.
const FRAG = `
uniform sampler2D map;
uniform float uHue;
uniform float uFlash;
uniform vec3 uCor;
uniform float uAlpha;
uniform float uSat;
uniform float uBri;
uniform float uColorir;
uniform vec3 uTom;
varying vec2 vUv;
vec3 girar(vec3 c, float a) {
  float co = cos(a);
  float si = sin(a);
  vec3 r0 = vec3(0.213 + co * 0.787 - si * 0.213, 0.715 - co * 0.715 - si * 0.715, 0.072 - co * 0.072 + si * 0.928);
  vec3 r1 = vec3(0.213 - co * 0.213 + si * 0.143, 0.715 + co * 0.285 + si * 0.140, 0.072 - co * 0.072 - si * 0.283);
  vec3 r2 = vec3(0.213 - co * 0.213 - si * 0.787, 0.715 - co * 0.715 + si * 0.715, 0.072 + co * 0.928 + si * 0.072);
  return vec3(dot(r0, c), dot(r1, c), dot(r2, c));
}
void main() {
  vec4 t = texture2D(map, vUv);
  vec3 c;
  if (uColorir > 0.5) {
    // desenho prateado: a luminância vira a cor da variação
    float lum = dot(t.rgb, vec3(0.299, 0.587, 0.114));
    c = uTom * lum * 1.6;
  } else {
    c = girar(t.rgb, uHue);
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, uSat) * uBri;
  }
  c = mix(c, uCor, uFlash);
  // a textura sRGB é lida como linear; um ShaderMaterial não converte a saída, então a cor volta para sRGB aqui
  vec3 srgb = mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  gl_FragColor = vec4(srgb, t.a * uAlpha);
  if (gl_FragColor.a < 0.01) discard;
}`;

export const NATURAL = { matiz: 0, sat: 1, bri: 1, colorir: false };

// Cor cheia no matiz pedido (graus): tom usado no modo de coloração.
export function tomDeMatiz(THREE, graus) {
  const h = (((graus % 360) + 360) % 360) / 60;
  const x = 1 - Math.abs((h % 2) - 1);
  const [r, g, b] = h < 1 ? [1, x, 0] : h < 2 ? [x, 1, 0] : h < 3 ? [0, 1, x] : h < 4 ? [0, x, 1] : h < 5 ? [x, 0, 1] : [1, 0, x];
  return new THREE.Vector3(r, g, b);
}

// Material pronto para um sprite. A textura entra depois, em uniforms.map.value.
export function criarMaterialCor(THREE, textura = null) {
  const uniforms = {
    map: { value: textura },
    uHue: { value: 0 },
    uFlash: { value: 0 },
    uCor: { value: new THREE.Color('#ffffff') },
    uAlpha: { value: 1 },
    uSat: { value: 1 },
    uBri: { value: 1 },
    uColorir: { value: 0 },
    uTom: { value: new THREE.Vector3(1, 1, 1) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  return { material, uniforms };
}

// Aplica um giro de cor ({ matiz, sat, bri, colorir }) aos uniforms de um material criado acima.
export function aplicarGiro(THREE, uniforms, g) {
  uniforms.uHue.value = (g.matiz * Math.PI) / 180;
  uniforms.uSat.value = g.sat;
  uniforms.uBri.value = g.bri;
  uniforms.uColorir.value = g.colorir ? 1 : 0;
  uniforms.uTom.value.copy(tomDeMatiz(THREE, g.matiz));
}
