"""Culinária: menu no inventário, carvão e panela; panela limita a raridade (GDD v1.4 e v1.9 decisões 2 e 17)."""
from dataclasses import dataclass
from economy import RARITY_ORDER

# Panela -> índice máximo de raridade gerável (lendária = sem teto, ou seja, 4 = mítica)
POT_MAX = {"comum": 1, "rara": 2, "epica": 3, "lendaria": 4}
EFFECT_BY_PURITY = {"luz": "cura", "trevas": "confusao", "neutra": "buff"}
ADJ_BY_PURITY = {"luz": "Luminosa", "trevas": "Sombria", "neutra": "Simples"}

@dataclass
class Ingredient:
    name: str
    category: str   # vegetal, erva, fungo, raiz, parte_de_monstro
    purity: str     # luz | neutra | trevas
    freshness: float  # 0..1; cai com o tempo de jogo
    rarity: str     # comum | rara | epica | lendaria | mitica

def dominant_purity(items) -> str:
    counts = {"luz": 0, "trevas": 0, "neutra": 0}
    for i in items:
        counts[i.purity] += 1
    return max(counts, key=lambda p: (counts[p], p == "neutra"))

def cook(base: Ingredient, complement, seasoning, *, pot: str, charcoal: int, skill: int, roll: float) -> dict:
    if charcoal < 1:
        raise ValueError("precisa de carvão")
    if pot not in POT_MAX:
        raise ValueError("panela inválida")
    items = [i for i in (base, complement, seasoning) if i is not None]
    avg_fresh = sum(i.freshness for i in items) / len(items)
    avg_rarity = sum(RARITY_ORDER.index(i.rarity) for i in items) / len(items)
    rarity_idx = min(POT_MAX[pot], round(avg_rarity + skill / 50))
    purity = dominant_purity(items)
    result = {"nome": f"{base.name} {ADJ_BY_PURITY[purity]}", "efeito": EFFECT_BY_PURITY[purity],
              "raridade": RARITY_ORDER[rarity_idx], "carvao_gasto": 1, "vinculo_delta": 5,
              "penalidade": None}
    if avg_fresh < 0.2:  # em decomposição: não serve como comida, mas serve à alquimia
        result.update({"efeito": None, "penalidade": "estragado", "vinculo_delta": -5})
    elif roll < 0.10:
        result.update({"efeito": None, "penalidade": "queimado", "vinculo_delta": -2})
    elif avg_fresh < 0.5 and roll < 0.25:
        result.update({"penalidade": "intoxicacao", "vinculo_delta": -3})
    return result

def stack_freshness(a: float, b: float) -> float:
    """Empilhar itens: o resultado herda o frescor mais baixo (evita exploit de média)."""
    return min(a, b)
