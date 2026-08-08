import Phaser from 'phaser';

type LayerSpec = {
  key: string;
  scrollX: number;
  scrollY: number;
  alpha?: number;
  tile?: boolean;
};

export class ParallaxBackground {
  private layers: Phaser.GameObjects.TileSprite[] = [];

  constructor(scene: Phaser.Scene, specs: LayerSpec[]) {
    const { width, height } = scene.scale;

    for (const spec of specs) {
      const layer = scene.add
        .tileSprite(0, 0, width * 2, height, spec.key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-100 + this.layers.length)
        .setAlpha(spec.alpha ?? 1);
      this.layers.push(layer);
      (layer as Phaser.GameObjects.TileSprite & { scrollX: number }).scrollX = spec.scrollX;
      (layer as Phaser.GameObjects.TileSprite & { scrollY: number }).scrollY = spec.scrollY;
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    for (const layer of this.layers) {
      const scrollX = (layer as Phaser.GameObjects.TileSprite & { scrollX: number }).scrollX;
      const scrollY = (layer as Phaser.GameObjects.TileSprite & { scrollY: number }).scrollY;
      layer.tilePositionX = camera.scrollX * scrollX;
      layer.tilePositionY = camera.scrollY * scrollY;
    }
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.setSize(width * 2, height);
    }
  }
}
