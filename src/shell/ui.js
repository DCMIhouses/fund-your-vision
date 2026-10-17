export const go = (r) => { window.location.hash = r === 'pay' ? 'pay' : `/${r}` }
export const btnPrimary = 'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-black uppercase tracking-wide text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'
export const btnGhost = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-edge bg-ink/60 px-4 text-sm font-bold text-slate-200 transition hover:border-cyan hover:text-white disabled:opacity-40'
export const card = 'glass rounded-3xl border border-edge p-5 sm:p-6'
export const runwayText = (d) => (d >= 365 ? '12+ months' : d >= 60 ? `${Math.floor(d / 30)} months` : `${d} days`)
export const kicker = 'text-xs font-black uppercase tracking-[0.25em]'
