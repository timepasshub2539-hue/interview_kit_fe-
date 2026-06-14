import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import TourGuide from '../components/TourGuide'
import MatchAnalysisPanel from '../components/MatchAnalysisPanel'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const STATUS_META = {
  uploading:   { label: 'Uploading…',        dot: 'bg-yellow-400',             badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  analyzing:   { label: 'AI Analyzing…',     dot: 'bg-blue-400 animate-pulse', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  in_progress: { label: 'Ready to Practice', dot: 'bg-emerald-400',            badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  completed:   { label: 'Completed',          dot: 'bg-gray-400',               badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
}

const TOUR_STEPS = [
  { icon: '👋', title: 'Welcome to Interview Practice!',
    body: 'AI-powered mock interviews tailored to your resume and target role. Let me show you around in 4 quick steps.',
    selector: null },
  { icon: '➕', title: 'Create a New Session',
    body: 'Click here to start a mock interview. Upload your resume and the job description — the AI does the rest.',
    selector: '[data-tour="new-session"]' },
  { icon: '📊', title: 'Track Your Progress',
    body: 'See all your sessions, match scores, and completed rounds at a glance.',
    selector: '[data-tour="stats"]' },
  { icon: '▶️', title: 'Start Practising',
    body: 'When a session is ready, click "Start Practice" to enter the interview. Questions appear one by one across 4 rounds.',
    selector: '[data-tour="sessions-list"]' },
]

export default function Dashboard() {
  const nav = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)   // session id being deleted
  const [confirmId, setConfirmId] = useState(null)  // session id awaiting confirm
  const [user, setUser] = useState(null)

  const [streak, setStreak] = useState(0)
  useEffect(() => { api.me().then(u => { setUser(u); setStreak(u.streak_count || 0) }).catch(() => {}) }, [])

  function fetchSessions() {
    api.listSessions().then(setSessions).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(() => {
    fetchSessions()
    const iv = setInterval(fetchSessions, 15000)
    return () => clearInterval(iv)
  }, [])

  function handleLogout() {
    localStorage.removeItem('access_token')
    nav('/login')
  }

  async function handleDelete(id) {
    setDeleting(id)
    setConfirmId(null)
    try {
      await api.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  const stats = [
    { label: 'Sessions',  value: sessions.length,                                        icon: '📋', color: '#3b82f6' },
    { label: 'Ready',     value: sessions.filter(s => s.status === 'in_progress').length, icon: '🎯', color: '#10b981' },
    { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length,   icon: '🏆', color: '#8b5cf6' },
  ]

  const { isDark } = useTheme()

  // Sync mascot theme to ChatWidget via custom event
  useEffect(() => {
    const hasCelebrate = sessions.some(s => s.status === 'completed')
    const hasAnalyzing = sessions.some(s => s.status === 'analyzing')
    const theme = hasCelebrate ? 'celebrating' : hasAnalyzing ? 'analyzing' : sessions.length === 0 ? 'welcome' : 'coffee'
    window.dispatchEvent(new CustomEvent('aria-mascot:theme', { detail: theme }))
  }, [sessions])

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />
      <TourGuide steps={TOUR_STEPS} storageKey="ip_tour_v2" />

      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center px-4"
          style={{ background: 'rgba(2,8,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-7 max-w-sm w-full text-center"
            style={{ background: 'rgba(10,20,40,0.95)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-white font-bold text-lg mb-1">Delete this session?</h3>
            <p className="text-white/40 text-sm mb-5">All questions, answers, and reports for this session will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-white/60 text-sm font-medium hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmId)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 sticky top-0"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-xl"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 20px rgba(96,165,250,0.3)' }}>
              🎯
            </div>
            <div>
              <p className="font-bold leading-tight" style={{ color: 'var(--text)' }}>Interview Practice</p>
              <p className="text-xs font-mono" style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI-Powered Coach
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Profile avatar */}
            <button onClick={() => nav('/profile')}
              title="My Profile"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-all hover:scale-110 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed,#ec4899)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
              {(user?.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
            </button>
            <button data-tour="new-session" onClick={() => nav('/sessions/new')}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 25px rgba(96,165,250,0.35)' }}>
              + New Session
            </button>
            <button onClick={handleLogout} className="text-sm transition-colors px-2 py-2" style={{ color: 'var(--text-3)' }}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8 relative z-10">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Your Interview{' '}
            <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dashboard
            </span>
          </h1>
          <p className="text-sm font-mono" style={{ color: 'var(--text-3)' }}>// Every question makes you sharper</p>
        </div>

        {/* Two-column layout — sessions left, sidebar right */}
        {/* Right margin leaves room for the floating mascot */}
        <div className="flex gap-6 items-start" style={{ paddingRight: 200 }}>

          {/* ── LEFT: sessions list ── */}
          <div className="flex-1 min-w-0">
            {/* List header */}
            <div className="flex items-center justify-between mb-4" data-tour="sessions-list">
              <h2 className="text-lg font-bold font-mono" style={{ color: 'var(--text)' }}>// Sessions</h2>
              <button onClick={fetchSessions}
                className="text-xs rounded-lg px-3 py-1.5 transition-all font-mono"
                style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                ↻ refresh
              </button>
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-2xl p-6 animate-pulse"
                    style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', border: '1px solid var(--border)' }}>
                    <div className="h-3 rounded w-1/4 mb-3" style={{ background: 'var(--border)' }} />
                    <div className="h-4 rounded w-1/3" style={{ background: 'var(--border)' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && sessions.length === 0 && (
              <div className="rounded-2xl p-16 text-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)', border: '2px dashed var(--border)' }}>
                <div className="text-6xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>🎯</div>
                <p className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No sessions yet</p>
                <p className="text-sm mb-6 font-mono" style={{ color: 'var(--text-3)' }}>// Start your first AI-powered mock interview</p>
                <button onClick={() => nav('/sessions/new')}
                  className="font-semibold px-8 py-3 rounded-xl text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 30px rgba(96,165,250,0.3)' }}>
                  + Start Your First Session
                </button>
              </div>
            )}

            {/* Session cards */}
            <ul className="space-y-3">
              {sessions.map((s) => {
                const meta = STATUS_META[s.status] || STATUS_META.uploading
                const canStart = s.status === 'in_progress' || s.status === 'analyzing'
                const isDeleting = deleting === s.id

                return (
                  <li key={s.id}
                    className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.82)',
                      border: '1px solid var(--border)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 4px 20px var(--card-shadow)`,
                      opacity: isDeleting ? 0.4 : 1,
                    }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`}
                          style={{
                            boxShadow: s.status === 'in_progress' ? '0 0 10px rgba(52,211,153,0.7)' :
                              s.status === 'analyzing' ? '0 0 10px rgba(96,165,250,0.7)' : 'none'
                          }} />
                        <div className="min-w-0">
                          {s.title && (
                            <p className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--text)' }}>{s.title}</p>
                          )}
                          <p className="text-xs font-mono tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                            #{s.id.slice(0, 8).toUpperCase()}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${meta.badge}`}>
                              {meta.label}
                            </span>
                            {s.match_score != null && (
                              <span className="text-sm font-mono" style={{ color: 'var(--text-2)' }}>
                                match:{' '}
                                <strong className={
                                  s.match_score >= 85 ? 'text-emerald-400' :
                                  s.match_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }>{s.match_score.toFixed(0)}%</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {canStart && (
                          <Link to={`/sessions/${s.id}/interview`}
                            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:scale-105 whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 16px rgba(96,165,250,0.25)' }}>
                            {s.status === 'analyzing' ? '⏳ Preparing…' : '▶ Start Practice'}
                          </Link>
                        )}
                        {s.status === 'completed' && (
                          <Link to={`/sessions/${s.id}/report`}
                            className="text-sm font-semibold px-4 py-2 rounded-xl text-emerald-300 transition-all hover:scale-105 whitespace-nowrap"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                            📊 View Report
                          </Link>
                        )}
                        <button onClick={() => setConfirmId(s.id)} disabled={isDeleting} title="Delete session"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
                          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                          {isDeleting
                            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : '🗑'}
                        </button>
                      </div>
                    </div>
                    <MatchAnalysisPanel session={s} />
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="flex-shrink-0 space-y-4" style={{ width: 280 }}>
            {/* Stats */}
            <div className="rounded-2xl p-5" data-tour="stats"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
              <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// Overview</p>
              <div className="space-y-3">
                {stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{s.label}</span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl p-5"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
              <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// Quick Actions</p>
              <div className="space-y-2">
                <button onClick={() => nav('/sessions/new')}
                  className="w-full text-left text-sm font-semibold px-4 py-3 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                  ＋ New Interview Session
                </button>
                <button onClick={() => nav('/study')}
                  className="w-full text-left text-sm font-semibold px-4 py-3 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                  📚 Study Courses (20 tracks)
                </button>
                <button onClick={() => nav('/resume-creator')}
                  className="w-full text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: isDark ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                  📄 Resume Creator
                </button>
                <button onClick={() => nav('/roadmap')}
                  className="w-full text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.1)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.25)' }}>
                  🗺️ Career Roadmap
                </button>
                <button onClick={() => nav('/profile')}
                  className="w-full text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  👤 My Profile
                </button>
              </div>
            </div>

            {/* Streak card */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <div className="text-4xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#f97316' }}>{streak} day{streak !== 1 ? 's' : ''}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>Practice streak</p>
              </div>
            </div>

            {/* Quick nav */}
            <div className="rounded-2xl p-5"
              style={{ background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="text-xs font-mono font-semibold mb-3" style={{ color: '#a78bfa' }}>// More Tools</p>
              <div className="space-y-1.5">
                <button onClick={() => nav('/analytics')} className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--text-2)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>📊 Progress Analytics</button>
                <button onClick={() => nav('/bookmarks')} className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--text-2)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>★ Saved Questions</button>
                <button onClick={() => nav('/behavioral')} className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--text-2)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>🎤 Behavioral Bank</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
