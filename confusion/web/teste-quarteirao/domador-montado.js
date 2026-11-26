// Domador montado (Azazel no Brumacervo) no mapa: folhas recortadas com transparência (sem chroma em tempo real), mesmo contrato
// de criarAzazel: { malha, atualizar(andando, rot, yaw) }, ancorado pelos cascos em y = 0. Quatro direções com clipes próprios
// (frente, esquerda, direita, costas). Caminhada: folha de quadros em grade; repouso: um quadro estável por direção.
// Os números de grade, topo e linha dos cascos vêm do brumacervo.json gerado no recorte.
import * as THREE from 'three';

const DIRS = ['frente', 'esquerda', 'direita', 'costas']; // mesma ordem de quadro do Azazel: 0 frente, 1 esquerda, 2 direita, 3 costas

export function criarDomadorMontado(base, altura, meta) {
  const { celula: { largura: W, altura: H }, colunas: COLS, fps = 24, pe, topo } = meta;
  const k = altura / (pe - topo);                    // altura do conjunto (cabeça do domador até os cascos)
  const carregar = (arq) => { const t = new THREE.TextureLoader().load(`${base}${arq}`); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; return t; };
  const andar = {}, parado = {};
  for (const d of DIRS) {
    const n = meta.direcoes[d].quadros, linhas = Math.ceil(n / COLS), t = carregar(`caminhada-${d}.webp`);
    t.repeat.set(1 / COLS, 1 / linhas); andar[d] = { t, n, linhas };
    parado[d] = carregar(`repouso-${d}.webp`);
  }
  const material = new THREE.MeshBasicMaterial({ map: parado.frente, transparent: true, alphaTest: 0.5 });
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  malha.scale.set(W * k, H * k, 1);
  malha.position.y = (H / 2 - pe) * -k;              // os cascos ficam em y = 0
  const grupo = new THREE.Group(); grupo.add(malha);
  let ultima = 0, t0 = performance.now();
  function atualizar(andando, rot, yaw = 0) {
    const mx = Math.sin(rot), mz = Math.cos(rot);
    const paraCamera = mx * Math.sin(yaw) + mz * Math.cos(yaw), paraDireita = mx * Math.cos(yaw) - mz * Math.sin(yaw);
    const linha = Math.abs(paraCamera) >= Math.abs(paraDireita) ? (paraCamera >= 0 ? 0 : 3) : (paraDireita >= 0 ? 2 : 1);
    if (andando) {
      if (linha !== ultima) t0 = performance.now();
      ultima = linha; const a = andar[DIRS[linha]], q = Math.floor(((performance.now() - t0) / 1000) * fps) % a.n;
      a.t.offset.set((q % COLS) / COLS, 1 - (Math.floor(q / COLS) + 1) / a.linhas);
      if (material.map !== a.t) { material.map = a.t; material.needsUpdate = true; }
    } else {
      const t = parado[DIRS[ultima]]; if (material.map !== t) { material.map = t; material.needsUpdate = true; }
    }
  }
  return { malha: grupo, atualizar };
}
