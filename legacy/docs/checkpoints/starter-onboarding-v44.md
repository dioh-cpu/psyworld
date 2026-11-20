# Inicial — checkpoint V46
Branch teste/iniciais-oficios-v38; produção intacta.
Código funcional:3e49283d6d359b066a830e9bfa82228b2b3a630e.
Prévia verificada:https://psyworld-9ozjia9j9-world-of-monsters.vercel.app/

- Qualidade: sorteio original Nice/Belezura/Lêndea preservado; nome da batalha agora mostra qualidade e nível.
- Inicial:Nv5, movimentos/atributos recalculados, HP cheio. Treinamento retroativo único para iniciais abaixo5; curva normal285XP para próximo nível.
- Kit adicional único:25.000Gold,60Pokéball,15GreatBall,20Poção50,15Poção100,5Revive. Novos perfis ficam com50kGold e somam os itens ao kit antigo. Sem moeda premium adicional.
- Rota1:inimigos atéNv4 e limitados ao nível do líder. Outros combates não alterados.
- Causa raiz da morte imediata:guardas deHP tratavam HP ainda indefinido comozero e gravavam _psyFaintedV31 durantecriação. Depois o inicial aparecia com barra cheia mas o primeirogolpe ativava derrota. Guardas V29/V30/V31 agora distinguem recém-criado deKOreal. starterHealthV46 limpa marca incorreta e restaura inicial umaúnicavez; nenhumarecuperação repetida ao entrar em combate.
- Arquivos:core/starter-onboarding-v44.js;core/battle-input-integrity-v29.js;core/battle-input-integrity-v30.js;core/battle-roster-integrity-v31.js;core/survivor-resume-guard-v9.js;index.html.

Validação:16 suites passaram, incluindo guardas reais paraHPindefinido,HPzero e marca deKO. Reprodução browser nativa antes:umcliqueWaterGun zeravaHP eRattata196/196 ficavaintacto. Apósfix:QuaxlyNiceNv5HP243;WaterGun75;RattataNv4HP196→121→46→0;doiscontraataques41;vitória com161/243HP,+10XP,+152Gold. Segunda batalha começou161HP eprimeiroturno terminou120HP,semcurarepetida. Prova:docs/screenshots/starter-battle-v46.jpg. Fixture descartável:tests/starter-battle-native-v46.html. Nenhumaconta real usada.
