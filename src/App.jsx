import ClassicApp from './ClassicApp'
import Shell from './shell/Shell'

const classic = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ui') === 'classic'

export default function App() {
  return classic ? <ClassicApp /> : <Shell />
}
