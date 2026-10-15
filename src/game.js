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
  { id: 'p1', name: 'Marcus Reed', title: 'Ex-Logistics Ops Director', fico: 792, capacity: 45000, split: 12, skills: ['Ops', 'Finance', 'Capital'], bio: 'Three seasoned business files, no late payments. Wants a profit share in exchange for guaranteeing credit.' },
  { id: 'p2', name: 'Priya Natarajan', title: 'Full-Stack Engineer, 2x Founder', fico: 765, capacity: 30000, split: 10, skills: ['Tech', 'Capital'], bio: 'Builds MVPs fast. Open to co-guaranteeing a credit line for a profit share.' },
  { id: 'p3', name: 'Dana Whitfield', title: 'B2B Sales Closer', fico: 731, capacity: 20000, split: 8, skills: ['Sales', 'Marketing'], bio: 'Brings pipeline plus a clean personal credit file.' },
  { id: 'p4', name: 'Luis Ortega', title: 'Retired CFO, Fortune 500', fico: 815, capacity: 60000, split: 15, skills: ['Finance', 'Capital', 'Ops'], bio: 'Ran corporate treasury for 25 years. Expects a written guarantee and partnership agreement.' },
  { id: 'p5', name: 'Aisha Bello', title: 'Growth Marketer', fico: 748, capacity: 25000, split: 8, skills: ['Marketing', 'Sales'], bio: 'Paid social and funnels. Credit partner with a clean file.' },
  { id: 'p6', name: 'Tom Becker', title: 'Real-Estate Investor', fico: 801, capacity: 50000, split: 14, skills: ['Capital', 'Finance'], bio: 'Owns 11 rental units. Wants his credit capacity working in a structured JV.' },
]

export const NEEDS = ['Sales', 'Tech', 'Ops', 'Marketing', 'Finance', 'Capital']

export function compatibility(partner, needs) {
  const overlap = partner.skills.filter((s) => needs.includes(s)).length
  return Math.round(clamp(48 + overlap * 14 + (partner.fico - 720) / 6, 30, 99))
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
