"""Ovos e eclosão: faixa de sanidade define formas elegíveis; resultado fixado e idempotente (GDD v1.3)."""
from dataclasses import dataclass, field
from typing import Optional

COMPAT = {  # alinhamento -> forma -> fator sobre habilidades especiais
    "heroi": {"natural": 1.0, "abencoada": 1.0, "mutante": 0.5},
    "vilao": {"natural": 1.0, "abencoada": 0.5, "mutante": 1.0},
}

def eligible_forms(sanity: int):
    if sanity <= 49:
        return ["natural", "mutante"]
    if sanity == 50:
        return ["natural"]
    return ["natural", "abencoada"]

def pick_form(sanity: int, roll: float) -> str:
    forms = eligible_forms(sanity)
    extreme = sanity <= 10 or sanity >= 90
    if len(forms) == 2 and extreme and roll < 0.6:
        return forms[-1]  # faixas extremas favorecem a forma rara
    return forms[min(len(forms) - 1, int(roll * len(forms)))]

def compatibility(alignment: str, form: str) -> float:
    return COMPAT[alignment][form]

@dataclass
class Egg:
    id: str
    species: str
    seed: int
    result: Optional[dict] = None

def hatch(egg: Egg, sanity: int, roll: float) -> dict:
    """Ao confirmar, fixa sanidade, forma e resultado. Reabrir devolve o mesmo resultado."""
    if egg.result is not None:
        return egg.result
    form = pick_form(sanity, roll)
    egg.result = {"species": egg.species, "form": form, "sanity_fixed": sanity,
                  "purity": {"natural": "neutra", "abencoada": "luz", "mutante": "neutra"}[form],
                  "mutated": form == "mutante"}
    return egg.result
