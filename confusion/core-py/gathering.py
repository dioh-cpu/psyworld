"""Coleta de recursos: espera de 10 min por ponto, retorno decrescente em janela de 1 h,
ferramenta obrigatória e falha de sanidade que reduz sem bloquear (GDD v1.4/v1.5).
Paridade com confusion/web/core.js."""
from dataclasses import dataclass

COOLDOWN_MIN = 10   # minutos de espera por ponto
WINDOW_MIN = 60     # janela para o retorno decrescente

@dataclass
class Node:
    resource: str
    required_tool: str
    base_qty: int
    next_available_min: int = 0
    last_minute: int = None
    harvests_in_window: int = 0

def harvest(node: Node, tool: str, now_minute: int, sanity_fail: bool, health: int = 100) -> dict:
    if tool != node.required_tool:
        raise ValueError(f"precisa de {node.required_tool}")
    if now_minute < node.next_available_min:
        return {"resource": node.resource, "qty": 0, "emCooldown": True,
                "restanteMin": node.next_available_min - now_minute, "ferimento": False, "vida": health}
    if node.last_minute is None or now_minute - node.last_minute >= WINDOW_MIN:
        node.harvests_in_window = 0
    qty = max(1, node.base_qty // (1 + node.harvests_in_window))
    node.harvests_in_window += 1
    node.last_minute = now_minute
    node.next_available_min = now_minute + COOLDOWN_MIN
    wound = False
    if sanity_fail:
        qty = max(1, qty // 2)   # falha reduz, nunca bloqueia
        wound = True
        health = max(0, health - 5)
    return {"resource": node.resource, "qty": qty, "emCooldown": False, "ferimento": wound, "vida": health}
