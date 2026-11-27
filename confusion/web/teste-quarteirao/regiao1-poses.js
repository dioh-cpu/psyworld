// Poses de ataque na arena. Cada Onírico ilustrado tem `ataque-0N.png` ao lado da arte da forma N (mesmo quadro e mesma escala;
// todas viradas para a DIREITA). A arena troca para a pose no momento do golpe e volta ao repouso sem piscar: a pose é uma
// segunda imagem, já decodificada, sobreposta à de repouso e alinhada pelo mesmo ponto dos pés; só a visibilidade muda.
import { LINHAS } from '../species.js';

// Caminho da pose de ataque a partir da arte da forma em uso (ou da espécie, nas linhas iniciais). null = sem pose cadastrada.
// Poses com enquadramento diferente da arte de repouso (o corpo encolhe na troca): ficam desligadas até a arte ser refeita
const POSE_DESLIGADA = new Set(['Ignavor', 'Brasinha', 'Ignaraz']);
export function arteAtaque(especie, arte) {
  if (POSE_DESLIGADA.has(especie)) return null;
  if (especie === 'Abyssar') return null; // a pose antiga não combina com a arte da capa; as habilidades dele são os vídeos
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
    ov = im.cloneNode();
    ov.className = 'pose-ataque';
    ov.alt = '';
    ov.draggable = false;
    ov.style.visibility = 'hidden';
    fig.append(ov);
    return true;
  }
  function mostrar(ligar, ms = 0) {
    clearTimeout(tempo);
    const animAtivo = fig?.dataset?.animAtivo === '1';
    if (animAtivo) {
      // Quando o loop de vídeo estiver tocando, arte parada e pose de ataque permanecem escondidas
      if (fig?.dataset) delete fig.dataset.poseAtiva;
      if (ov) ov.style.visibility = 'hidden';
      if (base) base.style.visibility = 'hidden';
      return;
    }
    if (!ov) { if (ligar) preparar(); return; }
    if (!ligar) {
      if (fig?.dataset) delete fig.dataset.poseAtiva;
      ov.style.visibility = 'hidden';
      if (base) base.style.visibility = 'visible';
      return;
    }
    const b = bbox(), bw = base.offsetWidth, bh = base.offsetHeight, nw = base.naturalWidth, nh = base.naturalHeight;
    if (!b || !bw || !bh || !nw) return;
    const sx = bw / ((b.x1 - b.x0) * nw), sy = bh / ((b.y1 - b.y0) * nh), W = nw * sx, H = nh * sy, ox = b.x0 * W, oy = b.y0 * H;
    const sinal = lado === 'a' ? 1 : -1;
    if (fig?.dataset) fig.dataset.poseAtiva = '1';
    ov.style.cssText = `position:absolute;left:${base.offsetLeft - ox}px;top:${base.offsetTop - oy}px;width:${W}px;height:${H}px;max-width:none;object-fit:fill;pointer-events:none;transform-origin:${ox + bw / 2}px ${oy + bh}px;transform:scale(${sinal * Math.abs(escalaX) * zoom},${zoom});visibility:visible`;
    base.style.visibility = 'hidden'; // as duas imagens já estão decodificadas: a troca acontece no mesmo quadro
    const vLoop = fig?.querySelector?.('video.anim-loop');
    if (vLoop) vLoop.style.visibility = 'hidden';
    if (ms) tempo = setTimeout(() => mostrar(false), ms);
  }
  return { preparar, mostrar, existe: () => Boolean(ov) };
}

// Animações em vídeo transparente (WebM VP9 com alfa) entregues em assets/confusion/animacoes/<especie>/{idle,andar}-{frente,direita,costas,esquerda}.webm.
// Padrão de animações v2:
// - Preferência: 4 vistas (esquerda, direita, frente, costas) — NÃO espelhar quando esquerda existir.
// - Vídeos legados de 3 vistas (sem esquerda): espelhar `direita` SOMENTE se a espécie for simétrica.
// - Mesma escala e linha dos pés (bottom:0 / object-position:center bottom) entre `idle` e `andar`.
// Espécies sem vídeo publicado mantêm a arte parada + pose de ataque sem disparar 404.
// Por forma: '<slug>-f1'/'-f2'/'-f3' (cada evolução tem o próprio loop); '<slug>' sozinho vale para todas as formas
export const ANIMACOES_V2_ESPECIES = new Set(['cervomusgo-f1', 'cervomusgo-f2', 'cervomusgo-f3']);
// Metadados por slug: { temEsquerda?: boolean, simetrica?: boolean } (padrão: temEsquerda=true, simetrica=true)
export const ANIMACOES_V2_META = new Map();

const slugAnim = (esp) => String(esp || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function resolverAnimacaoOnirico(especie, acao = 'idle', direcao = 'direita', forma = null) {
  const base = slugAnim(especie), comForma = forma ? `${base}-f${forma}` : null;
  const sl = comForma && ANIMACOES_V2_ESPECIES.has(comForma) ? comForma : base; // nunca usa o loop de outra forma
  if (!sl || !ANIMACOES_V2_ESPECIES.has(sl)) return null;
  const meta = ANIMACOES_V2_META.get(sl) || {};
  const temEsquerda = meta.temEsquerda !== false;
  const simetrica = meta.simetrica !== false;
  const dir = ['frente', 'costas', 'direita', 'esquerda'].includes(direcao) ? direcao : 'direita';
  if (dir === 'esquerda') {
    if (temEsquerda) {
      return {
        url: `../../../assets/confusion/animacoes/${sl}/${acao}-esquerda.webm`,
        espelhar: false,
        fallbackSimetrico: simetrica ? `../../../assets/confusion/animacoes/${sl}/${acao}-direita.webm` : null,
      };
    }
    if (!simetrica) return null; // criatura assimétrica sem vista esquerda dedicada: não espelhar
    return {
      url: `../../../assets/confusion/animacoes/${sl}/${acao}-direita.webm`,
      espelhar: true,
      fallbackSimetrico: null,
    };
  }
  return {
    url: `../../../assets/confusion/animacoes/${sl}/${acao}-${dir}.webm`,
    espelhar: false,
    fallbackSimetrico: null,
  };
}

export function urlAnimacaoOnirico(especie, acao = 'idle', direcao = 'direita', forma = null) {
  return resolverAnimacaoOnirico(especie, acao, direcao, forma)?.url || null;
}

export function criarLoopAnimacao({ fig, base, especie, lado = 'a', forma = null }) {
  let vid = null, acaoAtual = null, ativo = false, tentouFallback = false;
  const direcaoPadrao = lado === 'i' ? 'esquerda' : 'direita';

  function aplicarTransform(espelhar) {
    if (!vid) return;
    vid.style.transform = `translateX(-50%)${espelhar ? ' scaleX(-1)' : ''}`;
  }

  function sincronizarVisibilidade(ligado) {
    ativo = Boolean(ligado);
    if (ativo) {
      if (fig?.dataset) {
        fig.dataset.animAtivo = '1';
        delete fig.dataset.poseAtiva;
      }
      if (vid) { vid.style.display = 'block'; vid.style.visibility = 'visible'; }
      if (base) base.style.visibility = 'hidden';
      fig?.querySelectorAll?.('img').forEach((im) => { im.style.visibility = 'hidden'; });
    } else {
      if (fig?.dataset) delete fig.dataset.animAtivo;
      if (vid) { vid.style.display = 'none'; vid.style.visibility = 'hidden'; }
      if (base && fig?.dataset?.poseAtiva !== '1') base.style.visibility = 'visible';
    }
  }

  function definirAcao(acao = 'idle', direcao = direcaoPadrao) {
    const res = resolverAnimacaoOnirico(especie, acao, direcao, forma);
    if (!res) return false;
    if (acaoAtual === `${acao}:${direcao}` && vid && ativo) return true;
    acaoAtual = `${acao}:${direcao}`;
    tentouFallback = false;
    if (!vid) {
      vid = document.createElement('video');
      vid.className = 'anim-loop';
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      // Mesma escala e linha dos pés entre idle e caminhada
      vid.style.cssText = 'position:absolute;left:50%;bottom:0;height:100%;width:auto;max-width:100%;object-fit:contain;object-position:center bottom;pointer-events:none;transform:translateX(-50%);display:none;visibility:hidden;z-index:2';
      const aoPronto = () => {
        if (!vid) return;
        sincronizarVisibilidade(true);
        vid.play().catch(() => {});
      };
      vid.addEventListener('canplay', aoPronto);
      vid.addEventListener('playing', aoPronto);
      vid.addEventListener('error', () => {
        if (vid && !tentouFallback && vid.dataset.fallbackSimetrico) {
          tentouFallback = true;
          const fb = vid.dataset.fallbackSimetrico;
          delete vid.dataset.fallbackSimetrico;
          aplicarTransform(true);
          vid.setAttribute('src', fb);
          vid.load();
          return;
        }
        sincronizarVisibilidade(false);
      });
      fig.append(vid);
    }
    aplicarTransform(res.espelhar);
    if (res.fallbackSimetrico) vid.dataset.fallbackSimetrico = res.fallbackSimetrico;
    else delete vid.dataset.fallbackSimetrico;
    if (vid.getAttribute('src') !== res.url) {
      vid.setAttribute('src', res.url);
      vid.load();
    }
    return true;
  }

  function destruir() {
    if (!vid) return;
    sincronizarVisibilidade(false);
    try { vid.pause(); vid.removeAttribute('src'); vid.load(); } catch {}
    vid.remove();
    vid = null;
  }

  return { definirAcao, destruir, ativo: () => ativo };
}

