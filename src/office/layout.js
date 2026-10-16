export const LEFT = ['architect', 'underwriting', 'vc', 'cfo', null]
export const RIGHT = ['growth', 'risk', 'reporting', 'guide', null]
export const W = 1000
export const ROW = 140
export const rowY = (i) => 58 + i * ROW
export const H = rowY(5) + 10
export const HANDOFF = { cfo: 'reporting', risk: 'guide', underwriting: 'architect', vc: 'architect', architect: 'cfo', growth: 'cfo', guide: 'reporting', reporting: 'guide' }
export const TASKS = {
  architect: { title: 'Financing strategy', chain: ['architect', 'underwriting', 'guide', 'reporting'] },
  underwriting: { title: 'Application review', chain: ['underwriting', 'architect', 'reporting'] },
  vc: { title: 'Compare equity offers', chain: ['vc', 'architect', 'guide', 'reporting'] },
  cfo: { title: 'Cash-flow forecast', chain: ['cfo', 'risk', 'reporting'] },
  growth: { title: 'Growth plan', chain: ['growth', 'cfo', 'reporting'] },
  risk: { title: 'Risk review', chain: ['risk', 'guide', 'reporting'] },
  reporting: { title: 'Executive report', chain: ['reporting', 'guide'] },
  guide: { title: 'Action plan', chain: ['guide', 'reporting'] },
}
export const ACT = { architect: 'Assembling funding plan', underwriting: 'Reviewing application', vc: 'Comparing offers', cfo: 'Updating cash-flow graph', growth: 'Checking campaigns', risk: 'Scanning for risks', reporting: 'Assembling report', guide: 'Reviewing assignments' }
export const SHIRT = { architect: 0x7c3aed, underwriting: 0x0891b2, vc: 0xdb2777, cfo: 0x16a34a, growth: 0xea580c, risk: 0xdc2626, reporting: 0x2563eb, guide: 0x0d9488 }
export const PANTS = { architect: 0x312e81, underwriting: 0x1e293b, vc: 0x374151, cfo: 0x1f2937, growth: 0x1e3a8a, risk: 0x3f3f46, reporting: 0x111827, guide: 0x134e4a }
export const SKIN = { architect: 0xffdbac, underwriting: 0xe0ac69, vc: 0x8d5524, cfo: 0xf1c27d, growth: 0xc68642, risk: 0x8d5524, reporting: 0xa0663a, guide: 0xf1c27d }
export const HAIR = { architect: 0x111827, underwriting: 0x3f2a14, vc: 0x0b0b0b, cfo: 0x6b4423, growth: 0x111827, risk: 0x1c1917, reporting: 0x111827, guide: 0xb45309 }
export const where = (id) => { const l = LEFT.indexOf(id); return l >= 0 ? ['L', l] : ['R', RIGHT.indexOf(id)] }
export const seatOf = (id) => { const [s, i] = where(id); return { x: s === 'L' ? 286 : 714, y: rowY(i) + 44, side: s } }
export const STYLE = {
  architect: { hair: 'side', acc: 'blazer' },
  underwriting: { hair: 'bun', acc: 'glasses' },
  vc: { hair: 'short', acc: 'tie' },
  cfo: { hair: 'pony', acc: 'glasses' },
  growth: { hair: 'curly', acc: 'none' },
  risk: { hair: 'buzz', acc: 'beard' },
  reporting: { hair: 'afro', acc: 'tie' },
  guide: { hair: 'long', acc: 'headset' },
}
