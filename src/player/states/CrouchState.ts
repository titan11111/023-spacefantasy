import type Phaser from 'phaser';
import { PlayerState } from '../PlayerState';
import type { PlayerInput } from '../PlayerInput';

export class CrouchState extends PlayerState {
  enter(): void {
    this.player.setCrouchHitbox();
    this.playAnimation('player-crouch');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }

  update(input: PlayerInput, time: number): void {
    if (this.player.tryStartJump(time)) return;

    if (!this.player.isGrounded()) {
      this.player.goFall();
      return;
    }

    // 下を押している間はしゃがみ状態を維持
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

    if (input.shoot) {
      this.player.goCrouchShoot();
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (input.left || input.right) {
      this.player.applyHorizontalMove(input, this.player.crouchSpeed);
      this.playAnimation('player-crouch-walk');
    } else {
      // 下のみ → しゃがみポーズで停止
      body.setVelocityX(0);
      this.playAnimation('player-crouch');
    }
  }

  exit(): void {
    this.player.setStandingHitbox();
  }
}
