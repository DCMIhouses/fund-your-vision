export const fmt = (n) =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US')

export const fmtK = (n) => (Math.abs(n) >= 1000 ? `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n) / 1000)}K` : fmt(n))

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const BASE_RUNWAY_DAYS = 27
export const FULL_RUNWAY_DAYS = 365
export const SALARY_VAULT_PCT = 0.2

export const DEFAULT_PROFILE = {
  fico: 700,
  utilization: 25,
  inquiries: 2,
  oldestYears: 6,
  openAccounts: 5,
  income: 90000,
  derogatory: false,
}

export const CARDS = [
  { id: 'c1', name: 'Tier-1 Bank Business Rewards', type: 'Business', promo: 12, maxLimit: 25000, req: 72 },
  { id: 'c2', name: 'Big-4 Bank Business Cash', type: 'Business', promo: 12, maxLimit: 20000, req: 66 },
  { id: 'c3', name: 'Regional Bank Biz Platinum', type: 'Business', promo: 15, maxLimit: 15000, req: 60 },
  { id: 'c4', name: 'Credit Union Business Visa', type: 'Business', promo: 12, maxLimit: 12000, req: 55 },
  { id: 'c5', name: 'Personal Travel Signature', type: 'Personal', promo: 15, maxLimit: 18000, req: 63 },
  { id: 'c6', name: 'Personal Cash-Back Card', type: 'Personal', promo: 18, maxLimit: 10000, req: 50 },
  { id: 'c7', name: 'Fintech Charge Line', type: 'Business', promo: 6, maxLimit: 8000, req: 45 },
]

export const PARTNERS = [
  { id: 'p1', face: '🧔🏾', util: 9, lates: 0, inq: 1, written: true, name: 'Marcus Reed', title: 'Ex-Logistics Ops Director', fico: 792, capacity: 45000, split: 12, skills: ['Ops', 'Finance', 'Capital'], bio: 'Three seasoned business files, no late payments. Wants a profit share in exchange for guaranteeing credit.' },
  { id: 'p2', face: '👩🏽‍💻', util: 14, lates: 0, inq: 2, written: true, name: 'Priya Natarajan', title: 'Full-Stack Engineer, 2x Founder', fico: 765, capacity: 30000, split: 10, skills: ['Tech', 'Capital'], bio: 'Builds MVPs fast. Open to co-guaranteeing a credit line for a profit share.' },
  { id: 'p3', face: '👩🏼‍💼', util: 22, lates: 0, inq: 2, written: true, name: 'Dana Whitfield', title: 'B2B Sales Closer', fico: 731, capacity: 20000, split: 8, skills: ['Sales', 'Marketing'], bio: 'Brings pipeline plus a clean personal credit file.' },
  { id: 'p4', face: '👨🏽‍🦳', util: 6, lates: 0, inq: 0, written: true, name: 'Luis Ortega', title: 'Retired CFO, Fortune 500', fico: 815, capacity: 60000, split: 15, skills: ['Finance', 'Capital', 'Ops'], bio: 'Ran corporate treasury for 25 years. Expects a written guarantee and partnership agreement.' },
  { id: 'p5', face: '👩🏿‍🎤', util: 18, lates: 0, inq: 1, written: true, name: 'Aisha Bello', title: 'Growth Marketer', fico: 748, capacity: 25000, split: 8, skills: ['Marketing', 'Sales'], bio: 'Paid social and funnels. Credit partner with a clean file.' },
  { id: 'p6', face: '🤠', util: 11, lates: 0, inq: 1, written: true, name: 'Tom Becker', title: 'Real-Estate Investor', fico: 801, capacity: 50000, split: 14, skills: ['Capital', 'Finance'], bio: 'Owns 11 rental units. Wants his credit capacity working in a structured JV.' },
  { id: 'p7', face: '🧑🏼', util: 64, lates: 1, inq: 6, written: true, name: 'Kevin Marsh', title: 'Weekend Day Trader', fico: 668, capacity: 40000, split: 20, skills: ['Capital'], bio: 'Big limits, but his cards are nearly maxed out and he applied for 6 new ones this year.' },
  { id: 'p8', face: '👩🏾‍🍳', util: 41, lates: 0, inq: 2, written: true, name: 'Rhonda Fields', title: 'Franchise Owner', fico: 712, capacity: 35000, split: 13, skills: ['Ops', 'Sales'], bio: 'Strong operator, but her credit use is high and her score is just under the bar.' },
  { id: 'p9', face: '😎', util: 78, lates: 3, inq: 8, written: false, name: 'Jay Patel', title: 'Crypto Influencer', fico: 640, capacity: 80000, split: 25, skills: ['Marketing', 'Capital'], bio: 'Promises huge limits on a handshake only and wants 25% of your profits.' },
]

export const PARTNER_RULES = [
  ['fico', 'Credit score 720+', (p) => p.fico >= 720, (p) => `${p.fico}`],
  ['util', 'Uses under 30% of their credit', (p) => p.util < 30, (p) => `${p.util}%`],
  ['lates', 'No late payments', (p) => p.lates === 0, (p) => `${p.lates} late`],
  ['inq', '3 or fewer new credit checks', (p) => p.inq <= 3, (p) => `${p.inq}`],
  ['split', 'Profit share 15% or less', (p) => p.split <= 15, (p) => `${p.split}%`],
  ['written', 'Will sign a written agreement', (p) => p.written, (p) => (p.written ? 'yes' : 'no')],
]
export const partnerChecks = (p) => PARTNER_RULES.map(([id, label, test, value]) => ({ id, label, ok: test(p), value: value(p) }))
export const partnerQualifies = (p) => partnerChecks(p).every((c) => c.ok)

export const NEEDS = ['Sales', 'Tech', 'Ops', 'Marketing', 'Finance', 'Capital']

export function compatibility(partner, needs) {
  const overlap = partner.skills.filter((s) => needs.includes(s)).length
  return Math.round(clamp(48 + overlap * 14 + (partner.fico - 720) / 6, 30, 99))
}

export function fundabilityFactors(p) {
  return [
    { id: 'fico', label: 'Personal credit score', pts: clamp(((p.fico - 500) / 350) * 45, 0, 45), max: 45 },
    { id: 'util', label: 'How much of your credit you use', pts: p.utilization <= 10 ? 20 : p.utilization <= 30 ? 14 : p.utilization <= 50 ? 7 : p.utilization <= 75 ? 3 : 0, max: 20 },
    { id: 'inq', label: 'Recent credit applications', pts: Math.max(0, 15 - p.inquiries * 2.5), max: 15 },
    { id: 'age', label: 'Age of your credit history', pts: Math.min(10, p.oldestYears * 1.5), max: 10 },
    { id: 'accts', label: 'Open accounts (credit mix)', pts: Math.min(5, p.openAccounts), max: 5 },
    { id: 'income', label: 'Income', pts: Math.min(5, p.income / 30000), max: 5 },
    { id: 'derog', label: 'Late payments or collections', pts: p.derogatory ? -25 : 0, max: 0 },
  ]
}

export function fundabilityScore(p) {
  return Math.round(clamp(fundabilityFactors(p).reduce((a, f) => a + f.pts, 0), 0, 100))
}

export function tierFor(score) {
  if (score >= 85) return { tier: 'A+', label: 'Prime', color: 'text-neon' }
  if (score >= 72) return { tier: 'A', label: 'Strong', color: 'text-neon' }
  if (score >= 60) return { tier: 'B', label: 'Fundable', color: 'text-cyan' }
  if (score >= 45) return { tier: 'C', label: 'Limited', color: 'text-gold' }
  return { tier: 'D', label: 'Repair First', color: 'text-hot' }
}

export function estimatedLimit(score, income, card) {
  const scoreFactor = clamp((score - 30) / 65, 0.15, 1)
  const incomeFactor = clamp(0.6 + income / 150000, 0.6, 1.2)
  return Math.round((card.maxLimit * scoreFactor * incomeFactor) / 500) * 500
}

export function runwayDays(cash, startDays, monthlyBurn) {
  const daily = monthlyBurn / 30
  return Math.round(startDays + (daily > 0 ? Math.max(0, cash) / daily : 0))
}

const DAY_MS = 86400000
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function addDays(from, days) {
  const d = startOfDay(from)
  d.setDate(d.getDate() + days)
  return d
}

export function daysUntil(dateStr, from = new Date()) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.max(0, Math.round((new Date(y, m - 1, d) - startOfDay(from)) / DAY_MS))
}

export const toDateInput = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function runwayClock(totalDays, from = new Date()) {
  const start = startOfDay(from)
  const end = addDays(start, totalDays)
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { years, months, days, date: end }
}
