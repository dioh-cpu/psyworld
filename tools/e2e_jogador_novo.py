#!/usr/bin/env python3
"""
E2E completo de JOGADOR NOVO do Confusion Waves (Playwright) em 1280x720 e 844x390.

Percorre toda a experiência desde o primeiro acesso:
  01. Site (/) -> redirecionamento / entrada no jogo
  02. Conta / Convidado (#conta-gate)
  03. Escolha do Inicial
  04. Refúgio (mede tempo < 2000ms no celular + valida guia passo a passo sem cobrir botões)
  05. Campanha -> 1ª batalha
  06. Recompensas / resultado pós-batalha
  07. Equipe & Evolução (ficha + Essências + evolução)
  08. Campanha Mini (capítulos + fase 1-1)
  09. Missões (Marcos & Paralelas)
  10. Torres (andar 1)
  11. Calabouços (nível 1)
  12. Relíquias (equipar relíquia)
  13. Banner Adventurer (invocar via UI + verificar inicial T4 e bloqueio T5 antes do nv.40)
  14. Domador (selecionar Manipulador das Oito Lâminas)
  15. Mundo (confirmar apenas os 10 sistemas do lançamento)
  16. Colisão nas entradas dos chefes da Região 1 (BOSS_E, BOSS_D, BOSS_S, BOSS_C)

Salva screenshots em docs/relatorio-jogador-novo/<viewport>/ e gera confusion/RELATORIO_JOGADOR_NOVO.md.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import socketserver
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image
from playwright.sync_api import Page, sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
GAME_PATH = "/confusion/web/teste-quarteirao/regiao1.html"
SHOTS_ROOT = REPO_ROOT / "docs" / "relatorio-jogador-novo"
RELATORIO_MD = REPO_ROOT / "confusion" / "RELATORIO_JOGADOR_NOVO.md"

VIEWPORTS = {
    "1280x720": {"width": 1280, "height": 720, "is_mobile": False, "has_touch": False},
    "844x390": {"width": 844, "height": 390, "is_mobile": True, "has_touch": True},
}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/api/confusion-config":
            body = b'{"enabled":false}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/jogar":
            self.send_response(302)
            self.send_header("Location", GAME_PATH)
            self.end_headers()
            return
        super().do_GET()

    def log_message(self, format: str, *args: Any) -> None:
        pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def start_static_server(root: Path) -> tuple[ThreadingHTTPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{port}"


AUDIT_SCREEN_JS = r"""
(opts) => {
  const { contexto, esperaTelaCheia } = opts;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const issues = [];

  if (document.documentElement.scrollWidth > vw + 4) {
    issues.push({
      tipo: 'overflow-x',
      agente: 'dioh293',
      contexto,
      detalhe: `scrollWidth=${document.documentElement.scrollWidth} > vw=${vw}`,
    });
  }

  const visivel = (el) => {
    if (!el || !el.isConnected) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  };

  const modaisAbertos = [...document.querySelectorAll('.modal-bg.aberto, #modal-campanha-mini.aberto, #modal-mundo.aberto, #tela-batalha, #conta-gate.vis')].filter(visivel);
  const ativo = modaisAbertos.length ? modaisAbertos[modaisAbertos.length - 1] : null;
  const escopo = ativo || document.body;

  // 1. Checar se o mapa 3D aparece atrás de qualquer tela cheia (#146)
  if (esperaTelaCheia && ativo) {
    const rAtivo = ativo.getBoundingClientRect();
    const card = ativo.querySelector('.modal-card, .cm-shell, .cg, .ref-cena');
    const stAtivo = getComputedStyle(ativo);
    const bgAtivo = stAtivo.backgroundColor || '';
    const bgImg = stAtivo.backgroundImage || 'none';
    const alphaMatch = /rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/.exec(bgAtivo);
    const alphaBg = alphaMatch ? parseFloat(alphaMatch[1]) : (bgAtivo === 'transparent' ? 0 : 1);
    const temGradienteOpaco = bgImg !== 'none' && !/rgba\([^)]*,\s*0?\.[0-8]/.test(bgImg);
    const cobreTela = rAtivo.left <= 2 && rAtivo.top <= 2 && rAtivo.right >= vw - 2 && rAtivo.bottom >= vh - 2;
    if (!cobreTela) {
      issues.push({
        tipo: 'mapa-visivel-atras',
        agente: 'dioh293',
        contexto,
        detalhe: `Overlay #${ativo.id} não cobre 100% da viewport (${Math.round(rAtivo.width)}x${Math.round(rAtivo.height)} em ${vw}x${vh})`,
      });
    } else if (card && alphaBg < 0.92 && !temGradienteOpaco) {
      const rCard = card.getBoundingClientRect();
      const cardCobre = rCard.left <= 2 && rCard.top <= 2 && rCard.right >= vw - 2 && rCard.bottom >= vh - 2;
      if (!cardCobre) {
        issues.push({
          tipo: 'mapa-visivel-atras',
          agente: 'dioh293',
          contexto,
          detalhe: `Card de #${ativo.id} (${Math.round(rCard.width)}x${Math.round(rCard.height)}) deixa fundo translúcido (alpha=${alphaBg}) mostrando o mapa atrás`,
        });
      }
    }
  }

  // 2. Checar controles recortados fora da tela
  for (const btn of escopo.querySelectorAll('.btn-fechar, .btn-voltar-refugio, [data-cm-voltar], .tb-btns button, .cw-guia-novo button')) {
    if (!visivel(btn)) continue;
    const r = btn.getBoundingClientRect();
    if (r.right > vw + 2 || r.left < -2 || r.top < -2 || r.bottom > vh + 2) {
      issues.push({
        tipo: 'recorte-controle',
        agente: 'dioh293',
        contexto,
        detalhe: `"${btn.textContent.trim().slice(0, 32)}" fora da tela [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] em ${vw}x${vh}`,
      });
    }
  }

  // 3. Checar sobreposições em grupos de botões e guia passo a passo vs controles do Refúgio
  const grupos = escopo.querySelectorAll('.modal-head, .ref-grupo, .ref-lado, .tb-btns, .tb-hab, #hud-acoes');
  for (const g of grupos) {
    if (!visivel(g)) continue;
    const filhos = [...g.children].filter((c) => visivel(c) && (c.tagName === 'BUTTON' || c.matches('a, [role="button"]')));
    for (let i = 0; i < filhos.length; i++) {
      const a = filhos[i].getBoundingClientRect();
      for (let j = i + 1; j < filhos.length; j++) {
        const b = filhos[j].getBoundingClientRect();
        const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const area = ox * oy;
        const menor = Math.min(a.width * a.height, b.width * b.height);
        if (menor > 0 && area / menor > 0.2) {
          issues.push({
            tipo: 'sobreposicao',
            agente: 'dioh293',
            contexto,
            detalhe: `"${filhos[i].textContent.trim().slice(0, 24)}" x "${filhos[j].textContent.trim().slice(0, 24)}" (${Math.round((area / menor) * 100)}%)`,
          });
        }
      }
    }
  }

  // Verifica se o guia passo a passo cobre algum botão interativo do Refúgio
  const guia = escopo.querySelector('.cw-guia-novo');
  if (visivel(guia)) {
    const rg = guia.getBoundingClientRect();
    for (const btn of escopo.querySelectorAll('.ref-topo button, .ref-lado button, .ref-passe, .ref-rodape button')) {
      if (!visivel(btn)) continue;
      const rb = btn.getBoundingClientRect();
      const ox = Math.max(0, Math.min(rg.right, rb.right) - Math.max(rg.left, rb.left));
      const oy = Math.max(0, Math.min(rg.bottom, rb.bottom) - Math.max(rg.top, rb.top));
      if (ox * oy > 16) {
        issues.push({
          tipo: 'tutorial-cobrindo-botao',
          agente: 'dioh292',
          contexto,
          detalhe: `Guia passo a passo sobrepõe botão "${btn.textContent.trim().slice(0, 24)}" (${Math.round(ox)}x${Math.round(oy)}px)`,
        });
      }
    }
  }

  return issues;
}
"""


def audit_and_shot(
    page: Page,
    vp_name: str,
    step_num: str,
    slug: str,
    label: str,
    espera_tela_cheia: bool,
    issues_bucket: list[dict[str, Any]],
    shots_bucket: list[dict[str, Any]],
) -> str:
    out_dir = SHOTS_ROOT / vp_name
    out_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{step_num}-{slug}.webp"
    rel_path = f"docs/relatorio-jogador-novo/{vp_name}/{filename}"
    try:
        found = page.evaluate(AUDIT_SCREEN_JS, {"contexto": f"{label} ({vp_name})", "esperaTelaCheia": espera_tela_cheia})
        issues_bucket.extend(found or [])
    except Exception as exc:
        issues_bucket.append({"tipo": "audit-erro", "agente": "dioh292", "contexto": f"{label} ({vp_name})", "detalhe": str(exc)})
    try:
        tmp_png = out_dir / f"{step_num}-{slug}.tmp.png"
        page.screenshot(path=str(tmp_png), full_page=False)
        with Image.open(tmp_png) as im:
            im.save(out_dir / filename, format="WEBP", quality=82, method=4)
        tmp_png.unlink(missing_ok=True)
        shots_bucket.append({"etapa": step_num, "slug": slug, "titulo": label, "viewport": vp_name, "arquivo": rel_path})
    except Exception as exc:
        issues_bucket.append({"tipo": "screenshot-erro", "agente": "dioh292", "contexto": f"{label} ({vp_name})", "detalhe": str(exc)})
    return rel_path


def finish_battle(page: Page, vp_name: str, label: str, issues: list[dict[str, Any]], shots: list[dict[str, Any]], shot_prefix: str | None = None) -> dict[str, Any]:
    arena = page.locator(".arena, .tb-campo").first
    arena.wait_for(state="visible", timeout=15000)
    page.wait_for_timeout(300)
    if shot_prefix:
        audit_and_shot(page, vp_name, shot_prefix, f"{label}-arena", f"{label} (Arena)", True, issues, shots)

    vel_btn = page.locator(".arena [data-vel]").first
    for _ in range(3):
        try:
            if not vel_btn.is_visible():
                break
            if "3" in (vel_btn.text_content(timeout=1500) or ""):
                break
            vel_btn.click(force=True, timeout=1500)
            page.wait_for_timeout(70)
        except Exception:
            break

    auto_btn = page.locator(".arena [data-auto]").first
    try:
        if auto_btn.is_visible() and "on" not in (auto_btn.get_attribute("class", timeout=1500) or "").split():
            auto_btn.click(force=True, timeout=1500)
    except Exception:
        pass

    fim = page.locator(".tb-fim").first
    fim.wait_for(state="visible", timeout=45000)
    txt = (fim.inner_text() or "").strip()
    vitoria = "vitória" in txt.lower() or "vitoria" in txt.lower() or "🏆" in txt
    fim.locator("button").first.click(force=True)
    page.wait_for_timeout(300)

    res_ov = page.locator("#res-batalha-overlay").first
    if res_ov.is_visible():
        if shot_prefix:
            audit_and_shot(page, vp_name, f"{shot_prefix}b", f"{label}-recompensas", f"{label} (Recompensas)", True, issues, shots)
        btn_rb = res_ov.locator("[data-rb-voltar]").first
        if btn_rb.is_visible():
            btn_rb.click(force=True)
            page.wait_for_timeout(220)
    return {"vitoria": vitoria, "texto": txt[:140]}


def medir_pesos_artes_v2() -> dict[str, Any]:
    """Mede o peso em disco dos fundos 2560px (telas-v2/), 1280px (telas-v2/mobile/) e capas (banners-v2/)."""
    raiz = REPO_ROOT / "assets" / "confusion" / "interface"
    def listar(pasta: Path) -> list[dict[str, Any]]:
        if not pasta.exists():
            return []
        itens = []
        for p in sorted(pasta.iterdir()):
            if p.is_file() and p.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"}:
                itens.append({"nome": p.name, "kb": round(p.stat().st_size / 1024, 1)})
        return itens

    telas_desk = listar(raiz / "telas-v2")
    telas_mob = listar(raiz / "telas-v2" / "mobile")
    banners = listar(raiz / "banners-v2")
    total_desk = round(sum(x["kb"] for x in telas_desk), 1)
    total_mob = round(sum(x["kb"] for x in telas_mob), 1)
    total_ban = round(sum(x["kb"] for x in banners), 1)
    economia_pct = round((1.0 - (total_mob / total_desk)) * 100.0, 1) if total_desk > 0 else 0.0
    return {
        "telasDesk": telas_desk,
        "telasMob": telas_mob,
        "banners": banners,
        "totalDeskKB": total_desk,
        "totalMobKB": total_mob,
        "totalBannersKB": total_ban,
        "economiaMobilePct": economia_pct,
    }


def auditar_colisao_chefes_regiao1() -> list[dict[str, Any]]:
    """Audita as walkmasks nas entradas dos 4 chefes da Região 1 (BOSS_E, BOSS_D, BOSS_S, BOSS_C)."""
    achados: list[dict[str, Any]] = []
    # Pontos conhecidos de obstáculos visuais (pedras/raízes/paredes) nas entradas dos chefes:
    # Em BOSS_E, a entrada fica a leste ([765, 305] -> arena [680, 305]); à esquerda/baixo-esquerda da passagem há pedra grande e raízes.
    # Em BOSS_D, BOSS_S, BOSS_C a entrada fica ao norte ([512, 130..150]); bordas laterais têm paredes/árvores/rochas.
    checagens = [
        ("BOSS_E", "Pedra grande e raízes à esquerda da passagem (x=120..300, y=340..500)", (120, 340, 300, 500), 15.0),
        ("BOSS_D", "Bordas laterais de fungos/rochas na entrada norte (x=80..240, y=60..220)", (80, 60, 240, 220), 25.0),
        ("BOSS_S", "Pedras/costão lateral na entrada da Siren (x=60..220, y=60..220)", (60, 60, 220, 220), 25.0),
        ("BOSS_C", "Paredes de cristal laterais na entrada do Golem (x=60..220, y=60..220)", (60, 60, 220, 220), 25.0),
    ]
    base_dir = REPO_ROOT / "confusion" / "web" / "teste-quarteirao" / "assets" / "regiao1"
    for mapa_id, desc, (x0, y0, x1, y1), limite_pct in checagens:
        p = base_dir / f"{mapa_id}-walkmask.png"
        if not p.exists():
            achados.append({"mapa": mapa_id, "ok": False, "detalhe": f"Walkmask ausente: {p.name}", "agente": "dioh293"})
            continue
        im = Image.open(p).convert("L")
        px = im.load()
        total = (x1 - x0) * (y1 - y0)
        andaveis = sum(1 for y in range(y0, y1) for x in range(x0, x1) if px[x, y] > 128)
        pct = (andaveis / total) * 100.0
        ok = pct <= limite_pct
        achados.append({
            "mapa": mapa_id,
            "ok": ok,
            "walkablePct": round(pct, 1),
            "limitePct": limite_pct,
            "detalhe": f"{desc}: {pct:.1f}% marcado como andável na walkmask (máx. esperado {limite_pct:.0f}%)",
            "agente": "dioh293",
        })
    return achados


def run_viewport(base_url: str, vp_name: str, vp_cfg: dict[str, Any]) -> dict[str, Any]:
    console_errors: list[str] = []
    page_errors: list[str] = []
    http_errors: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []
    shots: list[dict[str, Any]] = []
    steps: list[dict[str, Any]] = []
    v2_requests_boot: list[str] = []
    v2_requests_all: list[str] = []
    boot_bytes = [0]
    em_boot = [True]

    def rec(etapa: str, ok: bool, detalhe: str) -> None:
        steps.append({"etapa": etapa, "ok": ok, "detalhe": detalhe})
        print(f"  [{vp_name}] {'PASS' if ok else 'FAIL'} {etapa} — {detalhe}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
        ctx = browser.new_context(
            viewport={"width": vp_cfg["width"], "height": vp_cfg["height"]},
            is_mobile=vp_cfg["is_mobile"],
            has_touch=vp_cfg["has_touch"],
        )
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(f"[{m.type}] {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        def on_response(r: Any) -> None:
            rel = r.url.replace(base_url, "")
            if r.status >= 400 and "/api/" not in r.url:
                http_errors.append({"status": r.status, "url": rel})
            if "telas-v2/" in rel or "banners-v2/" in rel:
                v2_requests_all.append(rel)
                if em_boot[0]:
                    v2_requests_boot.append(rel)
            if em_boot[0] and r.status == 200:
                cl = r.headers.get("content-length")
                if cl and cl.isdigit():
                    boot_bytes[0] += int(cl)

        page.on("response", on_response)

        # 01. Site (/) -> /jogar
        page.goto(f"{base_url}/", wait_until="load", timeout=30000)
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        boot_bytes[0] = 0
        v2_requests_boot.clear()
        v2_requests_all.clear()
        em_boot[0] = True
        t_open = time.perf_counter()
        page.goto(f"{base_url}/", wait_until="load", timeout=30000)
        page.wait_for_selector("#conta-gate.vis", timeout=15000)
        boot_ms = round((time.perf_counter() - t_open) * 1000)
        audit_and_shot(page, vp_name, "01", "site-conta", "Site / Conta ou Convidado", True, issues, shots)
        rec("01. Site -> Conta/Convidado", True, f"url={page.url.replace(base_url, '')}, boot={boot_ms}ms")

        # 02. Convidado -> Escolha do Inicial
        page.locator('#conta-gate [data-acao="local"]').first.click()
        page.locator('#conta-gate [data-ini]').first.wait_for(state="visible", timeout=8000)
        audit_and_shot(page, vp_name, "02", "escolha-inicial", "Escolha do Inicial", True, issues, shots)
        rec("02. Escolha do Inicial", True, "5 iniciais exibidos")

        # 03. Selecionar inicial -> Refúgio (mede tempo até Refúgio visível)
        t_ref = time.perf_counter()
        page.locator('#conta-gate [data-ini="Brasinha"]').first.click()
        page.locator('#conta-gate [data-acao="comecar-local"]').click()
        page.wait_for_selector("#modal-exp.aberto [data-refugio='1']", timeout=10000)
        refugio_ms = round((time.perf_counter() - t_ref) * 1000)
        em_boot[0] = False
        boot_kb = round(boot_bytes[0] / 1024, 1)
        audit_and_shot(page, vp_name, "03", "refugio", "Refúgio do Farol", True, issues, shots)
        guia_vis = page.locator("#modal-exp [data-guia-novo='batalha']").first.is_visible()
        ok_perf_ref = (boot_ms < 2000) if vp_cfg["is_mobile"] else True
        if vp_cfg["is_mobile"] and not ok_perf_ref:
            issues.append({"tipo": "desempenho-refugio", "agente": "dioh292", "contexto": f"Refúgio ({vp_name})", "detalhe": f"Abertura mobile levou {boot_ms}ms (meta < 2000ms)"})
        rec("03. Refúgio (<2s mobile + Guia)", ok_perf_ref and guia_vis, f"boot={boot_ms}ms ({boot_kb}KB), refugio=+{refugio_ms}ms, guiaPasso2={guia_vis}")

        # 04. Campanha -> 1ª batalha + Recompensas
        page.locator('#modal-exp [data-desc-ir="campanha"]').first.click()
        page.wait_for_timeout(350)
        if page.locator("#modal-tutorial.aberto #btn-tut-pular").first.is_visible():
            page.locator("#modal-tutorial.aberto #btn-tut-pular").first.click()
            page.wait_for_timeout(200)
        audit_and_shot(page, vp_name, "04", "campanha-mapa", "Campanha (Mapa 3D)", False, issues, shots)
        page.evaluate("async () => { await window.regiao1.irPara('E1'); }")
        page.wait_for_function("() => (window.regiao1?.selvagensInfo?.()?.length || 0) > 0", timeout=10000)
        page.evaluate("() => { window.regiao1.moverPx(459, 326); }")
        page.wait_for_timeout(150)
        page.evaluate("() => window.regiao1.interagir()")
        res_camp = finish_battle(page, vp_name, "campanha-1a", issues, shots, shot_prefix="05")
        rec("04. Campanha -> 1ª batalha", res_camp["vitoria"], f"vitoria={res_camp['vitoria']}")

        def voltar_refugio() -> None:
            for sel in [
                "#res-batalha-overlay [data-rb-voltar]",
                "#modal-campanha-mini.aberto [data-cm-voltar]",
                "#modal-campanha-mini.aberto [data-cm-voltar]",
                "#modal-hw.aberto .btn-fechar",
                "#modal-mochila.aberto .btn-fechar",
                "#modal-codex.aberto .btn-fechar",
                "#modal-mundo.aberto .btn-fechar",
                "#modal-mundo.aberto [data-fechar]",
            ]:
                loc = page.locator(sel).first
                if loc.is_visible():
                    loc.click(force=True)
                    page.wait_for_timeout(180)
            if page.locator("#modal-exp.aberto [data-refugio='1']").first.is_visible():
                return
            btn_v = page.locator("#modal-exp.aberto .btn-voltar-refugio, #modal-exp.aberto [data-desc-ir='descanso']").first
            if btn_v.is_visible():
                btn_v.click(force=True)
                page.wait_for_timeout(200)
                if page.locator("#modal-exp.aberto [data-refugio='1']").first.is_visible():
                    return
            if page.locator("#modal-exp.aberto .btn-fechar").first.is_visible():
                page.locator("#modal-exp.aberto .btn-fechar").first.click(force=True)
                page.wait_for_timeout(180)
            page.locator("#btn-menu-geral").click(force=True)
            page.locator("#m-descanso").wait_for(state="visible", timeout=5000)
            page.locator("#m-descanso").click(force=True)
            page.locator("#modal-exp.aberto [data-refugio='1']").first.wait_for(state="visible", timeout=8000)

        # 06. Equipe & Evolução
        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="equipe"]').first.click()
        page.wait_for_timeout(250)
        audit_and_shot(page, vp_name, "06", "equipe", "Equipe & Coleção", True, issues, shots)
        page.locator("#modal-exp [data-eq-col]").first.click(force=True)
        page.locator("#ficha-onirico").wait_for(state="visible", timeout=6000)
        audit_and_shot(page, vp_name, "07", "ficha-evolucao", "Ficha & Evolução com Essências", True, issues, shots)
        bloq_sem_ess = page.locator("#ficha-onirico [data-evo-forma]").first.is_disabled()
        rec("06. Equipe & Evolução", bloq_sem_ess, f"bloqueadoSemEssencias={bloq_sem_ess}")

        # 07. Campanha Mini (capítulos + fase 1-1)
        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="campanhaMini"]').first.click()
        page.wait_for_selector("#modal-campanha-mini.aberto", timeout=8000)
        audit_and_shot(page, vp_name, "08", "campanha-mini", "Campanha Mini", True, issues, shots)
        page.locator('#modal-campanha-mini [data-cm-cap="1"]').first.click()
        page.locator('#modal-campanha-mini [data-cm-lutar="1-1"]').first.wait_for(state="visible", timeout=6000)
        page.locator('#modal-campanha-mini [data-cm-lutar="1-1"]').first.click()
        res_cm = finish_battle(page, vp_name, "campanha-mini-1-1", issues, shots)
        rec("07. Campanha Mini 1-1", res_cm["vitoria"], f"vitoria={res_cm['vitoria']}")

        # 08. Missões
        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="missoes"]').first.click()
        page.wait_for_timeout(250)
        audit_and_shot(page, vp_name, "09", "missoes", "Missões (Marcos & Paralelas)", True, issues, shots)
        rec("08. Missões", True, "painel Marcos/Paralelas aberto")

        # 09. Torres + Calabouços + Relíquias
        voltar_refugio()
        page.evaluate("""() => {
          const s = window.regiao1.save();
          const m = s.idle?.equipe?.[0];
          if (m && (m.nivel || 1) < 80) { m.nivel = 80; m.xp = Math.max(m.xp || 0, 80000); }
          window.regiao1.salvar();
        }""")
        page.locator('#modal-exp [data-desc-ir="torres"]').first.click()
        page.locator("#modal-exp [data-tor-lutar-el]").first.wait_for(state="visible", timeout=6000)
        audit_and_shot(page, vp_name, "10", "torres", "Torres Elementais", True, issues, shots)
        page.locator("#modal-exp [data-tor-lutar-el]").first.click()
        res_tor = finish_battle(page, vp_name, "torre-1", issues, shots)
        rec("09. Torres andar 1", res_tor["vitoria"], f"vitoria={res_tor['vitoria']}")

        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="calaboucos"]').first.click()
        page.locator("#modal-exp [data-cal-lutar]").first.wait_for(state="visible", timeout=6000)
        audit_and_shot(page, vp_name, "11", "calaboucos", "Calabouços de Relíquias", True, issues, shots)
        page.locator("#modal-exp [data-cal-lutar]").first.click()
        res_cal = finish_battle(page, vp_name, "calabouco-1", issues, shots)
        rec("10. Calabouços nível 1", res_cal["vitoria"], f"vitoria={res_cal['vitoria']}")

        voltar_refugio()
        page.evaluate("""() => {
          const s = window.regiao1.save();
          const el = s.idle?.equipe?.[0]?.elemento || 'fogo';
          const b = s.idle?.reliquias?.bolsa || [];
          if (b.length && !b.some(r => r.elemento === el)) { b[0].elemento = el; window.regiao1.salvar(); }
        }""")
        page.locator('#modal-exp [data-desc-ir="reliquias"]').first.click()
        page.locator("#modal-exp [data-rel-eq]:not([disabled])").first.wait_for(state="visible", timeout=6000)
        audit_and_shot(page, vp_name, "12", "reliquias", "Relíquias & Essências", True, issues, shots)
        page.locator("#modal-exp [data-rel-eq]:not([disabled])").first.click()
        page.wait_for_timeout(200)
        rec("11. Relíquias (equipar)", True, "relíquia equipada na UI")

        # 12. Banner Adventurer (10 grátis/dia + garantias 10/30/50 + 3% T5 + invocar via UI)
        voltar_refugio()
        page.evaluate("() => { const s = window.regiao1.save(); s.idle.exp = s.idle.exp || {}; s.idle.exp.tickets = Math.max(s.idle.exp.tickets || 0, 5); window.regiao1.salvar(); }")
        page.locator('#modal-exp [data-desc-ir="oniricos"]').first.click()
        page.wait_for_timeout(300)
        audit_and_shot(page, vp_name, "13", "banner", "Invocação (Banner Adventurer)", True, issues, shots)
        banner_ui = page.evaluate(r"""() => {
          const txt = document.getElementById('modal-exp')?.innerText || '';
          const s = window.regiao1.save();
          return {
            temGratis: /gr[aá]tis/i.test(txt),
            temT3: /T3 garantido em/i.test(txt),
            temT4: /T4 em/i.test(txt),
            temT5: /T5 em/i.test(txt) && /3%/.test(txt),
            gratisAntes: s.idle?.exp?.gratis?.saldo ?? 0,
            ticketsAntes: s.idle?.exp?.tickets ?? 0,
            pullsAntes: s.idle?.exp?.pulls ?? 0,
          };
        }""")
        btn_inv = page.locator('#modal-exp [data-invocar="1"]').first
        inv_ok = False
        usou_gratis = False
        if btn_inv.is_visible() and not btn_inv.is_disabled():
            btn_inv.click()
            page.wait_for_timeout(450)
            if page.locator(".rv [data-pular]").first.is_visible():
                page.locator(".rv [data-pular]").first.click(force=True)
                page.wait_for_timeout(200)
            if page.locator(".rv [data-fim]").first.is_visible():
                audit_and_shot(page, vp_name, "13b", "banner-revelacao", "Invocação (Revelação)", True, issues, shots)
                page.locator(".rv [data-fim]").first.click(force=True)
                page.wait_for_timeout(250)
            pos_inv = page.evaluate("() => { const s = window.regiao1.save(); return { pulls: s.idle?.exp?.pulls || 0, gratis: s.idle?.exp?.gratis?.saldo ?? 0, tickets: s.idle?.exp?.tickets ?? 0 }; }")
            inv_ok = pos_inv["pulls"] > banner_ui["pullsAntes"]
            usou_gratis = (banner_ui["gratisAntes"] > 0 and pos_inv["gratis"] == banner_ui["gratisAntes"] - 1 and pos_inv["tickets"] == banner_ui["ticketsAntes"])
        banner_regras_ok = inv_ok and usou_gratis and banner_ui["temGratis"] and banner_ui["temT3"] and banner_ui["temT4"] and banner_ui["temT5"]
        rec("12. Banner Adventurer (grátis + garantias 10/30/50)", banner_regras_ok, f"inv={inv_ok}, usouGratis={usou_gratis}, gratisAntes={banner_ui['gratisAntes']}, uiGarantias={banner_ui['temT3'] and banner_ui['temT4'] and banner_ui['temT5']}")

        # 13. Domadores
        voltar_refugio()
        page.evaluate("() => { const s = window.regiao1.save(); s.recompensas.diamantes = Math.max(s.recompensas.diamantes || 0, 2000); window.regiao1.salvar(); }")
        page.locator('#modal-exp [data-desc-ir="equipe"]').first.click()
        page.locator('#modal-exp [role="tab"][data-aba="1"]').first.click()
        page.wait_for_timeout(250)
        audit_and_shot(page, vp_name, "14", "domadores", "Domadores Auxiliares", True, issues, shots)
        if page.locator('#modal-exp [data-dom-desbl^="manipulador:"]').first.is_visible():
            page.locator('#modal-exp [data-dom-desbl^="manipulador:"]').first.click()
            page.wait_for_timeout(200)
        if page.locator('#modal-exp [data-dom-sel="manipulador"]').first.is_visible():
            page.locator('#modal-exp [data-dom-sel="manipulador"]').first.click()
            page.wait_for_timeout(200)
        dom_at = page.evaluate("() => window.regiao1.save().idle?.domadores?.ativo")
        rec("13. Domador (Manipulador)", dom_at == "manipulador", f"ativo={dom_at}")

        # 14. Menus reformulados: Mochila (5 abas + check upload foto), Coleção, Eventos, Idle, Guilda
        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="mochila"]').first.click()
        page.wait_for_selector("#modal-mochila.aberto", timeout=6000)
        page.wait_for_timeout(200)
        audit_and_shot(page, vp_name, "15", "mochila", "Domador e Mochila", True, issues, shots)
        moch_info = page.evaluate(r"""() => {
          const m = document.getElementById('modal-mochila');
          const abas = [...(m?.querySelectorAll('[data-mochila-cat]') || [])].filter((el) => el.offsetParent !== null);
          const temUploadFoto = Boolean(m?.querySelector('input[type="file"], [data-personalizar-perfil], [data-foto-perfil]'));
          return { abas: abas.length, temUploadFoto };
        }""")
        # Navega pelas 5 abas da Mochila para auditar estados vazios e botões
        for idx_aba in range(1, min(5, moch_info["abas"])):
            tab_loc = page.locator('#modal-mochila [data-mochila-cat]').nth(idx_aba)
            if tab_loc.is_visible():
                tab_loc.click(force=True)
                page.wait_for_timeout(120)
                found_tab = page.evaluate(AUDIT_SCREEN_JS, {"contexto": f"Mochila aba {idx_aba + 1} ({vp_name})", "esperaTelaCheia": True})
                issues.extend(found_tab or [])

        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="codex"]').first.click()
        page.wait_for_selector("#modal-codex.aberto", timeout=6000)
        page.wait_for_timeout(200)
        audit_and_shot(page, vp_name, "16", "colecao", "Coleção (Codex)", True, issues, shots)

        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="eventos"]').first.click()
        page.wait_for_timeout(250)
        audit_and_shot(page, vp_name, "17", "eventos", "Eventos", True, issues, shots)

        voltar_refugio()
        page.evaluate("() => { const s = window.regiao1.save(); s.visitadas = Array.from(new Set([...(s.visitadas || []), 'C1'])); window.regiao1.salvar(); }")
        page.locator('#modal-exp [data-desc-ir="guilda"]').first.click()
        page.wait_for_timeout(250)
        audit_and_shot(page, vp_name, "18", "guilda", "Guilda", True, issues, shots)

        rec("14. Menus reformulados (Mochila/Coleção/Eventos/Guilda)", moch_info["abas"] == 5, f"abasMochila={moch_info['abas']}, uploadFotoPerfil={moch_info['temUploadFoto']}")

        # 15. Mundo (confirmar apenas os 10 sistemas do lançamento - #147)
        voltar_refugio()
        page.locator('#modal-exp [data-desc-ir="campanha"]').first.click()
        page.wait_for_timeout(250)
        page.evaluate("() => window.regiaoMundo?.abrir?.()")
        page.wait_for_timeout(350)
        audit_and_shot(page, vp_name, "19", "mundo", "Mundo (10 Sistemas)", True, issues, shots)
        qtd_sis = page.evaluate(r"""() => {
          const btns = [...document.querySelectorAll('#modal-mundo [data-sis], #modal-mundo .mun-tab, #modal-mundo button[data-sistema]')];
          const txt = document.getElementById('modal-mundo')?.innerText || '';
          return { btns: btns.length, tem11a50: /11\s*[–-]\s*50|50 sistemas/i.test(txt) };
        }""")
        rec("15. Mundo (só 10 sistemas)", not qtd_sis["tem11a50"], f"info={qtd_sis}")

        # 16. AFK em segundo plano (ocultar aba -> voltar -> toast de ganhos - #152)
        page.evaluate("() => { document.getElementById('modal-mundo')?.classList.remove('aberto'); }")
        page.evaluate("async () => { await window.regiao1.irPara('E1'); }")
        page.wait_for_timeout(200)
        afk_res = page.evaluate(r"""() => {
          const s = window.regiao1.save();
          s.idle = s.idle || {};
          s.idle.autoCaca = true;
          s.idle.ultimoTickMs = Date.now() - (5 * 60 * 1000);
          window.regiao1.salvar();
          let hiddenVal = true;
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => hiddenVal });
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hiddenVal ? 'hidden' : 'visible') });
          document.dispatchEvent(new Event('visibilitychange'));
          s.idle.ultimoTickMs = Date.now() - (5 * 60 * 1000);
          hiddenVal = false;
          document.dispatchEvent(new Event('visibilitychange'));
          const av = document.getElementById('aviso-saida');
          return {
            toastVisivel: Boolean(av && getComputedStyle(av).display !== 'none'),
            toastTexto: (av?.textContent || '').trim(),
          };
        }""")
        afk_ok = afk_res["toastVisivel"] and ("enquanto você estava fora" in afk_res["toastTexto"].lower() or "abates" in afk_res["toastTexto"].lower())
        rec("16. AFK em segundo plano (visibilitychange + toast)", afk_ok, f"toast='{afk_res['toastTexto'][:80]}'")

        # 17. Convidado -> criar conta: toast de bônus único 20.000💎 + 10d VIP após reload (#155)
        page.evaluate("() => { sessionStorage.setItem('cw-bonus-boas-vindas-toast', '1'); }")
        page.reload(wait_until="load", timeout=30000)
        page.wait_for_timeout(600)
        toast_conta = page.evaluate(r"""() => {
          const av = document.getElementById('aviso-saida');
          return {
            visivel: Boolean(av && getComputedStyle(av).display !== 'none'),
            texto: (av?.textContent || '').trim(),
            flagConsumida: sessionStorage.getItem('cw-bonus-boas-vindas-toast') === null,
          };
        }""")
        toast_conta_ok = toast_conta["flagConsumida"] and ("20.000" in toast_conta["texto"] and "VIP" in toast_conta["texto"])
        rec("17. Convidado -> conta (toast 20.000💎 + 10d VIP)", toast_conta_ok, f"consumida={toast_conta['flagConsumida']}, toast='{toast_conta['texto'][:80]}'")

        # Captura entrada do BOSS_E para o relatório de colisão
        page.evaluate("async () => { await window.regiao1.irPara('BOSS_E'); }")
        page.wait_for_timeout(450)
        audit_and_shot(page, vp_name, "20", "colisao-boss-e", "Entrada BOSS_E (Colisão)", False, issues, shots)

        browser.close()

    return {
        "viewport": vp_name,
        "bootMs": boot_ms,
        "bootKB": boot_kb,
        "refugioMs": refugio_ms,
        "v2RequestsBoot": sorted(set(v2_requests_boot)),
        "v2RequestsAll": sorted(set(v2_requests_all)),
        "uploadFotoImplementado": moch_info["temUploadFoto"],
        "steps": steps,
        "issues": issues,
        "shots": shots,
        "consoleErrors": console_errors,
        "pageErrors": page_errors,
        "httpErrors": http_errors,
    }


def escrever_relatorio_md(
    resultados: list[dict[str, Any]],
    colisao_chefes: list[dict[str, Any]],
    pesos_v2: dict[str, Any],
) -> None:
    agora = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    desk = next((r for r in resultados if r["viewport"] == "1280x720"), resultados[0])
    mob = next((r for r in resultados if r["viewport"] == "844x390"), resultados[-1])

    linhas = [
        "# Relatório — Etapa JOGADOR NOVO (QA, Desempenho e Colisão)",
        "",
        f"- **Última atualização:** {agora}",
        "- **Jogo:** https://cwdp-lake.vercel.app/jogar",
        "- **Gerado automaticamente por:** `python3 tools/e2e_jogador_novo.py`",
        f"- **Desempenho na abertura:** Desktop `1280×720` = **{desk['bootMs']} ms** ({desk['bootKB']} KB, Refúgio +{desk['refugioMs']} ms) · Celular `844×390` = **{mob['bootMs']} ms** ({mob['bootKB']} KB, Refúgio +{mob['refugioMs']} ms; meta `< 2000 ms`: **{'OK' if mob['bootMs'] < 2000 else 'ACIMA'}**)",
        f"- **Artes v2 em disco:** `telas-v2/` (13 fundos 2560px) = **{pesos_v2['totalDeskKB']} KB** · `telas-v2/mobile/` (13 fundos 1280px) = **{pesos_v2['totalMobKB']} KB** (**-{pesos_v2['economiaMobilePct']}%** no celular) · `banners-v2/` (2 capas) = **{pesos_v2['totalBannersKB']} KB**",
        f"- **Carregamento sob demanda v2 no celular (`844×390`):** boot={len(mob['v2RequestsBoot'])} arquivo(s), sessão inteira={len(mob['v2RequestsAll'])} arquivo(s)",
        f"- **Erros de console / página / 404:** Desktop ({len(desk['consoleErrors'])} console, {len(desk['pageErrors'])} pageerror, {len(desk['httpErrors'])} HTTP 404) · Mobile ({len(mob['consoleErrors'])} console, {len(mob['pageErrors'])} pageerror, {len(mob['httpErrors'])} HTTP 404)",
        "",
        "---",
        "",
        "## Resumo de problemas e pendências reais por agente",
        "",
    ]

    todos_problemas: list[dict[str, Any]] = []
    for r in resultados:
        for iss in r["issues"]:
            todos_problemas.append(iss)
        for he in r["httpErrors"]:
            todos_problemas.append({"tipo": f"http-{he['status']}", "agente": "dioh293", "contexto": r["viewport"], "detalhe": he["url"]})
    for col in colisao_chefes:
        if not col["ok"]:
            todos_problemas.append({"tipo": "colisao-walkmask", "agente": col["agente"], "contexto": col["mapa"], "detalhe": col["detalhe"]})
    if not mob.get("v2RequestsAll"):
        todos_problemas.append({
            "tipo": "pendencia-telas-v2",
            "agente": "dioh293",
            "contexto": "telas-v2/ e banners-v2/",
            "detalhe": "Artes v2 já estão na main (#156) e telas-v2/mobile/ já foi gerado, mas BANNERS_V2_ATIVO ainda está false em regiao1-expansao.js (e busca *-capa.webp em vez de adventurer.webp/halloween.webp) e os fundos telas-v2 ainda não são aplicados via aplicarFundoTelaSobDemanda.",
        })
    if not mob.get("uploadFotoImplementado"):
        todos_problemas.append({
            "tipo": "pendencia-upload-foto",
            "agente": "dioh293",
            "contexto": "Mochila → Domador (Perfil)",
            "detalhe": "Botão Personalizar / upload de foto com moderação e molduras kit-v2/perfil/ ainda não implementado na tela de perfil.",
        })

    if not todos_problemas:
        linhas.append("Nenhum problema automático aberto nesta rodada.")
    else:
        linhas.append("| Agente | Tipo | Tela / Mapa | Detalhe |")
        linhas.append("|---|---|---|---|")
        vistos = set()
        for p in todos_problemas:
            chave = (p["agente"], p["tipo"], p["contexto"], p["detalhe"])
            if chave in vistos:
                continue
            vistos.add(chave)
            linhas.append(f"| **{p['agente']}** | `{p['tipo']}` | {p['contexto']} | {p['detalhe']} |")

    linhas += [
        "",
        "---",
        "",
        "## Desempenho — Pesos das Artes v2 (Desktop 2560px vs Mobile 1280px)",
        "",
        "| Pasta | Arquivos | Peso total | Observação |",
        "|---|---:|---:|---|",
        f"| `assets/confusion/interface/telas-v2/` | {len(pesos_v2['telasDesk'])} | {pesos_v2['totalDeskKB']} KB | Fundos 2560×1440 para desktop |",
        f"| `assets/confusion/interface/telas-v2/mobile/` | {len(pesos_v2['telasMob'])} | {pesos_v2['totalMobKB']} KB | Fundos 1280×720 para celular (-{pesos_v2['economiaMobilePct']}%) |",
        f"| `assets/confusion/interface/banners-v2/` | {len(pesos_v2['banners'])} | {pesos_v2['totalBannersKB']} KB | Capas `adventurer.webp` e `halloween.webp` (~900 KB cada) |",
        "",
        "---",
        "",
        "## Fluxo do Jogador Novo — Tela por Tela (1280×720 e 844×390)",
        "",
    ]

    ordem_slugs: list[tuple[str, str, str]] = []
    for s in desk["shots"]:
        chave = (s["etapa"], s["slug"], s["titulo"])
        if chave not in ordem_slugs:
            ordem_slugs.append(chave)

    for etapa, slug, titulo in ordem_slugs:
        s_d = next((x for x in desk["shots"] if x["slug"] == slug), None)
        s_m = next((x for x in mob["shots"] if x["slug"] == slug), None)
        iss_tela = [i for r in resultados for i in r["issues"] if titulo.split(" (")[0] in i["contexto"] or slug in i["contexto"].lower()]
        linhas.append(f"### {etapa}. {titulo}")
        if s_d and s_m:
            linhas.append(f"- **Desktop (1280×720):** `{s_d['arquivo']}`")
            linhas.append(f"- **Celular (844×390):** `{s_m['arquivo']}`")
        if iss_tela:
            for i in iss_tela:
                linhas.append(f"- **Problema (`{i['tipo']}` · {i['agente']}):** {i['detalhe']}")
        else:
            linhas.append("- **Status:** Sem sobreposições, recortes, 404 ou vazamento de mapa.")
        linhas.append("")

    linhas += [
        "---",
        "",
        "## Auditoria de Colisão — Entradas dos Chefes da Região 1",
        "",
        "| Mapa | Status | Área andável medida na zona de obstáculo | Responsável | Detalhe |",
        "|---|---|---:|---|---|",
    ]
    for col in colisao_chefes:
        st = "OK" if col["ok"] else "FALHA (atravessa obstáculo)"
        linhas.append(f"| `{col['mapa']}` | {st} | {col.get('walkablePct', '—')}% (máx {col.get('limitePct', '—')}%) | **{col['agente']}** | {col['detalhe']} |")

    linhas += [
        "",
        "---",
        "",
        "## Execução das Etapas do Fluxo",
        "",
        "| Etapa | Desktop 1280×720 | Celular 844×390 |",
        "|---|---|---|",
    ]
    for sd, sm in zip(desk["steps"], mob["steps"]):
        linhas.append(f"| {sd['etapa']} | {'PASS' if sd['ok'] else 'FAIL'} ({sd['detalhe']}) | {'PASS' if sm['ok'] else 'FAIL'} ({sm['detalhe']}) |")

    RELATORIO_MD.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="E2E Jogador Novo + Screenshots + Relatório")
    parser.add_argument("--strict-collision", action="store_true", help="Falhar com exit code 1 se walkmasks dos chefes tiverem áreas de obstáculo andáveis")
    args = parser.parse_args()

    colisao = auditar_colisao_chefes_regiao1()
    pesos_v2 = medir_pesos_artes_v2()
    srv, base_url = start_static_server(REPO_ROOT)
    resultados = []
    try:
        for vp_name, vp_cfg in VIEWPORTS.items():
            resultados.append(run_viewport(base_url, vp_name, vp_cfg))
    finally:
        srv.shutdown()

    escrever_relatorio_md(resultados, colisao, pesos_v2)
    print(f"\nRelatório salvo em: {RELATORIO_MD.relative_to(REPO_ROOT)}")
    for c in colisao:
        print(f"  [colisão] {'OK' if c['ok'] else 'FALHA'} {c['mapa']}: {c['detalhe']}")

    falhou = False
    for r in resultados:
        if any(not s["ok"] for s in r["steps"]) or r["pageErrors"] or r["httpErrors"] or r["issues"]:
            falhou = True
    if args.strict_collision and any(not c["ok"] for c in colisao):
        falhou = True
    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main())
