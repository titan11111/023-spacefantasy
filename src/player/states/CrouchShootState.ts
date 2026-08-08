import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';

export class CrouchShootState extends PlayerState {
  enter(): void {
    this.player.setCrouchHitbox();
    this.playAnimation('player-crouch-shoot');
    this.player.shoot({ crouch: true });
  }

  update(input: PlayerInput, time: number): void {
    if (this.player.tryStartJump(time)) return;

    if (!this.player.isGrounded()) {
      this.player.goFall();
      return;
    }

    if (!input.crouch) {
      if (input.shoot) {
        this.player.goShoot();
      } else if (input.left || input.right) {
        this.player.goRun();
      } else {
        this.player.goIdle();
      }
      return;
    }

    if (!input.shoot) {
      this.player.goCrouch();
      return;
    }

    if (input.left || input.right) {
      this.player.applyHorizontalMove(input, this.player.crouchSpeed);
    } else {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
    }
    if (this.player.canShoot(time)) {
      this.player.shoot({ crouch: true });
    }
    this.playAnimation('player-crouch-shoot');
  }

  exit(): void {
    this.player.setStandingHitbox();
  }
}
