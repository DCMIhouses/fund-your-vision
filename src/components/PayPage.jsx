import { useState } from 'react'
import Panel from './Panel'
import { PAY, SOON, ready } from '../payments'

function Row({ label, value, copyable = true }) {
  const [copied, setCopied] = useState(false)
  const has = !!String(value || '').trim()
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-ink/60 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</div>
        <div className={`break-all font-mono text-sm font-bold ${has ? 'text-white' : 'text-slate-500 italic'}`}>{has ? value : SOON}</div>
      </div>
      {has && copyable && (
        <button onClick={copy} aria-label={`Copy ${label}`} className="shrink-0 rounded-lg border border-edge px-3 py-2 text-xs font-black uppercase text-slate-300 hover:border-neon hover:text-neon">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      )}
    </div>
  )
}

function Steps({ items }) {
  return (
    <ol className="mt-5 space-y-2 text-sm leading-relaxed text-slate-300">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-edge font-mono text-xs font-black text-white">{i + 1}</span><span>{t}</span></li>
      ))}
    </ol>
  )
}

function Method({ icon, title, badge, accent, children }) {
  const ring = { neon: 'from-neon/60', cyan: 'from-cyan/60', gold: 'from-gold/60', slate: 'from-slate-500/40' }[accent]
  return (
    <section className={`min-w-0 rounded-2xl bg-gradient-to-br ${ring} via-transparent to-transparent p-px`}>
      <div className="glass h-full rounded-2xl bg-panel/90 p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-2xl" aria-hidden="true">{icon}</span>
            <h3 className="text-xl font-black uppercase tracking-wide text-white">{title}</h3>
          </div>
          {badge}
        </div>
        {children}
      </div>
    </section>
  )
}

const Badge = ({ on, soon }) => (
  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${soon ? 'border border-slate-600 text-slate-400' : on ? 'bg-neon text-ink' : 'border border-gold/60 text-gold'}`}>
    {soon ? 'Coming soon' : on ? 'Available' : 'Setting up'}
  </span>
)

export default function PayPage({ onBack }) {
  const z = PAY.zelle, w = PAY.wire
  const memo = 'Your full name + "FYV"'
  return (
    <div className="fade-up">
      <button onClick={onBack} className="mb-6 rounded-xl border border-edge px-4 py-2 text-sm font-black uppercase text-slate-300 hover:border-neon hover:text-neon">← Back to the game</button>
      <Panel num="$" accent="gold" title="Make a payment"
        subtitle={`Pay ${PAY.payee}${PAY.purpose ? ` for ${PAY.purpose}` : ''}. You send the money from your own bank app. This website never sees or stores your bank login or card.`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[['⚡', 'Zelle', 'Fast, from your bank app'], ['🏦', 'Bank wire', 'Best for large amounts'], ['🪙', 'Crypto', 'Coming soon']].map(([i, t, d]) => (
            <div key={t} className="rounded-xl border border-edge bg-ink/60 p-4"><div className="text-2xl" aria-hidden="true">{i}</div><div className="mt-1 font-black text-white">{t}</div><div className="text-xs text-slate-400">{d}</div></div>
          ))}
        </div>
      </Panel>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Method icon="⚡" title="Zelle" accent="neon" badge={<Badge on={ready(z)} />}>
          <div className="space-y-3">
            <Row label="Send to (email or phone)" value={z.contact} />
            <Row label="Name shown in Zelle" value={z.name} />
            <Row label="Memo" value={memo} copyable={false} />
          </div>
          <Steps items={['Open your bank app and tap Zelle.', 'Add the email or phone above as a new recipient.', 'Check that the name shown matches the name above before you send.', 'Type the amount, add the memo, and send.']} />
        </Method>

        <Method icon="🏦" title="Bank wire" accent="cyan" badge={<Badge on={ready(w)} />}>
          <div className="space-y-3">
            <Row label="Bank name" value={w.bankName} />
            <Row label="Account name" value={w.accountName} />
            <Row label="Routing number (ABA)" value={w.routing} />
            <Row label="Account number" value={w.account} />
            <Row label="Bank address" value={w.bankAddress} />
            {w.swift && <Row label="SWIFT (international)" value={w.swift} />}
            <Row label="Reference" value={memo} copyable={false} />
          </div>
          <Steps items={['Log in to your bank, or visit a branch, and choose "Send a wire."', 'Copy each detail above exactly.', 'Add the reference so we know the payment is yours.', 'Save your wire confirmation number.']} />
        </Method>
      </div>

      <div className="mt-8">
        <Method icon="🪙" title="Crypto" accent="slate" badge={<Badge soon />}>
          <p className="text-sm leading-relaxed text-slate-400">Paying with crypto (like USDC or Bitcoin) is coming soon. Please use Zelle or a bank wire for now.</p>
        </Method>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neon/40 bg-neon/5 p-5 text-sm leading-relaxed text-slate-300">
          <div className="mb-1 font-black uppercase text-neon">After you pay</div>
          Email your receipt or confirmation number to{' '}
          {PAY.receiptEmail ? <a href={`mailto:${PAY.receiptEmail}`} className="font-bold text-cyan hover:underline">{PAY.receiptEmail}</a> : <span className="italic text-slate-500">{SOON}</span>}
          {' '}so we can match it to you.
        </div>
        <div className="rounded-2xl border border-hot/40 bg-hot/5 p-5 text-sm leading-relaxed text-slate-300">
          <div className="mb-1 font-black uppercase text-hot">Stay safe</div>
          We will never email or text you new bank details. If anyone sends you different payment info, don't pay. Contact us through NationwideBusinessFunding.com first to check. Zelle and wire payments usually can't be undone.
        </div>
      </div>
    </div>
  )
}
