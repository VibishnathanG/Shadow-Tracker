const fs = require('fs');
const file = 'src/features/dashboard/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\btext-sm\b/g, 'text-base');
content = content.replace(/\btext-xs\b/g, 'text-sm');
content = content.replace(/\btext-\[10px\]\b/g, 'text-xs');
content = content.replace(/\btext-\[9px\]\b/g, 'text-[10px]');
content = content.replace(/\btext-2xl\b/g, 'text-3xl');
content = content.replace(/\btext-3xl\b/g, 'text-4xl');

fs.writeFileSync(file, content);
console.log('Fonts bumped in Dashboard.tsx');
