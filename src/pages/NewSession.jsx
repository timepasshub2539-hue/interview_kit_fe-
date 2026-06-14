import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const STEPS = [
  { label: 'Session',         icon: '📋', desc: 'Create a new session' },
  { label: 'Resume',          icon: '📄', desc: 'Upload your CV' },
  { label: 'Job Description', icon: '💼', desc: 'Paste or upload JD' },
  { label: 'Analyze',         icon: '🤖', desc: 'AI generates questions' },
]
const STEP_MASCOT = ['idle', 'reading', 'coffee', 'analyzing']

export default function NewSession() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [jdMode, setJdMode] = useState('text')
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionType, setSessionType] = useState('jd_match')
  const [difficulty, setDifficulty] = useState('medium')
  const [targetCompany, setTargetCompany] = useState('')

  useEffect(() => {
    const theme = loading ? 'analyzing' : STEP_MASCOT[step]
    window.dispatchEvent(new CustomEvent('aria-mascot:theme', { detail: theme }))
  }, [step, loading])

  const POPULAR_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Flipkart', 'Infosys', 'TCS', 'Wipro', 'Accenture', 'Deloitte']

  async function handleCreate() {
    setLoading(true); setError('')
    try {
      const session = await api.createSession(sessionTitle.trim() || null, sessionType, difficulty, targetCompany.trim() || null)
      setSessionId(session.id)
      // jd_only skips resume upload → go to JD step directly
      setStep(sessionType === 'jd_only' ? 2 : 1)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleResumeUpload() {
    if (!resumeFile) return setError('Select a file first')
    setLoading(true); setError('')
    try {
      await api.uploadResume(sessionId, resumeFile)
      // Resume-only: skip JD step, go straight to generate
      setStep(sessionType === 'resume_only' ? 3 : 2)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleJDUpload() {
    setLoading(true); setError('')
    try {
      if (jdMode === 'text') {
        if (!jdText.trim()) { setLoading(false); return setError('Enter job description text') }
        await api.uploadJDText(sessionId, jdText)
      } else {
        if (!jdFile) { setLoading(false); return setError('Select a file') }
        await api.uploadJDFile(sessionId, jdFile)
      }
      setStep(3)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleAnalyze() {
    setLoading(true); setError('')

    if (sessionType === 'resume_only') {
      setStatus('Generating interview questions from your resume…')
      try {
        await api.startResumeInterview(sessionId)
        nav(`/sessions/${sessionId}/interview`)
      } catch (e) { setError(e.message); setLoading(false) }
      return
    }

    if (sessionType === 'jd_only') {
      setStatus('Generating interview questions from the job description…')
      try {
        await api.startJDInterview(sessionId)
        nav(`/sessions/${sessionId}/interview`)
      } catch (e) { setError(e.message); setLoading(false) }
      return
    }

    setStatus('Starting AI analysis…')
    try {
      await api.analyzeSession(sessionId)
      setStatus('Comparing resume to job description…')
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const session = await api.getAnalysis(sessionId)
        if (session.match_analysis) {
          setStatus('Analysis done! Generating 20 questions across 4 rounds…')
          await api.startInterview(sessionId)
          nav(`/sessions/${sessionId}/interview`)
          return
        }
      }
      setError('Analysis timed out. Please retry.')
      setLoading(false)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const { isDark } = useTheme()

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      {/* Header */}
      <header className="glass-dark border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => nav('/')} className="text-sm transition-colors" style={{ color: 'var(--text-2)' }}>
            ← Back
          </button>
          <span style={{ color: 'var(--text-3)' }}>|</span>
          <span className="text-sm" style={{ color: 'var(--text-2)' }}>New Interview Session</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 relative z-10">
        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 shadow-lg ${
                  i < step  ? 'bg-emerald-500 shadow-emerald-500/30' :
                  i === step ? 'bg-gradient-to-br from-blue-500 to-violet-600 shadow-blue-500/40 ring-4 ring-blue-500/20' :
                  'bg-white/5 border border-white/10'
                }`}>
                  {i < step ? '✓' : s.icon}
                </div>
                <span className={`text-xs mt-1.5 font-medium whitespace-nowrap transition-colors ${
                  i === step ? 'text-white' : i < step ? 'text-emerald-400' : 'text-white/25'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 card-3d">
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {step === 0 && (
            <div>
              <div className="text-5xl mb-5 animate-float">🎯</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Start a new session</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Upload your resume and the target job description. The AI generates a personalised
                mock interview with 20 questions across technical, coding, managerial, and HR rounds.
              </p>

              {/* Session type choice */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { key: 'jd_match',     icon: '🎯', label: 'Resume + JD',   desc: 'AI matches your resume to the JD and creates targeted questions' },
                  { key: 'resume_only',  icon: '👤', label: 'Resume Only',   desc: 'Questions generated from your resume — no JD needed' },
                  { key: 'jd_only',      icon: '💼', label: 'JD Only',       desc: 'Questions from the job description — no resume needed' },
                ].map(({ key, icon, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setSessionType(key)}
                    className="rounded-xl p-4 text-left transition-all border-2"
                    style={{
                      background: sessionType === key ? 'rgba(99,102,241,0.12)' : 'var(--surface)',
                      borderColor: sessionType === key ? 'rgba(99,102,241,0.5)' : 'var(--border)',
                    }}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{label}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{desc}</div>
                  </button>
                ))}
              </div>

              {/* Session name */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Session Name (optional)</label>
                <input type="text" className="input-field" placeholder="e.g. Amazon L5 – Backend Engineer…"
                  value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} maxLength={200} />
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Question Difficulty</label>
                <div className="flex gap-2">
                  {[
                    { key: 'easy', label: '🟢 Easy', color: '#10b981' },
                    { key: 'medium', label: '🟡 Medium', color: '#f59e0b' },
                    { key: 'hard', label: '🔴 Hard', color: '#ef4444' },
                  ].map(d => (
                    <button key={d.key} onClick={() => setDifficulty(d.key)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={difficulty === d.key
                        ? { background: `${d.color}22`, border: `2px solid ${d.color}88`, color: d.color }
                        : { background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-3)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Company */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Target Company (optional)</label>
                <input type="text" className="input-field mb-2" placeholder="e.g. Google, Amazon, Infosys…"
                  value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} maxLength={100} />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COMPANIES.map(c => (
                    <button key={c} onClick={() => setTargetCompany(targetCompany === c ? '' : c)}
                      className="text-xs px-3 py-1 rounded-full transition-all"
                      style={targetCompany === c
                        ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)', color: '#a78bfa' }
                        : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} disabled={loading} className="btn-primary w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</span> : 'Create Session →'}
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-5xl mb-5 animate-float">📄</div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload your resume</h2>
              <p className="text-white/40 text-sm mb-6">PDF or DOCX, max 10 MB. The AI reads your experience to craft relevant questions.</p>
              <div
                className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-5 group"
                onClick={() => document.getElementById('resume-input').click()}
              >
                {resumeFile ? (
                  <div>
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-white font-medium">{resumeFile.name}</p>
                    <p className="text-white/30 text-xs mt-1">{(resumeFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📎</div>
                    <p className="text-white/50 text-sm">Click to browse or drag & drop</p>
                    <p className="text-white/20 text-xs mt-1">PDF or DOCX</p>
                  </div>
                )}
                <input id="resume-input" type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files[0])} />
              </div>
              <button onClick={handleResumeUpload} disabled={loading || !resumeFile} className="btn-primary w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</span> : 'Upload & Continue →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-5xl mb-5 animate-float">💼</div>
              <h2 className="text-2xl font-bold text-white mb-2">Job description</h2>
              <p className="text-white/40 text-sm mb-5">Paste the full job posting so the AI can match questions exactly to the role requirements.</p>
              <div className="flex gap-2 mb-4">
                {[{key:'text',label:'✏️ Paste Text'},{key:'file',label:'📎 Upload File'}].map(({key,label}) => (
                  <button
                    key={key}
                    onClick={() => setJdMode(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      jdMode === key
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {jdMode === 'text' ? (
                <textarea
                  rows={10}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none mb-4"
                  placeholder="Paste the full job description here — include responsibilities, requirements, and skills…"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              ) : (
                <div
                  className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all mb-4"
                  onClick={() => document.getElementById('jd-input').click()}
                >
                  {jdFile ? (
                    <p className="text-white font-medium">{jdFile.name}</p>
                  ) : (
                    <p className="text-white/40 text-sm">Click to select PDF or DOCX</p>
                  )}
                  <input id="jd-input" type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setJdFile(e.target.files[0])} />
                </div>
              )}
              <button onClick={handleJDUpload} disabled={loading} className="btn-primary w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</span> : 'Continue →'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-5xl mb-5 animate-float">🤖</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Ready to generate</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {sessionType === 'resume_only'
                  ? 'The AI will read your resume and generate 20 personalised questions. Takes 1–3 minutes.'
                  : sessionType === 'jd_only'
                  ? 'The AI will read the job description and generate 20 role-specific questions. Takes 1–3 minutes.'
                  : 'The AI will analyse your resume against the job description and generate 20 tailored questions. Takes 1–3 minutes.'}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { icon: '⚙️', label: 'Technical', count: 5 },
                  { icon: '💻', label: 'Coding', count: 5 },
                  { icon: '📊', label: 'Managerial', count: 5 },
                  { icon: '🤝', label: 'HR', count: 5 },
                ].map(r => (
                  <div key={r.label} className="bg-white/5 border border-white/8 rounded-xl p-3 flex items-center gap-2">
                    <span>{r.icon}</span>
                    <span className="text-white/60 text-sm">{r.label}</span>
                    <span className="ml-auto text-white/25 text-xs">{r.count}Q</span>
                  </div>
                ))}
              </div>
              {status && (
                <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                  <p className="text-blue-300 text-sm">{status}</p>
                </div>
              )}
              <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analysing…</span> : '🚀 Start AI Analysis'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
