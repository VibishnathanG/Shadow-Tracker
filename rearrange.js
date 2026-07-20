const fs = require('fs');
const file = 'src/features/dashboard/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const extract = (startMarker, endMarker) => {
    const start = content.indexOf(startMarker);
    if (start === -1) throw new Error("Could not find " + startMarker);
    let end = content.indexOf(endMarker, start);
    if (end === -1) end = content.indexOf('{/* 2.', start); // Fallbacks
    if (end === -1) end = content.indexOf('{/* 3.', start);
    if (end === -1) end = content.indexOf('{/* Bottom', start);
    if (end === -1) end = content.indexOf('</div>\n      </div>', start);
    return content.substring(start, end).trim();
};

const mascot = extract('{/* Animated Mascot widget */}', '{/* Analytics Snapshot Mini */}');
const analytics = extract('{/* Analytics Snapshot Mini */}', '{/* Active Habits Mini-List */}');
const activeRoutines = extract('{/* Active Habits Mini-List */}', '        </div>\n\n        {/* 2. CENTER');
const quickActions = extract('{/* Floating Quick Actions HUD (Moved here) */}', '{/* Today\'s Mission Progress HUD');
const missionHud = extract('{/* Today\'s Mission Progress HUD', '{/* Git-Commit Style Timeline View */}');
const timeline = extract('{/* Git-Commit Style Timeline View */}', '        </div>\n      </div>');
const badges = extract('{/* Badges Drawer */}', '        </div>\n      </div>\n\n      <Modal');

const newLayout = `      {/* 1. TOP ROW: Achievement Nexus */}
      <div className="mb-8">
        ${badges}
      </div>

      {/* 2. SECOND ROW: 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-6">
        <div className="flex flex-col h-full">
          ${mascot}
        </div>
        <div className="flex flex-col h-full">
          ${analytics}
        </div>
        <div className="flex flex-col h-full">
          ${missionHud}
        </div>
        <div className="flex flex-col h-full">
          ${quickActions}
        </div>
      </div>

      {/* 3. THIRD ROW: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
        <div className="lg:col-span-4 flex flex-col h-full">
          ${activeRoutines}
        </div>
        <div className="lg:col-span-8 flex flex-col h-full">
          ${timeline}
        </div>
      </div>`;

// Replace the old layout
const startLayout = content.indexOf('{/* Mission Control Grid Layout */}');
const endLayout = content.indexOf('      <Modal\n        isOpen={showBadgesInfo}');

if (startLayout === -1 || endLayout === -1) throw new Error("Could not find layout bounds");

content = content.substring(0, startLayout) + newLayout + '\n\n' + content.substring(endLayout);

fs.writeFileSync(file, content);
console.log("Successfully rearranged layout!");
