import { GAMEPLAY } from '../utils/constants.js';

export default class ScoreManager {
  constructor() {
    this.score = 0;
    this.lives = GAMEPLAY.STARTING_LIVES;
    this.streak = 0;
    this.level = 1;
    this.levelPoints = 0;
    this.correctCount = 0;
    this.totalCount = 0;
  }

  getMultiplier() {
    return this.streak >= GAMEPLAY.STREAK_THRESHOLD ? 2 : 1;
  }

  addShootPoints() {
    const pts = GAMEPLAY.POINTS_SHOOT * this.getMultiplier();
    this.score += pts;
    this.levelPoints += pts;
    this.streak++;
    this.correctCount++;
    this.totalCount++;
    return pts;
  }

  getPointsForNextLevel() {
    return this.level * GAMEPLAY.POINTS_PER_LEVEL;
  }

  checkLevelUp() {
    if (this.levelPoints >= this.getPointsForNextLevel()) {
      this.levelPoints = 0;
      this.level++;
      return true;
    }
    return false;
  }

  addBoardPoints() {
    const pts = GAMEPLAY.POINTS_BOARD;
    this.score += pts;
    return pts;
  }

  wrongAction() {
    this.streak = 0;
    this.lives = Math.max(0, this.lives - 1);
    this.totalCount++;
    return this.lives;
  }

  isGameOver() {
    return this.lives <= 0;
  }
}
