import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const STATUS_META = {
  done:         { label: '✓', color: '#10b981' },
  in_progress:  { label: '◑', color: '#f59e0b' },
  not_started:  { label: '○', color: 'var(--text-3)' },
}

function CodeBlock({ code, lang = 'code' }) {
  const [copied, setCopied] = useState(false)
  if (!code) return null
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="relative mt-3 rounded-xl overflow-hidden" style={{ background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/6">
        <span className="text-xs font-mono" style={{ color: '#60a5fa' }}>{lang}</span>
        <button onClick={copy} className="text-xs transition-opacity hover:opacity-70" style={{ color: copied ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-sm leading-relaxed" style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono','Fira Code',monospace", margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Accordion({ title, children, defaultOpen = false, accent = '#6366f1' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${accent}28` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-all"
        style={{ background: open ? `${accent}10` : 'transparent' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
        <span className="text-xs transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', color: accent }}>▾</span>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

function Quiz({ questions, conceptId, initialScore }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(initialScore)

  async function submit() {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    setScore(pct)
    setSubmitted(true)
    try { await api.updateStudyProgress(conceptId, { quiz_score: pct }) } catch {}
  }

  if (!questions?.length) return null

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
            <span className="mr-2 text-xs font-mono" style={{ color: 'var(--text-3)' }}>Q{qi+1}.</span>{q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const picked = answers[qi] === oi
              const correct = submitted && oi === q.correct
              const wrong = submitted && picked && oi !== q.correct
              return (
                <button key={oi} disabled={submitted}
                  onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))}
                  className="w-full text-left text-sm px-4 py-2.5 rounded-lg transition-all"
                  style={{
                    background: correct ? 'rgba(16,185,129,0.15)' : wrong ? 'rgba(239,68,68,0.12)' : picked ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${correct ? 'rgba(16,185,129,0.4)' : wrong ? 'rgba(239,68,68,0.35)' : picked ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                    color: correct ? '#34d399' : wrong ? '#f87171' : picked ? '#a78bfa' : 'var(--text-2)',
                    cursor: submitted ? 'default' : 'pointer',
                  }}>
                  <span className="mr-2 font-mono text-xs opacity-60">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {submitted && (
            <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.07)', color: 'var(--text-2)', border: '1px solid rgba(99,102,241,0.15)' }}>
              💡 {q.explanation}
            </div>
          )}
        </div>
      ))}
      {!submitted ? (
        <button onClick={submit} disabled={Object.keys(answers).length < questions.length}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
          Submit Quiz ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: score >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${score >= 75 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          <span className="text-3xl">{score >= 75 ? '🎉' : '📚'}</span>
          <div>
            <p className="font-bold text-lg" style={{ color: score >= 75 ? '#34d399' : '#fbbf24' }}>{score}% Score</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{score >= 75 ? 'Great job!' : 'Review the sections and try again.'}</p>
          </div>
          <button onClick={() => { setAnswers({}); setSubmitted(false) }}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

// ── Create Custom Course Modal ────────────────────────────────────────────────

function CreateCourseModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const course = await api.createCustomCourse(name.trim())
      onCreate(course)
    } catch (err) {
      setError(err.message || 'Failed to generate course. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Create Custom Course</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>AI generates 3–5 categories with 5–8 topics each</p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="text-2xl leading-none opacity-50 hover:opacity-100 transition-opacity disabled:pointer-events-none"
            style={{ color: 'var(--text)' }}>×</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(99,102,241,0.25)', borderTopColor: '#6366f1' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>AI is building your curriculum…</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>This takes 10–20 seconds. Hang tight!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Course Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Machine Learning with PyTorch"
              autoFocus
              className="w-full text-sm rounded-xl px-4 py-3 outline-none mb-4"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
            />
            {error && (
              <p className="text-xs mb-4 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button type="submit" disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
                Generate ✨
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Course Picker Modal ───────────────────────────────────────────────────────

function CoursePicker({ courses, current, onSelect, onClose, onCreateNew }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Choose a Course</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{courses.length} tracks available — all AI-generated, cached forever</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text)' }}>×</button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {courses.map(c => (
              <button key={c.key} onClick={() => { onSelect(c.key); onClose() }}
                className="text-left p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] relative"
                style={{
                  background: current === c.key ? `${c.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${current === c.key ? c.color + '60' : 'var(--border)'}`,
                }}>
                {current === c.key && (
                  <span className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: c.color + '20', color: c.color }}>active</span>
                )}
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{c.name}</p>
                <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-3)' }}>{c.description}</p>
                <p className="text-xs font-mono" style={{ color: c.color }}>{c.topic_count} topics · {c.category_count} sections</p>
              </button>
            ))}

            {/* Create Custom Course card */}
            <button onClick={onCreateNew}
              className="text-left p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.4)' }}>
              <div className="text-2xl mb-2">✏️</div>
              <p className="font-semibold text-sm mb-1" style={{ color: '#a78bfa' }}>Create Custom Course</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                AI generates a full curriculum from any topic you name
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function StudyCourse() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || 'python')
  const [showPicker, setShowPicker] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [curriculum, setCurriculum] = useState([])
  const [currLoading, setCurrLoading] = useState(true)
  const [expandedCats, setExpandedCats] = useState(new Set())

  const [selectedId, setSelectedId] = useState(searchParams.get('concept') || null)
  const [concept, setConcept] = useState(null)
  const [conceptLoading, setConceptLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const notesTimer = useRef(null)

  const [overview, setOverview] = useState(null)

  // Load course list once
  useEffect(() => {
    api.getStudyCourses().then(setCourses).catch(() => {})
    api.getStudyOverview().then(setOverview).catch(() => {})
  }, [])

  // Reload curriculum when course changes
  useEffect(() => {
    setCurrLoading(true)
    setCurriculum([])
    setSelectedId(null)
    setConcept(null)
    const params = { course: selectedCourse }
    if (searchParams.get('concept')) params.concept = searchParams.get('concept')
    setSearchParams(params, { replace: true })

    api.getStudyCurriculum(selectedCourse).then(data => {
      setCurriculum(data)
      if (data.length > 0) setExpandedCats(new Set([data[0].category]))
    }).catch(console.error).finally(() => setCurrLoading(false))
  }, [selectedCourse])

  // Load concept when selected
  useEffect(() => {
    if (!selectedId) return
    setConceptLoading(true)
    setConcept(null)
    setSearchParams({ course: selectedCourse, concept: selectedId }, { replace: true })
    api.getStudyConcept(selectedId).then(data => {
      setConcept(data)
      setNotes(data.progress?.notes || '')
      if (data.progress?.status === 'not_started') {
        api.updateStudyProgress(selectedId, { status: 'in_progress' }).catch(() => {})
        setCurriculum(prev => prev.map(cat => ({
          ...cat,
          topics: cat.topics.map(t => t.id === selectedId ? { ...t, status: 'in_progress' } : t)
        })))
      }
    }).catch(console.error).finally(() => setConceptLoading(false))
  }, [selectedId])

  function saveNotes(value) {
    setNotes(value)
    setNotesSaved(false)
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      setNotesSaving(true)
      try { await api.updateStudyProgress(selectedId, { notes: value }); setNotesSaved(true) } catch {}
      setNotesSaving(false)
    }, 1000)
  }

  function handleCourseCreated(newCourse) {
    setCourses(prev => [...prev, newCourse])
    setShowCreateModal(false)
    setShowPicker(false)
    setSelectedCourse(newCourse.key)
  }

  async function generateContent() {
    if (!selectedId || generating) return
    setGenerating(true)
    try {
      const data = await api.getStudyConcept(selectedId, true)
      setConcept(data)
      setNotes(data.progress?.notes || '')
    } catch (e) {
      alert('AI generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function markDone() {
    if (!concept) return
    await api.updateStudyProgress(selectedId, { status: 'done' })
    setConcept(prev => ({ ...prev, progress: { ...prev.progress, status: 'done' } }))
    setCurriculum(prev => prev.map(cat => ({
      ...cat,
      topics: cat.topics.map(t => t.id === selectedId ? { ...t, status: 'done' } : t),
      done: cat.topics.reduce((s, t) => s + (t.id === selectedId ? 1 : t.status === 'done' ? 1 : 0), 0),
    })))
    api.getStudyOverview().then(setOverview).catch(() => {})
  }

  function toggleCat(cat) {
    setExpandedCats(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  const activeCourse = courses.find(c => c.key === selectedCourse)
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)'
  const borderColor = 'var(--border)'
  const accentColor = activeCourse?.color || '#6366f1'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      {showPicker && (
        <CoursePicker
          courses={courses}
          current={selectedCourse}
          onSelect={setSelectedCourse}
          onClose={() => setShowPicker(false)}
          onCreateNew={() => { setShowPicker(false); setShowCreateModal(true) }}
        />
      )}

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCourseCreated}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={() => nav('/')} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-2)' }}>← Dashboard</button>

          {/* Course selector button */}
          <button onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}40` }}>
            <span className="text-lg">{activeCourse?.icon || '📚'}</span>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{activeCourse?.name || 'Study'}</span>
            <span className="text-xs opacity-50" style={{ color: 'var(--text)' }}>▾</span>
          </button>

          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
            {overview ? `${overview.done}/${overview.total} done` : '…'}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {overview && overview.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((overview.done / overview.total) * 100)}%`, background: `linear-gradient(90deg,${accentColor},#10b981)` }} />
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{Math.round((overview.done / overview.total) * 100)}%</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1500px] mx-auto w-full px-4 py-4 gap-4 relative z-10" style={{ minHeight: 0 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="flex-shrink-0 overflow-y-auto rounded-2xl" style={{ width: 290, maxHeight: 'calc(100vh - 80px)', position: 'sticky', top: 72, background: cardBg, border: `1px solid ${borderColor}` }}>
          <div className="p-3">
            {/* Course header in sidebar */}
            <button onClick={() => setShowPicker(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2 transition-all hover:opacity-80"
              style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
              <span className="text-base">{activeCourse?.icon || '📚'}</span>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold" style={{ color: accentColor }}>{activeCourse?.name || 'Study'}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{activeCourse?.topic_count || '…'} topics</p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Switch ▾</span>
            </button>

            {/* Legend */}
            <div className="flex items-center gap-3 px-3 py-1.5 mb-1 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>Ready</span>
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>= content available instantly</span>
            </div>

            {currLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />)}
              </div>
            ) : (
              curriculum.map(cat => (
                <div key={cat.category} className="mb-1">
                  <button
                    onClick={() => toggleCat(cat.category)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all hover:opacity-80"
                    style={{ background: expandedCats.has(cat.category) ? `${accentColor}10` : 'transparent' }}>
                    <span className="text-xs font-semibold" style={{ color: expandedCats.has(cat.category) ? accentColor : 'var(--text-2)' }}>{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: cat.done === cat.total ? '#10b981' : 'var(--text-3)' }}>{cat.done}/{cat.total}</span>
                      <span className="text-xs" style={{ color: 'var(--text-3)', transform: expandedCats.has(cat.category) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                  </button>

                  {expandedCats.has(cat.category) && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {cat.topics.map(topic => {
                        const sm = STATUS_META[topic.status] || STATUS_META.not_started
                        const isActive = selectedId === topic.id
                        return (
                          <button key={topic.id} onClick={() => setSelectedId(topic.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all"
                            style={{
                              background: isActive ? `${accentColor}18` : 'transparent',
                              border: isActive ? `1px solid ${accentColor}40` : '1px solid transparent',
                              color: isActive ? 'var(--text)' : 'var(--text-2)',
                            }}>
                            <span className="text-xs flex-shrink-0 font-bold" style={{ color: sm.color }}>{sm.label}</span>
                            <span className="truncate leading-tight flex-1">{topic.topic}</span>
                            {(topic.seeded || topic.has_content) && (
                              <span className="ml-1 flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                Ready
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {!selectedId ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="text-6xl mb-4">{activeCourse?.icon || '📚'}</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{activeCourse?.name || 'Study'} Course</h2>
              <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--text-2)' }}>
                {activeCourse?.description}
                {' '}Content is AI-generated and cached — loads once, available forever.
              </p>
              {overview && (
                <div className="flex gap-4 mb-6">
                  {[
                    { label: 'Total Topics', value: overview.total, color: accentColor },
                    { label: 'Completed', value: overview.done, color: '#10b981' },
                    { label: 'In Progress', value: overview.in_progress, color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl px-6 py-4 text-center" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                      <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowPicker(true)}
                className="text-sm px-5 py-2.5 rounded-xl font-semibold text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}cc)` }}>
                Switch Course
              </button>
              <p className="text-xs font-mono mt-4" style={{ color: 'var(--text-3)' }}>← Click any topic to begin</p>
            </div>
          ) : conceptLoading ? (
            <div className="rounded-2xl p-8" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }} />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>Loading…</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Fetching content from database.</p>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-6 rounded animate-pulse" style={{ background: 'var(--border)', width: `${70 + i * 5}%` }} />)}
              </div>
            </div>
          ) : concept ? (
            <div className="space-y-5 pb-8">
              {/* Coming soon banner */}
              {concept.content?._coming_soon && (
                <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <span className="text-2xl mt-0.5">🚧</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#fbbf24' }}>Content coming soon</p>
                    <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--text-3)' }}>Static content for this topic hasn't been added yet. You can generate it now with AI — it will be saved and load instantly next time.</p>
                    <button
                      onClick={generateContent}
                      disabled={generating}
                      className="text-xs px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                      style={{ background: generating ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: generating ? 'none' : '0 4px 16px rgba(99,102,241,0.35)' }}>
                      {generating ? '⏳ Generating with AI...' : '✨ Generate with AI'}
                    </button>
                  </div>
                </div>
              )}
              {/* Title card */}
              <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-3)' }}>{concept.category}</p>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{concept.content.title}</h1>
                    <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-2)' }}>{concept.content.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {concept.progress?.status === 'done' ? (
                      <span className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Completed</span>
                    ) : (
                      <button onClick={markDone}
                        className="text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                        ✓ Mark as Done
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// LESSON CONTENT</p>
                {concept.content.sections?.map((s, i) => (
                  <Accordion key={i} title={s.heading} defaultOpen={i === 0} accent={accentColor}>
                    <p className="text-sm leading-relaxed mb-2 mt-2" style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{s.content}</p>
                    {s.code && <CodeBlock code={s.code} lang={activeCourse?.key || 'code'} />}
                  </Accordion>
                ))}
              </div>

              {/* Key Points */}
              {concept.content.key_points?.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// KEY POINTS</p>
                  <div className="grid grid-cols-2 gap-3">
                    {concept.content.key_points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                        <span className="flex-shrink-0 mt-0.5" style={{ color: accentColor }}>▸</span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {concept.content.common_mistakes?.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// COMMON MISTAKES TO AVOID</p>
                  <div className="space-y-3">
                    {concept.content.common_mistakes.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <span className="text-red-400 flex-shrink-0 mt-0.5 text-xs font-bold">✕</span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Q&A */}
              {concept.content.interview_qa?.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <p className="text-xs font-mono font-semibold mb-4" style={{ color: 'var(--text-3)' }}>// INTERVIEW QUESTIONS & ANSWERS</p>
                  <div className="space-y-2">
                    {concept.content.interview_qa.map((qa, i) => (
                      <Accordion key={i} title={`Q${i+1}: ${qa.q}`} accent="#f59e0b">
                        <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{qa.a}</div>
                      </Accordion>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz */}
              {concept.content.quiz?.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-3)' }}>// QUIZ — TEST YOUR KNOWLEDGE</p>
                    {concept.progress?.quiz_score != null && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                        Best: {concept.progress.quiz_score}%
                      </span>
                    )}
                  </div>
                  <Quiz questions={concept.content.quiz} conceptId={concept.id} initialScore={concept.progress?.quiz_score} />
                </div>
              )}

              {/* Notes */}
              <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-3)' }}>// MY NOTES</p>
                  <span className="text-xs" style={{ color: notesSaved ? '#34d399' : 'var(--text-3)' }}>
                    {notesSaving ? 'Saving…' : notesSaved ? '✓ Saved' : ''}
                  </span>
                </div>
                <textarea rows={5} value={notes} onChange={e => saveNotes(e.target.value)}
                  placeholder="Write your own notes, examples, or things to remember about this topic…"
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-y transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 100 }} />
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
