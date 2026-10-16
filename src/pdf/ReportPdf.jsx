import { Document, Image, Line, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { BOSS_MONTH, MONTHS, POST_PROMO_APR, TERM_APR, TERM_APR_CONDITIONAL, TERM_MONTHS } from '../engine'
import { SECTION_TITLE, UNAVAILABLE, reportType } from '../report'

const C = { navy: '#0f1f3d', ink: '#1f2933', char: '#3e4651', mute: '#6b7280', line: '#e3e6ea', soft: '#f5f6f8', gold: '#b8913a', goldSoft: '#f7f1e3', green: '#1f7a4d', red: '#b42318', amber: '#b7791f', blue: '#2f5d9b' }
const W = 516

const clean = (v) => String(v ?? '')
  .replace(/[\u2012-\u2015\u2212]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/\u2026/g, '...').replace(/[\u2265]/g, '>=').replace(/[\u2264]/g, '<=').replace(/\u2192/g, '->').replace(/[\u00b7\u2022]/g, '-')
  .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '').replace(/\s+/g, ' ').trim()
const m = (n) => (n == null || Number.isNaN(n) ? UNAVAILABLE : `${n < 0 ? '-' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`)
const p = (v, d = 1) => (v == null || Number.isNaN(v) ? UNAVAILABLE : `${(v * 100).toFixed(d)}%`)
const n0 = (v) => (v == null ? UNAVAILABLE : Math.round(v).toLocaleString('en-US'))
const date = (iso) => new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })

const st = StyleSheet.create({
  page: { paddingTop: 64, paddingBottom: 60, paddingHorizontal: 48, fontFamily: 'Helvetica', fontSize: 9.5, color: C.ink, lineHeight: 1.45, backgroundColor: '#ffffff' },
  header: { position: 'absolute', top: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.6, borderBottomColor: C.line, paddingBottom: 6, fontSize: 7.5, color: C.mute },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 6, fontSize: 7.5, color: C.mute },
  kicker: { fontSize: 8, letterSpacing: 2, color: C.gold, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  h1: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.navy, marginTop: 4 },
  rule: { width: 48, height: 2, backgroundColor: C.gold, marginTop: 8, marginBottom: 14 },
  h3: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.navy, marginTop: 14, marginBottom: 6 },
  p: { marginBottom: 6, color: C.char },
  small: { fontSize: 7.5, color: C.mute },
  th: { fontFamily: 'Helvetica-Bold', color: '#ffffff', fontSize: 8 },
  td: { fontSize: 8.5, color: C.ink },
})

function Section({ id, n, onPage, children }) {
  return (
    <View>
      <Text style={{ fontSize: 1, color: '#ffffff' }} render={({ pageNumber }) => { onPage(id, pageNumber); return ' ' }} />
      <Text style={st.kicker}>Section {String(n + 1).padStart(2, '0')}</Text>
      <Text style={st.h1}>{SECTION_TITLE[id]}</Text>
      <View style={st.rule} />
      {children}
    </View>
  )
}

const H3 = ({ children }) => <Text style={st.h3} minPresenceAhead={60}>{children}</Text>
const P = ({ children }) => <Text style={st.p}>{clean(children)}</Text>
const Empty = ({ children }) => <View style={{ padding: 10, backgroundColor: C.soft, borderRadius: 3, marginBottom: 8 }}><Text style={{ color: C.mute }}>{children}</Text></View>

function KPIs({ items }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 6 }}>
      {items.map(([label, value, sub, tone]) => (
        <View key={label} wrap={false} style={{ width: '25%', padding: 4 }}>
          <View style={{ borderWidth: 0.6, borderColor: C.line, minHeight: 58 }}>
            <View style={{ height: 2, backgroundColor: tone || C.gold }} />
            <View style={{ padding: 8 }}>
            <Text style={{ fontSize: 6.8, color: C.mute, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' }}>{label}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy, marginTop: 3 }}>{clean(value)}</Text>
            {sub ? <Text style={{ fontSize: 6.8, color: C.mute, marginTop: 2 }}>{clean(sub)}</Text> : null}
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

function Table({ cols, rows, empty = 'No data available.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>
  return (
    <View style={{ marginBottom: 8, borderBottomWidth: 0.6, borderBottomColor: C.line }}>
      <View wrap={false} minPresenceAhead={40} style={{ flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 5, paddingHorizontal: 4 }}>
        {cols.map((c) => <Text key={c.h} style={[st.th, { width: c.w, textAlign: c.a || 'left', paddingHorizontal: 3 }]}>{c.h}</Text>)}
      </View>
      {rows.map((r, i) => (
        <View key={i} wrap={false} style={{ flexDirection: 'row', backgroundColor: i % 2 ? C.soft : '#ffffff', paddingVertical: 4, paddingHorizontal: 4, borderTopWidth: i ? 0.4 : 0, borderTopColor: C.line }}>
          {cols.map((c, j) => {
            const cell = r[j]
            const tone = cell && typeof cell === 'object' ? cell : { v: cell }
            return <Text key={c.h} style={[st.td, { width: c.w, textAlign: c.a || 'left', paddingHorizontal: 3, color: tone.c || C.ink, fontFamily: tone.b ? 'Helvetica-Bold' : 'Helvetica' }]}>{clean(tone.v)}</Text>
          })}
        </View>
      ))}
    </View>
  )
}

function Callout({ title, lines, note }) {
  return (
    <View wrap={false} style={{ backgroundColor: C.goldSoft, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 10, marginBottom: 10 }}>
      <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy, fontSize: 9, marginBottom: 4 }}>{title}</Text>
      {lines.map((l, i) => <Text key={i} style={{ color: C.char, marginBottom: 3 }}>{clean(l)}</Text>)}
      {note ? <Text style={[st.small, { marginTop: 2 }]}>{note}</Text> : null}
    </View>
  )
}

function Bullets({ items }) {
  return items.map((t, i) => (
    <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }} wrap={false}>
      <Text style={{ width: 12, color: C.gold, fontFamily: 'Helvetica-Bold' }}>-</Text>
      <Text style={{ flex: 1, color: C.char }}>{clean(t)}</Text>
    </View>
  ))
}

function HBars({ items }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <View style={{ marginBottom: 8 }}>
      {items.map((i) => (
        <View key={i.label} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ width: 150, fontSize: 8, color: C.char }}>{clean(i.label)}</Text>
          <View style={{ flex: 1, height: 9, backgroundColor: C.soft }}>
            <View style={{ width: `${Math.max(1, (i.value / max) * 100)}%`, height: 9, backgroundColor: i.color || C.navy }} />
          </View>
          <Text style={{ width: 90, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy }}>{clean(i.text)}</Text>
        </View>
      ))}
    </View>
  )
}

function axis(vals) {
  const max = Math.max(1000, ...vals), min = Math.min(0, ...vals)
  return { max, min }
}

function CashChart({ months, insolvent }) {
  const H = 170, padL = 54, padR = 10, padT = 10, padB = 22
  const vals = months.map((x) => x.cash)
  const { max, min } = axis(vals)
  const x = (i) => padL + (i / (months.length - 1)) * (W - padL - padR)
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB)
  const d = months.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(pt.cash).toFixed(1)}`).join(' ')
  const area = `${d} L${x(months.length - 1).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`
  const color = insolvent ? C.red : C.green
  const ticks = [max, (max + min) / 2, min]
  return (
    <View wrap={false} style={{ marginBottom: 8 }}>
      <View style={{ position: 'relative', height: H }}>
        <Svg width={W} height={H}>
          {ticks.map((t) => <Line key={t} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth={0.6} />)}
          <Line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={C.mute} strokeWidth={0.8} strokeDasharray="3 3" />
          <Line x1={x(BOSS_MONTH - 1)} x2={x(BOSS_MONTH - 1)} y1={padT} y2={H - padB} stroke={C.gold} strokeWidth={1} strokeDasharray="3 2" />
          <Path d={area} fill={color} fillOpacity={0.12} />
          <Path d={d} stroke={color} strokeWidth={1.8} fill="none" />
        </Svg>
        {ticks.map((t) => <Text key={t} style={{ position: 'absolute', left: 0, width: padL - 6, top: y(t) - 5, fontSize: 6.8, color: C.mute, textAlign: 'right' }}>{m(t)}</Text>)}
        {months.filter((_, i) => i % 3 === 0 || i === months.length - 1).map((pt) => <Text key={pt.m} style={{ position: 'absolute', top: H - padB + 6, left: x(pt.m - 1) - 15, width: 30, textAlign: 'center', fontSize: 6.8, color: C.mute }}>M{pt.m}</Text>)}
      </View>
      <Text style={st.small}>Forecast cash at month end. Gold dashed line: month {BOSS_MONTH} promo expiration and 25% revenue shortfall. Grey dashed line: $0.</Text>
    </View>
  )
}

function FlowChart({ months }) {
  const H = 150, padL = 54, padB = 22, padT = 8
  const max = Math.max(1000, ...months.map((x) => Math.max(x.revenue, x.expenses + x.debt)))
  const bw = (W - padL - 10) / months.length
  const y = (v) => padT + (1 - v / max) * (H - padT - padB)
  return (
    <View wrap={false} style={{ marginBottom: 8 }}>
      <View style={{ position: 'relative', height: H }}>
        <Svg width={W} height={H}>
          {[0, 0.5, 1].map((f) => <Line key={f} x1={padL} x2={W - 10} y1={y(max * f)} y2={y(max * f)} stroke={C.line} strokeWidth={0.6} />)}
          {months.map((pt, i) => {
            const x0 = padL + i * bw + 2
            const out = pt.expenses + pt.debt
            return [
              <Rect key={`r${i}`} x={x0} y={y(pt.revenue)} width={bw / 2 - 2} height={Math.max(0, y(0) - y(pt.revenue))} fill={C.green} />,
              <Rect key={`e${i}`} x={x0 + bw / 2 - 1} y={y(out)} width={bw / 2 - 2} height={Math.max(0, y(0) - y(out))} fill={C.navy} />,
            ]
          })}
        </Svg>
        {[1, 0.5, 0].map((f) => <Text key={f} style={{ position: 'absolute', left: 0, width: padL - 6, top: y(max * f) - 5, fontSize: 6.8, color: C.mute, textAlign: 'right' }}>{m(max * f)}</Text>)}
        {months.filter((_, i) => i % 3 === 0 || i === months.length - 1).map((pt) => <Text key={pt.m} style={{ position: 'absolute', top: H - padB + 6, left: padL + (pt.m - 1) * bw + bw / 2 - 15, width: 30, textAlign: 'center', fontSize: 6.8, color: C.mute }}>M{pt.m}</Text>)}
      </View>
      <Text style={st.small}>Green: recognized revenue. Navy: operating expenses plus debt service. Forecast values.</Text>
    </View>
  )
}

function RiskMatrix({ risks }) {
  const cell = 46
  const tone = (l, i) => (l * i >= 6 ? '#f6d5d2' : l * i >= 3 ? '#f8ead0' : '#dcefe4')
  return (
    <View wrap={false} style={{ flexDirection: 'row', marginBottom: 10 }}>
      <View>
        {[3, 2, 1].map((l) => (
          <View key={l} style={{ flexDirection: 'row' }}>
            <Text style={{ width: 50, fontSize: 7, color: C.mute, paddingTop: 18 }}>{['', 'Low', 'Medium', 'High'][l]}</Text>
            {[1, 2, 3].map((i) => {
              const here = risks.map((r, k) => ({ ...r, k: k + 1 })).filter((r) => r.likelihood === l && r.impact === i)
              return (
                <View key={i} style={{ width: cell, height: cell, backgroundColor: tone(l, i), borderWidth: 0.8, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy }}>{here.map((r) => r.k).join(', ')}</Text>
                </View>
              )
            })}
          </View>
        ))}
        <View style={{ flexDirection: 'row', marginLeft: 50 }}>
          {['Low', 'Medium', 'High'].map((t) => <Text key={t} style={{ width: cell, textAlign: 'center', fontSize: 7, color: C.mute }}>{t}</Text>)}
        </View>
        <Text style={{ marginLeft: 50, fontSize: 7, color: C.mute, textAlign: 'center', width: cell * 3 }}>Impact</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 16, paddingTop: 4 }}>
        <Text style={{ fontSize: 7, color: C.mute, marginBottom: 4 }}>Rows: likelihood. Columns: impact. Numbers match the risk table below.</Text>
        {risks.slice(0, 8).map((r, k) => <Text key={r.id} style={{ fontSize: 8, color: C.char, marginBottom: 2 }}>{k + 1}. {clean(r.title)} ({r.severity})</Text>)}
      </View>
    </View>
  )
}

const statusTone = (s) => ({ available: C.green, committed: C.amber, conditional: C.amber, declined: C.red, withdrawn: C.red }[s] || C.ink)
const passCell = (ok) => ({ v: ok ? 'Pass' : 'Fail', c: ok ? C.green : C.red, b: true })

const SECTIONS = {
  summary: (r) => {
    const k = r.kpis
    return <>
      <KPIs items={[
        ['Available capital', m(k.available), `of ${m(k.target)} target`, C.green],
        ['Funded', p(k.fundedPct), `${m(k.committed - k.available)} pending`],
        ['Cash runway', `${n0(k.runwayDays)} days`, `Runs out ${k.runOutDate}`],
        ['Capital IQ', `${k.iq}/100`, r.iqFinal ? 'Final score' : 'Provisional', C.blue],
        ['Founder ownership', p(k.founderOwnership), `${k.boardSeats} board seat(s)`],
        ['Month-18 cash', m(k.endCash), 'Forecast', k.endCash < 0 ? C.red : C.green],
        ['Debt outstanding', m(k.debt), `${m(k.promoExposure)} at 0% promo`],
        ['Debt left at M18', m(k.debtRemaining), 'Forecast'],
      ]} />
      <Callout title="Executive commentary" lines={r.commentary} note="Rule-based commentary generated from the game engine's numbers. No AI-generated figures." />
      <H3>Top risks</H3>
      <Table cols={[{ h: 'Risk', w: '40%' }, { h: 'Severity', w: '14%' }, { h: 'Evidence', w: '46%' }]} rows={r.risks.slice(0, 3).map((x) => [x.title, { v: x.severity, c: x.severity === 'High' ? C.red : x.severity === 'Medium' ? C.amber : C.green, b: true }, x.evidence])} empty="No material risks flagged." />
      <H3>Current management priorities</H3>
      <Table cols={[{ h: '#', w: '6%' }, { h: 'Action', w: '44%' }, { h: 'Why', w: '50%' }]} rows={r.actions.slice(0, 3).map((a, i) => [String(i + 1), { v: a.action, b: true }, a.why])} />
      {r.changes ? <>
        <H3>Change since previous snapshot</H3>
        <Table cols={[{ h: 'Metric', w: '40%' }, { h: 'Previous', w: '20%', a: 'right' }, { h: 'Current', w: '20%', a: 'right' }, { h: 'Material', w: '20%', a: 'center' }]}
          rows={r.changes.map((c) => [c.label, fmtMetric(c.from, c.fmt), fmtMetric(c.to, c.fmt), c.material ? { v: 'Yes', c: C.amber, b: true } : 'No'])} />
      </> : <P>No previous snapshot was saved, so period comparison is unavailable.</P>}
    </>
  },
  overview: (r) => {
    const c = r.company, k = r.kpis
    return <>
      <P>{`${c.name} is a simulated ${c.industry.toLowerCase()} startup in FUND YOUR VISION. Revenue is modeled to begin in month ${c.launchMonth} at about ${m(c.revenueBase)} per month and grow about ${p(c.growth, 0)} per month, up to ${m(c.revenueCap)} per month (illustrative industry assumptions).`}</P>
      <Table cols={[{ h: 'Item', w: '45%' }, { h: 'Value', w: '55%', a: 'right' }]} rows={[
        ['Industry', c.industry], ['Mode / scenario', `${r.meta.mode} / ${r.meta.scenario}`], ['Game phase', r.meta.phase],
        ['Funding target', m(c.target)], ['Base operating burn', `${m(c.baseBurn)}/mo`], ['Founder pay', `${m(c.founderPay)}/mo`],
        ['Team cost', `${m(k.squadCost)}/mo`], ['Total monthly burn (model)', `${m(k.monthlyBurn)}/mo`], ['Personal savings available', m(c.savings)],
        ['Priority roles for this industry', c.priorities.join(', ')],
      ]} />
    </>
  },
  health: (r) => {
    const k = r.kpis
    return <>
      <KPIs items={[
        ['Fundability (mock)', `${k.fundability}`, `Tier ${k.tier}`, C.blue], ['Capital IQ', `${k.iq}/100`, r.iqFinal ? 'Final' : 'Provisional'],
        ['Lowest forecast cash', m(k.minCash), k.insolventMonth ? `Insolvent month ${k.insolventMonth}` : 'Solvent all 18 months', k.minCash < 0 ? C.red : C.green],
        ['Capital deployed', UNAVAILABLE, 'Not tracked by the engine'],
      ]} />
      <H3>Sustainability checks</H3>
      <Table cols={[{ h: 'Check', w: '80%' }, { h: 'Result', w: '20%', a: 'center' }]} rows={(r.iq.checks || []).map((c) => [c.label, passCell(c.ok)])} empty="Checks are produced by the forecast scoring model." />
      <H3>Data reconciliation</H3>
      <Table cols={[{ h: 'Reconciliation', w: '55%' }, { h: 'Detail', w: '30%', a: 'right' }, { h: 'Result', w: '15%', a: 'center' }]} rows={r.reconciliation.map((c) => [c.label, c.detail, passCell(c.ok)])} />
    </>
  },
  capital: (r) => {
    const k = r.kpis
    return <>
      <KPIs items={[['Requested', m(k.requested)], ['Committed (incl. available)', m(k.committed)], ['Available', m(k.available), '', C.green], ['Equity raised', m(k.equityRaised)]]} />
      <H3>Available capital by source</H3>
      {r.mix.length ? <HBars items={r.mix.map((x) => ({ label: x.label, value: x.amount, text: `${m(x.amount)} (${p(x.share, 0)})`, color: x.kind === 'vc' ? C.blue : ['credit', 'term', 'partner'].includes(x.kind) ? C.navy : C.green }))} /> : <Empty>No available capital yet.</Empty>}
      <H3>Financing history</H3>
      <Table cols={[{ h: 'Source', w: '30%' }, { h: 'Type', w: '18%' }, { h: 'Requested', w: '14%', a: 'right' }, { h: 'Amount', w: '14%', a: 'right' }, { h: 'Status', w: '12%' }, { h: 'Terms', w: '12%' }]}
        rows={r.sources.map((x) => [x.label, x.type, m(x.requested), m(x.amount), { v: x.status, c: statusTone(x.status), b: true }, x.equityPct ? p(x.equityPct) + ' equity' : x.split ? p(x.split, 0) + ' profit' : x.apr ? p(x.apr) + ' APR' : x.promo ? `0% ${x.promo} mo` : '-'])}
        empty="No financing sources yet." />
    </>
  },
  underwriting: (r) => {
    const u = r.underwriting, pr = u.profile
    return <>
      <P>{u.done ? `Simulated underwriting complete. Mock fundability ${u.fundability} (Tier ${u.tier.tier}, ${u.tier.label}). This is a game score, not an Experian or lender decision.` : `Simulated underwriting has not been run. Current mock fundability is ${u.fundability} (Tier ${u.tier.tier}).`}</P>
      <Table cols={[{ h: 'Credit profile input (illustrative)', w: '60%' }, { h: 'Value', w: '40%', a: 'right' }]} rows={[
        ['FICO (with event effects)', String(pr.fico)], ['Revolving utilization', `${pr.utilization}%`], ['Hard inquiries incl. applications', String(pr.inquiries)],
        ['Oldest account', `${pr.oldestYears} years`], ['Open accounts', String(pr.openAccounts)], ['Annual personal income', m(pr.income)], ['Recent derogatory mark', pr.derogatory ? 'Yes' : 'No'],
      ]} />
      <H3>Applications and outcomes</H3>
      <Table cols={[{ h: 'Application', w: '32%' }, { h: 'Requested', w: '14%', a: 'right' }, { h: 'Approved', w: '14%', a: 'right' }, { h: 'Status', w: '13%' }, { h: 'Reason', w: '27%' }]}
        rows={u.applications.map((a) => [a.label, m(a.requested), m(a.amount), { v: a.status, c: statusTone(a.status), b: true }, a.reason])} empty="No credit or loan applications yet." />
    </>
  },
  cashflow: (r) => {
    const k = r.kpis, f = r.forecast
    return <>
      <KPIs items={[['Cash available now', m(k.cash), 'Historical (ledger)'], ['Monthly burn', m(k.monthlyBurn), 'Model'], ['Runway', `${n0(k.runwayDays)} days`, `Runs out ${k.runOutDate}`], ['Insolvency month', f.insolventMonth ? `Month ${f.insolventMonth}` : 'None', 'Forecast', f.insolventMonth ? C.red : C.green]]} />
      <CashChart months={f.months} insolvent={f.insolventMonth} />
      <P>{`Basis: ${f.basis} Historical figures are the ledger as of the report date; months 1-${MONTHS} are forecast.`}</P>
    </>
  },
  revenue: (r) => {
    const f = r.forecast
    return <>
      <FlowChart months={f.months} />
      <Table cols={[{ h: 'Month', w: '10%' }, { h: 'Revenue', w: '18%', a: 'right' }, { h: 'Expenses', w: '18%', a: 'right' }, { h: 'Debt service', w: '18%', a: 'right' }, { h: 'Profit share', w: '16%', a: 'right' }, { h: 'End cash', w: '20%', a: 'right' }]}
        rows={f.months.map((x, i) => [`M${x.m}`, m(x.revenue), m(x.expenses), m(x.debt), m(r.forecast.months[i]?.share ?? null), { v: m(x.cash), c: x.cash < 0 ? C.red : C.ink, b: x.m === MONTHS }])} />
      <P>All monthly values are forecasts from the deterministic engine.</P>
    </>
  },
  debt: (r) => {
    const k = r.kpis
    return <>
      <KPIs items={[['Debt outstanding', m(k.debt)], ['0% promo exposure', m(k.promoExposure), `Expires near month ${BOSS_MONTH}`, k.promoExposure ? C.amber : C.green], ['Debt left at M18', m(k.debtRemaining), 'Forecast'], ['Post-promo APR', p(POST_PROMO_APR, 0), 'Model assumption']]} />
      <H3>Debt instruments</H3>
      <Table cols={[{ h: 'Instrument', w: '30%' }, { h: 'Balance', w: '15%', a: 'right' }, { h: 'Rate', w: '20%' }, { h: 'Payment / mo', w: '15%', a: 'right' }, { h: 'Basis', w: '20%' }]}
        rows={r.debt.map((d) => [d.label, m(d.balance), d.promoMonths ? `0% for ${d.promoMonths} mo, then ${p(d.postPromoApr, 0)}` : `${p(d.apr)} fixed`, m(d.payment), d.paymentBasis])} empty="No debt outstanding." />
      <H3>Scheduled debt service (forecast)</H3>
      <Table cols={[{ h: 'Month', w: '20%' }, { h: 'Debt service', w: '40%', a: 'right' }, { h: 'Promo balance remaining', w: '40%', a: 'right' }]}
        rows={r.forecast.months.map((x) => [`M${x.m}`, m(x.debt), m(x.promoBalance)])} />
    </>
  },
  equity: (r) => {
    const e = r.equity
    return <>
      <KPIs items={[['Founder ownership', p(e.founder), '', C.green], ['Investor ownership', p(1 - e.founder)], ['Board seats given', String(e.seats)], ['Partner profit share', p(e.partnerShare, 0), 'Of positive profit']]} />
      <HBars items={[{ label: 'Founder', value: e.founder, text: p(e.founder), color: C.green }, { label: 'Investors', value: 1 - e.founder, text: p(1 - e.founder), color: C.blue }]} />
      <Table cols={[{ h: 'Investor round', w: '40%' }, { h: 'Amount', w: '20%', a: 'right' }, { h: 'Equity', w: '20%', a: 'right' }, { h: 'Status', w: '20%' }]}
        rows={e.investors.map((x) => [x.label, m(x.amount), p(x.equityPct), { v: x.status, c: statusTone(x.status), b: true }])} empty="No equity investors. The founder owns 100%." />
      <P>Governance: rounds of 15% or more are modeled with one board seat. Real terms vary by deal.</P>
    </>
  },
  team: (r) => <>
    <Table cols={[{ h: 'Role', w: '24%' }, { h: 'Area', w: '18%' }, { h: 'Cost / mo', w: '14%', a: 'right' }, { h: 'Priority', w: '10%', a: 'center' }, { h: 'Modeled effect', w: '34%' }]}
      rows={r.team.map((t) => [t.name, t.area, m(t.cost), t.priority ? { v: 'Yes', c: C.green, b: true } : 'No', t.effect])} empty="No team members hired." />
    <H3>Monthly operating cost build-up</H3>
    <Table cols={[{ h: 'Component', w: '60%' }, { h: 'Amount / mo', w: '40%', a: 'right' }]} rows={[['Base operating burn (setup)', m(r.company.baseBurn)], ['Founder pay', m(r.company.founderPay)], ['Team cost', m(r.kpis.squadCost)], [{ v: 'Total modeled burn (after cuts and events)', b: true }, { v: m(r.kpis.monthlyBurn), b: true }]]} />
  </>,
  risks: (r) => <>
    {r.risks.length ? <RiskMatrix risks={r.risks} /> : null}
    <Table cols={[{ h: '#', w: '5%' }, { h: 'Risk', w: '25%' }, { h: 'Severity', w: '11%' }, { h: 'Evidence', w: '43%' }, { h: 'Lens', w: '16%' }]}
      rows={r.risks.map((x, i) => [String(i + 1), { v: x.title, b: true }, { v: x.severity, c: x.severity === 'High' ? C.red : x.severity === 'Medium' ? C.amber : C.green, b: true }, x.evidence, x.owner])} empty="No material risks flagged by the model." />
  </>,
  forecast: (r) => <>
    <CashChart months={r.forecast.months} insolvent={r.forecast.insolventMonth} />
    <P>{r.forecast.moves.length ? `Turnaround moves applied: ${r.forecast.moves.join(', ')}.` : 'No turnaround moves applied in this forecast.'}</P>
    <H3>Sensitivity: revenue</H3>
    <Table cols={[{ h: 'Scenario', w: '34%' }, { h: 'Month-18 cash', w: '22%', a: 'right' }, { h: 'Lowest cash', w: '22%', a: 'right' }, { h: 'Runs out', w: '22%', a: 'right' }]}
      rows={r.sensitivity.map((x) => [x.label, { v: m(x.endCash), c: x.endCash < 0 ? C.red : C.ink }, m(x.minCash), x.insolventMonth ? `Month ${x.insolventMonth}` : 'No'])} />
    <P>Sensitivity multiplies modeled revenue by 0.8 and 1.2 and reruns the same engine forecast.</P>
  </>,
  alternatives: (r) => <>
    <P>Each strategy reruns the engine forecast with that Final Boss turnaround move applied by itself (and the chosen combination, if any). These are simulated outcomes, not offers.</P>
    <Table cols={[{ h: 'Strategy', w: '32%' }, { h: 'IQ', w: '8%', a: 'right' }, { h: 'Outcome', w: '12%' }, { h: 'M18 cash', w: '14%', a: 'right' }, { h: 'Lowest', w: '12%', a: 'right' }, { h: 'Runs out', w: '10%', a: 'right' }, { h: 'Debt left', w: '12%', a: 'right' }]}
      rows={r.alternatives.map((a) => [{ v: a.label, b: a.id === 'chosen' }, String(a.score), { v: a.outcome, c: a.outcome === 'victory' ? C.green : a.outcome === 'failure' ? C.red : C.amber, b: true }, m(a.endCash), m(a.minCash), a.insolventMonth ? `M${a.insolventMonth}` : 'No', m(a.debtRemaining)])} />
  </>,
  iq: (r) => <>
    <KPIs items={[['Startup Capital IQ', `${r.iq.score}/100`, r.iqFinal ? 'Final' : 'Provisional', C.blue], ['Outcome', clean(r.iq.outcome || UNAVAILABLE), ''], ['Founder level', clean(r.level), ''], ['Medals', String(r.achievements.length), '']]} />
    <HBars items={r.iq.breakdown.map((b) => ({ label: b.label, value: b.pts / b.max, text: `${b.pts} / ${b.max}`, color: b.pts / b.max >= 0.75 ? C.green : b.pts / b.max >= 0.4 ? C.amber : C.red }))} />
    <H3>Achievements earned this run</H3>
    <Table cols={[{ h: 'Medal', w: '30%' }, { h: 'Rarity', w: '15%' }, { h: 'How it was earned', w: '55%' }]} rows={r.achievements.map((a) => [a.name, a.rarity, a.desc])} empty="No medals earned yet." />
  </>,
  recommendations: (r) => <>
    <P>Recommendations are produced by fixed rules that read the engine's numbers. Each lists the agent lens that raised it.</P>
    <Table cols={[{ h: 'Priority', w: '10%', a: 'center' }, { h: 'Recommendation', w: '34%' }, { h: 'Evidence / rationale', w: '40%' }, { h: 'Lens', w: '16%' }]}
      rows={r.actions.map((a) => [{ v: `P${a.priority}`, c: a.priority === 1 ? C.red : a.priority === 2 ? C.amber : C.green, b: true }, { v: a.action, b: true }, a.why, a.owner])} />
  </>,
  actions: (r) => <>
    {r.actions.map((a, i) => (
      <View key={i} wrap={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><Text style={{ color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{i + 1}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>{clean(a.action)}</Text>
          <Text style={{ color: C.char }}>{clean(a.why)} Owner: {a.owner}.</Text>
        </View>
      </View>
    ))}
    <H3>Upcoming milestones</H3>
    <Bullets items={r.milestones} />
  </>,
  timeline: (r) => <>
    <P>The log is kept in this browser only. Nothing is monitored while the app is closed.</P>
    <H3>Events and responses</H3>
    <Table cols={[{ h: 'Event', w: '45%' }, { h: 'Response chosen', w: '55%' }]} rows={r.events.map((e) => [e.title, e.choice])} empty="No events resolved yet." />
    <H3>Decision log (oldest first)</H3>
    <Table cols={[{ h: '#', w: '8%' }, { h: 'Entry', w: '92%' }]} rows={r.timeline.slice(-80).map((t) => [String(t.n), t.text])} empty="No decisions recorded yet." />
  </>,
  methodology: (r) => <>
    <H3>Assumptions</H3>
    <Bullets items={[
      `Forecast horizon ${MONTHS} months. At month ${BOSS_MONTH}, 0% promotional periods end and revenue is modeled 25% below plan.`,
      `After a promo ends, balances accrue about ${p(POST_PROMO_APR, 0)} APR with interest plus 3% principal payments; during promo, 1% minimum payments.`,
      `Term loans: ${p(TERM_APR)} APR (or ${p(TERM_APR_CONDITIONAL)} conditional), ${TERM_MONTHS}-month amortization.`,
      'Committed capital is excluded from cash until it lands; the Final Boss lands all committed funds in month 1.',
      'Industry revenue curves, valuations, credit limits and fundability scores are illustrative game assumptions.',
      'Capital deployed is not tracked by the engine and is reported as Unavailable.',
    ]} />
    <H3>Methodology</H3>
    <Bullets items={[
      'All numbers come from the deterministic FUND YOUR VISION engine (totals, ownership, forecast and scoring functions).',
      'Commentary, risks, recommendations and agent findings are fixed rules applied to those numbers. No AI model generates figures.',
      'Alternatives and sensitivities rerun the same engine forecast with one input changed.',
      'Reconciliation checks confirm ledger totals, debt, ownership, IQ and chart values agree before the report is rendered.',
    ]} />
    <H3>Disclosures</H3>
    <P>Educational simulation. This report is not a verified financial statement, credit decision, or financing offer. Scores, approvals, limits and partner profiles are simulated and are not Experian, lender or investor decisions. 0% intro APR periods expire; business credit usually requires a personal guarantee.</P>
    <P>{`Report ${r.meta.id} - version ${r.meta.version} - generated ${date(r.meta.generatedAt)} - seed ${r.meta.seed}.`}</P>
  </>,
}

function fmtMetric(v, f) {
  if (v == null) return UNAVAILABLE
  return f === 'money' ? m(v) : f === 'pct' ? p(v) : n0(v)
}

function Cover({ r, type, logo }) {
  return (
    <Page size="LETTER" style={{ backgroundColor: '#0b1428', padding: 0, fontFamily: 'Helvetica' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: C.gold }} />
      <View style={{ paddingHorizontal: 60, paddingTop: 70, alignItems: 'center' }}>
        {logo ? <Image src={logo} style={{ width: 230 }} /> : null}
        <Text style={{ marginTop: 26, color: C.gold, fontSize: 9, letterSpacing: 4, fontFamily: 'Helvetica-Bold' }}>EXECUTIVE REPORT</Text>
        <Text style={{ marginTop: 10, color: '#ffffff', fontSize: 26, fontFamily: 'Helvetica-Bold', textAlign: 'center', lineHeight: 1.2 }}>{type.name}</Text>
        <View style={{ width: 60, height: 1.5, backgroundColor: C.gold, marginVertical: 16 }} />
        <Text style={{ color: '#e5e7eb', fontSize: 15, fontFamily: 'Helvetica-Bold' }}>{clean(r.company.name)}</Text>
        <Text style={{ color: '#9aa4b2', fontSize: 10, marginTop: 4 }}>{clean(r.company.industry)} - {clean(r.meta.scenario)}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 60, left: 60, right: 60 }}>
        <View style={{ flexDirection: 'row', borderTopWidth: 0.6, borderTopColor: '#2a3a5c', paddingTop: 12 }}>
          {[['Report ID', r.meta.id], ['Version', r.meta.version], ['Generated', date(r.meta.generatedAt)]].map(([k, v]) => (
            <View key={k} style={{ flex: 1 }}>
              <Text style={{ color: '#7d8799', fontSize: 7, letterSpacing: 1.5 }}>{k.toUpperCase()}</Text>
              <Text style={{ color: '#e5e7eb', fontSize: 8.5, marginTop: 3 }}>{clean(v)}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: '#7d8799', fontSize: 7.5, marginTop: 16, lineHeight: 1.5 }}>Prepared with FUND YOUR VISION, powered by NationwideBusinessFunding.com - Fractional Chief Capital Officer Platform. Confidential. Educational simulation: figures are simulated and projected, not verified financial statements or financing offers.</Text>
      </View>
    </Page>
  )
}

export default function ReportDoc({ report: r, typeId = 'all', logo, pages = {}, collect = {} }) {
  const type = reportType(typeId)
  const ids = type.sections
  return (
    <Document title={`${type.name} - ${clean(r.company.name)}`} author="FUND YOUR VISION" subject="Educational simulation report" creator="FUND YOUR VISION" producer="FUND YOUR VISION">
      <Cover r={r} type={type} logo={logo} />
      <Page size="LETTER" style={st.page}>
        <Text style={st.kicker}>Contents</Text>
        <Text style={st.h1}>Table of Contents</Text>
        <View style={st.rule} />
        {ids.map((id, i) => (
          <View key={id} style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 9 }}>
            <Text style={{ width: 26, color: C.gold, fontFamily: 'Helvetica-Bold' }}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={{ color: C.navy }}>{SECTION_TITLE[id]}</Text>
            <View style={{ flex: 1, borderBottomWidth: 0.8, borderBottomColor: '#c9ced6', borderBottomStyle: 'dotted', marginHorizontal: 6, marginBottom: 3 }} />
            <Text style={{ width: 24, textAlign: 'right', color: C.navy, fontFamily: 'Helvetica-Bold' }}>{pages[id] ?? ''}</Text>
          </View>
        ))}
        <View style={{ marginTop: 18 }}>
          <Callout title="How to read this report" lines={['Historical figures are the game ledger as of the generation time. Forecast figures are projections from the deterministic engine. "Unavailable" means the engine does not track that metric; no estimate is substituted.']} />
        </View>
        <Footer r={r} type={type} />
      </Page>
      {ids.map((id, i) => (
        <Page key={id} size="LETTER" style={st.page} wrap>
          <View fixed style={st.header}><Text>FUND YOUR VISION - {type.name}</Text><Text>{clean(r.company.name)}</Text></View>
          <Section id={id} n={i} onPage={(sid, pg) => { collect[sid] = pg }}>{SECTIONS[id](r)}</Section>
          <Footer r={r} type={type} />
        </Page>
      ))}
    </Document>
  )
}

function Footer({ r }) {
  return (
    <View fixed style={st.footer}>
      <Text>Confidential - Educational simulation - {r.meta.version} - {r.meta.generatedAt.slice(0, 10)}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  )
}
