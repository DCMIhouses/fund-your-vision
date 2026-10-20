// Character roster for the office. Art direction: owner-supplied FYV anime character sheet.
// `portrait` is a still crop used in lists and panels. `sprite` is reserved for a future
// per-character animation atlas (see docs/founder-os/GATE3_CHARACTER_SPEC.md); while it is null
// the office draws the procedural worker in the character's colors.
const art = (file) => `${import.meta.env.BASE_URL}characters/${file}.webp`

export const CHARACTERS = {
  architect: { person: 'Kaelen', title: 'Strategist', board: 'Simulating yield curves', portrait: art('kaelen'), sprite: null },
  underwriting: { person: 'Lyra', title: 'Data Underwriter', board: 'Analyzing risk data', portrait: art('lyra'), sprite: null },
  vc: { person: 'Vance', title: 'Negotiator', board: 'Drafting term sheets', portrait: art('vance'), sprite: null },
  cfo: { person: 'Maya', title: 'AI CFO', board: 'Calculating runway', portrait: art('maya'), sprite: null },
  risk: { person: 'Evelyn', title: 'Compliance Officer', board: 'Reviewing entity structuring', portrait: art('evelyn'), sprite: null },
  reporting: { person: 'Marcus', title: 'Analyst', board: 'Compiling audits', portrait: art('marcus'), sprite: null },
  guide: { person: 'Naomi', title: 'Mentor', board: 'Consulting founders', portrait: art('naomi'), sprite: null },
  growth: { person: 'Sera', title: 'Matchmaker', board: 'Connecting partners', portrait: art('sera'), sprite: null },
}

export const character = (id) => CHARACTERS[id]
