# Reparo de enquadramento dos vídeos do Flow — 2026-11-28

Cópias corrigidas de quadros com extremidades cortadas. O reparo reconstrói apenas a ponta afetada a partir de quadros vizinhos e preserva duração, fps e proporção. Os arquivos originais permanecem nos lotes de entrada anteriores.

| Arquivo | Bytes | Vídeo | SHA-256 |
|---|---:|---|---|
| `brasinha-f1-idle.mp4` | 2610500 | 2048x1152x3.916667 | `df3ed67276e4b79b3e54ef5fa12f5c072001cbc0fa387e67416bdc45c1b14ba9` |
| `brasinha-f1-walk.mp4` | 2313998 | 1408x792x4.000000 | `5f696b9486713d2fcc540bfec8657eb7d37ba2eaf8df8e263b7d031598ef8689` |
| `fanalino-f2-walk.mp4` | 2564532 | 1408x792x4.000000 | `bc21bd2ea33de464b742420fd2f3ed5f42374b5586a999c5f3cb7db8a8f54fb9` |
| `gotalume-f1-idle.mp4` | 3234593 | 2048x1152x3.916667 | `efc2834d323e2aa3eeb6dfce5f9c86dd53db9c14188be35514c7cd1404f7efb8` |
| `gotalume-f1-walk.mp4` | 2532307 | 1408x792x4.000000 | `f4a7363b5cfc63d46c0d7a68433ae498f8da626cfc03a6306db078315480aa9f` |
| `xistolim-f1-idle.mp4` | 2273682 | 1408x792x4.000000 | `99ef4b5f2ab95593cadca07e451d9b93be0b8b5de62d177c31683f5e9cbc6d07` |
| `xistolim-f1-walk.mp4` | 2315979 | 1408x792x4.000000 | `a3a0a304978a4075ed84cdb59a7ad07ff5547fdf59c895ace81c83df5c64089f` |

O lote contém correções do Brasinha, Gotalume, Fanalino e Xistolim. O Fanalino F2 tem agora os dois arquivos: `fanalino-f2-idle.mp4` (original enviado pelo usuário, SHA-256 `3e34101319bc0e587f7412c60b377d64870b370370377e21c9ab77864ee6a99d`) e `fanalino-f2-walk.mp4` (walk corrigido). A identificação do idle como Fanalino F2 foi confirmada pelo usuário. A imagem `Lote2-MP4-Antes-e-Depois.jpg` mostra as áreas reparadas. Não inclui o lagarto de fogo.
