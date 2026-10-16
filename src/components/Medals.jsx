import { useEffect } from 'react'
import Panel from './Panel'
import Guide from './Guide'
import { ACHIEVEMENTS, LEVELS, RARITY, achievementById } from '../achievements'

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
    <Panel guide="trophies" num="8" accent="gold" title="The Founder's Trophy Room"
      subtitle="Medals unlock the moment you earn them. Secret medals show a hint until you find them. Your collection is saved on this device."
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
                <div className="truncate text-xs font-black text-white">{a.name}{a.secret && <span className="ml-1 text-[10px] uppercase text-fuchsia-300">Secret</span>}</div>
                <div className="text-xs leading-tight text-slate-400">{hidden ? `Hint: ${a.hint}` : a.desc}</div>
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

export function MedalShowcase({ collection }) {
  const pub = ACHIEVEMENTS.filter((a) => !a.secret)
  const secret = ACHIEVEMENTS.filter((a) => a.secret)
  const earned = ACHIEVEMENTS.filter((a) => collection[a.id])
  return (
    <section className="mb-8 rounded-3xl border-2 border-gold/60 bg-panel p-5 shadow-[0_0_50px_rgba(251,191,36,.18)] sm:p-8">
      <div className="text-center">
        <div className="text-xs font-black uppercase tracking-[0.35em] text-gold">Win medals as you play</div>
        <h2 className="mt-1 text-3xl font-black uppercase text-white md:text-5xl">The Medal Board</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Medals unlock the moment you earn them. Hunt the 8 secret medals by trying different strategies.</p>
      </div>
      <div className="mt-6"><Guide id="medals" /></div>
      <div className="rounded-2xl border border-neon/40 bg-neon/5 p-4 sm:p-6">
        <div className="text-center text-xs font-black uppercase tracking-[0.3em] text-neon">Your Accomplishments</div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[['Medals collected', `${earned.length}/${ACHIEVEMENTS.length}`], ['Secret medals found', `${earned.filter((a) => a.secret).length}/8`], ['Legendary medals', earned.filter((a) => a.rarity === 'legendary').length]].map(([k, v]) => (
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
        {pub.map((a, i) => (
          <div key={a.id} className="medal-pop flex items-center gap-4 rounded-2xl border border-edge bg-ink/60 p-4" style={{ animationDelay: `${i * 0.05}s` }}>
            <Medal a={a} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-black text-white">{a.name}</div>
              <div className="text-xs leading-snug text-slate-400">{a.desc}</div>
              <div className={`text-[11px] font-black uppercase ${RARITY[a.rarity].text}`}>{RARITY[a.rarity].label}{collection[a.id] ? ' · Collected ✓' : ''}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-xs font-black uppercase tracking-[0.3em] text-fuchsia-300">Secret medals</div>
      <p className="mx-auto mt-1 max-w-xl text-center text-xs text-slate-400">Faded with a 🔒 = not found yet. Read the hint, then try that strategy.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secret.map((a, i) => {
          const got = !!collection[a.id]
          return (
            <div key={a.id} className={`medal-pop relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center ${got ? 'border-fuchsia-400/70 bg-fuchsia-500/10 shadow-[0_0_24px_rgba(217,70,239,.3)]' : 'border-fuchsia-400/25 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,.15),transparent_60%)]'}`} style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="absolute left-2 top-2 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-fuchsia-300">Secret</span>
              <Medal a={a} locked={!got} size="lg" />
              <div className="text-sm font-black text-white">{a.name}</div>
              <div className="text-xs leading-snug text-slate-400">{got ? a.desc : <><span className="font-bold text-fuchsia-300">Hint:</span> {a.hint}</>}</div>
              <div className={`text-[11px] font-black uppercase ${RARITY[a.rarity].text}`}>{RARITY[a.rarity].label}{got ? ' · Found ✓' : ' · Locked'}</div>
            </div>
          )
        })}
      </div>
      <div className="mt-6 text-center text-xs font-black uppercase tracking-[0.3em] text-neon">Founder levels</div>
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
