import Guide from './Guide'
import { INDUSTRIES, DEMO_SCENARIOS, TOURNAMENT_SCENARIOS } from '../data'
import { fmt } from '../game'
import { ProfileFields, ScorePreview } from './Underwriting'

export default function Setup({ s, dispatch }) {
  const st = s.startup
  const set = (patch) => dispatch({ type: 'SETUP', patch })
  const tour = s.mode === 'tournament'
  const scenarios = tour ? TOURNAMENT_SCENARIOS : DEMO_SCENARIOS
  return (
    <section className="rounded-3xl border-2 border-neon bg-panel p-5 shadow-[0_0_60px_rgba(57,255,136,.25)] sm:p-8">
      <div className="text-center">
        <div className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">NationwideBusinessFunding.com presents</div>
        <h2 className="medal-pop mt-1 text-4xl font-black uppercase text-neon md:text-6xl">Fund Your Vision</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Create your startup, raise the capital, then prove it can survive 18 months. (Educational simulation.)</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[['Mode', tour ? 'Tournament' : 'Arcade'], ['Target', fmt(st.target)], ['Monthly burn', fmt(st.monthlyBurn)], ['Founder pay', `${fmt(st.founderPay || 0)}/mo`], ['Savings', fmt(st.savings)], ['Industry', INDUSTRIES[st.industry].label]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-edge bg-ink/60 p-3"><div className="text-[11px] uppercase tracking-widest text-slate-500">{k}</div><div className="truncate font-mono text-sm font-black text-white">{v}</div></div>
        ))}
      </div>
      <div className="mt-8">
        <Guide id="setup" />
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-ink p-1">
        {[['arcade', 'Arcade Mode', 'Customize everything. Earn medals freely.'], ['tournament', 'Tournament Mode', 'Standardized seeded scenarios. Verified leaderboard.']].map(([m, label, sub]) => (
          <button key={m} onClick={() => dispatch({ type: 'SET_MODE', mode: m })}
            className={`rounded-lg px-2 py-2 text-left ${s.mode === m ? 'bg-gold text-ink' : 'text-slate-400 hover:text-white'}`}>
            <div className="text-xs font-black uppercase">{label}</div><div className="text-xs leading-tight opacity-80">{sub}</div>
          </button>
        ))}
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        {scenarios.map((d) => (
          <button key={d.id} onClick={() => dispatch({ type: 'LOAD_SCENARIO', id: d.id })}
            className={`rounded-xl border p-3 text-left transition ${s.scenarioId === d.id ? 'border-neon bg-neon/10' : 'border-edge bg-ink/60 hover:border-neon/60'}`}>
            <div className="text-sm font-black text-white">{d.label}</div>
            <div className="mt-1 text-[13px] text-slate-400">{d.blurb}</div>
            {s.scenarioId === d.id && d.script && (
              <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[13px] text-neon">
                {d.script.map((x) => <li key={x}>{x}</li>)}
              </ol>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {tour && <div className="rounded-lg border border-gold/50 bg-gold/10 p-2 text-[13px] text-gold">Tournament inputs are locked so every player faces the same conditions. You can still name your startup.</div>}
          <label className="block text-[13px] text-slate-400">Startup name
            <input value={st.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. NeuralNest AI" maxLength={40}
              className="mt-1 w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-neon focus:outline-none" />
          </label>
          <div>
            <div className="text-[13px] text-slate-400">Industry</div>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {Object.entries(INDUSTRIES).map(([id, ind]) => (
                <button key={id} disabled={tour} onClick={() => set({ industry: id, monthlyBurn: ind.burn })}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold ${st.industry === id ? 'border-neon bg-neon text-ink' : 'border-edge text-slate-300 hover:border-neon/60'}`}>
                  {ind.label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Revenue starts month {INDUSTRIES[st.industry].launch} at {fmt(INDUSTRIES[st.industry].base)}/mo, growing {Math.round((INDUSTRIES[st.industry].growth - 1) * 100)}%/mo (illustrative).
            </div>
          </div>
          <label className="block">
            <div className="flex justify-between text-[13px] text-slate-400"><span>Funding target</span><span className="font-mono text-neon">{fmt(st.target)}</span></div>
            <input type="range" disabled={tour} min={25000} max={500000} step={5000} value={st.target} onChange={(e) => set({ target: Number(e.target.value) })} className="range-neon w-full disabled:opacity-40" />
          </label>
          <label className="block">
            <div className="flex justify-between text-[13px] text-slate-400"><span>Monthly operating burn (excl. founder pay)</span><span className="font-mono text-slate-200">{fmt(st.monthlyBurn)}</span></div>
            <input type="range" disabled={tour} min={2000} max={60000} step={500} value={st.monthlyBurn} onChange={(e) => set({ monthlyBurn: Number(e.target.value) })} className="range-neon w-full disabled:opacity-40" />
          </label>
          <label className="block">
            <div className="flex justify-between text-[13px] text-slate-400"><span>Founder pay (your decision)</span><span className="font-mono text-gold">{fmt(st.founderPay || 0)}/mo</span></div>
            <input type="range" disabled={tour} min={0} max={15000} step={500} value={st.founderPay || 0} onChange={(e) => set({ founderPay: Number(e.target.value) })} className="range-neon w-full disabled:opacity-40" />
            <div className="text-xs text-slate-500">Discretionary. Paid from cash flow; loan proceeds must fit each lender's permitted uses, and borrowing to pay yourself doesn't create profit.</div>
          </label>
          <label className="block">
            <div className="flex justify-between text-[13px] text-slate-400"><span>Existing personal savings</span><span className="font-mono text-slate-200">{fmt(st.savings)}</span></div>
            <input type="range" disabled={tour} min={0} max={200000} step={5000} value={st.savings} onChange={(e) => set({ savings: Number(e.target.value) })} className="range-neon w-full disabled:opacity-40" />
          </label>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-bold uppercase tracking-widest text-slate-500">Illustrative credit profile</div>
          <ProfileFields s={s} dispatch={dispatch} locked={tour} />
          <ScorePreview s={s} />
        </div>
      </div>

      <button onClick={() => dispatch({ type: 'START' })}
        className="glow-pulse mt-5 w-full rounded-xl bg-neon py-3 text-sm font-black uppercase tracking-wider text-ink hover:brightness-110">
        Launch {st.name.trim() || 'my startup'} and start funding
      </button>
      </div>
    </section>
  )
}
