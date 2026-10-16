import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildReport, REPORT_TYPES, snapshotOf } from '../report'
import { renderReportBuffer } from './generate.jsx'
import { initialState, reducer } from '../engine'
import { playDemoA, playDemoB } from '../engine.test.js'

const now = new Date('2026-10-16T15:00:00Z')
const logo = resolve(__dirname, '../../public/fyv-logo.png')
const out = process.env.PDF_OUT
if (out) mkdirSync(out, { recursive: true })

describe('PDF reports', () => {
  it('renders the consolidated report for Demo B with snapshot comparison', async () => {
    const prev = snapshotOf(buildReport(reducer(initialState(), { type: 'START' }), { now }))
    const r = buildReport(playDemoB(), { now, previous: prev })
    const buf = await renderReportBuffer(r, 'all', logo)
    expect(buf.slice(0, 5).toString()).toBe('%PDF-')
    if (out) { mkdirSync(out, { recursive: true }); writeFileSync(`${out}/demo-b-all.pdf`, buf) }
  }, 60000)
  it('renders every report type, plus empty and extreme games', async () => {
    const empty = buildReport(reducer(initialState(), { type: 'START' }), { now })
    const extreme = buildReport(reducer({ ...initialState(), startup: { ...initialState().startup, target: 500000, monthlyBurn: 60000, founderPay: 15000, savings: 0 } }, { type: 'START' }), { now })
    const a = buildReport(playDemoA(), { now })
    for (const t of REPORT_TYPES) {
      const buf = await renderReportBuffer(a, t.id, logo)
      expect(buf.length).toBeGreaterThan(5000)
      if (out && t.id === 'health') writeFileSync(`${out}/demo-a-health.pdf`, buf)
    }
    for (const [name, r] of [['empty', empty], ['extreme', extreme]]) {
      const buf = await renderReportBuffer(r, 'all', logo)
      expect(buf.slice(0, 5).toString()).toBe('%PDF-')
      if (out) writeFileSync(`${out}/${name}-all.pdf`, buf)
    }
  }, 120000)
})
