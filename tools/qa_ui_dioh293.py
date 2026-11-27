#!/usr/bin/env python3
"""QA de UI (dioh293): mede o contraste WCAG de todo texto visível em cada painel e valida a tela de derrota.

Uso: python3 tools/qa_ui_dioh293.py [--min 4.5]
Saída: JSON com contraste mínimo por painel e resultado de cada botão da derrota. Exit 1 se algo falhar.
"""
from __future__ import annotations

import argparse
import functools
import json
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from e2e_jogador_novo import QuietHandler, ThreadingHTTPServer  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
GAME = "/confusion/web/teste-quarteirao/regiao1.html"
PAINEIS = ["campanhaMini", "torres", "calaboucos", "reliquias", "missoes", "equipe", "oniricos", "cacadas", "guilda"]
# telas fora do regiaoExp: (nome, JS que abre, seletor do modal medido)
EXTRAS = [
    ("passe", "() => window.regiao1.idleUI.abrirTemporada()", "#modal-temporada"),
    ("mochila", "() => window.regiao1.idleUI.abrirMochila('domador')", "#modal-mochila"),
    ("config", "() => window.regiao1.idleUI.abrirConfig()", "#modal-config"),
]
VIEWPORTS = {"1280x720": (1280, 720), "844x390": (844, 390)}

CONTRASTE_JS = r"""
(escopoSel) => {
  const raiz = document.querySelector(escopoSel) || document.body;
  const rgba = (s) => { const m = /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/.exec(s || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const lum = ({ r, g, b }) => { const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fundo = (el) => { const cam = []; let c = el; while (c && c.nodeType === 1) { const bg = rgba(getComputedStyle(c).backgroundColor); if (bg && bg.a > 0.02) { cam.push(bg); if (bg.a >= 0.98) break; } c = c.parentElement; } let r = { r: 15, g: 23, b: 42 }; for (let i = cam.length - 1; i >= 0; i--) { const k = cam[i]; r = { r: k.r * k.a + r.r * (1 - k.a), g: k.g * k.a + r.g * (1 - k.a), b: k.b * k.a + r.b * (1 - k.a) }; } return r; };
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const piores = []; let n = 0;
  for (const el of raiz.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const txt = [...el.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent.trim()).join(' ').trim();
    if (txt.length < 1) continue;
    const st = getComputedStyle(el);
    if (/gradient/.test(st.backgroundImage || '')) continue;
    const fg = rgba(st.color); if (!fg || fg.a < 0.2) continue;
    const bg = fundo(el);
    const fb = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const a = lum(fb), b = lum(bg); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const fs = parseFloat(st.fontSize) || 12; const bold = (parseInt(st.fontWeight, 10) || 400) >= 700;
    const minimo = (fs >= 18 || (bold && fs >= 14)) ? 3 : 4.5;
    n++; piores.push({ ratio: +ratio.toFixed(2), minimo, txt: txt.slice(0, 30), cls: (el.className || '').toString().slice(0, 30) });
  }
  piores.sort((x, y) => x.ratio - y.ratio);
  return { textos: n, ruins: piores.filter((p) => p.ratio < p.minimo).slice(0, 6), pior: piores[0] || null };
}
"""


def abrir_jogo(browser, w, h):
    ctx = browser.new_context(viewport={"width": w, "height": h}, is_mobile=w < 900, has_touch=w < 900)
    page = ctx.new_page()
    return ctx, page


def entrar(page, base):
    page.goto(f"{base}/", wait_until="load", timeout=90000)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.goto(f"{base}/", wait_until="load", timeout=90000)
    page.wait_for_selector("#conta-gate.vis", timeout=15000)
    page.locator('#conta-gate [data-acao="local"]').first.click()
    page.locator('#conta-gate [data-ini="Brasinha"]').first.click()
    page.locator('#conta-gate [data-acao="comecar-local"]').click()
    page.wait_for_selector("#modal-exp.aberto [data-refugio='1']", timeout=15000)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min", type=float, default=4.5)
    args = ap.parse_args()
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    rel = {"contraste": {}, "derrota": {}}
    falhas = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--disable-dev-shm-usage"])
        for nome, (w, h) in VIEWPORTS.items():
            erros = []
            for tentativa in range(4):  # o Chromium headless (SwiftShader) às vezes cai no primeiro carregamento
                ctx, page = abrir_jogo(browser, w, h)
                page.on("pageerror", lambda e: erros.append(str(e)[:120]))
                try:
                    entrar(page, base)
                    break
                except Exception:
                    try:
                        browser.close()
                    except Exception:
                        pass
                    browser = pw.chromium.launch(args=["--disable-dev-shm-usage"])
                    if tentativa == 3:
                        raise
            for p in PAINEIS:
                try:
                    page.evaluate("(p) => window.regiaoExp.abrir(p)", p)
                    page.wait_for_timeout(450)
                    if p == "torres":
                        page.evaluate("() => document.querySelector('[data-tor-un]')?.click()")  # alterna sem falhar se não houver
                    r = page.evaluate(CONTRASTE_JS, "#modal-exp")
                except Exception as e:  # painel indisponível não derruba a varredura
                    r = {"erro": str(e)[:80]}
                rel["contraste"][f"{nome}/{p}"] = r
                if r.get("ruins"):
                    falhas.append(f"contraste {nome}/{p}: {r['ruins'][:2]}")
            for nome_t, abre, sel in EXTRAS:
                try:
                    page.evaluate(abre)
                    page.wait_for_timeout(450)
                    r = page.evaluate(CONTRASTE_JS, sel)
                except Exception as e:
                    r = {"erro": str(e)[:80]}
                rel["contraste"][f"{nome}/{nome_t}"] = r
                if r.get("ruins"):
                    falhas.append(f"contraste {nome}/{nome_t}: {r['ruins'][:2]}")
                if r.get("erro"):
                    falhas.append(f"tela {nome}/{nome_t} não abriu: {r['erro']}")
            # Derrota: dispara o mesmo caminho do jogo (motivo guardado pela tela de batalha)
            for alvo in ["oniricos", "afk", "equipe", "reliquias"]:
                page.evaluate("() => { document.getElementById('res-batalha-overlay')?.remove(); }")
                page.evaluate(
                    """async () => { const m = await import('./regiao1-resultado-ui.js'); window.__cwFimMotivo = 'limite_rodadas';
                    m.mostrarResultadoBatalha({ venceu: false, titulo: '💀 Derrota de teste', save: window.regiao1?.save?.() || window.__save || null, premios: {} }); }"""
                )
                page.wait_for_timeout(200)
                ov = page.locator("#res-batalha-overlay")
                txt = ov.inner_text()
                if alvo == "oniricos":
                    rel["derrota"][f"{nome}/dicas"] = {"invocacoes": "invocações grátis" in txt, "auto": "Auto" in txt, "evolua": "relíquias" in txt, "tempoEsgotado": "Tempo esgotado" in txt}
                    if not all(rel["derrota"][f"{nome}/dicas"].values()):
                        falhas.append(f"derrota {nome}: dicas incompletas {rel['derrota'][f'{nome}/dicas']}")
                    rel["derrota"][f"{nome}/contraste"] = page.evaluate(CONTRASTE_JS, "#res-batalha-overlay")
                    if rel["derrota"][f"{nome}/contraste"]["ruins"]:
                        falhas.append(f"contraste derrota {nome}: {rel['derrota'][f'{nome}/contraste']['ruins'][:2]}")
                ov.locator(f'[data-rb-ir="{alvo}"]').click()
                page.wait_for_timeout(700)
                if alvo == "afk":
                    ok = page.evaluate("() => { const m = document.getElementById('modal-autocaca'); return !!m && getComputedStyle(m).display !== 'none' && m.getBoundingClientRect().width > 0; }")
                else:
                    ok = page.evaluate("() => { const m = document.querySelector('#modal-exp.aberto'); return !!m && m.getBoundingClientRect().width > 0; }")
                rel["derrota"][f"{nome}/botao-{alvo}"] = ok
                if not ok:
                    falhas.append(f"derrota {nome}: botão {alvo} não abriu a tela")
                page.screenshot(path=f"/tmp/derrota_{nome}_{alvo}.png")
            rel["derrota"][f"{nome}/erros_js"] = erros
            if erros:
                falhas.append(f"erros JS {nome}: {erros[:2]}")
            ctx.close()
        browser.close()
    server.shutdown()
    rel["falhas"] = falhas
    print(json.dumps(rel, ensure_ascii=False, indent=1))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
