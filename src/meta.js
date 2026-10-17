import { INDUSTRIES } from './data'

export const AVATARS = [
  { id: 'rocket', level: 1, need: 0, icon: '🌱', name: 'Fresh Founder' },
  { id: 'bolt', level: 2, need: 2, icon: '⚡', name: 'The Hustler' },
  { id: 'brain', level: 3, need: 5, icon: '🧠', name: 'The Strategist' },
  { id: 'deal', level: 4, need: 8, icon: '🤝', name: 'The Dealmaker' },
  { id: 'tycoon', level: 5, need: 12, icon: '💼', name: 'The Tycoon' },
  { id: 'crown', level: 6, need: 16, icon: '👑', name: 'The Mogul' },
]
export const medalCount = (collection) => Object.keys(collection || {}).length
export const topRank = (count) => [...AVATARS].reverse().find((r) => count >= r.need)
export const activeRank = (meta, count) => {
  const r = AVATARS.find((a) => a.id === meta.avatar)
  return r && count >= r.need ? r : topRank(count)
}

export const SKINS = [
  { id: 'classic', lvl: 1, name: 'Fresh Founder', gem: 'Topaz', c1: '#f5c08a', c2: '#a0522d', grad: 'from-orange-300 to-amber-800' },
  { id: 'neon', lvl: 2, name: 'The Hustler', gem: 'Pearl', c1: '#f1f5f9', c2: '#64748b', grad: 'from-slate-100 to-slate-500' },
  { id: 'gold', lvl: 3, name: 'The Strategist', gem: 'Citrine', c1: '#fde68a', c2: '#d97706', grad: 'from-gold to-orange-500' },
  { id: 'flame', lvl: 4, name: 'The Dealmaker', gem: 'Emerald', c1: '#6ee7b7', c2: '#059669', grad: 'from-neon to-emerald-600' },
  { id: 'galaxy', lvl: 5, name: 'The Tycoon', gem: 'Sapphire', c1: '#93c5fd', c2: '#1d4ed8', grad: 'from-sky-300 to-blue-700' },
  { id: 'diamond', lvl: 6, name: 'The Mogul', gem: 'Amethyst', c1: '#f5d0fe', c2: '#7c3aed', grad: 'from-fuchsia-200 via-purple-400 to-violet-700' },
]
export const gemForLevel = (level) => SKINS[level - 1] || SKINS[0]
export const rankGem = (meta, count) => gemForLevel(activeRank(meta, count).level)

export const MEDAL_POINTS = { common: 25, rare: 50, epic: 100, legendary: 250 }

const KEY = 'fyv-meta'
const DEFAULT = { points: 0, avatar: 'rocket', streak: 0, bestStreak: 0, lastDay: null, dailyDone: null }

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
