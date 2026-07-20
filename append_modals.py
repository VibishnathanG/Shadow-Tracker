import os

with open('src/features/settings/SettingsFeature.tsx', 'r') as f:
    content = f.read()

with open('modals.tsx', 'r') as f:
    modals_content = f.read()

with open('src/features/settings/SettingsFeature.tsx', 'w') as f:
    f.write(content + '\n' + modals_content)

print("Modals appended!")
