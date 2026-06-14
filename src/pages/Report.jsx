import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

function ScoreBar({ label, score, max = 10 }) {
  const pct = Math.round((score / max) * 100)
  const color = score <= 3 ? 'bg-red-500' : score <= 6 ? 'bg-orange-500' : score <= 8 ? 'bg-green-500' : 'bg-emerald-600'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-mono">{score.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function List({ title, items, color = 'text-gray-700' }) {
  if (!items?.length) return null
  return (
    <div className="mb-4">
      <h3 className={`font-semibold text-sm mb-1 ${color}`}>{title}</h3>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 before:content-['•'] before:mr-2">{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function Report() {
  const { sessionId } = useParams()
  const nav = useNavigate()
  const [report, setReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [sessionId])

  async function fetchReport() {
    try {
      const r = await api.getReport(sessionId)
      setReport(r)
    } catch {
      // Not ready yet
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      await api.generateReport(sessionId)
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        try {
          const r = await api.getReport(sessionId)
          setReport(r)
          return
        } catch {}
      }
      setError('Report generation timed out. Try again.')
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded shadow p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-4">Final Report</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your interview is complete. Generate your performance report now.
          </p>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">Interview Report</h1>
        <button onClick={() => nav('/')} className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded shadow p-6">
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-blue-700">{report.overall_score.toFixed(1)}</p>
            <p className="text-gray-500 text-sm mt-1">Overall Score / 10</p>
          </div>
          <ScoreBar label="Resume–JD Match" score={report.resume_jd_match_score / 10} />
          <ScoreBar label="Technical" score={report.technical_score} />
          <ScoreBar label="Coding" score={report.coding_score} />
          <ScoreBar label="Managerial" score={report.managerial_score} />
          <ScoreBar label="HR / Culture Fit" score={report.hr_score} />
        </div>

        <div className="bg-white rounded shadow p-6">
          <List title="Top Strengths" items={report.strengths} color="text-green-700" />
          <List title="Technical Gaps" items={report.technical_weak_points} color="text-red-600" />
          <List title="Communication Issues" items={report.communication_weak_points} color="text-orange-600" />
        </div>

        {report.next_practice_plan?.length > 0 && (
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold mb-4">4-Week Practice Plan</h2>
            <div className="space-y-4">
              {report.next_practice_plan.map((item, i) => (
                <div key={i} className="border-l-4 border-blue-400 pl-4">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium text-sm">{item.topic}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.why}</p>
                  {item.suggested_resources?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {item.suggested_resources.map((r, j) => (
                        <li key={j} className="text-xs text-blue-600">{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
