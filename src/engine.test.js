import { describe, expect, it } from 'vitest'
import { CARDS } from './game'
import {
  EVENTS, amortizedPayment, bossLimit, bossOptions, initialState, monthlyBurn, ownership, runForecast, shuffle, totals, cardDecision, liveProfile,
} from './engine'
import { EVENT_IDS } from './data'
import { ACHIEVEMENTS, achievementById, computeLevel } from './achievements'
import { gameReducer as reducer, validateRun } from './store'

const run = (s, ...actions) => actions.reduce(reducer, s)

export const NAIVE = ['accept', 'ignore', 'reinvest', 'push', 'release', 'pass', 'net60', 'spread', 'reserve', 'walk', 'ok']
export const SMART = ['appeal', 'paydown', 'cut', 'pay', 'bank', 'pivot', 'bt', 'enforce', 'switch', 'lock', 'mediate', 'deposit', 'ok', 'accept', 'reroute']
const picker = (list) => (id, choices) => choices.find((c) => list.includes(c.id)) || choices[0]

function resolveAll(s, pick = picker(SMART)) {
  let x = s
  for (let g = 0; x.activeEvent && g < 20; g++) {
    const choices = EVENTS[x.activeEvent].choices(x).filter((c) => !c.disabled)
    x = reducer(x, { type: 'RESOLVE_EVENT', choice: pick(x.activeEvent, choices).id })
  }
  return x
}
const act = (s, a, pick) => resolveAll(reducer(s, a), pick)

function toBoss(s, pick) {
  for (let g = 0; s.phase === 'fund' && g < 12; g++) {
    s = reducer(s, { type: 'START_BOSS' })
    if (s.phase === 'fund' && !s.activeEvent) s = reducer(s, { type: 'DRAW_EVENT' })
    s = resolveAll(s, pick)
  }
  return s
}

export function demoAToBoss() {
  const naive = picker(NAIVE)
  let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'all-debt' }, { type: 'START' }, { type: 'UNDERWRITE' })
  for (const c of CARDS) s = act(s, { type: 'APPLY_CARD', cardId: c.id }, naive)
  for (const f of s.funding.filter((x) => x.status === 'conditional')) s = reducer(s, { type: 'RESOLVE_CONDITION', id: f.id, choice: 'accept' })
  s = act(s, { type: 'PLAY', card: 'partner', partnerId: 'p4' }, naive)
  const p = s.funding.find((f) => f.type === 'partner')
  if (p?.status === 'conditional') s = reducer(s, { type: 'RESOLVE_CONDITION', id: p.id, choice: 'handshake' })
  return toBoss(s, naive)
}
export const playDemoA = () => reducer(demoAToBoss(), { type: 'BOSS' })

export function demoBToBoss(s0 = initialState()) {
  const smart = picker(SMART)
  let s = run(s0, { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' })
  for (const r of ['cco', 'cpa', 'marketing', 'sales']) s = reducer(s, { type: 'HIRE', role: r })
  s = reducer(s, { type: 'UNDERWRITE' })
  for (const id of ['c1', 'c2', 'c3', 'c5']) s = act(s, { type: 'APPLY_CARD', cardId: id }, smart)
  s = act(s, { type: 'PLAY', card: 'term', amount: 60000 }, smart)
  s = act(s, { type: 'PLAY', card: 'vc', amount: 60000 }, smart)
  s = reducer(s, { type: 'RESOLVE_CONDITION', id: s.funding.find((f) => f.type === 'vc').id, choice: 'accept' })
  s = act(s, { type: 'PLAY', card: 'cut' }, smart)
  return toBoss(s, smart)
}
export const playDemoB = () => run(demoBToBoss(), { type: 'BOSS_MOVE', option: 'refi' }, { type: 'BOSS_MOVE', option: 'cut' }, { type: 'BOSS' })

describe('math', () => {
  it('amortizes a loan', () => {
    expect(amortizedPayment(60000, 0.11, 36)).toBeCloseTo(1964.3, 0)
    expect(amortizedPayment(12000, 0, 12)).toBe(1000)
  })
  it('shuffles deterministically', () => {
    expect(shuffle(EVENT_IDS, 42)).toEqual(shuffle(EVENT_IDS, 42))
    expect(shuffle(EVENT_IDS, 42)).not.toEqual(shuffle(EVENT_IDS, 43))
    expect(new Set(shuffle(EVENT_IDS, 7)).size).toBe(12)
  })
  it('includes discretionary founder pay in burn', () => {
    const s = run(initialState(), { type: 'SETUP', patch: { monthlyBurn: 10000, founderPay: 5000 } })
    expect(monthlyBurn(s)).toBe(15000)
  })
})

describe('underwriting rules', () => {
  it('approves, conditions or declines by threshold', () => {
    const strong = run(initialState(), { type: 'LOAD_SCENARIO', id: 'all-debt' }, { type: 'START' })
    expect(cardDecision(strong, CARDS[0]).status).toBe('approved')
    const weak = run(initialState(), { type: 'PROFILE', patch: { fico: 560, utilization: 70, inquiries: 6 } }, { type: 'START' })
    expect(cardDecision(weak, CARDS[0]).status).toBe('declined')
  })
  it('requires underwriting before applying', () => {
    expect(run(initialState(), { type: 'START' }, { type: 'APPLY_CARD', cardId: 'c1' }).funding).toHaveLength(0)
  })
  it('caps aggregate 0% exposure at income', () => {
    let s = run(initialState(), { type: 'PROFILE', patch: { fico: 800, income: 30000, utilization: 5, inquiries: 0 } }, { type: 'START' }, { type: 'UNDERWRITE' })
    for (const c of CARDS) s = resolveAll(reducer(s, { type: 'APPLY_CARD', cardId: c.id }))
    expect(s.funding.filter((f) => f.type === 'credit' && f.status !== 'declined').reduce((a, f) => a + f.amount, 0)).toBeLessThanOrEqual(30000)
  })
  it('cards add hard inquiries, term loans do not', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' }, { type: 'UNDERWRITE' })
    const base = liveProfile(s).inquiries
    s = reducer(s, { type: 'PLAY', card: 'term', amount: 50000 })
    expect(liveProfile(s).inquiries).toBe(base)
    s = resolveAll(reducer(s, { type: 'APPLY_CARD', cardId: 'c1' }))
    expect(liveProfile(s).inquiries).toBe(base + 1)
  })
})

describe('funding states', () => {
  it('tracks requested, committed and available separately', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' }, { type: 'UNDERWRITE' }, { type: 'PLAY', card: 'term', amount: 60000 })
    let t = totals(s)
    expect([t.requested, t.committed, t.available]).toEqual([60000, 60000, 0])
    s = resolveAll(reducer(s, { type: 'PLAY', card: 'savings', amount: 10000 }))
    t = totals(s)
    expect(t.available).toBe(70000)
  })
  it('dilutes ownership and adds a board seat for big equity checks', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' }, { type: 'PLAY', card: 'vc', amount: 400000 })
    s = reducer(s, { type: 'RESOLVE_CONDITION', id: s.funding.find((f) => f.type === 'vc').id, choice: 'accept' })
    expect(ownership(s).founder).toBeCloseTo(1 - 400000 / 2400000, 3)
    expect(ownership(s).seats).toBe(1)
  })
  it('does not reach the boss before the target is available', () => {
    expect(run(initialState(), { type: 'START' }, { type: 'START_BOSS' }).phase).toBe('fund')
  })
})

describe('final boss', () => {
  it('limits turnaround moves (2, or 3 with a CPA) and supports undo', () => {
    const a = demoAToBoss()
    expect(a.phase).toBe('boss')
    expect(bossLimit(a)).toBe(2)
    let x = run(a, { type: 'BOSS_MOVE', option: 'cut' }, { type: 'BOSS_MOVE', option: 'founderpay' }, { type: 'BOSS_MOVE', option: 'paydown' })
    expect(x.bossMoves).toEqual(['cut', 'founderpay'])
    x = reducer(x, { type: 'BOSS_UNDO' })
    expect(x.bossMoves).toEqual(['cut'])
    expect(bossLimit(demoBToBoss())).toBe(3)
  })
  it('rejects ineligible moves and recalculates after each move', () => {
    const a = demoAToBoss()
    const s = run(a, { type: 'BOSS_MOVE', option: 'nope' })
    expect(s.bossMoves).toEqual([])
    const base = runForecast(a, [])
    const cut = runForecast(a, ['cut'])
    expect(cut.endCash).toBeGreaterThan(base.endCash)
    expect(runForecast(a, ['refi']).months[17].debt).toBeLessThan(base.months[17].debt)
  })
  it('bridge equity dilutes at the boss', () => {
    const b = demoBToBoss()
    const eq = bossOptions(b).find((o) => o.id === 'equity')
    const r = run(b, { type: 'BOSS_MOVE', option: 'equity' }, { type: 'BOSS' })
    if (!eq.disabled) expect(r.result.founderOwnership).toBeLessThan(ownership(b).founder)
  })
})

describe('demo scenarios', () => {
  it('Demo A reaches the target but does not win', () => {
    const s = playDemoA()
    expect(totals(s).available).toBeGreaterThanOrEqual(s.startup.target)
    expect(s.result.outcome).not.toBe('victory')
    expect(s.result.score).toBeLessThan(60)
  })
  it('Demo B wins', () => {
    const s = playDemoB()
    expect(s.result.outcome).toBe('victory')
    expect(s.result.score).toBeGreaterThanOrEqual(85)
  })
  it('is deterministic', () => {
    expect(playDemoA().result).toEqual(playDemoA().result)
  })
})

describe('levels', () => {
  it('progresses from Dreamer to Empire Builder on real milestones', () => {
    expect(computeLevel(initialState())).toBe(-1)
    expect(run(initialState(), { type: 'START' }).level).toBe(0)
    expect(playDemoA().level).toBe(3)
    expect(playDemoB().level).toBe(4)
  })
})

describe('achievements', () => {
  const b = playDemoB()
  const a = playDemoA()
  const has = (s, id) => s.achievements.includes(id)
  const fake = (patch) => ({ ...b, ...patch, result: { ...b.result, ...(patch.result || {}) } })
  const earns = (id, s) => expect(achievementById[id].test(s)).toBe(true)
  const misses = (id, s) => expect(achievementById[id].test(s)).toBe(false)

  it('awards each achievement once, in-game', () => {
    expect(new Set(b.achievements).size).toBe(b.achievements.length)
    for (const id of ['visionary', 'first_capital', 'halfway', 'equity_guardian', 'capital_architect', 'runway_warrior', 'capital_master', 'cashflow_whisperer']) expect(has(b, id)).toBe(true)
    expect(has(a, 'comeback')).toBe(true)
    expect(has(a, 'capital_master')).toBe(false)
  })
  it('credit strategist, deal maker, negotiator, dream team', () => {
    expect(has(b, 'credit_strategist')).toBe(true)
    let s = run(initialState(), { type: 'START' }, { type: 'HIRE', role: 'attorney' }, { type: 'PLAY', card: 'partner', partnerId: 'p1' })
    expect(has(s, 'deal_maker')).toBe(true)
    s = run(s, { type: 'PLAY', card: 'vc', amount: 50000 })
    s = reducer(s, { type: 'RESOLVE_CONDITION', id: s.funding.find((f) => f.type === 'vc').id, choice: 'accept' })
    expect(has(s, 'negotiator')).toBe(true)
    s = run(s, { type: 'HIRE', role: 'marketing' }, { type: 'HIRE', role: 'operator' })
    expect(has(s, 'dream_team')).toBe(true)
  })
  it('secret medals use real conditions', () => {
    earns('no_vc', fake({ result: { founderOwnership: 1 } }))
    misses('no_vc', b)
    earns('debt_slayer', fake({ result: { debtRemaining: 0 } }))
    misses('debt_slayer', b)
    earns('against_all_odds', fake({ resolvedEvents: [{ id: 'utilization' }, { id: 'launch_delay' }, { id: 'cac_fail' }] }))
    misses('against_all_odds', fake({ resolvedEvents: [{ id: 'strong_sales' }] }))
    earns('bootstrap_hero', fake({ funding: b.funding.filter((f) => ['savings', 'prepay', 'cut'].includes(f.type)) }))
    misses('bootstrap_hero', b)
    earns('turnaround_king', fake({ result: { baselineOutcome: 'partial' } }))
    misses('turnaround_king', fake({ result: { baselineOutcome: 'victory' } }))
    earns('partnership_pro', fake({ funding: [...b.funding, { type: 'partner', status: 'available', agreement: true, amount: 1 }] }))
    misses('partnership_pro', b)
    misses('cashflow_whisperer', fake({ result: { forecast: { ...b.result.forecast, minCash: -1 } } }))
    expect(ACHIEVEMENTS.filter((x) => x.secret)).toHaveLength(8)
  })
})

describe('tournament mode', () => {
  it('locks inputs, records actions and validates replays', () => {
    let s = run(initialState(), { type: 'SET_MODE', mode: 'tournament' })
    expect(s.scenarioId).toBe('t-ai')
    const fico = s.profile.fico
    s = run(s, { type: 'PROFILE', patch: { fico: 850 } }, { type: 'SETUP', patch: { savings: 999999, name: 'My Co' } })
    expect(s.profile.fico).toBe(fico)
    expect(s.startup.savings).toBe(20000)
    expect(s.startup.name).toBe('My Co')
    s = run(s, { type: 'START' }, { type: 'UNDERWRITE' })
    for (const c of CARDS) s = act(s, { type: 'APPLY_CARD', cardId: c.id })
    s = act(s, { type: 'PLAY', card: 'savings', amount: 20000 })
    s = act(s, { type: 'PLAY', card: 'term', amount: 60000 })
    for (const f of s.funding.filter((x) => x.status === 'conditional')) s = reducer(s, { type: 'RESOLVE_CONDITION', id: f.id, choice: 'accept' })
    s = act(s, { type: 'PLAY', card: 'cut' })
    s = act(s, { type: 'PLAY', card: 'prepay', amount: 50000 })
    s = toBoss(s)
    expect(s.phase).toBe('boss')
    s = run(s, { type: 'BOSS_MOVE', option: 'cut' }, { type: 'BOSS' })
    expect(s.actionLog.length).toBeGreaterThan(5)
    expect(validateRun(s).ok).toBe(true)
    expect(validateRun({ ...s, result: { ...s.result, score: s.result.score + 5 } }).ok).toBe(false)
    expect(validateRun(playDemoB()).ok).toBe(false)
  })
})

describe('credit partner qualification', () => {
  it('blocks partners that fail a check and allows qualified ones', () => {
    const bad = run(initialState(), { type: 'START' }, { type: 'PLAY', card: 'partner', partnerId: 'p9' })
    expect(bad.funding.some((f) => f.type === 'partner')).toBe(false)
    expect(bad.log[0].text).toMatch(/doesn't qualify/)
    const good = run(initialState(), { type: 'START' }, { type: 'PLAY', card: 'partner', partnerId: 'p1' })
    expect(good.funding.some((f) => f.partnerId === 'p1')).toBe(true)
  })
})
