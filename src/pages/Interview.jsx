import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { api } from '../api/client'
import ScoreCard from '../components/ScoreCard'
import AudioRecorder from '../components/AudioRecorder'
import CodeEditor from '../components/CodeEditor'
import AppBackground from '../components/AppBackground'
import MascotCharacter from '../components/MascotCharacter'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const ROUND_META = {
  technical:  { label: 'Technical',   icon: '⚙️',  color: 'from-blue-500 to-cyan-500',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  coding:     { label: 'Coding',      icon: '💻',  color: 'from-violet-500 to-purple-600', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  managerial: { label: 'Managerial',  icon: '📊',  color: 'from-amber-500 to-orange-500',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  hr:         { label: 'HR',          icon: '🤝',  color: 'from-pink-500 to-rose-500',     badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
}
const DIFF_COLOR = { easy: 'text-emerald-400', medium: 'text-yellow-400', hard: 'text-red-400' }
const QUESTION_TIME = 180

export default function Interview() {
  const { sessionId } = useParams()
  const nav = useNavigate()
  const [rounds, setRounds] = useState([])
  const [roundIdx, setRoundIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [mode, setMode] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [aiAnswerLoading, setAiAnswerLoading] = useState(false)
  const [aiAnswerText, setAiAnswerText] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [transcript, setTranscript] = useState('')
  const timerRef = useRef(null)
  const speechRef = useRef(null)
  const currentRound = rounds[roundIdx]
  const questions = currentRound?.questions || []
  const currentQuestion = questions[questionIdx]
  // Poll until questions ready
  useEffect(() => {
    let cancelled = false
    async function pollRounds() {
      for (let i = 0; i < 60; i++) {
        try {
          const r = await api.getRounds(sessionId)
          const hasQuestions = r.length > 0 && r.some(round => round.questions.length > 0)
          if (hasQuestions) {
            if (!cancelled) { setRounds(r); setLoading(false) }
            return
          }
        } catch (e) {
          if (!cancelled) { setError(e.message); setLoading(false) }
          return
        }
        if (cancelled) return
        await new Promise(res => setTimeout(res, 3000))
      }
      if (!cancelled) { setError('Question generation timed out.'); setLoading(false) }
    }
    pollRounds()
    return () => { cancelled = true }
  }, [sessionId])

  // Load bookmark status on question change
  useEffect(() => {
    if (!currentQuestion) return
    setBookmarked(false)
    api.getBookmarkStatus(currentQuestion.id).then(r => setBookmarked(r.bookmarked)).catch(() => {})
  }, [currentQuestion?.id])

  async function toggleBookmark() {
    if (!currentQuestion) return
    try {
      if (bookmarked) { await api.removeBookmark(currentQuestion.id); setBookmarked(false) }
      else { await api.bookmarkQuestion(currentQuestion.id); setBookmarked(true) }
    } catch {}
  }

  // Live voice transcription via Web Speech API
  function startTranscription() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let txt = ''
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript
      setTranscript(txt)
    }
    rec.start()
    speechRef.current = rec
  }

  function stopTranscription() {
    speechRef.current?.stop()
    speechRef.current = null
  }

  // Reset timer on question change
  useEffect(() => {
    setAnswer(null)
    setTextInput('')
    setAiAnswerText(null)
    setTranscript('')
    stopTranscription()
    setTimeLeft(QUESTION_TIME)
    clearInterval(timerRef.current)
    if (!loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [roundIdx, questionIdx, loading])

  
  const totalDone = rounds.slice(0, roundIdx).reduce((s, r) => s + r.questions.length, 0) + questionIdx
  const totalAll = rounds.reduce((s, r) => s + r.questions.length, 0)
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0
  const isLastQ = roundIdx === rounds.length - 1 && questionIdx === questions.length - 1
  const isCodingRound = currentRound?.round_type === 'coding'
  const isSqlQuestion = currentQuestion?.question_type === 'sql'
  const isCodeQuestion = isCodingRound && !isSqlQuestion
  const isCoding = isCodeQuestion  // keep alias for CodeEditor block
  const meta = ROUND_META[currentRound?.round_type] || ROUND_META.technical

  async function pollScore(answerId) {
    setScoring(true)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const status = await api.getScoreStatus(answerId)
      if (status.evaluation_status === 'done' || status.evaluation_status === 'failed') {
        setAnswer(await api.getAnswer(answerId))
        setScoring(false)
        return
      }
    }
    setScoring(false)
  }

  async function handleTextSubmit() {
    if (!textInput.trim() || !currentQuestion) return
    clearInterval(timerRef.current)
    setSubmitting(true)
    setError('')
    try {
      const ans = await api.submitTextAnswer(currentQuestion.id, textInput)
      await pollScore(ans.id)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  async function handleVoiceSubmit(blob, ext) {
    if (!currentQuestion) return
    clearInterval(timerRef.current)
    setSubmitting(true)
    setError('')
    try {
      const ans = await api.submitVoiceAnswer(currentQuestion.id, blob, ext)
      await pollScore(ans.id)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  async function handleGetAIAnswer() {
    if (!currentQuestion || aiAnswerLoading) return
    setAiAnswerLoading(true)
    try {
      const res = await api.getAIAnswer(currentQuestion.id)
      setAiAnswerText(res.answer_text)
    } catch (e) { setError(e.message) }
    finally { setAiAnswerLoading(false) }
  }

  function handleNext() {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx(questionIdx + 1)
    } else if (roundIdx < rounds.length - 1) {
      setRoundIdx(roundIdx + 1)
      setQuestionIdx(0)
    } else {
      nav(`/sessions/${sessionId}/report`)
    }
  }

  function switchRound(idx) {
    setRoundIdx(idx)
    setQuestionIdx(0)
  }

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const { isDark } = useTheme()
  const cardStyle = { background: isDark ? 'rgba(6,14,32,0.92)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(99,102,241,0.2)'}`, backdropFilter:'blur(24px)' }
  const btnStyle  = { background:'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow:'0 0 20px rgba(96,165,250,0.3)' }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{background:'var(--bg)'}}>
      <AppBackground />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <MascotCharacter theme="coffee" size="md" />
        <div className="rounded-2xl p-8 text-center max-w-sm" style={cardStyle}>
          <h2 className="text-white font-bold text-xl mb-2">Generating Your Interview</h2>
          <p className="text-white/40 text-sm mb-5 leading-relaxed font-mono">
            // Crafting 20 personalised questions across 4 rounds…<br />
            This takes 1–3 minutes.
          </p>
          <div className="flex justify-center gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <AppBackground />
      <div className="rounded-2xl p-8 text-center max-w-sm relative z-10" style={cardStyle}>
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => nav('/')} className="mt-4 text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={btnStyle}>← Back</button>
      </div>
    </div>
  )

  if (!currentQuestion) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <AppBackground />
      <div className="rounded-2xl p-8 text-center max-w-sm relative z-10" style={cardStyle}>
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-white font-bold text-lg mb-2">Interview Complete!</p>
        <button onClick={() => nav(`/sessions/${sessionId}/report`)} className="mt-2 font-semibold px-6 py-2.5 rounded-xl text-white text-sm" style={btnStyle}>
          📊 View Your Report
        </button>
      </div>
    </div>
  )

  // Aria's theme depends on what's happening — drive the ChatWidget mascot
  const ariaMascotTheme = scoring ? 'thinking' : answer ? (answer.score >= 85 ? 'celebrating' : 'thinking') : isCodeQuestion ? 'coding' : isSqlQuestion ? 'thinking' : 'interview'
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('aria-mascot:theme', { detail: ariaMascotTheme }))
  }, [ariaMascotTheme])

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      {/* Header */}
      <header className="glass-dark sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-sm shadow-lg`}>
              {meta.icon}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{meta.label} Round</p>
              <p className="text-white/30 text-xs">Q{questionIdx + 1} of {questions.length}</p>
            </div>
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/30 text-xs">{totalDone}/{totalAll} done</span>
              <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500" style={{width:`${overallPct}%`}} />
              </div>
              <span className="text-white/50 text-xs font-mono">{overallPct}%</span>
            </div>

            {/* Timer */}
            <div className={`font-mono text-sm px-3 py-1 rounded-lg ${timeLeft < 30 ? 'bg-red-500/20 text-red-400' : ''}`}
              style={timeLeft >= 30 ? { background: 'var(--surface)', color: 'var(--text-2)' } : {}}>
              ⏱ {fmt(timeLeft)}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Round tabs */}
      <div className="max-w-4xl mx-auto px-6 pt-5 pb-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rounds.map((r, idx) => {
            const rm = ROUND_META[r.round_type] || ROUND_META.technical
            const isActive = idx === roundIdx
            const isDone = idx < roundIdx
            return (
              <button
                key={r.id}
                onClick={() => switchRound(idx)}
                className={`round-tab whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'round-tab-active' : ''} ${isDone ? 'done' : ''}`}
              >
                <span>{rm.icon}</span>
                <span>{rm.label}</span>
                {isDone && <span className="text-emerald-400 text-xs">✓</span>}
                {isActive && (
                  <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    {questionIdx + 1}/{r.questions.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Question nav dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setQuestionIdx(i)}
              className={`rounded-full transition-all duration-200 ${
                i === questionIdx ? 'w-6 h-2 bg-gradient-to-r from-blue-500 to-violet-500' :
                i < questionIdx ? 'w-2 h-2 bg-emerald-500/60' : 'w-2 h-2 bg-white/15'
              }`}
            />
          ))}
          <span className="text-white/20 text-xs ml-2">Question {questionIdx + 1}</span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-5 space-y-5 relative z-10">
        {/* Question card */}
        <div className="glass rounded-2xl p-7 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${meta.badge}`}>
              {currentQuestion.question_type}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${DIFF_COLOR[currentQuestion.difficulty]}`}>
              {currentQuestion.difficulty}
            </span>
          </div>
          <p className="text-white text-base leading-relaxed font-medium">{currentQuestion.question_text}</p>

          {/* AI Answer button + Bookmark */}
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-3 flex-wrap">
            {/* Bookmark */}
            <button onClick={toggleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
              style={bookmarked
                ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
              {bookmarked ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={handleGetAIAnswer}
              disabled={aiAnswerLoading || !!answer}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#c4b5fd' }}
            >
              {aiAnswerLoading ? (
                <><span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> Generating…</>
              ) : (
                <>✨ AI Answer</>
              )}
            </button>
            {aiAnswerText && (
              <button
                onClick={() => { setTextInput(aiAnswerText); setAiAnswerText(null) }}
                className="text-xs px-3 py-2 rounded-lg transition-all"
                style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}
              >
                ↳ Use as my answer
              </button>
            )}
          </div>

          {/* AI Answer panel */}
          {aiAnswerText && (
            <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#c4b5fd' }}>✨ AI Model Answer</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{aiAnswerText}</p>
            </div>
          )}
        </div>

        {/* ── Persistent navigation bar — always visible ── */}
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
          {/* Previous question */}
          <button
            onClick={() => questionIdx > 0 ? setQuestionIdx(questionIdx - 1) : (roundIdx > 0 && switchRound(roundIdx - 1))}
            disabled={roundIdx === 0 && questionIdx === 0}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-25 disabled:cursor-not-allowed text-white/50 hover:text-white hover:bg-white/8 border border-white/8"
          >
            ← Prev
          </button>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-white/35">
            <span className={`w-2 h-2 rounded-full ${meta.color.includes('blue') ? 'bg-blue-400' : meta.color.includes('violet') ? 'bg-violet-400' : meta.color.includes('amber') ? 'bg-amber-400' : 'bg-pink-400'}`}/>
            {meta.label} · Q{questionIdx + 1}/{questions.length}
          </div>

          {/* Skip / Next */}
          {!answer ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/8 border border-white/8"
            >
              {isLastQ ? 'Finish →' : 'Skip →'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm px-5 py-2 rounded-xl text-white font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 20px rgba(96,165,250,0.3)' }}
            >
              {isLastQ ? '📊 Report' : 'Next →'}
            </button>
          )}
        </div>

        {/* SQL editor — for SQL query questions */}
        {isSqlQuestion && !answer && (
          <div className="glass rounded-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/8" style={{ background: 'rgba(3,7,18,0.97)' }}>
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-white/30 text-xs font-mono">query.sql</span>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>SQL</span>
            </div>
            <Editor
              height="220px"
              language="sql"
              theme="vs-dark"
              value={textInput}
              onChange={(val) => setTextInput(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
            <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3" style={{ background: 'rgba(3,7,18,0.97)' }}>
              <button
                onClick={handleTextSubmit}
                disabled={submitting || !textInput.trim()}
                className="btn-primary text-sm py-2"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Evaluating…
                  </span>
                ) : '▶ Submit SQL Query →'}
              </button>
              <span className="text-white/20 text-xs font-mono">AI will review your query logic and efficiency</span>
            </div>
          </div>
        )}

        {/* Answer section */}
        {!answer && !isCodingRound && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex gap-2">
              {[
                { key: 'text', label: '✏️ Type Answer' },
                { key: 'voice', label: '🎙️ Record Voice' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    mode === key
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'text' ? (
              <div>
                <textarea
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all resize-none"
                  placeholder="Type your answer here… Be thorough and use examples from your experience."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={submitting}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={submitting || !textInput.trim()}
                  className="btn-primary mt-3 text-sm py-2.5"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </span>
                  ) : 'Submit & Score →'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AudioRecorder
                  onSubmit={handleVoiceSubmit}
                  disabled={submitting}
                  onRecordStart={startTranscription}
                  onRecordStop={stopTranscription}
                />
                {transcript && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#60a5fa' }}>🎙️ Live Transcription</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{transcript}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isCoding && (
          <div className="glass rounded-2xl p-6">
            <CodeEditor
              problemId={currentQuestion.id}
              onDone={(result) => {
                // Treat the code submission result as a synthetic "answer" so
                // the persistent nav bar switches to "Next →" (scored state)
                setAnswer({
                  score: result.total_count > 0
                    ? Math.round((result.passed_count / result.total_count) * 100)
                    : 0,
                  strengths:        result.status === 'passed' ? ['All test cases passed'] : [],
                  mistakes:         result.status !== 'passed' ? [`${result.total_count - result.passed_count} test case(s) failed`] : [],
                  improvement_tips: [],
                  sample_better_answer: result.ai_feedback || null,
                  evaluation_status: 'done',
                  _codeResult: result,
                })
              }}
            />
          </div>
        )}

        {/* Scoring */}
        {scoring && (
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Scoring your answer…</p>
              <p className="text-white/40 text-xs">The AI is evaluating your response</p>
            </div>
          </div>
        )}

        {/* Score result — for text/voice/SQL answers (code has its own inline result UI) */}
        {answer && !isCodeQuestion && (
          <div className="glass rounded-2xl p-6">
            <ScoreCard answer={answer} />
            <div className="flex gap-3 mt-5">
              <button onClick={handleNext} className="btn-primary text-sm py-2.5">
                {isLastQ ? '📊 Finish & View Report' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl px-4 py-3 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </main>
    </div>
  )
}
