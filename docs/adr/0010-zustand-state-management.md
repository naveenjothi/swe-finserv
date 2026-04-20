# ADR-0010: Zustand for State Management

_Status:_ Accepted

_Date:_ 2026-04-20

_Deciders:_ Engineering Team

## Context

SENTINEL's frontend has four distinct state concerns:

1. **Auth** — user session, role, JWT token
2. **Rules** — cached classification rules from IndexedDB with hourly polling (ADR-0008)
3. **Offline queue** — pending onboarding records awaiting sync (NFR-04, NFR-05)
4. **UI** — sidebar state, toast queue, modals

We need a state management solution that supports:

- Persistence to IndexedDB (offline records and rules must survive browser close)
- Independent store slices (not a single monolithic store)
- Minimal boilerplate — the app has ~8 pages, not a large SPA
- Compatibility with React Compiler (no unusual hook patterns)
- Selective subscriptions to avoid unnecessary re-renders

We evaluated three options:

| Option            | Bundle Size | Boilerplate | Persistence                              | React Compiler compat |
| ----------------- | ----------- | ----------- | ---------------------------------------- | --------------------- |
| **Zustand 5**     | ~1.2 KB     | Minimal     | `persist` middleware (pluggable storage) | ✅ Standard hooks     |
| **Redux Toolkit** | ~11 KB      | Moderate    | `redux-persist`                          | ✅ Standard hooks     |
| **Jotai**         | ~3.5 KB     | Minimal     | Custom atoms                             | ✅ Standard hooks     |

## Decision

We will use **Zustand 5** with the **slice pattern** — one independent `create()` store per concern (`authStore`, `rulesStore`, `offlineStore`, `uiStore`).

### Why Zustand over Redux Toolkit

- **80% less boilerplate** — no action creators, reducers, or action type constants
- **No provider wrapper** — stores are consumed directly via hook selectors, not a React context tree
- **Built-in `persist` middleware** — pluggable storage backends (localStorage, IndexedDB via async adapter) without a separate library
- **Smaller bundle** — 1.2 KB vs 11 KB; meaningful for the 150 KB total JS budget (§16 of frontend architecture)

### Why Zustand over Jotai

- Jotai's atom-based model is better suited for highly granular, deeply nested state (e.g. a complex editor)
- SENTINEL's state is slice-shaped (auth, rules, offline, UI) — Zustand's store-per-concern model maps more naturally
- Zustand's `persist` middleware is more mature for IndexedDB integration

### Persistence Configuration

```typescript
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

const idbStorage = createJSONStorage(() => ({
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
}));

export const useRulesStore = create(
  persist(
    (set) => ({
      /* ... */
    }),
    { name: "sentinel_rules_cache", storage: idbStorage },
  ),
);
```

## Consequences

### Positive

- Each store is independently testable — mock one store without touching others
- Selective subscriptions (`useRulesStore(s => s.version)`) minimise re-renders — compatible with React Compiler's automatic optimisation
- IndexedDB persistence for rules and offline queue satisfies NFR-05 (records must not be lost on page reload)
- Adding a new store for a future concern (e.g. notifications) requires no changes to existing stores

### Negative

- No built-in devtools comparable to Redux DevTools (mitigated by the `devtools` middleware, which adds basic Redux DevTools integration)
- No formal action/event history — debugging complex state transitions requires logging middleware
- Zustand's simplicity means less enforced structure — team must follow the slice convention by discipline
