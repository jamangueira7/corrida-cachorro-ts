import type { Guy } from './guy';

/** Uma aposta: valor, cão escolhido e quem apostou (o `Guy` passa `this` ao criar). */
export class Bet {
  amount: number;
  dog: number;
  bettor: Guy;

  constructor(init: { amount: number; dog: number; bettor: Guy }) {
    this.amount = init.amount;
    this.dog = init.dog;
    this.bettor = init.bettor;
  }

  getDescription(): string {
    if (this.amount === 0) return `${this.bettor.name} não apostou`;
    return `${this.bettor.name} apostou R$ ${this.amount} no cão número ${this.dog}`;
  }

  /** Dobro ou nada: devolve o valor se o cão venceu, ou o valor negativo se perdeu. */
  payOut(winner: number): number {
    return winner === this.dog ? this.amount : -this.amount;
  }
}
