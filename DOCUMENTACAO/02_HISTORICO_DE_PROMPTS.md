# 02 — HISTÓRICO CRONOLÓGICO DE PROMPTS E REQUISITOS

1. **Prompt 1 — PSYWORLD — ADAPTAÇÃO JOGÁVEL ANIME PREMIUM HD 3/4 (V1)**:
   - Criação do protótipo jogável em Pallet Town (*Centro e Residências* + *Jardins e Bosque*) preservando resolução nativa `1672×941` via WebGL2 e coordenadas lógicas separadas.
2. **Prompts 2 a 4 — Empacotamento ZIP e instruções de download na interface**.
3. **Prompt 5 — PSYWORLD — ANIME HD 3/4 V2 (`0ea0ca6`)**:
   - Correção definitiva de câmera e zoom mais próximo do treinador (`targetScale` responsivo em Desktop, Mobile Retrato e Paisagem) e primeira revisão de colisões.
4. **Prompts 6 e 7 — Regra Permanente de Documentação e Entrega (`DOCUMENTACAO/01..08` + ZIP `< 20 MB`)**.
5. **Prompt 8 — Publicação de Preview Jogável na Vercel (`?visual=anime3q`)**.
6. **Prompt 9 — PSYWORLD — PALLET ANIME HD 3/4 V3 (`f8f2232`)**:
   - Treinador com escala visual de **200%** (`characterScale: 1.56`), Pokémon acompanhante proporcional (`followerScale: 1.18`), preservação integral do zoom da V2.
7. **Prompt 10 — PSYWORLD — PALLET ANIME HD 3/4 V4 (`6559020`)**:
   - Reconstrução estrutural das colisões (`r=11` integral com 16 ângulos + `analyzeConnectivity`), substituição de recortes retangulares opacos por máscaras de silhueta RGBA reais (`masks/*.png`), eliminação das distorções visuais e criação do editor visual de geometria.
8. **Prompt 11 — PSYWORLD — PALLET ANIME HD 3/4 V5 (Este Trabalho)**:
   - Usuário enviou 10 screenshots do celular apontando locais específicos onde ainda era possível andar por cima de obstáculos (muretas, pedras, cercas, balaustradas, canteiros, riacho e parapeitos da ponte) e solicitou: *"Coloque colisão em todos esses lugares que eu tirei o print, não se deve dar para andar por cima dessas coisas. Use todas suas ferramentas, busque na internet, aprenda como fazer as colisões de uma forma melhor"*.
   - Aplicada arquitetura pixel-exact por **Walkmask Bitmap `1200×675` + Campo de Distância Euclidiano Exato (2D SDF)** com deslizamento tangencial suave em curvas e diagonais.
