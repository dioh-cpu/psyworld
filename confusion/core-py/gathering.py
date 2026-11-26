"""Coleta automática pela fazenda: aptidões de trabalho com nível 1 a 10 (velocidade e bônus).
Sem penalidade de coleta. Paridade com confusion/web/core.js."""
from dataclasses import dataclass

WORK_LEVEL_MAX = 10
XP_PER_WORK_LEVEL = 3
BASE_TASKS_PER_DAY = 3

# Tarefas de coleta: cortar (madeira), minerar (pedra e minério), garimpar (cristal).
GATHER_TASKS = {
    "cortar": {"resource": "madeira", "base": 2, "extra": {}},
    "minerar": {"resource": "pedra", "base": 2, "extra": {"minerio": 1}},
    "garimpar": {"resource": "cristal", "base": 1, "extra": {}},
}

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def work_speed(level: int) -> float:
    return 1 + 0.1 * (_clamp(level, 1, WORK_LEVEL_MAX) - 1)

def work_bonus(level: int) -> float:
    return 1 + 0.05 * (_clamp(level, 1, WORK_LEVEL_MAX) - 1)

def tasks_per_day(level: int) -> int:
    return max(1, round(BASE_TASKS_PER_DAY * work_speed(level)))

def gather_day(task: str, level: int) -> dict:
    g = GATHER_TASKS.get(task)
    if not g:
        return {}
    n = tasks_per_day(level)
    out = {g["resource"]: int(g["base"] * work_bonus(level) * n)}
    for r, q in g["extra"].items():
        out[r] = int(q * work_bonus(level) * n)
    return out

def add_work_xp(aptitudes: dict, xp: dict, task: str, tasks: int = 1) -> int:
    level = aptitudes.get(task, 1)
    xp[task] = xp.get(task, 0) + tasks
    while xp[task] >= XP_PER_WORK_LEVEL * level and aptitudes.get(task, 0) < WORK_LEVEL_MAX:
        xp[task] -= XP_PER_WORK_LEVEL * level
        aptitudes[task] = aptitudes.get(task, 0) + 1
        level = aptitudes[task]
    return aptitudes.get(task, 0)
