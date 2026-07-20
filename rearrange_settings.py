import re

with open('src/features/settings/SettingsFeature.tsx', 'r') as f:
    content = f.read()

# 1. Change grid to columns
content = content.replace(
    'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start"',
    'className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 space-y-6 md:space-y-8"'
)

# 2. Add break-inside-avoid to tiles
# The tiles usually have: className="tile p-6 sm:p-8 space-y-6"
# Or className="tile p-6 sm:p-8 space-y-6 relative overflow-hidden group" (for danger zone maybe?)

def add_break_inside(match):
    class_str = match.group(1)
    if 'break-inside-avoid' not in class_str:
        return f'className="{class_str} break-inside-avoid inline-block w-full"'
    return match.group(0)

# Replace all tile classes that start the cards
content = re.sub(r'className="(tile p-6[^"]*)"', add_break_inside, content)

with open('src/features/settings/SettingsFeature.tsx', 'w') as f:
    f.write(content)

print("Settings rearranged")
