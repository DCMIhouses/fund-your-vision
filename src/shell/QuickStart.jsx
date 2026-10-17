import { useEffect, useState } from 'react'
import { INDUSTRIES, TOURNAMENT_SCENARIOS } from '../data'
import { clamp, fmt } from '../game'
import RunwayInput from '../components/RunwayInput'
import { ProfileFields } from '../components/Underwriting'
import { btnGhost, btnPrimary, card, go, kicker } from './ui'

const ICON = { saas: '🤖', ecom: '🛍️', services: '💼', events: '🎤' }
const BLURB = { saas: 'Apps and AI tools people subscribe to.', ecom: 'Products you sell online and ship.', services: 'Expert work for clients, like consulting.', events: 'Concerts, festivals and live shows.' }
const NAMES = {
  saas: ['NeuralNest AI', 'CloudCrafter', 'Signal Sprout', 'Brightbyte Labs'],
  ecom: ['Golden Thread Co', 'Daily Drop', 'Northside Goods', 'Copper Kettle'],
  services: ['Brightline Advisors', 'Keystone Studio', 'Clearpath Partners', 'Summit Works'],
  events: ['Pulse Fest', 'Skyline Live', 'Sunset Stage', 'Harbor Nights'],
}
const CHIPS = [50000, 100000, 150000, 250000]
const recommended = (st) => clamp(Math.round(((st.monthlyBurn + (st.founderPay || 0)) * 12) / 5000) * 5000, 25000, 500000)

function Slider({ label, value, min, max, step, onChange, disabled, suffix = '' }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm text-slate-300"><span>{label}</span><span className="font-mono text-white">{fmt(value)}{suffix}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="range-neon mt-1 w-full disabled:opacity-40" />
    </label>
  )
}

export default function QuickStart({ g }) {
  const { s, dispatch } = g
  const st = s.startup
  const tour = s.mode === 'tournament'
  const [step, setStep] = useState(1)
  const [touched, setTouched] = useState(false)
  const [nameIdx, setNameIdx] = useState(0)
  useEffect(() => { if (s.phase !== 'setup') go('play') }, [s.phase])
  const set = (patch) => dispatch({ type: 'SETUP', patch })
  const pick = (id) => {
    const next = { ...st, industry: id, monthlyBurn: INDUSTRIES[id].burn }
    set({ industry: id, monthlyBurn: next.monthlyBurn, ...(touched ? {} : { target: recommended(next) }) })
    setStep(2)
  }
  const suggest = () => { const list = NAMES[st.industry]; set({ name: list[nameIdx % list.length] }); setNameIdx((i) => i + 1) }
  const rec = recommended(st)
  const launch = () => { dispatch({ type: 'START' }); go('play') }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <a href="#/" className="text-sm font-bold text-cyan hover:underline">← Home</a>
        <div className="flex rounded-xl border border-edge p-1 text-xs font-black uppercase">
          {[['arcade', 'Quick Play'], ['tournament', 'Tournament']].map(([m, l]) => (
            <button key={m} onClick={() => { dispatch({ type: 'SET_MODE', mode: m }); setStep(1) }} className={`rounded-lg px-3 py-1.5 ${s.mode === m ? 'bg-gold text-ink' : 'text-slate-400'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className={`${kicker} mt-6 text-gold`}>Step {step} of 3</div>
      <div className="mt-2 flex gap-1.5">{[1, 2, 3].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-gold' : 'bg-edge'}`} />)}</div>

      <section className={`${card} mt-5`}>
        {step === 1 && (tour ? (
          <>
            <h1 className="text-3xl font-black text-white">Pick a tournament</h1>
            <p className="mt-1 text-slate-400">Everyone gets the same numbers, so scores are fair. You only choose the name.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TOURNAMENT_SCENARIOS.map((t) => (
                <button key={t.id} onClick={() => { dispatch({ type: 'LOAD_SCENARIO', id: t.id }); setStep(2) }} className={`rounded-2xl border p-4 text-left ${s.scenarioId === t.id ? 'border-gold bg-gold/10' : 'border-edge hover:border-gold/60'}`}>
                  <div className="font-black text-white">{t.label}</div><div className="mt-1 text-sm text-slate-400">{t.blurb}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black text-white">What are you building?</h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(INDUSTRIES).map(([id, ind]) => (
                <button key={id} onClick={() => pick(id)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${st.industry === id ? 'border-gold bg-gold/10' : 'border-edge hover:border-gold/60'}`}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">{ICON[id]}</span>
                  <span><span className="block font-black text-white">{ind.label}</span><span className="block text-sm text-slate-400">{BLURB[id]}</span></span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Each business type uses fictional, illustrative numbers.</p>
          </>
        ))}

        {step === 2 && (
          <>
            <h1 className="text-3xl font-black text-white">What should we call it?</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <input autoFocus value={st.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} placeholder="e.g. NeuralNest AI" aria-label="Startup name"
                className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-edge bg-ink px-4 text-lg text-white placeholder:text-slate-600 focus:border-gold focus:outline-none" />
              <button onClick={suggest} className={btnGhost}>Suggest a name</button>
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <button onClick={() => setStep(1)} className={btnGhost}>Back</button>
              <button onClick={() => setStep(3)} className={btnPrimary}>Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl font-black text-white">What do you need to get started?</h1>
            {tour ? <p className="mt-3 text-slate-300">Tournament goal: <b className="font-mono text-gold">{fmt(st.target)}</b> (fixed for everyone).</p> : (
              <>
                <div className="mt-5 text-center font-mono text-5xl font-black text-gold">{fmt(st.target)}</div>
                <input type="range" min={25000} max={500000} step={5000} value={st.target} aria-label="Funding goal" onChange={(e) => { setTouched(true); set({ target: Number(e.target.value) }) }} className="range-neon mt-4 w-full" />
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[rec, ...CHIPS.filter((c) => c !== rec)].map((v) => (
                    <button key={v} onClick={() => { setTouched(true); set({ target: v }) }} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${st.target === v ? 'border-gold bg-gold/15 text-gold' : 'border-edge text-slate-300 hover:border-gold/60'}`}>{fmt(v)}{v === rec ? ' · recommended' : ''}</button>
                  ))}
                </div>
                <p className="mt-3 text-center text-sm text-slate-400">Recommended = 12 months of costs: ({fmt(st.monthlyBurn)} business costs + {fmt(st.founderPay || 0)} your pay) × 12.</p>
              </>
            )}
            <div className="mt-6 flex justify-between gap-2">
              <button onClick={() => setStep(2)} className={btnGhost}>Back</button>
              <button onClick={launch} className={btnPrimary}>Open my office →</button>
            </div>
          </>
        )}
      </section>

      {!tour && (
        <details className={`${card} mt-4`}>
          <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-slate-300">Customize finances & founder profile (optional)</summary>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Slider label="Monthly business costs" value={st.monthlyBurn} min={2000} max={60000} step={500} onChange={(v) => set({ monthlyBurn: v })} suffix="/mo" />
              <Slider label="Your pay (your choice)" value={st.founderPay || 0} min={0} max={15000} step={500} onChange={(v) => set({ founderPay: v })} suffix="/mo" />
              <Slider label="Personal savings you could use" value={st.savings} min={0} max={200000} step={5000} onChange={(v) => set({ savings: v })} />
              <div>
                <div className="text-sm text-slate-300">How long your cash lasts right now</div>
                <div className="mt-1"><RunwayInput days={s.startDays} onChange={(v) => dispatch({ type: 'START_DAYS', value: v })} /></div>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-300">Pretend credit profile (not a real credit check)</div>
              <div className="mt-2"><ProfileFields s={s} dispatch={dispatch} /></div>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}
