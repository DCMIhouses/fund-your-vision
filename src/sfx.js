let ctx = null
let muted = localStorage.getItem('fyv-muted') !== '0'

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  localStorage.setItem('fyv-muted', v ? '1' : '0')
}

const PATTERNS = {
  click: [[660, 0.04]],
  approve: [[523, 0.08], [784, 0.12]],
  decline: [[220, 0.12], [165, 0.18]],
  warn: [[440, 0.08], [370, 0.1]],
  event: [[330, 0.06], [494, 0.06], [392, 0.1]],
  victory: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
  fail: [[392, 0.15], [330, 0.15], [262, 0.3]],
  coin: [[988, 0.05], [1319, 0.12]],
  flip: [[700, 0.03], [900, 0.05]],
  spin: [[300, 0.04], [360, 0.04], [420, 0.04], [480, 0.04], [540, 0.04], [600, 0.06]],
  hit: [[180, 0.06], [120, 0.1]],
  boom: [[110, 0.12], [80, 0.2], [60, 0.3]],
  buy: [[784, 0.06], [988, 0.06], [1175, 0.12]],
  whoosh: [[520, 0.03], [620, 0.03]],
  legendary: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.15], [1319, 0.3]],
}

export function play(name) {
  if (muted || !PATTERNS[name]) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    let t = ctx.currentTime
    for (const [freq, dur] of PATTERNS[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = ['decline', 'fail', 'hit', 'boom'].includes(name) ? 'sawtooth' : name === 'coin' || name === 'legendary' ? 'triangle' : 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.04, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur)
      t += dur * 0.9
    }
  } catch {
    // audio unavailable
  }
}
