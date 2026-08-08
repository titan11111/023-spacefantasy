import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';

/** Standing and airborne shooting share this state strategy. */
export class ShootState extends PlayerState {
  enter(): void {
    this.player.setStandingHitbox();
    this.playAnimation('player-shoot');
    this.player.shoot();
  }

  update(input: PlayerInput, time: number): void {
    if (this.player.tryStartJump(time)) return;

    const grounded = this.player.isGrounded();
    if (!grounded) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y >= 0) {
        // Keep shooting while falling via FallState air-shoot path
        this.player.goFall();
        return;
      }
    }

    if (input.crouch && grounded) {
      this.player.goCrouchShoot();
      return;
    }

    const speed = grounded
      ? this.player.speed
      : this.player.speed * this.player.airShootSpeedFactor;
    this.player.applyHorizontalMove(input, speed);

    if (input.shoot) {
      if (this.player.canShoot(time)) {
        this.player.shoot();
      }
      this.playAnimation('player-shoot');
      return;
    }

    if (!grounded) {
      this.player.goFall();
      return;
    }

    if (input.left || input.right) {
      this.player.goRun();
    } else {
      this.player.goIdle();
    }
  }

  exit(): void {}
}
