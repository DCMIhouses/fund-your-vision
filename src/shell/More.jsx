import { MedalShowcase, TrophyRoom } from '../components/Medals'
import { Hangar } from '../components/Fx'
import PartnerBinder from '../components/PartnerBinder'
import { btnGhost, card, go, kicker } from './ui'

export default function More({ g }) {
  const { s, dispatch, meta, updateMeta, collection, book, today, muted, toggleMute } = g
  return (
    <div className="space-y-8">
      <div>
        <div className={`${kicker} text-gold`}>More</div>
        <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">Medals, rewards & settings</h1>
      </div>
      <MedalShowcase collection={collection} meta={meta} update={updateMeta} />
      <TrophyRoom s={s} collection={collection} />
      <Hangar meta={meta} s={s} dispatch={dispatch} today={today} collection={collection} onDaily={() => go('new')} />
      <PartnerBinder book={book} />
      <section className={card}>
        <h2 className="text-xl font-black text-white">Settings</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={toggleMute} className={btnGhost}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
          <a href="?ui=classic" className={btnGhost}>Classic view</a>
          <a href="#/help" className={btnGhost}>Real funding help</a>
          <a href="#pay" className={btnGhost}>Make a payment</a>
          <button onClick={() => { if (window.confirm('Reset your game? Medals and rewards stay.')) { dispatch({ type: 'RESET' }); go('') } }} className={`${btnGhost} hover:!border-hot hover:!text-hot`}>Reset game</button>
        </div>
      </section>
    </div>
  )
}
