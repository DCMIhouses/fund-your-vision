import { describe, expect, it } from 'vitest'
import { PAY, ready } from './payments'

describe('payments config', () => {
  it('treats blank details as not ready and ignores optional SWIFT', () => {
    expect(ready({ name: '', contact: 'a@b.com' })).toBe(false)
    expect(ready({ bankName: 'B', accountName: 'A', routing: '1', account: '2', bankAddress: 'X', swift: '' })).toBe(true)
  })
  it('ships without fake bank details', () => {
    expect(ready(PAY.zelle)).toBe(false)
    expect(ready(PAY.wire)).toBe(false)
  })
})
