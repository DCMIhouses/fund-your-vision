import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { initialState, totals } from './engine'
import { gameReducer } from './store'
import { isMuted, play, setMuted } from './sfx'
import { MEDAL_POINTS, bumpStreak, dailyName, dayKey, loadMeta, runAward, saveMeta } from './meta'
import { achievementById } from './achievements'

const STORAGE_KEY = 'fyv-game-v3'
const TROPHY_KEY = 'fyv-trophies'
const PARTNER_KEY = 'fyv-partners'
const TONE_SFX = { neon: 'approve', hot: 'decline', gold: 'warn', cyan: 'click' }
const loadBook = () => { try { return JSON.parse(localStorage.getItem(PARTNER_KEY)) || {} } catch { return {} } }
const loadTrophies = () => { try { return JSON.parse(localStorage.getItem(TROPHY_KEY)) || {} } catch { return {} } }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState()
  } catch {
    return initialState()
  }
}

export const hasSavedGame = () => { try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY)); return !!v && v.phase && v.phase !== 'setup' } catch { return false } }

export default function useGame() {
  const [s, rawDispatch] = useReducer(gameReducer, undefined, load)
  const [collection, setCollection] = useState(loadTrophies)
  const [medalQueue, setMedalQueue] = useState([])
  const seenMedals = useRef(s.achievements)
  const seenLevel = useRef(s.level)
  const [muted, setMutedState] = useState(isMuted)
  const [toasts, setToasts] = useState([])
  const lastLog = useRef(s.log[0]?.id)
  const lastEvent = useRef(s.activeEvent)
  const lastPhase = useRef(s.phase)
  const [meta, setMetaState] = useState(loadMeta)
  const [today] = useState(() => dayKey())
  const updateMeta = useCallback((m) => { setMetaState(m); saveMeta(m) }, [])
  const [book, setBook] = useState(loadBook)
  const updateBook = useCallback((id, patch) => setBook((b) => {
    if (b[id] && Object.keys(patch).every((k) => b[id][k])) return b
    const next = { ...b, [id]: { ...patch, ...b[id] } }
    localStorage.setItem(PARTNER_KEY, JSON.stringify(next))
    return next
  }), [])
  const meetPartner = useCallback((id) => updateBook(id, { met: Date.now() }), [updateBook])
  const dispatch = useCallback((a) => {
    if (a.type === 'PLAY' && a.card === 'partner' && gameReducer(s, a).funding.some((f) => f.partnerId === a.partnerId)) updateBook(a.partnerId, { met: Date.now(), signed: Date.now() })
    if (a.type === 'START' && s.phase === 'setup') updateMeta(bumpStreak(meta, today))
    if (a.type === 'BOSS' && s.phase === 'boss') {
      const next = gameReducer(s, a)
      if (next.result) {
        const isDaily = s.startup.name === dailyName(today)
        updateMeta({ ...meta, points: meta.points + runAward(next.result.score, isDaily && meta.dailyDone !== today, meta.streak), dailyDone: isDaily ? today : meta.dailyDone })
      }
    }
    rawDispatch(a)
  }, [s, meta, today, updateMeta, updateBook])
  const available = totals(s).available
  const lastAvail = useRef(available)
  const [burst, setBurst] = useState(null)

  useEffect(() => {
    const gain = available - lastAvail.current
    lastAvail.current = available
    if (gain <= 0 || s.phase !== 'fund') return
    play('coin')
    const id = Date.now()
    setBurst({ id, amount: gain })
    const t = setTimeout(() => setBurst((b) => (b?.id === id ? null : b)), 1700)
    return () => clearTimeout(t)
  }, [available, s.phase])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }, [s])

  useEffect(() => {
    const fresh = s.achievements.filter((id) => !seenMedals.current.includes(id))
    const levelUp = s.level > seenLevel.current && s.level > 0 ? [`level:${s.level}`] : []
    seenMedals.current = s.achievements
    seenLevel.current = s.level
    if (!fresh.length && !levelUp.length) return
    play(fresh.some((id) => achievementById[id]?.rarity === 'legendary') ? 'legendary' : 'victory')
    const pts = fresh.reduce((n, id) => n + (MEDAL_POINTS[achievementById[id]?.rarity] || 0), 0)
    if (pts) setMetaState((m) => { const next = { ...m, points: m.points + pts }; saveMeta(next); return next })
    setMedalQueue((q) => [...q, ...levelUp, ...fresh])
    setCollection((c) => {
      const next = { ...c }
      for (const id of fresh) next[id] = next[id] || Date.now()
      localStorage.setItem(TROPHY_KEY, JSON.stringify(next))
      return next
    })
  }, [s.achievements, s.level])

  useEffect(() => {
    const top = s.log[0]
    if (!top || top.id === lastLog.current) return
    const fresh = []
    for (const l of s.log) { if (l.id === lastLog.current) break; fresh.push(l) }
    lastLog.current = top.id
    play(TONE_SFX[top.tone])
    setToasts((t) => [...t, ...fresh.reverse()].slice(-2))
    const ids = fresh.map((f) => f.id)
    setTimeout(() => setToasts((t) => t.filter((x) => !ids.includes(x.id))), 3200)
  }, [s.log])

  useEffect(() => {
    if (s.activeEvent && s.activeEvent !== lastEvent.current) play('event')
    lastEvent.current = s.activeEvent
  }, [s.activeEvent])

  useEffect(() => {
    if (s.phase !== lastPhase.current) {
      if (s.phase === 'results') play(s.result?.outcome === 'victory' ? 'victory' : 'fail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    lastPhase.current = s.phase
  }, [s.phase, s.result])

  const dropMedal = useCallback((id) => setMedalQueue((q) => q.filter((x) => x !== id)), [])
  const toggleMute = () => { setMuted(!muted); setMutedState(!muted) }
  return { s, dispatch, meta, updateMeta, collection, book, meetPartner, medalQueue, dropMedal, toasts, burst, muted, toggleMute, today }
}
