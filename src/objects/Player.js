import Phaser from 'phaser';
import { TIMERS, SIZES } from '../utils/constants.js';
import Bullet from './Bullet.js';

const BULLET_POOL_SIZE = 20;
const LANE_TWEEN_MS = 120;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, lanePositions) {
    super(scene, x, y, 'ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(10);

    this.scene = scene;
    this.lastFired = 0;
    this.isInvincible = false;

    // Lane state
    this.lane = 1; // center
    this.lanePositions = lanePositions;
    this.x = lanePositions[1];

    // Bullet pool
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      maxSize: BULLET_POOL_SIZE,
      runChildUpdate: true,
    });

    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      const b = new Bullet(scene, 0, 0);
      this.bullets.add(b, true);
      b.kill();
    }

    // Keyboard
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyA = scene.input.keyboard.addKey('A');
    this.keyD = scene.input.keyboard.addKey('D');
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Keyboard: move and fire are separate
    scene.input.keyboard.on('keydown-LEFT', () => this.switchLane(-1));
    scene.input.keyboard.on('keydown-A', () => this.switchLane(-1));
    scene.input.keyboard.on('keydown-RIGHT', () => this.switchLane(1));
    scene.input.keyboard.on('keydown-D', () => this.switchLane(1));
    scene.input.keyboard.on('keydown-SPACE', () => this.fire(scene.time.now));

    // Touch / click: center 50% = shoot, left 25% = move left, right 25% = move right
    // Swipes override: horizontal drag always moves in swipe direction
    const SWIPE_THRESHOLD = 30;

    scene.input.on('pointerdown', (pointer) => {
      if (scene.isPaused) return;
      this.pointerStartX = pointer.x;
      this.pointerHandled = false;
    });

    scene.input.on('pointermove', (pointer) => {
      if (scene.isPaused || !pointer.isDown || this.pointerHandled) return;
      const dx = pointer.x - this.pointerStartX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        this.pointerHandled = true;
        this.switchLane(dx < 0 ? -1 : 1);
      }
    });

    scene.input.on('pointerup', (pointer) => {
      if (scene.isPaused || this.pointerHandled) return;
      // Tap — use zones: left 25%, center 50%, right 25%
      const w = scene.scale.width;
      if (pointer.x < w * 0.25) {
        this.switchLane(-1);
      } else if (pointer.x > w * 0.75) {
        this.switchLane(1);
      } else {
        this.fire(scene.time.now);
      }
    });

    this.pointerStartX = 0;
    this.pointerHandled = false;
  }

  switchLane(direction) {
    const newLane = Phaser.Math.Clamp(this.lane + direction, 0, this.lanePositions.length - 1);
    if (newLane === this.lane) return;
    this.lane = newLane;

    this.setTexture(direction < 0 ? 'ship-left' : 'ship-right');

    this.scene.tweens.add({
      targets: this,
      x: this.lanePositions[this.lane],
      duration: LANE_TWEEN_MS,
      ease: 'Power2',
      onComplete: () => {
        this.setTexture('ship');
      },
    });
  }

  update() {
    // No per-frame movement needed — lane switches are tween-driven
  }

  fire(time) {
    if (time < this.lastFired + TIMERS.FIRE_RATE) return;
    const bullet = this.bullets.getFirstDead(false);
    if (bullet) {
      bullet.fire(this.x, this.y - SIZES.SHIP.h / 2);
      this.lastFired = time;
    }
  }

  startInvincibility() {
    if (this.isInvincible) return;
    this.isInvincible = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(TIMERS.INVINCIBILITY / 200),
      onComplete: () => {
        this.isInvincible = false;
        this.setAlpha(1);
      },
    });
  }
}
