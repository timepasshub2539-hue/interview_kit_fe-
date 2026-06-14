import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import MascotCharacter from '../components/MascotCharacter'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      localStorage.setItem('access_token', data.access_token)
      nav('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const { isDark } = useTheme()
  const cardStyle = { background: isDark ? 'rgba(6,11,24,0.88)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.18)'}`, backdropFilter: 'blur(24px)', boxShadow: `0 25px 60px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(99,102,241,0.1)'}` }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <div className="relative z-10 w-full max-w-4xl flex items-center gap-12">

        {/* LEFT: Mascot + tagline */}
        <div className="hidden lg:flex flex-col items-center flex-1 gap-6">
          <MascotCharacter theme="welcome" size="lg" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Meet{' '}
              <span style={{ background: 'linear-gradient(90deg,#a78bfa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Aria
              </span>
            </h2>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs">
              Your AI interview coach. She'll guide you, track your progress, and cheer you on every step of the way!
            </p>
          </div>
          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            {['🤖 AI Questions', '⚡ Instant Scoring', '4 Round Types', '📊 Full Report'].map(f => (
              <span key={f} className="text-xs text-white/30 rounded-full px-3 py-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex-1 w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mb-4 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
                boxShadow: '0 0 40px rgba(96,165,250,0.4), 0 20px 40px rgba(0,0,0,0.4)',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              🎯
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Interview{' '}
              <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Practice
              </span>
            </h1>
            <p className="text-white/30 text-sm">Your AI-powered interview coach</p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
            style={cardStyle}
          >
            <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text)' }}>Welcome back</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Sign in to continue your practice</p>

            {error && (
              <div className="rounded-xl px-4 py-3 mb-5 text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email" placeholder="you@example.com" required
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password" placeholder="••••••••" required
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 30px rgba(96,165,250,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in →'}
              </button>
            </form>

            <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-3)' }}>
              No account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one free →
              </Link>
            </p>
          </div>

          {/* Mobile feature pills */}
          <div className="flex justify-center gap-2 mt-5 flex-wrap lg:hidden">
            {['🤖 AI Questions', '⚡ Instant Scoring', '4 Round Types', '📊 Full Report'].map(f => (
              <span key={f} className="text-xs text-white/25 rounded-full px-3 py-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
