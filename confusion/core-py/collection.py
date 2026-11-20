"""Coleção: capturas por espécie, região e variante; recompensas por primeira captura e por região completa (decisões v1.5 e v1.9)."""

class Collection:
    def __init__(self, region_species: dict):
        self.region_species = {r: set(s) for r, s in region_species.items()}
        self.captured = set()
        self.variants = set()           # (espécie, variante)
        self.rewards = []               # registro de recompensas entregues
        self._region_done = set()

    def capture(self, species: str, region: str, variant: str = "normal"):
        first = species not in self.captured
        self.captured.add(species)
        self.variants.add((species, variant))
        if first:
            self.rewards.append(("captura", species))
        if region in self.region_species and region not in self._region_done \
           and self.region_species[region] <= self.captured:
            self._region_done.add(region)
            self.rewards.append(("regiao_completa", region))
        return first

    def progress(self, region: str):
        total = self.region_species.get(region, set())
        return len(total & self.captured), len(total)
