import { describe, expect, it } from 'vitest'
import { CARDS } from './game'
import {
  EVENTS, amortizedPayment, bossOptions, initialState, reducer, runForecast, shuffle, totals, ownership, cardDecision,
} from './engine'
import { EVENT_IDS } from './data'

const run = (s, ...actions) => actions.reduce(reducer, s)

function resolveAll(s, pick) {
  let x = s
  let guard = 0
  while (x.activeEvent && guard++ < 20) {
    const choices = EVENTS[x.activeEvent].choices(x).filter((c) => !c.disabled)
    const choice = pick ? pick(x.activeEvent, choices) : choices[0]
    x = reducer(x, { type: 'RESOLVE_EVENT', choice: choice.id })
  }
  return x
}

function act(s, action, pick) {
  return resolveAll(reducer(s, action), pick)
}

export const NAIVE = ['accept', 'ignore', 'reinvest', 'push', 'release', 'pass', 'net60', 'spread', 'reserve', 'walk', 'ok']
export const SMART = ['appeal', 'paydown', 'cut', 'pay', 'bank', 'pivot', 'bt', 'enforce', 'switch', 'lock', 'mediate', 'deposit', 'ok', 'accept', 'reroute']

export function playDemoA() {
  let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'all-debt' }, { type: 'START' }, { type: 'UNDERWRITE' })
  const naive = (id, choices) => choices.find((c) => NAIVE.includes(c.id)) || choices[0]
  for (const c of CARDS) s = act(s, { type: 'APPLY_CARD', cardId: c.id }, naive)
  for (const f of s.funding.filter((x) => x.status === 'conditional')) s = reducer(s, { type: 'RESOLVE_CONDITION', id: f.id, choice: 'accept' })
  s = act(s, { type: 'PLAY', card: 'partner', partnerId: 'p4' }, naive)
  const p = s.funding.find((f) => f.type === 'partner')
  if (p?.status === 'conditional') s = reducer(s, { type: 'RESOLVE_CONDITION', id: p.id, choice: 'handshake' })
  let guard = 0
  while (s.phase === 'fund' && guard++ < 10) {
    s = reducer(s, { type: 'START_BOSS' })
    if (s.phase === 'fund' && !s.activeEvent) s = reducer(s, { type: 'DRAW_EVENT' })
    s = resolveAll(s, naive)
  }
  return s.phase === 'boss' ? reducer(s, { type: 'BOSS', option: 'ride' }) : s
}

export function playDemoB() {
  let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' })
  for (const r of ['cco', 'cpa', 'marketing', 'sales']) s = reducer(s, { type: 'HIRE', role: r })
  s = reducer(s, { type: 'UNDERWRITE' })
  const smart = (id, choices) => choices.find((c) => SMART.includes(c.id)) || choices[0]
  for (const id of ['c1', 'c2', 'c3', 'c5']) s = act(s, { type: 'APPLY_CARD', cardId: id }, smart)
  s = act(s, { type: 'PLAY', card: 'term', amount: 60000 }, smart)
  s = act(s, { type: 'PLAY', card: 'vc', amount: 60000 }, smart)
  const vc = s.funding.find((f) => f.type === 'vc')
  s = reducer(s, { type: 'RESOLVE_CONDITION', id: vc.id, choice: 'accept' })
  s = act(s, { type: 'PLAY', card: 'cut' }, smart)
  let guard = 0
  while (s.phase === 'fund' && guard++ < 10) {
    s = reducer(s, { type: 'START_BOSS' })
    if (s.phase === 'fund' && !s.activeEvent) s = reducer(s, { type: 'DRAW_EVENT' })
    s = resolveAll(s, smart)
  }
  return s.phase === 'boss' ? reducer(s, { type: 'BOSS', option: 'refi' }) : s
}

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
})

describe('underwriting rules', () => {
  it('approves, conditions or declines by threshold', () => {
    const strong = run(initialState(), { type: 'LOAD_SCENARIO', id: 'all-debt' }, { type: 'START' })
    expect(cardDecision(strong, CARDS[0]).status).toBe('approved')
    const weak = run(initialState(), { type: 'PROFILE', patch: { fico: 560, utilization: 70, inquiries: 6 } }, { type: 'START' })
    expect(cardDecision(weak, CARDS[0]).status).toBe('declined')
  })
  it('requires underwriting before applying', () => {
    const s = run(initialState(), { type: 'START' }, { type: 'APPLY_CARD', cardId: 'c1' })
    expect(s.funding).toHaveLength(0)
  })
  it('caps aggregate 0% exposure at income', () => {
    let s = run(initialState(), { type: 'PROFILE', patch: { fico: 800, income: 30000, utilization: 5, inquiries: 0 } }, { type: 'START' }, { type: 'UNDERWRITE' })
    for (const c of CARDS) s = resolveAll(reducer(s, { type: 'APPLY_CARD', cardId: c.id }))
    const credit = s.funding.filter((f) => f.type === 'credit' && f.status !== 'declined').reduce((a, f) => a + f.amount, 0)
    expect(credit).toBeLessThanOrEqual(30000)
  })
})

describe('funding states', () => {
  it('tracks requested, committed and available separately', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' }, { type: 'UNDERWRITE' })
    s = reducer(s, { type: 'PLAY', card: 'term', amount: 60000 })
    let t = totals(s)
    expect(t.requested).toBe(60000)
    expect(t.committed).toBe(60000)
    expect(t.available).toBe(0)
    s = reducer(s, { type: 'PLAY', card: 'savings', amount: 10000 })
    expect(s.activeEvent).not.toBeNull()
    s = resolveAll(s)
    t = totals(s)
    expect(t.available).toBe(70000)
  })
  it('dilutes ownership and adds a board seat for big equity checks', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'diversified' }, { type: 'START' }, { type: 'PLAY', card: 'vc', amount: 400000 })
    const vc = s.funding.find((f) => f.type === 'vc')
    s = reducer(s, { type: 'RESOLVE_CONDITION', id: vc.id, choice: 'accept' })
    const o = ownership(s)
    expect(o.founder).toBeCloseTo(1 - 400000 / 2400000, 3)
    expect(o.seats).toBe(1)
  })
  it('does not reach the boss before the target is available', () => {
    const s = run(initialState(), { type: 'START' }, { type: 'START_BOSS' })
    expect(s.phase).toBe('fund')
  })
})

describe('forecast', () => {
  it('runs 18 months and refinancing beats riding out the cliff', () => {
    let s = run(initialState(), { type: 'LOAD_SCENARIO', id: 'all-debt' }, { type: 'START' }, { type: 'UNDERWRITE' })
    for (const c of CARDS) s = resolveAll(reducer(s, { type: 'APPLY_CARD', cardId: c.id }))
    const ride = runForecast(s, 'ride')
    const refi = runForecast(s, 'refi')
    expect(ride.months).toHaveLength(18)
    expect(refi.months[17].debt).toBeLessThan(ride.months[17].debt)
    expect(bossOptions(s).find((o) => o.id === 'refi').disabled).toBe(false)
  })
})

describe('demo scenarios', () => {
  it('Demo A reaches the target but fails the boss', () => {
    const s = playDemoA()
    expect(s.phase).toBe('results')
    expect(totals(s).available).toBeGreaterThanOrEqual(s.startup.target)
    expect(s.result.outcome).not.toBe('victory')
    expect(s.result.score).toBeLessThan(60)
  })
  it('Demo B wins', () => {
    const s = playDemoB()
    expect(s.phase).toBe('results')
    expect(s.result.outcome).toBe('victory')
    expect(s.result.score).toBeGreaterThanOrEqual(85)
  })
  it('is deterministic', () => {
    expect(playDemoA().result.score).toBe(playDemoA().result.score)
  })
})
