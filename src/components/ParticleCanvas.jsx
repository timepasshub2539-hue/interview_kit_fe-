import { useEffect, useRef } from 'react'

const CONFIG = {
  count: 90,
  maxDist: 140,
  speed: 0.4,
  mouseRadius: 120,
  mouseForce: 0.06,
  colors: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#818cf8'],
  minR: 1.5,
  maxR: 4,
}

function lerp(a, b, t) { return a + (b - a) * t }

export default function ParticleCanvas({ className = '' }) {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -9999, y: -9999 })
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight

    // Particles
    const particles = Array.from({ length: CONFIG.count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.speed * 2,
      vy: (Math.random() - 0.5) * CONFIG.speed * 2,
      r: CONFIG.minR + Math.random() * (CONFIG.maxR - CONFIG.minR),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      baseAlpha: 0.4 + Math.random() * 0.5,
      alpha: 0.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }))

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    function onMouse(e) {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    function onTouch(e) {
      if (e.touches[0]) mouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch)

    function draw() {
      ctx.clearRect(0, 0, W, H)

      const mx = mouse.current.x
      const my = mouse.current.y

      // Update
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONFIG.mouseRadius) {
          const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius
          p.vx += (dx / dist) * force * CONFIG.mouseForce
          p.vy += (dy / dist) * force * CONFIG.mouseForce
        }

        // Damping
        p.vx *= 0.98
        p.vy *= 0.98

        // Clamp speed
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd > CONFIG.speed * 3) { p.vx *= CONFIG.speed * 3 / spd; p.vy *= CONFIG.speed * 3 / spd }
        if (spd < CONFIG.speed * 0.1) { p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02 }

        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed
        p.alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(p.pulse))

        // Wrap edges
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < CONFIG.maxDist) {
            const opacity = (1 - d / CONFIG.maxDist) * 0.25
            ctx.beginPath()
            ctx.strokeStyle = `rgba(148,163,255,${opacity})`
            ctx.lineWidth = 0.7
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5)
        grd.addColorStop(0, p.color + 'cc')
        grd.addColorStop(1, p.color + '00')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.globalAlpha = p.alpha * 0.4
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Mouse ripple
      if (mx > 0 && mx < W) {
        const rGrd = ctx.createRadialGradient(mx, my, 0, mx, my, CONFIG.mouseRadius)
        rGrd.addColorStop(0, 'rgba(96,165,250,0.06)')
        rGrd.addColorStop(1, 'rgba(96,165,250,0)')
        ctx.beginPath()
        ctx.arc(mx, my, CONFIG.mouseRadius, 0, Math.PI * 2)
        ctx.fillStyle = rGrd
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  )
}
