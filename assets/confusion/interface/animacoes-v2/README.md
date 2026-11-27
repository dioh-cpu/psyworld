# Bases e prompts do Flow — iniciais

As imagens são bases de animação da arena e estão viradas para a direita. Os pés ou cascos têm a mesma linha a **85% da altura**. Use o `frame-base.png` da espécie como primeiro quadro. Gere **um clipe por vez**, em 9:16, 1080×1920, com a câmara fixa. Se o Flow não oferecer a duração indicada, escolha a menor disponível, faça a ação no intervalo descrito e corte o repouso excedente na edição.

A técnica e a suprema incluem movimento do corpo e acentos de luz junto à criatura. Projéteis, efeitos em área e efeitos sobre o alvo ficam em camadas separadas, inclusive Arco Ciano, Chama Violeta e Chama Noturna. Para o **Rugido Dourado**, o efeito separado usa frentes de pressão concêntricas em laranja e cobre, com expansão sonora. 

Entregue um MP4 por clipe. Os ciclos de repouso e caminhada fecham na pose de entrada. Ataque, técnica, suprema e reação voltam ao repouso. A derrota termina na pose caída para o último quadro poder ficar congelado na arena.

## Brasinha

Imagem `brasinha/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`brasinha-idle.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only tiny shoulder rise, blink and jitter in the ember mane, with a short controlled tail flick. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`brasinha-walk.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate light alternating cub steps and a springy shoulder motion, always with a clear four-paw gait. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Brasa Imperial — 2 s

`brasinha-ataque.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: crouch like a cub, make one quick front-paw swipe, then set the paw back down. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Juba Flamejante — 3 s

`brasinha-tecnica.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: shake the ember mane once from the shoulders as small orange sear marks light up along the fur. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Rugido Dourado — 4 s

`brasinha-suprema.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: inhale, lift the head and release one short mouth-open roar, with a compact flutter of orange mane heat. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`brasinha-golpe-recebido.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`brasinha-derrota.mp4`

```text
Use my attached Brasinha frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this coal-black lion cub with an orange ember mane and flame-tipped curled tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Ignavor

Imagem `ignavor/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`ignavor-idle.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only two heavy breaths, molten seams pulsing softly and the tail torch flickering in place. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`ignavor-walk.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate heavy deliberate four-beat walk with armoured shoulders rising and falling, without a leap or gallop. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Brasa Imperial — 2 s

`ignavor-ataque.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: load weight over the back paws and make one forceful diagonal front claw slash, then plant the claw. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Juba Flamejante — 3 s

`ignavor-tecnica.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: brace all four paws, roll the shoulders and flare the mane from nape to shoulder armour in one sweeping ignition. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Rugido Dourado — 4 s

`ignavor-suprema.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: draw a strong breath, lower the chest and open the jaws decisively for a resonant roar; copper-to-orange heat pulses cling to the mane. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`ignavor-golpe-recebido.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`ignavor-derrota.mp4`

```text
Use my attached Ignavor frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this black forged-armour lion with orange flame mane, molten seams and a flame on the tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Ignaraz

Imagem `ignaraz/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`ignaraz-idle.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only powerful slow breaths and layered flame movement over the shoulders, with a deliberate tail tension. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`ignaraz-walk.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate ponderous four-beat gait with full paw plants and a short counter-swing of the curled torch tail. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Brasa Imperial — 2 s

`ignaraz-ataque.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: coil onto the hind legs, cut with one armoured forepaw at full extension, then absorb the recoil and return. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Juba Flamejante — 3 s

`ignaraz-tecnica.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: strike the front paw down and twist the chest; two concentric surges travel visibly through the flame mane and chest seams. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Rugido Dourado — 4 s

`ignaraz-suprema.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: stamp, compress the chest and roar with a wide jaw opening; three distinct concentric orange pressure ripples stay close to the face then fade. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`ignaraz-golpe-recebido.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`ignaraz-derrota.mp4`

```text
Use my attached Ignaraz frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this massive obsidian lion with heavy spiked armour, a blazing orange-gold mane and a curled torch tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Gotalume

Imagem `gotalume/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`gotalume-idle.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only gentle breaths and slight fin flex, the tail slowly lifting without widening the silhouette. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`gotalume-walk.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate small four-paw steps with a controlled side-to-side curl of the tail, keeping its full tip inside the frame. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Arco Ciano — 2 s

`gotalume-ataque.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lift the chin, flick the head forward once and flash cyan briefly around the muzzle. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Véu Gelado — 3 s

`gotalume-tecnica.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: close the eyes and dip the fins; translucent frost glints ripple once along the scales from muzzle to tail. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Fenda Estelar — 4 s

`gotalume-suprema.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: compress the torso, raise the tail tip and drive one clear forepaw plant with a brief star-blue pulse near the chest. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`gotalume-golpe-recebido.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`gotalume-derrota.mp4`

```text
Use my attached Gotalume frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small dark-blue sea drake with blue head fins, scaled body and a long curled luminous tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Vaelith

Imagem `vaelith/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`vaelith-idle.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only slow breath, soft operculum motion and a subtle wave along fins and tail. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`vaelith-walk.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate smooth grounded four-beat gait with a rolling shoulder and a tail moving in a tight controlled arc. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Arco Ciano — 2 s

`vaelith-ataque.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lower the spine and snap the head forward with a compact cyan arc tracing the near forelimb. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Véu Gelado — 3 s

`vaelith-tecnica.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: brace the forepaws, dip the horns and lift them in a slow sweep while fine icy refractions wrap close to the body. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Fenda Estelar — 4 s

`vaelith-suprema.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: load the rear legs, coil the tail, raise the horn crown and stamp both forepaws in sequence; bright cyan cracks briefly trace the armour. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`vaelith-golpe-recebido.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`vaelith-derrota.mp4`

```text
Use my attached Vaelith frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark aquatic drake with cyan facets, long horns, fins and a long articulated tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Vaelirion

Imagem `vaelirion/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`vaelirion-idle.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only measured breathing, a sequential ripple through the crown and fins, and a contained sweep of the tail. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`vaelirion-walk.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate long fluid four-beat stride, shoulder and hip roll, with the far limbs timed separately; keep the curling tail in frame. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Arco Ciano — 2 s

`vaelirion-ataque.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: coil the neck, unleash two quick linked head-and-fin beats to the right, then settle fully into the starting pose. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Véu Gelado — 3 s

`vaelirion-tecnica.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: rise onto one forepaw, fan the crown and fold the fins slowly; two layers of frost highlights follow the folds against the skin. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Fenda Estelar — 4 s

`vaelirion-suprema.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: gather in a low stance, open the fins like a tidal fan, then plant both forepaws hard as prismatic fissures pulse close to the chest and crown. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`vaelirion-golpe-recebido.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`vaelirion-derrota.mp4`

```text
Use my attached Vaelirion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this deep-cobalt scaled water beast with a long cyan crown of horns, long crescent fins and a long tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Sementil

Imagem `sementil/frame-base.png`. Fundo `#FF00FF`.

### Repouso — 4 s

`sementil-idle.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only soft chest breaths, quick ear turn, leaf flutter and a subtle blink. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`sementil-walk.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate small careful four-beat hoof steps with light ear bounce and a short sway of the floral tail. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raiz Viva — 2 s

`sementil-ataque.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: raise one forehoof and give one precise stamp; the green bark seams brighten briefly along the leg. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Espora Verde — 3 s

`sementil-tecnica.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lower and raise the sprout antlers slowly while two tiny plant-green glints trace the shoulder bark. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Broto Fértil — 4 s

`sementil-suprema.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: crouch and lift the young antlers in a small burst of confidence, then plant the front hooves and let the foliage relax. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`sementil-golpe-recebido.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`sementil-derrota.mp4`

```text
Use my attached Sementil frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small bark-armoured cervid with luminous shoots and a floral tail tip, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Brotavel

Imagem `brotavel/frame-base.png`. Fundo `#FF00FF`.

### Repouso — 4 s

`brotavel-idle.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only slow measured breath, a small ear pivot and measured lantern-light fluctuation along the antlers. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`brotavel-walk.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate grounded hooved four-beat gait with separate knee, fetlock and hoof rolls and a gentle leafy counterweight. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raiz Viva — 2 s

`brotavel-ataque.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lean into one controlled hoof strike, snapping the bark shoulder plates forward and back. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Espora Verde — 3 s

`brotavel-tecnica.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: dip the head into a guarding stance, sweep the antlers low to high and light a close pattern of green spores along the bark. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Broto Fértil — 4 s

`brotavel-suprema.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: set the rear legs, raise both shoulders and stamp both forehooves as sap-green light surges up the antlers and back into the chest. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`brotavel-golpe-recebido.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`brotavel-derrota.mp4`

```text
Use my attached Brotavel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this dark bark-armoured stag with modest amber-green lantern antlers and a vine tail, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Florivel

Imagem `florivel/frame-base.png`. Fundo `#FF00FF`.

### Repouso — 4 s

`florivel-idle.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only dignified breaths and a restrained rustle of flowering antlers as individual crown lights softly pulse. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`florivel-walk.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate long graceful hooved steps, visible ground contact and minimal crown bob, blossoms and tail following with a delay. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raiz Viva — 2 s

`florivel-ataque.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: draw the forequarters back and deliver one strong forward hoof stomp with a following spring-like shoulder rebound. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Espora Verde — 3 s

`florivel-tecnica.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: sweep the floral antlers in a tall arc, letting warm pollen glints trace a compact protective pattern against the bark. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Broto Fértil — 4 s

`florivel-suprema.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: load all four hooves then rise high through the chest, stamp in two deliberate beats and unfurl the living golden crown; leaf lights pulse from hooves to crown. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`florivel-golpe-recebido.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`florivel-derrota.mp4`

```text
Use my attached Florivel frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this tall graceful bark cervid with a wide crown of gold-light blossoms, separate hooves and a vine-tail bloom, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #FF00FF in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Solinho

Imagem `solinho/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`solinho-idle.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only a sleepy blink, subtle chest breathing and one small feather ruffle while the tail flame flickers. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`solinho-walk.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate light little four-paw steps with restrained folded wing movement and constant ground contact. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raio Dourado — 2 s

`solinho-ataque.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: raise the chin, give one bright, controlled forward head beat with a short gold glint at the brow. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Solar — 3 s

`solinho-tecnica.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: fold a wing inward as if shielding a warm spark, then open it just enough to release a gold glint at the shoulder. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Aurora — 4 s

`solinho-suprema.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: hold a tall brave posture, open the small wings in a light symmetrical lift, and let one warm halo glint trace the feather edges. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`solinho-golpe-recebido.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`solinho-derrota.mp4`

```text
Use my attached Solinho frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small ivory-furred quadruped with golden details, little wings and a small tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Solarin

Imagem `solarin/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`solarin-idle.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only regal breath, minute tail-flame flicker and a subtle feather-by-feather ripple through folded wings. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`solarin-walk.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate steady deliberate four-paw steps, folded wings settle softly no more than a few pixels, tail following the hips. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raio Dourado — 2 s

`solarin-ataque.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: compress through the shoulders and make one clean forward crest snap; an intense pin of gold follows the brow. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Solar — 3 s

`solarin-tecnica.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: sweep the leading wing inward and across the chest and then open it in a careful blessing gesture with close warm feather light. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Aurora — 4 s

`solarin-suprema.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: pull the chest up, spread the wings within the frame and release a slow dawn-colour sweep across the feathers, gold turning to peach as wings settle. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`solarin-golpe-recebido.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`solarin-derrota.mp4`

```text
Use my attached Solarin frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this ivory-and-gold armoured winged quadruped with layered feathers and a warm tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Helíssio

Imagem `helissio/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`helissio-idle.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only patient long breath, faint halo oscillation and a smooth succession of tiny feather movements. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`helissio-walk.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate proud grounded strides with folded wings and no hovering; gold ornament motion lags gently behind the body. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Raio Dourado — 2 s

`helissio-ataque.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lower then raise the crest in two connected, sharp beats; a thin bright flicker follows the brow and extinguishes immediately. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Solar — 3 s

`helissio-tecnica.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: draw one wing across the breast, turn slightly toward the allied side without reversing the head, then unfurl the wing in a strong protective gesture. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Aurora — 4 s

`helissio-suprema.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: brace and open both wings inside frame; an amber dawn wave becomes a prismatic gold feather glow with a distinct second pulse, then the wings fold back gently. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`helissio-golpe-recebido.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`helissio-derrota.mp4`

```text
Use my attached Helíssio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this majestic ivory winged quadruped with gold armour, halo-like crown and layered feathers, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Penumbrio

Imagem `penumbrio/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`penumbrio-idle.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only slight ear turn, low violet breath and pale violet tail flame, wings folded and still near the shoulder. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`penumbrio-walk.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate small wary four-beat steps, one ear pivot and a soft tail counter-swing, no opening wings into the cell edge. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Mordida Umbral — 2 s

`penumbrio-ataque.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: pull the head back and snap the jaws forward once, stop crisply and recover. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Violeta — 3 s

`penumbrio-tecnica.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: take a quick little breath, bring violet flame close to the lower jaw, then push the head very slightly forward to mark the release. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Véu Noturno — 4 s

`penumbrio-suprema.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: crouch low and fold the wings around the body briefly; a small dusk-purple glimmer travels down both wings and fades. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`penumbrio-golpe-recebido.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`penumbrio-derrota.mp4`

```text
Use my attached Penumbrio frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this small black-purple wolf with little bat wings, violet eyes and a violet tail flame, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Noctarn

Imagem `noctarn/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`noctarn-idle.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only muted wolf breath, wing membranes flex gently and the violet tail torch pulses once. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`noctarn-walk.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate stealthy precise four-paw walk with folded bat wings, low shoulders and controlled tail swing. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Mordida Umbral — 2 s

`noctarn-ataque.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: raise the front shoulders, retract and snap the fanged jaw once while the near paw shifts, then recoils. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Violeta — 3 s

`noctarn-tecnica.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: lower the head, gather a violet glow close under the muzzle and thrust the chin to signal the existing projectile release. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Véu Noturno — 4 s

`noctarn-suprema.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: wrap the bat wings closely in a defensive curtain, let a thin violet edge traverse the membranes and slowly unfold to idle. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`noctarn-golpe-recebido.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`noctarn-derrota.mp4`

```text
Use my attached Noctarn frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this charcoal wolf with silver bat wings, dark gear, a violet tail torch and light violet eyes, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```

## Noctarion

Imagem `noctarion/frame-base.png`. Fundo `#00B140`.

### Repouso — 4 s

`noctarion-idle.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate only slow broad breaths and quiet armour flex; violet reflections travel along the wing edges. Movement is subtle and continuous with no steps. Seamless 4-second loop, identical first and last pose, no jump at the seam.
```

### Caminhada à direita — 2 s

`noctarion-walk.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate heavy deliberate wolf gait with strong, unambiguous ground contacts, wings drawn in and the tail safely inside the frame. Show two clean contact cycles in 2 seconds. The feet articulate and travel backwards within the step while the body root stays in the same screen position. No floor drawn, no forward translation. Clean seamless loop from identical contact phase.
```

### Ataque básico · Mordida Umbral — 2 s

`noctarion-ataque.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: powerful shoulder lunge with one crisp bite and a visible recoil through its armour, then reset on its own feet. Show anticipation in the first 0.45 seconds, the decisive hit around 0.75 seconds, then recover to the exact first pose by 2 seconds. Contact and body motion only, no flying projectile or target.
```

### Técnica · Chama Noturna — 3 s

`noctarion-tecnica.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one readable action: compress wings and lower the chest, snap the jaws forward and flare a sharp purple-white line close to the muzzle; this is the release beat for the Chama Noturna area overlay. Wind-up 0–0.8 s, decisive release around 1.15 s, settle fully back into the input pose by 3 seconds. Effects touch only the character silhouette, no detached beam, projectile, aura or target.
```

### Suprema · Véu Noturno — 4 s

`noctarion-suprema.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Animate this one cinematic action: bring both giant wings close over the armoured chest, hold a deep mauve silhouette for a beat and unfurl with layered violet membrane light. Show buildup 0–1.2 s, body release around 1.5–2.2 s, brief hold, then return to the exact idle frame by 4 seconds. Any elemental glow remains close to the creature; external VFX will be composited separately.
```

### Recebendo golpe — 1 s

`noctarion-golpe-recebido.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start in the reference idle, flinch once from a hit from the right at ~0.22 s. Chest shifts slightly left, forelegs bend and eyes narrow. No new spark or attacker. Keep the root anchored and reset to the exact standing pose by 1 second.
```

### Derrota — 2 s

`noctarion-derrota.mp4`

```text
Use my attached Noctarion frame as the exact first frame of ONE 9:16 1080×1920 game sprite animation. Preserve the original design and proportions of this large dark-purple armoured wolf with massive edged leathery wings and violet energy, full body always facing screen right. Locked orthographic side camera, no cuts, zooms or viewpoint changes. Fixed centered root, feet ground line at 85% image height. Keep the solid chroma background exactly #00B140 in every frame, with no cast shadows or color spill. No enemy, writing, UI, scene, extra limbs or objects. Keep every horn, tail, wing and paw fully inside the frame. Start from the idle pose, knees give way under the remaining weight, lower body onto the floor without turning or sliding. A short exhale, dim elemental glow, then hold the recognizable defeated pose from 1.65 s to 2 s. Keep the same baseline; no gore, no dissolve, no get-up.
```
