import { CARDS, PARTNERS, DEFAULT_PROFILE, partnerChecks, partnerQualifies, clamp, estimatedLimit, fmt, fmtK, fundabilityScore } from './game'
import { INDUSTRIES, SQUAD, SQUAD_SLOTS, EVENT_IDS, DEMO_SCENARIOS, TOURNAMENT_SCENARIOS } from './data'

export const findScenario = (id) => DEMO_SCENARIOS.find((d) => d.id === id) || TOURNAMENT_SCENARIOS.find((d) => d.id === id)

export const MONTHS = 18
export const BOSS_MONTH = 12
export const MIN_EVENTS = 3
export const POST_PROMO_APR = 0.24
export const TERM_APR = 0.11
export const TERM_APR_CONDITIONAL = 0.17
export const TERM_MONTHS = 36

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(str) {
  let h = 2166136261
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function shuffle(list, seed) {
  const rnd = mulberry32(seed)
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function amortizedPayment(principal, apr, months) {
  if (principal <= 0) return 0
  const r = apr / 12
  return r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months)
}

const EMPTY_MODS = {
  revenueMult: 1, burnMult: 1, burnDelta: 0, launchDelay: 0, oneTimeCosts: 0, cashBonus: 0,
  promoShift: 0, refiOffer: null, ficoDelta: 0, extraInquiries: 0, disputeFlag: false, installments: [],
}

export function initialState(overrides = {}) {
  return {
    phase: 'setup',
    mode: 'arcade',
    scenarioId: null,
    seed: 0,
    seq: 0,
    startup: { name: '', industry: 'saas', target: 150000, monthlyBurn: INDUSTRIES.saas.burn, founderPay: 3000, savings: 25000 },
    profile: { ...DEFAULT_PROFILE },
    startDays: 27,
    underwritten: false,
    funding: [],
    squad: [],
    deck: [],
    activeEvent: null,
    resolvedEvents: [],
    actions: 0,
    mods: { ...EMPTY_MODS, installments: [] },
    log: [],
    result: null,
    bossMoves: [],
    actionLog: [],
    achievements: [],
    level: -1,
    ...overrides,
  }
}

export const has = (s, role) => s.squad.includes(role)
const pctOfTarget = (s, p) => Math.round((s.startup.target * p) / 500) * 500

export function liveProfile(s) {
  const applications = s.funding.filter((f) => f.inquiry).length
  return {
    ...s.profile,
    fico: clamp(s.profile.fico + s.mods.ficoDelta, 300, 850),
    inquiries: s.profile.inquiries + applications + s.mods.extraInquiries,
  }
}
export const liveScore = (s) => fundabilityScore(liveProfile(s))

export function totals(s) {
  let requested = 0, committed = 0, available = 0, cash = 0, debt = 0, equity = 0, freed = 0
  for (const f of s.funding) {
    requested += f.requested
    if (f.status === 'committed' || f.status === 'available') committed += f.amount
    if (f.status === 'available') {
      available += f.amount
      if (f.type === 'cut') freed += f.amount
      else cash += f.amount
      if (f.type === 'credit' || f.type === 'term' || f.type === 'partner') debt += f.amount
      if (f.type === 'vc') equity += f.amount
    }
  }
  return { requested, committed, available, cash, debt, equity, freed }
}

export function ownership(s) {
  let own = 1, seats = 0
  for (const f of s.funding) {
    if (f.type === 'vc' && f.status !== 'declined' && f.status !== 'conditional' && f.status !== 'withdrawn') {
      own *= 1 - f.equityPct
      if (f.equityPct >= 0.15) seats += 1
    }
  }
  return { founder: own, seats }
}

export function monthlyBurn(s) {
  const cut = s.funding.some((f) => f.type === 'cut' && f.status === 'available') ? 0.85 : 1
  const ops = has(s, 'operator') ? 0.95 : 1
  const squadCost = s.squad.reduce((a, id) => a + SQUAD.find((r) => r.id === id).cost, 0)
  return (s.startup.monthlyBurn * cut * ops + (s.startup.founderPay || 0)) * s.mods.burnMult + s.mods.burnDelta + squadCost
}

export const teamVariance = (s, role) => 0.75 + 0.5 * mulberry32((s.seed || 1) + (role === 'marketing' ? 11 : 23))()

export function projectedRevenue(s, m) {
  const ind = INDUSTRIES[s.startup.industry]
  const delay = Math.max(0, s.mods.launchDelay - (has(s, 'operator') ? 1 : 0))
  const start = ind.launch + delay
  if (m < start) return 0
  let mult = s.mods.revenueMult
  const ramp = clamp((m - start + 1) / 3, 0, 1)
  if (has(s, 'marketing')) mult *= 1 + 0.2 * ramp * teamVariance(s, 'marketing')
  if (has(s, 'sales')) mult *= 1 + 0.15 * ramp * teamVariance(s, 'sales')
  if (s.funding.some((f) => f.type === 'cut' && f.status === 'available')) mult *= 0.92
  return Math.min(ind.cap, ind.base * ind.growth ** (m - start)) * mult
}

function log(s, text, tone = 'neon') {
  return { ...s, seq: s.seq + 1, log: [{ id: `l${s.seq}`, text, tone }, ...s.log].slice(0, 200) }
}

function creditCap(s) {
  return Math.max(25000, s.profile.income) * (has(s, 'cco') ? 1.1 : 1)
}

export function creditUsed(s) {
  return s.funding.filter((f) => f.type === 'credit' && f.status !== 'declined').reduce((a, f) => a + f.amount, 0)
}

export function cardDecision(s, card) {
  const score = liveScore(s)
  const room = Math.max(0, creditCap(s) - creditUsed(s))
  const limit = Math.min(room, Math.round(estimatedLimit(score, s.profile.income, card) * (has(s, 'cco') ? 1.1 : 1) / 500) * 500)
  if (room <= 0) return { status: 'declined', limit: 0, reason: 'Aggregate exposure cap reached (100% of income)' }
  if (score >= card.req) return { status: 'approved', limit, reason: `Fundability ${score} ≥ ${card.req}` }
  if (score >= card.req - 8) return { status: 'conditional', limit: Math.round(limit * 0.6 / 500) * 500, reason: `Fundability ${score} within 8 of ${card.req}: income verification required` }
  return { status: 'declined', limit: 0, reason: `Fundability ${score} < ${card.req - 8}` }
}

export function termDecision(s, amount) {
  const score = liveScore(s)
  const max = Math.min(250000, s.startup.target * 0.6) * (has(s, 'cco') ? 1.1 : 1)
  const amt = Math.min(amount, max)
  if (score >= 70 && !s.profile.derogatory) return { status: 'approved', amount: amt, apr: TERM_APR, reason: `Fundability ${score} ≥ 70` }
  if (score >= 55) return { status: 'conditional', amount: amt, apr: TERM_APR_CONDITIONAL, reason: `Fundability ${score} (55–69): collateral or co-signer required` }
  return { status: 'declined', amount: 0, reason: `Fundability ${score} < 55` }
}

export function vcTerms(s, amount) {
  const ind = INDUSTRIES[s.startup.industry]
  const amt = Math.min(amount, ind.vcCap)
  const pre = ind.preMoney * (has(s, 'attorney') ? 1.2 : 1)
  return { amount: amt, equityPct: amt / (pre + amt), preMoney: pre }
}

export function prepayMax(s) {
  return Math.round((projectedRevenue({ ...s, mods: { ...s.mods, launchDelay: 0 } }, INDUSTRIES[s.startup.industry].launch + 5) * 3 * (has(s, 'sales') ? 1 : 0.5)) / 500) * 500
}

function afterAction(s) {
  const actions = s.actions + 1
  let next = { ...s, actions }
  if (actions % 2 === 0 && !next.activeEvent) next = drawEvent(next)
  return next
}

export function drawEvent(s) {
  if (s.activeEvent || s.deck.length === 0) return s
  const [id, ...rest] = s.deck
  return { ...s, activeEvent: id, deck: rest }
}

function tick(s) {
  const funding = s.funding.map((f) => {
    if (f.status !== 'committed') return f
    const turns = f.turns - 1
    return turns <= 0 ? { ...f, turns: 0, status: 'available' } : { ...f, turns }
  })
  const landed = funding.filter((f, i) => f.status === 'available' && s.funding[i].status === 'committed')
  let next = { ...s, funding }
  for (const f of landed) next = log(next, `Funds available: ${f.label}`, 'neon')
  return next
}

function addFunding(s, entry) {
  return { ...s, seq: s.seq + 1, funding: [...s.funding, { id: `f${s.seq}`, turns: 0, ...entry }] }
}

export function reducer(s, a) {
  switch (a.type) {
    case 'SETUP': {
      if (s.phase !== 'setup') return s
      const patch = s.mode === 'tournament' ? { name: a.patch.name ?? s.startup.name } : a.patch
      return { ...s, startup: { ...s.startup, ...patch } }
    }
    case 'PROFILE': return s.phase !== 'setup' || s.mode === 'tournament' ? s : { ...s, profile: { ...s.profile, ...a.patch } }
    case 'SET_MODE': {
      const base = initialState({ mode: a.mode, startDays: s.startDays })
      return a.mode === 'tournament' ? reducer(base, { type: 'LOAD_SCENARIO', id: TOURNAMENT_SCENARIOS[0].id }) : base
    }
    case 'START_DAYS': return { ...s, startDays: a.value }
    case 'LOAD_SCENARIO': {
      const sc = findScenario(a.id)
      if (!sc || (s.mode === 'tournament') !== TOURNAMENT_SCENARIOS.includes(sc)) return s
      return initialState({ mode: s.mode, scenarioId: sc.id, startup: { ...sc.startup }, profile: { ...sc.profile }, startDays: s.startDays })
    }
    case 'START': {
      if (s.phase !== 'setup') return s
      if (s.mode === 'tournament' && !s.scenarioId) return s
      const sc = findScenario(s.scenarioId)
      const seed = sc ? sc.seed : hashSeed(`${s.startup.name}|${s.startup.industry}|${s.startup.target}`)
      const name = s.startup.name.trim() || 'Stealth Startup'
      return log({ ...s, phase: 'fund', seed, deck: shuffle(EVENT_IDS, seed), startup: { ...s.startup, name } }, `${name} is live. Target ${'$' + s.startup.target.toLocaleString()}.`, 'cyan')
    }
    case 'UNDERWRITE': return log({ ...s, underwritten: true }, `Underwriting complete: fundability ${liveScore(s)}`, 'cyan')
    case 'HIRE': {
      if (has(s, a.role) || s.squad.length >= SQUAD_SLOTS) return s
      let next = { ...s, squad: [...s.squad, a.role] }
      if (a.role === 'attorney') next = { ...next, funding: next.funding.map((f) => (f.type === 'partner' ? { ...f, agreement: true } : f)) }
      return log(next, `Hired: ${SQUAD.find((r) => r.id === a.role).name}`, 'gold')
    }
    case 'FIRE': return { ...s, squad: s.squad.filter((r) => r !== a.role) }
    case 'APPLY_CARD': {
      if (!s.underwritten || s.funding.some((f) => f.cardId === a.cardId)) return s
      const card = CARDS.find((c) => c.id === a.cardId)
      const d = cardDecision(s, card)
      let next = addFunding(s, {
        type: 'credit', cardId: card.id, label: card.name, requested: Math.max(card.maxLimit, d.limit), amount: d.limit, inquiry: true,
        status: d.status === 'approved' ? 'available' : d.status, promo: card.promo, reason: d.reason,
        requirement: d.status === 'conditional' ? 'Income verification (2 bank statements)' : null,
      })
      next = log(next, `${card.name}: ${d.status.toUpperCase()}${d.limit ? ` $${d.limit.toLocaleString()}` : ''}`, d.status === 'approved' ? 'neon' : d.status === 'conditional' ? 'gold' : 'hot')
      return afterAction(next)
    }
    case 'PLAY': return afterAction(playCard(s, a))
    case 'RESOLVE_CONDITION': {
      const f = s.funding.find((x) => x.id === a.id)
      if (!f || f.status !== 'conditional') return s
      if (a.choice === 'decline') return log({ ...s, funding: s.funding.map((x) => (x.id === a.id ? { ...x, status: 'declined', amount: 0 } : x)) }, `Declined offer: ${f.label}`, 'hot')
      const turns = f.type === 'vc' ? 2 : 1
      const patch = { status: 'committed', turns, requirement: null }
      if (f.type === 'partner' && a.choice === 'handshake') patch.agreement = false
      if (f.type === 'partner' && a.choice === 'agreement') patch.agreement = true
      return log({ ...s, funding: s.funding.map((x) => (x.id === a.id ? { ...x, ...patch } : x)) }, `Accepted: ${f.label}. Funds land in ${turns} turn${turns > 1 ? 's' : ''}.`, 'gold')
    }
    case 'DRAW_EVENT': return drawEvent(s)
    case 'RESOLVE_EVENT': {
      if (!s.activeEvent) return s
      const ev = EVENTS[s.activeEvent]
      const choice = ev.choices(s).find((c) => c.id === a.choice)
      if (!choice) return s
      let next = choice.apply(s)
      next = { ...next, activeEvent: null, resolvedEvents: [...next.resolvedEvents, { id: ev.id, choice: choice.id }] }
      next = log(next, `${ev.title}: ${choice.label}`, 'gold')
      return tick(next)
    }
    case 'START_BOSS': {
      if (totals(s).available < s.startup.target) return s
      if (s.resolvedEvents.length < MIN_EVENTS) return drawEvent(s)
      const pending = s.funding.filter((f) => f.status === 'committed')
      const landed = { ...s, phase: 'boss', bossMoves: [], funding: s.funding.map((f) => (f.status === 'committed' ? { ...f, status: 'available', turns: 0 } : f)) }
      return pending.length ? log(landed, `Committed funds landed in month 1: ${pending.map((f) => f.label).join(', ')}`, 'neon') : landed
    }
    case 'BOSS_MOVE': {
      if (s.phase !== 'boss' || s.bossMoves.includes(a.option) || s.bossMoves.length >= bossLimit(s)) return s
      const o = bossOptions(s).find((x) => x.id === a.option)
      return !o || o.disabled ? s : { ...s, bossMoves: [...s.bossMoves, a.option] }
    }
    case 'BOSS_UNDO': return s.phase === 'boss' && s.bossMoves.length ? { ...s, bossMoves: s.bossMoves.slice(0, -1) } : s
    case 'BOSS': {
      if (s.phase !== 'boss') return s
      const moves = s.bossMoves
      const forecast = runForecast(s, moves)
      const result = scoreGame(s, forecast, moves)
      const baseline = scoreGame(s, runForecast(s, []), [])
      return { ...s, phase: 'results', result: { moves, forecast, baselineOutcome: baseline.outcome, ...result } }
    }
    case 'RESTART': return initialState({ mode: s.mode, startup: s.startup, profile: s.profile, scenarioId: s.scenarioId, startDays: s.startDays })
    case 'RESET': return initialState({ startDays: s.startDays })
    default: return s
  }
}

function playCard(s, a) {
  switch (a.card) {
    case 'term': {
      if (!s.underwritten || s.funding.some((f) => f.type === 'term' && f.status !== 'declined')) return s
      const d = termDecision(s, a.amount)
      const next = addFunding(s, {
        type: 'term', label: 'Business Term Loan', requested: a.amount, amount: d.amount, apr: d.apr, inquiry: false,
        status: d.status === 'approved' ? 'committed' : d.status, turns: 1, reason: d.reason,
        requirement: d.status === 'conditional' ? 'Collateral or co-signer (17% APR)' : null,
      })
      return log(next, `Term loan: ${d.status.toUpperCase()} ${d.amount ? '$' + Math.round(d.amount).toLocaleString() : ''}`, d.status === 'declined' ? 'hot' : d.status === 'conditional' ? 'gold' : 'neon')
    }
    case 'savings': {
      const used = s.funding.filter((f) => f.type === 'savings').reduce((x, f) => x + f.amount, 0)
      const amt = Math.min(a.amount, s.startup.savings - used)
      if (amt <= 0) return s
      return log(addFunding(s, { type: 'savings', label: 'Personal Savings', requested: amt, amount: amt, status: 'available' }), `Committed $${amt.toLocaleString()} of personal savings`, 'gold')
    }
    case 'vc': {
      if (s.funding.some((f) => f.type === 'vc' && f.status !== 'declined')) return s
      const t = vcTerms(s, a.amount)
      return log(addFunding(s, {
        type: 'vc', label: 'Angel / VC Round', requested: a.amount, amount: t.amount, equityPct: t.equityPct, status: 'conditional', negotiated: has(s, 'attorney'),
        requirement: `Term sheet: ${(t.equityPct * 100).toFixed(1)}% equity at $${Math.round(t.preMoney / 1000)}K pre-money${t.equityPct >= 0.15 ? ' + 1 board seat' : ''}`,
        reason: 'Term sheet issued; diligence takes 2 turns',
      }), `Term sheet received: $${t.amount.toLocaleString()} for ${(t.equityPct * 100).toFixed(1)}%`, 'gold')
    }
    case 'partner': {
      const p = PARTNERS.find((x) => x.id === a.partnerId)
      const count = s.funding.filter((f) => f.type === 'partner' && f.status !== 'declined').length
      if (!p || count >= 2 || s.funding.some((f) => f.partnerId === p.id)) return s
      if (!partnerQualifies(p)) return log(s, `${p.name} doesn't qualify as a credit partner: ${partnerChecks(p).filter((c) => !c.ok).map((c) => c.label).join(', ')}`, 'hot')
      return log(addFunding(s, {
        type: 'partner', partnerId: p.id, label: `Capital Partner: ${p.name}`, requested: p.capacity, amount: p.capacity, split: p.split / 100,
        status: has(s, 'attorney') ? 'committed' : 'conditional', turns: 1, agreement: has(s, 'attorney'), promo: 12,
        requirement: has(s, 'attorney') ? null : 'Written guarantee & partnership agreement',
        reason: has(s, 'attorney') ? 'Attorney papered the agreement' : 'Needs an agreement',
      }), `Matched with ${p.name}: $${p.capacity.toLocaleString()} capacity for ${p.split}% profit share`, 'cyan')
    }
    case 'prepay': {
      if (s.funding.some((f) => f.type === 'prepay')) return s
      const amt = Math.min(a.amount, prepayMax(s))
      if (amt <= 0) return s
      return log(addFunding(s, { type: 'prepay', label: 'Customer Prepayments', requested: a.amount, amount: amt, status: 'available' }), `Pre-sold $${amt.toLocaleString()} to early customers`, 'neon')
    }
    case 'cut': {
      if (s.funding.some((f) => f.type === 'cut')) return s
      const amt = Math.round(s.startup.monthlyBurn * 0.15 * 12)
      return log(addFunding(s, { type: 'cut', label: 'Expense Reduction (freed capital)', requested: amt, amount: amt, status: 'available' }), `Cut burn 15%: $${amt.toLocaleString()} freed over 12 months`, 'neon')
    }
    default: return s
  }
}

const mod = (s, patch) => ({ ...s, mods: { ...s.mods, ...patch } })
const mult = (s, key, f) => mod(s, { [key]: s.mods[key] * f })
const cost = (s, amount) => mod(s, { oneTimeCosts: s.mods.oneTimeCosts + amount })
const promoDebt = (s) => s.funding.filter((f) => (f.type === 'credit' || f.type === 'partner') && f.status === 'available').reduce((a, f) => a + f.amount, 0)

function addCredit(s, amount, label) {
  if (amount <= 0) return s
  return addFunding(s, { type: 'credit', label, requested: amount, amount, status: 'available', promo: 12, inquiry: true })
}

export const EVENTS = {
  loan_denied: {
    id: 'loan_denied', title: 'Lender Pulls Back', tone: 'hot',
    body: (s) => (s.funding.some((f) => f.type === 'term' && f.status !== 'declined')
      ? 'A second-look review flags your thin business file. Your term loan is at risk.'
      : 'Your bank denies a requested line increase after a second-look review.'),
    choices: (s) => {
      const loan = s.funding.find((f) => f.type === 'term' && f.status !== 'declined')
      if (loan) {
        return [
          { id: 'appeal', label: 'Appeal with CPA-prepared financials', detail: has(s, 'cpa') ? 'CPA on team: loan stands.' : 'No CPA: loan cut 50%.', apply: (x) => (has(x, 'cpa') ? x : { ...x, funding: x.funding.map((f) => (f.id === loan.id ? { ...f, amount: Math.round(f.amount / 2) } : f)) }) },
          { id: 'reprice', label: 'Accept a higher-cost lender', detail: '+6% APR on the loan.', apply: (x) => ({ ...x, funding: x.funding.map((f) => (f.id === loan.id ? { ...f, apr: f.apr + 0.06 } : f)) }) },
          { id: 'walk', label: 'Walk away', detail: 'Loan is cancelled.', apply: (x) => ({ ...x, funding: x.funding.map((f) => (f.id === loan.id ? { ...f, status: 'declined', amount: 0 } : f)) }) },
        ]
      }
      return [
        { id: 'accept', label: 'Accept and move on', detail: 'No change.', apply: (x) => x },
        { id: 'reroute', label: 'Capital Architect reroutes to another lender', detail: has(s, 'cco') ? '+7% of target in 0% credit.' : 'Requires a Capital Architect.', disabled: !has(s, 'cco'), apply: (x) => addCredit(x, pctOfTarget(x, 0.07), 'Rerouted 0% line (CCO)') },
        { id: 'apply', label: 'Apply elsewhere yourself', detail: '+1 inquiry; +5% of target if fundability ≥ 70.', apply: (x) => { const y = mod(x, { extraInquiries: x.mods.extraInquiries + 1 }); return liveScore(y) >= 70 ? addCredit(y, pctOfTarget(y, 0.05), 'Backup 0% line') : y } },
      ]
    },
  },
  utilization: {
    id: 'utilization', title: 'Credit Utilization Spike', tone: 'hot',
    body: () => 'Drawing on new lines spikes your reported utilization. Your bureau score is about to drop 30 points.',
    choices: () => [
      { id: 'paydown', label: 'Pay down 8% of target from capital', detail: 'Score −5 instead.', apply: (x) => mod(cost(x, pctOfTarget(x, 0.08)), { ficoDelta: x.mods.ficoDelta - 5 }) },
      { id: 'cli', label: 'Request limit increases', detail: '+1 inquiry, score −12.', apply: (x) => mod(x, { ficoDelta: x.mods.ficoDelta - 12, extraInquiries: x.mods.extraInquiries + 1 }) },
      { id: 'ignore', label: 'Ignore it', detail: 'Score −30.', apply: (x) => mod(x, { ficoDelta: x.mods.ficoDelta - 30 }) },
    ],
  },
  launch_delay: {
    id: 'launch_delay', title: 'Product Launch Delayed', tone: 'hot',
    body: (s) => `Development runs two months late. You keep paying operating expenses without sales.${has(s, 'operator') ? ' Your Operating Partner claws back a month.' : ''}`,
    choices: () => [
      { id: 'reserve', label: 'Use contingency reserves', detail: '+2 mo delay; one month of burn spent.', apply: (x) => mod(cost(x, x.startup.monthlyBurn), { launchDelay: x.mods.launchDelay + 2 }) },
      { id: 'cut', label: 'Reduce monthly burn', detail: '+2 mo delay; burn −15%, revenue −8%.', apply: (x) => mod(x, { launchDelay: x.mods.launchDelay + 2, burnMult: x.mods.burnMult * 0.85, revenueMult: x.mods.revenueMult * 0.92 }) },
      { id: 'finance', label: 'Seek additional financing', detail: '+2 mo delay; +1 inquiry; +7% of target in 0% credit if fundability ≥ 65.', apply: (x) => { const y = mod(x, { launchDelay: x.mods.launchDelay + 2, extraInquiries: x.mods.extraInquiries + 1 }); return liveScore(y) >= 65 ? addCredit(y, pctOfTarget(y, 0.07), 'Bridge 0% line') : y } },
    ],
  },
  surprise_expense: {
    id: 'surprise_expense', title: 'Unexpected Operating Expense', tone: 'hot',
    body: (s) => `A compliance and equipment bill lands: ${'$' + pctOfTarget(s, 0.06).toLocaleString()}.`,
    choices: (s) => [
      { id: 'pay', label: 'Pay from capital', detail: has(s, 'cpa') ? 'CPA trims it 25%.' : 'Full amount.', apply: (x) => cost(x, pctOfTarget(x, 0.06) * (has(x, 'cpa') ? 0.75 : 1)) },
      { id: 'spread', label: 'Spread over 6 months', detail: 'Paid in installments plus 10% financing cost.', apply: (x) => mod(x, { installments: [...x.mods.installments, { amount: (pctOfTarget(x, 0.06) * 1.1) / 6, months: 6 }] }) },
      { id: 'negotiate', label: 'Negotiate the bill', detail: has(s, 'attorney') ? 'Attorney cuts it 60%.' : 'You cut it 20%.', apply: (x) => cost(x, pctOfTarget(x, 0.06) * (has(x, 'attorney') ? 0.4 : 0.8)) },
    ],
  },
  strong_sales: {
    id: 'strong_sales', title: 'Strong Early Sales', tone: 'neon',
    body: () => 'Your beta converts better than projected. How do you use the momentum?',
    choices: () => [
      { id: 'reinvest', label: 'Reinvest in growth', detail: 'Burn +10%, revenue +30%.', apply: (x) => mod(x, { burnMult: x.mods.burnMult * 1.1, revenueMult: x.mods.revenueMult * 1.3 }) },
      { id: 'bank', label: 'Bank the cash', detail: '+4% of target in cash, revenue +10%.', apply: (x) => mod(x, { cashBonus: x.mods.cashBonus + pctOfTarget(x, 0.04), revenueMult: x.mods.revenueMult * 1.1 }) },
      { id: 'hire', label: 'Hire an early rep', detail: '+$4K/mo burn, revenue +20%.', apply: (x) => mod(x, { burnDelta: x.mods.burnDelta + 4000, revenueMult: x.mods.revenueMult * 1.2 }) },
    ],
  },
  cac_fail: {
    id: 'cac_fail', title: 'Customer Acquisition Failure', tone: 'hot',
    body: (s) => `Your first paid channel flops.${has(s, 'marketing') ? ' Your Marketing Specialist has a backup plan.' : ''}`,
    choices: (s) => [
      { id: 'pivot', label: 'Pivot channels', detail: has(s, 'marketing') ? '3% of target; revenue unchanged.' : '3% of target; revenue −8%.', apply: (x) => mult(cost(x, pctOfTarget(x, 0.03)), 'revenueMult', has(x, 'marketing') ? 1 : 0.92) },
      { id: 'cut', label: 'Cut marketing spend', detail: 'Burn −7%, revenue −25%.', apply: (x) => mod(x, { burnMult: x.mods.burnMult * 0.93, revenueMult: x.mods.revenueMult * 0.75 }) },
      { id: 'push', label: 'Push through', detail: '+$2K/mo burn, revenue −15%.', apply: (x) => mod(x, { burnDelta: x.mods.burnDelta + 2000, revenueMult: x.mods.revenueMult * 0.85 }) },
    ],
  },
  promo_expire: {
    id: 'promo_expire', title: 'Promotional APR Cut Short', tone: 'hot',
    body: (s) => (promoDebt(s) > 0 ? 'An issuer shortens your 0% promo periods by 3 months.' : 'Issuers tighten 0% promo terms market-wide. You have no promo balances exposed.'),
    choices: (s) => (promoDebt(s) > 0 ? [
      { id: 'bt', label: 'Balance transfer to a new 0% offer', detail: '3% fee on promo balances; promo restored.', apply: (x) => cost(x, promoDebt(x) * 0.03) },
      { id: 'paydown', label: 'Pay down 20% of promo balances', detail: 'Cash out now, smaller cliff later.', apply: (x) => ({ ...cost(x, promoDebt(x) * 0.2), funding: x.funding.map((f) => ((f.type === 'credit' || f.type === 'partner') && f.status === 'available' ? { ...f, paidDown: (f.paidDown || 0) + f.amount * 0.2 } : f)) }) },
      { id: 'accept', label: 'Accept shorter promos', detail: 'Promo −3 months.', apply: (x) => mod(x, { promoShift: x.mods.promoShift - 3 }) },
    ] : [{ id: 'ok', label: 'Noted', detail: 'No exposure.', apply: (x) => x }]),
  },
  partner_withdraws: {
    id: 'partner_withdraws', title: 'Funding Partner Withdraws', tone: 'hot',
    body: (s) => (s.funding.some((f) => f.type === 'partner' && f.status !== 'declined') ? 'Your capital partner gets cold feet and wants out.' : 'A prospective partner backs out before anything is signed. No capital lost.'),
    choices: (s) => {
      const p = s.funding.find((f) => f.type === 'partner' && f.status !== 'declined' && f.status !== 'withdrawn')
      if (!p) return [{ id: 'ok', label: 'Move on', detail: 'No impact.', apply: (x) => x }]
      return [
        { id: 'enforce', label: 'Enforce the agreement', detail: p.agreement ? 'Signed agreement: keep 70%.' : 'Handshake only: keep 30%.', apply: (x) => ({ ...x, funding: x.funding.map((f) => (f.id === p.id ? { ...f, amount: Math.round(f.amount * (f.agreement ? 0.7 : 0.3)) } : f)) }) },
        { id: 'release', label: 'Release them gracefully', detail: 'Partner capital removed.', apply: (x) => ({ ...x, funding: x.funding.map((f) => (f.id === p.id ? { ...f, status: 'withdrawn', amount: 0 } : f)) }) },
      ]
    },
  },
  vendor_hike: {
    id: 'vendor_hike', title: 'Vendor Price Increase', tone: 'hot',
    body: () => 'Your core vendor raises prices 8%.',
    choices: (s) => [
      { id: 'accept', label: 'Accept it', detail: 'Burn +8%.', apply: (x) => mult(x, 'burnMult', 1.08) },
      { id: 'switch', label: 'Switch vendors', detail: '2% of target switching cost; burn +2%.', apply: (x) => mult(cost(x, pctOfTarget(x, 0.02)), 'burnMult', 1.02) },
      { id: 'renegotiate', label: 'Renegotiate', detail: has(s, 'operator') ? 'Operating Partner holds price.' : 'Burn +5%.', apply: (x) => mult(x, 'burnMult', has(x, 'operator') ? 1 : 1.05) },
    ],
  },
  refi_offer: {
    id: 'refi_offer', title: 'Refinancing Opportunity', tone: 'neon',
    body: () => 'A credit union pre-qualifies you to refinance promo balances into a 9.5% / 48-month loan at the cliff.',
    choices: () => [
      { id: 'lock', label: 'Lock it in', detail: '1% of target fee; 9.5% refi available at the boss.', apply: (x) => mod(cost(x, pctOfTarget(x, 0.01)), { refiOffer: 0.095 }) },
      { id: 'pass', label: 'Pass', detail: 'Keep your options open.', apply: (x) => x },
    ],
  },
  dispute: {
    id: 'dispute', title: 'Co-founder Disagreement', tone: 'hot',
    body: () => 'You and a key partner clash over strategy and compensation.',
    choices: (s) => [
      { id: 'mediate', label: 'Formal mediation', detail: has(s, 'attorney') ? 'Attorney handles it: free.' : '2% of target.', apply: (x) => (has(x, 'attorney') ? x : cost(x, pctOfTarget(x, 0.02))) },
      { id: 'buyout', label: 'Buy out their share', detail: '6% of target; removes profit shares.', apply: (x) => ({ ...cost(x, pctOfTarget(x, 0.06)), funding: x.funding.map((f) => (f.type === 'partner' ? { ...f, split: 0 } : f)) }) },
      { id: 'ignore', label: 'Ignore it', detail: 'Revenue −10%; governance flag.', apply: (x) => mod(x, { revenueMult: x.mods.revenueMult * 0.9, disputeFlag: true }) },
    ],
  },
  big_customer: {
    id: 'big_customer', title: 'Major New Customer', tone: 'neon',
    body: () => 'An enterprise buyer wants in, on their terms.',
    choices: (s) => [
      { id: 'deposit', label: 'Require a 30% deposit', detail: `+${has(s, 'sales') ? 9 : 6}% of target cash; revenue +10%.`, apply: (x) => mod(x, { cashBonus: x.mods.cashBonus + pctOfTarget(x, has(x, 'sales') ? 0.09 : 0.06), revenueMult: x.mods.revenueMult * 1.1 }) },
      { id: 'net60', label: 'Accept net-60 terms', detail: 'Revenue +25%; 3% of target working capital.', apply: (x) => mult(cost(x, pctOfTarget(x, 0.03)), 'revenueMult', 1.25) },
      { id: 'decline', label: 'Decline', detail: 'No change.', apply: (x) => x },
    ],
  },
}

export const bossLimit = (s) => (has(s, 'cpa') ? 3 : 2)

export function bridgeTerms(s) {
  const ind = INDUSTRIES[s.startup.industry]
  const existing = s.funding.filter((f) => f.type === 'vc' && (f.status === 'available' || f.status === 'committed')).reduce((a, f) => a + f.amount, 0)
  const amount = Math.max(0, Math.min(Math.round((s.startup.target * 0.15) / 1000) * 1000, ind.vcCap - existing))
  const pre = ind.preMoney * 0.6 * (has(s, 'attorney') ? 1.2 : 1)
  return { amount, equityPct: amount ? amount / (pre + amount) : 0, preMoney: pre }
}

export function bossOptions(s) {
  const promo = promoDebt(s)
  const canRefi = s.mods.refiOffer != null || has(s, 'cco') || liveScore(s) >= 70
  const rate = s.mods.refiOffer ?? (has(s, 'cco') ? 0.1 : 0.13)
  const b = bridgeTerms(s)
  const own = ownership(s).founder
  return [
    {
      id: 'refi', label: 'Restructure the debt', rate,
      detail: !promo ? 'No promo balances to restructure.' : canRefi ? `Convert promo balances to a ${(rate * 100).toFixed(1)}% / 48-month loan as each promo ends.` : 'Not eligible: needs fundability ≥ 70, a Capital Architect, or a locked refi offer.',
      disabled: !promo || !canRefi,
    },
    { id: 'cut', label: 'Cut expenses 20%', detail: 'From month 12: burn −20%, revenue −5% from slower growth.' },
    { id: 'founderpay', label: 'Defer half your founder pay', detail: s.startup.founderPay > 0 ? `Saves ${fmt(s.startup.founderPay / 2)}/mo from month 12.` : 'You are not paying yourself.', disabled: !(s.startup.founderPay > 0) },
    {
      id: 'equity', label: 'Negotiate a bridge equity round',
      detail: b.amount >= 5000 ? `${fmt(b.amount)} at a down-round ${fmtK(b.preMoney)} pre-money: ${(b.equityPct * 100).toFixed(1)}% dilution. Lands month 12.` : 'Investors are tapped out for this industry.',
      disabled: b.amount < 5000 || own * (1 - b.equityPct) < 0.51,
    },
    { id: 'paydown', label: 'Pay down promo balances', detail: promo ? 'At month 12, use cash above one month of expenses to retire 0% balances.' : 'No promo balances.', disabled: !promo },
  ]
}

export function runForecast(s, moves = []) {
  const on = (id) => moves.includes(id)
  const t = totals(s)
  const bossRate = bossOptions(s).find((o) => o.id === 'refi').rate
  const bridge = bridgeTerms(s)
  const shortfall = 0.75
  const burn0 = monthlyBurn(s)
  const prepay = s.funding.find((f) => f.type === 'prepay' && f.status === 'available')
  const refundRisk = prepay && s.mods.launchDelay > 0 ? prepay.amount * 0.3 : 0
  let cash = t.cash - s.mods.oneTimeCosts + s.mods.cashBonus - refundRisk
    - s.funding.reduce((a, f) => a + (f.paidDown || 0), 0)
  const lines = s.funding
    .filter((f) => (f.type === 'credit' || f.type === 'partner') && f.status === 'available' && f.amount > 0)
    .map((f) => ({ balance: f.amount - (f.paidDown || 0), promo: Math.max(1, (f.promo || 12) + s.mods.promoShift), refi: null }))
  const loans = s.funding.filter((f) => f.type === 'term' && f.status === 'available' && f.amount > 0)
    .map((f) => ({ balance: f.amount, payment: amortizedPayment(f.amount, f.apr, TERM_MONTHS), apr: f.apr }))
  const split = s.funding.filter((f) => f.type === 'partner' && f.status === 'available').reduce((a, f) => a + (f.split || 0), 0)
  const installments = s.mods.installments.map((i) => ({ ...i }))
  let revenueDeferred = prepay ? prepay.amount : 0
  let revenueMonths = 0
  const months = []
  let insolventMonth = null
  let promoAtCliff = 0

  for (let m = 1; m <= MONTHS; m++) {
    const late = m >= BOSS_MONTH
    let revenue = projectedRevenue(s, m)
    if (late) revenue *= shortfall * (on('cut') ? 0.95 : 1)
    let recognized = revenue
    if (revenue > 0 && revenueDeferred > 0 && revenueMonths < 6) {
      const offset = Math.min(revenueDeferred, prepay.amount / 6, revenue)
      recognized -= offset
      revenueDeferred -= offset
      revenueMonths++
    }
    let expenses = burn0 * (late && on('cut') ? 0.8 : 1) - (late && on('founderpay') ? s.startup.founderPay / 2 : 0)
    for (const i of installments) if (i.months > 0) { expenses += i.amount; i.months-- }

    if (m === BOSS_MONTH) {
      if (on('equity')) cash += bridge.amount
      promoAtCliff = lines.reduce((a, l) => a + l.balance, 0)
      if (on('paydown') && promoAtCliff > 0) {
        const pay = Math.min(Math.max(0, cash - expenses), promoAtCliff)
        for (const l of lines) l.balance -= pay * (l.balance / promoAtCliff)
        cash -= pay
      }
    }

    let debt = 0
    for (const l of lines) {
      if (l.balance <= 0.5) { l.balance = 0; continue }
      if (m <= l.promo) {
        const p = l.balance * 0.01
        l.balance -= p; debt += p
      } else if (on('refi') && bossRate != null) {
        if (!l.refi) l.refi = amortizedPayment(l.balance, bossRate, 48)
        const interest = l.balance * (bossRate / 12)
        l.balance -= l.refi - interest; debt += l.refi
      } else {
        const interest = l.balance * (POST_PROMO_APR / 12)
        const p = l.balance * 0.03
        l.balance -= p; debt += interest + p
      }
    }
    for (const ln of loans) {
      if (ln.balance <= 0) continue
      const interest = ln.balance * (ln.apr / 12)
      ln.balance -= ln.payment - interest; debt += ln.payment
    }
    const profit = recognized - expenses
    const share = profit > 0 ? profit * split : 0
    cash += recognized - expenses - debt - share
    if (cash < 0 && insolventMonth == null) insolventMonth = m
    months.push({ m, revenue: recognized, expenses, debt, share, cash, promoBalance: lines.reduce((a, l) => a + Math.max(0, l.balance), 0) })
  }
  const last = months[MONTHS - 1]
  const endLoans = loans.reduce((a, l) => a + Math.max(0, l.balance), 0)
  return {
    months, insolventMonth, endCash: last.cash, minCash: Math.min(...months.map((x) => x.cash)),
    endExpenses: last.expenses, endDebt: last.debt, promoAtCliff, endPromo: last.promoBalance,
    endLoans, debtRemaining: last.promoBalance + endLoans, bridge: on('equity') ? bridge : null,
  }
}

export function scoreGame(s, f, moves = []) {
  const t = totals(s)
  const own = { ...ownership(s) }
  if (f.bridge) {
    own.founder *= 1 - f.bridge.equityPct
    if (f.bridge.equityPct >= 0.15) own.seats += 1
  }
  const target = s.startup.target
  const funding = 25 * Math.min(1, t.available / target)
  const reserveOk = f.endCash >= f.endExpenses + f.endDebt
  const cashflow = f.insolventMonth ? 25 * ((f.insolventMonth - 1) / MONTHS) * 0.8 : reserveOk ? 25 : 12
  const hasDebt = t.debt > 0
  const cliffHandled = !hasDebt || f.promoAtCliff === 0 || moves.includes('refi') || (f.endCash > 0 && f.endCash >= f.endPromo * 0.5)
  const repayment = !hasDebt ? 20 : f.insolventMonth ? 2 : cliffHandled ? 20 : 5
  let governance = own.founder >= 0.9 ? 10 : own.founder >= 0.75 ? 8 : own.founder >= 0.51 ? 5 : 1
  governance -= own.seats * 2
  if (s.funding.some((x) => x.type === 'partner' && x.status === 'available' && !x.agreement)) governance -= 3
  if (s.mods.disputeFlag) governance -= 2
  governance = clamp(governance, 0, 10)
  const pri = INDUSTRIES[s.startup.industry].priorities
  const team = clamp(s.squad.reduce((a, r) => a + (pri.includes(r) ? 3 : 2), 0), 0, 10)
  const savingsUsed = s.funding.filter((x) => x.type === 'savings').reduce((a, x) => a + x.amount, 0)
  const pg = s.funding.filter((x) => (x.type === 'credit' || x.type === 'term') && x.status === 'available').reduce((a, x) => a + x.amount, 0)
  const personal = clamp(10 - 5 * (s.startup.savings ? savingsUsed / s.startup.savings : 0) - 5 * Math.min(1, pg / (s.profile.income * 1.5)), 0, 10)
  const breakdown = [
    { id: 'funding', label: 'Funding target achieved', pts: funding, max: 25 },
    { id: 'cashflow', label: 'Cash-flow sustainability', pts: cashflow, max: 25 },
    { id: 'repayment', label: 'Repayment preparedness', pts: repayment, max: 20 },
    { id: 'governance', label: 'Ownership & governance', pts: governance, max: 10 },
    { id: 'team', label: 'Operating team readiness', pts: team, max: 10 },
    { id: 'personal', label: 'Personal risk management', pts: personal, max: 10 },
  ].map((b) => ({ ...b, pts: Math.round(b.pts) }))
  const score = breakdown.reduce((a, b) => a + b.pts, 0)
  const checks = [
    { label: 'Supports operating expenses for 18 months', ok: !f.insolventMonth },
    { label: 'Covers required debt payments', ok: !f.insolventMonth || !hasDebt },
    { label: 'Handles the 0% promo expiration', ok: cliffHandled && !f.insolventMonth },
    { label: 'Retains a 1-month cash reserve', ok: reserveOk },
    { label: 'Founder keeps majority ownership', ok: own.founder >= 0.51 },
  ]
  const met = t.available >= target
  const outcome = f.insolventMonth ? 'failure' : met && checks.every((c) => c.ok) ? 'victory' : 'partial'
  const badge = score >= 85 ? 'Capital Master' : score >= 60 ? 'Launch-ready' : 'Rebuild'
  return { score, breakdown, checks, outcome, badge, founderOwnership: own.founder, seats: own.seats, debtRemaining: f.debtRemaining, hadDebt: hasDebt }
}
