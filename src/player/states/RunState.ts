import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';

export class RunState extends PlayerState {
  enter(): void {
    this.player.setStandingHitbox();
    this.playAnimation('player-run');
  }

  update(input: PlayerInput, time: number): void {
    if (this.player.tryStartJump(time)) return;

    if (!this.player.isGrounded()) {
      this.player.goFall();
      return;
    }

    if (input.crouch) {
      if (input.shoot) {
        this.player.goCrouchShoot();
      } else {
        this.player.goCrouch();
      }
      return;
    }

    if (input.shoot) {
      this.player.goShoot();
      return;
    }

    if (!input.left && !input.right) {
      this.player.goIdle();
      return;
    }

    this.player.applyHorizontalMove(input, this.player.speed);
    this.playAnimation('player-run');
  }

  exit(): void {}
}
