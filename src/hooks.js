import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// Ambil data dari API; reload() untuk memuat ulang.
export function useFetch(path) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    api(path).then((d) => alive && (setData(d), setErr(''))).catch((e) => alive && setErr(e.message))
    return () => { alive = false }
  }, [path, n])
  const reload = useCallback(() => setN((x) => x + 1), [])
  return { data, err, reload }
}
