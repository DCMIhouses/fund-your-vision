export const LEFT = ['growth', 'underwriting', 'vc', 'cfo', null]
export const RIGHT = ['risk', 'reporting', 'guide', 'architect', null]
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
export const SHIRT = { growth: 0x115e59, underwriting: 0xe7dcc4, vc: 0x1e2a4a, cfo: 0x15803d, risk: 0x1e3a8a, reporting: 0x6b7280, guide: 0xb4a2d9, architect: 0x7f1d3a }
export const PANTS = { growth: 0x3f3a33, underwriting: 0x334155, vc: 0x1e2a4a, cfo: 0x1f2937, risk: 0x1e293b, reporting: 0x1f2937, guide: 0x4c1d95, architect: 0xe7e5e4 }
export const SKIN = { growth: 0xc68642, underwriting: 0x7a4a2a, vc: 0xd9a066, cfo: 0x6b3e26, risk: 0x5a3520, reporting: 0xf1c9a0, guide: 0xf3d3c0, architect: 0xc89070 }
export const HAIR = { growth: 0x3b2414, underwriting: 0x111111, vc: 0x111827, cfo: 0x1c1208, risk: 0x2a2a2a, reporting: 0xd6b26a, guide: 0xa78bfa, architect: 0xf1f5f9 }
export const where = (id) => { const l = LEFT.indexOf(id); return l >= 0 ? ['L', l] : ['R', RIGHT.indexOf(id)] }
export const seatOf = (id) => { const [s, i] = where(id); return { x: s === 'L' ? 286 : 714, y: rowY(i) + 44, side: s } }
export const STYLE = {
  growth: { hair: 'short', acc: 'none' },
  underwriting: { hair: 'curly', acc: 'glasses' },
  vc: { hair: 'side', acc: 'blazer' },
  cfo: { hair: 'pony', acc: 'none' },
  risk: { hair: 'bun', acc: 'glasses' },
  reporting: { hair: 'side', acc: 'none' },
  guide: { hair: 'long', acc: 'none' },
  architect: { hair: 'long', acc: 'none' },
}
