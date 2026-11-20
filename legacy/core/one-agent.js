(function(W){
  'use strict';
  W.PSY=W.PSY||{};
  /* One is the local, deterministic asset/QA helper. It is not a code executor. */
  W.PSY.one=Object.freeze({
    name:'One',
    role:'automação local de animações e QA',
    status:'local-only',
    capabilities:['limpeza de frames','normalização de GIF','checagem de transparência','relatórios de QA'],
    policy:'não executa alterações no jogo a partir do navegador'
  });
  /* Registro leve da equipe auxiliar. Sylvie e Luna atuam sobre as áreas
     delimitadas do projeto; o agente principal continua validando cada saída. */
  W.PSY.agents=W.PSY.agents||{
    one:W.PSY.one,
    sylvie:Object.freeze({name:'Sylvie',role:'revisão de persistência e consistência da Aventura',status:'auxiliary-review'}),
    luna:Object.freeze({name:'Luna',role:'revisão de persistência e consistência do World Idle',status:'auxiliary-review'}),
    supervisor:Object.freeze({name:'Supervisor',alias:'Master',role:'auditoria macro antes da entrega',status:'final-review-only'})
  };
})(window);
