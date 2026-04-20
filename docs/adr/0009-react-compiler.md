# ADR-0009: React 19 with React Compiler

_Status:_ Accepted

_Date:_ 2026-04-20

_Deciders:_ Engineering Team, CTO

## Context

SENTINEL's frontend needs a UI framework that supports:

- Offline-first PWA operation (NFR-04, NFR-05)
- Real-time classification feedback as the RM types (NFR-03 — < 200ms)
- Tablet-optimised rendering for iPad landscape (NFR-02)
- Complex form handling with 16 fields and validation (FR-01–FR-04)
- Role-gated views for three user personas

We evaluated three options:

| Option                      | Pros                                                                              | Cons                                                                 |
| --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **React 19 + Compiler**     | Mature ecosystem, automatic memoisation, concurrent features, largest talent pool | Larger initial bundle than Svelte/Solid                              |
| **Vue 3 + Composition API** | Good reactivity, smaller bundle                                                   | Smaller ecosystem for financial services tooling, fewer PWA patterns |
| **Svelte 5**                | Zero-runtime reactivity, smallest bundle                                          | Smaller ecosystem, fewer enterprise patterns, less hiring pool       |

## Decision

We will use **React 19** with **React Compiler** (babel-plugin-react-compiler) enabled in the Vite build pipeline.

### Why React Compiler

React Compiler (formerly React Forget) automatically inserts fine-grained memoisation at compile time. This eliminates:

- Manual `React.memo()` wrappers
- `useMemo()` / `useCallback()` boilerplate
- Performance bugs from forgotten memoisation in deeply nested component trees

For SENTINEL, where the onboarding form re-renders on every field change to update the real-time classification badge, automatic memoisation ensures the rules engine only re-executes when its inputs change — without developer intervention.

### Compiler Constraints

- Components must follow the **Rules of React**: pure render functions, side effects only in `useEffect`
- The `eslint-plugin-react-compiler` rule is set to `"error"` to enforce compatibility at lint time
- CI runs `npx react-compiler-healthcheck` to validate all components

## Consequences

### Positive

- Zero performance-tuning overhead for developers — the compiler handles it
- Real-time classification feedback is naturally fast without manual memoisation of the rules engine call
- React 19's concurrent features (transitions, suspense) enable smooth UI during heavy operations like CSV import preview
- Largest ecosystem of battle-tested libraries: React Hook Form, TanStack Query/Table, Testing Library, Playwright

### Negative

- React Compiler is a relatively new tool — edge cases may require workarounds
- All contributors must follow the Rules of React strictly — non-idiomatic patterns break compiler optimisation
- Slightly larger JS bundle than Svelte/Solid (mitigated by route-level code splitting)
