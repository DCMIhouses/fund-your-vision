import Panel from './Panel'
import { INDUSTRIES, DEMO_SCENARIOS } from '../data'
import { fmt } from '../game'
import { ProfileFields, ScorePreview } from './Underwriting'

export default function Setup({ s, dispatch }) {
  const st = s.startup
  const set = (patch) => dispatch({ type: 'SETUP', patch })
  return (
    <Panel num="1" accent="neon" title="Create Your Startup"
      subtitle="Name it, pick an industry, set the target and burn, then lock in an illustrative credit profile.">
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        {DEMO_SCENARIOS.map((d) => (
          <button key={d.id} onClick={() => dispatch({ type: 'LOAD_SCENARIO', id: d.id })}
            className={`rounded-xl border p-3 text-left transition ${s.scenarioId === d.id ? 'border-neon bg-neon/10' : 'border-edge bg-ink/60 hover:border-neon/60'}`}>
            <div className="text-sm font-black text-white">{d.label}</div>
            <div className="mt-1 text-[11px] text-slate-400">{d.blurb}</div>
            {s.scenarioId === d.id && (
              <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[11px] text-neon">
                {d.script.map((x) => <li key={x}>{x}</li>)}
              </ol>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-[11px] text-slate-400">Startup name
            <input value={st.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. NeuralNest AI" maxLength={40}
              className="mt-1 w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-neon focus:outline-none" />
          </label>
          <div>
            <div className="text-[11px] text-slate-400">Industry</div>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {Object.entries(INDUSTRIES).map(([id, ind]) => (
                <button key={id} onClick={() => set({ industry: id, monthlyBurn: ind.burn })}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold ${st.industry === id ? 'border-neon bg-neon text-ink' : 'border-edge text-slate-300 hover:border-neon/60'}`}>
                  {ind.label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Revenue starts month {INDUSTRIES[st.industry].launch} at {fmt(INDUSTRIES[st.industry].base)}/mo, growing {Math.round((INDUSTRIES[st.industry].growth - 1) * 100)}%/mo (illustrative).
            </div>
          </div>
          <label className="block">
            <div className="flex justify-between text-[11px] text-slate-400"><span>Funding target</span><span className="font-mono text-neon">{fmt(st.target)}</span></div>
            <input type="range" min={25000} max={500000} step={5000} value={st.target} onChange={(e) => set({ target: Number(e.target.value) })} className="range-neon w-full" />
          </label>
          <label className="block">
            <div className="flex justify-between text-[11px] text-slate-400"><span>Monthly operating burn (incl. founder pay)</span><span className="font-mono text-slate-200">{fmt(st.monthlyBurn)}</span></div>
            <input type="range" min={2000} max={60000} step={500} value={st.monthlyBurn} onChange={(e) => set({ monthlyBurn: Number(e.target.value) })} className="range-neon w-full" />
          </label>
          <label className="block">
            <div className="flex justify-between text-[11px] text-slate-400"><span>Existing personal savings</span><span className="font-mono text-slate-200">{fmt(st.savings)}</span></div>
            <input type="range" min={0} max={200000} step={5000} value={st.savings} onChange={(e) => set({ savings: Number(e.target.value) })} className="range-neon w-full" />
          </label>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Illustrative credit profile</div>
          <ProfileFields s={s} dispatch={dispatch} locked={false} />
          <ScorePreview s={s} />
        </div>
      </div>

      <button onClick={() => dispatch({ type: 'START' })}
        className="glow-pulse mt-5 w-full rounded-xl bg-neon py-3 text-sm font-black uppercase tracking-wider text-ink hover:brightness-110">
        Launch {st.name.trim() || 'my startup'} and start funding
      </button>
    </Panel>
  )
}
