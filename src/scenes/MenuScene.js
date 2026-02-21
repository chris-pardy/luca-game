import Phaser from 'phaser';
import { COLORS, SIZES, SPEEDS, GAMEPLAY } from '../utils/constants.js';
import SaveManager from '../systems/SaveManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Starfield background
    this.stars = [];
    for (let i = 0; i < GAMEPLAY.STAR_COUNT; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'star'
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.speed = Phaser.Math.Between(SPEEDS.STAR_MIN, SPEEDS.STAR_MAX);
      this.stars.push(star);
    }

    // Title with entrance animation
    const titleSpace = this.add.text(width / 2, height * 0.15, 'SPACE', {
      fontSize: `${SIZES.TITLE_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#66ccff',
      stroke: '#003366',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const titleExplorer = this.add.text(width / 2, height * 0.15 + SIZES.TITLE_FONT + 8, 'EXPLORER', {
      fontSize: `${SIZES.TITLE_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4488ff',
      stroke: '#003366',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const subtitle = this.add.text(width / 2, height * 0.15 + (SIZES.TITLE_FONT + 8) * 2, 'Learn and Play!', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaddff',
    }).setOrigin(0.5).setAlpha(0);

    // Animate titles in
    this.tweens.add({
      targets: titleSpace,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: titleExplorer,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 500,
      delay: 150,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 400,
      delay: 400,
    });

    // Floating ship near title
    const ship = this.add.image(width / 2 + 100, height * 0.18, 'ship').setAlpha(0);
    this.tweens.add({
      targets: ship,
      alpha: 1,
      duration: 400,
      delay: 300,
      onComplete: () => {
        this.tweens.add({
          targets: ship,
          y: ship.y - 15,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Mode buttons (delayed entrance)
    const btnY = height * 0.5;
    this.time.delayedCall(500, () => {
      this.createButton(width / 2, btnY, 'MATH MISSION', () => {
        this.scene.start('GameScene', { mode: 'math' });
      });
    });
    this.time.delayedCall(650, () => {
      this.createButton(width / 2, btnY + 80, 'WORD MISSION', () => {
        this.scene.start('GameScene', { mode: 'spelling' });
      });
    });

    // High scores
    const saves = SaveManager.load();
    const scoreY = height * 0.78;
    const hsTitle = this.add.text(width / 2, scoreY, 'HIGH SCORES', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffdd33',
    }).setOrigin(0.5).setAlpha(0);

    const mathHigh = saves.highScores.math[0] || 0;
    const spellingHigh = saves.highScores.spelling[0] || 0;

    const hsDetail = this.add.text(width / 2, scoreY + 28, `Math: ${mathHigh}  Words: ${spellingHigh}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [hsTitle, hsDetail],
      alpha: 1,
      duration: 400,
      delay: 800,
    });
  }

  createButton(x, y, label, callback) {
    const w = SIZES.BUTTON_MIN_W;
    const h = SIZES.BUTTON_MIN_H;

    const bg = this.add.rectangle(x, y, w, h, COLORS.BUTTON_BG, 0.9)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(COLORS.BUTTON_HOVER, 0.9))
      .on('pointerout', () => bg.setFillStyle(COLORS.BUTTON_BG, 0.9))
      .on('pointerdown', callback);

    bg.setStrokeStyle(2, 0x66aaff);
    bg.setScale(0).setAlpha(0);

    const text = this.add.text(x, y, label, {
      fontSize: `${SIZES.BUTTON_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: [bg, text],
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  update(time, delta) {
    const { height } = this.scale;
    for (const star of this.stars) {
      star.y += star.speed * (delta / 1000);
      if (star.y > height + 5) {
        star.y = -5;
        star.x = Phaser.Math.Between(0, this.scale.width);
      }
    }
  }
}
