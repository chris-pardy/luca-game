import Phaser from 'phaser';
import { SIZES, COLORS, SPEEDS } from '../utils/constants.js';

const ASTEROID_KEYS = ['asteroid-1', 'asteroid-2', 'asteroid-3'];

export default class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'asteroid-1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.label = scene.add.text(x, y, '', {
      fontSize: `${SIZES.LABEL_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.isTarget = false;
    this.lane = -1;
    this.setActive(false).setVisible(false);
    this.label.setVisible(false);
    this.setDepth(4);
  }

  spawn(x, labelData, speedMultiplier, textureKey, maxSpeed) {
    this.setTexture(textureKey || Phaser.Utils.Array.GetRandom(ASTEROID_KEYS));
    this.setPosition(x, -SIZES.ASTEROID);
    this.setActive(true).setVisible(true);
    this.body.enable = true;

    this.label.setText(labelData.text);
    this.label.setPosition(x, -SIZES.ASTEROID);
    this.label.setVisible(true);

    this.isTarget = labelData.isTarget;

    this.clearTint();

    const min = SPEEDS.ASTEROID_MIN * (speedMultiplier || 1);
    const max = maxSpeed != null ? maxSpeed : SPEEDS.ASTEROID_MAX * (speedMultiplier || 1);
    const speed = Phaser.Math.Between(Math.min(min, max), max);
    this.setVelocityY(speed);
    this.setVelocityX(0);
    // Slow rotation for visual flair
    this.setAngularVelocity(Phaser.Math.Between(-30, 30));
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // Keep label following sprite
    this.label.setPosition(this.x, this.y);

    if (this.y > this.scene.scale.height + SIZES.ASTEROID) {
      this.kill();
    }
  }

  kill() {
    this.setActive(false).setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.setAngularVelocity(0);
    this.label.setVisible(false);
    this.lane = -1;
  }
}
