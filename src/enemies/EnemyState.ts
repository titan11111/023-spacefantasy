import type { VoidCrawler } from './VoidCrawler';

export abstract class EnemyState {
  protected enemy: VoidCrawler;

  constructor(enemy: VoidCrawler) {
    this.enemy = enemy;
  }

  abstract enter(): void;
  abstract update(time: number, delta: number): void;
  abstract exit(): void;

  protected play(key: string): void {
    this.enemy.anims.play(key, true);
  }
}
