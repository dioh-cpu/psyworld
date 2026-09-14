# PSYWORLD — Wildlands 3D V144

Cliente 3D separado para a branch de teste do PSYWORLD. A cena não compartilha
DOM, input ou loop de renderização com a versão principal.

## Sistemas do teste

- câmera em terceira pessoa com zoom e arraste no lado direito;
- joystick touch isolado no canto inferior esquerdo;
- terreno contínuo com vale, costa, ponte, ruínas, árvores, casas e recursos;
- criaturas autorais 3D articuladas com idle, caminhada, corrida, ataque, dano,
  esquiva e morte;
- IA de patrulha, perseguição, ataque do chefe e aliado acompanhante;
- ataque básico com projétil prismático físico;
- Pulso, Vórtice e Rajada Prismática;
- captura com cápsula, inventário, coleta, fome, água, energia e XP;
- construção de Núcleo, piso, parede, bancada, baú e fogueira;
- fabricação, NPCs com diálogo e ciclo dia/noite.

## Controles

WASD/setas ou joystick: mover  
Arraste o lado direito: câmera  
J, 1 ou NUM1: ataque básico  
2/3/4: habilidades  
E: interagir/coletar  
C: capturar  
B: construir  
K: fabricar  
R: chamar/guardar aliado  
F: comer  
Espaço: esquiva  
Esc: fechar modais ou pausar

O teste web usa Three.js ES Modules hospedado pelo CDN jsDelivr. A arte está
montada em meshes 3D articuladas autorais para validar a jogabilidade e a
arquitetura antes de substituir cada rig por modelos finais produzidos para o
projeto.
