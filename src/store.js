import { initialState, reducer } from './engine'
import { evaluateAchievements, computeLevel } from './achievements'
import { TOURNAMENT_SCENARIOS } from './data'

const RECORDED = new Set([
  'UNDERWRITE', 'HIRE', 'FIRE', 'APPLY_CARD', 'PLAY', 'RESOLVE_CONDITION', 'DRAW_EVENT', 'RESOLVE_EVENT',
  'START_BOSS', 'BOSS_MOVE', 'BOSS_UNDO', 'BOSS',
])

export function gameReducer(s, a) {
  let next = reducer(s, a)
  if (next === s) return s
  if (next.mode === 'tournament' && s.phase !== 'setup' && RECORDED.has(a.type)) {
    next = { ...next, actionLog: [...next.actionLog, a] }
  }
  const earned = evaluateAchievements(next).filter((id) => !next.achievements.includes(id))
  const level = Math.max(next.level, computeLevel(next))
  if (earned.length || level !== next.level) next = { ...next, achievements: [...next.achievements, ...earned], level }
  return next
}

export function tournamentStart(scenarioId) {
  const sc = TOURNAMENT_SCENARIOS.find((t) => t.id === scenarioId)
  if (!sc) return null
  return initialState({ mode: 'tournament', scenarioId: sc.id, startup: { ...sc.startup }, profile: { ...sc.profile } })
}

export function replayRun(s) {
  let r = tournamentStart(s.scenarioId)
  if (!r) return null
  r = gameReducer({ ...r, startup: { ...r.startup, name: s.startup.name } }, { type: 'START' })
  for (const a of s.actionLog) r = gameReducer(r, a)
  return r
}

export function validateRun(s) {
  if (s.mode !== 'tournament' || s.phase !== 'results' || !s.result) return { ok: false, reason: 'Only finished Tournament Mode runs can be submitted.' }
  const r = replayRun(s)
  if (!r || r.phase !== 'results') return { ok: false, reason: 'Replay did not reach the results screen.' }
  if (r.result.score !== s.result.score || r.result.outcome !== s.result.outcome) return { ok: false, reason: 'Replayed score does not match.' }
  return { ok: true, result: r.result }
}
