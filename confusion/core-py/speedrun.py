"""Corrida assíncrona V1: tempo e fantasma; conta só a primeira conclusão de cada campanha; ranking mensal (decisão v1.4 e v1.9)."""
from dataclasses import dataclass, field
from typing import List, Tuple

@dataclass
class Run:
    campaign_id: str
    player: str
    start_s: int
    ghost: List[Tuple[int, int, int]] = field(default_factory=list)  # (t, x, y)

class Ranking:
    def __init__(self):
        self.entries = {}   # (campanha) -> entrada válida (primeira conclusão)

    def complete(self, run: Run, end_s: int, period: str):
        if run.campaign_id in self.entries:
            return None                       # só a primeira conclusão conta
        seconds = end_s - run.start_s
        self.entries[run.campaign_id] = {"player": run.player, "seconds": seconds,
                                         "period": period, "ghost": list(run.ghost)}
        return seconds

    def monthly(self, period: str):
        rows = [(e["seconds"], e["player"]) for e in self.entries.values() if e["period"] == period]
        return sorted(rows)
