import type { Player } from './Player';
import type { PlayerInput } from './PlayerInput';

export abstract class PlayerState {
  protected player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  abstract enter(): void;
  abstract update(input: PlayerInput, time: number, delta: number): void;
  abstract exit(): void;

  protected playAnimation(key: string): void {
    if (this.player.anims.currentAnim?.key === key && this.player.anims.isPlaying) {
      return;
    }
    this.player.anims.play(key, true);
  }
}
