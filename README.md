# FUND YOUR VISION (FYV): The Startup Funding Challenge

A dark-arcade startup funding strategy game built with React, Tailwind CSS v4 and Vite.
Powered by NationwideBusinessFunding.com (Fractional Chief Capital Officer Platform).

> Educational simulation. The game does not approve loans, create offers, or match users with verified capital partners. All underwriting is mock, rule-based logic.

## Launch the demo

```bash
npm install
npm run dev -- --host     # http://localhost:5173
# or a production build:
npm run build && npx vite preview --host --port 4173
npm test                  # engine tests (Vitest)
```

Progress is saved in `localStorage`. **Restart** (top bar) keeps the startup and replays it; **Reset all** (footer) wipes everything.

## Game loop (2–3 minutes)

1. **Setup**: name the startup, pick an industry, and set the target ($25K–$500K), monthly burn, savings and an illustrative credit profile. You can also load a deterministic demo scenario.
2. **Fund & Survive**: play financing power-up cards: 0% credit (issuer-by-issuer Card Stack), term loan, savings, VC/angel, capital partner (Matchmaking deck), customer prepayments and expense reduction. Recruit up to 4 squad specialists. Every 2nd funding action draws an event card (12-card seeded deck), and each event is one month. Committed funds land as months pass.
3. **Final Boss**: once available capital meets the target and you have survived 3 or more events, it is month 12. 0% promos expire and revenue comes in below plan. Pick refinance, cut burn, pay down or ride it out, then see an 18-month forecast.
4. **Results**: 100-point Startup Capital IQ score (funding 25, cash flow 25, repayment 20, governance 10, team 10, personal risk 10), outcome (victory / partial / failure), badge, share button, nickname-only leaderboard, the three NationwideBusinessFunding.com CTAs (scenario data added only with consent), and a simulated War Room dispatch.

## Live demo script

**Demo A: The All-Debt Sprint**. Click "Run AI Underwriting", apply to all 7 issuers, then accept any conditional offers. In Matchmaking, pass 3 profiles and propose to Luis Ortega, then choose "Proceed on a handshake". For events, pick the "keep moving" option (Accept / Ignore / Reinvest / Pass / Accept shorter promos). Start the boss and choose **Ride it out**.
→ 108% funded, but **PARTIAL SUCCESS, IQ 57 (Rebuild)**: it fails the promo-expiration check and the cash-reserve check.

**Demo B: The Capital Architect** (same founder). Recruit Capital Architect, CPA, Marketing and Sales, then run underwriting. Apply to Tier-1, Big-4, Regional and Personal Travel. Take a $60K term loan, set the angel slider to $60K and accept the term sheet, then use Expense Reduction. For events, pick the prudent option (Mediation / Reduce burn / Appeal). Start the boss and choose **Refinance**.
→ **VICTORY, IQ 96 (Capital Master)**.

Event order is seeded by the scenario (or by the startup name, industry and target in custom games), so the same choices always give the same result. Both scripts are covered by `src/engine.test.js`.

## Code map

- `src/engine.js`: deterministic simulation engine (reducer, underwriting rules, events, forecast, scoring). No React.
- `src/data.js`: industries, squad roles, finance cards, demo scenarios.
- `src/game.js`: formatting, issuer cards, partner profiles, fundability score.
- `src/components/`: UI.
- `src/sfx.js`: WebAudio sound effects, with a mute toggle in the top bar.

No API keys, webhooks or customer data are in the client. The leaderboard is per-device (`localStorage`). A shared, cross-device leaderboard would need a small backend.
