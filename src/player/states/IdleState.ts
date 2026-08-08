import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';

export class IdleState extends PlayerState {
  enter(): void {
    this.player.setStandingHitbox();
    this.playAnimation('player-idle');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
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

    if (input.left || input.right) {
      this.player.goRun();
    }
  }

  exit(): void {}
}
