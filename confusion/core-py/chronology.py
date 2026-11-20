"""Cronologia: eventos com origem, dia de ativação e proteção de duas horas (GDD v1.3/v1.4)."""
from dataclasses import dataclass, field
from typing import Dict, List, Optional

PROTECTION_MINUTES = 120  # 2 horas de tempo de jogo (decisão v1.9)

@dataclass
class WorldEvent:
    id: str
    world: str
    origin_day: int
    sets: Dict[str, str]
    activates_day: Optional[int] = None  # None = ativa no próprio dia de origem

    @property
    def day(self):
        return self.origin_day if self.activates_day is None else self.activates_day

class Chronology:
    def __init__(self, defaults: Optional[Dict[str, Dict[str, str]]] = None):
        self.events: List[WorldEvent] = []
        self.defaults = defaults or {}
        self.memory: List[str] = []           # Memória do Mundo (sistema 29)
        self.protection_start: Dict[str, int] = {}

    def add(self, event: WorldEvent):
        if any(e.id == event.id for e in self.events):
            return  # idempotente
        self.events.append(event)
        self.memory.append(event.id)

    def state(self, world: str, day: int) -> Dict[str, str]:
        st = dict(self.defaults.get(world, {}))
        for e in sorted((e for e in self.events if e.world == world and e.day <= day),
                        key=lambda e: (e.day, self.events.index(e))):
            st.update(e.sets)
        return st

    def notify_protection(self, world: str, minute: int):
        self.protection_start[world] = minute

    def can_act_again(self, world: str, minute: int) -> bool:
        """Após o aviso, o vilão tem uma janela de proteção; só depois pode agir de novo."""
        start = self.protection_start.get(world)
        return start is None or minute >= start + PROTECTION_MINUTES
