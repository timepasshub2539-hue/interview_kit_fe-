import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6']

function StatCard({ icon, label, value, color }) {
  const { isDark } = useTheme()
  return (
    <div className="rounded-2xl p-5"
      style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', border: `1px solid ${color}33`, backdropFilter: 'blur(12px)' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-2)' }}>{label}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  const { isDark } = useTheme()
  return (
    <div className="rounded-2xl p-5"
      style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
      <p className="text-sm font-semibold font-mono mb-4" style={{ color: 'var(--text-2)' }}>{title}</p>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: 'rgba(10,15,35,0.95)', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function Analytics() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const axisStyle = { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppBackground />
      <header className="sticky top-0 z-10" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => nav('/')} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--text-2)' }}>← Dashboard</button>
          <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>📊 Analytics</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : !data ? (
          <p style={{ color: 'var(--text-3)' }}>No data yet. Complete some interview sessions first.</p>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-6 gap-4 mb-6">
              <StatCard icon="📋" label="Total Sessions" value={data.summary.total_sessions} color="#6366f1" />
              <StatCard icon="✅" label="Completed" value={data.summary.completed_sessions} color="#10b981" />
              <StatCard icon="💬" label="Answers Given" value={data.summary.total_answers} color="#3b82f6" />
              <StatCard icon="⭐" label="Avg Answer Score" value={data.summary.avg_answer_score ? `${data.summary.avg_answer_score}/10` : '—'} color="#f59e0b" />
              <StatCard icon="🎯" label="Best Match" value={data.summary.best_match_score ? `${Math.round(data.summary.best_match_score)}%` : '—'} color="#ec4899" />
              <StatCard icon="🔥" label="Day Streak" value={data.summary.streak} color="#f97316" />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              {/* Score trend */}
              <ChartCard title="// Score Trend (per session)">
                {data.score_trend.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>No scored sessions yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.score_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="label" tick={axisStyle} />
                      <YAxis domain={[0, 100]} tick={axisStyle} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="score" name="Match %" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Round performance */}
              <ChartCard title="// Avg Score by Round Type">
                {data.round_performance.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>Complete rounds to see scores</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.round_performance} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="round" tick={axisStyle} />
                      <YAxis domain={[0, 10]} tick={axisStyle} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]}>
                        {data.round_performance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Topic performance */}
              <ChartCard title="// Performance by Question Type">
                {data.topic_scores.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>Answer questions to see topic breakdown</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topic_scores} layout="vertical" barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis type="number" domain={[0, 10]} tick={axisStyle} />
                      <YAxis type="category" dataKey="topic" tick={axisStyle} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg_score" name="Avg Score" radius={[0, 6, 6, 0]}>
                        {data.topic_scores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Difficulty breakdown */}
              <ChartCard title="// Score by Difficulty Level">
                {data.difficulty_scores.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--text-3)' }}>No difficulty data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.difficulty_scores} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="difficulty" tick={axisStyle} />
                      <YAxis domain={[0, 10]} tick={axisStyle} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg_score" name="Avg Score" radius={[6, 6, 0, 0]}>
                        {data.difficulty_scores.map((e, i) => (
                          <Cell key={i} fill={e.difficulty === 'Easy' ? '#10b981' : e.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
