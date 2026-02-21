import Phaser from 'phaser';
import { SIZES, GAMEPLAY, TIMERS, LANES } from '../utils/constants.js';

export default class BossShip extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(8);

    this.hp = GAMEPLAY.BOSS_HP;
    this.maxHp = GAMEPLAY.BOSS_HP;
    this.pointsNeeded = 0;
    this.pointsEarned = 0;
    this.isFinalBoss = false;
    this.isShootdownPhase = false;
    this.bombTimer = null;
    this.lanePositions = null;
    this.isMoving = false;

    // Progress bar graphics
    this.barBg = scene.add.rectangle(x, y + SIZES.BOSS.h / 2 + 12, 70, 8, 0x333333)
      .setDepth(9);
    this.barFill = scene.add.rectangle(x, y + SIZES.BOSS.h / 2 + 12, 70, 8, 0x44ff44)
      .setDepth(9);
    this.barBg.setVisible(false);
    this.barFill.setVisible(false);

    this.setActive(false).setVisible(false);
  }

  startBombBoss(x, y, pointsNeeded) {
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
    this.isFinalBoss = false;
    this.isShootdownPhase = false;
    this.pointsNeeded = pointsNeeded;
    this.pointsEarned = 0;
    this.hp = GAMEPLAY.BOSS_HP;
    this.setAlpha(1);
    this.clearTint();

    this.barBg.setPosition(x, y + SIZES.BOSS.h / 2 + 12);
    this.barFill.setPosition(x, y + SIZES.BOSS.h / 2 + 12);
    this.barBg.setVisible(true);
    this.barFill.setVisible(true);
    this.updateBar();
  }

  startFinalBoss(x, y, pointsNeeded) {
    this.startBombBoss(x, y, pointsNeeded);
    this.isFinalBoss = true;
  }

  addPoints(pts) {
    this.pointsEarned += pts;
    this.updateBar();
    return this.pointsEarned >= this.pointsNeeded;
  }

  enterShootdownPhase() {
    this.isShootdownPhase = true;
    this.hp = GAMEPLAY.BOSS_HP;
    this.updateBar();
  }

  hit() {
    this.hp--;
    // Flash white
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
    this.updateBar();
    return this.hp <= 0;
  }

  updateBar() {
    if (!this.barFill.active) return;

    let progress;
    if (this.isShootdownPhase) {
      progress = this.hp / this.maxHp;
      this.barFill.setFillStyle(0xff4444);
    } else {
      progress = Math.min(1, this.pointsEarned / this.pointsNeeded);
      this.barFill.setFillStyle(0x44ff44);
    }

    const fullWidth = 70;
    this.barFill.width = fullWidth * progress;
    // Align left edge of fill with left edge of background
    this.barFill.x = this.barBg.x - (fullWidth - this.barFill.width) / 2;
  }

  startMoveAndDrop(lanePositions, dropCallback) {
    this.lanePositions = lanePositions;
    this.dropCallback = dropCallback;
    this.isMoving = true;
    this.moveToNextLane();
  }

  stopMoveAndDrop() {
    this.isMoving = false;
    this.dropCallback = null;
  }

  moveToNextLane() {
    if (!this.active || !this.isMoving) return;

    const targetLane = Phaser.Math.Between(0, this.lanePositions.length - 1);
    const targetX = this.lanePositions[targetLane];

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 600,
      ease: 'Power2',
      onUpdate: () => {
        this.barBg.x = this.x;
        this.updateBar();
      },
      onComplete: () => {
        if (!this.active || !this.isMoving) return;

        // Drop bomb at current position if we have a callback
        if (this.dropCallback && !this.isShootdownPhase) {
          this.setTexture('boss-drop');
          this.dropCallback();
          this.scene.time.delayedCall(300, () => {
            if (this.active) this.setTexture('boss');
          });
        }

        // Wait then move again
        this.scene.time.delayedCall(TIMERS.BOSS_BOMB_INTERVAL, () => {
          this.moveToNextLane();
        });
      },
    });
  }

  flyOff(callback) {
    this.stopMoveAndDrop();
    if (this.bombTimer) {
      this.bombTimer.remove(false);
      this.bombTimer = null;
    }
    this.scene.tweens.add({
      targets: this,
      y: -SIZES.BOSS.h * 2,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        this.barBg.y = this.y + SIZES.BOSS.h / 2 + 12;
        this.barFill.y = this.y + SIZES.BOSS.h / 2 + 12;
        this.barBg.x = this.x;
        this.updateBar();
      },
      onComplete: () => {
        this.kill();
        if (callback) callback();
      },
    });
  }

  moveBetweenLanes(lanePositions) {
    if (!this.active || !this.isShootdownPhase) return;
    this.lanePositions = lanePositions;
    this.isMoving = true;
    this.moveToNextLane();
  }

  kill() {
    this.stopMoveAndDrop();
    if (this.bombTimer) {
      this.bombTimer.remove(false);
      this.bombTimer = null;
    }
    this.setActive(false).setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.barBg.setVisible(false);
    this.barFill.setVisible(false);
  }
}
