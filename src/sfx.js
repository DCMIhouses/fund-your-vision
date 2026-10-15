let ctx = null
let muted = localStorage.getItem('screw-vcs-muted') === '1'

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  localStorage.setItem('screw-vcs-muted', v ? '1' : '0')
}

const PATTERNS = {
  click: [[660, 0.04]],
  approve: [[523, 0.08], [784, 0.12]],
  decline: [[220, 0.12], [165, 0.18]],
  warn: [[440, 0.08], [370, 0.1]],
  event: [[330, 0.06], [494, 0.06], [392, 0.1]],
  victory: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
  fail: [[392, 0.15], [330, 0.15], [262, 0.3]],
}

export function play(name) {
  if (muted || !PATTERNS[name]) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    let t = ctx.currentTime
    for (const [freq, dur] of PATTERNS[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = name === 'decline' || name === 'fail' ? 'sawtooth' : 'square'
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
