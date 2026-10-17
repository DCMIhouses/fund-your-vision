import { afterEach, describe, expect, it, vi } from 'vitest'
import handler, { buildEmail, validateLead } from './lead.js'

const now = Date.now()
const good = { name: 'Ana', email: 'ana@example.com', help: 'cco', consentContact: true, startedAt: now - 10000 }
const mockRes = () => {
  const r = { code: 0, body: null, headers: {} }
  r.status = (c) => { r.code = c; return r }
  r.json = (b) => { r.body = b; return r }
  r.end = () => r
  r.setHeader = (k, v) => { r.headers[k] = v }
  return r
}
const req = (body, origin = 'https://fund-your-vision.vercel.app', ip = String(Math.random())) => ({ method: 'POST', headers: { origin, 'x-forwarded-for': ip }, body })

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('validateLead', () => {
  it('requires contact consent, name and a valid email', () => {
    expect(validateLead({ ...good, consentContact: false }, now).error).toMatch(/agree/)
    expect(validateLead({ ...good, name: ' ' }, now).error).toMatch(/name/)
    expect(validateLead({ ...good, email: 'nope' }, now).error).toMatch(/email/)
    expect(validateLead(good, now).lead).toMatchObject({ name: 'Ana', help: 'cco', consentMarketing: false })
  })
  it('flags honeypot and too-fast submissions as spam', () => {
    expect(validateLead({ ...good, website: 'x' }, now).spam).toBe(true)
    expect(validateLead({ ...good, startedAt: now - 500 }, now).spam).toBe(true)
  })
  it('escapes HTML in the email body', () => {
    const { html } = buildEmail({ ...validateLead(good, now).lead, message: '<script>x</script>' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('handler', () => {
  it('refuses when delivery is not configured', async () => {
    const res = mockRes()
    await handler(req(good), res)
    expect(res.code).toBe(503)
  })
  it('only reports success when Resend returns an id', async () => {
    vi.stubEnv('RESEND_API_KEY', 'k')
    vi.stubEnv('LEAD_TO_EMAIL', 'owner@example.com')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'abc' }) })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler(req(good), res)
    expect(res.body).toEqual({ ok: true, id: 'abc' })
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.to).toEqual(['owner@example.com'])
    expect(sent.reply_to).toBe('ana@example.com')
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: 'bad' }) })
    const res2 = mockRes()
    await handler(req(good), res2)
    expect(res2.code).toBe(502)
  })
  it('blocks unknown origins and rate-limits repeat senders', async () => {
    const res = mockRes()
    await handler(req(good, 'https://evil.example'), res)
    expect(res.code).toBe(403)
    let last
    for (let i = 0; i < 6; i++) { last = mockRes(); await handler(req({}, undefined, '9.9.9.9'), last) }
    expect(last.code).toBe(429)
  })
})
