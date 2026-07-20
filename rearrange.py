import re

with open('src/features/dashboard/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Change grid cols of Left and Center
content = content.replace('className="space-y-6 lg:col-span-3 flex flex-col"', 'className="space-y-6 lg:col-span-4 flex flex-col"', 1)
content = content.replace('className="space-y-6 lg:col-span-6 flex flex-col"', 'className="space-y-6 lg:col-span-8 flex flex-col"', 1)

# 2. Extract Badges Drawer
badges_start = content.find('          {/* Badges Drawer */}')
badges_end = content.find('          </motion.div>', badges_start) + len('          </motion.div>\n')
badges_block = content[badges_start:badges_end]
content = content[:badges_start] + content[badges_end:]

# Modify badges_block to be horizontal
badges_block = badges_block.replace('className="grid grid-cols-2 gap-3 relative z-10"', 'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10"')

# 3. Extract Right Rail contents (Analytics & Habits)
right_rail_start = content.find('        {/* 3. RIGHT RAIL (col-span-3) */}')
right_rail_end = content.find('      </div>\n\n      <Modal', right_rail_start)
right_rail_block = content[right_rail_start:right_rail_end]
content = content[:right_rail_start] + content[right_rail_end:]

# Get just the inner blocks of Right Rail
inner_content_start = right_rail_block.find('          {/* Analytics Snapshot Mini */}')
inner_content_end = right_rail_block.rfind('        </div>')
inner_blocks = right_rail_block[inner_content_start:inner_content_end]

# 4. Insert Analytics and Habits at the end of Left Rail
# Left rail ends right before {/* 2. CENTER (col-span-6) */}
center_start = content.find('        {/* 2. CENTER (col-span-6) */}')
content = content[:center_start] + inner_blocks + '\n' + content[center_start:]

# 5. Insert Badges Drawer at the end of the Grid (before Modal)
grid_end = content.find('      </div>\n\n      <Modal')
content = content[:grid_end] + '\n        {/* Bottom Full-Width Section */}\n        <div className="lg:col-span-12">\n' + badges_block + '        </div>\n' + content[grid_end:]

with open('src/features/dashboard/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Rearrangement complete")
