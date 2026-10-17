const ALLOWED = [/^https:\/\/fund-your-vision(-[a-z0-9-]+)?\.vercel\.app$/, /^https:\/\/dcmihouses\.github\.io$/, /^http:\/\/localhost:\d+$/]
const HELP = { assessment: 'Real funding eligibility assessment', partnership: 'Capital partnership discussion', cco: 'Fractional Chief Capital Officer consult' }
const EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,24}$/i
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map()

const clean = (v, max) => String(v ?? '').replace(/\p{Cc}/gu, ' ').trim().slice(0, max)
export const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function validateLead(body, now = Date.now()) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request.' }
  if (JSON.stringify(body).length > 6000) return { error: 'Request too large.' }
  if (clean(body.website, 200)) return { spam: true }
  const started = Number(body.startedAt)
  if (!started || now - started < 3000 || now - started > 6 * 3600 * 1000) return { spam: true }
  if (body.consentContact !== true) return { error: 'Please agree to be contacted.' }
  const lead = {
    name: clean(body.name, 80), email: clean(body.email, 120), phone: clean(body.phone, 30), business: clean(body.business, 80),
    help: HELP[body.help] ? body.help : 'assessment', message: clean(body.message, 1000), consentMarketing: body.consentMarketing === true,
  }
  if (!lead.name) return { error: 'Please enter your name.' }
  if (!EMAIL.test(lead.email)) return { error: 'Please enter a valid email.' }
  const g = body.game && typeof body.game === 'object' ? body.game : null
  if (g) lead.game = { business: clean(g.business, 80), industry: clean(g.industry, 60), target: Number(g.target) || 0, fundedPct: Number(g.fundedPct) || 0, score: g.score == null ? null : Number(g.score), outcome: clean(g.outcome, 20) }
  return { lead }
}

export function buildEmail(lead, meta = {}) {
  const rows = [['Name', lead.name], ['Email', lead.email], ['Phone', lead.phone || '-'], ['Business', lead.business || '-'], ['Wants', HELP[lead.help]], ['Message', lead.message || '-'],
    ['Contact consent', 'Yes'], ['Marketing consent', lead.consentMarketing ? 'Yes' : 'No']]
  if (lead.game) rows.push(['Game summary (simulated)', `${lead.game.business} · ${lead.game.industry} · goal $${lead.game.target.toLocaleString()} · ${lead.game.fundedPct}% funded${lead.game.score != null ? ` · Capital IQ ${lead.game.score}` : ''}${lead.game.outcome ? ` · ${lead.game.outcome}` : ''}`])
  rows.push(['Source', meta.origin || '-'], ['Received', new Date(meta.now || Date.now()).toISOString()])
  return {
    subject: `FYV lead: ${lead.name} (${HELP[lead.help]})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<h2>New FYV funding-help request</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table><p style="color:#666">Sent from the Fund Your Vision game. The game does not approve loans.</p>`,
  }
}

export function rateLimited(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  list.push(now)
  hits.set(ip, list)
  return list.length > MAX_PER_WINDOW
}

export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  if (ALLOWED.some((r) => r.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  if (origin && !ALLOWED.some((r) => r.test(origin))) return res.status(403).json({ ok: false, error: 'Origin not allowed.' })
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Try again in a few minutes.' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = null } }
  const v = validateLead(body)
  if (v.spam) return res.status(200).json({ ok: true })
  if (v.error) return res.status(400).json({ ok: false, error: v.error })
  const key = process.env.RESEND_API_KEY
  const to = process.env.LEAD_TO_EMAIL
  if (!key || !to) return res.status(503).json({ ok: false, error: 'Lead delivery is not set up yet.' })
  const mail = buildEmail(v.lead, { origin, now: Date.now() })
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.LEAD_FROM || 'FYV Leads <onboarding@resend.dev>', to: to.split(',').map((x) => x.trim()), reply_to: v.lead.email, ...mail }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.id) return res.status(502).json({ ok: false, error: 'Delivery failed. Please try again later.' })
    return res.status(200).json({ ok: true, id: j.id })
  } catch {
    return res.status(502).json({ ok: false, error: 'Delivery failed. Please try again later.' })
  }
}
