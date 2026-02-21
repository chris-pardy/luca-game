import Phaser from 'phaser';

function buildCompareLabels(threshold, isTarget) {
  const targets = [];
  const others = [];
  for (let n = 1; n <= 9; n++) {
    if (isTarget(n)) targets.push(n);
    else others.push(n);
  }
  const half = 5;
  const labels = [];
  // Fill each side to 5, repeating from the smaller pool as needed
  for (let i = 0; i < half; i++) {
    labels.push({ text: String(targets[i % targets.length]), isTarget: true });
  }
  for (let i = 0; i < half; i++) {
    labels.push({ text: String(others[i % others.length]), isTarget: false });
  }
  return Phaser.Utils.Array.Shuffle(labels);
}

const TEMPLATES = [
  // --- compare topic ---
  {
    topic: 'compare',
    generate() {
      const threshold = Phaser.Math.Between(3, 7);
      const labels = buildCompareLabels(threshold, (n) => n < threshold);
      return { prompt: `Shoot numbers less than ${threshold}!`, labels };
    },
  },
  {
    topic: 'compare',
    generate() {
      const threshold = Phaser.Math.Between(3, 7);
      const labels = buildCompareLabels(threshold, (n) => n > threshold);
      return { prompt: `Shoot numbers greater than ${threshold}!`, labels };
    },
  },

  // --- oddeven topic ---
  {
    topic: 'oddeven',
    prompt: 'Shoot even numbers!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 9) {
        const n = Phaser.Math.Between(1, 9);
        if (used.has(n)) continue;
        used.add(n);
        labels.push({ text: String(n), isTarget: n % 2 === 0 });
      }
      return labels;
    },
  },
  {
    topic: 'oddeven',
    prompt: 'Shoot odd numbers!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 9) {
        const n = Phaser.Math.Between(1, 9);
        if (used.has(n)) continue;
        used.add(n);
        labels.push({ text: String(n), isTarget: n % 2 !== 0 });
      }
      return labels;
    },
  },

  // --- addition topic ---
  {
    topic: 'addition',
    generate() {
      const target = Phaser.Math.Between(5, 10);
      const labels = [];
      const pairs = [];
      for (let a = 1; a <= 9; a++) {
        for (let b = 1; b <= 9; b++) {
          pairs.push({ a, b, sum: a + b });
        }
      }
      Phaser.Utils.Array.Shuffle(pairs);
      const used = new Set();
      for (const p of pairs) {
        const key = `${p.a}+${p.b}`;
        if (used.has(key) || labels.length >= 10) continue;
        used.add(key);
        labels.push({ text: `${p.a}+${p.b}`, isTarget: p.sum === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'addition',
    prompt: 'Shoot answers greater than 10!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(1, 9);
        const b = Phaser.Math.Between(1, 9);
        const key = `${a}+${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}+${b}`, isTarget: a + b > 10 });
      }
      return labels;
    },
  },

  // --- subtraction topic ---
  {
    topic: 'subtraction',
    generate() {
      const target = Phaser.Math.Between(1, 5);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(2, 9);
        const b = Phaser.Math.Between(1, a - 1);
        const key = `${a}-${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}-${b}`, isTarget: (a - b) === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'subtraction',
    prompt: 'Shoot answers less than 3!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(2, 9);
        const b = Phaser.Math.Between(1, a - 1);
        const key = `${a}-${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}-${b}`, isTarget: (a - b) < 3 });
      }
      return labels;
    },
  },

  // --- multiplication topic ---
  {
    topic: 'multiplication',
    generate() {
      const target = Phaser.Math.Between(6, 20);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(1, 9);
        const b = Phaser.Math.Between(1, 9);
        const key = `${a}x${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}x${b}`, isTarget: a * b === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'multiplication',
    generate() {
      const threshold = Phaser.Math.Between(15, 30);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(2, 9);
        const b = Phaser.Math.Between(2, 9);
        const key = `${a}x${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}x${b}`, isTarget: a * b > threshold });
      }
      return { prompt: `Shoot answers greater than ${threshold}!`, labels };
    },
  },

  // --- division topic ---
  {
    topic: 'division',
    generate() {
      const target = Phaser.Math.Between(2, 6);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const b = Phaser.Math.Between(2, 9);
        const result = Phaser.Math.Between(1, 9);
        const a = b * result;
        const key = `${a}÷${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}÷${b}`, isTarget: result === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'division',
    generate() {
      const threshold = Phaser.Math.Between(3, 6);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const b = Phaser.Math.Between(2, 9);
        const result = Phaser.Math.Between(1, 9);
        const a = b * result;
        const key = `${a}÷${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: `${a}÷${b}`, isTarget: result < threshold });
      }
      return { prompt: `Shoot answers less than ${threshold}!`, labels };
    },
  },

  // --- addition2 topic (three-number addition) ---
  {
    topic: 'addition2',
    generate() {
      const target = Phaser.Math.Between(8, 18);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(1, 7);
        const b = Phaser.Math.Between(1, 7);
        const c = Phaser.Math.Between(1, 7);
        const key = `${a}+${b}+${c}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: a + b + c === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'addition2',
    generate() {
      const threshold = Phaser.Math.Between(12, 18);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(1, 9);
        const b = Phaser.Math.Between(1, 9);
        const c = Phaser.Math.Between(1, 9);
        const key = `${a}+${b}+${c}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: a + b + c > threshold });
      }
      return { prompt: `Shoot answers greater than ${threshold}!`, labels };
    },
  },

  // --- subtraction2 topic (chained subtraction) ---
  {
    topic: 'subtraction2',
    generate() {
      const target = Phaser.Math.Between(1, 8);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(5, 18);
        const b = Phaser.Math.Between(1, a - 1);
        const c = Phaser.Math.Between(0, Math.min(4, a - b - 1));
        const key = c > 0 ? `${a}-${b}-${c}` : `${a}-${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: a - b - c === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'subtraction2',
    generate() {
      const threshold = Phaser.Math.Between(3, 8);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(6, 20);
        const b = Phaser.Math.Between(1, a - 1);
        const key = `${a}-${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: (a - b) > threshold });
      }
      return { prompt: `Shoot answers greater than ${threshold}!`, labels };
    },
  },

  // --- multiplication2 topic (bigger products) ---
  {
    topic: 'multiplication2',
    generate() {
      const target = Phaser.Math.Between(20, 50);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(3, 9);
        const b = Phaser.Math.Between(3, 9);
        const key = `${a}x${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: a * b === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
  {
    topic: 'multiplication2',
    prompt: 'Shoot answers that are even!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const a = Phaser.Math.Between(2, 9);
        const b = Phaser.Math.Between(2, 9);
        const key = `${a}x${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: (a * b) % 2 === 0 });
      }
      return labels;
    },
  },

  // --- division2 topic (no-remainder vs remainder) ---
  {
    topic: 'division2',
    prompt: 'Shoot divisions with no remainder!',
    generate() {
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const b = Phaser.Math.Between(2, 9);
        const a = Phaser.Math.Between(2, 9) * b + Phaser.Math.Between(0, b - 1);
        const key = `${a}÷${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: a % b === 0 });
      }
      return labels;
    },
  },
  {
    topic: 'division2',
    generate() {
      const target = Phaser.Math.Between(3, 9);
      const labels = [];
      const used = new Set();
      while (labels.length < 10) {
        const b = Phaser.Math.Between(3, 9);
        const result = Phaser.Math.Between(1, 12);
        const a = b * result;
        const key = `${a}÷${b}`;
        if (used.has(key)) continue;
        used.add(key);
        labels.push({ text: key, isTarget: result === target });
      }
      return { prompt: `Shoot answers equal to ${target}!`, labels };
    },
  },
];

export function generateFromTemplate(template) {
  const result = template.generate();
  if (Array.isArray(result)) {
    return { prompt: template.prompt, labels: result };
  }
  return { prompt: result.prompt || template.prompt, labels: result.labels || result };
}

export function getRandomMathChallenge(unlockedTopics, preferTopic) {
  const available = TEMPLATES.filter(t => unlockedTopics.includes(t.topic));
  const template = pickWeighted(available, unlockedTopics, preferTopic);
  return { template, challenge: generateFromTemplate(template) };
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
