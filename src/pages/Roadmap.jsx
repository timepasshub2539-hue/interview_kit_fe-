import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const ROLES = [
  { key: 'Frontend Developer',      icon: '🎨', color: '#f472b6' },
  { key: 'Backend Developer',       icon: '⚙️', color: '#60a5fa' },
  { key: 'Full Stack Developer',    icon: '🌐', color: '#a78bfa' },
  { key: 'Data Engineer',           icon: '🔧', color: '#34d399' },
  { key: 'Data Scientist',          icon: '📊', color: '#fbbf24' },
  { key: 'ML Engineer',             icon: '🤖', color: '#f97316' },
  { key: 'DevOps / SRE',            icon: '🚀', color: '#22d3ee' },
  { key: 'Mobile Developer',        icon: '📱', color: '#e879f9' },
  { key: 'QA Engineer',             icon: '🔍', color: '#86efac' },
  { key: 'Cloud Architect',         icon: '☁️', color: '#93c5fd' },
  { key: 'Other',                   icon: '✏️', color: '#a5b4fc' },
]

const ROLE_SKILLS = {
  'Frontend Developer':   ['HTML & CSS', 'JavaScript (ES6+)', 'React / Vue / Angular', 'TypeScript', 'REST APIs', 'Git', 'Responsive Design', 'Testing (Jest/Cypress)'],
  'Backend Developer':    ['Python / Java / Node.js', 'REST API Design', 'SQL Databases', 'NoSQL (MongoDB/Redis)', 'Authentication (JWT/OAuth)', 'Docker', 'System Design', 'Git'],
  'Full Stack Developer': ['HTML/CSS', 'JavaScript & React', 'Backend Language', 'SQL & NoSQL', 'REST APIs', 'Docker', 'Git', 'Testing'],
  'Data Engineer':        ['Python', 'SQL (Advanced)', 'ETL Pipelines', 'Spark / Hadoop', 'Cloud (AWS/GCP)', 'Airflow', 'Data Warehousing', 'Docker'],
  'Data Scientist':       ['Python', 'Statistics & Math', 'Machine Learning', 'SQL', 'Data Visualization', 'Deep Learning', 'Feature Engineering', 'Model Deployment'],
  'ML Engineer':          ['Python', 'Machine Learning', 'Deep Learning / PyTorch', 'MLOps', 'Cloud Platforms', 'Docker / Kubernetes', 'REST APIs', 'Data Engineering'],
  'DevOps / SRE':         ['Linux', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Cloud (AWS/GCP/Azure)', 'Terraform / IaC', 'Monitoring (Prometheus/Grafana)', 'Scripting (Bash/Python)'],
  'Mobile Developer':     ['Swift / Kotlin / React Native', 'UI/UX Principles', 'REST APIs', 'State Management', 'Testing', 'App Store Deployment', 'Git', 'Performance Optimization'],
  'QA Engineer':          ['Manual Testing', 'Automation (Selenium/Cypress)', 'API Testing (Postman)', 'SQL', 'Test Planning & Strategy', 'CI/CD', 'Bug Tracking (Jira)', 'Performance Testing'],
  'Cloud Architect':      ['Cloud Platforms (AWS/GCP/Azure)', 'Networking', 'Security & IAM', 'Docker / Kubernetes', 'Terraform', 'Cost Optimization', 'System Design', 'Databases'],
}

const RESOURCE_ICONS = { course: '🎓', book: '📖', video: '▶️', docs: '📄', practice: '💻', article: '📝' }
const DIFF_COLOR = { beginner: '#34d399', intermediate: '#fbbf24', advanced: '#f472b6' }

const TABS = [
  { key: 'overview',   label: '📋 Overview' },
  { key: 'path',       label: '🗺️ Learning Path' },
  { key: 'resources',  label: '📚 Resources' },
  { key: 'projects',   label: '💡 Projects' },
  { key: 'cheatsheet', label: '📄 Cheat Sheet' },
  { key: 'practice',   label: '🏋️ Practice' },
]

function Gauge({ pct }) {
  const r = 52, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const offset = arc - (arc * pct) / 100
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f472b6'
  return (
    <svg width="128" height="100" viewBox="0 0 128 110" style={{ overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${arc - offset} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize="20" fontWeight="bold">{pct}%</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">Readiness</text>
    </svg>
  )
}

export default function Roadmap() {
  const nav = useNavigate()
  const { isDark } = useTheme()

  const [step, setStep] = useState('role')      // 'role' | 'skills' | 'result'
  const [selectedRole, setSelectedRole] = useState(null)
  const [customRole, setCustomRole] = useState('')
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const theme = loading ? 'analyzing' : step === 'result' ? 'celebrating' : 'reading'
    window.dispatchEvent(new CustomEvent('aria-mascot:theme', { detail: theme }))
  }, [step, loading])

  function selectRole(role) {
    setSelectedRole(role)
    if (role !== 'Other') {
      const defaults = {}
      ROLE_SKILLS[role]?.forEach(s => { defaults[s] = 3 })
      setRatings(defaults)
      setStep('skills')
    }
  }

  function confirmCustomRole() {
    const role = customRole.trim()
    if (!role) return
    setSelectedRole(role)
    setRatings({})
    setStep('skills')
  }

  async function generate() {
    setLoading(true); setError('')
    try {
      const skillRatings = Object.entries(ratings).map(([skill, rating]) => ({ skill, rating }))
      const result = await api.generateRoadmap(selectedRole, skillRatings)
      setRoadmap(result)
      setStep('result')
      setTab('overview')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(16px)',
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      <header className="glass-dark sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => nav('/')} className="text-sm transition-colors" style={{ color: 'var(--text-3)' }}>← Dashboard</button>
          <span style={{ color: 'var(--text-3)' }}>|</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>🗺️ Career Roadmap Creator</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">

        {/* ── STEP 1: Role selection ── */}
        {step === 'role' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Which role are you targeting?
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Select your goal role — we'll assess your skills and build a personalised roadmap.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {ROLES.map(({ key, icon, color }) => (
                <button
                  key={key}
                  onClick={() => selectRole(key)}
                  className="rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    ...cardStyle,
                    borderColor: selectedRole === key ? color : undefined,
                    boxShadow: selectedRole === key ? `0 0 0 2px ${color}55` : undefined,
                  }}
                >
                  <div className="text-3xl mb-3">{icon}</div>
                  <div className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>{key}</div>
                </button>
              ))}
            </div>

            {/* Custom role input — shown when "Other" is selected */}
            {selectedRole === 'Other' && (
              <div className="mt-5 flex gap-3 items-end max-w-md">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                    Type your target role
                  </label>
                  <input
                    autoFocus
                    type="text"
                    className="input-field"
                    placeholder="e.g. Blockchain Developer, Game Developer, Security Engineer…"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmCustomRole()}
                  />
                </div>
                <button
                  onClick={confirmCustomRole}
                  disabled={!customRole.trim()}
                  className="btn-primary py-2.5 px-5 text-sm disabled:opacity-40"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Skill self-assessment ── */}
        {step === 'skills' && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep('role')} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>← Change role</button>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                Rate your current skills
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Be honest — this helps the AI build the right roadmap for you.
                <span className="font-semibold"> Target role: {selectedRole}</span>
              </p>
            </div>

            {!ROLE_SKILLS[selectedRole] && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd' }}>
                ✨ Custom role detected — the AI will generate a full roadmap for <strong>{selectedRole}</strong> without needing skill ratings. Click Generate to continue.
              </div>
            )}

            <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
              {(ROLE_SKILLS[selectedRole] ?? []).length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No predefined skills for this role — AI will generate a tailored roadmap.</p>
              ) : null}
              {ROLE_SKILLS[selectedRole]?.map(skill => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{skill}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      {['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][ratings[skill] || 3]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={1} max={5} step={1}
                      value={ratings[skill] || 3}
                      onChange={e => setRatings(r => ({ ...r, [skill]: +e.target.value }))}
                      className="flex-1 accent-indigo-500"
                    />
                    <div className="flex gap-1 flex-shrink-0">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className="w-2 h-2 rounded-full transition-all"
                          style={{ background: n <= (ratings[skill] || 3) ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <button
              onClick={generate}
              disabled={loading}
              className="btn-primary w-full mt-6 py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building your roadmap…
                </span>
              ) : '🗺️ Generate My Roadmap →'}
            </button>
          </div>
        )}

        {/* ── STEP 3: Roadmap result ── */}
        {step === 'result' && roadmap && (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <Gauge pct={roadmap.overall_readiness_pct} />
              <div className="flex-1">
                <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Your roadmap for</p>
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>{roadmap.role}</h1>
                <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{roadmap.summary}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }}>
                    ⏱ {roadmap.estimated_time_to_ready}
                  </span>
                  {roadmap.strengths?.slice(0,2).map(s => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}>✓ {s}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep('skills')} className="text-xs px-4 py-2 rounded-xl transition-all" style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                ← Re-assess
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={tab === t.key
                    ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))', color: 'var(--text)', border: '1px solid rgba(99,102,241,0.5)' }
                    : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={cardStyle}>
                  <p className="text-xs font-mono mb-3" style={{ color: '#34d399' }}>// strengths</p>
                  {roadmap.strengths?.map(s => (
                    <div key={s} className="flex items-start gap-2 mb-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span> {s}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-5" style={cardStyle}>
                  <p className="text-xs font-mono mb-3" style={{ color: '#f87171' }}>// gaps to fill</p>
                  {roadmap.gaps?.map(g => (
                    <div key={g} className="flex items-start gap-2 mb-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <span className="text-red-400 flex-shrink-0 mt-0.5">→</span> {g}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-5 sm:col-span-2" style={cardStyle}>
                  <p className="text-xs font-mono mb-3" style={{ color: '#a5b4fc' }}>// key interview questions</p>
                  <ol className="space-y-2">
                    {roadmap.key_interview_questions?.map((q, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-2)' }}>
                        <span className="font-mono text-indigo-400 flex-shrink-0">{String(i+1).padStart(2,'0')}.</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Tab: Learning Path */}
            {tab === 'path' && (
              <div className="space-y-4">
                {roadmap.phases?.map((phase, i) => (
                  <div key={i} className="rounded-2xl p-6" style={cardStyle}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg,#6366f1,#a78bfa)` }}>
                        {phase.phase}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="font-bold" style={{ color: 'var(--text)' }}>{phase.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(96,165,250,0.12)', color: '#93c5fd' }}>⏱ {phase.duration}</span>
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{phase.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.topics?.map(t => (
                            <span key={t} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Resources */}
            {tab === 'resources' && (
              <div className="space-y-6">
                {roadmap.phases?.map((phase, i) => (
                  phase.resources?.length > 0 && (
                    <div key={i}>
                      <p className="text-xs font-mono mb-3" style={{ color: 'var(--text-3)' }}>// Phase {phase.phase}: {phase.title}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {phase.resources.map((res, j) => (
                          <a key={j} href={res.url || '#'} target="_blank" rel="noreferrer"
                            className="rounded-xl p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5"
                            style={cardStyle}>
                            <span className="text-xl">{RESOURCE_ICONS[res.type] || '📌'}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{res.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{res.type}</span>
                                {res.free && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7' }}>Free</span>}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Tab: Projects */}
            {tab === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roadmap.projects?.map((proj, i) => (
                  <div key={i} className="rounded-2xl p-5" style={cardStyle}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{proj.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                        style={{ background: `${DIFF_COLOR[proj.difficulty]}18`, color: DIFF_COLOR[proj.difficulty], border: `1px solid ${DIFF_COLOR[proj.difficulty]}35` }}>
                        {proj.difficulty}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skills_practiced?.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Cheat Sheet */}
            {tab === 'cheatsheet' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roadmap.cheat_sheet?.map((section, i) => (
                  <div key={i} className="rounded-2xl p-5" style={cardStyle}>
                    <p className="text-xs font-mono font-semibold mb-3" style={{ color: '#a5b4fc' }}>// {section.topic}</p>
                    {section.key_points?.map((pt, j) => (
                      <div key={j} className="flex items-start gap-2 mb-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                        <span className="text-indigo-400 flex-shrink-0">▸</span> {pt}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Practice */}
            {tab === 'practice' && (
              <div className="space-y-3">
                {roadmap.daily_practice_tips?.map((tip, i) => (
                  <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={cardStyle}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--text-2)' }}>{tip}</p>
                  </div>
                ))}
                <div className="rounded-2xl p-5 mt-2" style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.3)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Ready to practice interviews?</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Start a mock interview session tailored to the {roadmap.role} role.</p>
                  <button onClick={() => nav('/sessions/new')} className="btn-primary text-sm py-2.5">
                    ▶ Start Interview Practice →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
