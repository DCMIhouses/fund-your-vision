import { useMemo, useState } from 'react'
import { fmt } from '../game'

const WAR_ROOM = [
  'Fractional CCO', 'Lead Underwriter', 'Credit Analyst', 'Tradeline Desk', 'Entity Formation', 'Business Credit Builder',
  'Bank Relations', 'Card Stacking Ops', 'Compliance', 'CPA / Tax', 'Bookkeeping', 'Cash-Flow Coach',
  'JV Matchmaker', 'Partner Success', 'Legal (Op. Agreements)', 'Funding Coordinator', 'Lender Liaison', 'Utilization Manager',
  'Payoff Strategist', 'Growth Advisor', 'Founder Coach', 'Client Success',
]

export default function Victory({ open, onClose, plan, sources, net, onDispatched }) {
  const [webhook, setWebhook] = useState('')
  const [status, setStatus] = useState('idle')
  const [copied, setCopied] = useState(false)

  const confetti = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    left: (i * 37.7) % 100,
    delay: ((i * 13) % 15) / 10,
    dur: 2.5 + ((i * 7) % 25) / 10,
    color: ['#39ff88', '#22d3ee', '#fbbf24', '#ff2e63'][i % 4],
  })), [])

  if (!open) return null

  const dispatch = async () => {
    setStatus('sending')
    try {
      if (webhook.trim()) {
        await fetch(webhook.trim(), { method: 'POST', mode: 'no-cors', body: JSON.stringify({ text: plan }) })
      } else {
        await new Promise((r) => setTimeout(r, 1800))
      }
      setStatus('sent')
      onDispatched()
    } catch {
      setStatus('error')
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(plan)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      {confetti.map((c, i) => (
        <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
      ))}
      <div onClick={(e) => e.stopPropagation()}
        className="toast-in relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-neon/60 bg-panel p-6 shadow-[0_0_60px_rgba(57,255,136,.35)]">
        <button onClick={onClose} className="absolute right-4 top-3 text-xl text-slate-500 hover:text-white">×</button>
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-neon">100% Funded · 0 VCs Required</div>
          <h2 className="mt-1 text-3xl font-black uppercase text-white">Victory</h2>
          <p className="mt-1 text-sm text-slate-400">You raised <span className="font-mono font-bold text-neon">{fmt(net)}</span>, kept 100% of your equity, and paid yourself first.</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Capital Stack</div>
            <div className="mt-2 space-y-1.5">
              {sources.map((s) => (
                <div key={s.label} className="flex justify-between rounded-lg border border-edge bg-ink/60 px-3 py-1.5 text-sm">
                  <span className="text-slate-300">{s.label}</span>
                  <span className={`font-mono font-bold ${s.amount < 0 ? 'text-hot' : 'text-neon'}`}>{fmt(s.amount)}</span>
                </div>
              ))}
            </div>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-edge bg-ink p-3 font-mono text-[10px] text-slate-400">{plan}</pre>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">#war-room · 22 members</div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {WAR_ROOM.map((r, i) => (
                <div key={r} className="flex items-center gap-1.5 rounded bg-ink/60 px-2 py-1 text-[10px] text-slate-300">
                  <span className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${status === 'sent' ? 'bg-neon' : status === 'sending' ? 'bg-gold animate-pulse' : 'bg-slate-600'}`}
                    style={{ transitionDelay: `${i * 60}ms` }} />
                  <span className="truncate">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-edge bg-ink/60 p-3">
          <label className="text-[11px] uppercase tracking-widest text-slate-500" htmlFor="webhook">Slack Incoming Webhook URL (optional)</label>
          <input id="webhook" value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/…  (leave blank for demo dispatch)"
            className="mt-1 w-full rounded-lg border border-edge bg-ink px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:border-neon focus:outline-none" />
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <button onClick={dispatch} disabled={status === 'sending' || status === 'sent'}
              className={`rounded-xl py-3 text-sm font-black uppercase tracking-wider ${status === 'sent' ? 'bg-neon/20 text-neon' : 'glow-pulse bg-neon text-ink hover:brightness-110'} disabled:cursor-default`}>
              {status === 'sending' ? 'Dispatching to 22 members…' : status === 'sent' ? '✓ Dispatched to Slack War Room' : 'Confirm Plan & Dispatch to 22-Person Slack War Room'}
            </button>
            <button onClick={copy} className="rounded-xl border border-edge px-4 text-xs font-bold uppercase text-slate-300 hover:border-neon hover:text-neon">
              {copied ? 'Copied ✓' : 'Copy Plan'}
            </button>
          </div>
          {status === 'error' && <div className="mt-2 text-xs text-hot">Dispatch failed. Check the webhook URL.</div>}
        </div>
      </div>
    </div>
  )
}
