import { describe, expect, it } from 'vitest'
import { initialState, reducer, termDecision, vcTerms, totals } from '../engine'
import { fundabilityFactors, fundabilityScore, DEFAULT_PROFILE } from '../game'
import { currentMission, eventChoicePreviews, moneyPicture, optionAction, optionPreview, RECOMMENDED_TARGET, resultInsights } from './gameSelectors'

const started = (patch = {}) => reducer(initialState({ startup: { ...initialState().startup, name: 'Test Co', ...patch } }), { type: 'START' })

describe('fundabilityFactors', () => {
  it('sums to the original fundability score', () => {
    const profiles = [DEFAULT_PROFILE, { ...DEFAULT_PROFILE, fico: 820, utilization: 5, inquiries: 0 }, { ...DEFAULT_PROFILE, fico: 520, utilization: 90, derogatory: true }]
    for (const p of profiles) {
      const sum = fundabilityFactors(p).reduce((a, f) => a + f.pts, 0)
      expect(fundabilityScore(p)).toBe(Math.round(Math.min(100, Math.max(0, sum))))
    }
  })
})

describe('moneyPicture', () => {
  it('never counts freed-up expenses as cash', () => {
    let s = started()
    s = reducer(s, { type: 'PLAY', card: 'cut' })
    const m = moneyPicture(s)
    expect(m.freed).toBeGreaterThan(0)
    expect(m.cash).toBe(0)
    expect(m.available).toBe(m.freed)
    expect(m.bySource.cut).toBeUndefined()
  })
  it('separates promised money from cash', () => {
    let s = reducer(started(), { type: 'UNDERWRITE' })
    s = reducer(s, { type: 'PLAY', card: 'term', amount: 50000 })
    const m = moneyPicture(s)
    if (s.funding[0].status === 'committed') {
      expect(m.pendingAmount).toBe(s.funding[0].amount)
      expect(m.cash).toBe(totals(s).cash)
    }
  })
})

describe('currentMission', () => {
  it('starts with the first funding decision and moves to offers', () => {
    let s = started()
    expect(currentMission(s).id).toBe('first')
    s = reducer(s, { type: 'PLAY', card: 'vc', amount: 50000 })
    expect(currentMission(s).id).toBe('offer')
  })
  it('asks for the cash crunch once funded with enough events', () => {
    const s = { ...started({ target: 25000, savings: 50000 }), resolvedEvents: [{}, {}, {}] }
    const funded = reducer(s, { type: 'PLAY', card: 'savings', amount: 25000 })
    expect(currentMission(funded.activeEvent ? { ...funded, activeEvent: null } : funded).id).toBe('boss')
  })
})

describe('optionPreview', () => {
  it('uses engine decisions for term loans and VC', () => {
    const s = reducer(started(), { type: 'UNDERWRITE' })
    const d = termDecision(s, 60000)
    expect(optionPreview(s, 'term', { amount: 60000 }).value).toBe(d.amount)
    const v = vcTerms(s, 50000)
    expect(optionPreview(s, 'vc', { amount: 50000 }).own).toContain((v.equityPct * 100).toFixed(1))
  })
  it('blocks credit before the simulated credit check', () => {
    expect(optionPreview(started(), 'term', { amount: 60000 }).blocked).toMatch(/credit check/)
  })
  it('maps options to engine actions', () => {
    expect(optionAction('credit', { cardId: 'c1' })).toEqual({ type: 'APPLY_CARD', cardId: 'c1' })
    expect(optionAction('savings', { amount: 5000 })).toEqual({ type: 'PLAY', card: 'savings', amount: 5000 })
  })
})

describe('eventChoicePreviews', () => {
  it('previews each choice with the real reducer without mutating state', () => {
    const s = { ...started(), activeEvent: 'surprise_expense', deck: [] }
    const before = JSON.stringify(s)
    const p = eventChoicePreviews(s)
    expect(p.length).toBe(3)
    expect(p.every((x) => x.after)).toBe(true)
    expect(JSON.stringify(s)).toBe(before)
  })
})

describe('misc', () => {
  it('keeps the recommended goal inside engine slider bounds', () => {
    for (const k of ['saas', 'ecom', 'services', 'events']) {
      const t = RECOMMENDED_TARGET(k)
      expect(t).toBeGreaterThanOrEqual(25000)
      expect(t).toBeLessThanOrEqual(500000)
    }
  })
  it('builds result insights from the score breakdown', () => {
    const r = { score: 50, breakdown: [{ id: 'a', label: 'A', pts: 25, max: 25 }, { id: 'b', label: 'B', pts: 2, max: 20 }], checks: [{ label: 'X', ok: false }] }
    const i = resultInsights(r, [{ label: 'Alt', score: 70, endCash: 1 }])
    expect(i.well[0].id).toBe('a')
    expect(i.trouble[0]).toBe('X')
    expect(i.tryNext.label).toBe('Alt')
  })
})
