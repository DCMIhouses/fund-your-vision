import { useEffect } from 'react'
import Panel from './Panel'
import Guide from './Guide'
import { ACHIEVEMENTS, LEVELS, RARITY, achievementById } from '../achievements'
import { AVATARS, activeRank, gemForLevel, medalCount, topRank } from '../meta'
import { play } from '../sfx'
import Gem from './Gem'

const GLOW = {
  common: 'shadow-[0_0_10px_rgba(203,213,225,.35)]',
  rare: 'shadow-[0_0_18px_rgba(34,211,238,.55)]',
  epic: 'shadow-[0_0_22px_rgba(217,70,239,.6)]',
  legendary: 'shadow-[0_0_30px_rgba(251,191,36,.8)]',
}

export function Medal({ a, locked, size = 'md' }) {
  const dim = size === 'lg' ? 'h-16 w-16 text-3xl' : size === 'sm' ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-2xl'
  if (locked) {
    return (
      <div className={`${dim} relative grid shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-600 bg-ink font-black text-slate-600`}>
        {a?.art ? <span className="opacity-40 grayscale">{a.art}</span> : '?'}
        {a && <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-edge text-[10px]">🔒</span>}
      </div>
    )
  }
  return (
    <div className={`${dim} relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${RARITY[a.rarity].ring} p-[3px] ${GLOW[a.rarity]}`}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2a3558,#05070d_70%)] font-black drop-shadow-[0_0_8px_rgba(255,255,255,.45)]">{a.art || a.icon}</div>
      <span className="medal-shine" />
    </div>
  )
}

export function AchievementToasts({ queue, onDone }) {
  const current = queue[0] || null
  useEffect(() => {
    if (!current) return
    const legend = achievementById[current]?.rarity === 'legendary'
    const t = setTimeout(() => onDone(current), legend ? 3000 : queue.length > 3 ? 1100 : 1900)
    return () => clearTimeout(t)
  }, [current, onDone, queue.length])
  if (!current) return null
  const isLevel = current.startsWith('level:')
  const a = isLevel ? null : achievementById[current]
  const lvl = isLevel ? LEVELS[Number(current.split(':')[1])] : null
  if (a?.rarity === 'legendary') {
    return (
      <div className="pointer-events-none fixed inset-0 z-[75] grid place-items-center overflow-hidden bg-black/70">
        <div className="rays absolute h-[200vmax] w-[200vmax] rounded-full" />
        <div key={current} className="medal-pop relative flex flex-col items-center text-center">
          <div className="text-sm font-black uppercase tracking-[0.4em] text-gold">Legendary medal!</div>
          <div className="mt-4 scale-[2.2] py-10"><Medal a={a} size="lg" /></div>
          <div className="text-4xl font-black text-white md:text-5xl">{a.name}</div>
          <div className="mt-1 max-w-sm px-4 text-sm text-slate-300">{a.desc}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-4 md:top-40">
      <div key={current} className="medal-pop flex max-w-md items-center gap-4 rounded-2xl border-2 border-gold bg-panel/95 px-5 py-4 shadow-[0_0_50px_rgba(251,191,36,.45)]">
        {a ? <Medal a={a} size="lg" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-neon to-cyan font-mono text-2xl font-black text-ink">L{Number(current.split(':')[1]) + 1}</div>}
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">{a ? 'Achievement unlocked' : 'Level up'}</div>
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
    <Panel guide="trophies" num="8" accent="gold" title="The Founder's Trophy Room"
      subtitle="Medals unlock the moment you earn them. Each one counts toward your Founder Level. Your collection is saved on this device."
      right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Collected</div><div className="font-mono font-black text-gold">{total}/{ACHIEVEMENTS.length}</div></div>}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = owned(a.id)
          const thisGame = s.achievements.includes(a.id)
          return (
            <div key={a.id} className={`flex items-center gap-2 rounded-xl border p-2 ${thisGame ? 'border-gold/70 bg-gold/10' : got ? 'border-edge bg-ink/60' : 'border-edge/60 bg-ink/40 opacity-70'}`}>
              <Medal a={a} locked={!got} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-white">{a.name}</div>
                <div className="text-xs leading-tight text-slate-400">{a.desc}</div>
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

export function MedalShowcase({ collection, meta, update }) {
  const earned = ACHIEVEMENTS.filter((a) => collection[a.id])
  const count = medalCount(collection)
  const top = topRank(count)
  const cur = activeRank(meta, count)
  const next = AVATARS.find((r) => r.need > count)
  return (
    <section id="medal-board" className="mb-8 scroll-mt-28 rounded-3xl border-2 border-gold/60 bg-panel p-5 shadow-[0_0_50px_rgba(251,191,36,.18)] sm:p-8">
      <div className="text-center">
        <div className="text-xs font-black uppercase tracking-[0.35em] text-gold">Win medals as you play</div>
        <h2 className="mt-1 text-3xl font-black uppercase text-white md:text-5xl">The Medal Board</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Every medal you win moves you up the Founder Levels. Each level unlocks a gem medal you can wear.</p>
      </div>
      <div className="mt-6"><Guide id="medals" /></div>
      <div className="rounded-2xl border border-gold/50 bg-gold/5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">Founder Level medals</div>
            <div className="mt-1 text-2xl font-black text-white">{cur.icon} Level {cur.level}: {cur.name}</div>
            <div className="mt-1 max-w-xl text-sm text-slate-300">Each level has its own gem medal. Tap a medal you unlocked to wear it. It marks your spot on the quest map and becomes your badge in the corner.</div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[220px] sm:text-right">
            <div className="font-mono text-sm font-black text-white">{count} medal{count === 1 ? '' : 's'} won</div>
            <div className="text-xs text-slate-400">{next ? `${next.need - count} more to reach Level ${next.level}: ${next.name}` : 'Top level reached!'}</div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-edge">
              <div className="h-full rounded-full bg-gradient-to-r from-neon to-gold transition-all duration-700" style={{ width: `${next ? Math.min(100, ((count - top.need) / (next.need - top.need)) * 100) : 100}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {AVATARS.map((r) => {
            const g = gemForLevel(r.level)
            const open = count >= r.need
            const on = cur.id === r.id
            return (
              <button key={r.id} disabled={!open} onClick={() => { play('click'); update({ ...meta, avatar: r.id }) }}
                aria-label={`Level ${r.level} ${r.name}, ${g.gem} medal${on ? ', wearing' : open ? ', unlocked' : `, locked, needs ${r.need} medals`}`}
                className={`relative flex min-h-[170px] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition disabled:cursor-not-allowed ${on ? 'scale-105 border-gold bg-gold/10 shadow-[0_0_24px_rgba(251,191,36,.45)]' : open ? 'border-edge bg-ink/60 hover:border-gold/60' : 'border-edge/60 bg-ink/40'}`}>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${open ? 'bg-gold text-ink' : 'bg-edge text-slate-500'}`}>Level {r.level}</span>
                <span className={`relative mt-2 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${g.grad} p-[3px] shadow-lg ${open ? '' : 'opacity-35 grayscale'}`}>
                  <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-ink"><Gem gem={g} className="h-11 w-11" />{open && <span className="medal-shine" />}</span>
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-edge bg-panel text-sm">{open ? r.icon : '🔒'}</span>
                </span>
                <span className={`mt-2 text-xs font-black ${open ? 'text-white' : 'text-slate-500'}`}>{r.name}</span>
                <span className={`text-[11px] font-bold ${open ? 'text-gold' : 'text-slate-500'}`}>{g.gem} medal</span>
                <span className={`text-[11px] font-bold ${on ? 'text-neon' : open ? 'text-slate-400' : 'text-slate-500'}`}>{on ? 'Wearing ✓' : open ? 'Tap to wear' : `${r.need} medals to unlock`}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-neon/40 bg-neon/5 p-4 sm:p-6">
        <div className="text-center text-xs font-black uppercase tracking-[0.3em] text-neon">Your Accomplishments</div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[['Medals collected', `${earned.length}/${ACHIEVEMENTS.length}`], ['Founder Level', `${top.level}/6`], ['Legendary medals', earned.filter((a) => a.rarity === 'legendary').length]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-edge bg-ink/60 p-3"><div className="font-mono text-2xl font-black text-white">{v}</div><div className="text-xs text-slate-400">{k}</div></div>
          ))}
        </div>
        {earned.length ? (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {earned.map((a) => (
              <div key={a.id} className="flex w-24 flex-col items-center text-center">
                <Medal a={a} size="lg" />
                <span className="mt-1 text-xs font-bold text-white">{a.name}</span>
                <span className="text-[11px] text-slate-500">{new Date(collection[a.id]).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : <div className="mt-4 text-center text-sm text-slate-400">No medals yet. Launch your first startup below to start collecting.</div>}
      </div>
      <div className="mt-6 text-center text-xs font-black uppercase tracking-[0.3em] text-gold">All medals</div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => (
          <div key={a.id} className="medal-pop flex items-center gap-4 rounded-2xl border border-edge bg-ink/60 p-4" style={{ animationDelay: `${i * 0.04}s` }}>
            <Medal a={a} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-black text-white">{a.name}</div>
              <div className="text-xs leading-snug text-slate-400">{a.desc}</div>
              <div className={`text-[11px] font-black uppercase ${RARITY[a.rarity].text}`}>{RARITY[a.rarity].label}{collection[a.id] ? ' · Collected ✓' : ''}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-xs font-black uppercase tracking-[0.3em] text-neon">Game levels · for the game you are playing now</div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {LEVELS.map((l, i) => (
          <div key={l.name} className="rounded-xl border border-edge bg-ink/60 p-3 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-neon to-cyan font-mono text-sm font-black text-ink">L{i + 1}</div>
            <div className="mt-1 text-sm font-black text-white">{l.name}</div>
            <div className="text-xs leading-snug text-slate-400">{l.goal}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
