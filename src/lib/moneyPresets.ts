export type MoneyPresetItem = {
  name: string;
  amount: number;
  emoji: string;
  cycle?: 'monthly' | 'yearly';
};

export const DEFAULT_SUBSCRIPTION_PRESETS: MoneyPresetItem[] = [
  { name: 'Netflix', amount: 649, cycle: 'monthly', emoji: '🍿' },
  { name: 'Disney+ Hotstar', amount: 299, cycle: 'monthly', emoji: '📺' },
  { name: 'Spotify Premium', amount: 119, cycle: 'monthly', emoji: '🎵' },
  { name: 'YouTube Premium', amount: 149, cycle: 'monthly', emoji: '▶️' },
  { name: 'Amazon Prime', amount: 1499, cycle: 'yearly', emoji: '📦' },
  { name: 'ChatGPT Plus', amount: 1999, cycle: 'monthly', emoji: '🤖' },
  { name: 'GitHub Copilot', amount: 850, cycle: 'monthly', emoji: '💻' },
  { name: 'Apple One', amount: 365, cycle: 'monthly', emoji: '🍎' },
  { name: 'Gym Membership', amount: 2000, cycle: 'monthly', emoji: '🏋️' },
  { name: 'JioFiber / Wifi', amount: 999, cycle: 'monthly', emoji: '📶' },
  { name: 'Google One 100GB', amount: 130, cycle: 'monthly', emoji: '☁️' },
  { name: 'iCloud 50GB', amount: 75, cycle: 'monthly', emoji: '☁️' },
];

export const DEFAULT_INVESTMENT_PRESETS: MoneyPresetItem[] = [
  { name: 'Nifty 50 Index Fund', amount: 5000, emoji: '📈' },
  { name: 'Parag Parikh Flexi Cap', amount: 5000, emoji: '💼' },
  { name: 'Sovereign Gold Bonds (SGB)', amount: 2500, emoji: '🪙' },
  { name: 'Public Provident Fund (PPF)', amount: 3000, emoji: '🏛️' },
  { name: 'Fixed Deposit (FD)', amount: 10000, emoji: '🏦' },
  { name: 'Tech Growth Stocks', amount: 5000, emoji: '🚀' },
  { name: 'Emergency Liquid Fund', amount: 5000, emoji: '🛡️' },
  { name: 'Crypto / Bitcoin', amount: 2000, emoji: '⚡' },
];

export const DEFAULT_BIG_EXPENSE_PRESETS: MoneyPresetItem[] = [
  { name: 'House Rent', amount: 20000, emoji: '🏠' },
  { name: 'Car / Bike EMI', amount: 12000, emoji: '🚗' },
  { name: 'Home Loan EMI', amount: 25000, emoji: '🏦' },
  { name: 'Maid / Cook Salary', amount: 5000, emoji: '🧹' },
  { name: 'Apartment Maintenance', amount: 3500, emoji: '🏢' },
  { name: 'Term Insurance', amount: 1500, emoji: '🛡️' },
  { name: 'Health Insurance', amount: 2000, emoji: '🏥' },
  { name: 'Internet / Wifi', amount: 999, emoji: '📶' },
  { name: 'Electricity / Utility', amount: 2500, emoji: '⚡' },
];

export function mergeMoneyPresets(
  existingPresets: MoneyPresetItem[],
  newPreset: MoneyPresetItem
): MoneyPresetItem[] {
  const filtered = existingPresets.filter(
    p => p.name.toLowerCase() !== newPreset.name.toLowerCase()
  );
  return [...filtered, newPreset];
}
