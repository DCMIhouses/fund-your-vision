import { useCallback, useEffect, useState } from 'react'

export const ROUTES = ['/', '/new', '/play', '/business', '/blueprint', '/results', '/more']

export function parseHash(hash = window.location.hash) {
  const h = hash.replace(/^#/, '')
  if (h === 'pay') return 'pay'
  const path = h.startsWith('/') ? h.split('?')[0] : '/'
  return ROUTES.includes(path) ? path : '/'
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash())
  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((path, { replace = false } = {}) => {
    const hash = path === 'pay' ? '#pay' : `#${path}`
    if (window.location.hash === hash) return
    if (replace) { window.history.replaceState(null, '', hash); setRoute(parseHash(hash)) } else window.location.hash = hash
  }, [])
  return [route, go]
}
