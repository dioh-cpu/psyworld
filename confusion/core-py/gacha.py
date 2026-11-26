"""Gacha: probabilidades publicadas e garantia (pity) após 50 invocações (decisão v1.9 decisão 20). Valores provisórios."""

PITY_AT = 50

class Banner:
    def __init__(self, name, pool):
        # pool: lista de (item, raridade, peso); a raridade "mitica" é o topo da garantia
        self.name = name
        self.pool = pool
        total = sum(w for _, _, w in pool)
        self.published = {item: round(100 * w / total, 4) for item, _, w in pool}
        self.top = [item for item, rar, _ in pool if rar == "mitica"]

class Gacha:
    def __init__(self, banner: Banner):
        self.banner = banner
        self.pulls_since_top = 0

    def pull(self, roll: float) -> str:
        if self.pulls_since_top + 1 >= PITY_AT:
            self.pulls_since_top = 0
            return self.banner.top[0]
        total = sum(w for _, _, w in self.banner.pool)
        acc = 0.0
        for item, rar, w in self.banner.pool:
            acc += w / total
            if roll < acc:
                if rar == "mitica":
                    self.pulls_since_top = 0
                else:
                    self.pulls_since_top += 1
                return item
        item, rar, _ = self.banner.pool[-1]
        self.pulls_since_top = 0 if rar == "mitica" else self.pulls_since_top + 1
        return item
