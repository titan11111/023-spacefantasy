import Phaser from 'phaser';

/** 右奥に浮かぶ地球。TileSpriteにせず1枚だけ置く（中央に複製されない）。 */
export class FarEarth {
  private readonly image: Phaser.GameObjects.Image;
  private readonly scrollFactorX: number;
  private readonly scrollFactorY: number;
  private anchorX: number;
  private anchorY: number;

  constructor(scene: Phaser.Scene, scrollFactorX = 0.08, scrollFactorY = 0.03) {
    this.scrollFactorX = scrollFactorX;
    this.scrollFactorY = scrollFactorY;
    const { width, height } = scene.scale;
    // 画面右奥（上寄り）
    this.anchorX = width * 0.82;
    this.anchorY = height * 0.22;

    this.image = scene.add
      .image(this.anchorX, this.anchorY, 'bg_earth')
      .setScrollFactor(0)
      .setDepth(-90)
      .setOrigin(0.5)
      .setScale(1.15);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    // わずかにパララックス（カメラ追従より遅く動く）
    this.image.setPosition(
      this.anchorX - camera.scrollX * this.scrollFactorX,
      this.anchorY - camera.scrollY * this.scrollFactorY,
    );
  }

  resize(width: number, height: number): void {
    this.anchorX = width * 0.82;
    this.anchorY = height * 0.22;
    this.image.setPosition(this.anchorX, this.anchorY);
  }
}
