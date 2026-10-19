# Zikr Khatma implementation tasks

This checklist is the implementation order for adding shared Quran/Zikr Khatma
creation and membership with separate Quran and Zikr dashboards and progress
rules.

## Agreed behavior

- Quran Khatmas appear on the Quran dashboard; Zikr Khatmas appear on the Zikr
  dashboard.
- Both kinds use the existing Khatma identity, owner/member roles, invite code,
  and join flow.
- Creating a Zikr Khatma requires its name, Zikr phrase, and positive integer
  goal count.
- Each claim reserves an amount from the free count. For a goal of 1,000 with
  800 completed and 100 claimed, the dashboard shows 800 completed, 100
  pending, and 100 free.
- Members can change their pending amount, release it, or complete it in one
  step. Each member has one pending amount at a time and can claim another
  after completing it. Partial completion is out of scope for phase 1.
- Only completed amounts count toward finishing a Khatma. A Khatma completes
  when completed count reaches its goal.
- While active, the owner can correct the phrase and increase the goal. Goal
  decreases are rejected. Phrase and goal edits are rejected after completion.
- Existing Khatmas remain Quran Khatmas after migration.

## Implementation

### 1. Add type and Zikr progress to Supabase

- [x] Add a migration under `supabase/migrations/` that adds `khatma_type` to
  `public.khatmas`, allows `quran` and `zikr`, and defaults/backfills existing
  rows to `quran`.
- [x] Add Zikr configuration (phrase and positive goal)
  and per-member progress (pending and completed counts), linked to
  `khatmas(id)` with cascading deletes and constraints against negative counts.
- [x] Add member-only read policies for Zikr configuration and progress.
- [x] Add authenticated, atomic database functions for creating a Zikr
  Khatma, reading progress totals, setting/editing/releasing/completing a
  member's pending amount, and editing active Khatma configuration. Serialize
  mutations per Khatma and validate type, membership/ownership, lifecycle,
  amount bounds, no goal decreases, and completion rules in the database.
  Complete the shared Khatma only when completed total reaches the goal;
  pending amounts do not count. Block claim changes after completion and all
  phrase/goal edits after completion.
- [x] Add a database verification script or documented SQL checks for legacy
  backfill, RLS access, over-claim races, claim edit/release/complete, owner
  edits, and completion rules.

### 2. Extend shared Khatma identity and creation/join flows

- [x] Add `KhatmaType` to `src/data/contracts.ts`; include the type in Khatma
  summaries and completed Khatmas.
- [x] Update `getMyKhatmaRows` and the Khatma adapter/API to query by type as well
  as active/completed status. Keep the invite-code join function shared.
- [x] Keep current Quran creation behavior as the default and add a Zikr
  creation call that uses the atomic `create_zikr_khatma` RPC.
- [x] Update `src/app/(app)/create-khatma.tsx` to accept the selected type. For
  Zikr, collect and validate the phrase and goal, then create the shared Khatma
  and its Zikr configuration atomically or through a database function that
  rolls back both on failure.
- [ ] Keep `src/app/(app)/join-khatma.tsx` shared; the invite code must resolve
  to either Khatma type without requiring a type selector.

### 3. Add the Zikr feature API and realtime updates

- [ ] Add Zikr types and methods to `src/data/contracts.ts` and a
  `src/features/zikr/` API module for reading totals/own claim and performing
  claim, release, complete, and owner-edit actions.
- [ ] Add a Supabase Zikr adapter and wire it through
  `src/data/supabase/adapter.ts`.
- [ ] Extend `src/data/supabase/adapters/realtime.ts` to emit progress updates
  for Zikr claim/config changes using the existing Khatma subscription.
- [ ] Keep Zikr-specific rules out of `src/features/quran/` and the Quran
  progress table.

### 4. Build the Zikr dashboard and detail screen

- [ ] Replace the placeholder `src/app/(app)/zikr.tsx` with a dashboard that
  lists only the current user's active and completed Zikr Khatmas.
- [ ] Add Zikr create/join actions that use the shared routes and invite flow.
- [ ] Add a Zikr Khatma detail route that displays the phrase, goal, completed,
  pending, and free amounts; show the member's pending amount and controls to
  change, release, or complete it.
- [ ] Show owner-only phrase/goal editing while the Khatma is active. Allow
  goal increases and phrase correction; disable edits after completion.
- [ ] Refresh totals after actions and through realtime updates. Handle stale
  claims with a refreshable error state when a concurrent claim consumes the
  remaining free amount.
- [ ] Add Arabic and English strings for all new dashboard, creation, claim,
  edit, validation, loading, empty, and error states in `src/locales/ar.json`
  and `src/locales/en.json`.

### 5. Keep the Quran dashboard type-safe and verify the feature

- [ ] Filter the Quran dashboard's active and completed Khatma queries to
  `quran`; keep its current Juz screen and rules unchanged.
- [ ] Verify both types can be created by an owner, joined with the shared
  invite flow, and shown only on their matching dashboard.
- [ ] Verify two members cannot reserve more than the free count, even when
  claims arrive concurrently; verify edit/release returns the amount to free.
- [ ] Verify only the claimant can edit, release, or complete their pending
  amount; verify only the owner can edit phrase/goal.
- [ ] Verify completion requires completed total = goal, and active configuration
  edits obey the phrase/goal rules above.
- [ ] Run `npx expo lint` and `npx tsc --noEmit` after implementation.

## Not in phase 1

- Partial completion of a claim.
- Persistent claim history, reminders, custom phrase catalogs, or analytics.
