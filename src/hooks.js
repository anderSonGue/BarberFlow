import { useEffect, useState } from 'react'

// Carga datos del mock API y se vuelve a cargar cuando cambia `deps` (o `tick` global).
export function useData(fn, deps, initial) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let vivo = true
    setLoading(true)
    fn().then((d) => {
      if (vivo) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return [data, loading]
}
