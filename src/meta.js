import { INDUSTRIES } from './data'

export const AVATARS = [
  { id: 'rocket', icon: '🌱', name: 'Fresh Founder' },
  { id: 'bolt', icon: '⚡', name: 'The Hustler' },
  { id: 'brain', icon: '🧠', name: 'The Strategist' },
  { id: 'owl', icon: '🦉', name: 'Wise Owl' },
  { id: 'lion', icon: '🦁', name: 'Brave Lion' },
  { id: 'crown', icon: '👑', name: 'The Mogul' },
]

export const SKINS = [
  { id: 'classic', name: 'Sapphire', cut: 'cushion', c1: '#7dd3fc', c2: '#2563eb', cost: 0, grad: 'from-sky-400 to-blue-600' },
  { id: 'neon', name: 'Emerald', cut: 'emerald', c1: '#6ee7b7', c2: '#059669', cost: 100, grad: 'from-neon to-emerald-600' },
  { id: 'gold', name: 'Topaz', cut: 'trillion', c1: '#fde68a', c2: '#f97316', cost: 200, grad: 'from-gold to-orange-500' },
  { id: 'flame', name: 'Ruby', cut: 'heart', c1: '#fda4af', c2: '#be123c', cost: 300, grad: 'from-rose-400 to-rose-700' },
  { id: 'galaxy', name: 'Amethyst', cut: 'crystal', c1: '#f0abfc', c2: '#7c3aed', cost: 500, grad: 'from-fuchsia-400 to-purple-600' },
  { id: 'diamond', name: 'Diamond', cut: 'brilliant', c1: '#ffffff', c2: '#67e8f9', cost: 800, grad: 'from-white via-cyan-200 to-sky-400' },
]

export const MEDAL_POINTS = { common: 25, rare: 50, epic: 100, legendary: 250 }

const KEY = 'fyv-meta'
const DEFAULT = { points: 0, owned: ['classic'], skin: 'classic', avatar: 'rocket', streak: 0, bestStreak: 0, lastDay: null, dailyDone: null }

export function loadMeta() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return { ...DEFAULT } }
}
export const saveMeta = (m) => localStorage.setItem(KEY, JSON.stringify(m))

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function prevDay(key) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d - 1))
}

export function bumpStreak(m, today) {
  if (m.lastDay === today) return m
  const streak = m.lastDay === prevDay(today) ? m.streak + 1 : 1
  return { ...m, streak, bestStreak: Math.max(m.bestStreak, streak), lastDay: today }
}

function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export const dailyName = (today) => `Daily Challenge ${today}`

export function dailyConfig(today) {
  const h = hash(today)
  const ids = Object.keys(INDUSTRIES)
  const industry = ids[h % ids.length]
  return {
    startup: {
      name: dailyName(today),
      industry,
      target: 50000 + ((h >>> 3) % 9) * 25000,
      monthlyBurn: INDUSTRIES[industry].burn,
      founderPay: ((h >>> 7) % 5) * 1000,
      savings: ((h >>> 10) % 8) * 5000,
    },
    profile: {
      fico: 640 + ((h >>> 13) % 160),
      utilization: 5 + ((h >>> 17) % 40),
      inquiries: (h >>> 21) % 5,
      oldestYears: 2 + ((h >>> 24) % 10),
      openAccounts: 3 + ((h >>> 27) % 5),
      income: 60000 + ((h >>> 5) % 8) * 10000,
      derogatory: false,
    },
  }
}

export const runAward = (score, isDaily, streak) => score + (isDaily ? 100 : 0) + Math.min(streak, 10) * 10

export const EVENT_ICON = {
  loan_denied: '🏦', utilization: '💳', launch_delay: '⏳', surprise_expense: '🧾', strong_sales: '📈', cac_fail: '📉',
  promo_expire: '⏰', partner_withdraws: '🚪', vendor_hike: '🏷️', refi_offer: '🤝', dispute: '⚔️', big_customer: '🏆',
}
