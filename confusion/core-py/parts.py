"""Partes de monstro: receitas que criam partes; profundidade máxima 3 e sem ciclos (GDD v1.9 decisão 18)."""

MAX_DEPTH = 3

class PartGraph:
    def __init__(self, recipes):
        # recipes: lista de (saida, {entrada: quantidade})
        self.recipes = {}
        for out, inputs in recipes:
            if out in self.recipes:
                raise ValueError(f"duas receitas para {out}")
            self.recipes[out] = dict(inputs)
        self._validate()

    def _validate(self):
        for part in self.recipes:
            self.depth(part, stack=())  # levanta erro se houver ciclo ou profundidade acima do limite

    def depth(self, part, stack=()):
        if part in stack:
            raise ValueError(f"ciclo de receitas em {part}")
        if part not in self.recipes:
            return 0  # parte base (dropada ou comprada)
        d = 1 + max(self.depth(p, stack + (part,)) for p in self.recipes[part])
        if d > MAX_DEPTH:
            raise ValueError(f"receita de {part} excede profundidade {MAX_DEPTH}")
        return d

    def craft(self, inventory: dict, output: str) -> dict:
        if output not in self.recipes:
            raise ValueError(f"sem receita para {output}")
        inputs = self.recipes[output]
        for part, qty in inputs.items():
            if inventory.get(part, 0) < qty:
                raise ValueError(f"faltam {part}")
        for part, qty in inputs.items():
            inventory[part] -= qty
        inventory[output] = inventory.get(output, 0) + 1
        return inventory
