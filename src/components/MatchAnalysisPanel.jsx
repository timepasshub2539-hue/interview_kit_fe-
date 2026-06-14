import { useState } from 'react'

function SkillPill({ label, type }) {
  const styles = {
    matched: { bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.4)',  text: '#34d399', icon: '✓' },
    missing: { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   text: '#f87171', icon: '✗' },
    nice:    { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',  text: '#fbbf24', icon: '◎' },
    weak:    { bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.4)',  text: '#fb923c', icon: '△' },
    focus:   { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.4)', text: '#60a5fa', icon: '→' },
  }
  const s = styles[type] || styles.focus
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono mr-1.5 mb-1.5"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      <span className="opacity-60 text-[10px]">{s.icon}</span>{label}
    </span>
  )
}

function Section({ title, icon, items, type }) {
  if (!items?.length) return null
  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono"
        style={{ color: 'rgba(96,165,250,0.6)' }}>
        <span className="text-white/20">//</span> {icon} {title}
        <span className="text-white/20 normal-case">({items.length})</span>
      </p>
      <div className="flex flex-wrap">{items.map((s, i) => <SkillPill key={i} label={s} type={type} />)}</div>
    </div>
  )
}

function ScoreGauge({ score }) {
  const r = 48
  const cx = 60, cy = 58
  const pct = Math.min(score, 100) / 100
  const sweepAngle = Math.PI * pct
  const x = cx + r * Math.cos(Math.PI - sweepAngle)
  const y = cy - r * Math.sin(sweepAngle)
  const largeArc = pct > 0.5 ? 1 : 0
  const color = score >= 85 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171'

  return (
    <svg width="120" height="70" viewBox="0 0 120 70" style={{ overflow: 'visible' }}>
      {/* Glow */}
      <defs>
        <filter id="gauge-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" strokeLinecap="round"/>
      {/* Fill */}
      {score > 0 && (
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`}
          fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          filter="url(#gauge-glow)"/>
      )}
      {/* Score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="monospace">
        {score?.toFixed(0)}%
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="rgba(255,255,255,0.3)">
        MATCH
      </text>
    </svg>
  )
}

export default function MatchAnalysisPanel({ session }) {
  const [open, setOpen] = useState(false)
  const score = session.match_score
  const analysis = session.match_analysis

  if (!analysis || score == null || score >= 85) return null

  const label      = score >= 70 ? 'Good fit'    : score >= 50 ? 'Partial fit'  : 'Low fit'
  const labelColor = score >= 70 ? '#fbbf24'     : score >= 50 ? '#fb923c'      : '#f87171'
  const glowColor  = score >= 70 ? '#fbbf2440'   : score >= 50 ? '#fb923c40'    : '#f8717140'
  const borderCol  = score >= 70 ? 'rgba(251,191,36,0.25)' : score >= 50 ? 'rgba(251,146,60,0.25)' : 'rgba(239,68,68,0.25)'

  return (
    <div className="mt-3">
      {/* Toggle chip */}
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
        style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${borderCol}`, color: labelColor }}>
        <span>⚠</span>
        Match {score?.toFixed(0)}% — below 85% threshold
        <span className="ml-1 text-white/30">{open ? '▲ Hide' : '▼ See gap analysis'}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${borderCol}`, boxShadow: `0 0 40px ${glowColor}` }}>

          {/* ── IDE-style title bar ── */}
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: 'rgba(5,12,30,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"/>
            <span className="ml-3 text-xs font-mono text-white/30">gap-analysis.json</span>
            <span className="ml-auto text-xs font-mono" style={{ color: labelColor }}>
              {label}
            </span>
          </div>

          {/* ── Main content ── */}
          <div className="p-5"
            style={{ background: 'linear-gradient(135deg, rgba(4,10,24,0.98) 0%, rgba(8,16,38,0.98) 100%)' }}>

            {/* Top section: gauge + summary side by side */}
            <div className="flex gap-5 items-start mb-5">

              {/* Gauge column */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <ScoreGauge score={score}/>
                <span className="text-xs font-mono mt-1 font-bold" style={{ color: labelColor }}>{label}</span>
              </div>

              {/* Summary + counts */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono mb-1" style={{ color: 'rgba(96,165,250,0.7)' }}>
                  <span className="text-white/20">// </span>match_summary
                </p>
                {analysis.match_summary && (
                  <p className="text-white/55 text-xs leading-relaxed mb-4 font-mono"
                    style={{ borderLeft: `2px solid rgba(96,165,250,0.25)`, paddingLeft: 10 }}>
                    {analysis.match_summary}
                  </p>
                )}

                {/* Counts row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Matched',  count: analysis.matched_skills?.length  || 0, color: '#34d399' },
                    { label: 'Missing',  count: analysis.missing_skills?.length   || 0, color: '#f87171' },
                    { label: 'Weak',     count: analysis.weak_areas?.length       || 0, color: '#fb923c' },
                  ].map(s => (
                    <div key={s.label} className="text-center rounded-xl py-2.5"
                      style={{
                        background: `${s.color}12`,
                        border: `1px solid ${s.color}30`,
                      }}>
                      <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.count}</p>
                      <p className="text-white/35 text-[10px] font-mono">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(96,165,250,0.1)' }}/>
              <span className="text-xs font-mono text-white/20">skills breakdown</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(96,165,250,0.1)' }}/>
            </div>

            {/* Skills */}
            <Section title="You have — great!"               icon="✅" items={analysis.matched_skills}     type="matched"/>
            <Section title="Missing — study or add to CV"    icon="🚨" items={analysis.missing_skills}     type="missing"/>
            <Section title="Weak areas — strengthen these"   icon="⚠️" items={analysis.weak_areas}         type="weak"/>
            <Section title="Nice to have — bonus points"     icon="💡" items={analysis.nice_to_have_skills} type="nice"/>
            <Section title="Expect questions on these"       icon="🎯" items={analysis.focus_areas}         type="focus"/>

            {/* Action tips */}
            {analysis.missing_skills?.length > 0 && (
              <div className="mt-3 rounded-xl p-4"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-mono mb-2" style={{ color: '#f87171' }}>
                  <span className="text-white/25">$ </span>
                  before_the_interview() →
                </p>
                <ul className="space-y-1.5">
                  {analysis.missing_skills.slice(0, 4).map((skill, i) => (
                    <li key={i} className="text-white/45 text-xs font-mono flex gap-2">
                      <span style={{ color: '#f87171' }}>→</span>
                      Study or add evidence of{' '}
                      <strong className="text-white/70">{skill}</strong>
                    </li>
                  ))}
                  {analysis.missing_skills.length > 4 && (
                    <li className="text-white/20 text-xs font-mono">
                      …and {analysis.missing_skills.length - 4} more skills
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
