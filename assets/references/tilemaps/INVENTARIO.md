# Inventário das pranchas de tilemap (V2 + acervo)

Origem: commit 5c1151ae7b2c0a3c6aa533a3c07f6f2c14cde490 (branch assets/tilemaps-v2-fazenda).
Total: 103 pranchas. Acervo `Tilemap_Cidade_Originais.zip`: 26 (24 pranchas + 2 capturas). V2: 77 em três ZIPs
(parte 1: 26, parte 2: 26, parte 3: 25). Todas as pranchas do V2 são 1200×896; as do acervo são 1536×1147
(capturas: 720×1600).

Notas: a referência aprovada da Fazenda dos Ovos é `Fazenda/1000354486.jpg`. Os ninhos começam vazios; o ovo é
objeto separado. Peças repetidas em mais de uma prancha estão agrupadas abaixo.

## 1. Chão e terreno (acervo `Terrenos/`)

| Prancha | Conteúdo | Uso |
|---|---|---|
| 1000354502 | grama, terra batida, pedra, estradas em T, cruz e curva | conjunto de peças de chão e conexões |
| 1000354503 | grama com flores, terra batida com poças, pedra, pedra com musgo, estrada com cerca, grama com pedras e junco, pedra quebrada | **peça única de chão** (grama e pedra repetem sem costura) |
| 1000354504 | grama, terra, estradas e pedra em curvas e encruzilhadas | conexões de rua |
| 1000354505 | grama com flores e pedras soltas, praia de areia, pedra escura, estrada em curva, pedra com madeira e cerca, água com ponte | misto; cuidado com a praia e a água |

Repetição sem costura, medida: 1000354503 casa nas bordas. As demais são conjuntos com bordas que não casam
(conexões de estrada e pedra precisam de ajuste antes de repetir).

## 2. Construções e objetos de rua (acervo)

- `Construcoes/` (1000354500, 511–514): portas, janelas, toldos listrados, placas de ferro, vasos de flores,
  bancos de pedra, chaminés, telhados vermelhos e de palha, paredes com vigas. Peças de volume para casas.
  Cada prancha repete com pequenas variações (a 1000354500 tem as partes de vitrine, a 514 tem os telhados).
- `Objetos_de_rua/` (1000354507–510): postes de rua com lanterna, bancos, placas de sinalização, muretas de pedra,
  fontes, vasos de flores, barris, caixotes, carrinhos de mão, arbustos, quadros de aviso. São objetos isolados,
  não tiles. Variações: a 508 e a 510 repetem o banco e a lanterna da 507 com cores diferentes.

## 3. Fazenda (acervo `Fazenda/`)

- 1000354478: cenas de fazenda com ninhos de palha, cercas e casa de madeira (referência de conjunto).
- 1000354484: paredes com vigas, portão, janela redonda, telhado triangular, cerca, ninhos com ovo, mesa de
  trabalho, cocho com regador.
- 1000354485: telhado vermelho, postes, cerca de madeira, portão, ninho vazio, ninho com ovo, mesa, cocho.
- **1000354486 (referência aprovada):** parede com viga e porta, portão, telhado vermelho, poste de madeira,
  viga horizontal, ninho de palha vazio e com ovo, mesa de trabalho, cocho com regador. Os ninhos desta prancha
  são as peças-base da Fazenda dos Ovos.
- 1000354487: parede com vigas, telhado vermelho, poste, cerca, portão, ninho vazio e com ovo, mesa, cocho.
- 1000354501: parede, porta, janela redonda, telhado, cerca, portão, ninho, mesa, cocho, barril, caixote, carrinho.
  Repete a 1000354486 com mais objetos.

Ninhos e ovos: as pranchas 484, 485, 486 e 487 têm o mesmo ninho de palha. O ovo aparece separado, ao lado do
ninho, em todas elas. Para a regra "ovo só aparece quando depositado", use o ninho vazio como peça e o ovo como
objeto à parte (não repita o ovo dentro do desenho do ninho).

## 4. Pranchas V2 (77)

Pranchas de chão e de acabamento, agrupadas por tipo. Cada item traz o ZIP e o número da prancha.

**Muros, escadas e rampas em volume (parte 1 e 2):** 1045128043 (v202), 354264337 (v205), 369006525 (v207),
518521065 (v213), 596040019 (v216), 773020305 (v219). São módulos 3D de pedra isométrica com escadas, muros em L e
em T, arcos e pedestais. Servem de referência para módulos de muro e escada; não são tiles de chão.

**Estradas e pedra (ruas):** 230290435 (v235), 315266623 (v236), 506201995 (v266), 908896181 (v251),
949460148 (v275), 953358681 (v276), 636814576 (v270). Pedra em blocos com curvas, com grama nas bordas.
Precisam de ajuste de borda: as bordas de pedra não casam nas quatro direções.

**Água, rios e pontes (parte 1 e 2):** 326962072 (v203), 404216536 (v208), 40775837 (v210),
407676247 (v209), 636044686 (v218), 882512645 (v223), 960566042 (v226), 947241892 (v225), 1056951102 (v228),
1047492963 (v227), 128388442 (v229), 140695688 (v230), 1755327 (v231), 186832940 (v232), 195761058 (v233),
229328268 (v234), 34880047 (v237), 382508253 (v238), 475447585 (v239), 496436371 (v240), 50088273 (v241),
584135275 (v242), 604738477 (v243), 763950346 (v244), 766944863 (v245), 775631235 (v246), 800511615 (v247),
881937169 (v248), 891535407 (v249), 896317320 (v250), 978249572 (v252). Cada prancha é uma grade de peças de
rio, lago e margem, mais pontes e cercas. As bordas de água não casam como tile contínuo: são peças de canto e de
reta para montar o rio.

**Interiores (parte 2 e 3):** 327380552 (v204), 433803219 (v211), 527490507 (v214), 559907449 (v215),
596518031 (v217), 819608963 (v221), 946017087 (v224), 794119242 (v220), 358031136 (v206).
Paredes com portas, balcões, mesas, cadeiras, estantes, escadas, arcos dourados e cofres. Servem de referência
para peças de interior e objetos de volume.

**Ambientes temáticos (parte 3):** pranchas de gelo, fogo, trevas, veneno, eletricidade, fantasma e dungeon
(1065300390, 124737643, 131716309, 156631447, 195826714, 226000397, 273709074, 303633179, 363181, 399120576,
415949637, 437144758, 440760584, 526723974, 590994498, 604526983, 637604150, 713935791, 782197937,
819492280, 993717252). São pranchas de chão temático com bordas que não casam. Não entram no primeiro quarteirão.

**Vegetação e natureza:** 399120576 (v262, jardim com flores e pedra), 713935791 (v272, grama com flores e
musgo), 303633179 (v260, pedra com musgo e planta). Úteis para bordas de jardim.

## 5. Primeiro quarteirão jogável (proposta)

Peças existentes que usaria juntas:

1. **Chão:** 1000354503 (grama com flores, terra e pedra; repete sem costura).
2. **Ruas:** 1000354504 (estrada em curva e encruzilhada, para as conexões) e pedra de 1000354502 para a praça.
3. **Muros e canteiros:** 1000354507–510 (muretas de pedra, postes, bancos, vasos de flores) como objetos.
4. **Fachadas:** Construcoes 1000354511–514 (portas, janelas, toldos, telhados) para as casas.
5. **Fazenda:** 1000354486 (cercado, ninho vazio, mesa e cocho) para o quadrante da fazenda.

Quarteirão de exemplo: a praça de pedra (1000354502) com uma rua em cruz (1000354504), duas casas com fachadas
de Construcoes, um poste e um banco de Objetos_de_rua, e o cercado da Fazenda no canto.

## 6. Ajustes antes de repetir

- Bordas de estrada e pedra (1000354504, 1000354502): não casam; usar as peças de conexão em vez de repetir
  uma prancha inteira.
- Água das pranchas V2: grades de peças de margem; montar o rio com as peças de canto e de reta.
- Módulos 3D (muros e escadas, v202, v205, v207, v213, v216, v219): não são tiles de chão; usar como referência
  de volume e refazer no tamanho do mapa.
- Praia (1000354505): a areia clara quebra o tom da grama; separar antes de usar.
