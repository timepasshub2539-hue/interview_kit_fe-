import { useState, useEffect, useRef } from 'react'

function getRect(selector) {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, el }
}

// Build 4-rect mask so the highlighted area is a real transparent hole
function Mask({ rect, padding = 8 }) {
  const W = window.innerWidth
  const H = window.innerHeight
  const style = 'fixed pointer-events-none'
  const bg = 'rgba(2,8,20,0.82)'

  if (!rect) {
    return <div className={`${style} inset-0`} style={{ background: bg, zIndex: 9997 }} />
  }

  const { top, left, width, height } = rect
  const hTop = Math.max(0, top - padding)
  const hLeft = Math.max(0, left - padding)
  const hRight = Math.min(W, left + width + padding)
  const hBottom = Math.min(H, top + height + padding)

  return (
    <>
      {/* Top */}
      <div className={style} style={{ background: bg, zIndex: 9997, top: 0, left: 0, right: 0, height: hTop }} />
      {/* Bottom */}
      <div className={style} style={{ background: bg, zIndex: 9997, top: hBottom, left: 0, right: 0, bottom: 0 }} />
      {/* Left */}
      <div className={style} style={{ background: bg, zIndex: 9997, top: hTop, left: 0, width: hLeft, height: hBottom - hTop }} />
      {/* Right */}
      <div className={style} style={{ background: bg, zIndex: 9997, top: hTop, left: hRight, right: 0, height: hBottom - hTop }} />
      {/* Spotlight border ring */}
      <div
        className="fixed pointer-events-none rounded-2xl"
        style={{
          zIndex: 9998,
          top: hTop, left: hLeft,
          width: hRight - hLeft, height: hBottom - hTop,
          border: '2px solid rgba(96,165,250,0.7)',
          boxShadow: '0 0 0 1px rgba(96,165,250,0.2), 0 0 30px rgba(96,165,250,0.3)',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </>
  )
}

export default function TourGuide({ steps, onDone, storageKey = 'tour_done' }) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  // Read from localStorage inside state so it's always current at mount time
  const [seen] = useState(() => !!localStorage.getItem(storageKey))

  useEffect(() => {
    if (seen) return
    timerRef.current = setTimeout(() => setVisible(true), 900)
    return () => clearTimeout(timerRef.current)
  }, [seen])

  useEffect(() => {
    if (!visible) return
    const step = steps[idx]

    function measure() {
      if (step?.selector) {
        const r = getRect(step.selector)
        setRect(r || null)
      } else {
        setRect(null)
      }
    }

    measure()
    // Re-measure after layout shift
    const t = setTimeout(measure, 150)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [idx, visible, steps])

  if (seen || !visible) return null  // seen is boolean state, stable after mount

  const step = steps[idx]
  const isLast = idx === steps.length - 1

  function next() {
    if (isLast) finish()
    else setIdx(i => i + 1)
  }
  function finish() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onDone?.()
  }

  // Tooltip positioning
  const PAD = 12
  const TIP_W = 290
  const TIP_H = 180
  const VW = window.innerWidth
  const VH = window.innerHeight

  let tipTop, tipLeft

  if (rect) {
    const { top, left, width, height } = rect
    // Try below
    if (top + height + PAD + TIP_H < VH) {
      tipTop = top + height + PAD
    } else {
      tipTop = top - TIP_H - PAD
    }
    tipLeft = left + width / 2 - TIP_W / 2
    tipLeft = Math.max(PAD, Math.min(tipLeft, VW - TIP_W - PAD))
    tipTop = Math.max(PAD, tipTop)
  } else {
    tipTop = VH / 2 - TIP_H / 2
    tipLeft = VW / 2 - TIP_W / 2
  }

  return (
    <>
      <Mask rect={rect} />

      {/* Tooltip — above everything */}
      <div
        className="fixed pointer-events-auto"
        style={{ zIndex: 9999, top: tipTop, left: tipLeft, width: TIP_W, transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <div
          className="rounded-2xl p-5 shadow-2xl"
          style={{
            background: 'rgba(6,14,32,0.96)',
            border: '1px solid rgba(96,165,250,0.3)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(96,165,250,0.1)',
          }}
        >
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 24 : 6,
                  background: i === idx ? '#60a5fa' : i < idx ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>

          <div className="text-xl mb-2">{step.icon}</div>
          <h3 className="font-bold text-sm mb-1.5" style={{ color: '#ffffff' }}>{step.title}</h3>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.72)' }}>{step.body}</p>

          <div className="flex items-center justify-between">
            <button onClick={finish} className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              Skip tour
            </button>
            <button
              onClick={next}
              className="text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ color: '#ffffff', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 20px rgba(96,165,250,0.3)' }}
            >
              {isLast ? "Let's go! 🚀" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
