import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import MascotCharacter from './MascotCharacter'

const SUGGESTIONS = [
  'How do I prepare for a system design interview?',
  'What are the most common SQL interview questions?',
  'How should I answer behavioral questions?',
  'Tips for live coding interviews?',
]

export default function ChatWidget() {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const [mascotVisible, setMascotVisible] = useState(
    () => localStorage.getItem('aria_hidden') !== '1'
  )
  const [mascotTheme, setMascotTheme] = useState('idle')

  function hideMascot(e) {
    e.stopPropagation()
    setMascotVisible(false)
    setOpen(false)
    localStorage.setItem('aria_hidden', '1')
  }

  function showMascot() {
    setMascotVisible(true)
    localStorage.removeItem('aria_hidden')
  }
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Aria 👋 Ask me anything about interview prep, career advice, technical concepts, or study plans!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Listen for mascot theme updates from any page
  useEffect(() => {
    function handler(e) { setMascotTheme(e.detail) }
    window.addEventListener('aria-mascot:theme', handler)
    return () => window.removeEventListener('aria-mascot:theme', handler)
  }, [])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  async function send(text) {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput('')

    const nextMsgs = [...messages, { role: 'user', content: userMsg }]
    setMessages(nextMsgs)
    setLoading(true)

    try {
      const res = await api.chat(nextMsgs.map(m => ({ role: m.role, content: m.content })))
      setMessages([...nextMsgs, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setMessages([...nextMsgs, { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const panelStyle = {
    background: isDark ? 'rgba(8,13,28,0.97)' : 'rgba(255,255,255,0.97)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.2)'}`,
    backdropFilter: 'blur(24px)',
  }

  const userBubble = {
    background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
    color: '#fff',
    borderRadius: '18px 18px 4px 18px',
  }

  const aiBubble = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
    color: 'var(--text)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.14)'}`,
    borderRadius: '4px 18px 18px 18px',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Chat panel — appears above the mascot */}
      {open && (
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ ...panelStyle, width: 340, height: 480 }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)'}`, background: isDark ? 'rgba(4,8,20,0.9)' : 'rgba(238,242,255,0.9)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6)' }}>✨</div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Aria — AI Coach</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Interview prep assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-xl leading-none font-light hover:opacity-70 transition-opacity" style={{ color: 'var(--text-3)' }}>×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 text-sm leading-relaxed"
                  style={m.role === 'user' ? userBubble : aiBubble}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl flex items-center gap-1.5" style={aiBubble}>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="space-y-1.5 mt-1">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)', color: 'var(--text-2)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.1)'}` }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything…"
              className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.06)', color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {mascotVisible ? (
        /* ── Full mascot trigger ── */
        <div className="relative" style={{ width: 120 }}>
          {/* Hide button */}
          <button
            onClick={hideMascot}
            title="Hide Aria"
            className="absolute top-6 left-0 z-20 w-5 h-5 rounded-full flex items-center justify-center text-xs leading-none transition-all hover:scale-110"
            style={{ background: 'rgba(30,20,60,0.82)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            ✕
          </button>

          <div
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={() => setOpen(o => !o)}
            title={open ? 'Close chat' : 'Chat with Aria'}
          >
            <MascotCharacter theme={open ? 'thinking' : mascotTheme} size="sm" />
          </div>

          {/* Pulse ring when closed */}
          {!open && (
            <div className="absolute bottom-14 right-1 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ background: 'rgba(167,139,250,0.6)', animationDuration: '2s' }} />
            </div>
          )}
        </div>
      ) : (
        /* ── Collapsed mini button ── */
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => { showMascot(); setOpen(o => !o) }}
            title="Chat with Aria"
            className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 relative"
            style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg,#a78bfa,#f472b6)',
              boxShadow: '0 8px 24px rgba(167,139,250,0.45)',
            }}
          >
            <span className="text-xl">✨</span>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping pointer-events-none"
              style={{ background: 'rgba(167,139,250,0.3)', animationDuration: '2.5s' }} />
          </button>
          <span className="text-xs font-medium" style={{ color: 'rgba(167,139,250,0.8)' }}>Aria</span>
        </div>
      )}
    </div>
  )
}
