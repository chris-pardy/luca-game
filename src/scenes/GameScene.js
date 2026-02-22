import Phaser from 'phaser';
import { GAMEPLAY, SPEEDS, SIZES, COLORS, TIMERS, LANES } from '../utils/constants.js';
import Player from '../objects/Player.js';
import Asteroid from '../objects/Asteroid.js';
import BossShip from '../objects/BossShip.js';
import ChallengeManager from '../systems/ChallengeManager.js';
import ScoreManager from '../systems/ScoreManager.js';
import SaveManager from '../systems/SaveManager.js';

const ASTEROID_POOL = 15;
const BANNER_MAX_W = 500;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.mode = data.mode || 'math';
  }

  create() {
    const { width, height } = this.scale;

    // Systems
    this.challengeManager = new ChallengeManager(this.mode);
    this.scoreManager = new ScoreManager();
    this.asteroidsSpawned = 0;
    this.isTransitioning = false;

    // Boss state
    this.boss = null;
    this.isBossFight = false;
    this.bossPointsEarned = 0;

    // Starfield
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

    // Lane positions
    const margin = width * LANES.MARGIN;
    const usable = width - 2 * margin;
    this.laneXPositions = [];
    for (let i = 0; i < LANES.COUNT; i++) {
      this.laneXPositions.push(margin + usable * (i / (LANES.COUNT - 1)));
    }

    // Player
    this.player = new Player(this, this.laneXPositions[1], height - 80, this.laneXPositions);

    // Asteroid pool
    this.asteroids = this.physics.add.group({ runChildUpdate: true });
    for (let i = 0; i < ASTEROID_POOL; i++) {
      const a = new Asteroid(this, 0, -100);
      this.asteroids.add(a, true);
    }

    // HUD
    this.createHUD();

    // Challenge prompt
    this.challengeManager.nextChallenge();
    this.updatePrompt();

    // Collisions
    this.physics.add.overlap(this.player.bullets, this.asteroids, this.onBulletHitAsteroid, null, this);

    // Spawn timers
    this.asteroidTimer = this.time.addEvent({
      delay: TIMERS.ASTEROID_SPAWN,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true,
    });

    // ESC to pause
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.isPaused = false;

    // Screen flash overlay
    this.flashOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
      .setDepth(100).setScrollFactor(0);

    // Intro animation: slide prompt in
    this.promptText.setAlpha(0);
    this.promptBg.setAlpha(0);
    this.tweens.add({
      targets: [this.promptText, this.promptBg],
      alpha: 1,
      duration: 600,
      delay: 300,
      ease: 'Power2',
    });
  }

  createHUD() {
    const { width } = this.scale;

    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: `${SIZES.HUD_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(50).setScrollFactor(0);

    // Level text
    this.levelText = this.add.text(16, 44, 'Level 1', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaddff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(50).setScrollFactor(0);

    // Streak text
    this.streakText = this.add.text(16, 66, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffdd33',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(50).setScrollFactor(0);

    // Hearts
    this.hearts = [];
    for (let i = 0; i < GAMEPLAY.MAX_LIVES; i++) {
      const heart = this.add.image(
        width - 30 - i * 30, 28,
        'heart'
      ).setDepth(50).setScrollFactor(0);
      this.hearts.push(heart);
    }
    this.updateHearts();

    // Challenge prompt (top center with bg)
    this.promptBg = this.add.rectangle(width / 2, 80, Math.min(width - 32, BANNER_MAX_W), 40, 0x000000, 0.5)
      .setDepth(49).setScrollFactor(0);

    this.promptText = this.add.text(width / 2, 80, '', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffdd33',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    // Pause button (top right, below hearts)
    this.pauseBtn = this.add.text(width - 16, 56, '| |', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#aaaacc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p) => { p.event.stopPropagation(); this.togglePause(); });
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.physics.pause();
    this.asteroidTimer.paused = true;
    this.tweens.pauseAll();

    const { width, height } = this.scale;

    this.pauseOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setDepth(200).setScrollFactor(0);

    this.pauseTitle = this.add.text(width / 2, height * 0.35, 'PAUSED', {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(201);

    const btnW = Math.min(200, width - 64);

    this.resumeBtn = this.add.rectangle(width / 2, height * 0.50, btnW, 50, COLORS.BUTTON_BG, 0.9)
      .setDepth(201).setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.resumeBtn.setFillStyle(COLORS.BUTTON_HOVER, 0.9))
      .on('pointerout', () => this.resumeBtn.setFillStyle(COLORS.BUTTON_BG, 0.9))
      .on('pointerdown', () => this.resumeGame());
    this.resumeBtn.setStrokeStyle(2, 0x66aaff);

    this.resumeLabel = this.add.text(width / 2, height * 0.50, 'RESUME', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(202);

    this.quitBtn = this.add.rectangle(width / 2, height * 0.62, btnW, 50, 0x882222, 0.9)
      .setDepth(201).setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.quitBtn.setFillStyle(0xaa3333, 0.9))
      .on('pointerout', () => this.quitBtn.setFillStyle(0x882222, 0.9))
      .on('pointerdown', () => {
        this.resumeGame();
        this.scene.start('MenuScene');
      });
    this.quitBtn.setStrokeStyle(2, 0xff6666);

    this.quitLabel = this.add.text(width / 2, height * 0.62, 'QUIT', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(202);
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.physics.resume();
    if (!this.isBossFight && !this.isTransitioning) {
      this.asteroidTimer.paused = false;
    }
    this.tweens.resumeAll();

    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.pauseTitle) this.pauseTitle.destroy();
    if (this.resumeBtn) this.resumeBtn.destroy();
    if (this.resumeLabel) this.resumeLabel.destroy();
    if (this.quitBtn) this.quitBtn.destroy();
    if (this.quitLabel) this.quitLabel.destroy();
  }

  updatePrompt() {
    const newText = this.challengeManager.getPrompt();
    this.promptText.setText(newText);
    this.promptText.setAlpha(1);
    this.promptBg.setAlpha(1);

    // Big center-screen announcement
    const { width, height } = this.scale;
    const announce = this.add.text(width / 2, height / 2, newText, {
      fontSize: '32px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffdd33',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(95).setScale(0.5).setAlpha(0);

    const announceBg = this.add.rectangle(width / 2, height / 2, Math.min(width - 32, BANNER_MAX_W), 80, 0x000000, 0)
      .setDepth(94);

    this.tweens.add({
      targets: announceBg,
      fillAlpha: 0.7,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => announceBg.destroy(),
    });

    this.tweens.add({
      targets: announce,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: announce,
          alpha: 0,
          y: height / 2 - 30,
          duration: 500,
          delay: 800,
          onComplete: () => announce.destroy(),
        });
      },
    });
  }

  updateHearts() {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setVisible(i < this.scoreManager.lives);
    }
  }

  animateHeartLoss() {
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      if (this.hearts[i].visible && i >= this.scoreManager.lives) {
        this.tweens.add({
          targets: this.hearts[i],
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            this.hearts[i].setVisible(false);
            this.hearts[i].setScale(1).setAlpha(1);
          },
        });
      }
    }
  }

  animateHeartGain() {
    const idx = this.scoreManager.lives - 1;
    if (idx >= 0 && idx < this.hearts.length) {
      this.hearts[idx].setVisible(true).setScale(0).setAlpha(0);
      this.tweens.add({
        targets: this.hearts[idx],
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 400,
        ease: 'Back.easeOut',
      });
    }
  }

  updateHUD() {
    this.scoreText.setText(`Score: ${this.scoreManager.score}`);
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    const needed = this.scoreManager.getPointsForNextLevel();
    const current = this.scoreManager.levelPoints;
    this.levelText.setText(`Level ${this.scoreManager.level}  (${current}/${needed})`);
    if (this.scoreManager.streak >= GAMEPLAY.STREAK_THRESHOLD) {
      this.streakText.setText(`Streak x${this.scoreManager.streak} (2x!)`);
      this.streakText.setColor('#ff8844');
    } else if (this.scoreManager.streak > 0) {
      this.streakText.setText(`Streak x${this.scoreManager.streak}`);
      this.streakText.setColor('#ffdd33');
    } else {
      this.streakText.setText('');
    }
    this.updateHearts();
  }

  // --- Boss Fight Logic ---

  startBombBoss() {
    const { width } = this.scale;
    this.isBossFight = true;
    this.bossPointsEarned = 0;

    // Pause normal asteroid spawning
    this.asteroidTimer.paused = true;

    // Show warning
    this.showBossWarning(() => {
      // Create boss
      this.boss = new BossShip(this, width / 2, -SIZES.BOSS.h);
      const pointsNeeded = GAMEPLAY.BOSS_POINTS_BASE + this.scoreManager.level * GAMEPLAY.BOSS_POINTS_PER_LEVEL;
      this.boss.startBombBoss(width / 2, -SIZES.BOSS.h, pointsNeeded);

      // Add bullet-boss collision for final boss shootdown
      this.bossBulletCollider = this.physics.add.overlap(
        this.player.bullets, this.boss, this.onBulletHitBoss, null, this
      );

      // Tween boss into position
      this.tweens.add({
        targets: this.boss,
        y: 60,
        duration: 1000,
        ease: 'Power2',
        onUpdate: () => {
          if (this.boss) {
            this.boss.barBg.y = this.boss.y + SIZES.BOSS.h / 2 + 12;
            this.boss.barFill.y = this.boss.y + SIZES.BOSS.h / 2 + 12;
            this.boss.barBg.x = this.boss.x;
            this.boss.updateBar();
          }
        },
        onComplete: () => {
          // Start dropping bombs
          this.startBossBombCycle();
        },
      });
    });
  }

  startFinalBoss() {
    const { width } = this.scale;
    this.isBossFight = true;
    this.bossPointsEarned = 0;

    this.asteroidTimer.paused = true;

    this.showBossWarning(() => {
      this.boss = new BossShip(this, width / 2, -SIZES.BOSS.h);
      const pointsNeeded = GAMEPLAY.BOSS_POINTS_BASE + 55 * GAMEPLAY.BOSS_POINTS_PER_LEVEL;
      this.boss.startFinalBoss(width / 2, -SIZES.BOSS.h, pointsNeeded);

      this.bossBulletCollider = this.physics.add.overlap(
        this.player.bullets, this.boss, this.onBulletHitBoss, null, this
      );

      this.tweens.add({
        targets: this.boss,
        y: 60,
        duration: 1000,
        ease: 'Power2',
        onUpdate: () => {
          if (this.boss) {
            this.boss.barBg.y = this.boss.y + SIZES.BOSS.h / 2 + 12;
            this.boss.barFill.y = this.boss.y + SIZES.BOSS.h / 2 + 12;
            this.boss.barBg.x = this.boss.x;
            this.boss.updateBar();
          }
        },
        onComplete: () => {
          this.startBossBombCycle();
        },
      });
    });
  }

  showBossWarning(callback) {
    const { width, height } = this.scale;

    const warningBg = this.add.rectangle(width / 2, height / 2, Math.min(width - 32, BANNER_MAX_W), 100, 0x660000, 0)
      .setDepth(92);
    const warningText = this.add.text(width / 2, height / 2, 'WARNING! BOSS INCOMING!', {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(93).setAlpha(0);

    this.tweens.add({
      targets: warningBg,
      fillAlpha: 0.8,
      duration: 300,
      yoyo: true,
      hold: 1500,
      onComplete: () => warningBg.destroy(),
    });

    this.tweens.add({
      targets: warningText,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Flash effect
        this.tweens.add({
          targets: warningText,
          alpha: 0.3,
          duration: 200,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.tweens.add({
              targets: warningText,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                warningText.destroy();
                if (callback) callback();
              },
            });
          },
        });
      },
    });
  }

  startBossBombCycle() {
    if (!this.boss || !this.boss.active) return;

    // Boss fights use the hardest unlocked topic
    this.challengeManager.forceTopic = this.challengeManager.getHardestTopic();
    this.challengeManager.nextChallenge();
    this.updatePrompt();

    // Boss moves to a lane, then drops a bomb there
    this.boss.startMoveAndDrop(this.laneXPositions, () => this.bossDrop());
  }

  bossDrop() {
    if (!this.boss || !this.boss.active || this.isTransitioning) return;

    if (this.challengeManager.isPoolExhausted()) {
      this.challengeManager.refillPool();
    }

    const labelData = this.challengeManager.getNextLabel();
    if (!labelData) return;

    const asteroid = this.asteroids.getFirstDead(false);
    if (!asteroid) return;

    // Drop from boss's current position (the lane it just moved to)
    const speedMult = 1 + (this.scoreManager.level - 1) * 0.1;
    const bossX = this.boss.x;
    const bossY = this.boss.y + SIZES.BOSS.h / 2;
    asteroid.spawn(bossX, labelData, speedMult, 'bomb');
    asteroid.setPosition(bossX, bossY);
    asteroid.label.setPosition(bossX, bossY);
  }

  onBulletHitBoss(bullet, boss) {
    if (!bullet.active || !boss.active) return;
    if (!boss.isShootdownPhase) return; // Only take hits during shootdown phase

    bullet.kill();

    const dead = boss.hit();
    this.showFloatingText(boss.x, boss.y, 'HIT!', '#ff8844');
    this.cameras.main.shake(100, 0.01);

    if (dead) {
      this.defeatFinalBoss();
    }
  }

  checkBossProgress(pts) {
    if (!this.boss || !this.boss.active) return;

    const thresholdMet = this.boss.addPoints(pts);
    if (thresholdMet) {
      // Stop bomb timer
      if (this.boss.bombTimer) {
        this.boss.bombTimer.remove(false);
        this.boss.bombTimer = null;
      }

      if (this.boss.isFinalBoss) {
        // Enter shootdown phase
        this.showFloatingText(this.scale.width / 2, this.scale.height / 2,
          'NOW SHOOT THE BOSS!', '#ff4444', 28);
        this.boss.enterShootdownPhase();
        this.boss.moveBetweenLanes(this.laneXPositions);
      } else {
        // Bomb boss flies off
        this.boss.flyOff(() => {
          this.endBossFight();
        });
      }
    }
  }

  defeatFinalBoss() {
    if (this.bossBulletCollider) {
      this.physics.world.removeCollider(this.bossBulletCollider);
      this.bossBulletCollider = null;
    }

    // Big explosion
    for (let burst = 0; burst < 3; burst++) {
      this.time.delayedCall(burst * 200, () => {
        if (this.boss) {
          const ox = Phaser.Math.Between(-20, 20);
          const oy = Phaser.Math.Between(-20, 20);
          this.spawnExplosion(this.boss.x + ox, this.boss.y + oy);
        }
      });
    }

    this.cameras.main.shake(500, 0.03);

    this.time.delayedCall(600, () => {
      if (this.boss) {
        this.spawnExplosion(this.boss.x, this.boss.y);
        this.boss.kill();
        this.boss = null;
      }

      this.isBossFight = false;

      // Victory!
      this.showVictory();
    });
  }

  showVictory() {
    const { width, height } = this.scale;

    // Save progress
    const isNewHigh = SaveManager.addHighScore(this.mode, this.scoreManager.score);
    SaveManager.updateProgress(this.mode, this.scoreManager.level);
    SaveManager.addCorrectAnswers(this.scoreManager.correctCount);

    const victoryBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000033, 0)
      .setDepth(90);

    this.tweens.add({
      targets: victoryBg,
      fillAlpha: 0.7,
      duration: 500,
    });

    const victoryText = this.add.text(width / 2, height * 0.3, 'VICTORY!', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffdd33',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(91).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: victoryText,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 300,
    });

    const subText = this.add.text(width / 2, height * 0.42, 'You defeated the Final Boss!', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aaddff',
    }).setOrigin(0.5).setDepth(91).setAlpha(0);

    this.tweens.add({
      targets: subText,
      alpha: 1,
      duration: 300,
      delay: 800,
    });

    // Celebration particles
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(300 + i * 200, () => {
        this.spawnExplosion(
          Phaser.Math.Between(width * 0.2, width * 0.8),
          Phaser.Math.Between(height * 0.2, height * 0.5)
        );
      });
    }

    // Buttons after delay
    this.time.delayedCall(1500, () => {
      this.createVictoryButton(width / 2, height * 0.6, 'PLAY AGAIN', () => {
        this.scene.start('GameScene', { mode: this.mode });
      });
      this.createVictoryButton(width / 2, height * 0.7, 'MENU', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  createVictoryButton(x, y, label, callback) {
    const bg = this.add.rectangle(x, y, SIZES.BUTTON_MIN_W, SIZES.BUTTON_MIN_H, COLORS.BUTTON_BG, 0.9)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(COLORS.BUTTON_HOVER, 0.9))
      .on('pointerout', () => bg.setFillStyle(COLORS.BUTTON_BG, 0.9))
      .on('pointerdown', callback)
      .setDepth(92);
    bg.setStrokeStyle(2, 0x66aaff);
    bg.setScale(0).setAlpha(0);

    const text = this.add.text(x, y, label, {
      fontSize: `${SIZES.BUTTON_FONT}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(93).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: [bg, text],
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  endBossFight() {
    if (this.bossBulletCollider) {
      this.physics.world.removeCollider(this.bossBulletCollider);
      this.bossBulletCollider = null;
    }

    this.isBossFight = false;
    this.boss = null;

    // Resume normal play
    this.asteroidTimer.paused = false;

    // Load next challenge
    this.challengeManager.nextChallenge();
    this.updatePrompt();
  }

  // --- Normal Gameplay ---

  spawnAsteroid() {
    if (this.isTransitioning || this.isBossFight) return;

    if (this.challengeManager.isPoolExhausted()) {
      this.challengeManager.refillPool();
    }

    const labelData = this.challengeManager.getNextLabel();
    if (!labelData) return;

    const asteroid = this.asteroids.getFirstDead(false);
    if (!asteroid) return;

    const lane = Phaser.Math.Between(0, LANES.COUNT - 1);
    const x = this.laneXPositions[lane];
    const speedMult = 1 + (this.scoreManager.level - 1) * 0.15;
    asteroid.spawn(x, labelData, speedMult);
  }

  triggerLevelUp() {
    this.isTransitioning = true;

    // Speed up spawns
    const newAsteroidDelay = Math.max(800, TIMERS.ASTEROID_SPAWN - (this.scoreManager.level - 1) * 150);
    this.asteroidTimer.delay = newAsteroidDelay;

    // Phase 1: "GOOD JOB!", hide the prompt, and speed up remaining asteroids
    this.showGoodJob();
    this.promptText.setAlpha(0);
    this.promptBg.setAlpha(0);
    for (const asteroid of this.asteroids.getChildren()) {
      if (asteroid.active) {
        asteroid.setVelocityY(asteroid.body.velocity.y * 1.4);
      }
    }

    // Phase 2: wait for screen to clear, then announce new level + challenge
    this.waitForClear(() => {
      // Check for topic unlock
      const unlockedName = this.challengeManager.checkUnlockForLevel(this.scoreManager.level);
      if (unlockedName) {
        this.showUnlockAnnouncement(unlockedName);
      }

      // Check for boss fight
      const level = this.scoreManager.level;
      if (level % 5 === 0 && level <= 55) {
        this.showLevelUp(() => {
          this.isTransitioning = false;
          if (level === 55) {
            this.startFinalBoss();
          } else {
            this.startBombBoss();
          }
        });
        return;
      }

      // Show level announcement, then load new challenge
      this.challengeManager.nextChallenge();
      this.showLevelUp(() => {
        this.updatePrompt();
        this.isTransitioning = false;
      });
    });
  }

  showGoodJob() {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, Math.min(width - 32, BANNER_MAX_W), 80, 0x003322, 0.7)
      .setDepth(90).setAlpha(0);
    const text = this.add.text(width / 2, height / 2, 'GOOD JOB!', {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#44ff88',
      stroke: '#003322',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91).setScale(0.3).setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      hold: 700,
      onComplete: () => bg.destroy(),
    });

    this.tweens.add({
      targets: text,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0, y: height / 2 - 40,
          duration: 500,
          delay: 400,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  showLevelUp(callback) {
    const { width, height } = this.scale;

    const levelBg = this.add.rectangle(width / 2, height / 2, Math.min(width - 32, BANNER_MAX_W), 80, 0x000033, 0.7)
      .setDepth(90).setAlpha(0);
    const levelText = this.add.text(width / 2, height / 2, `LEVEL ${this.scoreManager.level}!`, {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#66ccff',
      stroke: '#002244',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91).setScale(0.3).setAlpha(0);

    this.tweens.add({
      targets: levelBg,
      alpha: 0.7,
      duration: 300,
      yoyo: true,
      hold: 700,
      onComplete: () => levelBg.destroy(),
    });

    this.tweens.add({
      targets: levelText,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: levelText,
          alpha: 0, y: height / 2 - 40,
          duration: 500,
          delay: 400,
          onComplete: () => {
            levelText.destroy();
            if (callback) callback();
          },
        });
      },
    });
  }

  waitForClear(callback) {
    const check = () => {
      const anyActive = this.asteroids.getChildren().some(a => a.active);
      if (anyActive) {
        this.time.delayedCall(200, check);
      } else {
        this.time.delayedCall(400, callback);
      }
    };
    check();
  }

  showUnlockAnnouncement(topicName) {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2 + 60, Math.min(width - 32, BANNER_MAX_W), 60, 0x226622, 0.8)
      .setDepth(92).setAlpha(0);
    const text = this.add.text(width / 2, height / 2 + 60, `${topicName} Unlocked!`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#44ff44',
      stroke: '#003300',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(93).setScale(0.3).setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 0.8,
      duration: 300,
      yoyo: true,
      hold: 1400,
      onComplete: () => bg.destroy(),
    });

    this.tweens.add({
      targets: text,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          y: height / 2 + 30,
          duration: 500,
          delay: 1000,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  onBulletHitAsteroid(bullet, asteroid) {
    if (!bullet.active || !asteroid.active) return;
    bullet.kill();

    // During level transition, shots have no effect
    if (this.isTransitioning) {
      asteroid.kill();
      return;
    }

    if (asteroid.isTarget) {
      const pts = this.scoreManager.addShootPoints();
      this.showFloatingText(asteroid.x, asteroid.y, `+${pts}`, '#44ff44');
      this.spawnExplosion(asteroid.x, asteroid.y);

      // During boss fight, add points to boss progress
      if (this.isBossFight && this.boss && this.boss.active) {
        this.checkBossProgress(pts);
      }

      // Check for level up (points-based)
      if (!this.isBossFight && this.scoreManager.checkLevelUp()) {
        this.triggerLevelUp();
      }
    } else {
      this.scoreManager.wrongAction();
      this.showFloatingText(asteroid.x, asteroid.y, 'OOPS!', '#ff4444');
      this.flashScreen();
      this.animateHeartLoss();
      if (this.scoreManager.isGameOver()) {
        this.gameOver();
        asteroid.kill();
        return;
      }
    }

    asteroid.kill();
    this.updateHUD();
  }

  showFloatingText(x, y, text, color, size) {
    const t = this.add.text(x, y, text, {
      fontSize: `${size || 20}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  spawnExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
      const p = this.add.image(x, y, 'particle')
        .setTint(Phaser.Utils.Array.GetRandom([0xff4444, 0xffaa33, 0xffff44, 0xffffff]))
        .setScale(Phaser.Math.FloatBetween(0.3, 1.0))
        .setDepth(55);

      const angle = (Math.PI * 2 * i) / 10 + Phaser.Math.FloatBetween(-0.3, 0.3);
      const dist = Phaser.Math.Between(25, 70);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  flashScreen() {
    this.flashOverlay.setAlpha(0.35);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
    });
  }

  gameOver() {
    // Clean up boss if active
    if (this.boss) {
      this.boss.kill();
      this.boss = null;
    }
    this.isBossFight = false;

    const isNewHigh = SaveManager.addHighScore(this.mode, this.scoreManager.score);
    SaveManager.updateProgress(this.mode, this.scoreManager.level);
    SaveManager.addCorrectAnswers(this.scoreManager.correctCount);

    this.player.setActive(false);
    this.spawnExplosion(this.player.x, this.player.y);
    this.player.setVisible(false);

    this.cameras.main.shake(300, 0.02);
    this.cameras.main.fade(800, 0, 0, 0, false, (cam, progress) => {
      if (progress >= 1) {
        this.scene.start('GameOverScene', {
          score: this.scoreManager.score,
          mode: this.mode,
          correct: this.scoreManager.correctCount,
          total: this.scoreManager.totalCount,
          isNewHigh: isNewHigh,
        });
      }
    });
  }

  update(time, delta) {
    const { width, height } = this.scale;

    // Stars
    for (const star of this.stars) {
      star.y += star.speed * (delta / 1000);
      if (star.y > height + 5) {
        star.y = -5;
        star.x = Phaser.Math.Between(0, width);
      }
    }

    // Player
    if (this.player.active) {
      this.player.update(time, delta);
    }
  }
}
