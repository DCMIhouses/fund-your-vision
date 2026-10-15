export const INDUSTRIES = {
  saas: { label: 'AI / SaaS Software', launch: 3, base: 6000, growth: 1.10, cap: 50000, burn: 12000, preMoney: 2000000, vcCap: 500000, priorities: ['marketing', 'attorney', 'operator'] },
  ecom: { label: 'E-commerce Brand', launch: 2, base: 8000, growth: 1.08, cap: 45000, burn: 7500, preMoney: 1000000, vcCap: 250000, priorities: ['marketing', 'cpa', 'operator'] },
  services: { label: 'Professional Services', launch: 1, base: 9000, growth: 1.05, cap: 30000, burn: 6500, preMoney: 500000, vcCap: 100000, priorities: ['sales', 'cpa', 'attorney'] },
  events: { label: 'Live Events / Festival', launch: 6, base: 28000, growth: 1.03, cap: 60000, burn: 11000, preMoney: 750000, vcCap: 150000, priorities: ['operator', 'attorney', 'sales'] },
}

export const SQUAD_SLOTS = 4

export const SQUAD = [
  { id: 'cco', name: 'Capital Architect', short: 'CCO', area: 'Financing', cost: 750, effect: '+10% debt limits; unlocks a 10% refinance at the promo cliff.' },
  { id: 'attorney', name: 'Attorney', short: 'LAW', area: 'Governance', cost: 400, effect: 'Auto-papers partner agreements; better VC valuation; cheaper disputes.' },
  { id: 'cpa', name: 'CPA', short: 'CPA', area: 'Financial controls', cost: 350, effect: 'Early-warning cash forecast; +1 turnaround move at the boss; trims surprise costs.' },
  { id: 'marketing', name: 'Marketing Specialist', short: 'MKT', area: 'Customer acquisition', cost: 1200, effect: 'Up to +20% revenue, ramping over 3 months; results vary. Softens acquisition failures.' },
  { id: 'sales', name: 'Sales Specialist', short: 'SLS', area: 'Revenue', cost: 1200, effect: 'Up to +15% revenue, ramping over 3 months; results vary. Full prepayments; bigger deposits.' },
  { id: 'operator', name: 'Operating Partner', short: 'OPS', area: 'Execution', cost: 1000, effect: '−5% burn; launch delays cut by 1 month; vendor leverage.' },
]

export const FINANCE_CARDS = [
  {
    id: 'credit', kind: 'Debt', name: '0% Intro APR Business Credit',
    tagline: 'Apply issuer by issuer in the Card Stack panel',
    capital: 'Depends on fundability; total capped at 100% of income (game assumption, not a bank rule)',
    cost: '0% for 6–18 months, then ~24% APR',
    eligibility: 'Approved at or above each issuer threshold; up to 8 points under it = conditional (income verification)',
    repayment: 'Min. 1%/mo during promo; interest + 3% principal after',
    ownership: 'None',
    risks: 'Personal guarantee. Each application is modeled as a personal hard inquiry. Promo cliff.',
  },
  {
    id: 'term', kind: 'Debt', name: 'Business Term Loan',
    tagline: 'Fixed payments, 36 months',
    capital: 'Up to 60% of target (max $250K)',
    cost: '11% APR (17% if conditional)',
    eligibility: 'Fundability ≥ 70 and no derogatories = approved; 55–69 = conditional (collateral or co-signer)',
    repayment: 'Amortized monthly payment from month 1',
    ownership: 'None',
    risks: 'Personal guarantee. Business-credit application: modeled as a soft personal pull (no hard inquiry). Funds land after one turn.',
  },
  {
    id: 'savings', kind: 'Self', name: 'Personal Savings',
    tagline: 'Fast, but it is your safety net',
    capital: 'Up to your savings balance',
    cost: 'Opportunity cost; no interest',
    eligibility: 'Always available',
    repayment: 'None',
    ownership: 'None',
    risks: 'Drains your personal emergency fund. Lowers Personal Risk score.',
  },
  {
    id: 'vc', kind: 'Equity', name: 'VC / Angel Investment',
    tagline: 'Capital for negotiated ownership',
    capital: 'Industry-dependent cap',
    cost: 'Equity dilution; investor rights',
    eligibility: 'Always a term sheet (conditional). Diligence takes two turns.',
    repayment: 'None scheduled',
    ownership: 'Dilution; ≥15% stake adds an investor board seat',
    risks: 'Governance rights and dilution. May not suit lifestyle or local businesses.',
  },
  {
    id: 'partner', kind: 'Partnership', name: 'Qualified Capital Partner',
    tagline: 'Pick a partner in the Matchmaking panel',
    capital: 'Partner-guaranteed credit capacity',
    cost: 'Profit share; partner-guaranteed debt still needs repaying',
    eligibility: 'Conditional on a written guarantee and partnership agreement',
    repayment: '0% for 12 months, then ~24% APR; plus profit share',
    ownership: 'No equity; profit share on positive months',
    risks: 'Without an agreement, disputes and withdrawals hurt more.',
  },
  {
    id: 'prepay', kind: 'Revenue', name: 'Customer Prepayments',
    tagline: 'Pre-sell to early customers',
    capital: 'Up to 3× expected month-6 revenue (50% without a Sales Specialist)',
    cost: 'Future revenue is already collected',
    eligibility: 'Once per game',
    repayment: 'Deliver the product; recognized against first 6 revenue months',
    ownership: 'None',
    risks: 'Launch delays trigger refunds.',
  },
  {
    id: 'cut', kind: 'Efficiency', name: 'Operating Expense Reduction',
    tagline: 'Spend less instead of raising more',
    capital: '12 months of savings counted as freed capital',
    cost: '−15% burn, −8% revenue growth',
    eligibility: 'Once per game',
    repayment: 'None',
    ownership: 'None',
    risks: 'Slower growth.',
  },
]

export const DEMO_SCENARIOS = [
  {
    id: 'all-debt', label: 'Demo A: The All-Debt Sprint', seed: 1337,
    blurb: 'Strong credit, no team. Stack 0% cards and a partner line to hit the target fast, ride out the promo cliff, then watch the boss.',
    startup: { name: 'NeuralNest AI', industry: 'saas', target: 150000, monthlyBurn: 12000, founderPay: 4000, savings: 25000 },
    profile: { fico: 765, utilization: 8, inquiries: 1, oldestYears: 10, openAccounts: 6, income: 160000, derogatory: false },
    script: ['Run AI Underwriting', 'Apply to all 7 issuers in the 0% Card Stack', 'Match Luis Ortega, proceed on a handshake', 'Events: pick the "keep moving" option (Accept / Ignore / Reinvest / Pass)', 'Boss: make no turnaround moves, just lock it in'],
  },
  {
    id: 'diversified', label: 'Demo B: The Capital Architect', seed: 2026,
    blurb: 'Same founder. Build a team, diversify the capital stack, and plan for the promo cliff.',
    startup: { name: 'NeuralNest AI', industry: 'saas', target: 150000, monthlyBurn: 12000, founderPay: 4000, savings: 25000 },
    profile: { fico: 765, utilization: 8, inquiries: 1, oldestYears: 10, openAccounts: 6, income: 160000, derogatory: false },
    script: ['Hire Capital Architect, CPA, Marketing, Sales', 'Run AI Underwriting; apply to Tier-1, Big-4, Regional, Personal Travel', 'Term loan $60K, Angel $60K (accept term sheet), Expense Reduction', 'Events: pick the prudent option (Appeal / Cut / Mediate / Pay down / Lock)', 'Boss: Restructure the debt + Cut expenses, then lock it in'],
  },
]

export const EVENT_IDS = [
  'loan_denied', 'utilization', 'launch_delay', 'surprise_expense', 'strong_sales', 'cac_fail',
  'promo_expire', 'partner_withdraws', 'vendor_hike', 'refi_offer', 'dispute', 'big_customer',
]

export const TOURNAMENT_SCENARIOS = [
  {
    id: 't-ai', label: 'Tournament #1: AI Startup Sprint', seed: 777,
    blurb: 'Standardized founder, fixed event deck. Everyone starts here.',
    startup: { name: 'Tournament AI Co', industry: 'saas', target: 150000, monthlyBurn: 12000, founderPay: 3000, savings: 20000 },
    profile: { fico: 720, utilization: 22, inquiries: 2, oldestYears: 7, openAccounts: 5, income: 110000, derogatory: false },
  },
  {
    id: 't-fest', label: 'Tournament #2: Festival Launch', seed: 4242,
    blurb: 'Lumpy revenue, late launch, bigger target.',
    startup: { name: 'Tournament Fest', industry: 'events', target: 200000, monthlyBurn: 11000, founderPay: 3000, savings: 30000 },
    profile: { fico: 705, utilization: 28, inquiries: 3, oldestYears: 9, openAccounts: 7, income: 130000, derogatory: false },
  },
]
