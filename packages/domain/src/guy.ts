import { Bet } from './bet';

export const MIN_BET = 5;
export const MAX_BET = 15;

export type BetRefusal = 'below-minimum' | 'above-maximum' | 'not-enough-cash' | 'invalid-dog';

/**
 * Um apostador. Os campos são públicos de propósito: o livro só ensina encapsulamento no cap. 5
 * (o Lab 2 refatora isto).
 */
export class Guy {
  name: string;
  cash: number;
  myBet: Bet | null = null;

  constructor(init: { name: string; cash: number }) {
    this.name = init.name;
    this.cash = init.cash;
  }

  /** Por que a aposta seria recusada, ou `null` se ela vale. */
  checkBet(amount: number, dogNumber: number, dogCount = 4): BetRefusal | null {
    if (!Number.isInteger(dogNumber) || dogNumber < 1 || dogNumber > dogCount) return 'invalid-dog';
    if (amount < MIN_BET) return 'below-minimum';
    if (amount > MAX_BET) return 'above-maximum';
    if (amount > this.cash) return 'not-enough-cash';
    return null;
  }

  /** Faz (ou troca) a aposta. Devolve `true` se ela foi aceita. */
  placeBet(amount: number, dogNumber: number): boolean {
    if (this.checkBet(amount, dogNumber) !== null) return false;
    this.myBet = new Bet({ amount, dog: dogNumber, bettor: this });
    return true;
  }

  clearBet(): void {
    this.myBet = null;
  }

  /** Recebe (ou paga) o resultado da corrida e limpa a aposta. Devolve quanto mudou no saldo. */
  collect(winner: number): number {
    const delta = this.myBet ? this.myBet.payOut(winner) : 0;
    this.cash += delta;
    this.clearBet();
    return delta;
  }

  get betDescription(): string {
    return this.myBet ? this.myBet.getDescription() : `${this.name} não apostou`;
  }
}
