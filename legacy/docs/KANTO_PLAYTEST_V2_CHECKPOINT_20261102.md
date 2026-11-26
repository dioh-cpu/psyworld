PSYWORLD — CHECKPOINT KANTO PLAYTEST V2 — 2026-11-02

ESCOPO: EXCLUSIVAMENTE BRANCH TESTE. NUNCA MERGE AUTOMÁTICO EM main.
Produção: psyworld-murex.vercel.app (SHA 53507faf696d56b78ff336f422ea835c9fa34864).

ENTREGAS
- Pallet Town: arte nova WebP, máscara de passagens e colisões por geometria; sem entrar em casas atravessando paredes.
- Rota 1: arte aprovada WebP, quatro campos de mato com entradas acessíveis, encontros pretendidos Lv1–3.
- NPC Carvalho, Lia, Nina, Guarda da Rota, Exploradora e NPCs interiores usando retratos existentes.
- Missão inicial: conversar com Carvalho, entrar no Centro Pokémon e Market, receber liberação do Guarda.
- Interiores: Centro Pokémon, Poké Mart, Laboratório, casa do jogador e duas casas.
- HUD responsiva, movimento por setas e controles de toque (joystick/tap-to-move), câmera seguindo personagem.
- Removido carregamento do PSY Assistente da preview, sem tocar produção.

VALIDAÇÕES
- Testes de BFS sobre malha de colisão: saída Pallet, seis portas, todos NPCs e quatro matos alcançáveis.
- Compilação/sintaxe JS novos módulos, referências HTML locais verificadas.
- Vercel build da branch READY, somente preview.

AINDA PRECISA CORRIGIR
- QA interativo no celular/browser, inclusive diálogo, portas, batalha e estabilidade.
- Ajuste fino de máscaras de cercas/vegetação de acordo com visual real na tela.
- Integração server-authoritative do progresso de missões por personagem online (por ora local da preview).
- Confirmar limite Lv3 nos cálculos de batalha, não apenas no nível exibido.
- Retratos de expressões individuais podem ser refinados conforme assets disponíveis.
- Viridian continua com mapa de desenvolvimento legado, aguardando mapa final.
- Poké Mart/loja online precisam validação do fluxo de retorno ao mapa.

ATENÇÃO: o ZIP que reproduz a branch de testes foi gerado separadamente. Não substituir o ambiente público sem aceite do usuário.
