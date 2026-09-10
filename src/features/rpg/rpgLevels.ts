/**
 * Life RPG Calibrated Leveling Curve & Legendary Milestone Titles
 *
 * Balanced progression curve for long-term consistency:
 * - Levels 1-10: Engaging onboarding (first 1-2 weeks)
 * - 1 Year of consistent execution: Reaches Level 40 - 50 (~50,000 - 65,000 XP)
 * - 2 Years of consistent execution: Reaches Level 60 (~100,000 - 120,000 XP)
 * - 3 Years of continuous discipline: Reaches Level ~77 (~180,000 XP)
 * - 5 Years of legendary mastery: Reaches Level 100 milestone (~320,000 - 400,000 XP)
 */

export const getXpForLevel = (level: number): number => {
  if (level <= 0) return 50;
  if (level === 1) return 60;
  if (level === 2) return 110;
  if (level === 3) return 170;
  if (level === 4) return 240;
  if (level === 5) return 320;
  if (level === 6) return 410;
  if (level === 7) return 510;
  if (level === 8) return 620;
  if (level === 9) return 740;
  if (level === 10) return 870;

  // Calibrated formula: 20 * (level ^ 1.28) + 40
  // Attainable across 5 years of daily consistency while maintaining challenge
  return Math.floor(20 * Math.pow(level, 1.28)) + 40;
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
