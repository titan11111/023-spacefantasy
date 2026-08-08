import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';
import { Sfx } from '../../audio/Sfx';

export class JumpState extends PlayerState {
  enter(): void {
    this.player.setStandingHitbox();
    this.playAnimation('player-jump');
  }

  update(input: PlayerInput, time: number, _delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = input.shoot
      ? this.player.speed * this.player.airShootSpeedFactor
      : this.player.speed;
    this.player.applyHorizontalMove(input, speed);

    if (input.shoot && this.player.canShoot(time)) {
      this.player.shoot();
      this.playAnimation('player-shoot');
    } else if (body.velocity.y < -40) {
      this.playAnimation('player-jump');
    }

    if (body.velocity.y >= 0) {
      this.player.goFall();
      return;
    }

    if (this.player.isGrounded() && body.velocity.y >= 0) {
      this.land(input);
    }
  }

  private land(input: PlayerInput): void {
    Sfx.land();
    if (input.crouch) {
      this.player.goCrouch();
    } else if (input.left || input.right) {
      this.player.goRun();
    } else {
      this.player.goIdle();
    }
  }

  exit(): void {}
}
