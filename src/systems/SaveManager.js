const SAVE_KEY = 'luca-game-save';

const DEFAULT_SAVE = {
  highScores: {
    math: [],
    spelling: [],
  },
  progress: {
    math: 0,
    spelling: 0,
  },
  stats: {
    totalCorrect: 0,
    totalGames: 0,
  },
  unlockedTopics: {
    math: ['compare'],
    spelling: ['letters'],
  },
};

export default class SaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const merged = { ...DEFAULT_SAVE, ...data };
        // Ensure unlockedTopics has both modes with defaults
        merged.unlockedTopics = {
          math: ['compare'],
          spelling: ['letters'],
          ...data.unlockedTopics,
        };
        return merged;
      }
    } catch (e) {
      // Corrupted save, reset
    }
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage full or unavailable
    }
  }

  static getUnlockedTopics(mode) {
    const data = SaveManager.load();
    return data.unlockedTopics[mode] || [];
  }

  static unlockTopic(mode, topic) {
    const data = SaveManager.load();
    if (!data.unlockedTopics[mode]) {
      data.unlockedTopics[mode] = [];
    }
    if (!data.unlockedTopics[mode].includes(topic)) {
      data.unlockedTopics[mode].push(topic);
    }
    SaveManager.save(data);
  }

  static addHighScore(mode, score) {
    const data = SaveManager.load();
    const scores = data.highScores[mode] || [];
    scores.push(score);
    scores.sort((a, b) => b - a);
    data.highScores[mode] = scores.slice(0, 5);
    const isNew = data.highScores[mode][0] === score;
    SaveManager.save(data);
    return isNew;
  }

  static updateProgress(mode, level) {
    const data = SaveManager.load();
    if (level > (data.progress[mode] || 0)) {
      data.progress[mode] = level;
    }
    data.stats.totalGames++;
    SaveManager.save(data);
  }

  static addCorrectAnswers(count) {
    const data = SaveManager.load();
    data.stats.totalCorrect += count;
    SaveManager.save(data);
  }
}
