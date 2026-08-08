import Phaser from 'phaser';

/** 全敵撃破後に現れる、次の世界への白いブラックホール。 */
export class WhiteBlackHole extends Phaser.Physics.Arcade.Sprite {
  private static readonly textureKey = 'white-black-hole';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    WhiteBlackHole.createTexture(scene);
    super(scene, x, y, WhiteBlackHole.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(30).setAlpha(0).setScale(0.15);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setCircle(34, 14, 14);

    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 700,
      ease: 'Back.Out',
    });
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2800,
      repeat: -1,
    });
    scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      delay: 700,
    });
  }

  private static createTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(WhiteBlackHole.textureKey)) return;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 0.12).fillCircle(48, 48, 46);
    g.lineStyle(7, 0xffffff, 0.3).strokeCircle(48, 48, 39);
    g.lineStyle(4, 0xffffff, 1);
    g.beginPath().arc(48, 48, 35, -0.2, 2.25).strokePath();
    g.lineStyle(3, 0xcff8ff, 0.95);
    g.beginPath().arc(48, 48, 28, 2.5, 6.0).strokePath();
    g.fillStyle(0xffffff, 0.8).fillCircle(20, 39, 3);
    g.fillStyle(0xd7f9ff, 0.9).fillCircle(75, 57, 2);
    g.fillStyle(0x00050b, 1).fillCircle(48, 48, 18);
    g.lineStyle(2, 0xffffff, 0.9).strokeCircle(48, 48, 20);
    g.generateTexture(WhiteBlackHole.textureKey, 96, 96);
    g.destroy();
  }
}
