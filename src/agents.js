import { money, pct } from './report'
import { CHARACTERS } from './office/characters'

const S = (status, finding, metric) => ({ status, finding, metric })

export const AGENTS = [
  { id: 'reporting', icon: '📊', name: 'Reporting Agent', task: 'Builds reports and checks that every number adds up', run: (r) => {
    const bad = r.reconciliation.filter((c) => !c.ok)
    return bad.length ? S('alert', `${bad.length} number check(s) don't match: ${bad[0].label}.`, `${r.reconciliation.length - bad.length}/${r.reconciliation.length} checks`)
      : S('ok', `All ${r.reconciliation.length} number checks match. ${r.sources.length} funding source(s) in the ledger.`, `${r.reconciliation.length}/${r.reconciliation.length} checks`)
  } },
  { id: 'cfo', icon: '💵', name: 'AI CFO', task: 'Watches cash, monthly costs and the 18-month forecast', run: (r) => {
    const k = r.kpis
    if (r.forecast.insolventMonth) return S('alert', `Cash runs out in month ${r.forecast.insolventMonth} of the forecast.`, `${k.runwayDays} days runway`)
    if (r.forecast.minCash < k.monthlyBurn) return S('watch', `Lowest forecast cash is ${money(r.forecast.minCash)}, less than one month of costs.`, `${k.runwayDays} days runway`)
    return S('ok', `Forecast stays above $0 and ends at ${money(r.forecast.endCash)}.`, `${k.runwayDays} days runway`)
  } },
  { id: 'risk', icon: '🛡️', name: 'Risk Officer', task: 'Checks compliance and looks for things that could hurt the business', run: (r) => {
    const top = r.risks[0]
    if (!top) return S('ok', 'No material risks found.', '0 risks')
    return S(top.severity === 'High' ? 'alert' : top.severity === 'Medium' ? 'watch' : 'ok', `${top.title}: ${top.evidence}`, `${r.risks.length} risk${r.risks.length === 1 ? '' : 's'}`)
  } },
  { id: 'architect', icon: '🏛️', name: 'Capital Architect', task: 'Plans the funding mix and the promo-cliff strategy', run: (r) => {
    const k = r.kpis
    const best = [...r.alternatives].sort((a, b) => b.score - a.score || b.endCash - a.endCash)[0]
    if (k.available < k.target) return S('watch', `${money(k.target - k.available)} still needed. ${r.mix.length} source type(s) so far.`, pct(k.fundedPct, 0) + ' funded')
    return S('ok', `Target reached with ${r.mix.length} source type(s). Best boss plan in the model: ${best.label}.`, pct(k.fundedPct, 0) + ' funded')
  } },
  { id: 'underwriting', icon: '🔍', name: 'AI Underwriter', task: 'Scores your (pretend) credit profile', run: (r) => {
    const u = r.underwriting
    if (!u.done) return S('watch', `Underwriting not run yet. Current mock score ${u.fundability} (Tier ${u.tier.tier}).`, `Score ${u.fundability}`)
    const declined = u.applications.filter((a) => a.status === 'declined').length
    return S(u.fundability >= 60 ? 'ok' : 'watch', `Mock score ${u.fundability} (Tier ${u.tier.tier}). ${u.applications.length} application(s), ${declined} declined.`, `Score ${u.fundability}`)
  } },
  { id: 'growth', icon: '📈', name: 'Growth Strategist', task: 'Connects you with partners and tracks revenue growth', run: (r) => {
    const k = r.kpis
    const sellers = r.team.filter((t) => /Marketing|Sales/.test(t.name)).length
    return S(sellers ? 'ok' : 'watch', `Revenue forecast ${money(k.month1Revenue)} in month 1 to ${money(k.month18Revenue)} in month 18. ${sellers ? `${sellers} growth hire(s).` : 'No marketing or sales hire yet.'}`, `${money(k.month18Revenue)}/mo`)
  } },
  { id: 'vc', icon: '🤝', name: 'VC Negotiator', task: 'Compares equity offers and term sheets', run: (r) => {
    const e = r.equity
    const open = e.investors.filter((x) => x.status === 'conditional')
    if (open.length) return S('watch', `Term sheet waiting: ${pct(open[0].equityPct)} equity for ${money(open[0].amount)}.`, `${pct(e.founder, 0)} owned`)
    if (e.founder < 0.75) return S('watch', `Founder owns ${pct(e.founder)} after ${e.investors.length} round(s). Protect what is left.`, `${pct(e.founder, 0)} owned`)
    return S('ok', e.investors.length ? `Founder keeps ${pct(e.founder)} with ${e.seats} board seat(s).` : 'No equity offers yet. Founder owns 100%.', `${pct(e.founder, 0)} owned`)
  } },
  { id: 'guide', icon: '🧭', name: 'Guidance Consultant', task: 'Turns the findings into your next move', run: (r) => {
    const a = r.actions[0]
    return S(a && a.priority === 1 ? 'watch' : 'ok', a ? `Next move: ${a.action}.` : 'Hold the plan.', `${r.actions.length} action${r.actions.length === 1 ? '' : 's'}`)
  } },
]

export const agentStates = (r) => AGENTS.map((a) => {
  const c = CHARACTERS[a.id]
  return { id: a.id, icon: a.icon, name: c.person, title: c.title, role: a.name, portrait: c.portrait, task: a.task, ...a.run(r) }
})
