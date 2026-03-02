# Tailwind CSS Fix Notes

**Date:** March 2, 2025  
**Issue:** Dashboard and other pages intermittently rendered as unstyled plain HTML — no layout, no colours, no spacing.

---

## What Was Wrong

| Check | Status | Details |
|-------|--------|---------|
| **1. globals.css** | ✓ Passed | First three lines (`@tailwind base`, `@tailwind components`, `@tailwind utilities`) were correct |
| **2. globals.css import** | ✓ Passed | `import './globals.css'` present as first import in `app/layout.tsx` |
| **3. tailwind.config.ts content** | ⚠ Fixed | Content paths were incomplete: missing `hooks/`, `types/`, and `.{js,jsx,mdx}` extensions |
| **4. PostCSS config** | ⚠ Fixed | `autoprefixer` plugin was missing; `autoprefixer` package was not installed |
| **5. Conflicting CSS resets** | ✓ Passed | No blanket `* {}` or `all: unset` resets found |
| **6. next.config** | ✓ Passed | No CSS loader overrides |
| **7. Package versions** | ⚠ Fixed | `autoprefixer` was not installed; added `autoprefixer@^10` |
| **8. .next cache** | ⚠ Fixed | Cleared `.next` and `node_modules/.cache`; dev server had stale webpack chunks |
| **9. .gitignore** | ⚠ Fixed | Added explicit `node_modules/.cache` entry |

---

## What Was Fixed

1. **tailwind.config.ts** — Expanded `content` array:
   - Added `./hooks/**/*.{js,ts,jsx,tsx,mdx}`
   - Added `./types/**/*.{js,ts,jsx,tsx,mdx}`
   - Extended all patterns to include `js`, `jsx`, and `mdx` for future-proofing

2. **postcss.config.mjs** — Added `autoprefixer: {}` plugin and installed `autoprefixer@^10` as a dev dependency.

3. **.gitignore** — Added `node_modules/.cache` explicitly (beyond the existing `node_modules` ignore) for clarity.

4. **Cache clear** — Removed `.next` and `node_modules/.cache` before verification.

---

## How to Prevent Recurrence

1. **Keep `.next` out of git** — `.next/` is already in `.gitignore`. Never commit it. Stale build artifacts cause intermittent styling failures across sessions.

2. **Clear cache after config changes** — Whenever you modify `tailwind.config.ts`, `postcss.config.mjs`, or `globals.css`, run:
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

3. **Never skip the cache clear** — If styles disappear after a config change or branch switch, the first step is always `rm -rf .next`.

4. **Package versions** — Keep `tailwindcss` on v3.x (not v4, which has breaking changes). Use `postcss@8.x` and `autoprefixer@10.x`.

---

## Verification

- `npm run build` — passes
- `npm run dev` — styles load on `/`, `/jobs`
- Homepage and jobs page include `/_next/static/css/app/layout.css` and Tailwind utility classes (`font-sans`, `min-h-screen`, `bg-bg`, `text-ink`, etc.)
