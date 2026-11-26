"""Reputação, preços, comerciantes e partes (GDD v1.3 e v1.9)."""
RARITY_ORDER = ["comum", "rara", "epica", "lendaria", "mitica"]
NPC_BUY_FRACTION = 0.5  # provisório: jogador vende a NPC por metade do preço base

def reputation_multiplier(rep: int) -> float:
    if rep >= 60: return 0.85
    if rep >= 20: return 0.95
    if rep >= -19: return 1.00
    if rep >= -59: return 1.20
    return 1.50

def relation_multiplier(confidence: int) -> float:
    """Provisório: confiança 50 = neutro; +/-0,2% por ponto, limitado a ±10%."""
    return max(0.90, min(1.10, 1 - 0.002 * (confidence - 50)))

def price(base: float, regional_rep: int, confidence: int) -> int:
    return round(base * reputation_multiplier(regional_rep) * relation_multiplier(confidence))

def rarity_index(r: str) -> int:
    return RARITY_ORDER.index(r)

class Merchant:
    def __init__(self, name: str, max_rarity: str, confidence: int):
        self.name = name
        self.max_rarity = max_rarity
        self.confidence = confidence

    def sells(self, item_rarity: str) -> bool:
        return rarity_index(item_rarity) <= rarity_index(self.max_rarity)

    def refuses(self) -> bool:
        return self.confidence < 15  # confiança muito baixa: pode recusar atendimento

def buy(merchant: Merchant, base: float, rarity: str, regional_rep: int) -> int:
    if merchant.refuses():
        raise ValueError("comerciante recusou atendimento")
    if not merchant.sells(rarity):
        raise ValueError("raridade acima do que este comerciante vende")
    return price(base, regional_rep, merchant.confidence)

def essential_available(merchants, rarity: str) -> bool:
    """Bens essenciais continuam acessíveis por outro comerciante."""
    return any(not m.refuses() and m.sells(rarity) for m in merchants)

def npc_buy_price(base: float) -> int:
    return round(base * NPC_BUY_FRACTION)
