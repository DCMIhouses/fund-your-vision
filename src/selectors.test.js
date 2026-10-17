import { describe, expect, it } from 'vitest'
import { fundingTiers } from './selectors'
import { initialState } from './engine'

const f = (type, status, amount) => ({ type, status, amount, requested: amount })

describe('fundingTiers', () => {
  it('separates pledged, committed, collected cash and saved costs', () => {
    const s = initialState({ funding: [f('vc', 'conditional', 50000), f('term', 'committed', 40000), f('savings', 'available', 10000), f('prepay', 'available', 5000), f('cut', 'available', 12000), f('credit', 'declined', 0)] })
    expect(fundingTiers(s)).toMatchObject({ pledged: 50000, committed: 40000, collected: 15000, saved: 12000, countsToTarget: 27000 })
  })
})
