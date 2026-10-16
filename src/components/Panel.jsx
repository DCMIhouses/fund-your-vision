import Guide from './Guide'
export default function Panel({ guide,  num, title, subtitle, accent = 'neon', right, children, className = '' }) {
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
    <section className={`min-w-0 rounded-2xl bg-gradient-to-br ${ring} to-transparent p-px ${className}`}>
      <div className="glass h-full rounded-2xl bg-panel/90 p-5 sm:p-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-base font-black ${chip}`}>
              {num}
            </span>
            <div>
              <h2 className="text-aurora text-xl font-black uppercase tracking-wide sm:text-2xl">{title}</h2>
              {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {right}
        </header>
        {guide && <Guide id={guide} />}
        {children}
      </div>
    </section>
  )
}

export function Stat({ label, value, className = '' }) {
  return (
    <div className="rounded-lg border border-edge bg-ink/60 px-3 py-2">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`font-mono text-sm font-bold ${className}`}>{value}</div>
    </div>
  )
}
