import { ACHIEVEMENTS, LEVELS, RARITY } from '../../achievements'
import { AVATARS, activeRank, dailyConfig, dailyName, medalCount } from '../../meta'
import { fmt } from '../../game'
import { Button, Card, Eyebrow, Pill } from '../../shared/ui'

const LB_KEY = 'fyv-leaderboard'
const loadLb = () => { try { return JSON.parse(localStorage.getItem(LB_KEY)) || [] } catch { return [] } }

export default function MoreScreen({ s, dispatch, go, meta, updateMeta, collection, today, muted, toggleMute, theme, setTheme, reduceMotion, setReduceMotion }) {
  const count = medalCount(collection)
  const cur = activeRank(meta, count)
  const lb = loadLb().sort((a, b) => b.score - a.score).slice(0, 10)
  const startDaily = () => {
    if (s.phase !== 'setup' && !window.confirm('Start today’s challenge? Your current run will be replaced.')) return
    const c = dailyConfig(today)
    dispatch({ type: 'SET_MODE', mode: 'arcade' })
    dispatch({ type: 'SETUP', patch: c.startup })
    dispatch({ type: 'PROFILE', patch: c.profile })
    go('/new')
  }
  const toggle = (label, on, onClick) => (
    <button role="switch" aria-checked={on} onClick={onClick} className="flex min-h-[56px] w-full items-center justify-between gap-3 py-2 text-left">
      <span className="text-[15px]">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-fos-green' : 'bg-fos-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-6' : 'left-1'}`} /></span>
    </button>
  )
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <h1 className="fos-display text-[32px]">Profile & more</h1>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5"><Eyebrow>Capital Points</Eyebrow><div className="fos-num mt-1 text-[30px] font-semibold">{meta.points.toLocaleString()}</div><p className="text-sm text-fos-muted">Game points only, not real money.</p></Card>
        <Card className="p-5"><Eyebrow>Daily streak</Eyebrow><div className="fos-num mt-1 text-[30px] font-semibold">{meta.streak} day{meta.streak === 1 ? '' : 's'}</div><p className="text-sm text-fos-muted">Best: {meta.bestStreak}. Each streak day adds +10 points.</p></Card>
        <Card className="p-5"><Eyebrow>Daily challenge</Eyebrow><p className="mt-1 text-[15px]">{meta.dailyDone === today ? 'Done today. Come back tomorrow.' : 'A new mystery startup every day. +100 points.'}</p><Button variant="secondary" className="mt-3 w-full" disabled={s.startup.name === dailyName(today) && s.phase === 'setup'} onClick={startDaily}>Load today’s challenge</Button></Card>
      </div>

      <Card className="p-5">
        <Eyebrow>Founder rank · {count} medal{count === 1 ? '' : 's'} won</Eyebrow>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {AVATARS.map((r) => {
            const open = count >= r.need
            const on = cur.id === r.id
            return (
              <button key={r.id} disabled={!open} onClick={() => updateMeta({ ...meta, avatar: r.id })} aria-pressed={on} className={`min-h-[96px] rounded-[18px] border p-3 text-left disabled:opacity-50 ${on ? 'border-fos-gold bg-fos-gold/5' : 'border-fos-line'}`}>
                <div className="text-[13px] text-fos-muted">Level {r.level}</div><div className="font-semibold">{r.name}</div>
                <div className="text-[13px] text-fos-muted">{on ? 'Wearing' : open ? 'Tap to wear' : `${r.need} medals`}</div>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-fos-muted">This run’s founder level: {s.level >= 0 ? LEVELS[s.level].name : 'not started'}.</p>
      </Card>

      <Card className="p-5">
        <Eyebrow>Achievements</Eyebrow>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const won = !!collection[a.id]
            return (
              <li key={a.id} className={`rounded-[18px] border p-4 ${won ? 'border-fos-gold' : 'border-fos-line opacity-70'}`}>
                <div className="flex items-start justify-between gap-2"><span className="font-semibold">{a.name}</span><Pill tone={won ? 'gold' : 'muted'}>{won ? 'Won' : RARITY[a.rarity].label}</Pill></div>
                <p className="mt-1 text-sm text-fos-muted">{a.desc}</p>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <Eyebrow>Tournament rankings (this device only)</Eyebrow>
        {lb.length ? <ol className="mt-2 divide-y divide-fos-line">{lb.map((e, i) => <li key={e.at} className="flex justify-between gap-2 py-2 text-[15px]"><span>{i + 1}. {e.nick} <span className="text-fos-muted">· {e.scenario}</span></span><span className="fos-num">{e.score} · {fmt(e.endCash)}</span></li>)}</ol> : <p className="mt-1 text-sm text-fos-muted">No verified tournament scores yet. Pick Tournament when you create a startup.</p>}
        <p className="mt-2 text-[13px] text-fos-muted">There is no shared online leaderboard; scores stay on this device.</p>
      </Card>

      <Card className="px-5 py-3">
        <Eyebrow className="pt-2">Settings</Eyebrow>
        <div className="divide-y divide-fos-line">
          {toggle('Sound effects', !muted, toggleMute)}
          {toggle('Dark mode', theme === 'dark', () => setTheme(theme === 'dark' ? 'light' : 'dark'))}
          {toggle('Reduce motion (pauses office animation)', reduceMotion, () => setReduceMotion(!reduceMotion))}
        </div>
        <div className="flex flex-wrap gap-3 py-3">
          <Button variant="secondary" onClick={() => go('/')}>Replay welcome</Button>
          <a href="?ui=legacy" className="inline-flex min-h-[44px] items-center rounded-[14px] border border-fos-line px-5 text-[15px] font-semibold hover:bg-fos-soft">Open classic version</a>
          <Button variant="danger" onClick={() => { if (window.confirm('Reset your current game? Medals and points stay.')) { dispatch({ type: 'RESET' }); go('/') } }}>Reset game</Button>
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>Business payments</Eyebrow>
        <p className="mt-1 text-sm text-fos-muted">For existing Nationwide Business Funding clients. Separate from the game.</p>
        <a href="#pay" className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-fos-info">Make a payment →</a>
      </Card>
    </div>
  )
}
