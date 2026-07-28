# Architecture Changelog — Progression Engine (Slice 1)

**Scope:** Runtime unlock engine, unlock requirement evaluation, locked-district
messaging, district income display, district progress (stars/completion/level),
completed district map states.

**Explicitly out of scope this slice:** business field renames, `maxLevel`
enforcement, `unlockLevel` gating, events/achievements/leaderboards/VIP (per
original instructions — reserved for later slices).

---

## Files changed

### New files

| File | Purpose |
|---|---|
| `src/utils/districtProgress.ts` | Pure functions deriving income, completion %, stars, "district level," and completed status **from a district's `Business[]`**. No new persisted state — everything here is computed on read from data that was already being saved. |

### Modified files

| File | Why it changed |
|---|---|
| `src/data/cityMapData.ts` | Added `UnlockRequirement` type and an `unlockRequirement` field per district (all three types — `net_worth`, `player_level`, `district_completed` — are represented). `isRoadActive()` signature changed to accept an `isUnlocked(id)` checker function instead of reading `district.unlocked` directly, so road "aliveness" can reflect live state. **The old `unlocked`/`completed` fields on `District` were not removed** — see Deprecated Fields below. |
| `src/context/DistrictContext.tsx` | Added a second persisted map (unlock status per district), plus `isDistrictUnlocked()` and `unlockDistrict()`. `setCurrentDistrict()` now checks the dynamic map instead of the static seed flag. Functions wrapped in `useCallback` for stable references (avoids re-firing consumer effects every render). |
| `src/App.tsx` | Added the evaluator `useEffect` (the actual progression engine) that re-checks every locked district's requirement whenever cash, level, or any district's business data changes. Added `currentDistrictProgress` / `districtProgressMap` (`useMemo`'d) and passed them to `AreaCard` / `CityMapScreen`. No existing handler (`handleUpgrade`, `handleReward`, `handleDoubleProfit`, the passive-income tick) was modified. |
| `src/components/AreaCard.tsx` | Added a "District Income: ₹X/min" line and a 5-star row under the existing progress bar. Two new required props (`districtIncome`, `districtStars`); everything else unchanged. |
| `src/components/citymap/CityMapScreen.tsx` | Accepts two new **optional** props, `isDistrictUnlocked` and `districtProgress`. If omitted, falls back to the old static-flag behavior — so it still works standalone/undropped-in. Locked-district toast now shows the actual requirement label instead of the word "locked." |
| `src/components/citymap/DistrictNode.tsx` | Accepts two new **optional** props, `unlocked` and `progress`, with the same static-flag fallback pattern. Completed districts now render a green checkmark badge (was a star icon) and a 5-star row under the name plaque. |

---

## New data structures

```ts
// src/data/cityMapData.ts
type UnlockRequirementType = 'always' | 'net_worth' | 'district_completed' | 'player_level';

interface UnlockRequirement {
  type: UnlockRequirementType;
  value?: number;       // cash threshold (net_worth) or level number (player_level)
  districtId?: string;  // required district id (district_completed)
  label: string;        // precomputed human-readable string for UI, e.g. "₹5,00,000 Net Worth"
}
```

```ts
// src/utils/districtProgress.ts
interface DistrictProgressSummary {
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  completed: boolean;
  stars: number;          // 0–5, floor(completionPercent / 20)
  districtLevel: number;  // sum of every business's level in the district
}
```

**New localStorage key:** `basti_unlocked_districts` — `Record<districtId, boolean>`,
seeded once from each district's static `unlocked` flag, then grown by
`unlockDistrict()`. Once a district is unlocked it stays unlocked (no
re-locking if net worth drops back down).

All other existing localStorage keys (`basti_businesses_by_district`,
`basti_stats`, `basti_avatar`, `basti_player_name`, `basti_current_district`)
are unchanged in shape and location.

---

## Deprecated fields

| Field | Status | Notes |
|---|---|---|
| `District.unlocked` (static) | **Soft-deprecated, not removed** | No longer the runtime source of truth — `DistrictContext.isDistrictUnlocked()` is. Still read as a **fallback seed value** (initial map seeding) and by any component that doesn't receive the new dynamic props. Safe to leave in place; do not delete without first confirming nothing still relies on the fallback path (`CityMapScreen`/`DistrictNode` both have one). |
| `District.completed` (static) | **Vestigial** | Always `false` in seed data and never written to. Live completion now comes from `DistrictProgressSummary.completed`. Low-risk to remove in a future slice, but left in place this time per "don't rename/remove fields unless necessary." |

Nothing on the `Business` type changed. No fields there are deprecated.

---

## Future migration notes

- **If/when `District.unlocked`/`completed` are removed:** first grep for the
  two fallback usages (`?? district.unlocked` in `CityMapScreen.tsx` and
  `DistrictNode.tsx`) and decide what those components should do if no
  dynamic props are passed — currently they degrade gracefully to "always
  locked/incomplete" rather than crashing, which is probably fine to keep
  as the safety default even after the static fields go away.
- **Net Worth currently equals `stats.cash`** (liquid cash only), not
  cash + asset value of owned businesses. This was a deliberate
  simplification to keep this slice contained. If "true" net worth
  (including business asset value) is wanted later, the only change needed
  is inside the `net_worth` branch of the evaluator effect in `App.tsx` —
  the requirement data shape doesn't need to change.
- **Completion rule is currently "all businesses purchased"** (Option A from
  the spec), implemented in `isDistrictCompleted()`. Switching to "all
  businesses max upgraded" (Option B) is a one-function change in
  `districtProgress.ts` — but requires a real `maxLevel` concept to exist
  on `Business` first (intentionally not added this slice).
- **Unlock requirement values are placeholder pacing**, not tuned/final
  numbers — expect these to change as real game economy balancing happens.
  They're centralized in one array in `cityMapData.ts`, so retuning is
  low-risk.
- **The evaluator effect re-runs roughly once per second** (it depends on
  `stats.cash`, which ticks every second from passive income). The check
  itself is cheap (≤11 districts, simple comparisons), so this wasn't
  optimized further — worth revisiting if the district count grows into
  the hundreds as mentioned in the long-term goal.
- **Toll Plaza has an `unlockRequirement` but no entry in
  `districtBusinesses.ts`** — it's a real node on the map with no economy
  data yet. If it becomes reachable before data is added, its district
  screen will render zero businesses rather than error (handled by
  `buildBusinessesForDistrict` returning `[]` for unknown ids), but it
  shouldn't be reachable yet since its `net_worth` threshold is high enough
  that other districts unlock first in practice.

---

**Verified before delivery:** `tsc --noEmit` clean, `npm run build` clean,
and a full code-level trace confirming buy/upgrade/income/reward
collection/district switching/persistence/navigation all still route
through the exact same functions as before this slice — this work only
added new effects and new *optional* props alongside them.

---
---

# Architecture Changelog — Progression Engine (Slice 2)

**Scope:** District summary card, configurable completion engine, one-time
completion rewards, City Map completion feedback (checkmark, badge, road
pulse), and a proper district details bottom sheet.

**Explicitly out of scope this slice (same as Slice 1):** business field
renames, `maxLevel` *enforcement*, `unlockLevel` gating, events/achievements/
leaderboards/VIP.

---

## Files changed

### New files

| File | Purpose |
|---|---|
| `src/config/progressionConfig.ts` | Every progression number/rule in one place — `completionRule`, `completionReward`, `defaultStars`, `starThresholdPercent`, `maxStars`, `unlockAnimationDurationMs`, `celebrationDurationMs`, `completionRoadPulseDurationMs`. Nothing progression-related should be a bare literal anywhere else. |
| `src/components/DistrictSummaryCard.tsx` | The compact card at the top of the district screen (name, stars, income, businesses owned, completion %, district level). Added as a **new, separate** component rather than folded into the existing `AreaCard`, specifically so `AreaCard` — already-working code from Slice 1 — didn't need to be touched at all this slice. |
| `src/components/citymap/DistrictDetailSheet.tsx` | The bottom sheet shown when any map node is tapped. Deliberately copies `ShopDetailSheet`'s visual pattern (same slide-up sheet, same card styling) rather than inventing a new one. |

### Modified files

| File | Why it changed |
|---|---|
| `src/types.ts` | Added `maxLevel?: number` to `Business` — **optional, unset everywhere, unenforced.** Exists only so the `'all_maxed'` completion rule is structurally real instead of a config option that can never do anything. No existing business gets a cap; upgrading is exactly as uncapped as before. |
| `src/utils/districtProgress.ts` | `isDistrictCompleted()` and `getDistrictStars()` now read their rule/thresholds from `progressionConfig` instead of hardcoded `20`/`5`/`b.level > 0`. Config defaults were chosen to match the old hardcoded values exactly, so default behavior is byte-for-byte identical to Slice 1 — this is a parameterization, not a behavior change. |
| `src/context/DistrictContext.tsx` | Added a second persisted map (`basti_rewarded_districts`) plus `isDistrictRewarded()` / `markDistrictRewarded()`, following the exact same pattern as the unlock map from Slice 1. This is the "only granted once" guard. |
| `src/App.tsx` | Added the completion-reward `useEffect` (see below), rendered `<DistrictSummaryCard>` above the existing `<AreaCard>`, added `celebratingDistrictId` transient state and the "District Completed!" celebration banner (copy-pasted structure from the existing level-up banner, not a new visual language). No existing handler was modified. |
| `src/components/citymap/CityMapScreen.tsx` | Replaced the Slice 1 toast with `<DistrictDetailSheet>`. Tapping a node now opens the sheet instead of navigating instantly for unlocked districts — navigation happens when the player taps "Enter District" inside the sheet. The `onOpenDistrict` callback contract passed in from `App.tsx` is unchanged; only *when* it fires moved from "on tap" to "on Enter District tap." Also passes `celebrating` through to `RoadPath` for the completion pulse. |
| `src/components/citymap/RoadPath.tsx` | Added an optional `celebrating` prop — a brief gold `<animate>` pulse over the existing road path when true. Nothing about the base road rendering changed. |
| `src/components/citymap/DistrictNode.tsx` | Added a small "COMPLETE" text chip above the existing star row for completed districts. Node size/shape untouched, per "do not enlarge map nodes." |

---

## How the completion engine works

1. **Rule selection** — `progressionConfig.completionRule` is either `'all_purchased'` (default) or `'all_maxed'`. `isDistrictCompleted()` in `districtProgress.ts` branches on it; nothing else needs to know which rule is active.
2. **Detection** — a `useEffect` in `App.tsx` runs whenever `businessesByDistrict` changes (i.e. any purchase/upgrade, anywhere). For every district, it checks `isDistrictCompleted()` against that district's current businesses.
3. **"Only once" guard** — before doing anything else, it checks `isDistrictRewarded(id)`. If true, it skips the district entirely — no re-celebration, no re-payment, not even on subsequent purchases in an already-completed district.
4. **Granting** — if completed and not yet rewarded, it calls `markDistrictRewarded(id)` **first** (this both persists immediately to `basti_rewarded_districts` and is itself idempotent — a no-op if called twice), then adds `progressionConfig.completionReward` to `stats.cash`, and triggers the celebration (confetti + banner + a brief road pulse on the City Map via `celebratingDistrictId`, auto-cleared after `progressionConfig.completionRoadPulseDurationMs`).
5. **Config-driven, not hardcoded** — the reward amount, the rule, and every animation duration involved all come from `progressionConfig.ts`. Changing the bonus from ₹5,00,000 to something else, or switching the rule to `'all_maxed'`, is a one-line edit there — no other file needs to change.

One deliberate edge case worth knowing: if a district was already fully purchased *before* this slice existed (e.g. from earlier testing), the very first load after this update will detect it as "completed, never rewarded" and pay the bonus retroactively, once. This is intentional — it's the same "grant on first detection" logic applying uniformly, not a special case.

---

## Deprecated / notable fields

Nothing from Slice 1's deprecation list changed. New this slice:

| Field | Status | Notes |
|---|---|---|
| `Business.maxLevel` | **New, optional, inert by default** | Only consulted by `isDistrictCompleted()` when `completionRule === 'all_maxed'`. Since no business sets it, that mode is currently unreachable — correct, not a bug (see Slice 1's notes on the same topic). |

---

## Future migration notes

- **To make `'all_maxed'` actually reachable:** a future slice needs to assign real `maxLevel` values to businesses in `districtBusinesses.ts` (or the generator in `buildBusinessesForDistrict`). At that point, flipping `progressionConfig.completionRule` to `'all_maxed'` is the only other change needed — the engine already handles both branches.
- **The District Details Panel changed the map's tap interaction model** — tapping now always opens a sheet rather than instantly navigating for unlocked districts. If a future design wants "tap unlocked = instant enter, tap locked = sheet," that's a small conditional inside `CityMapScreen.handleSelect`, not a structural change.
- **Reward and unlock tracking are two separate persisted maps** (`basti_unlocked_districts`, `basti_rewarded_districts`) rather than one combined "district state" blob. This was deliberate — they have different lifecycles (a district can be unlocked long before it's completed) — but if a future slice wants a single unified `districtState` store, both maps would fold into it without changing their read/write semantics.
- **`unlockAnimationDurationMs` exists in config but isn't wired to anything yet** — Slice 1 didn't implement a distinct "just unlocked" animation separate from the existing unlocked-node pulse ring. Flagging so it isn't mistaken for dead config; it's reserved for that future addition.

---

**Verified before delivery:** `tsc --noEmit` clean, `npm run build` clean.
Traced through: buying/upgrading (untouched code path), income (untouched
code path), unlocking (Slice 1's effect untouched, only a new effect added
alongside it), saving (new keys additive, old keys unchanged), district
switching (same callback, new trigger point), and the once-only reward
guard (mark-before-grant ordering + idempotent setter).
