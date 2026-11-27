// Poses de ataque na arena. Cada Onírico ilustrado tem `ataque-0N.png` ao lado da arte da forma N (mesmo quadro e mesma escala;
// todas viradas para a DIREITA). A arena troca para a pose no momento do golpe e volta ao repouso sem piscar: a pose é uma
// segunda imagem, já decodificada, sobreposta à de repouso e alinhada pelo mesmo ponto dos pés; só a visibilidade muda.
import { LINHAS } from '../species.js';

// Caminho da pose de ataque a partir da arte da forma em uso (ou da espécie, nas linhas iniciais). null = sem pose cadastrada.
// Poses com enquadramento diferente da arte de repouso (o corpo encolhe na troca): ficam desligadas até a arte ser refeita
const POSE_DESLIGADA = new Set(['Ignavor', 'Brasinha', 'Ignaraz']);
export function arteAtaque(especie, arte) {
  if (POSE_DESLIGADA.has(especie)) return null;
  if (especie === 'Abyssar') return 'assets/confusion/interface/eventos/halloween/oniricos/abyssar/ataque-03.png';
  const lin = LINHAS.find((l) => l.inicial === especie || l.atual === especie || l.evolucao === especie);
  if (lin) { const f = [lin.inicial, lin.atual, lin.evolucao].indexOf(especie) + 1; return `assets/confusion/interface/estrategia/reinos/existentes/${lin.id}/ataque-0${f}.png`; }
  const m = /^(.*\/)0([123])(?:-[^/]+)?\.(?:png|webp)$/.exec(arte || '');
  return m ? `${m[1]}ataque-0${m[2]}.png` : null;
}

const decodificadas = new Map(); // caminho → Promise<HTMLImageElement|null>
export function carregarPose(src) {
  if (!decodificadas.has(src)) {
    decodificadas.set(src, new Promise((ok) => { const im = new Image(); im.src = src; im.decode().then(() => ok(im), () => ok(null)); }));
  }
  return decodificadas.get(src);
}
// Criaturas cuja pose não existe (preenchido em tempo de execução, para o relatório de pendências)
export const SEM_POSE = new Set();

// Controle de pose de uma unidade na arena. `base` = <img> de repouso já recortada (objectViewBox) pela arena; `bbox` devolve a
// caixa do conteúdo (frações do quadro). lado 'a' fica voltado para a direita; 'i', para a esquerda (espelho).
export function criarPose({ fig, base, src, lado, escalaX = 1, zoom = 1, bbox, especie }) {
  const caminho = `../../../${src}`;
  let ov = null, falhou = false, tempo = 0;
  async function preparar() {
    if (ov || falhou) return Boolean(ov);
    const im = await carregarPose(caminho);
    if (!im) { falhou = true; SEM_POSE.add(especie); return false; }
    ov = im.cloneNode(); ov.className = 'pose-ataque'; ov.alt = ''; ov.draggable = false; fig.append(ov); return true;
  }
  function mostrar(ligar, ms = 0) {
    clearTimeout(tempo);
    if (!ov) { if (ligar) preparar(); return; }
    if (!ligar) { ov.style.visibility = 'hidden'; base.style.visibility = 'visible'; return; }
    const b = bbox(), bw = base.offsetWidth, bh = base.offsetHeight, nw = base.naturalWidth, nh = base.naturalHeight;
    if (!b || !bw || !bh || !nw) return;
    const sx = bw / ((b.x1 - b.x0) * nw), sy = bh / ((b.y1 - b.y0) * nh), W = nw * sx, H = nh * sy, ox = b.x0 * W, oy = b.y0 * H;
    const sinal = lado === 'a' ? 1 : -1;
    ov.style.cssText = `position:absolute;left:${base.offsetLeft - ox}px;top:${base.offsetTop - oy}px;width:${W}px;height:${H}px;max-width:none;object-fit:fill;pointer-events:none;transform-origin:${ox + bw / 2}px ${oy + bh}px;transform:scale(${sinal * Math.abs(escalaX) * zoom},${zoom});visibility:visible`;
    base.style.visibility = 'hidden'; // as duas imagens já estão decodificadas: a troca acontece no mesmo quadro
    if (ms) tempo = setTimeout(() => mostrar(false), ms);
  }
  return { preparar, mostrar, existe: () => Boolean(ov) };
}
