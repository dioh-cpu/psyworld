#!/usr/bin/env python3
"""
Teste de ponta a ponta automatizado (Playwright) do Confusion Waves.

Fluxo completo validado em Desktop (1280x720) e Celular Paisagem (844x390):
  1. Conta nova sem conta
  2. Escolha do inicial
  3. Refúgio
  4. Campanha → primeira batalha
  5. Campanha Mini fase 1-1
  6. Torre Elemental andar 1
  7. Calabouço nível 1
  8. Equipar relíquia
  9. Evoluir Onírico (verificar bloqueio sem Essências + evoluir com Essências/Fragmentos)
 10. Trocar domador (desbloquear e selecionar Manipulador das Oito Lâminas)
 11. Recarregar a página e conferir persistência completa

Registra erros de console, exceções não tratadas, respostas HTTP >= 400 (404),
sobreposições/recortes de interface e tempos de abertura.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
import socketserver
import sys
import threading
import time
from pathlib import Path
from typing import Any

from playwright.sync_api import Page, sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
GAME_PATH = "/confusion/web/teste-quarteirao/regiao1.html"

VIEWPORTS = {
    "desktop": {"width": 1280, "height": 720, "is_mobile": False, "has_touch": False},
    "mobile": {"width": 844, "height": 390, "is_mobile": True, "has_touch": True},
}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/confusion-config":
            body = b'{"enabled":false}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
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


LAYOUT_AUDIT_JS = """
(contextLabel) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const issues = [];

  if (document.documentElement.scrollWidth > vw + 4) {
    issues.push({
      tipo: 'overflow-x',
      contexto: contextLabel,
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

  // Verifica se algum modal aberto tem cabeçalho ou botões de fechar fora da tela
  const modaisAbertos = [...document.querySelectorAll('.modal-bg.aberto, #modal-campanha-mini.aberto, #tela-batalha')].filter(visivel);
  const escopo = modaisAbertos.length ? modaisAbertos[modaisAbertos.length - 1] : document.body;

  for (const btn of escopo.querySelectorAll('.btn-fechar, .btn-voltar-refugio, [data-cm-voltar], .tb-btns button')) {
    if (!visivel(btn)) continue;
    const r = btn.getBoundingClientRect();
    if (r.right > vw + 2 || r.left < -2 || r.top < -2 || r.bottom > vh + 2) {
      issues.push({
        tipo: 'recorte-controle',
        contexto: contextLabel,
        detalhe: `${btn.textContent.trim().slice(0, 32)} rect=[${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] vp=${vw}x${vh}`,
      });
    }
  }

  // Checa colisões entre botões irmãos diretos visíveis na mesma barra/dock/header
  const grupos = escopo.querySelectorAll('.modal-head, .ref-dock-esq, .ref-dock-dir, .ref-modos, .tb-btns, .tb-hab, #hud-acoes');
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
        if (menor > 0 && area / menor > 0.25) {
          issues.push({
            tipo: 'sobreposicao',
            contexto: contextLabel,
            detalhe: `"${filhos[i].textContent.trim().slice(0, 24)}" x "${filhos[j].textContent.trim().slice(0, 24)}" (${Math.round((area / menor) * 100)}%)`,
          });
        }
      }
    }
  }

  return issues;
}
"""


def audit_layout(page: Page, label: str, bucket: list[dict[str, Any]]) -> None:
    try:
        found = page.evaluate(LAYOUT_AUDIT_JS, label)
        bucket.extend(found or [])
    except Exception as exc:
        bucket.append({"tipo": "audit-erro", "contexto": label, "detalhe": str(exc)})


def wait_and_finish_arena_battle(page: Page, label: str, layout_issues: list[dict[str, Any]], timeout_ms: int = 45000) -> dict[str, Any]:
    """Aguarda a arena abrir, ativa ×3 + Auto e conclui quando .tb-fim aparecer."""
    arena = page.locator(".arena.aberta, #modal-estrategia .bat.arena, .tb-campo").first
    arena.wait_for(state="visible", timeout=15000)
    page.wait_for_timeout(350)
    audit_layout(page, f"arena:{label}", layout_issues)

    # Acelera para ×3 e liga Auto (tolerando re-render rápido da arena)
    vel_btn = page.locator(".arena [data-vel]").first
    for _ in range(3):
        try:
            if not vel_btn.is_visible():
                break
            txt = (vel_btn.text_content(timeout=1500) or "").strip()
            if "3" in txt:
                break
            vel_btn.click(force=True, timeout=1500)
            page.wait_for_timeout(80)
        except Exception:
            break

    auto_btn = page.locator(".arena [data-auto]").first
    try:
        if auto_btn.is_visible():
            cls = auto_btn.get_attribute("class", timeout=1500) or ""
            if "on" not in cls.split():
                auto_btn.click(force=True, timeout=1500)
    except Exception:
        pass

    # Espera a tela de fim da batalha (.tb-fim)
    fim = page.locator(".tb-fim").first
    fim.wait_for(state="visible", timeout=timeout_ms)
    texto_fim = (fim.inner_text() or "").strip()
    vitoria = "vitória" in texto_fim.lower() or "vitoria" in texto_fim.lower() or "🏆" in texto_fim
    audit_layout(page, f"arena-fim:{label}", layout_issues)

    # Clica no botão principal de sair/continuar dentro de .tb-fim
    btn_fim = fim.locator("button").first
    btn_fim.click(force=True)
    page.wait_for_timeout(350)

    # Se abrir a tela rica de resultado (#res-batalha-overlay), audita o layout e clica em Continuar
    res_ov = page.locator("#res-batalha-overlay").first
    if res_ov.is_visible():
        audit_layout(page, f"resultado:{label}", layout_issues)
        btn_rb = res_ov.locator("[data-rb-voltar]").first
        if btn_rb.is_visible():
            btn_rb.click(force=True)
            page.wait_for_timeout(250)
    return {"vitoria": vitoria, "texto": texto_fim[:160]}


def run_viewport_e2e(base_url: str, vp_name: str, vp_cfg: dict[str, Any]) -> dict[str, Any]:
    console_errors: list[str] = []
    page_errors: list[str] = []
    http_errors: list[dict[str, Any]] = []
    api_static_404: list[dict[str, Any]] = []
    layout_issues: list[dict[str, Any]] = []
    steps: list[dict[str, Any]] = []

    def record(name: str, ok: bool, detail: str = "") -> None:
        steps.append({"etapa": name, "ok": ok, "detalhe": detail})
        print(f"  [{vp_name}] {'PASS' if ok else 'FAIL'} {name} — {detail}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--disable-gpu"])
        context = browser.new_context(
            viewport={"width": vp_cfg["width"], "height": vp_cfg["height"]},
            is_mobile=vp_cfg["is_mobile"],
            has_touch=vp_cfg["has_touch"],
        )
        page = context.new_page()

        # Reduz animações/VFX de vídeo para não travar em headless sem GPU, mantendo toda a lógica
        page.on(
            "console",
            lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None,
        )
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        def on_response(resp: Any) -> None:
            if resp.status >= 400:
                url = resp.url
                entry = {"status": resp.status, "url": url.replace(base_url, "")}
                if "/api/" in url or "supabase" in url:
                    api_static_404.append(entry)
                else:
                    http_errors.append(entry)

        page.on("response", on_response)

        t0 = time.perf_counter()
        page.goto(f"{base_url}{GAME_PATH}", wait_until="domcontentloaded", timeout=30000)
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        t_boot_start = time.perf_counter()
        page.reload(wait_until="load", timeout=30000)
        page.wait_for_selector("#conta-gate.aberto, #conta-gate", timeout=15000)
        t_boot_ms = round((time.perf_counter() - t_boot_start) * 1000)

        perf_nav = page.evaluate(
            """() => {
              const n = performance.getEntriesByType('navigation')[0];
              if (!n) return null;
              return {
                domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
                loadEventMs: Math.round(n.loadEventEnd),
                transferKB: Math.round((n.transferSize || 0) / 1024),
              };
            }"""
        )

        # ---- 1. Conta nova sem conta ----
        try:
            audit_layout(page, "conta-gate", layout_issues)
            btn_local = page.locator('#conta-gate [data-acao="local"]').first
            btn_local.wait_for(state="visible", timeout=10000)
            btn_local.click()
            page.locator('#conta-gate [data-ini]').first.wait_for(state="visible", timeout=10000)
            record("1. Conta nova sem conta", True, f"gate abriu em {t_boot_ms}ms")
        except Exception as exc:
            record("1. Conta nova sem conta", False, str(exc))
            browser.close()
            return _pack_result(vp_name, steps, console_errors, page_errors, http_errors, api_static_404, layout_issues, t_boot_ms, perf_nav)

        # ---- 2. Escolha do inicial ----
        chosen_starter = "Brasinha"
        try:
            audit_layout(page, "escolha-inicial", layout_issues)
            card_ini = page.locator(f'#conta-gate [data-ini="{chosen_starter}"]').first
            if not card_ini.count():
                card_ini = page.locator('#conta-gate [data-ini]').first
                chosen_starter = card_ini.get_attribute("data-ini") or "Brasinha"
            card_ini.click()
            page.locator('#conta-gate [data-acao="comecar-local"]').click()
            page.wait_for_selector("#modal-exp.aberto", timeout=10000)
            equipe_ini = page.evaluate("() => window.regiao1?.save?.()?.idle?.equipe?.map(m => m.especie) || []")
            assert chosen_starter in equipe_ini, f"Inicial {chosen_starter} ausente em {equipe_ini}"
            record("2. Escolha do inicial", True, f"inicial={chosen_starter}, equipe={equipe_ini}")
        except Exception as exc:
            record("2. Escolha do inicial", False, str(exc))

        # ---- 3. Refúgio ----
        try:
            page.wait_for_timeout(350)
            audit_layout(page, "refugio", layout_issues)
            for acao in ["campanhaMini", "torres", "calaboucos", "reliquias", "equipe", "campanha"]:
                assert page.locator(f'#modal-exp [data-desc-ir="{acao}"]').first.is_visible(), f"Botão {acao} invisível no Refúgio"
            record("3. Refúgio", True, "todos os modos visíveis no Refúgio")
        except Exception as exc:
            record("3. Refúgio", False, str(exc))

        # ---- 4. Campanha → primeira batalha ----
        try:
            page.locator('#modal-exp [data-desc-ir="campanha"]').first.click()
            page.wait_for_timeout(450)
            # Primeira entrada na Campanha abre o tutorial curto (#modal-tutorial)
            tut_pular = page.locator("#modal-tutorial.aberto #btn-tut-pular").first
            if tut_pular.is_visible():
                audit_layout(page, "campanha-tutorial", layout_issues)
                tut_pular.click()
                page.wait_for_timeout(250)
            audit_layout(page, "campanha-mapa", layout_issues)
            # Entra na área E1 (primeira trilha com selvagens) e interage com o selvagem mais próximo
            mapa_bat = page.evaluate(
                """async () => {
                  await window.regiao1.irPara('E1');
                  return window.regiao1.mapaAtual();
                }"""
            )
            page.wait_for_function("() => (window.regiao1?.selvagensInfo?.()?.length || 0) > 0", timeout=10000)
            # Aproxima do selvagem w_e1_5 (pos [459, 326]) e aciona interagir() (mesma função de [E] Interagir)
            page.evaluate(
                """() => {
                  window.regiao1.moverPx(459, 326);
                }"""
            )
            page.wait_for_timeout(180)
            page.evaluate("() => window.regiao1.interagir()")
            res_bat = wait_and_finish_arena_battle(page, "campanha-primeira", layout_issues, timeout_ms=45000)
            page.wait_for_timeout(300)
            record("4. Campanha → primeira batalha", True, f"mapa={mapa_bat}, vitoria={res_bat['vitoria']}")
        except Exception as exc:
            record("4. Campanha → primeira batalha", False, str(exc))

        # Volta ao Refúgio pelo Menu real
        def abrir_refugio_via_ui() -> None:
            # Fecha overlay de resultado da Campanha Mini se estiver aberto
            cm_res_mapa = page.locator("#cm-resultado-overlay [data-res-mapa]").first
            if cm_res_mapa.is_visible():
                cm_res_mapa.click(force=True)
                page.wait_for_timeout(200)
            # Fecha Campanha Mini se estiver aberta
            for _ in range(2):
                vb = page.locator("#modal-campanha-mini.aberto [data-cm-voltar]").first
                if vb.is_visible():
                    vb.click(force=True)
                    page.wait_for_timeout(200)
            if page.locator("#modal-exp.aberto [data-desc-ir='campanhaMini']").first.is_visible():
                return
            btn_voltar = page.locator("#modal-exp.aberto .btn-voltar-refugio").first
            if btn_voltar.is_visible():
                btn_voltar.click(force=True)
                page.wait_for_timeout(250)
                return
            # Fecha tutorial de campanha se estiver aberto
            tut_p = page.locator("#modal-tutorial.aberto #btn-tut-pular").first
            if tut_p.is_visible():
                tut_p.click(force=True)
                page.wait_for_timeout(200)
            page.locator("#btn-menu-geral").click(force=True)
            page.locator("#m-descanso").wait_for(state="visible", timeout=5000)
            page.locator("#m-descanso").click(force=True)
            page.locator('#modal-exp [data-desc-ir="campanhaMini"]').first.wait_for(state="visible", timeout=8000)

        # ---- 5. Campanha Mini fase 1-1 ----
        try:
            abrir_refugio_via_ui()
            page.locator('#modal-exp [data-desc-ir="campanhaMini"]').first.click()
            page.wait_for_selector("#modal-campanha-mini.aberto", timeout=10000)
            audit_layout(page, "campanha-mini-caps", layout_issues)
            page.locator('#modal-campanha-mini [data-cm-cap="1"]').first.click()
            page.locator('#modal-campanha-mini [data-cm-lutar="1-1"]').first.wait_for(state="visible", timeout=8000)
            audit_layout(page, "campanha-mini-1-1", layout_issues)
            page.locator('#modal-campanha-mini [data-cm-lutar="1-1"]').first.click()
            res_cm = wait_and_finish_arena_battle(page, "campanha-mini-1-1", layout_issues, timeout_ms=45000)
            # Fecha overlay de resultado da Campanha Mini se apareceu
            if page.locator("#cm-resultado-overlay").first.is_visible():
                audit_layout(page, "campanha-mini-resultado", layout_issues)
                page.locator("#cm-resultado-overlay [data-res-mapa]").first.click(force=True)
                page.wait_for_timeout(250)
            cm_est = page.evaluate("() => window.regiao1?.save?.()?.idle?.campanhaMini?.fases?.['1-1']?.estrelas || 0")
            # Volta do mapa do capítulo para o Refúgio
            for _ in range(2):
                vb = page.locator("#modal-campanha-mini.aberto [data-cm-voltar]").first
                if vb.is_visible():
                    vb.click(force=True)
                    page.wait_for_timeout(200)
            record("5. Campanha Mini fase 1-1", res_cm["vitoria"] and cm_est > 0, f"vitoria={res_cm['vitoria']}, estrelas={cm_est}")
        except Exception as exc:
            record("5. Campanha Mini fase 1-1", False, str(exc))

        # ---- 6. Torre andar 1 ----
        try:
            abrir_refugio_via_ui()
            # Dá nível suficiente ao inicial para vencer de forma determinística o Andar 1 da Torre e o Chefe Nv.19 do Calabouço Nv.1
            page.evaluate(
                """() => {
                  const s = window.regiao1.save();
                  const m = s.idle?.equipe?.[0];
                  if (m && (m.nivel || 1) < 55) { m.nivel = 55; m.xp = Math.max(m.xp || 0, 28000); }
                  window.regiao1.salvar();
                }"""
            )
            page.locator('#modal-exp [data-desc-ir="torres"]').first.click()
            page.locator("#modal-exp [data-tor-lutar-el]").first.wait_for(state="visible", timeout=8000)
            audit_layout(page, "torres-andar-1", layout_issues)
            # Seleciona a torre compatível com o elemento do inicial (Brasinha = fogo -> torre ígnea)
            btn_torre_fogo = page.locator('#modal-exp [data-tor-el="ignea"]').first
            if btn_torre_fogo.count() and btn_torre_fogo.is_visible():
                btn_torre_fogo.click()
                page.wait_for_timeout(200)
            page.locator("#modal-exp [data-tor-lutar-el]").first.click()
            res_tor = wait_and_finish_arena_battle(page, "torre-andar-1", layout_issues, timeout_ms=45000)
            tor_maior = page.evaluate("() => window.regiao1?.save?.()?.idle?.torres?.elementais || {}")
            venceu_alguma = any((int((v or {}).get("maiorAndar") or 0) if isinstance(v, dict) else int(v or 0)) >= 1 for v in tor_maior.values())
            record("6. Torre andar 1", res_tor["vitoria"] and venceu_alguma, f"vitoria={res_tor['vitoria']}, andares={tor_maior}")
        except Exception as exc:
            record("6. Torre andar 1", False, str(exc))

        # ---- 7. Calabouço nível 1 ----
        try:
            abrir_refugio_via_ui()
            page.locator('#modal-exp [data-desc-ir="calaboucos"]').first.click()
            page.locator("#modal-exp [data-cal-lutar]").first.wait_for(state="visible", timeout=8000)
            audit_layout(page, "calaboucos-nv1", layout_issues)
            page.locator("#modal-exp [data-cal-lutar]").first.click()
            res_cal = wait_and_finish_arena_battle(page, "calabouco-nv1", layout_issues, timeout_ms=45000)
            cal_state = page.evaluate("() => window.regiao1?.save?.()?.idle?.calaboucos || {}")
            maior_cal = any((v or 0) >= 1 for v in (cal_state.get("maiorNivel") or {}).values())
            record("7. Calabouço nível 1", res_cal["vitoria"] and maior_cal, f"vitoria={res_cal['vitoria']}, maiorNivel={cal_state.get('maiorNivel')}")
        except Exception as exc:
            record("7. Calabouço nível 1", False, str(exc))

        # ---- 8. Equipar relíquia ----
        equipped_relic_id = None
        try:
            abrir_refugio_via_ui()
            # Garante que exista ao menos uma relíquia na bolsa compatível com o elemento do inicial (fogo)
            # aproveitando a relíquia real dropada pelo Calabouço Nv.1
            page.evaluate(
                """() => {
                  const s = window.regiao1.save();
                  const m = s.idle?.equipe?.[0];
                  const elIni = m?.elemento || 'fogo';
                  const bolsa = s.idle?.reliquias?.bolsa || [];
                  if (bolsa.length > 0 && !bolsa.some((r) => r.elemento === elIni)) {
                    bolsa[0].elemento = elIni;
                    window.regiao1.salvar();
                  }
                }"""
            )
            page.locator('#modal-exp [data-desc-ir="reliquias"]').first.click()
            page.locator("#modal-exp [data-rel-eq]:not([disabled])").first.wait_for(state="visible", timeout=6000)
            audit_layout(page, "reliquias", layout_issues)
            btn_eq = page.locator("#modal-exp [data-rel-eq]:not([disabled])").first
            equipped_relic_id = btn_eq.get_attribute("data-rel-eq")
            btn_eq.click()
            page.wait_for_timeout(300)
            eq_check = page.evaluate(
                """(rid) => {
                  const s = window.regiao1.save();
                  const uid = s.idle?.equipe?.[0]?.uid;
                  const eqMap = s.idle?.reliquias?.equipadas?.[uid] || {};
                  return Object.values(eqMap).includes(rid);
                }""",
                equipped_relic_id,
            )
            record("8. Equipar relíquia", eq_check, f"reliquia={equipped_relic_id}, equipada={eq_check}")
        except Exception as exc:
            audit_layout(page, "reliquias-erro", layout_issues)
            record("8. Equipar relíquia", False, str(exc))

        # ---- 9. Evoluir Onírico ----
        evolved_species = None
        try:
            abrir_refugio_via_ui()
            page.locator('#modal-exp [data-desc-ir="equipe"]').first.click()
            page.wait_for_timeout(300)
            audit_layout(page, "equipe", layout_issues)
            # Abre a ficha do inicial clicando no card na coleção ([data-eq-col])
            ini_uid = page.evaluate("() => window.regiao1.save().idle.equipe[0]?.uid")
            ficha_btn = page.locator(f'#modal-exp [data-eq-col="{ini_uid}"]').first
            if not ficha_btn.count():
                ficha_btn = page.locator("#modal-exp [data-eq-col]").first
            ficha_btn.click(force=True)
            page.locator("#ficha-onirico").wait_for(state="visible", timeout=8000)
            audit_layout(page, "ficha-evolucao", layout_issues)

            # Confere que sem Essências suficientes o botão Evoluir está bloqueado
            btn_evo = page.locator("#ficha-onirico [data-evo-forma]").first
            bloqueado_antes = btn_evo.is_disabled()
            ficha_txt = page.locator("#ficha-onirico").inner_text()
            mostra_essencia = "Essência" in ficha_txt or "💠" in ficha_txt

            # Concede Fragmentos (em idle.mochila.fragmentosSonho) + Essências e reabre a ficha para clicar em Evoluir
            page.evaluate(
                """() => {
                  const s = window.regiao1.save();
                  const m = s.idle.equipe[0];
                  m.nivel = Math.max(m.nivel || 1, 20);
                  s.idle.mochila = s.idle.mochila || {};
                  s.idle.mochila.fragmentosSonho = s.idle.mochila.fragmentosSonho || {};
                  for (const el of ['fogo','agua','planta','trevas','luz','eletrico','voador','aco','pedra','terra','inseto','neutro']) {
                    s.idle.mochila.fragmentosSonho[el] = Math.max(s.idle.mochila.fragmentosSonho[el] || 0, 200);
                  }
                  s.idle.essencias = s.idle.essencias || {};
                  for (const par of ['ignea','mares','verde','mineral','solar','sombria']) {
                    s.idle.essencias[par] = { menor: 30, media: 20, maior: 10 };
                  }
                  window.regiao1.salvar();
                }"""
            )
            # Fecha e reabre a ficha via UI para re-renderizar com saldo atualizado
            page.locator("#ficha-onirico [data-ficha-fechar]").click()
            page.wait_for_timeout(150)
            ficha_btn = page.locator(f'#modal-exp [data-eq-col="{ini_uid}"]').first
            if not ficha_btn.count():
                ficha_btn = page.locator("#modal-exp [data-eq-col]").first
            ficha_btn.click(force=True)
            page.locator("#ficha-onirico [data-evo-forma]:not([disabled])").first.wait_for(state="visible", timeout=8000)
            page.locator("#ficha-onirico [data-evo-forma]").first.click()
            page.wait_for_timeout(300)
            evolved_species = page.evaluate("() => window.regiao1.save().idle.equipe[0]?.especie")
            ok_evo = bool(bloqueado_antes and mostra_essencia and evolved_species and evolved_species != chosen_starter)
            record(
                "9. Evoluir Onírico",
                ok_evo,
                f"bloqueadoSemEssencia={bloqueado_antes}, mostraEssencia={mostra_essencia}, {chosen_starter}->{evolved_species}",
            )
        except Exception as exc:
            record("9. Evoluir Onírico", False, str(exc))

        # ---- 10. Trocar domador ----
        try:
            abrir_refugio_via_ui()
            page.locator('#modal-exp [data-desc-ir="equipe"]').first.click()
            page.wait_for_timeout(200)
            # Garante diamantes para desbloquear o Manipulador das Oito Lâminas pela UI e selecioná-lo
            page.evaluate(
                """() => {
                  const s = window.regiao1.save();
                  s.recompensas = s.recompensas || {};
                  s.recompensas.diamantes = Math.max(s.recompensas.diamantes || 0, 2000);
                  window.regiao1.salvar();
                }"""
            )
            page.locator('#modal-exp [role="tab"][data-aba="1"]').first.click()
            page.locator('#modal-exp [data-dom-desbl], #modal-exp [data-dom-sel="manipulador"]').first.wait_for(state="visible", timeout=8000)
            audit_layout(page, "domadores", layout_issues)
            btn_desbl = page.locator('#modal-exp [data-dom-desbl^="manipulador:"]').first
            if btn_desbl.count() and btn_desbl.is_visible():
                btn_desbl.click()
                page.wait_for_timeout(250)
            btn_sel = page.locator('#modal-exp [data-dom-sel="manipulador"]').first
            if btn_sel.count() and not btn_sel.is_disabled():
                btn_sel.click()
                page.wait_for_timeout(250)
            dom_ativo = page.evaluate("() => window.regiao1.save().idle?.domadores?.ativo")
            record("10. Trocar domador", dom_ativo == "manipulador", f"domadorAtivo={dom_ativo}")
        except Exception as exc:
            record("10. Trocar domador", False, str(exc))

        # ---- 11. Recarregar a página e conferir persistência ----
        try:
            page.reload(wait_until="load", timeout=30000)
            page.wait_for_timeout(600)
            if page.locator('#conta-gate.aberto [data-acao="local"]').first.is_visible():
                page.locator('#conta-gate.aberto [data-acao="local"]').first.click()
                page.wait_for_timeout(400)
            persisted = page.evaluate(
                """(args) => {
                  const s = window.regiao1?.save?.();
                  const u0 = s?.idle?.equipe?.[0];
                  const esp = u0?.especie;
                  const cm = s?.idle?.campanhaMini?.fases?.['1-1']?.estrelas || 0;
                  const tor = Object.values(s?.idle?.torres?.elementais || {}).some((v) => (typeof v === 'object' ? (v?.maiorAndar || 0) : (v || 0)) >= 1);
                  const cal = Object.values(s?.idle?.calaboucos?.maiorNivel || {}).some((v) => v >= 1);
                  const eqMap = (u0 && s?.idle?.reliquias?.equipadas?.[u0.uid]) || {};
                  const rel = Boolean(args.rid && Object.values(eqMap).includes(args.rid));
                  const dom = s?.idle?.domadores?.ativo;
                  return { esp, cm, tor, cal, rel, dom };
                }""",
                {"rid": equipped_relic_id},
            )
            ok_persist = (
                persisted["esp"] == evolved_species
                and persisted["cm"] > 0
                and persisted["tor"] is True
                and persisted["cal"] is True
                and persisted["rel"] is True
                and persisted["dom"] == "manipulador"
            )
            record("11. Persistência após reload", ok_persist, json.dumps(persisted, ensure_ascii=False))
        except Exception as exc:
            record("11. Persistência após reload", False, str(exc))

        browser.close()

    return _pack_result(vp_name, steps, console_errors, page_errors, http_errors, api_static_404, layout_issues, t_boot_ms, perf_nav)


def _pack_result(
    vp_name: str,
    steps: list[dict[str, Any]],
    console_errors: list[str],
    page_errors: list[str],
    http_errors: list[dict[str, Any]],
    api_static_404: list[dict[str, Any]],
    layout_issues: list[dict[str, Any]],
    t_boot_ms: int,
    perf_nav: Any,
) -> dict[str, Any]:
    all_steps_ok = all(s["ok"] for s in steps) and len(steps) == 11
    return {
        "viewport": vp_name,
        "ok": all_steps_ok and len(page_errors) == 0 and len(http_errors) == 0,
        "bootMs": t_boot_ms,
        "navigation": perf_nav,
        "steps": steps,
        "consoleErrors": console_errors,
        "pageErrors": page_errors,
        "httpErrors": http_errors,
        "apiStatic404Count": len(api_static_404),
        "layoutIssues": layout_issues,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="E2E Playwright Confusion Waves (Desktop + Mobile 844x390)")
    parser.add_argument("--only", choices=["desktop", "mobile"], help="Rodar apenas um viewport")
    parser.add_argument("--json-out", help="Salvar relatório JSON neste caminho")
    args = parser.parse_args()

    server, base_url = start_static_server(REPO_ROOT)
    targets = [args.only] if args.only else ["desktop", "mobile"]
    results = []
    try:
        for name in targets:
            ultimo_erro: Exception | None = None
            for tentativa in range(4):
                try:
                    results.append(run_viewport_e2e(base_url, name, VIEWPORTS[name]))
                    ultimo_erro = None
                    break
                except Exception as exc:
                    ultimo_erro = exc
                    if tentativa < 3 and "Page crashed" in str(exc):
                        print(f"  [{name}] Aviso: Chromium crash transitório no boot; repetindo...", flush=True)
                        time.sleep(3)
                        continue
                    break
            if ultimo_erro is not None:
                if len(targets) > 1 and "Page crashed" in str(ultimo_erro):
                    import subprocess
                    tmp_j = Path("/tmp") / f"e2e_fluxo_{name}_{os.getpid()}.json"
                    print(f"  [{name}] Isolando resolução em processo separado após crashes do Chromium...", flush=True)
                    try:
                        subprocess.run([sys.executable, "-u", str(Path(__file__).resolve()), "--viewport", name, "--json-out", str(tmp_j)], check=True, timeout=420)
                        results.extend(json.loads(tmp_j.read_text(encoding="utf-8")))
                    finally:
                        tmp_j.unlink(missing_ok=True)
                else:
                    raise ultimo_erro
    finally:
        server.shutdown()

    if args.json_out:
        Path(args.json_out).write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

    exit_code = 0
    for r in results:
        print(f"\n=== E2E [{r['viewport']}] · boot={r['bootMs']}ms · nav={r['navigation']} ===")
        for s in r["steps"]:
            mark = "PASS" if s["ok"] else "FAIL"
            print(f"  [{mark}] {s['etapa']} — {s['detalhe']}")
        print(f"  Console errors: {len(r['consoleErrors'])}")
        for e in r["consoleErrors"][:10]:
            print(f"    - {e}")
        print(f"  Page errors: {len(r['pageErrors'])}")
        for e in r["pageErrors"][:10]:
            print(f"    - {e}")
        print(f"  Asset HTTP >=400: {len(r['httpErrors'])} (API static 404 ignorados: {r['apiStatic404Count']})")
        counts: dict[tuple[int, str], int] = {}
        for e in r["httpErrors"]:
            k = (e["status"], e["url"])
            counts[k] = counts.get(k, 0) + 1
        for (st, u), n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0][1]))[:20]:
            print(f"    - {n}x {st} {u}")
        print(f"  Layout issues: {len(r['layoutIssues'])}")
        for e in r["layoutIssues"][:15]:
            print(f"    - [{e['tipo']}] {e['contexto']}: {e['detalhe']}")
        if not r["ok"]:
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
