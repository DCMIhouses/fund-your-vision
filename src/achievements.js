import { INDUSTRIES } from './data'
import { EVENTS, liveScore, ownership, totals } from './engine'

const win = (s) => s.result?.outcome === 'victory'
const negativeEvents = (s) => s.resolvedEvents.filter((e) => EVENTS[e.id]?.tone === 'hot').length
const reached = (s, pct) => totals(s).available >= s.startup.target * pct
const fundingTypes = (s) => new Set(s.funding.filter((f) => f.status === 'available').map((f) => f.type))
const documentedPartner = (s) => s.funding.some((f) => f.type === 'partner' && (f.status === 'committed' || f.status === 'available') && f.agreement)
const EXTERNAL = ['credit', 'term', 'vc', 'partner']

export const RARITY = {
  common: { label: 'Common', ring: 'from-slate-300 to-slate-500', text: 'text-slate-200' },
  rare: { label: 'Rare', ring: 'from-cyan to-blue-500', text: 'text-cyan' },
  epic: { label: 'Epic', ring: 'from-fuchsia-400 to-purple-600', text: 'text-fuchsia-300' },
  legendary: { label: 'Legendary', ring: 'from-gold to-orange-500', text: 'text-gold' },
}

const RAW = [
  { id: 'visionary', name: 'Visionary', icon: 'VI', rarity: 'common', desc: 'Create a startup.', test: (s) => s.phase !== 'setup' },
  { id: 'first_capital', name: 'First Capital', icon: '$1', rarity: 'common', desc: 'Secure your first available financing.', test: (s) => s.funding.some((f) => f.status === 'available' && f.type !== 'cut') },
  { id: 'halfway', name: 'Halfway Funded', icon: '50', rarity: 'common', desc: 'Reach 50% of your target in available capital.', test: (s) => reached(s, 0.5) },
  { id: 'credit_strategist', name: 'Credit Strategist', icon: 'CS', rarity: 'rare', desc: 'Hold debt financing with total debt at or below your target and fundability ≥ 65.', test: (s) => { const t = totals(s); return t.debt > 0 && t.debt <= s.startup.target && liveScore(s) >= 65 } },
  { id: 'deal_maker', name: 'Deal Maker', icon: 'DM', rarity: 'rare', desc: 'Complete a documented capital partnership.', test: documentedPartner },
  { id: 'dream_team', name: 'Dream Team', icon: 'DT', rarity: 'rare', desc: 'Recruit 3+ specialists, including 2 industry priorities.', test: (s) => s.squad.length >= 3 && s.squad.filter((r) => INDUSTRIES[s.startup.industry].priorities.includes(r)).length >= 2 },
  { id: 'equity_guardian', name: 'Equity Guardian', icon: 'EG', rarity: 'rare', desc: 'Reach your capital target while keeping at least 90% ownership.', test: (s) => reached(s, 1) && ownership(s).founder >= 0.9 },
  { id: 'capital_architect', name: 'Capital Architect', icon: 'CA', rarity: 'epic', desc: 'Combine 3+ different funding sources.', test: (s) => fundingTypes(s).size >= 3 },
  { id: 'comeback', name: 'Comeback Founder', icon: 'CB', rarity: 'epic', desc: 'Hit your target after surviving a major setback.', test: (s) => negativeEvents(s) >= 1 && reached(s, 1) },
  { id: 'runway_warrior', name: 'Runway Warrior', icon: 'RW', rarity: 'epic', desc: 'Survive the 18-month forecast.', test: (s) => !!s.result && !s.result.forecast.insolventMonth },
  { id: 'capital_master', name: 'Capital Master', icon: 'CM', rarity: 'legendary', desc: 'Score 90+ and achieve victory.', test: (s) => win(s) && s.result.score >= 90 },
  { id: 'no_vc', name: 'No VC Needed', icon: 'NV', rarity: 'epic', desc: 'Win without selling any equity.', test: (s) => win(s) && s.result.founderOwnership === 1 },
  { id: 'negotiator', name: 'The Negotiator', icon: 'NG', rarity: 'rare', desc: 'Accept an investor offer on attorney-negotiated terms.', test: (s) => s.funding.some((f) => f.type === 'vc' && f.negotiated && (f.status === 'committed' || f.status === 'available')) },
  { id: 'debt_slayer', name: 'Debt Slayer', icon: 'DS', rarity: 'legendary', desc: 'Retire all outstanding debt by month 18.', test: (s) => !!s.result && s.result.hadDebt && s.result.debtRemaining < 1 },
  { id: 'against_all_odds', name: 'Against All Odds', icon: 'AO', rarity: 'legendary', desc: 'Survive 3+ negative events and still win.', test: (s) => win(s) && negativeEvents(s) >= 3 },
  { id: 'bootstrap_hero', name: 'Bootstrap Hero', icon: 'BH', rarity: 'legendary', desc: 'Win with no external financing.', test: (s) => win(s) && !s.result.forecast.bridge && !s.funding.some((f) => EXTERNAL.includes(f.type) && f.status === 'available') },
  { id: 'turnaround_king', name: 'Turnaround King', icon: 'TK', rarity: 'epic', desc: 'Turn a failing boss forecast into a victory.', test: (s) => win(s) && s.result.baselineOutcome !== 'victory' },
  { id: 'partnership_pro', name: 'Partnership Pro', icon: 'PP', rarity: 'epic', desc: 'Win with a properly documented capital partner.', test: (s) => win(s) && s.funding.some((f) => f.type === 'partner' && f.status === 'available' && f.agreement) },
  { id: 'cashflow_whisperer', name: 'Cash-Flow Whisperer', icon: 'CW', rarity: 'epic', desc: 'Finish all 18 months with positive cash and no missed payments.', test: (s) => !!s.result && s.result.forecast.minCash > 0 },
]

const ART = {
  visionary: '🔭', first_capital: '💵', halfway: '🌓', credit_strategist: '📈', deal_maker: '🤝', dream_team: '🦸', equity_guardian: '🛡️',
  capital_architect: '🏛️', comeback: '🔥', runway_warrior: '🛫', capital_master: '👑', no_vc: '🚫', negotiator: '⚖️', debt_slayer: '🐉',
  against_all_odds: '🎲', bootstrap_hero: '🥾', turnaround_king: '🔄', partnership_pro: '📜', cashflow_whisperer: '🌊',
}
export const ACHIEVEMENTS = RAW.map((a) => ({ ...a, art: ART[a.id] }))

export const achievementById = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))

export function evaluateAchievements(s) {
  return ACHIEVEMENTS.filter((a) => a.test(s)).map((a) => a.id)
}

export const LEVELS = [
  { name: 'The Dreamer', goal: 'Create your startup and size its capital need.' },
  { name: 'The Starter', goal: 'Reach 25% of target with at least one funding source.' },
  { name: 'The Deal Maker', goal: 'Reach 50% and complete underwriting or a documented partnership.' },
  { name: 'The Architect', goal: 'Reach 100% with 2+ funding types and choose a repayment strategy at the boss.' },
  { name: 'The Builder', goal: 'Win the 18-month forecast.' },
]

export function computeLevel(s) {
  if (s.phase === 'setup') return -1
  let idx = 0
  if (reached(s, 0.25) && fundingTypes(s).size >= 1) idx = 1
  if (idx >= 1 && reached(s, 0.5) && (s.underwritten || documentedPartner(s))) idx = 2
  if (idx >= 2 && reached(s, 1) && fundingTypes(s).size >= 2 && (s.phase === 'boss' || s.phase === 'results')) idx = 3
  if (idx >= 3 && win(s)) idx = 4
  return idx
}
