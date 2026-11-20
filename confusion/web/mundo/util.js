// Utilidades dos sistemas do mundo. Código puro: nada de DOM, nada de Math.random direto (o chamador passa ctx.r).
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Hash estável de texto (para dar temperamento ou ordem sempre igual a um mesmo id).
export const hash = (texto) => {
  let h = 0;
  for (const ch of String(texto)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};
// Escolhe um item do array com a rolagem r em [0, 1).
export const escolha = (lista, r) => lista[Math.min(lista.length - 1, Math.floor(r * lista.length))];
// Soma efeitos: recursos, sanidade e diamantes acumulam; notas são concatenadas.
export function somarResultado(acc, res) {
  if (!res) return acc;
  acc.notas.push(...(res.notas || []));
  const e = res.efeitos || {};
  if (e.sanidade) acc.efeitos.sanidade = (acc.efeitos.sanidade || 0) + e.sanidade;
  if (e.diamantes) acc.efeitos.diamantes = (acc.efeitos.diamantes || 0) + e.diamantes;
  for (const [k, v] of Object.entries(e.recursos || {})) {
    acc.efeitos.recursos = acc.efeitos.recursos || {};
    acc.efeitos.recursos[k] = (acc.efeitos.recursos[k] || 0) + v;
  }
  return acc;
}
export const resultadoVazio = () => ({ notas: [], efeitos: {} });
