export const fmt = (n) =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const BASE_RUNWAY_DAYS = 27
export const FULL_RUNWAY_DAYS = 365
export const SALARY_VAULT_PCT = 0.2

export const DEFAULT_PROFILE = {
  fico: 680,
  utilization: 35,
  inquiries: 2,
  oldestYears: 4,
  openAccounts: 5,
  totalLimits: 20000,
  income: 60000,
  derogatory: false,
}

export const CARDS = [
  { id: 'c1', name: 'Tier-1 Bank Business Rewards', type: 'Business', promo: 12, maxLimit: 25000, req: 72 },
  { id: 'c2', name: 'Big-4 Bank Business Cash', type: 'Business', promo: 12, maxLimit: 20000, req: 66 },
  { id: 'c3', name: 'Regional Bank Biz Platinum', type: 'Business', promo: 15, maxLimit: 15000, req: 60 },
  { id: 'c4', name: 'Credit Union Business Visa', type: 'Business', promo: 12, maxLimit: 12000, req: 55 },
  { id: 'c5', name: 'Personal Travel Signature', type: 'Personal', promo: 15, maxLimit: 18000, req: 63 },
  { id: 'c6', name: 'Personal Cash-Back Card', type: 'Personal', promo: 21, maxLimit: 10000, req: 50 },
  { id: 'c7', name: 'Fintech Charge Line', type: 'Business', promo: 6, maxLimit: 8000, req: 45 },
]

export const TRADELINES = [
  { id: 't1', bank: 'Legacy Bank Visa', age: 12, limit: 30000, cost: 1200 },
  { id: 't2', bank: 'National Mastercard', age: 8, limit: 20000, cost: 850 },
  { id: 't3', bank: 'Credit Union Platinum', age: 15, limit: 15000, cost: 950 },
  { id: 't4', bank: 'Department Store Card', age: 6, limit: 8000, cost: 400 },
  { id: 't5', bank: 'Charge Card (No Preset)', age: 20, limit: 25000, cost: 1500 },
  { id: 't6', bank: 'Rewards Visa Signature', age: 4, limit: 12000, cost: 450 },
]

export const ENTITY_TASKS = [
  { id: 'ein', label: 'EIN issued by IRS' },
  { id: 'bank', label: 'Business bank account' },
  { id: 'duns', label: 'D-U-N-S number' },
  { id: 'phone', label: '411-listed business phone' },
  { id: 'web', label: 'Domain email + website' },
  { id: 'addr', label: 'Commercial address / registered agent' },
]
export const MAX_ENTITIES = 4
export const ENTITY_BASE_CAPACITY = 40000

export const NEEDS = ['Sales', 'Tech', 'Ops', 'Marketing', 'Finance', 'Capital']

export const PARTNERS = [
  { id: 'p1', name: 'Marcus Reed', title: 'Ex-Logistics Ops Director', fico: 792, capacity: 65000, split: 15, skills: ['Ops', 'Finance', 'Capital'], bio: '3 seasoned entities, 0 late payments. Wants a profit-share, not your board.' },
  { id: 'p2', name: 'Priya Natarajan', title: 'Full-Stack Engineer, 2x Founder', fico: 765, capacity: 40000, split: 12, skills: ['Tech', 'Capital'], bio: 'Builds MVPs in 6 weeks. Will guarantee a 0% stack in exchange for rev-share.' },
  { id: 'p3', name: 'Dana Whitfield', title: 'B2B Sales Closer', fico: 731, capacity: 30000, split: 10, skills: ['Sales', 'Marketing'], bio: 'Closed $4.2M ARR last year. Brings pipeline + personal credit.' },
  { id: 'p4', name: 'Luis Ortega', title: 'Retired CFO, Fortune 500', fico: 815, capacity: 90000, split: 20, skills: ['Finance', 'Capital', 'Ops'], bio: 'Did the 0% leverage play at the corporate level for 25 years.' },
  { id: 'p5', name: 'Aisha Bello', title: 'Growth Marketer', fico: 748, capacity: 35000, split: 10, skills: ['Marketing', 'Sales'], bio: 'Paid social + funnels. Credit partner with a clean file.' },
  { id: 'p6', name: 'Tom Becker', title: 'Real-Estate Investor', fico: 801, capacity: 75000, split: 18, skills: ['Capital', 'Finance'], bio: 'Owns 11 doors. Looking for a JV where his credit works harder.' },
]

export function effectiveProfile(profile, aus, extraInquiries) {
  const auLimits = aus.reduce((s, t) => s + t.limit, 0)
  const balance = (profile.utilization / 100) * profile.totalLimits
  const utilization = profile.totalLimits + auLimits > 0
    ? (balance / (profile.totalLimits + auLimits)) * 100
    : profile.utilization
  const oldestYears = Math.max(profile.oldestYears, ...aus.map((t) => t.age))
  const utilGain = Math.max(0, profile.utilization - utilization)
  const ageGain = Math.max(0, oldestYears - profile.oldestYears)
  const auBoost = Math.round(Math.min(60, utilGain * 1.4 + ageGain * 2 + aus.length * 3))
  return {
    ...profile,
    fico: clamp(profile.fico + auBoost - extraInquiries * 4, 300, 850),
    utilization,
    oldestYears,
    openAccounts: profile.openAccounts + aus.length,
    inquiries: profile.inquiries + extraInquiries,
    auBoost,
  }
}

export function fundabilityScore(p) {
  const fico = clamp(((p.fico - 500) / 350) * 45, 0, 45)
  const util = p.utilization <= 10 ? 20 : p.utilization <= 30 ? 14 : p.utilization <= 50 ? 7 : 0
  const inq = Math.max(0, 15 - p.inquiries * 2.5)
  const age = Math.min(10, p.oldestYears * 1.5)
  const accts = Math.min(5, p.openAccounts)
  const income = Math.min(5, p.income / 30000)
  const derog = p.derogatory ? -25 : 0
  return Math.round(clamp(fico + util + inq + age + accts + income + derog, 0, 100))
}

export function tierFor(score) {
  if (score >= 85) return { tier: 'A+', label: 'Corporate America Mode', color: 'text-neon' }
  if (score >= 72) return { tier: 'A', label: 'Prime Stacker', color: 'text-neon' }
  if (score >= 60) return { tier: 'B', label: 'Fundable', color: 'text-cyan' }
  if (score >= 45) return { tier: 'C', label: 'Needs Tradelines', color: 'text-gold' }
  return { tier: 'D', label: 'Repair First', color: 'text-hot' }
}

export function approvalOdds(score, card) {
  const x = (score - card.req) / 6
  return Math.round(clamp(100 / (1 + Math.exp(-x)), 2, 97))
}

export function estimatedLimit(score, income, card) {
  const scoreFactor = clamp((score - 30) / 65, 0.15, 1)
  const incomeFactor = clamp(0.6 + income / 150000, 0.6, 1.2)
  return Math.round((card.maxLimit * scoreFactor * incomeFactor) / 500) * 500
}

export function runwayDays(unlocked, target) {
  const pct = target > 0 ? unlocked / target : 0
  return Math.round(BASE_RUNWAY_DAYS + clamp(pct, 0, 1) * (FULL_RUNWAY_DAYS - BASE_RUNWAY_DAYS))
}

export const LEVELS = [
  { xp: 0, name: 'Savings-Burning Peasant' },
  { xp: 150, name: 'Credit Apprentice' },
  { xp: 400, name: 'Card Stacker' },
  { xp: 800, name: 'Multi-Entity Operator' },
  { xp: 1300, name: '0% Capital Architect' },
  { xp: 2000, name: 'Fractional CCO' },
]

export function levelFor(xp) {
  let idx = 0
  LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i })
  const next = LEVELS[idx + 1]
  return { idx, ...LEVELS[idx], next, pct: next ? (xp - LEVELS[idx].xp) / (next.xp - LEVELS[idx].xp) : 1 }
}

export function compatibility(partner, needs) {
  const overlap = partner.skills.filter((s) => needs.includes(s)).length
  return Math.round(clamp(48 + overlap * 14 + (partner.fico - 720) / 6, 30, 99))
}

export function buildPlan({ target, net, unlocked, spend, sources, runway }) {
  const lines = [
    '*SCREW VCs: 0% Capital Plan CONFIRMED*',
    `Target Raise: ${fmt(target)} | Unlocked (net): ${fmt(net)} (${((net / target) * 100).toFixed(1)}%)`,
    `Gross: ${fmt(unlocked)} | AU tradeline spend: ${fmt(spend)}`,
    `Cash buffer runway: ${runway >= 365 ? '365+' : runway} days | Founder salary vault (20%): ${fmt(net * SALARY_VAULT_PCT)}`,
    'Equity kept: 100% | Board seats lost: 0',
    '',
    '*Capital stack*',
    ...sources.map((s) => `- ${s.label}: ${fmt(s.amount)}`),
    '',
    '_Powered by NationwideBusinessFunding.com, Fractional Chief Capital Officer Platform_',
  ]
  return lines.join('\n')
}
