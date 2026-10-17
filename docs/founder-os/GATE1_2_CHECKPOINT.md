# Gates 1 and 2 checkpoint

## Gate 1: design system, onboarding, shell
- Light Apple-style tokens (`.fos` in `src/index.css`, `bg-fos-*` utilities) with a dark-mode toggle; system font stack; 44px+ targets; focus rings; reduced-motion toggle.
- Welcome (`#/`): one question, Start / Sample / Continue, "Presented by Nationwide Business Funding" + "Explore real funding help", no sign-in.
- Quick Start (`#/new`): industry → name → goal ($25K–$500K, suggested = 12 × industry burn). Quick Play / Advanced / Tournament. Fictional credit profile and sample scenarios are optional.
- Shell: compact header (startup, chapter, 3 KPIs that expand), Play / My Business / Blueprint nav (bottom bar on mobile), Profile & more.
- Legacy UI kept behind `?ui=legacy`.

## Gate 2: game flow
- Play: PixiJS office as the main surface (compact mode), one mission card derived from engine state, offer decisions, Guidance Consultant line, recent activity, mobile Office / Advisors toggle.
- Four funding doors with a five-row comparison (available / repay / ownership / timing / risk) built from `termDecision`, `vcTerms`, `cardDecision`, `prepayMax`, partner checks. Choose → review → confirm dispatches the original actions, and the relevant advisor starts an illustrative handoff.
- Borrow path shows the simulated credit check step by step before applying.
- Events: engine-computed before/after previews per choice and a rule-based consultant pick; after choosing, a before/after card.
- Cash crunch: strategy tiles with forecast deltas, chart, checks, undo, lock in.
- My Business: cash vs promised vs freed (never cash), runway, ownership ring, money in/out, team, advanced (credit factors, issuer stack, reconciliation, partner binder).
- Blueprint: strength / risk / next decision, three PDFs + all 10 report types, snapshots, guided Q&A, NBF panel with explicit consent.
- Results: outcome, Capital IQ explained, went well / trouble / try next, tournament leaderboard (replay-verified), NBF panel.

## Tests
`npx vitest run`: 7 files, 103 tests (adds `src/shared/gameSelectors.test.js`). Lint clean, build OK.

## Not in this gate (Gate 3+)
- Production anime character art and the animation contract (current office keeps the procedural PixiJS workers).
- Real server-side lead delivery (needs an approved CRM and a backend).
- Reports and PDF visual redesign (Gate 4).
