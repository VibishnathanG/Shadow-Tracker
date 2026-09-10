/**
 * Life RPG Exponential Leveling Curve & Legendary Milestone Titles
 *
 * Designed like classic MMOs and deep RPGs:
 * - Levels 1-10: Smooth, engaging onboarding (100 -> 7,000 XP)
 * - Levels 11-40: Solid commitment, regular habit and task execution
 * - Levels 41-75: Master discipline tier
 * - Levels 76-99: Mythic struggle (hundreds of thousands of XP per level)
 * - Level 100: Legendary milestone requiring millions of XP and years of dedication
 */

export const getXpForLevel = (level: number): number => {
  if (level <= 0) return 100;
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 450;
  if (level === 4) return 750;
  if (level === 5) return 1200;
  if (level === 6) return 1800;
  if (level === 7) return 2600;
  if (level === 8) return 3600;
  if (level === 9) return 5000;
  if (level === 10) return 7000;

  // Exponential scaling for levels 11 - 100+
  // At level 25: ~48,000 XP
  // At level 50: ~190,000 XP
  // At level 75: ~420,000 XP
  // At level 99: ~750,000 XP per level
  return Math.floor(100 * Math.pow(level, 1.95));
};

export const getCumulativeXpForLevel = (targetLevel: number): number => {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += getXpForLevel(l);
  }
  return total;
};

export const getCharacterTitle = (level: number): string => {
  if (level >= 100) return 'Eternal Sovereign of Shadows';
  if (level >= 95) return 'Cosmic Dreadnought';
  if (level >= 90) return 'Transcendent Shadow Deity';
  if (level >= 85) return 'Celestial Paragon';
  if (level >= 80) return 'Grand Archon of Destiny';
  if (level >= 75) return 'Astral Vanguard';
  if (level >= 70) return 'Prime Void Conqueror';
  if (level >= 65) return 'Zenith Overlord';
  if (level >= 60) return 'Master of Chronos & Will';
  if (level >= 55) return 'Abyssal Conqueror';
  if (level >= 50) return 'Supreme Discipline Warlord';
  if (level >= 45) return 'Sovereign Architect';
  if (level >= 40) return 'High Commander of Execution';
  if (level >= 35) return 'Ironclad Disciplinarian';
  if (level >= 30) return 'Apex Focus Templar';
  if (level >= 25) return 'Shadow Vanguard Elite';
  if (level >= 20) return 'Ascended Strategist';
  if (level >= 15) return 'Life Grandmaster';
  if (level >= 10) return 'Master of Shadows';
  if (level >= 5) return 'Shadow Initiate';
  return 'Novice Wanderer';
};

export const ROMAN_TIERS = [
  'Tier 0',
  'Tier I',
  'Tier II',
  'Tier III',
  'Tier IV',
  'Tier V',
  'Tier VI',
  'Tier VII',
  'Tier VIII',
  'Tier IX',
  'Tier X',
  'Tier XI',
  'Tier XII',
  'Tier XIII',
  'Tier XIV',
  'Tier XV',
  'Tier XVI',
  'Tier XVII',
  'Tier XVIII',
  'Tier XIX',
  'Tier XX',
];

export const getCharacterTier = (level: number): { tierNum: number; badge: string; title: string } => {
  const tierNum = Math.min(20, Math.floor(Math.max(0, level) / 5));
  return {
    tierNum,
    badge: ROMAN_TIERS[tierNum] || `Tier ${tierNum}`,
    title: getCharacterTitle(level)
  };
};
