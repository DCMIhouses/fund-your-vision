export default function Panel({ num, title, subtitle, accent = 'neon', right, children, className = '' }) {
  const ring = {
    neon: 'from-neon/60 via-neon/10',
    cyan: 'from-cyan/60 via-cyan/10',
    hot: 'from-hot/60 via-hot/10',
    gold: 'from-gold/60 via-gold/10',
  }[accent]
  const chip = {
    neon: 'bg-neon text-ink',
    cyan: 'bg-cyan text-ink',
    hot: 'bg-hot text-white',
    gold: 'bg-gold text-ink',
  }[accent]
  return (
    <section className={`rounded-2xl bg-gradient-to-br ${ring} to-transparent p-px ${className}`}>
      <div className="h-full rounded-2xl bg-panel/95 p-5 backdrop-blur">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-sm font-black ${chip}`}>
              {num}
            </span>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-white">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {right}
        </header>
        {children}
      </div>
    </section>
  )
}

export function Stat({ label, value, className = '' }) {
  return (
    <div className="rounded-lg border border-edge bg-ink/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`font-mono text-sm font-bold ${className}`}>{value}</div>
    </div>
  )
}
