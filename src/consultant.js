import { BOSS_MONTH } from './engine'
import { formatMetric, money, pct } from './report'

export const QUESTIONS = [
  ['condition', 'How is my business doing?'],
  ['changes', 'What changed since my last snapshot?'],
  ['next', 'What should I do next?'],
  ['alternatives', 'Which financing plan works best?'],
  ['chart', 'How do I read the cash chart?'],
  ['debt', 'What do I owe, and when?'],
  ['plan', 'Give me a step-by-step action plan'],
]

export function answer(r, q) {
  const k = r.kpis
  switch (q) {
    case 'condition':
      return [
        `You have ${money(k.available)} ready to use out of a ${money(k.target)} goal (${pct(k.fundedPct)}).`,
        r.forecast.insolventMonth ? `Warning: the forecast says cash runs out in month ${r.forecast.insolventMonth}.` : `The forecast stays above $0 for all 18 months and ends at ${money(r.forecast.endCash)}.`,
        `Runway today: ${k.runwayDays} days. Capital IQ: ${k.iq}/100${r.iqFinal ? '' : ' (provisional)'}.`,
      ]
    case 'changes':
      if (!r.changes) return ['No saved snapshot to compare yet. Press "Save snapshot", play a few turns, then ask again.']
      {
        const m = r.changes.filter((c) => c.material)
        return m.length ? m.map((c) => `${c.label}: ${formatMetric(c.from, c.fmt)} to ${formatMetric(c.to, c.fmt)}.`) : ['Nothing changed by a material amount (5% or more) since your last snapshot.']
      }
    case 'next':
      return r.actions.slice(0, 3).map((a, i) => `${i + 1}. ${a.action}. Why: ${a.why}`)
    case 'alternatives': {
      const sorted = [...r.alternatives].sort((a, b) => b.score - a.score || b.endCash - a.endCash)
      return [
        ...sorted.slice(0, 3).map((a) => `${a.label}: IQ ${a.score}, month-18 cash ${money(a.endCash)}${a.insolventMonth ? `, runs out month ${a.insolventMonth}` : ''}.`),
        'These come from the same game forecast with each move applied by itself. They are not real offers.',
      ]
    }
    case 'chart':
      return [
        'The line is your forecast cash at the end of each month.',
        `The gold dashed line is month ${BOSS_MONTH}: 0% deals end and sales come in 25% lower than planned.`,
        'If the line drops below the gray $0 line, the business runs out of money that month.',
        `Your lowest point is ${money(r.forecast.minCash)}.`,
      ]
    case 'debt':
      if (!r.debt.length) return ['You have no debt right now.']
      return [
        ...r.debt.map((d) => `${d.label}: ${money(d.balance)}${d.promoMonths ? `, 0% for ${d.promoMonths} months then about ${pct(d.postPromoApr, 0)} APR` : `, ${pct(d.apr)} APR`}. Payment about ${money(d.payment)}/mo (${d.paymentBasis}).`),
        `Forecast debt still owed at month 18: ${money(r.forecast.debtRemaining)}.`,
      ]
    case 'plan':
      return r.actions.map((a) => `Priority ${a.priority}: ${a.action} (${a.owner}).`)
    default:
      return ['Pick a question above.']
  }
}
