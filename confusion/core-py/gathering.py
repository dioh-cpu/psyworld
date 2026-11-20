"""Coleta de recursos: nós, ferramentas, retorno decrescente, falha de sanidade que nunca bloqueia (decisões v1.4 e v1.5)."""
from dataclasses import dataclass

@dataclass
class Node:
    resource: str
    required_tool: str
    base_qty: int
    regen_minutes: int = 240
    last_minute: int = -10**9
    harvests_in_window: int = 0

def harvest(node: Node, tool: str, now_minute: int, sanity_fail: bool, health: int = 100) -> dict:
    if tool != node.required_tool:
        raise ValueError(f"precisa de {node.required_tool}")
    if now_minute - node.last_minute >= node.regen_minutes:
        node.harvests_in_window = 0          # o nó regenerou
    qty = max(1, int(node.base_qty / (1 + node.harvests_in_window)))  # retorno decrescente
    node.harvests_in_window += 1
    node.last_minute = now_minute
    wound = False
    if sanity_fail:
        qty = max(1, qty // 2)              # falha reduz quantidade, nunca bloqueia
        wound = True
        health = max(0, health - 5)
    return {"resource": node.resource, "qty": qty, "ferimento": wound, "vida": health}
