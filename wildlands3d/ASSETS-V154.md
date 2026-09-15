# Assets visuais — Fronteira Íris V154

A build carrega modelos GLB em runtime para manter o repositório e o primeiro carregamento leves. O cenário procedural continua como fallback caso o CDN, CORS ou o carregador GLTF não esteja disponível.

## Licença

Os modelos selecionados são de Quaternius e estão catalogados no Poly Pizza como CC0 1.0. A licença permite uso, adaptação e redistribuição, inclusive comercial. A atribuição não é exigida, mas foi mantida aqui para rastreabilidade.

- Licença: https://creativecommons.org/publicdomain/zero/1.0/
- Catálogo do autor: https://poly.pizza/

## Mundo

- Natureza (árvores, rochas, arbustos e flores): https://poly.pizza/bundle/Ultimate-Stylized-Nature-Pack-zyIyYd9yGr
- Casa: https://poly.pizza/m/he3p42mUTH
- Sawmill: https://poly.pizza/m/alxTTFjKDM
- Inn: https://poly.pizza/m/x3ZcGn3jr4
- Poço: https://poly.pizza/m/QlqncKYxXb
- Fogueira: https://poly.pizza/m/Azj9hJwwwG
- Mercado: https://poly.pizza/m/hts7l0NZxW
- Cerca: https://poly.pizza/m/UXmKfG81fG

## Criaturas

Os nomes narrativos Lúmion, Oriel, Embermite, Mossclaw, Gloomfin, Glintling e Ironroot continuam sendo dados originais de PSYWORLD; os modelos abaixo são apenas a camada visual CC0.

- Lúmion / Glub Evolved: https://poly.pizza/m/Z9lddNpM1M
- Oriel / Cactoro: https://poly.pizza/m/IGn9lhdama
- Embermite / Armabee: https://poly.pizza/m/42djT5zJnx
- Mossclaw / Goleling: https://poly.pizza/m/71gomWolax
- Gloomfin / Ghost: https://poly.pizza/m/Iip30bDHmu
- Glintling / Pink Slime: https://poly.pizza/m/AyP8sQmDLh
- Ironroot / Dragon: https://poly.pizza/m/3rUm1cN3yp

A integração usa `GLTFLoader`, cache por URL e `SkeletonUtils.clone`, permitindo reutilizar o mesmo modelo em vários spawns sem compartilhar transformações ou esqueletos.
