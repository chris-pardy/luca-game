import Phaser from 'phaser';
import { SPEEDS } from '../utils/constants.js';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  fire(x, y) {
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
    this.setVelocityY(SPEEDS.BULLET);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.y < -10) {
      this.kill();
    }
  }

  kill() {
    this.setActive(false).setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }
}
