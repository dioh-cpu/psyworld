"""Vínculo com o monstrinho: comida sobe ou desce; evolução depende do vínculo (decisões v1.5)."""

def clamp(v, lo=0, hi=100):
    return max(lo, min(hi, v))

def apply_food(monster, delta: int):
    monster.vinculo = clamp(monster.vinculo + delta)
    return monster.vinculo

# Tabela de evolução PROVISÓRIA: espécie -> (vínculo mínimo, espécie resultante).
EVOLUTION = {"Ignavor": (70, "Ignavor II (provisório)")}

def try_evolve(monster):
    rule = EVOLUTION.get(monster.species)
    if rule and monster.vinculo >= rule[0]:
        monster.species = rule[1]
        return rule[1]
    return None
