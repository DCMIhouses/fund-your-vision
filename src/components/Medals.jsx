import { useEffect } from 'react'
import Panel from './Panel'
import { ACHIEVEMENTS, LEVELS, RARITY, achievementById } from '../achievements'

export function Medal({ a, locked, size = 'md' }) {
  const dim = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm'
  if (locked) {
    return <div className={`${dim} grid shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-600 bg-ink font-black text-slate-600`}>?</div>
  }
  return (
    <div className={`${dim} grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${RARITY[a.rarity].ring} p-[3px] shadow-[0_0_16px_rgba(251,191,36,.35)]`}>
      <div className="grid h-full w-full place-items-center rounded-full bg-ink font-mono font-black text-white">{a.icon}</div>
    </div>
  )
}

export function AchievementToasts({ queue, onDone }) {
  const current = queue[0] || null
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => onDone(current), queue.length > 3 ? 1100 : 1900)
    return () => clearTimeout(t)
  }, [current, onDone, queue.length])
  if (!current) return null
  const isLevel = current.startsWith('level:')
  const a = isLevel ? null : achievementById[current]
  const lvl = isLevel ? LEVELS[Number(current.split(':')[1])] : null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-4 md:top-40">
      <div key={current} className="medal-pop flex max-w-md items-center gap-4 rounded-2xl border-2 border-gold bg-panel/95 px-5 py-4 shadow-[0_0_50px_rgba(251,191,36,.45)]">
        {a ? <Medal a={a} size="lg" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-neon to-cyan font-mono text-2xl font-black text-ink">L{Number(current.split(':')[1]) + 1}</div>}
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">{a ? `${a.secret ? 'Secret ' : ''}Achievement unlocked` : 'Level up'}</div>
          <div className="text-xl font-black text-white">{a ? a.name : lvl.name}</div>
          <div className="text-xs text-slate-300">{a ? a.desc : lvl.goal}</div>
          {a && <div className={`mt-0.5 text-xs font-black uppercase ${RARITY[a.rarity].text}`}>{RARITY[a.rarity].label}</div>}
        </div>
      </div>
    </div>
  )
}

export function TrophyRoom({ s, collection }) {
  const owned = (id) => s.achievements.includes(id) || collection[id]
  const total = ACHIEVEMENTS.filter((a) => owned(a.id)).length
  return (
    <Panel num="8" accent="gold" title="The Founder's Trophy Room"
      subtitle="Medals unlock the moment you earn them. Secret medals stay hidden until found. Your collection is saved on this device."
      right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Collected</div><div className="font-mono font-black text-gold">{total}/{ACHIEVEMENTS.length}</div></div>}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = owned(a.id)
          const thisGame = s.achievements.includes(a.id)
          const hidden = a.secret && !got
          return (
            <div key={a.id} className={`flex items-center gap-2 rounded-xl border p-2 ${thisGame ? 'border-gold/70 bg-gold/10' : got ? 'border-edge bg-ink/60' : 'border-edge/60 bg-ink/40 opacity-70'}`}>
              <Medal a={a} locked={!got} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-white">{hidden ? 'Secret medal' : a.name}</div>
                <div className="text-xs leading-tight text-slate-400">{hidden ? 'Keep experimenting to discover it.' : a.desc}</div>
                {thisGame && <div className="text-[11px] font-black uppercase text-gold">Earned this run</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export function LevelTrack({ level, compact }) {
  return (
    <div className="flex items-center gap-1">
      {LEVELS.map((l, i) => (
        <div key={l.name} title={`${l.name}: ${l.goal}`}
          className={`flex-1 truncate rounded-md px-1 py-0.5 text-center text-[9px] font-black uppercase tracking-wide md:text-[10px] ${i === level ? 'bg-gold text-ink shadow-[0_0_12px_rgba(251,191,36,.6)]' : i < level ? 'bg-gold/25 text-gold' : 'bg-edge/60 text-slate-500'}`}>
          {compact ? `L${i + 1}` : l.name.replace('The ', '')}
        </div>
      ))}
    </div>
  )
}
