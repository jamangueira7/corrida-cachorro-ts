/** Cor de cada cão (pelo número) e de cada apostador, usada na pista, nos botões e no histórico. */
export const DOG_COLORS: Record<number, string> = {
  1: '#e4572e',
  2: '#2f80ed',
  3: '#e0a100',
  4: '#8b5cf6',
};

export const GUY_COLORS = ['#0f9d77', '#d9480f', '#5c6ac4'];

export const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const signedBrl = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${brl(Math.abs(value))}`;
