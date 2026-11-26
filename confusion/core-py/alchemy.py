"""Alquimia: combinações de sementes geram poções e sementes; decomposição alimenta a alquimia (GDD v1.4 e v1.5)."""

POTION_BY_PURITY = {"luz": "pocao_de_cura", "trevas": "pocao_de_confusao", "neutra": "pocao_comum"}

def brew(seeds, decomposed: bool = False) -> dict:
    """seeds: lista de (tipo, pureza). Precisa de pelo menos duas sementes."""
    if len(seeds) < 2:
        raise ValueError("combine ao menos duas sementes")
    types = {t for t, _ in seeds}
    purities = [p for _, p in seeds]
    counts = {p: purities.count(p) for p in ("luz", "neutra", "trevas")}
    top = max(counts.values())
    leaders = [p for p, c in counts.items() if c == top]
    purity = leaders[0] if len(leaders) == 1 else "neutra"  # empate: neutra (determinístico)
    out = {"pocao": POTION_BY_PURITY[purity], "sementes": []}
    if len(types) > 1:
        out["sementes"].append("pesquisa")           # combinação de tipos diferentes
    if decomposed:
        out["sementes"].append("mutante")            # decomposição abre a via da mutação
    if purity == "trevas" and "corrompida" in types:
        out["sementes"].append("corrompida")
    if purity == "luz" and "abencoada" in types:
        out["sementes"].append("abencoada")
    return out
