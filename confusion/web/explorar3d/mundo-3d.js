// Desenho 3D da natureza do mundo: árvores, pedras e o lago. Usa as posições de mundo.js, e a colisão vem de CAIXAS.
// Primeira versão com formas simples (copa, pinheiro, tronco morto, pedra e lago); a arte em billboard entra depois.
import * as THREE from 'three';
import { ARVORES, PEDRAS, LAGO } from './mundo.js';

const COPA = { Norte: ['#4f8a4a', '#5f9a4f', '#3f7a48'], Sul: ['#3a4a44', '#2e3d3a', '#44503f'], Oeste: ['#4f8a4a', '#6aa35a', '#5f9a4f'] };
const COR_TRONCO = '#6b4a2e';
const COR_MORTA = '#7a7468';
const COR_PINHEIRO = '#2f5d43';
const COR_PEDRA = ['#8a8f99', '#7b7f88', '#9ea3ab'];
const COR_LAGO = '#3f86b8';
const COR_LAGO_BORDA = '#c2b48a';
const COR_LAGO_REFLEXO = '#5fa3cf';

// Monta as formas da natureza. `material(cor)` e `contorno(malha)` vêm de main.js (mesmo estilo de desenho).
export function montarNatureza(scene, material, contorno) {
  const adicionar = (malha) => {
    contorno(malha);
    scene.add(malha);
    return malha;
  };

  for (const a of ARVORES) {
    const grupo = new THREE.Group();
    grupo.position.set(a.x, 0, a.z);
    grupo.rotation.y = a.giro;
    grupo.scale.setScalar(a.escala);

    if (a.tipo === 'morta') {
      const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 3, 5), material(COR_MORTA));
      tronco.position.y = 1.5;
      grupo.add(tronco);
    } else {
      const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 6), material(COR_TRONCO));
      tronco.position.y = 0.8;
      grupo.add(tronco);
      if (a.tipo === 'pinheiro') {
        const copa = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 6), material(COR_PINHEIRO));
        copa.position.y = 2.9;
        grupo.add(copa);
      } else {
        const paleta = COPA[a.regiao] ?? COPA.Norte;
        const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), material(paleta[a.tom % paleta.length]));
        copa.position.y = 2.6;
        grupo.add(copa);
      }
    }
    grupo.children.slice().forEach((m) => contorno(m));   // antes de adicionar os contornos aos filhos
    scene.add(grupo);
  }

  for (const p of PEDRAS) {
    const malha = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material(COR_PEDRA[p.tom]));
    malha.scale.set(p.r, p.altura, p.r);
    malha.position.set(p.x, p.altura * 0.4, p.z);
    malha.rotation.y = p.giro;
    adicionar(malha);
  }

  // lago: anel de borda, água e um reflexo claro. Fica acima do chão da região Oeste.
  const borda = new THREE.Mesh(new THREE.CircleGeometry(1, 48), material(COR_LAGO_BORDA));
  borda.rotation.x = -Math.PI / 2;
  borda.scale.set(LAGO.rx + 0.6, LAGO.rz + 0.6, 1);
  borda.position.set(LAGO.x, 0.025, LAGO.z);
  scene.add(borda);

  const agua = new THREE.Mesh(new THREE.CircleGeometry(1, 48), material(COR_LAGO));
  agua.rotation.x = -Math.PI / 2;
  agua.scale.set(LAGO.rx, LAGO.rz, 1);
  agua.position.set(LAGO.x, 0.045, LAGO.z);
  scene.add(agua);

  const reflexo = new THREE.Mesh(new THREE.CircleGeometry(1, 32), material(COR_LAGO_REFLEXO));
  reflexo.rotation.x = -Math.PI / 2;
  reflexo.scale.set(LAGO.rx * 0.35, LAGO.rz * 0.22, 1);
  reflexo.position.set(LAGO.x - LAGO.rx * 0.25, 0.05, LAGO.z - LAGO.rz * 0.2);
  scene.add(reflexo);
}
