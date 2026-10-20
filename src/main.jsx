import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const params = new URLSearchParams(window.location.search)
if (params.has('ui')) localStorage.setItem('fyv-ui', params.get('ui') === 'legacy' ? 'legacy' : 'v2')
const legacy = localStorage.getItem('fyv-ui') === 'legacy'
const App = legacy ? lazy(() => import('./App.jsx')) : lazy(() => import('./app/FounderApp.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
)
