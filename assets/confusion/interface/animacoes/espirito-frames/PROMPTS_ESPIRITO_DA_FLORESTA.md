# Espírito da Floresta: frames base e prompts

## Por que a qualidade está ruim
O MP4 original é 1280×720 e o personagem ocupa só ~400 px de altura. No jogo ele aparece com 2 a 3 vezes esse tamanho, então fica borrado e com franja verde. A solução é refazer cada direção em alta resolução, em imagem, e só depois animar.

## Frames base (os mais nítidos de cada direção)
| Direção | Arquivo | Quadro do MP4 |
|---|---|---|
| Frente | `espirito-frente-melhor-f016.png` | 16 |
| Esquerda | `espirito-esquerda-melhor-f092.png` | 92 |
| Costas | `espirito-costas-melhor-f144.png` | 144 |
| Direita | `espirito-direita-melhor-f208.png` | 208 |

Use cada PNG como imagem de referência no gerador (image-to-image), uma direção por vez.

## 1. Prompts para melhorar a qualidade (um por direção)
Resolução alvo: 2048×2048 ou maior, personagem de corpo inteiro ocupando ~85% da altura, fundo verde chroma liso #00FF00 sem sombra no chão, sem texto.

**Base comum (cole antes de cada direção):**
> Redraw this exact character in high resolution, keeping the same design, proportions, pose and colors: a forest spirit, tall slender woman, long wavy pale-golden hair, antler crown made of dark twisted branches, green leaf-and-bark layered gown with root-like vines trailing from sleeves and hem, small leaves, floating slightly above the ground. Painterly fantasy illustration, crisp clean edges, fine detail in leaves, bark texture and hair strands, soft consistent rim light, no motion blur, no green spill on the character. Full body, centered, flat pure chroma green background #00FF00, no ground shadow, no text.

- **Frente:** `+ facing the camera, front view, right arm slightly extended outward, left arm relaxed, symmetrical antlers.`
- **Esquerda:** `+ strict side profile facing the left of the image, antlers seen from the side, hair falling down the back, gown trailing behind to the right.`
- **Direita:** `+ strict side profile facing the right of the image, antlers seen from the side, hair falling down the back, gown trailing behind to the left.`
- **Costas:** `+ back view, facing away from the camera, long hair covering the back, antlers seen from behind, root vines trailing down the gown.`

Negativo: `blurry, low resolution, jpeg artifacts, green fringe, extra limbs, extra fingers, changed face, changed outfit, shadow, floor, text, watermark.`

Dica de consistência: gere a frente primeiro e passe-a como segunda referência nas outras três direções.

## 2. Prompts de animação: idle (loop de ~2 s)
Use a imagem melhorada da direção como primeiro quadro. Fundo verde fixo, câmera parada, 24 fps, 1280×720 ou 1080×1080, 48 quadros, loop perfeito (último quadro = primeiro).

**Base comum:**
> Seamless looping idle animation of this exact character, locked static camera, flat chroma green background unchanged, character floating in place and not moving across the frame. Gentle hover bob of about 2% of body height, hair strands and leafy gown swaying softly as if in a light breeze, root vines and small leaves drifting slowly, antlers perfectly stable. Keep the facing direction fixed for the whole clip. Same design and colors in every frame, no morphing, no camera move, no zoom, no turning around. Loop ends exactly where it starts.

- **Frente:** `+ facing the camera, arms swaying slightly, hand gently opening and closing.`
- **Esquerda:** `+ side view facing left, gown and hair trailing gently to the right.`
- **Direita:** `+ side view facing right, gown and hair trailing gently to the left.`
- **Costas:** `+ back view, hair and gown swaying, root vines drifting.`

## 3. Prompts de animação: walk (loop de ~1 s)
Mesmo setup, 24 fps, 24 a 32 quadros, loop perfeito. O personagem anda no lugar, sem sair do centro (o jogo move a posição).

**Base comum:**
> Seamless looping walk cycle of this exact character, walking in place on a treadmill, locked static camera, character stays centered in frame, flat chroma green background unchanged. Smooth floating glide with a soft step rhythm, gown hem, hair and root vines flowing with the movement, leaves trailing. One full step cycle (left-right) that loops perfectly. Keep the facing direction fixed for the whole clip. Same design and colors in every frame, no morphing, no zoom, no turning.

- **Frente:** `+ walking toward the camera, arms swinging gently, gown flowing forward.`
- **Esquerda:** `+ walking to the left of the image in side profile, gown and hair streaming back to the right.`
- **Direita:** `+ walking to the right of the image in side profile, gown and hair streaming back to the left.`
- **Costas:** `+ walking away from the camera, back view, hair and gown swaying with each step.`

Negativo (idle e walk): `camera movement, zoom, turning around, rotating, changing facing direction, morphing, flicker, extra limbs, background change, shadow on floor, text, watermark, blur.`

## 4. Como entregar para o jogo
Para cada direção, 2 MP4 (idle e walk) com fundo verde #00FF00, mesmo enquadramento e altura do personagem em todos os 8 clipes, nomes `espirito-<direcao>-idle.mp4` e `espirito-<direcao>-walk.mp4`. Com isso eu troco o código para usar idle parado e walk andando por direção, sem o ping-pong atual.
