import { useEffect, useRef } from 'react'

const CODE_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]()<>=!&|^~#@$%/*+-;:.,?_'
const CODE_WORDS = ['const', 'async', 'await', 'return', 'import', 'export', 'function', 'class',
  'interface', 'let', 'var', 'if', 'else', 'for', 'while', 'try', 'catch', 'null', 'true', 'false',
  'def', 'lambda', 'yield', 'from', 'with', 'pass', 'SELECT', 'WHERE', 'JOIN', 'FROM',
  '#!/usr', 'npm', 'git', 'push', 'pull', 'fetch', 'POST', 'GET', '200', '404', '500',
  'AI', 'ML', 'GPT', 'LLM', 'RAG', 'API', 'SDK', 'CLI']

const PULSE_NODES = 18

export default function CodeBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -999, y: -999 })
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)

    // ── Matrix rain columns ──────────────────────────────────────────────────
    const COL_W = 18
    const cols = Math.ceil(W / COL_W)

    const drops = Array.from({ length: cols }, () => ({
      y: Math.random() * -H,
      speed: 0.6 + Math.random() * 1.4,
      word: Math.random() < 0.15 ? CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] : null,
      wordIdx: 0,
      brightness: 0.3 + Math.random() * 0.7,
      hue: Math.random() < 0.5 ? 210 : 160, // blue or green
      trailLen: 8 + Math.floor(Math.random() * 18),
      chars: Array.from({ length: 28 + Math.floor(Math.random() * 20) }, () =>
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ),
      charTimer: 0,
    }))

    // ── Floating code keywords ────────────────────────────────────────────────
    const floaters = Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      text: CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)],
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.25,
      alpha: 0.04 + Math.random() * 0.1,
      size: 10 + Math.floor(Math.random() * 14),
      hue: [210, 270, 160, 320][Math.floor(Math.random() * 4)],
    }))

    // ── Circuit/pulse nodes ──────────────────────────────────────────────────
    const nodes = Array.from({ length: PULSE_NODES }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 3,
      pulse: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.025,
      hue: [210, 270, 160][Math.floor(Math.random() * 3)],
    }))

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    function onMouse(e) { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouse)

    let frame = 0

    function draw() {
      frame++
      // Semi-transparent clear for trail effect
      ctx.fillStyle = 'rgba(4,13,26,0.18)'
      ctx.fillRect(0, 0, W, H)

      // ── Draw matrix rain ──────────────────────────────────────────────
      ctx.font = `bold ${COL_W - 2}px "Courier New", monospace`
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i]
        d.charTimer++

        // Scramble chars occasionally
        if (d.charTimer % 8 === 0) {
          const ri = Math.floor(Math.random() * d.chars.length)
          d.chars[ri] = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
        }

        const col = i * COL_W

        // Draw trail
        for (let t = 0; t < d.trailLen; t++) {
          const charY = d.y - t * COL_W
          if (charY < 0 || charY > H) continue

          const trailAlpha = ((d.trailLen - t) / d.trailLen) * 0.55 * d.brightness
          const isHead = t === 0

          let ch
          if (d.word && d.wordIdx < d.word.length) {
            ch = isHead ? d.word[d.wordIdx] : d.chars[t % d.chars.length]
          } else {
            ch = d.chars[t % d.chars.length]
          }

          if (isHead) {
            ctx.fillStyle = `hsla(${d.hue},100%,90%,${trailAlpha * 1.6})`
            // Glow effect on head
            ctx.shadowColor = `hsl(${d.hue},100%,70%)`
            ctx.shadowBlur = 8
          } else {
            ctx.fillStyle = `hsla(${d.hue},80%,55%,${trailAlpha})`
            ctx.shadowBlur = 0
          }
          ctx.fillText(ch, col, charY)
          ctx.shadowBlur = 0
        }

        // Advance drop
        d.y += d.speed * COL_W * 0.1
        if (d.word && d.y % (COL_W * 3) < d.speed) d.wordIdx = Math.min(d.wordIdx + 1, d.word.length)
        if (d.y - d.trailLen * COL_W > H) {
          d.y = -COL_W * Math.floor(Math.random() * 20)
          d.speed = 0.6 + Math.random() * 1.4
          d.brightness = 0.3 + Math.random() * 0.7
          d.trailLen = 8 + Math.floor(Math.random() * 18)
          d.word = Math.random() < 0.15 ? CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] : null
          d.wordIdx = 0
        }
      }

      // ── Draw floating keywords ────────────────────────────────────────
      for (const f of floaters) {
        ctx.font = `${f.size}px "Courier New", monospace`
        ctx.fillStyle = `hsla(${f.hue},70%,65%,${f.alpha})`
        ctx.shadowColor = `hsl(${f.hue},80%,55%)`
        ctx.shadowBlur = 6
        ctx.fillText(f.text, f.x, f.y)
        ctx.shadowBlur = 0
        f.x += f.vx
        f.y += f.vy
        if (f.y < -30) { f.y = H + 20; f.x = Math.random() * W; f.text = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] }
        if (f.x < -80 || f.x > W + 80) f.x = Math.random() * W
      }

      // ── Draw circuit nodes & connections ─────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.pulse += n.speed
        const alpha = 0.3 + 0.4 * Math.sin(n.pulse)
        const glow = 4 + 6 * Math.abs(Math.sin(n.pulse))

        // Connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]
          const dx = n.x - m.x, dy = n.y - m.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 200) {
            const lineAlpha = ((200 - d) / 200) * 0.12
            ctx.beginPath()
            ctx.strokeStyle = `hsla(${n.hue},80%,55%,${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(m.x, m.y)
            ctx.stroke()
          }
        }

        // Node dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${n.hue},90%,70%,${alpha})`
        ctx.shadowColor = `hsl(${n.hue},100%,60%)`
        ctx.shadowBlur = glow
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── Mouse glow ───────────────────────────────────────────────────
      const mx = mouse.current.x, my = mouse.current.y
      if (mx > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 100)
        g.addColorStop(0, 'rgba(96,165,250,0.07)')
        g.addColorStop(1, 'rgba(96,165,250,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(mx, my, 100, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    // First fill background
    ctx.fillStyle = '#040d1a'
    ctx.fillRect(0, 0, W, H)
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
