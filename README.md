# IronLog

Gym tracker app. Track workouts, exercises, body measurements, and progress — all offline, no cloud.

## Stack

- **React Native** (Expo SDK 55) + Expo Router
- **SQLite** (expo-sqlite) — local-only database
- **NativeWind** — Tailwind CSS for React Native
- **TypeScript** (strict mode)
- **Lucide Icons**

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command          | Description           |
| ---------------- | --------------------- |
| `pnpm dev`       | Start Expo dev server |
| `pnpm android`   | Run on Android        |
| `pnpm test`      | Run tests             |
| `pnpm typecheck` | TypeScript check      |
| `pnpm lint`      | ESLint                |
| `pnpm format`    | Prettier              |

## Features

- 191 predefined exercises with multi-muscle-group support
- Custom exercise creation
- Routine builder with exercise ordering
- Workout tracking with set logging (weight, reps, duration, distance)
- Rest timer per exercise
- Body measurements tracking (weight, body fat, chest, waist, hips, biceps, thighs)
- Muscle fatigue map
- Dashboard with stats, streaks, and PRs
- Progress charts (max weight, volume over time)
- Muscle group distribution
- Backup/restore (JSON export/import)
- Bilingual (EN/ES) with device locale detection

## Project Structure

```
app/            # Expo Router screens (5 tabs + stacks)
src/
  components/   # UI and feature components
  constants/    # Theme, predefined exercises
  db/           # Schema, migrations, connection, seed
  hooks/        # Business logic hooks
  i18n/         # Translations (EN + ES)
  repositories/ # Data access layer
  types/        # TypeScript interfaces
```

---

Made with :muscle: by [Alvaro Torres](https://alvarotc.com)
