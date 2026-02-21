import { getRandomMathChallenge, generateFromTemplate } from './MathChallenges.js';
import { getRandomSpellingChallenge } from './SpellingChallenges.js';
import SaveManager from './SaveManager.js';

const TOPIC_ORDER = {
  math: [
    'compare', 'oddeven', 'addition', 'addition2',
    'subtraction', 'subtraction2', 'multiplication', 'multiplication2',
    'division', 'division2',
  ],
  spelling: ['letters', 'starting', 'rhymes', 'spelling'],
};

const TOPIC_LABELS = {
  compare: 'Comparison',
  oddeven: 'Odd & Even',
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  addition2: 'Advanced Addition',
  subtraction2: 'Advanced Subtraction',
  multiplication2: 'Advanced Multiplication',
  division2: 'Advanced Division',
  letters: 'Letter Case',
  starting: 'Starting Letters',
  rhymes: 'Rhymes',
  spelling: 'Spelling',
};

const UNLOCK_EVERY_N_LEVELS = 5;

export default class ChallengeManager {
  constructor(mode) {
    this.mode = mode;
    this.currentChallenge = null;
    this.currentTemplate = null;
    this.labelPool = [];
    this.labelIndex = 0;
    this.forceTopic = null;
    this.unlockedTopics = SaveManager.getUnlockedTopics(mode);
    // Ensure at least the first topic is unlocked
    const first = TOPIC_ORDER[mode][0];
    if (!this.unlockedTopics.includes(first)) {
      this.unlockedTopics.push(first);
    }
  }

  nextChallenge() {
    const preferTopic = this.forceTopic;
    this.forceTopic = null;

    let template, challenge;
    if (this.mode === 'math') {
      ({ template, challenge } = getRandomMathChallenge(this.unlockedTopics, preferTopic));
    } else {
      ({ template, challenge } = getRandomSpellingChallenge(this.unlockedTopics, preferTopic));
    }
    this.currentTemplate = template;
    this.currentChallenge = challenge;
    this.labelPool = [...challenge.labels];
    this.labelIndex = 0;
    return this.currentChallenge;
  }

  refillPool() {
    if (!this.currentTemplate) {
      return this.nextChallenge();
    }
    if (this.mode === 'math') {
      this.currentChallenge = generateFromTemplate(this.currentTemplate);
    } else {
      this.currentChallenge = this.currentTemplate.generate();
    }
    this.labelPool = [...this.currentChallenge.labels];
    this.labelIndex = 0;
    return this.currentChallenge;
  }

  getNextLabel() {
    if (this.labelIndex >= this.labelPool.length) {
      return null;
    }
    return this.labelPool[this.labelIndex++];
  }

  isPoolExhausted() {
    return this.labelIndex >= this.labelPool.length;
  }

  getHardestTopic() {
    const order = TOPIC_ORDER[this.mode];
    for (let i = order.length - 1; i >= 0; i--) {
      if (this.unlockedTopics.includes(order[i])) return order[i];
    }
    return order[0];
  }

  getPrompt() {
    return this.currentChallenge ? this.currentChallenge.prompt : '';
  }

  // Called after a boss fight at levels 5, 10, 15, etc.
  checkUnlockForLevel(level) {
    // Unlocks happen at the level right after a boss (boss is at 5,10,15...)
    // so level 6 unlocks topic index 1, level 11 unlocks index 2, etc.
    if (level % UNLOCK_EVERY_N_LEVELS !== 1 || level === 1) return null;

    const order = TOPIC_ORDER[this.mode];
    const topicIndex = Math.floor(level / UNLOCK_EVERY_N_LEVELS);
    if (topicIndex > 0 && topicIndex < order.length) {
      const topic = order[topicIndex];
      if (!this.unlockedTopics.includes(topic)) {
        this.unlockedTopics.push(topic);
        SaveManager.unlockTopic(this.mode, topic);
        this.forceTopic = topic;
        return TOPIC_LABELS[topic] || topic;
      }
    }
    return null;
  }
}
