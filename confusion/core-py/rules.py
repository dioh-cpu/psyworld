"""Confusion Waves: núcleo de regras (v0). Código puro, sem render.
Valores vêm do GDD v1.12 e são provisórios até o teste."""
from dataclasses import dataclass, field
from typing import List, Optional

# --- Sanidade (GDD v1.3) ---
SANITY_BANDS = [  # (min, max, nome, falha em ação comum)
    (80, 100, "Lúcido", 0.00),
    (60, 79, "Estável", 0.00),
    (40, 59, "Perturbado", 0.05),
    (20, 39, "Instável", 0.15),
    (0, 19, "Insano", 0.30),  # rótulo "Abalado" em discussão (GDD v1.4 seção 7)
]

def sanity_band(s: int):
    s = max(0, min(100, int(s)))
    for lo, hi, name, fail in SANITY_BANDS:
        if lo <= s <= hi:
            return name, fail
    raise ValueError(s)

def affinity_modifier(sanity: int, role: str) -> float:
    """Herói: +0,4 pp por ponto acima de 50. Vilão: relação inversa. Limite ±20%."""
    delta = 0.004 * (sanity - 50)
    if role == "vilao":
        delta = -delta
    elif role != "heroi":
        raise ValueError(role)
    return max(-0.20, min(0.20, delta))

# --- Breed (substitui a fusão; GDD v1.16). A chance depende do tier do principal ---
BASE_SUCCESS_BY_TIER = {1: 0.80, 2: 0.70, 3: 0.60, 4: 0.50, 5: 0.40}  # proposta de teste
TIER_MAX = 10
SUCCESS_DROP_PER_FUSION = 0.05
FLOOR = 0.20
PITY_PER_FAILURE = 0.05
PITY_CAP = 0.25
ORE_CAP = 0.30
MUTATION_CAP = 0.50

def breed_base_success(tier: int) -> float:
    # tier 6 a 10: sem valor decidido; cai 5 pontos por tier, com piso (provisório)
    return BASE_SUCCESS_BY_TIER.get(tier, max(FLOOR, 0.40 - 0.05 * (tier - 5)))

def breed_success_chance(principal_tier: int, successes_on_principal: int,
                         failures_accumulated: int, ore_bonus: float = 0.0) -> float:
    base = breed_base_success(principal_tier)
    chance = base - SUCCESS_DROP_PER_FUSION * successes_on_principal
    chance = max(FLOOR, chance)
    chance += min(PITY_CAP, PITY_PER_FAILURE * failures_accumulated)
    chance += min(ORE_CAP, max(0.0, ore_bonus))
    return min(0.95, chance)

def mutation_chance(ingredient_bonuses: List[float], base: float = 0.0) -> float:
    return min(MUTATION_CAP, base + sum(max(0.0, b) for b in ingredient_bonuses))

# --- Híbridos e habilidades (GDD v1.9 decisões 4, 7, 8) ---
ACTIVE_SLOTS_COMMON = 4
ACTIVE_SLOTS_HYBRID = 5   # 4 + 1 absorvida
PASSIVE_SLOTS_HYBRID = 2
MAX_ABILITY_LEVEL = 5

def ability_efficiency(level: int) -> float:
    level = max(1, min(MAX_ABILITY_LEVEL, level))
    return 1.0 + 0.10 * (level - 1)

@dataclass
class Monster:
    species: str
    tier: int  # tier 1 a 10: começa igual à raridade (1 a 5) e sobe só pelo breed
    level: int = 1
    xp: int = 0
    hybrid: bool = False
    abilities: dict = field(default_factory=dict)  # nome -> nível da habilidade
    passives: List[str] = field(default_factory=list)
    extra_ability: Optional[str] = None  # habilidade absorvida (slot 5)
    purity: str = "neutra"               # luz | neutra | trevas (v1.5)
    mutated: bool = False                # eixo de mutação (v1.5)
    vinculo: int = 0                     # nível de vínculo 0..100 (v1.5)

    def active_slots(self):
        return ACTIVE_SLOTS_HYBRID if self.hybrid else ACTIVE_SLOTS_COMMON

    def absorb(self, ability: str, keep_new: bool):
        """Decisão 3: jogador escolhe manter a atual ou trocar pela nova."""
        self.hybrid = True
        if self.extra_ability is None or keep_new:
            if self.extra_ability == ability:
                self.abilities[ability] = min(MAX_ABILITY_LEVEL, self.abilities.get(ability, 1) + 1)
            else:
                self.extra_ability = ability
                self.abilities.setdefault(ability, 1)
        return self.extra_ability

# --- Derrota contra o bot (GDD v1.9 decisões 14 e 15) ---
def xp_floor_for_level(level: int) -> int:
    return 0  # piso do nível atual; ajustar com a curva de XP

def apply_defeat(monster: Monster, xp_loss: int, bot_strength: int):
    monster.xp = max(xp_floor_for_level(monster.level), monster.xp - xp_loss)
    return bot_strength + 1  # bot persiste na campanha; zera no reinício da campanha

# --- Breed: ingrediente é sempre perdido, principal permanece; sucesso sobe 1 tier (até 10) ---
def breed(principal: Monster, ingredient: Monster, rolled: float, chance: float,
          keep_new: bool, pick: str):
    """rolled e pick vêm de fora (RNG injetado) para os testes serem determinísticos."""
    if rolled >= chance:
        return {"ok": False, "principal": principal, "lost": ingredient.species}
    principal.absorb(pick, keep_new)
    principal.tier = min(TIER_MAX, principal.tier + 1)
    return {"ok": True, "principal": principal, "lost": ingredient.species, "ability": pick}
