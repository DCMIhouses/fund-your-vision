import { describe, expect, it } from 'vitest'
import { daysUntil, runwayClock, runwayDays, toDateInput } from './game'

const from = new Date(2026, 9, 15)

describe('runway clock', () => {
  it('breaks days into years, months, days', () => {
    expect(runwayClock(27, from)).toMatchObject({ years: 0, months: 0, days: 27 })
    expect(runwayClock(90, from)).toMatchObject({ years: 0, months: 2, days: 29 })
    expect(runwayClock(365, from)).toMatchObject({ years: 1, months: 0, days: 0 })
    expect(runwayClock(500, from)).toMatchObject({ years: 1, months: 4, days: 12 })
    expect(toDateInput(runwayClock(365, from).date)).toBe('2027-10-15')
  })
  it('converts a run-out date into days', () => {
    expect(daysUntil('2027-04-13', from)).toBe(180)
    expect(daysUntil('2020-01-01', from)).toBe(0)
  })
  it('adds available cash to the starting buffer', () => {
    expect(runwayDays(30000, 90, 10000)).toBe(180)
  })
})
