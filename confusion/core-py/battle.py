"""Batalha final: sem empate. Derrota tira XP até o piso e fortalece o bot (GDD v1.9 decisões 14 e 15)."""

def final_battle(result: str, monster, bot_strength: int, xp_loss: int = 25) -> dict:
    if result not in ("vitoria", "derrota"):
        raise ValueError("não há empate: use vitoria ou derrota")
    if result == "vitoria":
        return {"result": "vitoria", "bot_strength": bot_strength}
    monster.xp = max(0, monster.xp - xp_loss)   # piso: nunca perde nível
    return {"result": "derrota", "bot_strength": bot_strength + 1}
