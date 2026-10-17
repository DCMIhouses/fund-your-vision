# Gate 3 — Character roster and animation spec

Art direction: the owner-supplied FYV anime character sheet and office illustration (cel-shaded, modern fintech office). The two extra people in the group image are intentionally excluded; desks 9 and 10 stay open as future hires.

## Roster (engine agent id → character)

| Agent id | Character | Title | Desk board activity | Key look |
|---|---|---|---|---|
| architect | Kaelen | Strategist | Simulating yield curves | Short dark-brown hair, dark-teal polo, khakis |
| underwriting | Lyra | Data Underwriter | Analyzing risk data | Coiled asymmetrical bob, smart-glass frames, cream blazer |
| vc | Vance | Negotiator | Drafting term sheets | Slicked-back black hair, navy suit, open collar |
| cfo | Maya | AI CFO | Calculating runway | Curly low ponytail with amber ribbon, emerald cardigan |
| risk | Evelyn | Compliance Officer | Reviewing entity structuring | Tight bun, tortoiseshell glasses, midnight-blue blazer |
| reporting | Marcus | Analyst | Compiling audits | Sandy wavy hair, heather-grey sweater over collar |
| guide | Naomi | Mentor | Consulting founders | Violet shoulder-length waves, lavender blouse, silver pins |
| growth | Sera | Matchmaker | Connecting partners | Ivory sharp bob, gold/azure eyes, burgundy turtleneck |

The roster lives in `src/office/characters.js`. Engine logic, agent rules and reducer actions are unchanged; only presentation (names, titles, portraits, colors) changed.

## What is in this gate

- Portrait crops of each character (`public/characters/*.webp`), shown in the advisor list, office detail panel and consultant cards.
- Desk nameplates show `Name · Title`; the default desk activity matches the board text above.
- Procedural office workers recolored to each character's skin, hair, outfit and accessories.
- `sprite: null` slot per character for a future animation atlas. While null, the procedural worker is used.

## Animation atlas to commission (one hero first — Kaelen)

Deliver per character a PixiJS/TexturePacker JSON spritesheet + PNG (power-of-two, max 2048²), 2× resolution, transparent background, 3/4 top-down view matching the office camera, character ~96 px tall at 1×, feet anchor at bottom-center.

| Loop | Frames | Facing |
|---|---|---|
| sit-idle | 4 | left, right |
| sit-type | 6 | left, right |
| sit-read | 4 | left, right |
| stand-up / sit-down | 4 each | left, right |
| walk | 8 | up, down, left, right |
| walk-carry (folder) | 8 | up, down, left, right |
| hand-off / receive | 6 each | left, right |
| react-celebrate | 6 | front |
| react-alert | 6 | front |

Naming: `<id>/<loop>_<facing>_<nn>` (e.g. `architect/walk-carry_left_03`). Once Kaelen is approved, the remaining seven follow the same sheet.
