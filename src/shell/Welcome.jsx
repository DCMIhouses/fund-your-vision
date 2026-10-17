import { AGENTS } from '../agents'
import { btnGhost, btnPrimary, go } from './ui'

export default function Welcome({ g }) {
  const { s, dispatch } = g
  const saved = s.phase !== 'setup'
  const fresh = () => !saved || window.confirm('Start a new business? This replaces your current game.')
  const start = () => { if (!fresh()) return; dispatch({ type: 'SET_MODE', mode: 'arcade' }); go('new') }
  const sample = () => {
    if (!fresh()) return
    dispatch({ type: 'SET_MODE', mode: 'arcade' })
    dispatch({ type: 'LOAD_SCENARIO', id: 'diversified' })
    dispatch({ type: 'START' })
    go('play')
  }
  return (
    <div className="pt-2 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <img src={`${import.meta.env.BASE_URL}fyv-logo.png`} alt="FYV: Fund Your Vision" className="h-12 w-auto sm:h-14" />
        <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-right text-[11px] leading-tight text-slate-400 hover:text-white">Presented by<br /><b className="text-cyan">Nationwide Business Funding</b></a>
      </div>
      <div className="mt-8 grid items-center gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-6xl">Could your business survive its first year?</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">Build an idea, make funding decisions, and see whether your startup survives. Learn by playing.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {saved && <button onClick={() => go('play')} className={btnPrimary}>Continue my game</button>}
            <button onClick={start} className={saved ? btnGhost : btnPrimary}>Start my business</button>
            <button onClick={sample} className={btnGhost}>Try a sample startup</button>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-400">Free educational simulation. No real loan applications.</p>
          <a href="#/help" className="mt-2 inline-block text-sm font-bold text-cyan hover:underline">Explore real funding help →</a>
        </div>
        <figure className="min-w-0">
          <img src={`${import.meta.env.BASE_URL}fyv-office.jpg`} alt="The FYV office: eight advisors at desks along both walls with a wide center aisle" className="w-full rounded-3xl border border-edge shadow-2xl shadow-black/60" />
          <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex -space-x-2">{AGENTS.map((a) => <img key={a.id} src={`${import.meta.env.BASE_URL}agents/${a.id}.jpg`} alt="" className="h-8 w-8 rounded-full border-2 border-ink object-cover" />)}</span>
            Meet your advisors: {AGENTS.map((a) => a.person).join(', ')}. Simulated, rule-based helpers.
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
