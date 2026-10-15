# SCREW VCs: The 0% Capital Architect & Target Raise Game

Dark-mode, gamified FinTech + co-founder matchmaking app (React + Tailwind CSS v4 + Vite).
Powered by NationwideBusinessFunding.com (Fractional Chief Capital Officer Platform).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Sections

1. **Sticky Target Raise Goal Bar & Scoreboard** (compacts on mobile scroll): $25K–$500K goal slider, animated progress bar, Pay Yourself First Salary Vault (20%), Equity Kept vs VCs, Victory button, and a player-set **Cash Buffer Runway**: click it to set starting buffer days (default 27) and monthly burn (Auto = 365 days at 100% funded, or a custom $/mo). Runway = starting days + unlocked capital ÷ daily burn; flashing red under 90 days, neon green at 365+.
2. **Experian-style AI Underwriting**: simulated fundability score (0–100) and tier from FICO, utilization, inquiries, age, accounts, income, derogatories.
3. **0% Card Stacking**: approval odds and limits come from the fundability score. Every application adds an inquiry.
4. **Multi-Entity Stacking**: form up to 4 LLCs, finish the fundability checklist, stack each one.
5. **AU Tradelines**: seasoned tradelines lower utilization and add age, which boosts the score. Their cost is subtracted from capital.
6. **JV Credit Partner Matchmaking**: swipe-style deck of credit partners (profit share, no equity) with compatibility scoring.

When net capital is at least the target, **VICTORY** opens the plan summary and dispatches it to a 22-person Slack War Room. You can optionally paste a Slack Incoming Webhook URL. Leave it blank for a demo dispatch.

Progress is saved to `localStorage`. All scoring logic is in `src/game.js`.

> Educational simulation. Scores, odds, and limits are illustrative and are not produced by Experian.
