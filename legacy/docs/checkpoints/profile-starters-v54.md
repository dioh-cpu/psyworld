# Iniciais de perfil V54

Base main a09885c6605bf7ec0761c81d07f0562597f3e3f0. Corrigido buildStarterScreen(): GENS.slice(0,1) limitava criação de perfil a Kanto; agora GENS.forEach mostra nove gerações e 27 iniciais. Sem mudanças em raridade, kit, HP, animações ou seletor cinematográfico da campanha. Cache-buster ALL_STARTERS_V54 no index. Nova suíte executa o renderizador real com DOM simulado e confirma nove seções, 27 IDs únicos e todos os handlers. Todas as 27 suítes passaram.
