import Phaser from 'phaser';
import { COLORS } from './utils/constants.js';

export function createGameConfig(scenes) {
  return {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: document.body,
      width: window.innerWidth,
      height: window.innerHeight,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: COLORS.BG,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: scenes,
    input: {
      activePointers: 2,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };
}
