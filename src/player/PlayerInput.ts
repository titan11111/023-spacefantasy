import { virtualPad } from '../input/virtualPad';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  crouch: boolean;
  shoot: boolean;
  shootJustPressed: boolean;
}

/** Virtual control / keyboard command state shared with DOM touch pads. */
export class PlayerInputController {
  private prevJump = false;
  private prevShoot = false;

  applyKeyboard(
    left: boolean,
    right: boolean,
    jump: boolean,
    crouch: boolean,
    shoot: boolean,
  ): PlayerInput {
    const v = virtualPad;
    const jumpDown = jump || !!v.Jump || !!v.Space || !!v.KeyZ;
    const shootDown = shoot || !!v.Shoot || !!v.KeyX || !!v.KeyJ;
    const crouchDown = crouch || !!v.Crouch || !!v.ArrowDown || !!v.KeyS;
    const leftDown = left || !!v.Left || !!v.ArrowLeft || !!v.KeyA;
    const rightDown = right || !!v.Right || !!v.ArrowRight || !!v.KeyD;

    const input: PlayerInput = {
      left: leftDown,
      right: rightDown,
      jump: jumpDown,
      jumpJustPressed: jumpDown && !this.prevJump,
      crouch: crouchDown,
      shoot: shootDown,
      shootJustPressed: shootDown && !this.prevShoot,
    };

    this.prevJump = jumpDown;
    this.prevShoot = shootDown;
    return input;
  }
}
