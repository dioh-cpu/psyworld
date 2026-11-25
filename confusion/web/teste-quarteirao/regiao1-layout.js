// Ajustes de layout que dependem do tamanho real dos elementos (a faixa da missão cresce com o texto):
// a barra de buffs fica logo abaixo da faixa, sem sobrepor, em qualquer largura e altura de tela.
export function iniciarLayout() {
  const ajustar = () => {
    const faixa = document.getElementById('quest-banner');
    const buffs = document.getElementById('barra-buffs');
    if (!buffs) return;
    const cs = faixa && getComputedStyle(faixa);
    if (faixa && cs.display !== 'none' && cs.visibility !== 'hidden') {
      const r = faixa.getBoundingClientRect();
      buffs.style.top = `${Math.round(r.bottom + 6)}px`;
    } else {
      buffs.style.top = '';
    }
    // se mesmo assim os buffs passariam do rodapé (celular baixo), vira uma linha horizontal compacta
    const topo = buffs.getBoundingClientRect().top;
    const altura = buffs.scrollHeight;
    const minilog = document.getElementById('minilog-box')?.getBoundingClientRect().top ?? innerHeight;
    buffs.style.flexDirection = topo + altura > minilog - 6 && innerHeight < 460 ? 'row' : '';
    buffs.style.flexWrap = buffs.style.flexDirection === 'row' ? 'wrap' : '';
    buffs.style.maxWidth = buffs.style.flexDirection === 'row' ? '58vw' : '';
  };
  addEventListener('resize', ajustar);
  setInterval(ajustar, 500);
  ajustar();
}
