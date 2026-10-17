import { useState } from 'react'
import AgentOffice from '../../components/AgentOffice'
import { JOURNEY, OPTION_AGENT, currentMission, moneyPicture } from '../../shared/gameSelectors'
import { Button, Card, Eyebrow, Pill, Sheet } from '../../shared/ui'
import DecisionSheet from './DecisionSheet'
import OfferCard from './OfferCard'
import CashCrunch from './CashCrunch'
import TeamList from '../business/TeamList'

const LIGHT = { ok: ['green', 'All clear'], watch: ['gold', 'Watching'], alert: ['risk', 'Needs attention'] }

export function AgentList({ agents, onOpen }) {
  return (
    <ul className="divide-y divide-fos-line" aria-label="Your advisors">
      {agents.map((a) => (
        <li key={a.id}>
          <button onClick={() => onOpen(a.id)} className="flex min-h-[64px] w-full items-start justify-between gap-3 py-3 text-left">
            <span className="min-w-0"><span className="block font-semibold">{a.name}</span><span className="block text-sm text-fos-muted">{a.finding}</span></span>
            <Pill tone={LIGHT[a.status][0]}>{LIGHT[a.status][1]}</Pill>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function PlayScreen({ s, dispatch, go, report, agents, reduceMotion, onOpenEvent, onSheet }) {
  const [doors, setDoorsState] = useState(false)
  const [team, setTeamState] = useState(false)
  const setDoors = (v) => { setDoorsState(v); onSheet?.(v || team) }
  const setTeam = (v) => { setTeamState(v); onSheet?.(v || doors) }
  const [view, setView] = useState('office')
  const [trigger, setTrigger] = useState(null)
  const [activity, setActivity] = useState([])
  const mission = currentMission(s)
  const m = moneyPicture(s)
  const advice = report?.actions?.[0]

  if (s.phase === 'boss') return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><CashCrunch s={s} dispatch={dispatch} onDone={() => go('/results')} /></div>

  const run = () => {
    if (mission.action === 'doors') setDoors(true)
    else if (mission.action === 'month') dispatch({ type: 'DRAW_EVENT' })
    else if (mission.action === 'boss') dispatch({ type: 'START_BOSS' })
    else if (mission.action === 'event') onOpenEvent()
    else if (mission.action === 'results') go('/results')
    else if (mission.action === 'offer') document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const openDesk = (id) => {
    if (id === 'reporting' || id === 'guide') return go('/blueprint')
    if (['architect', 'vc', 'underwriting'].includes(id)) return setDoors(true)
    if (id === 'growth') return setTeam(true)
    go('/business')
  }
  const onActivity = (e) => setActivity((l) => [{ k: `${Date.now()}-${Math.random()}`, text: e.text }, ...l].slice(0, 4))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <ol className="mb-4 flex flex-wrap gap-2" aria-label="Journey">
        {JOURNEY.map((j, i) => <li key={j}><Pill tone={i === mission.step ? 'gold' : i < mission.step ? 'green' : 'muted'}>{i < mission.step ? '✓ ' : ''}{j}</Pill></li>)}
      </ol>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div><h2 className="text-[17px] font-semibold">Your advisors’ office</h2><p className="text-[13px] text-fos-muted">Simulated AI office. Rule-based advisors, not live AI. Handoffs are illustrative.</p></div>
            <div role="tablist" aria-label="Office view" className="flex rounded-[12px] bg-fos-soft p-1 lg:hidden">
              {[['office', 'Office'], ['list', 'Advisors']].map(([id, l]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`min-h-[40px] rounded-[10px] px-3 text-sm font-semibold ${view === id ? 'bg-fos-surface fos-shadow' : 'text-fos-muted'}`}>{l}</button>)}
            </div>
          </div>
          <div className={view === 'list' ? 'hidden lg:block' : ''}>
            <AgentOffice compact agents={agents} onOpen={openDesk} trigger={trigger} onActivity={onActivity} reduceMotion={reduceMotion} />
          </div>
          {view === 'list' && <Card className="px-4 lg:hidden"><AgentList agents={agents} onOpen={openDesk} /></Card>}
          <details className="mt-3 hidden lg:block">
            <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold text-fos-info">Advisor list (text view)</summary>
            <Card className="px-4"><AgentList agents={agents} onOpen={openDesk} /></Card>
          </details>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <Eyebrow>Next mission</Eyebrow>
            <h1 className="fos-display mt-1 text-[24px]">{mission.title}</h1>
            <p className="mt-2 text-[15px] text-fos-muted">{mission.body}</p>
            <Button className="mt-4 w-full" onClick={run} disabled={mission.action === 'month' && (!!s.activeEvent || !s.deck.length)}>{mission.label}</Button>
            {mission.action !== 'doors' && s.phase === 'fund' && <Button variant="ghost" className="mt-2 w-full" onClick={() => setDoors(true)}>Explore funding options</Button>}
            {s.phase === 'fund' && <Button variant="ghost" className="w-full" onClick={() => setTeam(true)}>Hire help</Button>}
          </Card>
          <div id="offers"><OfferCard s={s} dispatch={dispatch} /></div>
          {advice && s.phase === 'fund' && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-fos-gold">Guidance Consultant</div>
              <p className="mt-1 text-[15px]">“{advice.action}.”</p>
              <details className="mt-1 text-sm text-fos-muted"><summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-fos-info">Why?</summary>{advice.why}</details>
              <p className="text-[12px] text-fos-muted">Guided explanation from game rules, not a real advisor.</p>
            </Card>
          )}
          <Card className="p-5">
            <Eyebrow>Recent</Eyebrow>
            <ul className="mt-2 space-y-1.5 text-[15px]" aria-live="polite">
              {s.log.slice(0, 4).map((l) => <li key={l.id}>{l.text}</li>)}
              {activity.slice(0, 2).map((a) => <li key={a.k} className="text-fos-muted">Office: {a.text}</li>)}
            </ul>
            {m.pending.length > 0 && <p className="mt-3 text-sm text-fos-muted">Promised, not in your bank yet: {m.pending.map((f) => f.label).join(', ')}.</p>}
          </Card>
        </aside>
      </div>

      <DecisionSheet s={s} dispatch={dispatch} open={doors} onClose={() => setDoors(false)} onChosen={(opt) => setTrigger({ id: OPTION_AGENT[opt], n: Date.now() })} />
      <Sheet open={team} onClose={() => setTeam(false)} wide title="Hire help" subtitle="Optional specialists. They cost money every month."><TeamList s={s} dispatch={dispatch} /></Sheet>
    </div>
  )
}
