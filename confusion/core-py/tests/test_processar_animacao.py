"""Testes do pipeline de animações tools/processar_animacao.py (dioh292)."""
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = REPO_ROOT / "tools" / "processar_animacao.py"

spec = importlib.util.spec_from_file_location("processar_animacao", SCRIPT_PATH)
assert spec and spec.loader
MOD = importlib.util.module_from_spec(spec)
sys.modules["processar_animacao"] = MOD
spec.loader.exec_module(MOD)


def _desenhar_folha_3_vistas(w: int, h: int, desloc_y: int = 0, chroma: str = "magenta") -> Image.Image:
    bg = (0, 245, 0) if chroma == "verde" else (255, 0, 255)
    im = Image.new("RGB", (w, h), bg)
    dr = ImageDraw.Draw(im)
    # 3 vistas lado a lado (frente, direita, costas) com cores quentes (marrom/laranja/vermelho)
    # A vista direita tem um "focinho" assimétrico à direita para validar o espelhamento na esquerda
    centros = [w // 6, w // 2, (5 * w) // 6]
    base_y = h - 20
    for idx, cx in enumerate(centros):
        dr.rectangle([cx - 26, base_y - 90 + desloc_y, cx + 26, base_y], fill=(165, 92, 48))
        dr.ellipse([cx - 22, base_y - 120 + desloc_y, cx + 22, base_y - 78 + desloc_y], fill=(220, 120, 40))
        if idx == 1:  # direita: detalhe assimétrico à direita
            dr.rectangle([cx + 18, base_y - 106 + desloc_y, cx + 38, base_y - 92 + desloc_y], fill=(235, 65, 45))
    return im


class TestProcessarAnimacao(unittest.TestCase):
    def test_chroma_magenta_preserva_marrons_e_vermelhos(self) -> None:
        img = _desenhar_folha_3_vistas(360, 180, chroma="magenta")
        rgba = MOD.remover_chroma_rgba(img, chroma="magenta")
        # Canto (fundo magenta) deve ficar transparente
        self.assertEqual(rgba.getpixel((2, 2))[3], 0)
        # Centro do corpo marrom deve ficar opaco e preservar tom quente (R > G > B)
        r, g, b, a = rgba.getpixel((60, 130))
        self.assertGreater(a, 240)
        self.assertGreater(r, g)
        self.assertGreater(g, b)

    def test_pipeline_completo_idle_e_andar_4_direcoes_webm_e_webp(self) -> None:
        with tempfile.TemporaryDirectory(prefix="cw_test_anim_") as td:
            raiz = Path(td)
            dir_idle = raiz / "in_idle"
            dir_andar = raiz / "in_andar"
            dir_idle.mkdir()
            dir_andar.mkdir()

            # 4 frames em loop suave (deslocamento 0, -3, -3, 0)
            for i, dy in enumerate((0, -3, -3, 0), start=1):
                _desenhar_folha_3_vistas(360, 180, desloc_y=dy, chroma="magenta").save(dir_idle / f"f{i:02d}.png")
                _desenhar_folha_3_vistas(360, 180, desloc_y=dy * 2, chroma="magenta").save(dir_andar / f"f{i:02d}.png")

            saida = raiz / "animacoes"
            meta_idle = MOD.processar_animacao(dir_idle, "teste-onirico", "idle", saida_raiz=saida, fps=8, tamanho=128)
            meta_andar = MOD.processar_animacao(dir_andar, "teste-onirico", "andar", saida_raiz=saida, fps=8, tamanho=128)

            self.assertEqual(meta_idle["escalaReferencia"], meta_andar["escalaReferencia"])
            pasta = saida / "teste-onirico"
            for ac in ("idle", "andar"):
                for d in ("frente", "direita", "costas", "esquerda"):
                    p_webp = pasta / f"{ac}-{d}.webp"
                    p_webm = pasta / f"{ac}-{d}.webm"
                    self.assertTrue(p_webp.exists(), f"Falta {p_webp.name}")
                    self.assertTrue(p_webm.exists(), f"Falta {p_webm.name}")
                    self.assertLess(p_webp.stat().st_size, 600 * 1024)
                    self.assertLess(p_webm.stat().st_size, 600 * 1024)

            val = MOD.validar_pasta_especie(pasta)
            self.assertTrue(val["ok"], f"Validação falhou: {val['erros']}")
            self.assertEqual(val["erros"], [])


if __name__ == "__main__":
    unittest.main()
