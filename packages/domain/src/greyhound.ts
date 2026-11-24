import type { RandomSource } from './random';

/**
 * Um cão na pista (cap. 3 e 4). No livro ele recebe o `PictureBox`; aqui o domínio não conhece a tela:
 * guarda só a posição, e o React desenha o cão a partir dela.
 */
export class Greyhound {
  startingPosition = 0;
  racetrackLength: number;
  location = 0;
  number: number;
  name: string;
  random: RandomSource;

  constructor(init: { number: number; name: string; racetrackLength: number; random: RandomSource }) {
    this.number = init.number;
    this.name = init.name;
    this.racetrackLength = init.racetrackLength;
    this.random = init.random;
  }

  /** Avança de 1 a 4 casas. Devolve `true` se cruzou a linha de chegada. */
  run(): boolean {
    this.location = Math.min(this.location + this.random.next(1, 5), this.racetrackLength);
    return this.location >= this.racetrackLength;
  }

  takeStartingPosition(): void {
    this.location = this.startingPosition;
  }

  /** Quanto da pista já percorreu, de 0 a 1. */
  get progress(): number {
    return this.location / this.racetrackLength;
  }
}
