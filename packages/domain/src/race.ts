import { Greyhound } from './greyhound';
import { Guy } from './guy';
import { mathRandom, type RandomSource } from './random';

export const DOG_NAMES = ['Relâmpago', 'Bolinha', 'Faísca', 'Trovão'] as const;
export const TRACK_LENGTH = 100;

export interface BetResult {
  bettor: string;
  amount: number;
  dog: number;
  delta: number;
}

export interface RaceResult {
  winner: number;
  bets: BetResult[];
}

/** O hipódromo: os 4 cães (`Greyhound[]`), os 3 apostadores (`Guy[]`) e o laço da corrida. */
export class Race {
  dogs: Greyhound[];
  guys: Guy[];
  random: RandomSource;
  running = false;

  constructor(random: RandomSource = mathRandom) {
    this.random = random;
    this.dogs = DOG_NAMES.map(
      (name, i) => new Greyhound({ number: i + 1, name, racetrackLength: TRACK_LENGTH, random }),
    );
    this.guys = [
      new Guy({ name: 'João', cash: 50 }),
      new Guy({ name: 'Beto', cash: 75 }),
      new Guy({ name: 'Alfredo', cash: 45 }),
    ];
  }

  get canStart(): boolean {
    return !this.running && this.guys.some((guy) => guy.myBet !== null);
  }

  start(): void {
    if (this.running) return;
    for (const dog of this.dogs) dog.takeStartingPosition();
    this.running = true;
  }

  /**
   * Um passo da corrida: todo cão corre. Devolve o número do vencedor ou `null`.
   * Se vários cruzam no mesmo passo, sorteia entre eles: nenhum cão tem vantagem.
   */
  step(): number | null {
    if (!this.running) return null;
    const finished = this.dogs.filter((dog) => dog.run());
    if (finished.length === 0) return null;
    const winner = finished[this.random.next(0, finished.length)] ?? finished[0]!;
    return winner.number;
  }

  /** Paga as apostas, encerra a corrida e devolve o resumo para salvar no histórico. */
  finish(winner: number): RaceResult {
    const bets: BetResult[] = [];
    for (const guy of this.guys) {
      if (!guy.myBet) continue;
      const { amount, dog } = guy.myBet;
      bets.push({ bettor: guy.name, amount, dog, delta: guy.collect(winner) });
    }
    this.running = false;
    return { winner, bets };
  }

  /** Corre até haver vencedor (laço do cap. 2), sem animação. */
  runToEnd(): RaceResult {
    this.start();
    let winner: number | null = null;
    while (winner === null) winner = this.step();
    return this.finish(winner);
  }

  reset(): void {
    this.running = false;
    for (const dog of this.dogs) dog.takeStartingPosition();
    this.guys = [
      new Guy({ name: 'João', cash: 50 }),
      new Guy({ name: 'Beto', cash: 75 }),
      new Guy({ name: 'Alfredo', cash: 45 }),
    ];
  }
}
