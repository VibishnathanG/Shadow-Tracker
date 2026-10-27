# Third-Party-App-Integrations-and-Automatic-Sync-Architecture

## S1-Overview

Shadow Tracker includes an extensible, local-first integration and one-way synchronization pipeline under [`src/lib/integrations/`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations). It allows users to continuously watch and ingest productivity, habit, workout, and nutrition telemetry from third-party mobile applications (such as **Streak** and **GymMane**), gracefully updating existing matching records and non-destructively appending new items into Shadow Tracker's local storage.

This document serves as the architectural reference and development guide for maintaining existing importers, configuring automatic file sync, and adding new third-party application integrations in the future.

---

## S2-Architecture-and-Data-Flow

The integration architecture follows a unidirectional, 4-stage pipeline:

```
[External Backup File] ──► [Stage 1: File Watcher & Decompressor]
                                 │ (integrationAutoSync.ts: lastModified timestamp check)
                                 │ (zipExtractor.ts: fflate raw streams & date normalizer)
                                 ▼
                           [Stage 2: Schema Parser & Mapper]
                                 │ (streakImporter.ts / gymmaneImporter.ts)
                                 ▼
                           [Stage 3: Graceful Updater & Smart Appender]
                                 │ (Same-name task updater, habit set union, food slot merger)
                                 │ (IndexedDB / LocalStorage / Zustand store)
                                 ▼
                           [Stage 4: Zero-Popup Live Event Dispatch]
                                 │ (shadow_tasks_updated, shadow_habits_updated, shadow_health_updated)
                                 ▼
                           [Silent HUD Reactivity Across Entire App]
```

### Stage 1: File Watcher & Timestamp Checking (`integrationAutoSync.ts`, `useIntegrationAutoSync.ts`)
- **Native File Handle Persistence**: When Auto-Sync is toggled ON, the user selects the source backup file once via the File System Access API (`showOpenFilePicker`). The resulting `FileSystemFileHandle` is persisted in IndexedDB (`shadow_integrations_sync` DB).
- **Timestamp Delta Checking**: Every 6 seconds (and whenever the browser tab regains focus or visibility), the engine queries `file.lastModified`. If `file.lastModified <= lastModified`, the check immediately aborts with 0% CPU consumption and zero disk activity.
- **Strict One-Way Ingestion**: Synchronization is strictly read-only from the source backup file into Shadow Tracker. Shadow Tracker never writes to or alters the source file.
- **Zero-Popup Operation**: Background synchronization executes completely silently without triggering file download prompts or popups.
- **Resilient Archive Extraction (`zipExtractor.ts`)**: Handles `.json`, `.zip`, and extensionless mobile backups. Circumvents Flutter/Dart `archive_io` header sizing discrepancies using raw stream inflation via `fflate`. Normalizes dates (`DD-MM-YYYY` ──► `YYYY-MM-DD`).

### Stage 2: Domain Schema Mapping
- Maps external domain entities into Shadow Tracker's native TypeScript interfaces:
  - **Streak To-Dos** ──► `Task` with `isSimple: true`
  - **Streak Habits** ──► `Habit` with calculated streaks, completed date sets, and category references
  - **GymMane Water** ──► `HydrationLog` sips indexed by date (`YYYY-MM-DD`)
  - **GymMane Meals** ──► `LoggedFood` entries mapped to `MealType` (`breakfast`, `lunch`, `dinner`, `snack`)
  - **GymMane Supplements** ──► `LoggedFood` entries with supplement tagging
  - **GymMane Foods Database** ──► `FoodItem` records merged into Shadow Tracker's custom foods library

### Stage 3: Graceful Same-Name Updating & Smart Append
- **Tasks & ToDos**:
  - If a task with the same `id` or matching `title` (case-insensitive) already exists in Shadow Tracker:
    - In-place update: Synchronizes completion status, priority, due date, reminder alarm, description, and checklist items from the incoming source backup.
    - Preserves Shadow Tracker local attributes (unique task ID, category, tags, star status, creation context).
    - Prevents duplicate task generation upon repeated synchronizations.
  - If no matching task exists, appends the new task to IndexedDB (`STORES.TASKS`).
- **Habits**:
  - If a habit with the same name or ID exists, performs a mathematical set union of `completedDates` (`Set<string>`), preserves all historical progress, merges missed reasons, and recalculates live streaks (`calculateStreaks`).
  - If new, creates a fresh habit record in IndexedDB (`STORES.HABITS`).
- **Nutrition & Hydration**:
  - Deduplicates water sips occurring at the same timestamp.
  - Updates food entries matching date, meal type, and timestamp, or appends new items.
  - Deduplicates custom foods by trimmed name in `shadow_custom_foods_v1`.

### Stage 4: Zero-Latency Reactive Dispatch
- Dispatches cross-component custom window events:
  - `shadow_tasks_updated`
  - `shadow_habits_updated`
  - `shadow_health_updated`
  - `shadow_integration_sync_status`
- The entire UI (Dashboard, ToDo list, Habit matrix, Nutrition plate) updates in real time without page reload or download disruptions.

---

## S3-Integration-Module-Reference

| Module | Purpose | Target Domain | Reference Note |
| :--- | :--- | :--- | :--- |
| [`integrationAutoSync.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations/integrationAutoSync.ts) | File handle management, timestamp detection & sync runner | Core Sync Engine | |
| [`useIntegrationAutoSync.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/useIntegrationAutoSync.ts) | Background polling hook with focus & visibility triggers | App Lifecycle | |
| [`zipExtractor.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations/zipExtractor.ts) | Resilient archive extraction & date normalization | Core Utilities | |
| [`streakImporter.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations/streakImporter.ts) | Streak parser with graceful same-name task updates | Tasks & Habits | |
| [`gymmaneImporter.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations/gymmaneImporter.ts) | GymMane parser for water, meals, and supplements | Health & Nutrition | |
| [`AppIntegrationsTile.tsx`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/features/settings/AppIntegrationsTile.tsx) | Settings UI tile with auto-sync toggles & manual import | Settings Feature | |

---

## S4-How-to-Add-a-New-App-Integration

Follow this standardized 5-step checklist when adding support for a new third-party app backup:

### Step 1: Create the Importer Module
Create a new file: `src/lib/integrations/<appName>Importer.ts`:

```typescript
import { BackupData } from '@/types';
import { dbService, STORES } from '@/lib/storage';
import { useShadowTrackerStore } from '@/store';
import { isZipBuffer, extractTextFilesFromZip, normalizeToYyyyMmDd } from './zipExtractor';

export interface NewAppParsedData {
  items: Array<{ id?: string; title: string; date: string; isCompleted?: boolean }>;
  sourceInfo: { app: string; exportedAt?: string };
}

export interface NewAppMergeSummary {
  itemsAdded: number;
  itemsUpdated: number;
  totalNow: number;
  backupData?: BackupData;
}

export async function parseNewAppBackup(input: File | Blob | ArrayBuffer | string): Promise<NewAppParsedData> {
  // 1. Extract JSON from string, file, or zip buffer using zipExtractor
  // 2. Parse and validate JSON structure
  // 3. Map entities and normalize dates via normalizeToYyyyMmDd
  return { items: [], sourceInfo: { app: 'NewApp' } };
}

export async function mergeNewAppDataIntoApp(
  parsed: NewAppParsedData,
  options?: { silent?: boolean; autoDownload?: boolean }
): Promise<NewAppMergeSummary> {
  // 1. Load current app state
  // 2. Gracefully update matching existing items by title or ID
  // 3. Append new non-existent items
  // 4. Persist back to storage and trigger window dispatchEvent
  return { itemsAdded: 0, itemsUpdated: 0, totalNow: 0 };
}
```

### Step 2: Implement Same-Name Update Policy
- Match existing records by `id` or normalized `name` / `title`.
- If matched, update status/data from source while preserving local Shadow Tracker metadata.
- If not matched, create new record.
- Always dispatch the corresponding window update event:
  - Tasks/ToDos: `window.dispatchEvent(new CustomEvent('shadow_tasks_updated'))`
  - Habits: `window.dispatchEvent(new CustomEvent('shadow_habits_updated'))`
  - Health/Nutrition: `window.dispatchEvent(new CustomEvent('shadow_health_updated'))`

### Step 3: Register in Auto-Sync Engine
In [`integrationAutoSync.ts`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/lib/integrations/integrationAutoSync.ts):
1. Add `<appName>` to `IntegrationType`.
2. Add sync case in `syncIntegrationFile`.
3. Add check in `checkAndSyncAllIntegrations`.

### Step 4: Wire into Settings UI
In [`AppIntegrationsTile.tsx`](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/features/settings/AppIntegrationsTile.tsx):
1. Add an action card with title, description, and auto-sync toggle.
2. Connect file picker and telemetry indicators.

### Step 5: Author Unit Tests
Create `src/lib/integrations/__tests__/<appName>Importer.test.ts`:
- Verify initial import creates items.
- Verify re-sync with same names updates existing items and does not duplicate.
- Verify no auto-download popups occur.

---

## S5-Testing-and-Verification

Run the test suite to verify integration and update integrity:

```bash
# Run integration unit tests
npx vitest run src/lib/integrations/

# Run complete application test suite
npm test
```

---

[↑ Back to top](#Third-Party-App-Integrations-and-Automatic-Sync-Architecture)
