"""Campanha solo: traje segue o caminho, troca de lado única e irreversível, dificuldade com snapshot (v1.3, v1.11, v1.9)."""
from typing import Optional

COSTUME = {None: "base", "heroi": "luz", "vilao": "trevas"}
DIFFICULTIES = ["facil", "normal", "dificil", "muito_dificil", "extremo"]

class Campaign:
    def __init__(self, campaign_id: str, character: str):
        self.id = campaign_id
        self.character = character
        self.role: Optional[str] = None      # definido na escolha do caminho
        self.switched = False
        self.difficulty = "normal"
        self.entry_difficulty = None
        self.completed = False
        self.completion_seconds = None
        self.bot_strength = 0

    @property
    def costume(self):
        return COSTUME[self.role]

    def choose_path(self, role: str):
        if self.role is not None:
            raise ValueError("caminho já escolhido")
        if role not in ("heroi", "vilao"):
            raise ValueError(role)
        self.role = role

    def switch_side(self, new_role: str):
        if self.role is None:
            raise ValueError("escolha o caminho antes de trocar")
        if self.switched:
            raise ValueError("a troca de lado é única")
        if new_role == self.role or new_role not in ("heroi", "vilao"):
            raise ValueError("troca inválida")
        self.role = new_role
        self.switched = True

    def set_difficulty(self, level: str, in_battle: bool):
        if in_battle:
            raise ValueError("dificuldade não muda em batalha")
        if level not in DIFFICULTIES:
            raise ValueError(level)
        self.difficulty = level

    def enter_challenge(self):
        """Snapshot: o desafio usa a dificuldade do momento da entrada."""
        self.entry_difficulty = self.difficulty
        return self.entry_difficulty

    def complete(self, seconds: int):
        if self.completed:
            return False
        self.completed = True
        self.completion_seconds = seconds
        return True

    def restart(self):
        self.role = None
        self.switched = False
        self.completed = False
        self.completion_seconds = None
        self.bot_strength = 0
        self.entry_difficulty = None
