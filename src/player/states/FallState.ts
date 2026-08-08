import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';
import { Sfx } from '../../audio/Sfx';

export class FallState extends PlayerState {
  enter(): void {
    this.player.setStandingHitbox();
    this.playAnimation('player-fall');
  }

  update(input: PlayerInput, time: number): void {
    if (this.player.tryStartJump(time)) return;

    const speed = input.shoot
      ? this.player.speed * this.player.airShootSpeedFactor
      : this.player.speed;
    this.player.applyHorizontalMove(input, speed);

    if (input.shoot && this.player.canShoot(time)) {
      this.player.shoot();
      this.playAnimation('player-shoot');
    } else {
      this.playAnimation('player-fall');
    }

    if (this.player.isGrounded()) {
      if (this.player.consumeJumpBuffer(time)) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(this.player.jumpVelocity);
        Sfx.jump();
        this.player.goJump();
        return;
      }

      Sfx.land();
      if (input.crouch) {
        this.player.goCrouch();
      } else if (input.left || input.right) {
        this.player.goRun();
      } else {
        this.player.goIdle();
      }
    }
  }

  exit(): void {}
}
