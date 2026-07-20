import re

with open('src/features/settings/SettingsFeature.tsx', 'r') as f:
    content = f.read()

# Remove the break-inside-avoid junk
content = content.replace(' break-inside-avoid inline-block w-full', '')

# Replace Top section columns container with a Grid
content = content.replace(
    'className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 space-y-6 md:space-y-8"',
    'className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start"'
)

# Find Mascot Carousel and add lg:col-span-2
# Find the tile for Mascot Carousel, which has "Mascot Carousel" inside it.
carousel_idx = content.find('Mascot Carousel')
if carousel_idx != -1:
    # Find the preceding <motion.div className="tile...">
    tile_start_idx = content.rfind('<motion.div', 0, carousel_idx)
    class_idx = content.find('className="', tile_start_idx) + 11
    content = content[:class_idx] + 'lg:col-span-2 ' + content[class_idx:]


# Find bottom section
bottom_idx = content.find('        <div className="space-y-6 md:space-y-8">')
bottom_replacement = """        <div className="pt-8 mt-4 border-t border-border relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Advanced Administration</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start pt-4">"""
if bottom_idx != -1:
    content = content[:bottom_idx] + bottom_replacement + content[bottom_idx + len('        <div className="space-y-6 md:space-y-8">'):]

with open('src/features/settings/SettingsFeature.tsx', 'w') as f:
    f.write(content)

print("Settings layout fixed")
