"""Sanidade: mudanças por fonte, retorno decrescente e falha em ação comum (GDD v1.3)."""
import math
from rules import sanity_band

SOURCE_DELTAS = {"descanso": 5, "purificacao": 10, "missao": 15,
                 "trauma": -5, "magia_mental": -8, "crueldade": -10, "ritual": -15}
REPEATABLE = {"descanso", "purificacao", "missao"}  # fontes repetíveis: retorno decrescente
FAILURE_EFFECTS = ["hesitacao", "resposta_impulsiva", "perda_de_concentracao", "desperdicio_limitado"]

def _round_half_up(x: float) -> int:
    return math.floor(x + 0.5)

def apply_change(current: int, source: str, uses: int = 0, mental_resist: float = 0.0) -> int:
    """uses = quantas vezes a fonte já foi usada. mental_resist amortece perdas (máx. 50%)."""
    delta = SOURCE_DELTAS[source]
    if source in REPEATABLE:
        delta = delta / (1 + uses)
    if delta < 0:
        delta = delta * (1 - min(0.5, max(0.0, mental_resist)))
    return max(0, min(100, _round_half_up(current + delta)))

def common_action_failure(sanity: int, roll: float) -> dict:
    """Falha em ação comum NUNCA bloqueia o progresso (regra do GDD)."""
    _, fail = sanity_band(sanity)
    if roll >= fail:
        return {"falhou": False, "efeito": None, "bloqueia": False}
    idx = min(len(FAILURE_EFFECTS) - 1, int(roll / max(fail, 1e-9) * len(FAILURE_EFFECTS)))
    return {"falhou": True, "efeito": FAILURE_EFFECTS[idx], "bloqueia": False}

class CriticalEventLog:
    """Eventos críticos exigem confirmação e persistem o desfecho."""
    def __init__(self):
        self.records = {}

    def resolve(self, event_id: str, confirmed: bool, outcome: str):
        if not confirmed:
            raise ValueError("evento crítico exige confirmação do jogador")
        if event_id in self.records:
            return self.records[event_id]  # idempotente: recarregar ou reconectar não muda o desfecho
        self.records[event_id] = {"outcome": outcome}
        return self.records[event_id]
