import { useState } from 'react'

function scoreMeta(score) {
  if (score >= 9)  return { label: 'Excellent',  color: 'from-emerald-400 to-teal-400',  bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-300' }
  if (score >= 7)  return { label: 'Good',        color: 'from-blue-400 to-cyan-400',     bg: 'bg-blue-500/10 border-blue-500/30',     text: 'text-blue-300' }
  if (score >= 5)  return { label: 'Partial',     color: 'from-yellow-400 to-amber-400',  bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-300' }
  return           { label: 'Needs Work',  color: 'from-red-400 to-rose-500',    bg: 'bg-red-500/10 border-red-500/30',     text: 'text-red-300' }
}

function Section({ icon, title, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  if (!items?.length) return null
  return (
    <div className="border-t border-white/8 pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex items-center gap-1.5">
          <span>{icon}</span> {title}
          <span className="text-white/20 text-xs">({items.length})</span>
        </span>
        <span className="text-white/30 text-xs transition-transform duration-200" style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
      </button>
      {open && (
        <ul className="mt-2.5 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-white/60 flex gap-2 leading-relaxed">
              <span className="text-white/20 flex-shrink-0 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ScoreCard({ answer }) {
  if (!answer || answer.evaluation_status !== 'done') return null
  const { score, strengths, mistakes, improvement_tips, sample_better_answer } = answer
  const m = scoreMeta(score)
  const pct = (score / 10) * 100

  return (
    <div>
      {/* Score banner */}
      <div className={`rounded-xl border p-5 mb-4 ${m.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Your Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>
                {score?.toFixed(1)}
              </span>
              <span className="text-white/30 text-sm">/ 10</span>
            </div>
          </div>
          <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${m.bg} border ${m.text}`}>
            {m.label}
          </div>
        </div>
        {/* Score bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-0">
        <Section icon="✅" title="Strengths" items={strengths} defaultOpen={true} />
        <Section icon="⚠️" title="Mistakes" items={mistakes} />
        <Section icon="💡" title="Tips to Improve" items={improvement_tips} />
        {sample_better_answer && (
          <div className="border-t border-white/8 pt-3 mt-3">
            <p className="text-sm font-medium text-white/60 mb-2 flex items-center gap-1.5">
              <span>📝</span> Sample Better Answer
            </p>
            <p className="text-sm text-white/50 whitespace-pre-wrap leading-relaxed bg-white/3 rounded-lg p-3 border border-white/5">
              {sample_better_answer}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
