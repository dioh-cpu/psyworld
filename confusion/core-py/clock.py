"""Ciclo de dia e noite pelo horário de Brasília (decisão v1.9 decisão 11). Brasília está em UTC-3 sem horário de verão desde 2019."""
from datetime import datetime, timezone, timedelta

BRT = timezone(timedelta(hours=-3))
DAY_START, DAY_END = 6, 18  # provisório

def phase(utc_dt: datetime) -> str:
    local = utc_dt.astimezone(BRT)
    return "dia" if DAY_START <= local.hour < DAY_END else "noite"

def can_spawn(window: str, current_phase: str) -> bool:
    if window == "ambos":
        return True
    if window not in ("dia", "noite"):
        raise ValueError(window)
    return window == current_phase
