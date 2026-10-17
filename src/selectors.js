import { totals } from './engine'

export function fundingTiers(s) {
  const t = totals(s)
  let pledged = 0
  for (const f of s.funding) if (f.status === 'conditional') pledged += f.amount || 0
  const committed = t.committed - t.available
  return { pledged, committed, collected: t.cash, saved: t.freed, countsToTarget: t.available, target: s.startup.target }
}
