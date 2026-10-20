# Gate 0: audit, baseline and migration map

Source: GitHub `DCMIhouses/fund-your-vision` `main` at `9b9fbf6` (the `fund-your-vision-main.zip` named in the brief was not supplied; HEAD was used).

## Baseline (before any change)
- `npx vitest run`: 6 files, 92 tests passed.
- `npm run build`: OK (warning: `react-pdf` chunk ~1.6 MB, lazy-loaded).
- `npm run lint` (oxlint): clean.
- Linux note: the lockfile omits Linux native bindings; on Linux run `npm i --no-save @rolldown/binding-linux-x64-gnu@<rolldown version> @oxlint/binding-linux-x64-gnu@<oxlint version>`.

## Preservation inventory (unchanged semantics)
| Area | Module(s) |
|---|---|
| Reducer, funding rules, events (12), forecast, boss, scoring | `src/engine.js` |
| Achievements, levels, tournament replay `validateRun` | `src/store.js`, `src/achievements.js` |
| Industries (4), squad (6), finance cards (7), scenarios | `src/data.js` |
| Issuers (7), partners (9), fundability | `src/game.js` (pure refactor: `fundabilityFactors` exposes the same components; score identical, tested) |
| Reports (10 types, 18 sections), reconciliation, snapshots, PDF | `src/report.js`, `src/pdf/*` |
| Rule-based agents and consultant | `src/agents.js`, `src/consultant.js` |
| PixiJS 10-desk office | `src/office/*`, `src/components/AgentOffice.jsx` |
| Points, streak, daily challenge, founder ranks | `src/meta.js` |
| Persistence keys | `fyv-game-v3`, `fyv-trophies`, `fyv-partners`, `fyv-meta`, `fyv-leaderboard`, `fyv-report-snapshots`, `fyv-muted` |

## Defects and risks found
1. **Fake dispatch claim**: `Results.jsx` had "Send plan to 22-person War Room (simulated)" with a timer that showed "Sent". Removed (also in the legacy UI).
2. **Freed costs vs cash**: `totals(s).available` includes expense-reduction "freed" amounts. The engine is unchanged (it gates the boss and scoring); the new UI always shows cash separately and labels freed expenses "not cash".
3. **Hero promise mismatch**: legacy hero says "$10,000 to $1 Million"; engine slider is $25K to $500K. New UI only offers $25K to $500K.
4. **27-day buffer**: `startDays` defaults to 27 (2016 JPMorgan Chase Institute median). Kept as an adjustable, sourced assumption, not a "death clock".
5. **Pay control near gameplay**: moved to Profile & more → Business payments, separate from the game.
6. **Sound on by default**: now off by default (`fyv-muted` unset = muted).
7. **No backend**: there is no real CRM or Slack dispatch. The NBF path is an outbound link with explicit opt-in for any game fields; nothing is transmitted by the app.
8. **Approved credit counted as cash**: the engine assumes approved lines are fully drawn. The UI says so and shows the borrowed share.

## Migration map
| Legacy | New place |
|---|---|
| Setup + profile | Welcome → Quick Start (3 steps) + "Customize finances & founder profile" |
| Underwriting | Borrow door → simulated credit check (factor breakdown) |
| FinanceCards | Four funding doors → options → preview → confirm |
| CardStacking | Borrow → 0% cards → issuer list with live decisions |
| JVMatch + PartnerBinder | Investor/partner door → partner list; binder in My Business → Advanced |
| Squad | "Hire help" sheet and My Business → Team |
| Ledger | My Business (cash / runway / ownership, money in / out) and offer cards |
| EventModal | Event sheet with "See the details" (engine previews) and "Ask my consultant" |
| Boss | Cash crunch chapter |
| Results | Results screen + Blueprint CTA + consent-based NBF panel |
| Medals / Trophy room / Hangar | Profile & more |
| CommandCenter | Play (office + consultant), My Business (numbers), Blueprint (reports, PDFs, snapshots, Q&A) |
| PayPage | `#pay`, linked only from Profile & more |
| Whole legacy UI | `?ui=legacy` (switch back with `?ui=v2`) |
