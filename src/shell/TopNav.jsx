import { fmt, runwayDays } from '../game'
import { monthlyBurn, ownership, totals } from '../engine'
import FundingBar from './FundingBar'
import { runwayText } from './ui'

const NAV = [['play', 'Play', '▶'], ['business', 'My Business', '◧'], ['blueprint', 'Blueprint', '▤']]

export default function TopNav({ g, route }) {
  const { s, muted, toggleMute } = g
  const t = totals(s)
  const runway = runwayDays(t.cash, s.startDays, monthlyBurn(s))
  const own = ownership(s)
  const chapter = s.phase === 'boss' ? 'Cash crunch' : s.phase === 'results' ? 'Results' : `Month ${s.resolvedEvents.length + 1} · Raising money`
  const kpis = [['Cash available', fmt(t.cash), 'text-neon'], ['Cash runway', runwayText(runway), runway < 90 ? 'text-hot' : 'text-cyan'], ['You own', `${(own.founder * 100).toFixed(own.founder === 1 ? 0 : 1)}%`, 'text-white']]
  const tab = (id, label, icon, mobile) => (
    <a key={id} href={`#/${id}`} aria-current={route === id ? 'page' : undefined}
      className={mobile
        ? `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-black uppercase ${route === id ? 'text-gold' : 'text-slate-400'}`
        : `rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide ${route === id ? 'bg-gold text-ink' : 'text-slate-300 hover:bg-white/5'}`}>
      {mobile && <span className="text-base leading-none">{icon}</span>}{label}
    </a>
  )
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-edge bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <a href="#/" className="flex min-w-0 items-center gap-2" title="Home">
            <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" className="h-8 w-8 object-contain" />
            <span className="min-w-0">
              <span className="block text-sm font-black text-white">FYV <span className="text-slate-400">· {s.startup.name || 'Your startup'}</span></span>
              <span className="block truncate text-[11px] text-slate-400">{chapter}</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">{NAV.map(([id, l, i]) => tab(id, l, i))}</nav>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            {kpis.map(([l, v, c]) => (
              <div key={l} className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{l}</div>
                <div className={`font-mono text-sm font-black sm:text-base ${c}`}>{v}</div>
              </div>
            ))}
            <button onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} className="hidden h-9 w-9 place-items-center rounded-xl border border-edge text-slate-400 hover:text-white sm:grid">{muted ? '🔇' : '🔊'}</button>
            <a href="#/more" aria-label="More: medals, settings" className={`grid h-9 w-9 place-items-center rounded-xl border text-lg ${route === 'more' ? 'border-gold text-gold' : 'border-edge text-slate-300 hover:text-white'}`}>☰</a>
          </div>
        </div>
        {s.phase === 'fund' && <div className="mx-auto max-w-7xl px-4 pb-2.5 sm:px-6"><FundingBar s={s} compact /></div>}
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-edge bg-ink/95 backdrop-blur md:hidden" aria-label="Main">
        {NAV.map(([id, l, i]) => tab(id, l, i, true))}
      </nav>
    </>
  )
}
