import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { initialState } from '../engine'
import { gameReducer } from '../store'
import { isMuted, play, setMuted } from '../sfx'
import { MEDAL_POINTS, bumpStreak, dailyName, dayKey, loadMeta, runAward, saveMeta } from '../meta'
import { achievementById } from '../achievements'

export const STORAGE_KEY = 'fyv-game-v3'
const TROPHY_KEY = 'fyv-trophies'
const PARTNER_KEY = 'fyv-partners'
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState()
  } catch {
    return initialState()
  }
}

const TONE_SFX = { neon: 'approve', hot: 'decline', gold: 'warn', cyan: 'click' }

// Same persistence keys and side effects as the legacy App, so saved games, medals and partner records carry over.
export default function useGame() {
  const [s, rawDispatch] = useReducer(gameReducer, undefined, loadGame)
  const [collection, setCollection] = useState(() => readJson(TROPHY_KEY, {}))
  const [book, setBook] = useState(() => readJson(PARTNER_KEY, {}))
  const [meta, setMetaState] = useState(loadMeta)
  const [today] = useState(() => dayKey())
  const [medalQueue, setMedalQueue] = useState([])
  const [muted, setMutedState] = useState(isMuted)
  const seenMedals = useRef(s.achievements)
  const seenLevel = useRef(s.level)
  const lastLog = useRef(s.log[0]?.id)

  const updateMeta = useCallback((m) => { setMetaState(m); saveMeta(m) }, [])
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
    lastLog.current = top.id
    play(TONE_SFX[top.tone])
  }, [s.log])

  const dropMedal = useCallback((id) => setMedalQueue((q) => q.filter((x) => x !== id)), [])
  const toggleMute = useCallback(() => { setMuted(!muted); setMutedState(!muted) }, [muted])

  return { s, dispatch, meta, updateMeta, collection, book, meetPartner, medalQueue, dropMedal, muted, toggleMute, today }
}
