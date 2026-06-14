import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import MascotCharacter from '../components/MascotCharacter'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
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
      await api.register(form)
      const data = await api.login({ email: form.email, password: form.password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.removeItem('ip_tour_v2')   // always show tour for new accounts
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
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <div className="relative z-10 w-full max-w-4xl flex items-center gap-12">

        {/* LEFT: Mascot */}
        <div className="hidden lg:flex flex-col items-center flex-1 gap-6">
          <MascotCharacter theme="reading" size="lg" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Let's get you{' '}
              <span style={{ background: 'linear-gradient(90deg,#34d399,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                hired
              </span>
            </h2>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs">
              Upload your resume, paste a job description, and Aria will run a personalised mock interview for you — for free.
            </p>
          </div>
          <div className="space-y-2 w-full max-w-xs">
            {[
              { icon: '📄', text: 'Resume & JD analysis' },
              { icon: '💻', text: '4 interview rounds (Tech, Code, HR, Mgmt)' },
              { icon: '📊', text: 'Instant scoring with tips' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span>{icon}</span>
                <span className="text-white/40 text-xs">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex-1 w-full max-w-md mx-auto">
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mb-4 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
                boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 20px 40px rgba(0,0,0,0.4)',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              🚀
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Get{' '}
              <span style={{ background: 'linear-gradient(90deg,#a78bfa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Interview Ready
              </span>
            </h1>
            <p className="text-white/30 text-sm">Join and start practising with AI today — free</p>
          </div>

          <div
            className="rounded-2xl p-8"
            style={cardStyle}
          >
            <h2 className="text-xl font-bold mb-0.5" style={{ color: 'var(--text)' }}>Create your account</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Takes 30 seconds — no card required</p>

            {error && (
              <div className="rounded-xl px-4 py-3 mb-5 text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'full_name', label: 'Full Name', type: 'text', ph: 'Alex Johnson' },
                { key: 'email', label: 'Email', type: 'email', ph: 'you@example.com' },
                { key: 'password', label: 'Password', type: 'password', ph: 'Min 8 characters', min: 8 },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type} placeholder={f.ph} required minLength={f.min}
                    className="input-field"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account…
                  </span>
                ) : 'Create Account →'}
              </button>
            </form>

            <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-3)' }}>
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
