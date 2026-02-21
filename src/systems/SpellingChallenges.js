import Phaser from 'phaser';

const SIGHT_WORDS = [
  'the', 'and', 'is', 'it', 'to', 'in', 'he', 'she', 'we', 'me',
  'do', 'go', 'no', 'so', 'my', 'up', 'am', 'an', 'at', 'on',
  'can', 'did', 'had', 'has', 'him', 'his', 'her', 'let', 'may', 'new',
  'now', 'old', 'our', 'out', 'own', 'say', 'too', 'use', 'way', 'who',
  'big', 'but', 'not', 'get', 'run', 'red', 'see', 'two', 'was', 'yes',
];

const CVC_WORDS = [
  'cat', 'bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat',
  'dog', 'log', 'fog', 'hog', 'jog', 'bog',
  'run', 'sun', 'fun', 'bun', 'gun', 'nun',
  'big', 'dig', 'fig', 'pig', 'wig', 'jig',
  'hop', 'mop', 'top', 'pop', 'cop',
];

const RHYME_FAMILIES = {
  cat: ['bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat'],
  dog: ['log', 'fog', 'hog', 'jog', 'bog'],
  run: ['sun', 'fun', 'bun', 'gun', 'nun'],
  big: ['dig', 'fig', 'pig', 'wig', 'jig'],
  hop: ['mop', 'top', 'pop', 'cop'],
  bed: ['red', 'fed', 'led', 'wed'],
};

const MISSPELLINGS = {
  'the': 'teh', 'dog': 'dgo', 'cat': 'cta', 'was': 'wsa',
  'has': 'hsa', 'and': 'adn', 'run': 'rnu', 'see': 'sse',
  'big': 'bgi', 'get': 'gte', 'can': 'cna', 'did': 'ddi',
  'him': 'hmi', 'her': 'hre', 'now': 'nwo', 'our': 'oru',
  'out': 'otu', 'say': 'sya', 'two': 'tow', 'new': 'nwe',
};

const LETTER_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TEMPLATES = [
  // --- letters topic ---
  {
    topic: 'letters',
    generate() {
      const chosen = Phaser.Utils.Array.Shuffle([...LETTER_POOL]).slice(0, 5);
      const labels = [];
      for (const letter of chosen) {
        labels.push({ text: letter, isTarget: true });   // uppercase = target
        labels.push({ text: letter.toLowerCase(), isTarget: false });
      }
      return {
        prompt: 'Shoot the capital letters!',
        labels: Phaser.Utils.Array.Shuffle(labels),
      };
    },
  },
  {
    topic: 'letters',
    generate() {
      const chosen = Phaser.Utils.Array.Shuffle([...LETTER_POOL]).slice(0, 5);
      const labels = [];
      for (const letter of chosen) {
        labels.push({ text: letter, isTarget: false });
        labels.push({ text: letter.toLowerCase(), isTarget: true }); // lowercase = target
      }
      return {
        prompt: 'Shoot the lowercase letters!',
        labels: Phaser.Utils.Array.Shuffle(labels),
      };
    },
  },

  // --- starting topic ---
  {
    topic: 'starting',
    generate() {
      const letters = ['B', 'C', 'D', 'S', 'H', 'M', 'P', 'R'];
      const letter = Phaser.Utils.Array.GetRandom(letters);
      const allWords = [...new Set([...CVC_WORDS, ...SIGHT_WORDS])];
      const matching = allWords.filter(w => w[0].toUpperCase() === letter);
      const notMatching = allWords.filter(w => w[0].toUpperCase() !== letter);

      const labels = [];
      const chosen = Phaser.Utils.Array.Shuffle([...matching]).slice(0, 4);
      for (const w of chosen) {
        labels.push({ text: w, isTarget: true });
      }
      const others = Phaser.Utils.Array.Shuffle([...notMatching]).slice(0, 6);
      for (const w of others) {
        labels.push({ text: w, isTarget: false });
      }
      return {
        prompt: `Shoot words that start with ${letter}!`,
        labels: Phaser.Utils.Array.Shuffle(labels),
      };
    },
  },

  // --- rhymes topic ---
  {
    topic: 'rhymes',
    generate() {
      const families = Object.keys(RHYME_FAMILIES);
      const family = Phaser.Utils.Array.GetRandom(families);
      const rhymes = RHYME_FAMILIES[family];
      const nonRhymes = CVC_WORDS.filter(w => !rhymes.includes(w) && w !== family);

      const labels = [];
      const chosen = Phaser.Utils.Array.Shuffle([...rhymes]).slice(0, 4);
      for (const w of chosen) {
        labels.push({ text: w, isTarget: true });
      }
      const others = Phaser.Utils.Array.Shuffle([...nonRhymes]).slice(0, 5);
      for (const w of others) {
        labels.push({ text: w, isTarget: false });
      }
      return {
        prompt: `Shoot words that rhyme with ${family}!`,
        labels: Phaser.Utils.Array.Shuffle(labels),
      };
    },
  },

  // --- spelling topic ---
  {
    topic: 'spelling',
    generate() {
      const words = Object.keys(MISSPELLINGS);
      const chosen = Phaser.Utils.Array.Shuffle([...words]).slice(0, 5);
      const labels = [];
      for (const w of chosen) {
        labels.push({ text: w, isTarget: false });
        labels.push({ text: MISSPELLINGS[w], isTarget: true });
      }
      return {
        prompt: 'Shoot misspelled words!',
        labels: Phaser.Utils.Array.Shuffle(labels),
      };
    },
  },
];

export function getRandomSpellingChallenge(unlockedTopics, preferTopic) {
  const available = TEMPLATES.filter(t => unlockedTopics.includes(t.topic));
  const template = pickWeighted(available, unlockedTopics, preferTopic);
  return { template, challenge: template.generate() };
}

function pickWeighted(templates, unlockedTopics, preferTopic) {
  if (preferTopic) {
    const forced = templates.filter(t => t.topic === preferTopic);
    if (forced.length > 0) return Phaser.Utils.Array.GetRandom(forced);
  }
  // Weight later topics higher: index 0 gets weight 1, index 1 gets 2, etc.
  const weighted = [];
  for (const t of templates) {
    const idx = unlockedTopics.indexOf(t.topic);
    const weight = (idx >= 0 ? idx : 0) + 1;
    for (let i = 0; i < weight; i++) weighted.push(t);
  }
  return Phaser.Utils.Array.GetRandom(weighted);
}
