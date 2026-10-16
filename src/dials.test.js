import { describe, expect, it } from 'vitest'
import { initialState, liveScore, monthlyBurn, reducer, runForecast } from './engine'
import { CARDS, estimatedLimit, runwayDays } from './game'

const start = (startup = {}, profile = {}, startDays = 27) =>
  reducer({ ...initialState({ startDays }), startup: { ...initialState().startup, ...startup }, profile: { ...initialState().profile, ...profile } }, { type: 'START' })
const metrics = (s) => {
  const f = runForecast(s)
  const score = liveScore(s)
  const credit = CARDS.reduce((a, c) => a + estimatedLimit(score, s.profile.income, c), 0)
  const savingsPlay = reducer(reducer(s, { type: 'UNDERWRITE' }), { type: 'PLAY', card: 'savings', amount: 1e9 }).funding.reduce((a, x) => a + x.amount, 0)
  return { burn: monthlyBurn(s), runway: runwayDays(0, s.startDays, monthlyBurn(s)), endCash: f.endCash, score, credit, savingsPlay, target: s.startup.target }
}
const finite = (m) => Object.values(m).every((v) => Number.isFinite(v))

// [name, min, max, how to apply]
const SETUP = [
  ['Funding target', 25000, 500000, (v) => start({ target: v })],
  ['Monthly burn', 2000, 60000, (v) => start({ monthlyBurn: v })],
  ['Founder pay', 0, 15000, (v) => start({ founderPay: v })],
  ['Personal savings', 0, 200000, (v) => start({ savings: v })],
  ['Runway days', 1, 3650, (v) => start({}, {}, v)],
  ['FICO', 500, 850, (v) => start({}, { fico: v })],
  ['Utilization', 0, 100, (v) => start({}, { utilization: v })],
  ['Inquiries', 0, 6, (v) => start({}, { inquiries: v })],
  ['Oldest account', 0, 7, (v) => start({}, { oldestYears: v })],
  ['Open accounts', 0, 5, (v) => start({}, { openAccounts: v })],
  ['Income', 0, 300000, (v) => start({}, { income: v })],
]

describe('every setup dial works at both ends', () => {
  for (const [name, min, max, apply] of SETUP) {
    it(`${name}: min and max produce valid, different game results`, () => {
      const a = metrics(apply(min)), b = metrics(apply(max))
      expect(finite(a) && finite(b)).toBe(true)
      expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
    })
  }
  it('profile dials change the score one step before their max (no dead zone at the end)', () => {
    expect(liveScore(start({}, { fico: 850 }))).toBeGreaterThan(liveScore(start({}, { fico: 830 })))
    for (const [k, max] of [['inquiries', 6], ['oldestYears', 7], ['openAccounts', 5], ['utilization', 76]]) {
      expect(liveScore(start({}, { [k]: max }))).not.toBe(liveScore(start({}, { [k]: max - 1 })))
    }
  })
})
