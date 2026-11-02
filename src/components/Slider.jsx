import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Slider otomatis: foto bergeser tiap `interval` ms, video diputar sampai selesai lalu lanjut.
// Berhenti sementara saat kursor di atasnya, tab tidak aktif, atau tombol jeda ditekan.
// Mendukung swipe, panah keyboard, dan "reduce motion".
const backup = (s) => s.fallback || (s.type === 'video' ? s.poster : null)

export default function Slider({ slides, interval = 6000, className = '', shade = true, children }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [i, setI] = useState(0)
  const [held, setHeld] = useState(false)      // kursor/fokus di atas slider
  const [userPause, setUserPause] = useState(reduce)
  const [hidden, setHidden] = useState(false)  // tab tidak aktif
  const [bad, setBad] = useState({})           // slide yang gagal dimuat
  const [muted, setMuted] = useState(true)
  const vid = useRef(null)
  const segs = useRef([])
  const elapsed = useRef(0)
  const x0 = useRef(null)

  const n = slides.length
  const go = useCallback((k) => { elapsed.current = 0; setI(((k % n) + n) % n) }, [n])
  const next = useCallback(() => go(i + 1), [go, i])
  const paused = held || userPause || hidden
  const cur = slides[i]
  const isVideo = cur.type === 'video' && !bad[i]

  useEffect(() => {
    const f = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])

  // Pewaktu & progres. Foto: dihitung dengan waktu. Video: mengikuti currentTime.
  useEffect(() => {
    let raf, last = performance.now()
    const tick = (t) => {
      const dt = t - last; last = t
      let p = 0
      if (isVideo) {
        const v = vid.current
        p = v && v.duration ? v.currentTime / v.duration : 0
      } else {
        if (!paused) elapsed.current += dt
        p = Math.min(elapsed.current / interval, 1)
        if (p >= 1 && !paused && n > 1) { next(); return }
      }
      segs.current.forEach((el, k) => { if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})` })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, paused, isVideo, interval, n, next])

  // Putar/jeda video sesuai slide aktif.
  useEffect(() => {
    const v = vid.current
    if (!v) return
    if (paused) v.pause()
    else v.play().catch(() => {})
  }, [i, paused, isVideo])

  // Tandai slide gagal; bila tidak ada cadangan, langsung lewati.
  const fail = (k) => { setBad((b) => ({ ...b, [k]: true })); if (!backup(slides[k]) && n > 1 && k === i) next() }

  const onKey = (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') go(i - 1) }
  const down = (e) => { x0.current = e.clientX }
  const up = (e) => {
    if (x0.current == null) return
    const d = e.clientX - x0.current; x0.current = null
    if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1))
  }
  const srcOf = (s, k) => (bad[k] && backup(s) ? backup(s) : s.src)

  return (
    <div className={'slider ' + className} role="region" aria-roledescription="carousel" aria-label="Galeri Basreng Ibu A3" tabIndex={0}
      onKeyDown={onKey} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onPointerDown={down} onPointerUp={up} onPointerCancel={() => { x0.current = null }}>
      <div className="slides" aria-live={paused ? 'polite' : 'off'}>
        {slides.map((s, k) => (
          <div key={k} className={'slide' + (k === i ? ' on' : '')} aria-hidden={k !== i} aria-label={`${k + 1} dari ${n}`}>
            {s.type === 'video' && !bad[k]
              ? (k === i && <video ref={vid} src={s.src} poster={s.poster} muted={muted} playsInline preload="auto"
                  onEnded={next} onError={() => fail(k)} />)
              : <img src={srcOf(s, k)} alt={s.caption || ''} draggable={false} loading={k === 0 ? 'eager' : 'lazy'}
                  onError={() => !bad[k] && fail(k)} />}
          </div>
        ))}
      </div>
      {shade && <div className="shade" />}
      {children}
      <div className="ctrl"><div className="wrap ctrl-in">
        <div className="segs" role="tablist" aria-label="Pilih slide">
          {slides.map((_, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} className="seg" onClick={() => go(k)}>
              <i ref={(el) => (segs.current[k] = el)} />
            </button>
          ))}
        </div>
        <span className="cap">{cur.caption}</span>
        <div className="ctrl-btns">
          {isVideo && <button className="cbtn" onClick={() => setMuted(!muted)} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}><Icon n={muted ? 'mute' : 'sound'} s={18} /></button>}
          <button className="cbtn" onClick={() => go(i - 1)} aria-label="Sebelumnya"><Icon n="left" s={18} /></button>
          <button className="cbtn" onClick={() => setUserPause(!userPause)} aria-label={userPause ? 'Putar otomatis' : 'Jeda'}><Icon n={userPause ? 'play' : 'pause'} s={16} /></button>
          <button className="cbtn" onClick={next} aria-label="Berikutnya"><Icon n="right" s={18} /></button>
        </div>
      </div></div>
    </div>
  )
}
