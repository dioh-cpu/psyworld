"""Registro de recompensas: uma entrega por (campanha, escopo), idempotente; monstro escolhido entra no nível 0."""

class RewardRegistry:
    def __init__(self):
        self.records = {}
        self.repertoire = []  # (espécie, nível)

    def claim(self, campaign_id: str, scope: str):
        key = (campaign_id, scope)
        if key not in self.records:
            self.records[key] = {"prize": True, "pick": None}
        return self.records[key]

    def pick_monster(self, campaign_id: str, scope: str, species: str):
        rec = self.claim(campaign_id, scope)
        if rec["pick"] is not None:
            return rec["pick"]  # já escolhido: não duplica
        rec["pick"] = species
        self.repertoire.append((species, 0))
        return species

    def monthly(self, player: str, period: str, category: str):
        return self.claim(player, f"mensal:{period}:{category}")
