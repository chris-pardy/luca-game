import Phaser from 'phaser';
import { COLORS, SIZES, SPEEDS, GAMEPLAY } from '../utils/constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.mode = data.mode || 'math';
    this.correct = data.correct || 0;
    this.total = data.total || 0;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    const { width, height } = this.scale;

    // Starfield background
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'star'
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.speed = Phaser.Math.Between(SPEEDS.STAR_MIN, SPEEDS.STAR_MAX);
      this.stars.push(star);
    }

    // Fade in from black
    this.cameras.main.fadeIn(500);

    // Title
    const title = this.add.text(width / 2, height * 0.15, 'GAME OVER', {
      fontSize: `${SIZES.TITLE_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ff6666',
      stroke: '#330000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Score - count up animation
    const scoreText = this.add.text(width / 2, height * 0.3, 'Score: 0', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffdd33',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 300,
      delay: 400,
      onComplete: () => {
        // Count up effect
        const counter = { val: 0 };
        this.tweens.add({
          targets: counter,
          val: this.finalScore,
          duration: Math.min(1500, this.finalScore * 10 + 300),
          ease: 'Power2',
          onUpdate: () => {
            scoreText.setText(`Score: ${Math.floor(counter.val)}`);
          },
        });
      },
    });

    // Stats
    const statsText = this.add.text(width / 2, height * 0.38, `${this.correct} / ${this.total} correct`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 300,
      delay: 700,
    });

    // Accuracy percentage
    const pct = this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0;
    const accColor = pct >= 80 ? '#44ff44' : pct >= 50 ? '#ffdd33' : '#ff6666';
    const accText = this.add.text(width / 2, height * 0.44, `${pct}% accuracy`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: accColor,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: accText,
      alpha: 1,
      duration: 300,
      delay: 900,
    });

    // New high score
    if (this.isNewHigh) {
      const highText = this.add.text(width / 2, height * 0.52, 'NEW HIGH SCORE!', {
        fontSize: '24px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffdd33',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: highText,
        alpha: 1,
        duration: 300,
        delay: 1200,
        onComplete: () => {
          this.tweens.add({
            targets: highText,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          // Celebration particles
          this.spawnCelebration(width / 2, height * 0.52);
        },
      });
    }

    // Buttons (delayed appearance)
    const btnY = height * 0.68;
    this.time.delayedCall(1400, () => {
      this.createButton(width / 2, btnY, 'PLAY AGAIN', () => {
        this.scene.start('GameScene', { mode: this.mode });
      });

      this.createButton(width / 2, btnY + 80, 'MENU', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  spawnCelebration(cx, cy) {
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(cx, cy, 'particle')
        .setTint(Phaser.Utils.Array.GetRandom([0xffdd33, 0xff8844, 0xff44ff, 0x44ddff, 0x44ff44]))
        .setScale(Phaser.Math.FloatBetween(0.3, 0.7))
        .setDepth(55);

      const angle = (Math.PI * 2 * i) / 12;
      const dist = Phaser.Math.Between(40, 100);
      this.tweens.add({
        targets: p,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
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
    }).setOrigin(0.5);
    text.setScale(0).setAlpha(0);

    this.tweens.add({
      targets: [bg, text],
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  update(time, delta) {
    const { width, height } = this.scale;
    for (const star of this.stars) {
      star.y += star.speed * (delta / 1000);
      if (star.y > height + 5) {
        star.y = -5;
        star.x = Phaser.Math.Between(0, width);
      }
    }
  }
}
