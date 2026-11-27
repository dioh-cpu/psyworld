#!/usr/bin/env python3
"""
Pipeline de animações de Oníricos (Confusion Waves — dioh292).

Converte vídeos do Flow (3 vistas lado a lado: frente, direita, costas, em fundo chroma magenta ou verde)
ou pastas de frames PNG em loops padronizados com transparência, prontos para o dioh293 em:
  assets/confusion/animacoes/<especie>/{idle,andar}-{frente,direita,costas,esquerda}.webm
  assets/confusion/animacoes/<especie>/{idle,andar}-{frente,direita,costas,esquerda}.webp

Recursos:
  - Remoção de chroma (magenta ou verde) com despill fiel a tools/recortar_folha.py (sem manchar marrons/vermelhos)
    e suavização de borda para eliminar franja.
  - Recorte estável das 3 vistas usando a caixa envolvente unificada de todos os frames (sem pulo de câmera).
  - Espelhamento automático de direita -> esquerda.
  - Padronização de canvas, escala compartilhada entre idle e andar (via meta.json) e alinhamento da linha dos pés.
  - Controle automático de peso: meta < 600 KB por loop no celular (ajusta CRF/qualidade se necessário).
  - Modo de conferência (--validar): checa peso < 600 KB, loop sem pulo, ausência de franja de chroma,
    escala/linha dos pés entre idle e andar e espelhamento direita/esquerda.

Uso:
  python3 tools/processar_animacao.py --entrada video.mp4 --especie cervomusgo --acao idle [--chroma magenta|verde] [--fps 12] [--tamanho 256]
  python3 tools/processar_animacao.py --validar assets/confusion/animacoes/cervomusgo
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
SAIDA_PADRAO = REPO_ROOT / "assets" / "confusion" / "animacoes"
VISTAS_ENTRADA = ("frente", "direita", "costas")
TODAS_DIRECOES = ("frente", "direita", "costas", "esquerda")
ACOES_VALIDAS = ("idle", "andar")
LIMITE_KB_CELULAR = 600
MARGEM_PES_RATIO = 0.06  # 6% de folga inferior para a linha dos pés


def remover_chroma_rgba(img: Image.Image, chroma: str = "magenta") -> Image.Image:
    """Remove fundo chroma (magenta ou verde) com despill sem manchar marrons/vermelhos (fiel a recortar_folha.py)."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    src = rgb.tobytes()
    out = bytearray(w * h * 4)

    if chroma == "verde":
        for i in range(0, len(src), 3):
            r, g, b = src[i], src[i + 1], src[i + 2]
            mx = r if r >= b else b
            fundo = g - mx
            a = 255 - (fundo - 40) * 4
            if a < 0:
                a = 0
            elif a > 255:
                a = 255
            ng = mx if g > mx else g
            j = (i // 3) * 4
            out[j] = r
            out[j + 1] = ng
            out[j + 2] = b
            out[j + 3] = a
    else:
        for i in range(0, len(src), 3):
            r, g, b = src[i], src[i + 1], src[i + 2]
            mn = r if r <= b else b
            fundo = mn - g
            a = 255 - (fundo - 40) * 4
            if a < 0:
                a = 0
            elif a > 255:
                a = 255
            if b > g:
                nb = g
                lim_r = g + (r - b if r > b else 0) + 30
                nr = lim_r if r > lim_r else r
                if nr > 255:
                    nr = 255
            else:
                nr = r
                nb = b
            j = (i // 3) * 4
            out[j] = nr
            out[j + 1] = g
            out[j + 2] = nb
            out[j + 3] = a

    res = Image.frombytes("RGBA", (w, h), bytes(out))
    # Erosão leve + desfoque no canal alfa para eliminar franja residual
    alfa = res.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    res.putalpha(alfa)
    return res


def detectar_faixas_horizontais(
    frames_rgba: list[Image.Image],
    qtd_vistas: int = 3,
    minimo_largura: int = 16,
) -> list[tuple[int, int]]:
    """Encontra N faixas horizontais (ex.: 2 ou 3 vistas) unindo a máscara alfa de todos os frames."""
    w, h = frames_rgba[0].size
    col_ativa = [False] * w
    for fr in frames_rgba:
        alfa = fr.getchannel("A").tobytes()
        for y in range(0, h, 2):
            off = y * w
            for x in range(w):
                if not col_ativa[x] and alfa[off + x] > 128:
                    col_ativa[x] = True

    faixas: list[tuple[int, int]] = []
    ini: int | None = None
    for x, ativo in enumerate(col_ativa):
        if ativo and ini is None:
            ini = x
        elif not ativo and ini is not None:
            if x - ini >= minimo_largura:
                faixas.append((ini, x))
            ini = None
    if ini is not None and w - ini >= minimo_largura:
        faixas.append((ini, w))

    # Se não separou exatamente em qtd_vistas (ex.: sombras próximas), divide em fatias iguais
    if len(faixas) != qtd_vistas:
        passo = w // max(1, qtd_vistas)
        return [(i * passo, w if i == qtd_vistas - 1 else (i + 1) * passo) for i in range(qtd_vistas)]
    return faixas


def bbox_unificado_faixa(frames_rgba: list[Image.Image], x0: int, x1: int) -> tuple[int, int, int, int]:
    """Calcula a caixa envolvente (left, top, right, bottom) unificada de uma vista ao longo de todo o loop."""
    h = frames_rgba[0].size[1]
    min_x, min_y, max_x, max_y = x1, h, x0, 0
    encontrou = False
    for fr in frames_rgba:
        rec = fr.crop((x0, 0, x1, h))
        bb = rec.getbbox()
        if bb:
            encontrou = True
            min_x = min(min_x, x0 + bb[0])
            min_y = min(min_y, bb[1])
            max_x = max(max_x, x0 + bb[2])
            max_y = max(max_y, bb[3])
    if not encontrou:
        return (x0, 0, x1, h)
    return (min_x, min_y, max_x, max_y)


def enquadrar_alinhado_pes(
    recorte: Image.Image,
    tamanho: int,
    escala: float,
    margem_pes_px: int,
) -> Image.Image:
    """Redimensiona mantendo proporção e alinha a base do personagem na linha fixa dos pés."""
    nw = max(1, round(recorte.width * escala))
    nh = max(1, round(recorte.height * escala))
    red = recorte.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    px = (tamanho - nw) // 2
    py = (tamanho - margem_pes_px) - nh
    canvas.paste(red, (px, py), red)
    return canvas


def extrair_frames_entrada(entrada: Path, fps: int, tmp_dir: Path) -> list[Image.Image]:
    """Extrai frames de um vídeo via ffmpeg ou lê frames PNG/WebP ordenados de uma pasta."""
    if entrada.is_dir():
        arqs = sorted(p for p in entrada.iterdir() if p.is_file() and p.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"})
        if not arqs:
            raise FileNotFoundError(f"Nenhum frame encontrado em {entrada}")
        return [Image.open(p).convert("RGBA") for p in arqs]

    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg não encontrado no PATH; instale ffmpeg ou passe uma pasta de frames PNG.")

    padrao = tmp_dir / "in_%04d.png"
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(entrada), "-vf", f"fps={fps}", str(padrao)]
    subprocess.run(cmd, check=True)
    arqs = sorted(tmp_dir.glob("in_*.png"))
    if not arqs:
        raise RuntimeError(f"ffmpeg não extraiu frames de {entrada}")
    return [Image.open(p).convert("RGBA") for p in arqs]


def exportar_webp_animado(frames: list[Image.Image], destino: Path, fps: int, limite_kb: int = LIMITE_KB_CELULAR) -> float:
    """Salva sequência RGBA como WebP animado em loop respeitando o limite de peso em KB."""
    dur_ms = max(20, round(1000 / max(1, fps)))
    for qualidade in (82, 72, 62, 50, 38):
        frames[0].save(
            destino,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=dur_ms,
            loop=0,
            quality=qualidade,
            method=4,
            lossless=False,
        )
        kb = destino.stat().st_size / 1024.0
        if kb <= limite_kb:
            return round(kb, 1)
    return round(destino.stat().st_size / 1024.0, 1)


def exportar_webm_alfa(frames: list[Image.Image], destino: Path, fps: int, tmp_dir: Path, limite_kb: int = LIMITE_KB_CELULAR) -> float | None:
    """Salva sequência RGBA como WebM VP9 com canal alfa (yuva420p) respeitando o limite de peso em KB."""
    if not shutil.which("ffmpeg"):
        return None
    sub = tmp_dir / f"seq_{destino.stem}"
    sub.mkdir(parents=True, exist_ok=True)
    for idx, fr in enumerate(frames, start=1):
        fr.save(sub / f"f_{idx:04d}.png", format="PNG")

    padrao = sub / "f_%04d.png"
    for crf in (30, 36, 42, 48):
        cmd = [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            str(fps),
            "-i",
            str(padrao),
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-b:v",
            "0",
            "-crf",
            str(crf),
            "-auto-alt-ref",
            "0",
            "-an",
            str(destino),
        ]
        subprocess.run(cmd, check=True)
        kb = destino.stat().st_size / 1024.0
        if kb <= limite_kb:
            return round(kb, 1)
    return round(destino.stat().st_size / 1024.0, 1)


def _recortar_loop_compativel(frames: list[Image.Image], min_frac: float = 0.55) -> list[Image.Image]:
    """Seleciona o sub-ciclo [i..j) mais compatível para fechar caminhada/loop sem pulo na emenda."""
    n = len(frames)
    min_len = max(6, int(n * min_frac))
    if n <= min_len + 1:
        return frames
    thumbs = [fr.resize((48, 48), Image.Resampling.BILINEAR).convert("LA") for fr in frames]
    melhor_score = float("inf")
    melhor_par = (0, n)
    # Limita busca ao início (primeiro terço) e fim (último terço) para manter ~2-3s contínuos
    max_ini = min(n - min_len - 1, max(1, n // 3))
    for i in range(0, max_ini + 1):
        for j in range(i + min_len, n):
            diff = ImageChops.difference(thumbs[i], thumbs[j]).tobytes()
            score = sum(diff) / len(diff)
            if score < melhor_score:
                melhor_score = score
                melhor_par = (i, j)
    i0, j0 = melhor_par
    return frames[i0:j0]


LAYOUTS_VALIDOS = ("lado-a-lado", "lateral-topo")
ALTURA_TOPO_REF = 560 / 1080  # folha 1920x1080: lateral na faixa de cima (1920x560)
LATERAIS = ("direita", "esquerda")


def bbox_unificado_regiao(frames_rgba: list[Image.Image], regiao: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    """Caixa envolvente (left, top, right, bottom, em coordenadas da folha) de uma vista dentro de uma região 2D."""
    x0, y0, x1, y1 = regiao
    min_x, min_y, max_x, max_y = x1, y1, x0, y0
    achou = False
    for fr in frames_rgba:
        bb = fr.crop(regiao).getbbox()
        if bb:
            achou = True
            min_x, min_y = min(min_x, x0 + bb[0]), min(min_y, y0 + bb[1])
            max_x, max_y = max(max_x, x0 + bb[2]), max(max_y, y0 + bb[3])
    return (min_x, min_y, max_x, max_y) if achou else regiao


def regioes_lateral_topo(frames_rgba: list[Image.Image], lateral: str) -> dict[str, tuple[int, int, int, int]]:
    """Layout 3 vistas numa folha: lateral sozinha em cima; frente (metade esquerda) e costas (direita) embaixo."""
    w, h = frames_rgba[0].size
    linhas = [False] * h
    for fr in frames_rgba:
        alfa = fr.getchannel("A").tobytes()
        for y in range(h):
            if not linhas[y]:
                off = y * w
                if any(alfa[off + x] > 128 for x in range(0, w, 3)):
                    linhas[y] = True
    # maior vazio horizontal entre 25% e 75% da altura separa a faixa de cima da de baixo
    melhor, ini = (0, None), None
    for y in range(int(h * 0.25), int(h * 0.75)):
        if not linhas[y]:
            ini = y if ini is None else ini
            if y - ini + 1 > melhor[0]:
                melhor = (y - ini + 1, ini)
        else:
            ini = None
    corte = melhor[1] + melhor[0] // 2 if melhor[0] >= 4 and melhor[1] is not None else round(h * ALTURA_TOPO_REF)
    meio = w // 2
    return {lateral: (0, 0, w, corte), "frente": (0, corte, meio, h), "costas": (meio, corte, w, h)}


def detectar_direcao_cabeca(frames_rgba: list[Image.Image], regiao: tuple[int, int, int, int]) -> tuple[str | None, float]:
    """Para onde a cabeça aponta numa vista lateral. A cauda é a ponta comprida e fina: a ponta mais grossa é a cabeça.

    Retorna (direcao | None, confianca). Sem confiança (< 1.25 de razão de espessura) devolve None.
    """
    x0, y0, x1, y1 = regiao
    alturas: dict[int, int] = {}
    for fr in frames_rgba:
        rec = fr.crop(regiao)
        alfa = rec.getchannel("A").point(lambda v: 255 if v > 128 else 0)
        dados = alfa.tobytes()
        for x in range(0, rec.width, 2):
            n = sum(1 for y in range(rec.height) if dados[y * rec.width + x])
            if n:
                alturas[x] = max(alturas.get(x, 0), n)
    if len(alturas) < 20:
        return None, 1.0
    xs = sorted(alturas)
    larg = xs[-1] - xs[0] + 1
    ponta = max(4, int(larg * 0.2))
    esq = [alturas[x] for x in xs if x < xs[0] + ponta]
    dire = [alturas[x] for x in xs if x > xs[-1] - ponta]
    if not esq or not dire:
        return None, 1.0
    me, md = sum(esq) / len(esq), sum(dire) / len(dire)
    razao = max(me, md) / max(1.0, min(me, md))
    if razao < 1.25:
        return None, razao
    return ("esquerda" if me > md else "direita"), razao


def _escolher_trecho(frames: list[Image.Image], min_frac: float, peso_estabilidade: float = 0.0) -> tuple[int, int]:
    """Escolhe [i, j) com o par de quadros mais parecido; opcionalmente prefere trechos de forma estável (cauda)."""
    n = len(frames)
    min_len = max(6, int(n * min_frac))
    if n <= min_len + 1:
        return (0, n)
    thumbs = [fr.resize((48, 48), Image.Resampling.BILINEAR).convert("LA") for fr in frames]
    larguras = []
    for fr in frames:
        bb = fr.getchannel("A").getbbox()
        larguras.append((bb[2] - bb[0]) if bb else 0)
    melhor, par = float("inf"), (0, n)
    max_ini = min(n - min_len - 1, max(1, n // 3))
    for i in range(0, max_ini + 1):
        for j in range(i + min_len, n):
            diff = ImageChops.difference(thumbs[i], thumbs[j]).tobytes()
            score = sum(diff) / len(diff)
            if peso_estabilidade:
                seg = larguras[i:j]
                media = sum(seg) / max(1, len(seg))
                if media > 0:
                    var = (sum((v - media) ** 2 for v in seg) / len(seg)) ** 0.5
                    score += peso_estabilidade * 100.0 * var / media
            if score < melhor:
                melhor, par = score, (i, j)
    return par


def processar_animacao(
    entrada: Path,
    especie: str,
    acao: str,
    saida_raiz: Path = SAIDA_PADRAO,
    chroma: str = "magenta",
    fps: int = 12,
    tamanho: int = 256,
    limite_kb: int = LIMITE_KB_CELULAR,
    vistas: tuple[str, ...] | list[str] = VISTAS_ENTRADA,
    espelhar_esquerda: bool = True,
    fechar_loop: bool | None = None,
    layout: str = "lado-a-lado",
    lateral_aponta: str | None = None,
) -> dict[str, Any]:
    """Executa o pipeline completo de 1 vídeo (2 ou 3 vistas, idle ou andar) para .webm + .webp.

    Quando `esquerda` já está em `vistas` (ex.: vídeo de 2 vistas `esquerda,direita`), não espelha `direita`.
    Quando um par de vídeos (ex.: `esquerda,direita` + `frente,costas`) é processado em chamadas sucessivas,
    as direções são mescladas em `meta.json` com a mesma escala e linha dos pés.
    """
    if acao not in ACOES_VALIDAS:
        raise ValueError(f"Ação inválida: {acao} (esperado: {ACOES_VALIDAS})")
    lista_vistas = tuple(v.strip().lower() for v in vistas if v.strip())
    if not lista_vistas or any(v not in TODAS_DIRECOES for v in lista_vistas):
        raise ValueError(f"Vistas inválidas: {lista_vistas} (permitidas: {TODAS_DIRECOES})")

    slug = "".join(c for c in especie.strip().lower() if c.isalnum() or c in ("-", "_"))
    pasta_saida = saida_raiz / slug
    pasta_saida.mkdir(parents=True, exist_ok=True)
    meta_path = pasta_saida / "meta.json"
    meta_existente = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}

    with tempfile.TemporaryDirectory(prefix="cw_anim_") as td:
        tmp = Path(td)
        brutos = extrair_frames_entrada(entrada, fps, tmp)
        rgba = [remover_chroma_rgba(fr, chroma=chroma) for fr in brutos]
        if layout not in LAYOUTS_VALIDOS:
            raise ValueError(f"Layout inválido: {layout} (permitidos: {LAYOUTS_VALIDOS})")
        if layout == "lateral-topo":
            lat = next((v for v in lista_vistas if v in LATERAIS), None)
            if lat is None or set(lista_vistas) != {lat, "frente", "costas"}:
                raise ValueError("Layout lateral-topo exige as vistas: <direita|esquerda>,frente,costas")
            regioes = regioes_lateral_topo(rgba, lat)
        else:
            faixas = detectar_faixas_horizontais(rgba, qtd_vistas=len(lista_vistas))
            hh = rgba[0].size[1]
            regioes = {nome: (x0, 0, x1, hh) for nome, (x0, x1) in zip(lista_vistas, faixas)}
        bboxes = {nome: bbox_unificado_regiao(rgba, regioes[nome]) for nome in lista_vistas}

        # DIREÇÃO: a arte oficial aponta para a direita; vira a lateral que veio para o lado errado
        inversoes: dict[str, Any] = {}
        viradas: set[str] = set()
        for nome in lista_vistas:
            if nome not in LATERAIS:
                continue  # frente e costas nunca são espelhadas
            if lateral_aponta in LATERAIS:
                aponta, conf, fonte = lateral_aponta, None, "forcada"
            else:
                aponta, conf = detectar_direcao_cabeca(rgba, regioes[nome]); fonte = "detectada"
            if aponta is not None and aponta != nome:
                viradas.add(nome)
                inversoes[nome] = {"apontavaPara": aponta, "esperado": nome, "fonte": fonte, "confianca": None if conf is None else round(conf, 2)}

        # ESCALA: iguala frente/costas à altura do corpo da lateral (Flow costuma gerar frente/costas 10-15% maiores)
        altura = {n: max(1, bb[3] - bb[1]) for n, bb in bboxes.items()}
        ref_nome = next((n for n in lista_vistas if n in LATERAIS), lista_vistas[0])
        fator = {n: 1.0 for n in lista_vistas}
        if len(lista_vistas) > 1:
            for n in lista_vistas:
                if n != ref_nome and n not in LATERAIS:
                    fator[n] = min(1.15, max(0.7, altura[ref_nome] / altura[n]))

        margem_pes_px = max(4, round(tamanho * MARGEM_PES_RATIO))
        area_util_w = tamanho - 16
        area_util_h = tamanho - margem_pes_px - 12

        # Escala única compartilhada (reutiliza meta.json para manter mesma escala entre pares 03+04 e entre idle/andar)
        max_w = max(max(1, bb[2] - bb[0]) * fator[n] for n, bb in bboxes.items())
        max_h = max(max(1, bb[3] - bb[1]) * fator[n] for n, bb in bboxes.items())
        escala_calc = min(area_util_w / max_w, area_util_h / max_h)
        escala = float(meta_existente.get("escalaReferencia", escala_calc))
        if max_w * escala > tamanho - 4 or max_h * escala > tamanho - margem_pes_px - 2:
            escala = min(escala, escala_calc)

        usar_fechar = (acao == "andar") if fechar_loop is None else bool(fechar_loop)
        sequencias: dict[str, list[Image.Image]] = {}
        origens: dict[str, str] = {}
        for nome in lista_vistas:
            bb = bboxes[nome]
            seq = []
            for fr in rgba:
                rec = fr.crop(bb)
                if nome in viradas:
                    rec = rec.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                seq.append(enquadrar_alinhado_pes(rec, tamanho, escala * fator[nome], margem_pes_px))
            sequencias[nome] = seq
            origens[nome] = "invertida" if nome in viradas else "direta"

        # LOOP: um único trecho [i,j) para todas as vistas (ficam sincronizadas)
        # idle -> par de quadros mais parecido; andar -> trecho de forma estável (cauda) com emenda sem pulo
        trecho = (0, len(rgba))
        if usar_fechar or acao == "idle":
            ref_seq = sequencias[ref_nome]
            trecho = _escolher_trecho(ref_seq, 0.55, 0.15) if acao == "andar" else _escolher_trecho(ref_seq, 0.8, 0.0)
            for nome in lista_vistas:
                sequencias[nome] = sequencias[nome][trecho[0]:trecho[1]]

        # Só espelha direita -> esquerda se esquerda NÃO veio pronta no vídeo
        if espelhar_esquerda and "direita" in sequencias and "esquerda" not in sequencias:
            sequencias["esquerda"] = [
                fr.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for fr in sequencias["direita"]
            ]
            origens["esquerda"] = "espelhada"

        gerados: dict[str, Any] = {}
        for direcao, frames_dir in sequencias.items():
            webp_path = pasta_saida / f"{acao}-{direcao}.webp"
            webm_path = pasta_saida / f"{acao}-{direcao}.webm"
            kb_webp = exportar_webp_animado(frames_dir, webp_path, fps=fps, limite_kb=limite_kb)
            kb_webm = exportar_webm_alfa(frames_dir, webm_path, fps=fps, tmp_dir=tmp, limite_kb=limite_kb)
            gerados[direcao] = {
                "webpKB": kb_webp,
                "webmKB": kb_webm,
                "frames": len(frames_dir),
                "origem": origens[direcao],
            }

        acoes_prev = dict(meta_existente.get("acoes") or {})
        for _d in gerados.values():
            _d["trecho"] = [trecho[0], trecho[1]]
        acoes_prev[acao] = {**(acoes_prev.get(acao) or {}), **gerados}
        pipeline_prev = dict(meta_existente.get("pipeline") or {})
        pipeline_prev[acao] = {"layout": layout, "inversoes": inversoes, "fatorEscala": {n: round(f, 3) for n, f in fator.items()}, "trecho": [trecho[0], trecho[1]]}
        meta_novo = {
            **meta_existente,
            "especie": slug,
            "tamanho": tamanho,
            "fps": fps,
            "chroma": chroma,
            "margemPesPx": margem_pes_px,
            "escalaReferencia": round(escala, 6),
            "acoes": acoes_prev,
            "pipeline": pipeline_prev,
        }
        meta_path.write_text(json.dumps(meta_novo, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return meta_novo


def _carregar_frames_webp(caminho: Path) -> list[Image.Image]:
    frames: list[Image.Image] = []
    with Image.open(caminho) as im:
        n = getattr(im, "n_frames", 1)
        for i in range(n):
            im.seek(i)
            frames.append(im.convert("RGBA"))
    return frames


def _taxa_franja_chroma(img: Image.Image, chroma: str = "magenta") -> float:
    """Retorna a fração de pixels visíveis (a > 64) ainda com forte dominante de chroma na borda."""
    raw = img.convert("RGBA").tobytes()
    visiveis = 0
    manchados = 0
    for i in range(0, len(raw), 4):
        a = raw[i + 3]
        if a <= 64:
            continue
        visiveis += 1
        r, g, b = raw[i], raw[i + 1], raw[i + 2]
        if chroma == "verde":
            if g - max(r, b) > 55:
                manchados += 1
        else:
            if min(r, b) - g > 55:
                manchados += 1
    return (manchados / visiveis) if visiveis else 0.0


def _metricas_bbox(img: Image.Image) -> tuple[int, int]:
    """Retorna (altura_util, y_base_pes) do conteúdo visível de um frame."""
    bb = img.getbbox()
    if not bb:
        return (0, 0)
    return (bb[3] - bb[1], bb[3])


def validar_pasta_especie(pasta: Path, limite_kb: int = LIMITE_KB_CELULAR) -> dict[str, Any]:
    """Confere qualidade das animações geradas: peso, loop sem pulo, sem franja, escala/pés e espelhamento."""
    erros: list[str] = []
    avisos: list[str] = []
    meta_path = pasta / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    chroma = meta.get("chroma", "magenta")

    acoes_encontradas = [
        ac for ac in ACOES_VALIDAS
        if any((pasta / f"{ac}-{d}.webp").exists() or (pasta / f"{ac}-{d}.webm").exists() for d in TODAS_DIRECOES)
    ]
    if not acoes_encontradas:
        erros.append(f"Nenhuma animação encontrada em {pasta}")
        return {"ok": False, "erros": erros, "avisos": avisos, "metricas": {}}

    metricas: dict[str, Any] = {}
    for ac in acoes_encontradas:
        metricas[ac] = {}
        for d in TODAS_DIRECOES:
            p_webp = pasta / f"{ac}-{d}.webp"
            p_webm = pasta / f"{ac}-{d}.webm"
            if not p_webp.exists() and not p_webm.exists():
                erros.append(f"Falta direção obrigatória: {ac}-{d}.{{webm,webp}}")
                continue
            for p_arq in (p_webm, p_webp):
                if p_arq.exists():
                    kb = round(p_arq.stat().st_size / 1024.0, 1)
                    if kb > limite_kb:
                        erros.append(f"{p_arq.name} pesa {kb} KB (limite celular: {limite_kb} KB)")

            if p_webp.exists():
                frs = _carregar_frames_webp(p_webp)
                franja = _taxa_franja_chroma(frs[0], chroma=chroma)
                if franja > 0.02:
                    erros.append(f"{p_webp.name}: franja de chroma residual ({franja * 100:.1f}% > 2%)")
                alt, y_pes = _metricas_bbox(frs[0])
                diff_loop = 0.0
                if len(frs) >= 2:
                    d_img = ImageChops.difference(frs[0], frs[-1])
                    hist = d_img.convert("L").histogram()
                    total_px = frs[0].width * frs[0].height
                    diff_loop = sum(val * cnt for val, cnt in enumerate(hist)) / max(1, total_px * 255.0)
                    if diff_loop > 0.18:
                        avisos.append(f"{p_webp.name}: possível pulo no loop (diff primeiro×último = {diff_loop:.3f})")
                metricas[ac][d] = {
                    "frames": len(frs),
                    "franjaPct": round(franja * 100, 2),
                    "alturaUtil": alt,
                    "yPes": y_pes,
                    "diffLoop": round(diff_loop, 4),
                    "webmKB": round(p_webm.stat().st_size / 1024.0, 1) if p_webm.exists() else None,
                    "webpKB": round(p_webp.stat().st_size / 1024.0, 1),
                }

        # Confere espelhamento direita <-> esquerda apenas quando esquerda foi espelhada (quando veio direta, valida escala e linha dos pés)
        origem_esq = ((meta.get("acoes") or {}).get(ac) or {}).get("esquerda", {}).get("origem", "espelhada")
        p_dir = pasta / f"{ac}-direita.webp"
        p_esq = pasta / f"{ac}-esquerda.webp"
        if p_dir.exists() and p_esq.exists():
            if origem_esq == "direta":
                m_dir = metricas[ac].get("direita", {})
                m_esq = metricas[ac].get("esquerda", {})
                if m_dir.get("alturaUtil") and m_esq.get("alturaUtil"):
                    ratio_lat = abs(m_esq["alturaUtil"] - m_dir["alturaUtil"]) / m_dir["alturaUtil"]
                    if ratio_lat > 0.12:
                        erros.append(f"{ac}: altura divergente entre direita ({m_dir['alturaUtil']}px) e esquerda direta ({m_esq['alturaUtil']}px)")
                if abs(m_esq.get("yPes", 0) - m_dir.get("yPes", 0)) > 8:
                    erros.append(f"{ac}: linha dos pés desalinhada entre direita e esquerda direta")
            else:
                f_dir = _carregar_frames_webp(p_dir)[0].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                f_esq = _carregar_frames_webp(p_esq)[0]
                d_esp = ImageChops.difference(f_dir, f_esq).convert("L").histogram()
                diff_esp = sum(v * c for v, c in enumerate(d_esp)) / max(1, f_dir.width * f_dir.height * 255.0)
                if diff_esp > 0.03:
                    erros.append(f"{ac}: esquerda não espelha direita (diff={diff_esp:.3f})")

    # Confere mesma escala e linha dos pés entre idle e andar
    if "idle" in metricas and "andar" in metricas and "frente" in metricas["idle"] and "frente" in metricas["andar"]:
        m_i = metricas["idle"]["frente"]
        m_a = metricas["andar"]["frente"]
        if m_i["alturaUtil"] > 0:
            ratio = abs(m_a["alturaUtil"] - m_i["alturaUtil"]) / m_i["alturaUtil"]
            if ratio > 0.12:
                erros.append(f"Escala divergente entre idle ({m_i['alturaUtil']}px) e andar ({m_a['alturaUtil']}px)")
        if abs(m_a["yPes"] - m_i["yPes"]) > 8:
            erros.append(f"Linha dos pés desalinhada entre idle (y={m_i['yPes']}) e andar (y={m_a['yPes']})")

    return {"ok": len(erros) == 0, "erros": erros, "avisos": avisos, "metricas": metricas}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Pipeline de animações de Oníricos (Flow -> WebM alfa + WebP animado)")
    parser.add_argument("--entrada", type=Path, help="Vídeo MP4/WebM do Flow ou pasta de frames PNG")
    parser.add_argument("--especie", type=str, help="Slug da espécie (ex.: cervomusgo, brasinha)")
    parser.add_argument("--acao", choices=ACOES_VALIDAS, default="idle", help="Tipo de loop: idle (3-4s) ou andar (2s)")
    parser.add_argument(
        "--vistas",
        type=str,
        default="frente,direita,costas",
        help="Vistas da esquerda para a direita separadas por vírgula (ex.: frente,direita,costas | esquerda,direita | frente,costas)",
    )
    parser.add_argument("--layout", choices=LAYOUTS_VALIDOS, default="lado-a-lado", help="lado-a-lado (vistas em colunas) ou lateral-topo (lateral em cima; frente e costas embaixo)")
    parser.add_argument("--lateral", choices=LATERAIS, default=None, help="Força para onde a lateral da folha aponta (README do lote: 'lateral: esquerda'); omitido = detectar")
    parser.add_argument("--chroma", choices=("magenta", "verde"), default="magenta", help="Cor do fundo chroma")
    parser.add_argument("--fps", type=int, default=12, help="Quadros por segundo de saída (padrão: 12)")
    parser.add_argument("--tamanho", type=int, default=256, help="Tamanho quadrado do canvas em px (padrão: 256)")
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO, help="Pasta raiz de saída")
    parser.add_argument("--sem-validar", action="store_true", help="Não roda --validar ao final (útil no 1º vídeo de um par 2+2 vistas)")
    parser.add_argument("--validar", type=Path, help="Valida uma pasta de espécie já gerada")
    args = parser.parse_args(argv)

    if args.validar:
        res = validar_pasta_especie(args.validar)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res["ok"] else 1

    if not args.entrada or not args.especie:
        parser.error("Informe --entrada e --especie (ou use --validar <pasta>).")

    vistas_tuple = tuple(v.strip().lower() for v in args.vistas.split(",") if v.strip())
    meta = processar_animacao(
        entrada=args.entrada,
        especie=args.especie,
        acao=args.acao,
        saida_raiz=args.saida,
        chroma=args.chroma,
        fps=args.fps,
        tamanho=args.tamanho,
        vistas=vistas_tuple,
        layout=args.layout,
        lateral_aponta=args.lateral,
    )
    pasta = args.saida / meta["especie"]
    if args.sem_validar:
        print(json.dumps({"meta": meta}, indent=2, ensure_ascii=False))
        return 0
    val = validar_pasta_especie(pasta)
    print(json.dumps({"meta": meta, "validacao": val}, indent=2, ensure_ascii=False))
    return 0 if val["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
