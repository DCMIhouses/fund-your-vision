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
export const ACT = { architect: 'Simulating yield curves', underwriting: 'Analyzing risk data', vc: 'Drafting term sheets', cfo: 'Calculating runway', growth: 'Connecting partners', risk: 'Reviewing entity structuring', reporting: 'Compiling audits', guide: 'Consulting founders' }
export const SHIRT = { architect: 0x1f5f5b, underwriting: 0xe6dcc6, vc: 0x1e2a4a, cfo: 0x1f7a4a, growth: 0x7a1f35, risk: 0x1b2550, reporting: 0x8a8f96, guide: 0xb79be0 }
export const PANTS = { architect: 0x8a7a5c, underwriting: 0xd8ccb4, vc: 0x1e2a4a, cfo: 0x4a3426, growth: 0xefe9df, risk: 0x1b2550, reporting: 0x2b2f36, guide: 0x3b2a55 }
export const SKIN = { architect: 0xc68642, underwriting: 0x8d5524, vc: 0xd19a66, cfo: 0x8d5524, growth: 0xc68642, risk: 0x6b3e1f, reporting: 0xf1c9a0, guide: 0xf5d5c0 }
export const HAIR = { architect: 0x3b2414, underwriting: 0x1a1110, vc: 0x0b0b0b, cfo: 0x2a1810, growth: 0xf2ede4, risk: 0x111111, reporting: 0xc9a46a, guide: 0x9b7fd1 }
export const where = (id) => { const l = LEFT.indexOf(id); return l >= 0 ? ['L', l] : ['R', RIGHT.indexOf(id)] }
export const seatOf = (id) => { const [s, i] = where(id); return { x: s === 'L' ? 286 : 714, y: rowY(i) + 44, side: s } }
export const STYLE = {
  architect: { hair: 'short', acc: 'none' },
  underwriting: { hair: 'afro', acc: 'glasses' },
  vc: { hair: 'side', acc: 'blazer' },
  cfo: { hair: 'pony', acc: 'none' },
  growth: { hair: 'side', acc: 'none' },
  risk: { hair: 'bun', acc: 'glasses' },
  reporting: { hair: 'curly', acc: 'none' },
  guide: { hair: 'long', acc: 'none' },
}
