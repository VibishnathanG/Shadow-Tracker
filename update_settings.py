import re

with open('src/features/settings/SettingsFeature.tsx', 'r') as f:
    content = f.read()

# 1. Change 'Advanced Administration' to 'Data & Sync'
content = content.replace(
    '<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Advanced Administration</div>',
    '<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Data & Sync</div>'
)

# 2. Change grid-cols-3 to grid-cols-2
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start pt-4">',
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start pt-4">'
)

# 3. Extract the Danger Zone tile entirely and replace it with a full-width structure below Data & Sync.
# The Danger Zone tile starts after the end of Cloud Sync `</motion.div>`
cloud_sync_end = content.find('</motion.div>', content.find('Cloud Sync (GitHub Gist)')) + len('</motion.div>')
danger_zone_start = content.find('<motion.div', cloud_sync_end)
grid_end = content.find('        </div>\n      </div>', danger_zone_start) + len('        </div>\n      </div>')

danger_zone_block = content[danger_zone_start:grid_end]

# We will remove danger_zone_block from inside the grid, and append the new Danger Zone below it.
content = content[:danger_zone_start] + '        </div>\n      </div>\n\n'

new_danger_zone = """      <div className="pt-8 mt-4 border-t border-border relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Danger Zone</div>
        
        <motion.div 
          className="tile p-6 sm:p-8 space-y-6 mt-4 w-full"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-red-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-red-500/15">
                  <Lucide.AlertOctagon size={18} />
                </span>
                Reset Database
              </h3>
              <p className="text-sm text-foreground leading-relaxed font-medium max-w-xl">
                Deletes schedules, journals, logs, and streaks permanently from this browser.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-red-500/10 text-red-500 font-bold text-sm rounded-2xl border-2 border-red-500/20 hover:border-red-500/40 transition-all shadow-sm"
            >
              <Lucide.Trash size={18} />
              Reset
            </motion.button>
          </div>
        </motion.div>
      </div>\n"""

content = content + new_danger_zone + content[grid_end:]

with open('src/features/settings/SettingsFeature.tsx', 'w') as f:
    f.write(content)

print("Danger zone extracted and layout updated.")
