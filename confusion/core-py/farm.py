"""Fazenda por aptidão: cada tarefa vai ao monstrinho livre com o maior nível naquela aptidão."""
from dataclasses import dataclass, field
from typing import Dict

APTITUDES = {"plantar", "colher", "minerar", "cortar", "garimpar", "transportar", "cozinhar", "fabricar"}

@dataclass
class Worker:
    monster_id: str
    aptitudes: Dict[str, int] = field(default_factory=dict)  # tarefa -> nível (1 a 10)
    busy: bool = False

def assign(tasks, workers):
    for t in tasks:
        if t not in APTITUDES:
            raise ValueError(f"tarefa desconhecida: {t}")
    mapping, unassigned = {}, []
    for t in tasks:
        cands = [w for w in workers if not w.busy and w.aptitudes.get(t, 0) > 0]
        if not cands:
            unassigned.append(t)
            continue
        best = max(cands, key=lambda w: (w.aptitudes[t], -ord(w.monster_id[0])))
        best.busy = True
        mapping[t] = best.monster_id
    return mapping, unassigned
