# Design System & Full UI Pass — Build Summary

**Completed:** 2026-02-28  
**Design identity:** Ascend — warm precision; Coheron DNA (intelligence, green as signal) with its own face for a human career moment.

---

## 1. Design Foundation

### Colour system (CSS variables in `app/globals.css`)

| Token | Value | Use |
|-------|--------|-----|
| `--bg` | `#F7F6F1` | Warm parchment — primary canvas |
| `--surface` | `#FFFFFF` | Cards, modals, inputs |
| `--surface-2` | `#F0EFE9` | Input backgrounds, sidebar |
| `--border` / `--border-mid` | `#E8E6DF` / `#D4D1C8` | Borders |
| `--green` | `#16A34A` | Primary accent — growth, grounded |
| `--green-dark` | `#0F6930` | Hover/active |
| `--green-light` / `--green-mid` | Badges, focus rings |
| `--ink` … `--ink-5` | `#0F1A0F` … | Text hierarchy (ink with green undertone) |

**Dark sections only:** Ticker strip and Footer use `--ink` background; all other content is parchment/surface/white.

### Typography

- **Syne** (display): weights 400, 600, 700, 800 — hero logotype, section headlines, numbers.
- **DM Sans** (body): weights 300, 400, 500, 600 — body, labels, UI.
- Loaded via `next/font/google`; variables `--font-syne`, `--font-dm-sans` applied on `<html>`.
- Tailwind: `font-display`, `font-body`, `sans` (DM Sans).

### Grain & keyframes

- **Grain:** `body::before` with SVG fractal noise, opacity 0.028, fixed, pointer-events none.
- **Keyframes:** `fadeUp`, `fadeIn`, `ticker`, `drawUnderline`, `bounceCue` in `globals.css`.

---

## 2. Shared UI components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| **Button** | Variants: default/primary (green), ghost, destructive, outline, secondary, link, white (for CTA band). Sizes: default, sm, lg, icon. |
| **Input** | Design-system height 42px, border, focus ring green, error state. |
| **Card** | Variants: default, interactive (hover lift), flat. Uses `--surface`, `--border`. |
| **Badge** | Variants: green, dim, red, outline. Rounded-full, small type. |
| **SectionLabel** | Green uppercase label (optional leading dash). |
| **PageHeader** | Title (Syne) + subtitle + optional right slot; border-bottom. |
| **EmptyState** | Icon, title, message, optional CTA for empty lists. |

---

## 3. Homepage (`app/page.tsx` + `components/home/`)

| Section | Component | Notes |
|---------|-----------|--------|
| **Hero** | `HeroSection` | Coheron label, AscendLogotype, subheadline, feature line, SearchBar, scroll cue. |
| **Logotype** | `AscendLogotype` | Rising letters (staggered fade-in), green underline draw-in. |
| **Search** | `SearchBar` | Dual input (role / location), search button, trending pills; navigates to `/jobs`. |
| **Ticker** | `TickerStrip` | Dark strip (`--ink`), looping copy, green diamond separators. |
| **Features** | `FeaturesSection` | Four horizontal rows, decorative numbers, hover left-border + green tint; scroll-triggered fadeUp. |
| **Why Ascend** | `WhyAscendSection` | Two-column; headline + 2×2 differentiator grid (em-dash prefix). |
| **Stats** | `StatsSection` | Three stats, count-up on scroll (IntersectionObserver), green numbers. |
| **CTA** | `CtaBand` | Full-width green band, white button “Get Started — It’s Free”. |
| **Footer** | `Footer` | Dark (`--ink`), 4-column (brand, Product, Company, Legal), bottom bar, coheron.tech link. |

---

## 4. Global design pass

- **Layout** (`app/layout.tsx`): Syne + DM Sans applied; Toaster with design-system styles (success green border, error red border, bottom-right).
- **Navbar**: Parchment bg with backdrop blur, border-bottom, 64px height; Brand (Ascend + “A Coheron Product”); nav links ink-3, active green; Sign in (ghost) / Get started (primary).
- **Auth** (`AuthCard`): Parchment page bg; white card max-w 380px, rounded-2xl, shadow; Syne title, DM Sans description.
- **404** (`app/not-found.tsx`): Full dark screen; large dim “404”, “Page not found”, primary CTA “Back to home”.

---

## 5. Hard constraints (applied)

- No dark backgrounds on content pages except ticker and footer.
- Syne + DM Sans only (no Inter/Roboto in new design).
- Green as the only accent (buttons, active nav, section labels, badges, stats, CTA band).
- White button on green CTA band (not green-on-green).
- Grain at 0.028 opacity via `body::before`.
- Mobile-first; sections usable at 375px.

---

## 6. Files touched / added

| Area | Files |
|------|--------|
| **Foundation** | `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx` |
| **UI** | `components/ui/button.tsx`, `input.tsx`, `card.tsx`, `badge.tsx`, `section-label.tsx`, `page-header.tsx`, `empty-state.tsx` |
| **Home** | `app/page.tsx`, `components/home/AscendLogotype.tsx`, `HeroSection.tsx`, `SearchBar.tsx`, `TickerStrip.tsx`, `FeaturesSection.tsx`, `WhyAscendSection.tsx`, `StatsSection.tsx`, `CtaBand.tsx` |
| **Layout** | `components/layout/Footer.tsx`, `components/layout/Navbar.tsx` |
| **Auth** | `components/auth/AuthCard.tsx`, `app/auth/register/page.tsx`, `app/auth/login/page.tsx` |
| **Utility** | `app/not-found.tsx` |
| **Docs** | `PROJECT_PLAN.md` (status row), `DESIGN_SYSTEM_BUILD.md` (this file) |

---

## 7. Exit checklist (reference)

- [x] CSS variables in globals.css
- [x] body: bg, color, font-body, antialiased
- [x] Grain overlay body::before
- [x] Keyframes in globals.css
- [x] Syne + DM Sans in layout, Tailwind font-display / font-body
- [x] Button, Input, Card, Badge, SectionLabel, PageHeader, EmptyState
- [x] Homepage: AscendLogotype, HeroSection, SearchBar, TickerStrip, FeaturesSection, WhyAscendSection, StatsSection, CtaBand, Footer
- [x] Navbar design pass; auth pages (parchment + card)
- [x] 404 page; Toaster styling
- [x] PROJECT_PLAN.md updated; DESIGN_SYSTEM_BUILD.md created

Jobs, Company, Dashboard, Profile, Network/Messages/Feed pages continue to use the same design tokens and shared components; deeper per-page styling can be done in follow-up passes.

---

## 8. Preventing UI/UX regressions (theme vs. classes)

**Problem:** Components use Tailwind classes like `text-foreground`, `bg-background`, `border-input`, `focus:ring-ring`, `bg-accent`, `bg-secondary`. If those **color keys are missing** from `tailwind.config.ts` → `theme.extend.colors`, Tailwind does not generate the utilities and the UI breaks (invisible text, wrong backgrounds, missing focus rings).

**Required theme color keys (must stay in `tailwind.config.ts`):**

- `background`, `foreground` — for `bg-background`, `text-foreground`, `ring-offset-background`
- `input` — for `border-input`
- `ring` — for focus rings
- `primary` (DEFAULT + foreground), `accent` (DEFAULT + foreground), `muted` (DEFAULT + foreground)
- `secondary` — for dialog/sheet and other secondary surfaces

**Practice:**

1. When adding or copying shadcn/UI components that use semantic color classes, ensure each color name exists in `theme.extend.colors` (see `tailwind.config.ts` and the comment block there).
2. Do not remove the required keys listed above when refactoring the config.
3. A Cursor rule in `.cursor/rules/design-system-tailwind.mdc` reminds to keep theme and design system in sync when editing Tailwind config, `globals.css`, or UI/layout components.
