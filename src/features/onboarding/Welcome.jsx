import { Button, Card } from '../../shared/ui'
import OfficePreview from './OfficePreview'
import { NBF_URL } from '../../shared/gameSelectors'

export default function Welcome({ hasSave, saveName, onStart, onSample, onContinue }) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
      <div className="fos-in">
        <div className="text-[15px] font-semibold text-fos-gold">FUND YOUR VISION</div>
        <h1 className="fos-display mt-3 text-[40px] sm:text-[56px]">Start Up Launcher<span className="mt-3 block text-[26px] sm:text-[34px]">NO PRIVATE EQUITY, NO VC’s, No Problem!</span></h1>
        <p className="mt-4 max-w-xl text-xl font-semibold">Could your business survive its first year?</p>
        <p className="mt-2 max-w-xl text-lg text-fos-muted">Build an idea, make funding decisions, and see whether your startup survives. Learn by playing. Investors are still an option in the game, so you can compare every path.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={onStart} className="sm:min-w-[220px]">Start my business</Button>
          <Button variant="secondary" onClick={onSample}>Try a sample startup</Button>
          {hasSave && <Button variant="ghost" onClick={onContinue}>Continue {saveName ? `“${saveName}”` : 'my game'} →</Button>}
        </div>
        <p className="mt-6 text-sm text-fos-muted">Free educational simulation. No real loan applications.</p>
        <p className="mt-2 text-sm text-fos-muted">
          Presented by <a href={NBF_URL} target="_blank" rel="noreferrer" className="font-semibold text-fos-ink underline underline-offset-4">Nationwide Business Funding</a>
          <span aria-hidden="true"> · </span>
          <a href={NBF_URL} target="_blank" rel="noreferrer" className="text-fos-info underline underline-offset-4">Explore real funding help</a>
        </p>
      </div>
      <Card className="fos-in overflow-hidden p-3" style={{ animationDelay: '.08s' }}>
        <OfficePreview />
        <div className="px-2 pb-1 pt-3 text-sm text-fos-muted">Your eight simulated advisors work at their desks and walk files to each other as you play. Rule-based, not live AI.</div>
      </Card>
    </div>
  )
}
