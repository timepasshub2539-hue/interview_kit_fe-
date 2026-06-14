import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const DIFF_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
const TYPE_ICON = { technical: '⚙️', behavioral: '🤝', coding: '💻', hr: '👥', sql: '🗄️' }

export default function Bookmarks() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    api.getBookmarks().then(setQuestions).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleRemove(id) {
    setRemoving(id)
    try {
      await api.removeBookmark(id)
      setQuestions(prev => prev.filter(q => q.id !== id))
    } catch {}
    setRemoving(null)
  }

  const card = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppBackground />
      <header className="sticky top-0 z-10" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => nav('/')} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-2)' }}>← Dashboard</button>
          <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>★ Saved Questions</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={card}>
            <div className="text-5xl mb-4">☆</div>
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>No saved questions yet</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>During an interview, click ☆ Save on any question to bookmark it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-3)' }}>{questions.length} saved question{questions.length !== 1 ? 's' : ''}</p>
            {questions.map(q => (
              <div key={q.id} className="rounded-2xl p-5" style={card}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{TYPE_ICON[q.question_type] || '❓'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{ background: `${DIFF_COLOR[q.difficulty]}18`, color: DIFF_COLOR[q.difficulty], border: `1px solid ${DIFF_COLOR[q.difficulty]}40` }}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{q.question_type}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{q.question_text}</p>
                    {q.expected_points?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {q.expected_points.slice(0, 3).map((p, i) => (
                          <p key={i} className="text-xs" style={{ color: 'var(--text-3)' }}>· {p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemove(q.id)} disabled={removing === q.id}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                    title="Remove bookmark">
                    {removing === q.id ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : '×'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
