import { useEffect, useState } from 'react'
import { parseLocation, type AppLocation } from '../lib/route'

export function useRoute(): AppLocation {
  const [location, setLocation] = useState<AppLocation>(() =>
    parseLocation(window.location.hash),
  )

  useEffect(() => {
    const update = () => setLocation(parseLocation(window.location.hash))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  return location
}
