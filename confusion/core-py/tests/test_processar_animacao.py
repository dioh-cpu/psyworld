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

    def test_par_duas_vistas_sem_espelhar_esquerda(self) -> None:
        with tempfile.TemporaryDirectory(prefix="cw_test_2v_") as td:
            raiz = Path(td)
            dir_lat = raiz / "in_lat"
            dir_fc = raiz / "in_fc"
            dir_lat.mkdir()
            dir_fc.mkdir()

            for i, dy in enumerate((0, -2, -2, 0), start=1):
                # 2 vistas laterais (esquerda + direita) com detalhe diferente para provar que esquerda NÃO foi espelhada
                im_lat = Image.new("RGB", (260, 160), (255, 0, 255))
                dr = ImageDraw.Draw(im_lat)
                dr.rectangle([40, 50 + dy, 95, 140], fill=(160, 90, 45))
                dr.rectangle([165, 50 + dy, 220, 140], fill=(160, 90, 45))
                dr.rectangle([195, 65 + dy, 215, 85 + dy], fill=(240, 180, 40))  # marca só na direita
                im_lat.save(dir_lat / f"f{i:02d}.png")

                im_fc = Image.new("RGB", (260, 160), (255, 0, 255))
                dr2 = ImageDraw.Draw(im_fc)
                dr2.rectangle([40, 50 + dy, 95, 140], fill=(150, 85, 45))
                dr2.rectangle([165, 50 + dy, 220, 140], fill=(150, 85, 45))
                im_fc.save(dir_fc / f"f{i:02d}.png")

            saida = raiz / "animacoes"
            MOD.processar_animacao(dir_lat, "par2v", "idle", saida_raiz=saida, fps=8, tamanho=128, vistas=("esquerda", "direita"))
            meta = MOD.processar_animacao(dir_fc, "par2v", "idle", saida_raiz=saida, fps=8, tamanho=128, vistas=("frente", "costas"))
            self.assertEqual(meta["acoes"]["idle"]["esquerda"]["origem"], "direta")
            self.assertEqual(meta["acoes"]["idle"]["direita"]["origem"], "direta")
            self.assertEqual(meta["acoes"]["idle"]["frente"]["origem"], "direta")
            self.assertEqual(meta["acoes"]["idle"]["costas"]["origem"], "direta")

            val = MOD.validar_pasta_especie(saida / "par2v")
            self.assertTrue(val["ok"], f"Validação 2 vistas falhou: {val['erros']}")



def _folha_lateral_topo(cabeca: str, w: int = 480, h: int = 270, frente_h: int = 60) -> Image.Image:
    """Lateral em cima (corpo grosso + cauda longa e fina), frente e costas embaixo (maiores que a lateral)."""
    im = Image.new("RGB", (w, h), (255, 0, 255))
    dr = ImageDraw.Draw(im)
    corte = round(h * 560 / 1080)  # ~140
    y1 = corte - 10
    # corpo/cabeça (40 de altura, 100 de largura) + cauda (6 de altura, 160 de largura)
    if cabeca == "esquerda":
        dr.rectangle([100, y1 - 40, 200, y1], fill=(190, 90, 40)); dr.rectangle([200, y1 - 8, 360, y1 - 2], fill=(190, 90, 40))
    else:
        dr.rectangle([280, y1 - 40, 380, y1], fill=(190, 90, 40)); dr.rectangle([120, y1 - 8, 280, y1 - 2], fill=(190, 90, 40))
    base = h - 8
    dr.rectangle([w // 4 - 25, base - frente_h, w // 4 + 25, base], fill=(165, 92, 48))
    dr.rectangle([3 * w // 4 - 25, base - frente_h, 3 * w // 4 + 25, base], fill=(150, 80, 40))
    return im


class TestLayoutLateralTopo(unittest.TestCase):
    def _rodar(self, cabeca: str, **kw):
        with tempfile.TemporaryDirectory(prefix="cw_test_lt_") as td:
            raiz = Path(td); ent = raiz / "in"; ent.mkdir()
            for i in range(8):
                _folha_lateral_topo(cabeca).save(ent / f"f{i:02d}.png")
            meta = MOD.processar_animacao(ent, "lagartoteste", "idle", saida_raiz=raiz / "out", fps=8, tamanho=128,
                                          vistas=("direita", "frente", "costas"), layout="lateral-topo", **kw)
            return meta

    def test_lateral_virada_para_esquerda_e_invertida_e_registrada(self) -> None:
        meta = self._rodar("esquerda")
        self.assertIn("direita", meta["pipeline"]["idle"]["inversoes"])
        self.assertEqual(meta["acoes"]["idle"]["direita"]["origem"], "invertida")
        self.assertEqual(meta["acoes"]["idle"]["esquerda"]["origem"], "espelhada")
        self.assertEqual(meta["acoes"]["idle"]["frente"]["origem"], "direta")  # frente/costas nunca espelhadas

    def test_lateral_virada_para_direita_nao_inverte(self) -> None:
        meta = self._rodar("direita")
        self.assertEqual(meta["pipeline"]["idle"]["inversoes"], {})
        self.assertEqual(meta["acoes"]["idle"]["direita"]["origem"], "direta")

    def test_forcar_lateral_pelo_readme(self) -> None:
        meta = self._rodar("direita", lateral_aponta="esquerda")
        inv = meta["pipeline"]["idle"]["inversoes"]["direita"]
        self.assertEqual(inv["fonte"], "forcada")

    def test_frente_e_costas_maiores_sao_reduzidas_para_altura_da_lateral(self) -> None:
        fator = self._rodar("direita")["pipeline"]["idle"]["fatorEscala"]
        self.assertEqual(fator["direita"], 1.0)
        self.assertLess(fator["frente"], 1.0)  # frente 60px vs lateral 40px => reduzida (limite 0.7)
        self.assertLess(fator["costas"], 1.0)

    def test_detector_de_direcao_da_cabeca(self) -> None:
        for cab in ("esquerda", "direita"):
            im = MOD.remover_chroma_rgba(_folha_lateral_topo(cab), "magenta")
            aponta, conf = MOD.detectar_direcao_cabeca([im], (0, 0, im.width, 130))
            self.assertEqual(aponta, cab)
            self.assertGreater(conf, 1.25)


if __name__ == "__main__":
    unittest.main()
