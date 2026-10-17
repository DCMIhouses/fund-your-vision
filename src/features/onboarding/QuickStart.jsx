import { useState } from 'react'
import { INDUSTRIES, DEMO_SCENARIOS, TOURNAMENT_SCENARIOS } from '../../data'
import { fmt } from '../../game'
import { liveScore } from '../../engine'
import { RECOMMENDED_TARGET } from '../../shared/gameSelectors'
import { Button, Card, Disclosure, Eyebrow, Slider, Term } from '../../shared/ui'

const BLURB = {
  saas: 'Software people subscribe to. Sales start around month 3.',
  ecom: 'An online store. Sales start around month 2.',
  services: 'Consulting or an agency. Clients can pay from month 1.',
  events: 'Festivals and live shows. Big but late revenue, around month 6.',
}
const NAMES = {
  saas: ['NeuralNest AI', 'Brightloop', 'Signal Harbor'], ecom: ['Golden Thread Co.', 'Northbound Goods', 'Kindred Supply'],
  services: ['Clearpath Advisors', 'Summit Studio', 'Keystone Partners'], events: ['Skyline Sound Fest', 'Harbor Lights Live', 'Open Field Events'],
}
const STEPS = ['What are you building?', 'What should we call it?', 'What do you need to get started?']

export default function QuickStart({ s, dispatch, depth, setDepth, onDone, onBack }) {
  const [step, setStep] = useState(0)
  const st = s.startup
  const tournament = s.mode === 'tournament'
  const set = (patch) => dispatch({ type: 'SETUP', patch })
  const setProfile = (patch) => dispatch({ type: 'PROFILE', patch })
  const pickMode = (m) => {
    setDepth(m)
    if (m === 'tournament' && !tournament) dispatch({ type: 'SET_MODE', mode: 'tournament' })
    if (m !== 'tournament' && tournament) dispatch({ type: 'SET_MODE', mode: 'arcade' })
  }
  const pickIndustry = (k) => set({ industry: k, monthlyBurn: INDUSTRIES[k].burn, target: RECOMMENDED_TARGET(k) })
  const suggest = () => { const list = NAMES[st.industry]; const i = (list.indexOf(st.name) + 1) % list.length; set({ name: list[i] }) }
  const rec = RECOMMENDED_TARGET(st.industry)
  const start = () => { if (!st.name.trim()) set({ name: NAMES[st.industry][0] }); dispatch({ type: 'START' }); onDone() }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <button onClick={onBack} className="min-h-[44px] text-[15px] text-fos-info">← Back</button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="fos-display text-[32px]">Create your startup</h1>
        <div role="radiogroup" aria-label="Play style" className="flex rounded-[14px] bg-fos-soft p-1">
          {[['quick', 'Quick Play'], ['advanced', 'Advanced'], ['tournament', 'Tournament']].map(([id, label]) => (
            <button key={id} role="radio" aria-checked={depth === id} onClick={() => pickMode(id)} className={`min-h-[40px] rounded-[11px] px-3 text-sm font-semibold ${depth === id ? 'bg-fos-surface text-fos-ink fos-shadow' : 'text-fos-muted'}`}>{label}</button>
          ))}
        </div>
      </div>

      {tournament ? (
        <Card className="mt-6 p-6">
          <Eyebrow>Fixed scenario</Eyebrow>
          <p className="mt-1 text-fos-muted">Everyone gets the same startup and the same surprises, so scores can be compared fairly on this device.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TOURNAMENT_SCENARIOS.map((t) => (
              <button key={t.id} onClick={() => dispatch({ type: 'LOAD_SCENARIO', id: t.id })} className={`rounded-[18px] border p-4 text-left ${s.scenarioId === t.id ? 'border-fos-gold bg-fos-gold/5' : 'border-fos-line hover:bg-fos-soft'}`}>
                <div className="font-semibold">{t.label}</div>
                <div className="mt-1 text-sm text-fos-muted">{t.blurb}</div>
                <div className="mt-2 text-sm">{INDUSTRIES[t.startup.industry].label} · goal {fmt(t.startup.target)}</div>
              </button>
            ))}
          </div>
          <label className="mt-5 block text-sm text-fos-muted">Your startup name (only the name can change)
            <input value={st.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} className="mt-1 min-h-[48px] w-full rounded-[14px] border border-fos-line bg-fos-surface px-4 text-[17px] text-fos-ink" />
          </label>
          <Button className="mt-6 w-full" onClick={start}>Open my office</Button>
        </Card>
      ) : (
        <>
          <ol className="mt-6 flex gap-2" aria-label="Steps">
            {STEPS.map((t, i) => (
              <li key={t} className="flex-1"><button onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined} className="w-full text-left">
                <div className={`h-1.5 rounded-full ${i <= step ? 'bg-fos-gold' : 'bg-fos-line'}`} />
                <div className={`mt-2 hidden text-[13px] sm:block ${i === step ? 'font-semibold text-fos-ink' : 'text-fos-muted'}`}>{i + 1}. {t}</div>
              </button></li>
            ))}
          </ol>
          <Card className="fos-in mt-6 p-6" key={step}>
            <h2 className="fos-display text-[24px]">{STEPS[step]}</h2>
            {step === 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(INDUSTRIES).map(([k, v]) => (
                  <button key={k} onClick={() => pickIndustry(k)} aria-pressed={st.industry === k} className={`min-h-[96px] rounded-[18px] border p-4 text-left transition ${st.industry === k ? 'border-fos-gold bg-fos-gold/5' : 'border-fos-line hover:bg-fos-soft'}`}>
                    <div className="text-[17px] font-semibold">{v.label}</div>
                    <div className="mt-1 text-sm text-fos-muted">{BLURB[k]}</div>
                  </button>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="mt-5">
                <label className="block text-sm text-fos-muted" htmlFor="startup-name">Startup name</label>
                <div className="mt-1 flex gap-2">
                  <input id="startup-name" value={st.name} maxLength={40} placeholder={NAMES[st.industry][0]} onChange={(e) => set({ name: e.target.value })} className="min-h-[48px] min-w-0 flex-1 rounded-[14px] border border-fos-line bg-fos-surface px-4 text-[17px] text-fos-ink" />
                  <Button variant="secondary" onClick={suggest}>Suggest</Button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="mt-5">
                <Slider label="Funding goal" value={st.target} min={25000} max={500000} step={5000} onChange={(v) => set({ target: v })} />
                <div className="mt-3 rounded-[14px] bg-fos-soft p-4 text-sm">
                  Suggested: <b>{fmt(rec)}</b>, about 12 months of typical {INDUSTRIES[st.industry].label.toLowerCase()} spending ({fmt(INDUSTRIES[st.industry].burn)}/month in this game).
                  {st.target !== rec && <button onClick={() => set({ target: rec })} className="ml-2 font-semibold text-fos-info">Use suggestion</button>}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-between gap-3">
              <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
              {step < 2 ? <Button onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={start}>Open my office</Button>}
            </div>
          </Card>

          <Disclosure className="mt-4" title="Customize finances & founder profile" hint="Optional. Fictional numbers only: no real credit data needed." defaultOpen={depth === 'advanced'}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Slider label={<Term k="burn">Monthly spending</Term>} value={st.monthlyBurn} min={2000} max={40000} step={500} onChange={(v) => set({ monthlyBurn: v })} />
              <Slider label="Founder pay per month" value={st.founderPay} min={0} max={10000} step={500} onChange={(v) => set({ founderPay: v })} />
              <Slider label="Personal savings you could use" value={st.savings} min={0} max={150000} step={5000} onChange={(v) => set({ savings: v })} />
              <Slider label="Starting cash buffer (days)" value={s.startDays} min={0} max={365} step={1} format={(v) => `${v} days`} onChange={(v) => dispatch({ type: 'START_DAYS', value: v })} />
            </div>
            <p className="mt-2 text-[13px] text-fos-muted">Founder pay adds to monthly spending and shortens runway. Money borrowed to pay yourself still has to be repaid. The 27-day default buffer is a 2016 JPMorgan Chase Institute median for small businesses, used here only as an adjustable starting assumption.</p>
            <div className="mt-6"><Eyebrow>Fictional credit profile</Eyebrow></div>
            <div className="mt-2 grid gap-5 sm:grid-cols-2">
              <Slider label="Credit score" value={s.profile.fico} min={500} max={850} step={1} format={String} onChange={(v) => setProfile({ fico: v })} />
              <Slider label="Credit used (utilization)" value={s.profile.utilization} min={0} max={100} step={1} format={(v) => `${v}%`} onChange={(v) => setProfile({ utilization: v })} />
              <Slider label="Recent credit applications" value={Math.min(6, s.profile.inquiries)} min={0} max={6} step={1} format={String} onChange={(v) => setProfile({ inquiries: v })} />
              <Slider label="Oldest account (years)" value={Math.min(7, s.profile.oldestYears)} min={0} max={7} step={1} format={(v) => `${v} yrs`} onChange={(v) => setProfile({ oldestYears: v })} />
              <Slider label="Open accounts" value={Math.min(5, s.profile.openAccounts)} min={0} max={5} step={1} format={String} onChange={(v) => setProfile({ openAccounts: v })} />
              <Slider label="Annual personal income" value={s.profile.income} min={0} max={300000} step={5000} onChange={(v) => setProfile({ income: v })} />
            </div>
            <label className="mt-4 flex min-h-[44px] items-center gap-3 text-[15px]"><input type="checkbox" className="h-5 w-5" checked={s.profile.derogatory} onChange={(e) => setProfile({ derogatory: e.target.checked })} />Recent late payment or collection</label>
            <div className="mt-2 text-sm text-fos-muted">Simulated credit standing: <b className="text-fos-ink">{liveScore(s)}/100</b> (game estimate, not a credit report).</div>
            <div className="mt-6"><Eyebrow>Or load a fictional sample</Eyebrow></div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {DEMO_SCENARIOS.map((d) => (
                <button key={d.id} onClick={() => dispatch({ type: 'LOAD_SCENARIO', id: d.id })} className={`rounded-[18px] border p-4 text-left ${s.scenarioId === d.id ? 'border-fos-gold bg-fos-gold/5' : 'border-fos-line hover:bg-fos-soft'}`}>
                  <div className="font-semibold">{d.label}</div>
                  <div className="mt-1 text-sm text-fos-muted">{d.blurb}</div>
                </button>
              ))}
            </div>
          </Disclosure>
        </>
      )}
    </div>
  )
}
