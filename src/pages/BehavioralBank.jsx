import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const CATEGORIES = [
  {
    key: 'leadership', label: '👑 Leadership', color: '#6366f1',
    questions: [
      { q: 'Tell me about a time you led a team through a difficult project.', star: 'Describe the team size, the challenge, your specific actions, and the measurable outcome.' },
      { q: 'How do you handle a team member who is underperforming?', star: 'Situation → observed the issue early. Task → address without demotivating. Action → private 1:1, set clear goals. Result → improvement or reassignment.' },
      { q: 'Describe a time you had to make a tough decision with limited information.', star: 'Use data available, consult stakeholders, act decisively, review outcome.' },
      { q: 'Give an example of when you influenced someone without formal authority.', star: 'Build credibility, understand their goals, align your ask to their interests.' },
    ]
  },
  {
    key: 'conflict', label: '⚔️ Conflict Resolution', color: '#ec4899',
    questions: [
      { q: 'Tell me about a conflict with a coworker and how you resolved it.', star: 'Focus on professional disagreement (not personal). Show empathy, active listening, and compromise.' },
      { q: 'How do you handle disagreement with your manager?', star: 'Express concern respectfully with data, seek to understand their view, escalate only if needed.' },
      { q: 'Describe a time a project failed due to team conflict. What did you learn?', star: 'Be honest about mistakes. Emphasize lessons and what you changed afterward.' },
    ]
  },
  {
    key: 'achievement', label: '🏆 Achievements', color: '#f59e0b',
    questions: [
      { q: 'What is your proudest professional achievement?', star: 'Choose a measurable impact. Quantify results (e.g., reduced load time by 40%, saved $200K).' },
      { q: 'Tell me about a time you went above and beyond what was expected.', star: 'Show initiative, explain why you took extra steps, and the positive impact.' },
      { q: 'Describe a project where you had to learn a new skill quickly.', star: 'Show learning agility. What resources did you use? How fast? What was the outcome?' },
    ]
  },
  {
    key: 'failure', label: '💡 Failures & Learning', color: '#10b981',
    questions: [
      { q: 'Tell me about a time you failed. How did you handle it?', star: 'Be honest about the failure. Show maturity: own it, learn from it, demonstrate change.' },
      { q: 'Describe a time you missed a deadline. What happened?', star: 'Explain root cause, communicate early, find workarounds, prevent recurrence.' },
      { q: 'What is your biggest professional regret?', star: 'Show self-awareness. Keep it professional. Explain what you would do differently.' },
    ]
  },
  {
    key: 'teamwork', label: '🤝 Teamwork', color: '#3b82f6',
    questions: [
      { q: 'Describe a time you had to collaborate with a difficult person.', star: 'Find common ground, focus on the shared goal, stay professional.' },
      { q: 'How do you give constructive feedback to a peer?', star: 'Specific, timely, private, actionable — focus on behavior not person.' },
      { q: 'Tell me about a time you supported a colleague who was struggling.', star: 'Show empathy and team-first mindset. Describe specific help you provided.' },
    ]
  },
  {
    key: 'motivation', label: '🚀 Motivation & Goals', color: '#a78bfa',
    questions: [
      { q: 'Where do you see yourself in 5 years?', star: 'Show ambition aligned with the role. Be specific about skills and responsibilities you want.' },
      { q: 'Why do you want to work at this company?', star: 'Research the company. Reference specific products, culture, mission. Make it personal.' },
      { q: 'What motivates you to do your best work?', star: 'Be authentic. Examples: solving hard problems, impact, learning, recognition.' },
      { q: 'Why are you leaving your current job?', star: 'Stay positive. Never badmouth. Focus on growth, new challenges, or better fit.' },
    ]
  },
]

export default function BehavioralBank() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [selectedCat, setSelectedCat] = useState('leadership')
  const [expanded, setExpanded] = useState(null)
  const [practiced, setPracticed] = useState(new Set())

  const category = CATEGORIES.find(c => c.key === selectedCat)

  const card = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppBackground />
      <header className="sticky top-0 z-10" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => nav('/')} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-2)' }}>← Dashboard</button>
          <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>🎤 Behavioral Question Bank</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8 relative z-10 flex gap-6">
        {/* Category sidebar */}
        <div className="flex-shrink-0 space-y-2" style={{ width: 220 }}>
          <p className="text-xs font-mono font-semibold mb-3" style={{ color: 'var(--text-3)' }}>// Categories</p>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => { setSelectedCat(cat.key); setExpanded(null) }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={selectedCat === cat.key
                ? { background: `${cat.color}22`, color: cat.color, border: `1px solid ${cat.color}44` }
                : { color: 'var(--text-2)', background: 'transparent', border: '1px solid transparent' }}>
              {cat.label}
            </button>
          ))}
          <div className="mt-6 rounded-xl p-4 text-xs leading-relaxed" style={{ background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-2)' }}>
            <p className="font-semibold mb-2" style={{ color: '#a78bfa' }}>💡 STAR Method</p>
            <p><strong>S</strong>ituation — set the scene</p>
            <p><strong>T</strong>ask — what was your role</p>
            <p><strong>A</strong>ction — what YOU did specifically</p>
            <p><strong>R</strong>esult — measurable outcome</p>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: category.color }}>{category.label}</h2>
            <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{practiced.size}/{category.questions.length} practiced</span>
          </div>

          <div className="space-y-3">
            {category.questions.map((item, i) => {
              const id = `${selectedCat}-${i}`
              const isOpen = expanded === id
              const isPracticed = practiced.has(id)

              return (
                <div key={id} className="rounded-2xl overflow-hidden transition-all" style={card}>
                  <button className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : id)}>
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xs font-mono mt-1 flex-shrink-0" style={{ color: 'var(--text-3)' }}>Q{i + 1}</span>
                      <span className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>{item.q}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isPracticed && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>✓ Done</span>}
                      <span style={{ color: 'var(--text-3)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="rounded-xl p-4 mb-4 text-sm leading-relaxed" style={{ background: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--text-2)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#a78bfa' }}>⚡ Key Points to Cover</p>
                        {item.star}
                      </div>
                      <button
                        onClick={() => setPracticed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
                        className="text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105"
                        style={isPracticed
                          ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }
                          : { background: `${category.color}18`, color: category.color, border: `1px solid ${category.color}33` }}>
                        {isPracticed ? '✓ Mark as Not Done' : '✓ Mark as Practiced'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
