# Onboarding Redesign

## Summary

Redesign the onboarding from 3 generic slides to 9 detailed slides covering each major feature. Style: emoji hero + title + bullet points with mini-emojis.

## Slides

1. **Welcome** — Emoji hero, app name, tagline
2. **Routines** — Create routines, use templates, organize exercises
3. **Set Tracking** — Log weight/reps, rest timer, supersets/circuits
4. **Progress & Stats** — Charts, PRs, muscle distribution
5. **Badges** — Unlock achievements for streaks, volume, variety
6. **Body Measurements** — Weight, measurements, progress photos
7. **Custom Exercises** — Create exercises, add notes, filter by muscle
8. **Backup & Privacy** — All data local, export/import, no account needed
9. **Get Started** — CTA button

## UI Details

- Skip button: top-right, hidden on last slide (already exists)
- Dot indicators: bottom center (already exists, update count)
- Each feature slide: emoji (56px) centered, title (28px bold), 2-3 FeatureBullet items
- Welcome slide: same as current (emoji + title + subtitle)
- Get Started slide: same as current (title + subtitle + blue CTA button)
- Horizontal paging ScrollView (existing mechanism)

## i18n

Add translation keys for all 7 new feature slides (EN + ES). Remove old `onboarding.features.*` keys.

## Files to modify

- `src/components/Onboarding.tsx` — rewrite slides
- `src/i18n/en.ts` — add/replace onboarding keys
- `src/i18n/es.ts` — add/replace onboarding keys
