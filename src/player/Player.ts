import Phaser from 'phaser';
import { PlayerState } from './PlayerState';
import { PlayerInputController, type PlayerInput } from './PlayerInput';
import { IdleState } from './states/IdleState';
import { RunState } from './states/RunState';
import { JumpState } from './states/JumpState';
import { FallState } from './states/FallState';
import { CrouchState } from './states/CrouchState';
import { ShootState } from './states/ShootState';
import { CrouchShootState } from './states/CrouchShootState';
import { Sfx } from '../audio/Sfx';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public currentState: PlayerState;
  public playerInput: PlayerInput = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    crouch: false,
    shoot: false,
    shootJustPressed: false,
  };

  public readonly inputController = new PlayerInputController();

  public speed = 280;
  public crouchSpeed = 120;
  public airShootSpeedFactor = 0.7;
  // ジャンプ力は元の地球相当。重力だけ月面（1/6）で滞空を伸ばす
  public gravity = Math.round(980 / 6);
  public jumpVelocity = -520;
  public shootCooldown = 180;
  public lastShotTime = 0;
  public coyoteTime = 120;
  public jumpBufferTime = 150;

  public lastGroundedAt = 0;
  public jumpBufferedAt = -Infinity;
  public wasGrounded = false;
  public invulnUntil = 0;
  private readonly movementSpeedFactor: number;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 7);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 表示は2倍。当たり判定はスプライト内容（足元 y≈53）に合わせて接地させる
    this.setScale(2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setGravityY(this.gravity);
    body.setMaxVelocity(420, 980);
    this.setStandingHitbox();

    this.setBounce(0);
    this.setDragX(900);
    this.setDepth(20);

    // 小さいタッチ画面では同じpx/秒でも画面横断が速く見えるため、
    // PCのゲームバランスを維持したままiOS/Androidだけ穏やかにする。
    const touchDevice =
      navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    this.movementSpeedFactor = touchDevice ? 0.7 : 1;

    this.bindKeys();
    this.currentState = new IdleState(this);
    this.currentState.enter();
  }

  private bindKeys(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyZ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  changeState(newState: PlayerState): void {
    if (this.currentState === newState) return;
    this.currentState.exit();
    this.currentState = newState;
    this.currentState.enter();
  }

  goIdle(): void {
    this.changeState(new IdleState(this));
  }

  goRun(): void {
    this.changeState(new RunState(this));
  }

  goJump(): void {
    this.changeState(new JumpState(this));
  }

  goFall(): void {
    this.changeState(new FallState(this));
  }

  goCrouch(): void {
    this.changeState(new CrouchState(this));
  }

  goShoot(): void {
    this.changeState(new ShootState(this));
  }

  goCrouchShoot(): void {
    this.changeState(new CrouchShootState(this));
  }

  override update(time: number, delta: number): void {
    this.updateInput();
    this.trackGrounded(time);
    this.currentState.update(this.playerInput, time, delta);
  }

  private updateInput(): void {
    const left =
      !!this.cursors?.left.isDown || this.keyA?.isDown || false;
    const right =
      !!this.cursors?.right.isDown || this.keyD?.isDown || false;
    const jump =
      !!this.cursors?.up.isDown ||
      this.keySpace?.isDown ||
      this.keyZ?.isDown ||
      false;
    const crouch =
      !!this.cursors?.down.isDown || this.keyS?.isDown || false;
    const shoot =
      this.keyJ?.isDown ||
      this.keyX?.isDown ||
      false;

    this.playerInput = this.inputController.applyKeyboard(
      left,
      right,
      jump,
      crouch,
      shoot,
    );

    if (this.playerInput.jumpJustPressed) {
      this.jumpBufferedAt = this.scene.time.now;
    }
  }

  private trackGrounded(time: number): void {
    const grounded = this.isGrounded();
    if (grounded) {
      this.lastGroundedAt = time;
    }
    this.wasGrounded = grounded;
  }

  isGrounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  canCoyoteJump(time: number): boolean {
    return time - this.lastGroundedAt <= this.coyoteTime;
  }

  consumeJumpBuffer(time: number): boolean {
    if (time - this.jumpBufferedAt <= this.jumpBufferTime) {
      this.jumpBufferedAt = -Infinity;
      return true;
    }
    return false;
  }

  applyHorizontalMove(input: PlayerInput, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const adjustedSpeed = speed * this.movementSpeedFactor;
    if (input.left && !input.right) {
      body.setVelocityX(-adjustedSpeed);
      this.setFlipX(true);
    } else if (input.right && !input.left) {
      body.setVelocityX(adjustedSpeed);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }
  }

  tryStartJump(time: number): boolean {
    const wantsJump =
      this.playerInput.jumpJustPressed || this.consumeJumpBuffer(time);
    if (!wantsJump) return false;
    if (!(this.isGrounded() || this.canCoyoteJump(time))) return false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.jumpVelocity);
    this.lastGroundedAt = -Infinity;
    this.jumpBufferedAt = -Infinity;
    Sfx.jump();
    this.goJump();
    return true;
  }

  setStandingHitbox(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // frame 64x64 / 内容 bbox ≈ (12,8)-(53,53) — 足元をフレーム下端近くに合わせる
    body.setSize(34, 45);
    body.setOffset(15, 9);
  }

  setCrouchHitbox(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(34, 28);
    body.setOffset(15, 26);
  }

  canShoot(time: number): boolean {
    return time - this.lastShotTime >= this.shootCooldown;
  }

  isInvulnerable(time = this.scene.time.now): boolean {
    return time < this.invulnUntil;
  }

  /** 敵接触時の簡易ノックバック（HP制は未実装・モデルケース用） */
  applyHitFrom(sourceX: number): void {
    const now = this.scene.time.now;
    if (this.isInvulnerable(now)) return;
    this.invulnUntil = now + 700;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = this.x >= sourceX ? 1 : -1;
    // ノックバックの高さ感も月面重力に合わせる
    body.setVelocity(dir * 220, -Math.round(280 / Math.sqrt(6)));
    this.setTint(0xff8899);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.35, to: 1 },
      duration: 700,
      ease: 'Sine.easeOut',
    });
  }

  /** Standing / air / crouch. Crouch lowers muzzle only; trajectory stays horizontal. */
  shoot(options?: { crouch?: boolean }): void {
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return;

    this.lastShotTime = now;
    Sfx.shoot();
    const facingLeft = this.flipX;
    const muzzleX = this.x + (facingLeft ? -52 : 52);
    // 96dpi換算で約1.5mm（5.67px）下げ、銃身の中心に合わせる。
    const muzzleYOffset = 6;
    const muzzleY = (options?.crouch ? this.y + 20 : this.y - 10) + muzzleYOffset;
    const angle = facingLeft ? Math.PI : 0;

    this.scene.events.emit('player-shot', {
      x: muzzleX,
      y: muzzleY,
      angle,
      facingLeft,
    });
  }
}
