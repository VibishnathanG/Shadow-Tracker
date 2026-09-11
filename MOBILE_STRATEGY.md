# Shadow-Tracker Mobile Migration Strategy
## React Native + Expo Architecture Roadmap

This document serves as the guide for porting `shadow-tracker` from a Next.js Web App into a cross-platform mobile app (targeting Android APK and iOS) utilizing **React Native** and **Expo**.

---

## 1. Architectural Philosophy: Decoupled Core

To prevent a full rewrite, the codebase has been structured with a strict separation between **Business Logic (Core)** and **UI Components (Shell)**.

```mermaid
graph TD
    subgraph Shared Core
        Types[Domain Schemas /types]
        Store[Zustand State /store]
        DateUtils[Date Calculations /lib/dateUtils]
    end

    subgraph Web Shell
        NextApp[Next.js App /src/app]
        WebUI[React Web Components /components]
        IDB[IndexedDB Storage /lib/storage]
    end

    subgraph Mobile Shell (Expo)
        ExpoApp[Expo Router /app]
        MobileUI[React Native Tailwind Components]
        SQLite[SQLite / AsyncStorage Storage]
    end

    Types --> NextApp
    Types --> ExpoApp
    Store --> NextApp
    Store --> ExpoApp
    IDB -.-> Store
    SQLite -.-> Store
```

---

## 2. Storage Adapter Layer

On the web version, `shadow-tracker` uses **IndexedDB** for structured records and **localStorage** for settings. On mobile, these will be replaced with native storage equivalents:

### Adapter Pattern

Create a unified storage interface (`/lib/storage/interface.ts`):

```typescript
export interface StorageAdapter {
  get<T>(storeName: string, id: string): Promise<T | null>;
  getAll<T>(storeName: string): Promise<T[]>;
  put<T>(storeName: string, value: T): Promise<void>;
  delete(storeName: string, id: string): Promise<void>;
  clear(storeName: string): Promise<void>;
}
```

- **Web Implementation**: Implement using `indexedDB` (as written in `src/lib/storage.ts`).
- **Mobile Implementation**: Implement using `@react-native-async-storage/async-storage` (for settings) and `expo-sqlite` (for tasks, habits, and logs).

---

## 3. Zustand Store Adaptability

The Zustand store (`src/store/index.ts`) is designed in pure TypeScript, referencing `dbService` dynamically. When compiling for Expo:
1. Ensure `dbService` resolves to the **SQLite/AsyncStorage Adapter** instead of the **IndexedDB Adapter**.
2. Expo will reuse 100% of the Zustand state mutations, streaks calculations, and score gauges!

---

## 4. UI Component Mapping

Web Tailwind v4 utilities correspond directly to **NativeWind** (Tailwind CSS engine for React Native).

| Web Element (Next.js) | Mobile Equivalent (React Native + NativeWind) | Reference Note |
| :--- | :--- |---|
| `div` (layout) | `View` | |
| `p` / `span` / `h1` | `Text` | |
| `button` | `Pressable` / `TouchableOpacity` | |
| `input[type="text"]` | `TextInput` | |
| `framer-motion` | `react-native-reanimated` | |
| Lucide React | `lucide-react-native` | |

### Custom SVG Charts
The custom SVG lines plotted in `/features/analytics/AnalyticsFeature.tsx` will map directly to `react-native-svg` on mobile, keeping visual identity identical.

---

## 5. Navigation Schema

`shadow-tracker` tabs maps naturally to Expo Router tab structures:

```
app/
├── (tabs)/
│   ├── _layout.tsx      <- Drawer & Bottom Tab Navigator
│   ├── index.tsx        <- Today Dashboard
│   ├── tasks.tsx        <- Tasks Workspace
│   ├── habits.tsx       <- Habit tracker
│   ├── calendar.tsx     <- Month Grid & Agenda
│   ├── analytics.tsx    <- Statistics SVG
│   └── notes.tsx        <- Journal reflection
├── settings.tsx         <- Settings modal
└── _layout.tsx          <- Root entry and theme resolver
```

---

## 6. Offline and Device Notifications

1. **Local Reminders**: Replace browser timer triggers with `expo-notifications` for background task scheduling.
2. **Haptics**: Integrate `expo-haptics` to trigger micro-vibrations when checking off habits or completing streaks, elevating gamification on mobile devices.
