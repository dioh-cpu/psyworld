# 02 — HISTÓRICO CRONOLÓGICO DE PROMPTS E REQUISITOS

1. **Prompt 1 — PSYWORLD — ADAPTAÇÃO JOGÁVEL ANIME PREMIUM HD 3/4 (V1)**:
   - Criação do protótipo jogável em Pallet Town (*Centro e Residências* + *Jardins e Bosque*) preservando resolução nativa `1672×941` via WebGL2 e coordenadas lógicas `1200×675`.
2. **Prompts 2 a 4 — Empacotamento ZIP e instruções de download na interface**.
3. **Prompt 5 — PSYWORLD — ANIME HD 3/4 V2 (`0ea0ca6`)**:
   - Correção definitiva de câmera e zoom mais próximo do treinador (`targetScale` responsivo) e primeira revisão de colisões.
4. **Prompts 6 e 7 — Regra Permanente de Documentação e Entrega (`DOCUMENTACAO/01..08` + ZIP `< 20 MB`)**.
5. **Prompt 8 — Publicação de Preview Jogável na Vercel (`?visual=anime3q`)**.
6. **Prompt 9 — PSYWORLD — PALLET ANIME HD 3/4 V3 (`f8f2232`)**:
   - Treinador com escala visual de **200%** (`characterScale: 1.56`), Pokémon acompanhante proporcional (`followerScale: 1.18`), mantendo intacto o zoom da V2.
7. **Prompt 10 — PSYWORLD — PALLET ANIME HD 3/4 V4 (`6559020`)**:
   - Reconstrução estrutural das colisões (`r=11` integral), máscaras de silhueta RGBA (`masks/*.png`), eliminação das distorções visuais e criação do editor visual de geometria.
8. **Prompt 11 — PSYWORLD — PALLET ANIME HD 3/4 V5 (`4f466b6`)**:
   - Correção dos 10 prints do usuário com arquitetura pixel-exact por **Walkmask Bitmap `1200×675` + Campo de Distância Euclidiano Exato (2D SDF)** e deslizamento tangencial suave.
9. **Prompts 12 e 13 — PSYWORLD — PALLET TOWN ANIME HD 3/4 V6 (Este Trabalho)**:
   - Implementação completa das **6 áreas definitivas de Pallet Town** a partir das seis artes originais enviadas pelo usuário, mantendo integralmente a base V5 (Walkmask + SDF, `r=11`, zoom V2, escalas V3, WebGL2 e oclusores RGBA).
   - Conexões bidirecionais coerentes entre *Centro e Residências*, *Jardins e Bosque*, *Laboratório do Prof. Carvalho* (incluindo subida completa pela escadaria esquerda até o arco `"Rota 1"`), *Costa e Praia*, *Colinas e Pedreiras* e *Arredores / Nova Rota 1* com 3 canteiros de grama alta, batalha selvagem, acesso norte a Viridian City e pontos de Pesca/Mineração.
   - Empacotamento obrigatório `DOCUMENTACAO/` + código + artes + mídia `< 20 MB` e publicação isolada em **Preview na Vercel (`?visual=anime3q`)** sem alterar `main` nem produção.

### V6.1 — Costa e revisão geral de colisões
- *"Colisões da Costa de pallet, além de que precisa liberar espaço para entrar corretamente e poder ir para a ponte. Ali vai ser um local de pesca. O que você está utilizando para fazer as colisões? Estão completamente fora do normal, preciso de mais atenção com as colisões. Dê uma olhada nas outras áreas de pallet e corrija tudo."*

## Prompt V6.2 (11 capturas de tela — Laboratório e Colinas)
- *"Ainda tem muitos lugares para ajeitar a colisão. Principalmente a.escadaria do lado esquerdo do laboratório que leva até a rota 1"*
- Anexadas 11 capturas de tela em mobile (`Screenshot_20261116-034434` a `034836`) apontando pontos de invasão na escadaria esquerda, jardim experimental, caixotes, postes do Laboratório e muro/tronco nas Colinas.
