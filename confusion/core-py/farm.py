"""Fazenda operada por monstrinhos por aptidão (decisão v1.9 decisão 19)."""
from dataclasses import dataclass, field
from typing import Set

APTITUDES = {"plantar", "colher", "minerar", "transportar", "cozinhar", "fabricar"}

@dataclass
class Worker:
    monster_id: str
    level: int
    aptitudes: Set[str] = field(default_factory=set)
    busy: bool = False

def assign(tasks, workers):
    """Cada tarefa vai ao monstrinho livre com a aptidão e o nível mais altos. Sobras ficam sem tarefa."""
    for t in tasks:
        if t not in APTITUDES:
            raise ValueError(f"tarefa desconhecida: {t}")
    mapping, unassigned = {}, []
    for t in tasks:
        candidates = [w for w in workers if not w.busy and t in w.aptitudes]
        if not candidates:
            unassigned.append(t)
            continue
        best = max(candidates, key=lambda w: (w.level, w.monster_id))
        best.busy = True
        mapping[t] = best.monster_id
    return mapping, unassigned
