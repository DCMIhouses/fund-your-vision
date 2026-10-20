import { useState } from 'react'
import { INDUSTRIES } from '../../data'
import { fmt } from '../../game'
import { Button, Card, Eyebrow, Sheet } from '../../shared/ui'
import { nbfLink } from '../../shared/gameSelectors'

const OPTIONS = [
  ['assessment', 'Request a funding assessment', 'Have a specialist review your real eligibility.'],
  ['partnership', 'Explore capital partnership help', 'Discuss whether a structured capital partner could fit.'],
  ['cco', 'Consult a fractional Chief Capital Officer', 'Get ongoing help planning how to fund your business.'],
]

export default function NbfPanel({ s, compact = false }) {
  const [pick, setPick] = useState(null)
  const [share, setShare] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const close = () => { setPick(null); setShare(false); setPrivacy(false) }
  const opt = OPTIONS.find((o) => o[0] === pick)
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-fos-line bg-fos-soft px-5 py-3 text-sm text-fos-muted">Real-world help · separate from the game</div>
      <div className="p-5">
        <h2 className="fos-display text-[24px]">Ready to explore real funding?</h2>
        <p className="mt-2 text-[15px] text-fos-muted">Nationwide Business Funding presents this game. If you want real help, you can contact them. Your game results are simulated and are not a loan approval, credit decision or offer.</p>
        <div className={`mt-4 grid gap-3 ${compact ? '' : 'sm:grid-cols-3'}`}>
          {OPTIONS.map(([id, title, sub]) => (
            <button key={id} onClick={() => setPick(id)} className="min-h-[96px] rounded-[18px] border border-fos-line p-4 text-left hover:border-fos-gold">
              <div className="font-semibold">{title}</div><div className="mt-1 text-sm text-fos-muted">{sub}</div>
            </button>
          ))}
        </div>
      </div>
      <Sheet open={!!pick} onClose={close} title={opt?.[1] || ''} subtitle="Before you leave the game">
        <div className="space-y-4 text-[15px]">
          <p>This opens NationwideBusinessFunding.com in a new tab. <b>The game does not send your information to anyone</b>, and no one at Nationwide Business Funding is notified automatically. You choose what to share on their site.</p>
          <Card className="p-4">
            <Eyebrow>Optional: include game details in the link</Eyebrow>
            <ul className="mt-2 list-disc pl-5 text-sm text-fos-muted">
              <li>Industry: {INDUSTRIES[s.startup.industry].label}</li>
              <li>Funding goal: {fmt(s.startup.target)}</li>
              {s.result && <li>Capital IQ {s.result.score} and outcome “{s.result.outcome}” (simulated)</li>}
            </ul>
            <p className="mt-2 text-sm text-fos-muted">No name, contact details or credit information is included.</p>
            <label className="mt-3 flex min-h-[44px] items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={share} onChange={(e) => setShare(e.target.checked)} />Yes, add these game details to the link I am about to open.</label>
          </Card>
          <label className="flex min-h-[44px] items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />I understand I am leaving the simulation for a real business website, and that their own privacy policy and terms apply.</label>
          <a aria-disabled={!privacy} href={privacy ? nbfLink(pick, s, share) : undefined} target="_blank" rel="noreferrer" onClick={(e) => { if (!privacy) e.preventDefault(); else close() }}
            className={`flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-5 font-semibold ${privacy ? 'bg-fos-ink text-fos-surface' : 'cursor-not-allowed bg-fos-soft text-fos-muted'}`}>Continue to NationwideBusinessFunding.com</a>
          <Button variant="secondary" className="w-full" onClick={close}>Keep playing</Button>
        </div>
      </Sheet>
    </Card>
  )
}
