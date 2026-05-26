# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Costa Sol** is a personal real-estate investment app for tracking, comparing, and analyzing properties on the Spanish Costa del Sol (Marbella, Estepona, etc.). Single-tenant (one shared login, no multi-user) — built for a couple managing a property portfolio together. The Swedish UI matches Swedish investors buying Spanish property; all monetary values are in EUR with optional SEK display toggle.

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173) — PWA service worker disabled here
npm run build        # tsc --noEmit && vite build → dist/ + service worker
npm run preview      # Preview production build incl. PWA at localhost:4173
npm run type-check   # tsc --noEmit only — run after every code change
npm test             # Vitest run-once
npm run test:watch   # Vitest watch mode
```

Tester finns för pure utils-funktioner i `src/utils/*.test.ts` (calc, mortgage). Lägg gärna till tester när du bygger nya utils — Vitest är konfigurerat med Node-miljö (inget jsdom, så fokus är pure functions, inte komponenter).

### Supabase deploys

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."   # personal access token (also set in ~/.zshrc)
npx supabase link --project-ref tipbwvxktbgywdyngqrz
npx supabase functions deploy <fn-name> --use-api   # --use-api skips Docker bundling
```

Edge Functions in `supabase/functions/`:

- `analyze-portfolio` — calls Anthropic Claude API with portfolio context, requires `ANTHROPIC_API_KEY` secret
- `import-ical` — parses .ics feeds from Airbnb/Booking, dedupes bookings via `(source_id, ical_uid)`
- `refresh-market-data` — fetches free market data (INE IPV + Inside Airbnb CSV from Storage bucket `market-data`)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — never set them as secrets manually (will be rejected).

### SQL migrations

Run manually in Supabase Dashboard → SQL Editor (no Supabase CLI db push setup). Files in `supabase/migrations/` are numbered and run in order. Note: `001_schema.sql` does not exist — original schema is in `supabase/schema.sql`.

## Architecture

### Stack

- **React 18 + TypeScript + Vite** with `vite-plugin-pwa` for offline-capable PWA
- **Supabase** for DB + Auth + Storage + Edge Functions (single project: `tipbwvxktbgywdyngqrz`)
- **Anthropic Claude API** via Edge Function (NEVER call from client — leaks key)
- **Tailwind v4** via `@tailwindcss/vite` — Use Tailwind everywhere, change from vanilla CSS to Tailwind.

### Auth model

- Single shared account (Alternative A — chosen explicitly over per-user auth). Both partners use same email+password.
- `AuthProvider` → `AuthGate` wraps `AppProvider`. Login screen shown until session exists.
- RLS policies are `for all to authenticated using (true) with check (true)` — any authenticated user sees all data.
- Migration `005_require_auth.sql` switched all policies from `anon` to `authenticated`. Do NOT re-introduce anon policies without explicit instruction.

### Data flow

```
Supabase tables  ←→  hooks/  ←→  pages/components/  →  utils/calc.ts (pure)
                                                     →  utils/export/* (PDF/CSV)
                                                     →  utils/mortgageCalc.ts (amortization)
                                                     →  utils/recurringGenerator.ts (expense templates)
```

**Hooks pattern:**

- `useApp` is the global state hub — holds properties/rentals/expenses, exposes `syncDispatch` that does optimistic UI + DB sync in one call.
- Feature-specific hooks (`useMortgages`, `useBudgets`, `useRecurringExpenses`, `useRentalSources`, `useMilestones`, `useAIInsights`) own their own data + CRUD. They `await load()` after writes for simplicity (some could be optimized but aren't bottlenecks yet).
- `useDisplayCurrency` and `useCurrency` are separate: the first is the EUR/SEK toggle context, the second fetches live rates from frankfurter.app.

**Seed data:**

- `SEED_PROPERTIES`/`SEED_RENTALS`/`SEED_EXPENSES` in `src/data/index.ts` are inserted ONCE per browser (gated by `localStorage` key `costa-sol:seeded-v1`). If user deletes all data, app does NOT re-seed — by design.

### Key cross-cutting concerns

**Tax constants are centralized.** `src/constants/tax.ts` has `TAX`, `BUYING_COSTS`, `OPERATING`, `MORTGAGE_DEFAULTS`. Both `calc.ts` and `Guide.tsx` read from this — update here when Spanish rules change, not in individual call sites.

**Generic Supabase mapper.** `src/lib/mappers.ts` exports `fromDb<T>()` and `toDb<T>()` that camelCase ↔ snake_case automatically. Used by all newer hooks (`useMortgages`, `useBudgets`, `useRecurringExpenses`, etc.). Older hooks (`useApp`) still have hand-written mappers — don't unify these unless asked.

**Export functions** in `src/utils/export/` use `assertNotEmpty()` from `_shared.ts` to block empty PDF/CSV generation. New exports must do the same.

**AI Edge Function uses prompt caching.** Portfolio context (the heavy JSON) is marked `cache_control: { type: 'ephemeral' }` — repeat queries within 5 min get ~85-90% cache hit. System prompt also cached. Token usage saved to `ai_insights` table including `tokens_cache_read`.

**Recurring expenses use deterministic IDs.** Generator creates expense IDs as `rec-{templateId}-{date}` so re-running `generateAll()` upserts (no duplicates). Don't change this naming convention without migrating existing data.

### Mobile / PWA

- `vite.config.ts` configures `VitePWA` with `registerType: 'autoUpdate'`. Service worker shows "Update available" banner via `PWAStatus.tsx`.
- Cache strategies: `NetworkFirst` for Supabase API (5s timeout, fallback to cache), `CacheFirst` for Google Fonts, `StaleWhileRevalidate` for currency rates.
- PNG icons `public/icon-192.png` and `public/icon-512.png` must exist for installability — `favicon.svg` alone is not enough on iOS.
- Mobile-specific CSS is at the bottom of `src/styles/pages.css` (search "Mobile & iPad polishing"). iPad breakpoint is `(min-width: 768px) and (max-width: 1024px)`.

### Deployment

- **Vercel** with auto-deploy from `main`. Env vars set in Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **PR-based workflow:** create feature branch → PR → merge to main → Vercel auto-deploys. Direct pushes to main are technically allowed but PRs are the norm.
- `ANTHROPIC_API_KEY` lives only in Supabase Edge Function secrets — never in Vercel, never in client code.

## Known design decisions

- **Calculator UNIT_PRESETS are hardcoded** (2bdr/3bdr/4bdr Costa del Sol archetypes). The Calculator is for hypothetical investments, independent of the user's actual portfolio. This was confusing to users — explanatory text added in page header.
- **Market data pipeline is best-effort.** Inside Airbnb only covers Málaga city, not Marbella/Estepona, so most areas need manual entry. The Edge Function silently returns null for missing data — by design. A weekly cron job exists but the user may have unscheduled it.
- **iCal default rate is per-source.** The .ics feed only contains dates, not prices — the configured `default_rate` × `nights` becomes the revenue. User can edit individual rentals manually after import.
- **Two open PRs at any time is normal.** Workflow is "commit small, PR often, merge fast." Don't be afraid to create a separate branch+PR for unrelated fixes within the same session.

## Architecture Rules

### File Structure — Always follow this pattern

Every new feature follows this structure (no exceptions):

- `src/hooks/use[Feature].ts` — data fetching, Supabase logic, state
- `src/components/[Feature]/[Feature].tsx` — UI component (no data fetching)
- `src/components/[Feature]/[Feature].css` — scoped styles
- `src/utils/[feature].utils.ts` — pure functions, transformations, helpers
- `src/types/[feature].types.ts` — TypeScript types/interfaces

### Component Rules

- Components must be "dumb" — they receive data via props, emit events via callbacks
- No direct Supabase calls inside components — always go through a custom hook
- Max component size: ~150 lines. If larger, split into subcomponents
- Each component does ONE thing (single responsibility)
- Always export types alongside the component

### Custom Hook Rules

- One hook per feature domain (e.g. `useProperties`, `useReminders`)
- `useApp` is the global hub — use `syncDispatch` for properties/rentals/expenses
- Feature hooks (useMortgages, useBudgets etc.) expose load() + direct CRUD functions
- New hooks follow feature hook pattern, not useApp
- Never put business logic in components — it belongs in hooks or utils

### Utils Rules

- Utils are pure functions only — no side effects, no Supabase calls
- Every util function must be independently testable
- Group by domain: `currency.utils.ts`, `date.utils.ts`, `property.utils.ts`
- Export individually (not as default) for tree-shaking

### TypeScript Rules

- No `any` — ever. Use `unknown` and narrow if needed
- All props interfaces named `[Component]Props`
- All Supabase row types live in `src/types/database.types.ts`
- Use discriminated unions for state (not boolean flags)

## Code Quality Standards

### Before writing any new code, ask:

1. Does this already exist in a util or hook I can reuse?
2. Can this logic be extracted into a pure function?
3. Would a new developer understand this in 30 seconds?

### Naming

- Files: kebab-case (`property-card.tsx`)
- Components: PascalCase (`PropertyCard`)
- Hooks: camelCase with `use` prefix (`useProperties`)
- Utils: camelCase (`formatCurrency`)
- Constants: UPPER_SNAKE_CASE (`MAX_PROPERTIES`)
- CSS classes: kebab-case (`.property-card__header`)

### Anti-patterns — never do these

- ❌ Inline logic in JSX (extract to variables or functions)
- ❌ Nested ternaries (use early returns or extracted components)
- ❌ Copy-pasting code (extract to util or component instead)
- ❌ Magic numbers/strings (use named constants)
- ❌ useEffect for data fetching (use custom hooks)
- ❌ Multiple useState for related data (use useReducer)

## Supabase Pattern (mandatory)

Every new Supabase feature must include:

1. SQL: table + RLS policy
2. TypeScript type in `database.types.ts`
   2b. Use fromDb<T>() / toDb<T>() from src/lib/mappers.ts for camelCase↔snake_case
3. Custom hook (`use[Feature].ts`)
4. Component that uses the hook

## When I ask you to build a new feature

1. Check existing utils/hooks for reuse opportunities first
2. Show me the file structure you'll create before writing code
3. Split into: types → utils → hook → component
4. Flag if any existing component/hook should be refactored to accommodate

## When refactoring

- Prefer extracting utils over rewriting
- Never break existing API contracts without flagging it
- Add a comment `// TODO: [reason]` if something is a known tradeoff

## Testing mindset (even without test files)

Write code as if it will be tested:

- Pure functions in utils (easy to unit test)
- Logic separated from UI
- No hidden dependencies (explicit params, not global state)
