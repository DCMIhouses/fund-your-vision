import { useEffect, useId, useRef, useState } from 'react'
import { BOSS_MONTH } from '../engine'
import { fmt, fmtK } from '../game'
import { GLOSSARY } from './gameSelectors'

export function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return <Tag className={`rounded-[22px] border border-fos-line bg-fos-surface fos-shadow ${className}`} {...rest}>{children}</Tag>
}

const VARIANT = {
  primary: 'bg-fos-ink text-fos-surface hover:opacity-90',
  gold: 'bg-fos-gold text-white hover:brightness-105',
  secondary: 'border border-fos-line bg-fos-surface text-fos-ink hover:bg-fos-soft',
  ghost: 'text-fos-info hover:bg-fos-soft',
  danger: 'border border-fos-risk/40 text-fos-risk hover:bg-fos-risk/5',
}
export function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <button className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <div className={`text-[13px] font-semibold uppercase tracking-[0.08em] text-fos-muted ${className}`}>{children}</div>
}

export function Term({ k, children }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const g = GLOSSARY[k]
  if (!g) return children
  return (
    <span className="relative inline">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="cursor-help underline decoration-fos-muted decoration-dotted underline-offset-4">{children || g[0]}</button>
      {open && (
        <span id={id} role="note" className="absolute left-0 top-full z-40 mt-1 block w-64 rounded-xl border border-fos-line bg-fos-surface p-3 text-left text-sm font-normal normal-case tracking-normal text-fos-ink fos-shadow">
          <b>{g[0]}.</b> {g[1]}
        </span>
      )}
    </span>
  )
}

export function Disclosure({ title, hint, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <Card className={className}>
      <button aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex min-h-[64px] w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span><span className="block text-[17px] font-semibold">{title}</span>{hint && <span className="block text-sm text-fos-muted">{hint}</span>}</span>
        <span aria-hidden="true" className={`text-fos-muted transition ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div id={id} className="border-t border-fos-line px-5 py-4">{children}</div>}
    </Card>
  )
}

export function Sheet({ open, onClose, title, subtitle, children, wide = false, footer = null }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => ref.current?.querySelector('h2')?.focus(), 30)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); document.body.style.overflow = overflow; prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      <div ref={ref} className={`fos-sheet relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-fos-bg sm:max-h-none sm:rounded-none sm:rounded-l-[24px] ${wide ? 'sm:w-[min(760px,100vw)]' : 'sm:w-[min(520px,100vw)]'}`}>
        <div className="flex items-start justify-between gap-3 border-b border-fos-line bg-fos-surface px-5 py-4">
          <div className="min-w-0">
            <h2 tabIndex={-1} className="fos-display text-[22px] outline-none">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-fos-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close panel" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-fos-muted hover:bg-fos-soft">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-fos-line bg-fos-surface px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Pill({ tone = 'muted', children, className = '' }) {
  const c = { muted: 'bg-fos-soft text-fos-muted', green: 'bg-fos-green/10 text-fos-green', risk: 'bg-fos-risk/10 text-fos-risk', gold: 'bg-fos-gold/12 text-fos-gold', info: 'bg-fos-info/10 text-fos-info' }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${c} ${className}`}>{children}</span>
}


export function Ring({ value, size = 120, stroke = 12, label, color = 'var(--fos-gold)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fos-line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--fos-ink)" fontSize={size * 0.2} fontWeight="650">{Math.round(value * 100)}%</text>
    </svg>
  )
}

export function Progress({ value, tone = 'gold', label }) {
  const c = { gold: 'bg-fos-gold', green: 'bg-fos-green', risk: 'bg-fos-risk', info: 'bg-fos-info' }[tone]
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, value) * 100)} className="h-2.5 overflow-hidden rounded-full bg-fos-soft">
      <div className={`h-full rounded-full ${c} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

export function CashChart({ forecast, height = 200, label = '18-month cash forecast' }) {
  const pts = forecast.months
  const vals = pts.map((p) => p.cash)
  const max = Math.max(10000, ...vals)
  const min = Math.min(0, ...vals)
  const W = 640, H = height, padL = 52, padR = 12, padT = 14, padB = 26
  const x = (i) => padL + (i / (pts.length - 1)) * (W - padL - padR)
  const y = (v) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.cash).toFixed(1)}`).join(' ')
  const bad = forecast.insolventMonth
  const stroke = bad ? 'var(--fos-risk)' : 'var(--fos-green)'
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}. ${bad ? `Cash falls below zero in month ${bad}.` : `Cash stays above zero; month 18 ends at ${fmt(forecast.endCash)}.`}`}>
        {[max, (max + min) / 2, min].map((v) => (
          <g key={v}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--fos-line)" /><text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--fos-muted)">{fmtK(v)}</text></g>
        ))}
        <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="var(--fos-muted)" strokeDasharray="4 4" />
        <line x1={x(BOSS_MONTH - 1)} x2={x(BOSS_MONTH - 1)} y1={padT} y2={H - padB} stroke="var(--fos-gold)" strokeDasharray="3 3" />
        <text x={x(BOSS_MONTH - 1) - 4} y={padT + 10} textAnchor="end" fontSize="11" fill="var(--fos-gold)">Month 12: promos end</text>
        <path d={`${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={stroke} opacity="0.08" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={p.m} cx={x(i)} cy={y(p.cash)} r={p.m === bad ? 5 : 2.5} fill={p.cash < 0 ? 'var(--fos-risk)' : stroke}><title>{`Month ${p.m}: ${fmt(p.cash)}`}</title></circle>)}
        {[1, 6, 12, 18].map((m) => <text key={m} x={x(m - 1)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--fos-muted)">M{m}</text>)}
      </svg>
      <table className="sr-only"><caption>{label}</caption><tbody>{pts.map((p) => <tr key={p.m}><th>Month {p.m}</th><td>{fmt(p.cash)}</td></tr>)}</tbody></table>
    </figure>
  )
}

export function Stat({ label, value, sub, tone = '' }) {
  return (
    <div>
      <div className="text-sm text-fos-muted">{label}</div>
      <div className={`fos-num text-[22px] font-semibold ${tone}`}>{value}</div>
      {sub && <div className="text-[13px] text-fos-muted">{sub}</div>}
    </div>
  )
}

export function Slider({ label, value, min, max, step, onChange, format = fmt }) {
  const id = useId()
  const v = Math.min(Math.max(value, min), Math.max(min, max))
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm text-fos-muted"><span>{label}</span><span className="fos-num text-lg font-semibold text-fos-ink">{format(v)}</span></label>
      <input id={id} type="range" min={min} max={Math.max(min, max)} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 h-11 w-full" />
    </div>
  )
}

export const SIM_NOTE = 'Educational simulation. No real loan applications, approvals or offers.'
