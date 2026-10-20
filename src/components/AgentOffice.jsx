import { useEffect, useRef, useState } from 'react'
import OfficeGame from '../office/OfficeGame'
import { TASKS } from '../office/layout'

const DOT = { ok: 'bg-neon', watch: 'bg-gold', alert: 'bg-hot' }
const btn = 'min-h-[40px] rounded-xl border border-edge bg-ink/80 px-3 text-xs font-black uppercase text-slate-200 hover:border-cyan'

export default function AgentOffice({ agents, onOpen, compact = false, trigger = null, onActivity = null, reduceMotion = false }) {
  const host = useRef(null)
  const game = useRef(null)
  const latest = useRef(agents)
  const onOpenRef = useRef(onOpen)
  const onActivityRef = useRef(onActivity)
  const reduceRef = useRef(reduceMotion)
  useEffect(() => { latest.current = agents; onOpenRef.current = onOpen; onActivityRef.current = onActivity; reduceRef.current = reduceMotion })
  const [sel, setSel] = useState(null)
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [follow, setFollow] = useState(false)
  const [log, setLog] = useState([])
  const [outputs, setOutputs] = useState([])
  const [states, setStates] = useState({})
  const [deliveries, setDeliveries] = useState(0)
  const sig = agents.map((a) => `${a.status}|${a.finding}`).join('~')

  useEffect(() => {
    const g = new OfficeGame()
    const cb = {
      onSelect: (id) => { setSel(id); g.select(id) },
      onScreen: (id) => onOpenRef.current(id),
      onEvent: (e) => {
        setLog((l) => [{ k: `${Date.now()}-${Math.random()}`, text: e.text }, ...l].slice(0, 8))
        onActivityRef.current?.(e)
        if (e.type === 'handoff') setDeliveries((n) => n + 1)
        if (e.type === 'done') setOutputs((o) => (o.some((x) => x.k === e.job.id) ? o : [{ k: e.job.id, title: e.job.title, by: e.by }, ...o].slice(0, 6)))
      },
    }
    g.init(host.current, cb).then(() => { if (!g.dead) { game.current = g; g.paused = reduceRef.current; g.setAgents(latest.current) } })
    const t = setInterval(() => { if (!g.dead && g.workers) setStates(Object.fromEntries(g.workers.map((w) => [w.id, g.stateOf(w.id)]))) }, 400)
    return () => { clearInterval(t); g.destroy(); game.current = null }
  }, [])
  useEffect(() => { game.current?.setAgents(agents) }, [sig]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (game.current) { game.current.speed = speed; game.current.paused = paused || reduceMotion } }, [speed, paused, reduceMotion])
  const trig = trigger ? `${trigger.id}:${trigger.n}` : ''
  useEffect(() => {
    if (!trigger) return
    let tries = 0
    const go = () => { if (game.current) { setSel(trigger.id); game.current.select(trigger.id); game.current.assign(trigger.id) } else if (tries++ < 20) setTimeout(go, 250) }
    go()
  }, [trig]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id) => { setSel(id); game.current?.select(id); if (follow) game.current?.follow(id) }
  const a = agents.find((x) => x.id === sel)
  const st = sel ? states[sel] : null

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-[22px] bg-fos-office">
        <div ref={host} data-testid="office-canvas" className="relative h-[340px] w-full sm:h-[520px] xl:h-[600px]" />
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button className="min-h-[44px] min-w-[44px] rounded-xl bg-black/45 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/60" aria-label={paused ? 'Resume office animation' : 'Pause office animation'} onClick={() => setPaused((p) => !p)}>{paused ? 'Play' : 'Pause'}</button>
          <button className="min-h-[44px] min-w-[44px] rounded-xl bg-black/45 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/60" aria-label="Zoom out" onClick={() => game.current?.zoomBy(0.8)}>−</button>
          <button className="min-h-[44px] min-w-[44px] rounded-xl bg-black/45 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/60" aria-label="Zoom in" onClick={() => game.current?.zoomBy(1.25)}>+</button>
          <button className="min-h-[44px] rounded-xl bg-black/45 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/60" onClick={() => game.current?.overview()}>Overview</button>
        </div>
        {a && (
          <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-black/60 p-3 text-sm text-white backdrop-blur sm:left-auto sm:w-80">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2">{a.portrait && <img src={a.portrait} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60" />}<span><b>{a.name}</b> <span className="text-white/70">· {a.title}</span></span></span><button className="min-h-[36px] px-2 text-white/70 hover:text-white" aria-label="Close worker details" onClick={() => { setSel(null); game.current?.select(null) }}>✕</button></div>
            <div className="text-white/80">Doing now: {st?.task}</div>
            <div className="mt-1 text-white/70">{a.finding}</div>
            <div className="mt-2 flex gap-2">
              <button disabled={st?.busy} onClick={() => game.current?.assign(a.id)} className="min-h-[44px] flex-1 rounded-xl bg-white px-3 text-sm font-semibold text-[#17202D] disabled:opacity-50">{st?.busy ? 'Working…' : `Assign: ${TASKS[a.id].title}`}</button>
              <button onClick={() => onOpen(a.id)} className="min-h-[44px] rounded-xl border border-white/40 px-3 text-sm font-semibold">Open</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="glass overflow-hidden rounded-3xl border border-cyan/40 p-3 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan">The capital office · playable</div>
          <h3 className="text-aurora text-2xl font-black uppercase md:text-3xl">Your agents at work</h3>
          <div className="text-xs text-slate-400">Click a worker to inspect or assign a task. Click a screen to open its work. Drag to pan, scroll to zoom. Rule-based agents, not live AI.</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className="min-h-[40px] rounded-xl bg-gold px-3 text-xs font-black uppercase text-ink disabled:opacity-50" disabled={states.architect?.busy} onClick={() => { pick('architect'); game.current?.assign('architect') }}>▶ Run full handoff</button>
          <button className={btn} onClick={() => setPaused((p) => !p)}>{paused ? '▶ Play' : '⏸ Pause'}</button>
          {[1, 2, 4].map((v) => <button key={v} className={`${btn} ${speed === v ? '!border-gold text-gold' : ''}`} onClick={() => setSpeed(v)}>{v}x</button>)}
          <button className={btn} aria-label="Zoom out" onClick={() => game.current?.zoomBy(0.8)}>−</button>
          <button className={btn} aria-label="Zoom in" onClick={() => game.current?.zoomBy(1.25)}>+</button>
          <button className={btn} onClick={() => { setFollow(false); game.current?.overview() }}>Overview</button>
          <button className={`${btn} ${follow ? '!border-cyan text-cyan' : ''}`} disabled={!sel} onClick={() => { const f = !follow; setFollow(f); if (f) game.current?.follow(sel); else game.current?.overview() }}>Follow</button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {agents.map((x) => (
          <button key={x.id} onClick={() => pick(x.id)} className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold ${sel === x.id ? 'border-gold bg-gold/15 text-gold' : 'border-edge text-slate-300 hover:border-cyan'}`}>
            <span className={`h-2 w-2 rounded-full ${DOT[x.status]}`} />{x.name}{x.title ? ` · ${x.title}` : ''}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {[['Active agents', agents.length], ['Open desks', 2], ['Working on tasks', Object.values(states).filter((x) => x?.busy).length], ['Deliveries', deliveries], ['Outputs', outputs.length]].map(([k, v]) => (
          <span key={k} className="rounded-full border border-gold/30 bg-ink/60 px-3 py-1">{k}: <b className="text-gold">{v}</b></span>
        ))}
      </div>
      <div ref={host} data-testid="office-canvas" className="relative mt-2 h-[380px] w-full overflow-hidden rounded-2xl border border-edge sm:h-[640px] lg:h-[720px]" />
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-ink/70 p-3 lg:col-span-1">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Inspect worker</div>
          {!a ? <div className="mt-2 text-sm text-slate-500">Click a worker in the office or a name above.</div> : (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-black text-white"><span className={`h-2.5 w-2.5 rounded-full ${DOT[a.status]}`} />{a.portrait && <img src={a.portrait} alt="" className="h-9 w-9 rounded-full object-cover" />}{a.name}{a.title ? ` · ${a.title}` : ''}</div>
              <div className="text-slate-300"><b className="text-slate-400">Doing now:</b> {st?.task}</div>
              <div className="text-slate-400">{a.finding}</div>
              <button disabled={st?.busy} onClick={() => game.current?.assign(a.id)} className="min-h-[44px] w-full rounded-xl bg-gold text-xs font-black uppercase text-ink disabled:opacity-50">{st?.busy ? 'Busy…' : `Assign task: ${TASKS[a.id].title}`}</button>
              <div className="text-[11px] text-slate-500">Route: {TASKS[a.id].chain.map((id) => agents.find((x) => x.id === id)?.name).join(' → ')}</div>
              <button onClick={() => onOpen(a.id)} className="min-h-[40px] w-full rounded-xl border border-cyan/60 text-xs font-black uppercase text-cyan">Open this screen</button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-edge bg-ink/70 p-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Office activity</div>
          <ol className="mt-2 space-y-1 text-[13px] text-slate-300">{log.length ? log.map((l) => <li key={l.k}>{l.text}</li>) : <li className="text-slate-500">Workers are at their desks. Assign a task to start a handoff.</li>}</ol>
        </div>
        <div className="rounded-2xl border border-edge bg-ink/70 p-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Completed outputs</div>
          {outputs.length === 0 ? <div className="mt-2 text-sm text-slate-500">Nothing finished yet.</div> : (
            <ul className="mt-2 space-y-2">{outputs.map((o) => (
              <li key={o.k} className="flex items-center justify-between gap-2 rounded-xl border border-neon/40 bg-neon/5 p-2 text-[13px]">
                <span className="text-white"><b>{o.title}</b> <span className="text-slate-400">by {agents.find((x) => x.id === o.by)?.name}</span></span>
                <button onClick={() => onOpen('reporting')} className="shrink-0 rounded-lg bg-neon px-3 py-1.5 text-xs font-black uppercase text-ink">Open report</button>
              </li>
            ))}</ul>
          )}
        </div>
      </div>
    </div>
  )
}
