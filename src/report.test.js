import { describe, expect, it } from 'vitest'
import { buildReport, compareSnapshots, REPORT_TYPES, snapshotOf, UNAVAILABLE } from './report'
import { answer, QUESTIONS } from './consultant'
import { initialState, reducer, totals } from './engine'
import { demoAToBoss, playDemoA, playDemoB } from './engine.test.js'

const now = new Date('2026-10-16T12:00:00Z')

describe('business intelligence report', () => {
  for (const [name, make] of [['Demo A', playDemoA], ['Demo B', playDemoB], ['Demo A at boss', demoAToBoss]]) {
    it(`${name}: every reconciliation check passes and numbers come from the engine`, () => {
      const s = make()
      const r = buildReport(s, { now })
      expect(r.reconciliation.every((c) => c.ok), JSON.stringify(r.reconciliation.filter((c) => !c.ok))).toBe(true)
      expect(r.kpis.available).toBe(totals(s).available)
      if (s.result) {
        expect(r.kpis.iq).toBe(s.result.score)
        expect(r.forecast.endCash).toBe(s.result.forecast.endCash)
        expect(r.iqFinal).toBe(true)
      }
      expect(r.forecast.months).toHaveLength(18)
      expect(r.commentary.length).toBeGreaterThan(2)
      expect(r.kpis.deployed).toBeNull()
    })
  }
  it('Demo B report shows a solvent forecast and Demo A shows exposure', () => {
    expect(buildReport(playDemoB(), { now }).forecast.insolventMonth).toBeNull()
    const a = buildReport(playDemoA(), { now })
    expect(a.kpis.promoExposure).toBeGreaterThan(0)
    expect(a.risks.some((x) => x.id === 'promo')).toBe(true)
  })
  it('works on a brand-new game with no funding (missing data)', () => {
    const s = reducer(initialState(), { type: 'START' })
    const r = buildReport(s, { now })
    expect(r.kpis.available).toBe(0)
    expect(r.sources).toEqual([])
    expect(r.iqFinal).toBe(false)
    expect(r.reconciliation.every((c) => c.ok)).toBe(true)
    expect(r.level).not.toBe(undefined)
    expect(UNAVAILABLE).toBe('Unavailable')
  })
  it('flags material changes between snapshots', () => {
    const before = snapshotOf(buildReport(reducer(initialState(), { type: 'START' }), { now }))
    const after = snapshotOf(buildReport(playDemoB(), { now }))
    const diff = compareSnapshots(before, after)
    expect(diff.find((d) => d.key === 'available').material).toBe(true)
    expect(compareSnapshots(after, after).some((d) => d.material)).toBe(false)
  })
  it('defines 10 report types and the consultant answers every question', () => {
    expect(REPORT_TYPES).toHaveLength(10)
    const r = buildReport(playDemoA(), { now })
    for (const [q] of QUESTIONS) expect(answer(r, q).length).toBeGreaterThan(0)
  })
})
