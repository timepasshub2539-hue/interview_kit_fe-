import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { api } from '../api/client'

const LANGS = [
  { id: 'python',     label: 'Python',     icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '☁️' },
  { id: 'java',       label: 'Java',       icon: '☕' },
  { id: 'cpp',        label: 'C++',        icon: '⚡' },
  { id: 'go',         label: 'Go',         icon: '🔵' },
]

const STARTERS = {
  python:     '# Write your solution here\ndef solution():\n    pass\n',
  javascript: '// Write your solution here\nfunction solution() {\n    \n}\n',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  cpp:        '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  go:         'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println("hello")\n}\n',
}

export default function CodeEditor({ problemId, onDone }) {
  const [lang, setLang]         = useState('python')
  const [code, setCode]         = useState(STARTERS.python)
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function pollSubmission(id) {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const sub = await api.getSubmission(id)
      if (!['pending', 'running'].includes(sub.status)) return sub
    }
    throw new Error('Submission timed out after 60s')
  }

  async function handleRun() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const sub   = await api.submitCode(problemId, code, lang)
      const final = await pollSubmission(sub.id)
      setResult(final)
      if (onDone) onDone(final)
      setSubmitted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  function handleLangChange(id) {
    setLang(id)
    setCode(STARTERS[id] || '')
    setResult(null)
    setSubmitted(false)
  }

  const passedAll = result && result.status === 'passed'
  const tests     = result?.test_results || []

  return (
    <div className="space-y-4">

      {/* ── IDE header bar ── */}
      <div className="flex items-center justify-between">
        {/* Language tabs */}
        <div className="flex gap-1.5">
          {LANGS.map(l => (
            <button
              key={l.id}
              onClick={() => handleLangChange(l.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all"
              style={lang === l.id
                ? { background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', boxShadow: '0 0 12px rgba(96,165,250,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 18px rgba(16,185,129,0.35)' }}
        >
          {running ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Running…
            </>
          ) : (
            <>▶ Run & Test</>
          )}
        </button>
      </div>

      {/* ── Monaco Editor ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(96,165,250,0.2)', boxShadow: '0 0 30px rgba(0,0,0,0.4)' }}>
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5"
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"/>
          <span className="ml-3 text-xs font-mono text-white/25">solution.{lang === 'cpp' ? 'cpp' : lang === 'java' ? 'java' : lang === 'go' ? 'go' : lang === 'javascript' ? 'js' : 'py'}</span>
          <span className="ml-auto text-xs font-mono text-white/20">{lang}</span>
        </div>
        <Editor
          height="340px"
          language={lang}
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
            tabSize: lang === 'python' ? 4 : 2,
          }}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 font-mono text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span className="text-white/25">// error: </span>{error}
        </div>
      )}

      {/* ── Test case results ── */}
      {result && (
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${passedAll ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)'}`, boxShadow: `0 0 24px ${passedAll ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.1)'}` }}>

          {/* Result header */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: passedAll ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{passedAll ? '🎉' : '❌'}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: passedAll ? '#34d399' : '#f87171' }}>
                  {passedAll ? 'All tests passed!' : `${result.passed_count}/${result.total_count} tests passed`}
                </p>
                <p className="text-xs font-mono text-white/30">status: {result.status}</p>
              </div>
            </div>
            {/* Score badge */}
            <div className="text-right">
              <p className="text-2xl font-bold font-mono" style={{ color: passedAll ? '#34d399' : '#fbbf24' }}>
                {result.total_count > 0 ? Math.round((result.passed_count / result.total_count) * 100) : 0}%
              </p>
              <p className="text-xs text-white/25 font-mono">test score</p>
            </div>
          </div>

          {/* Test case table */}
          <div style={{ background: 'rgba(4,10,24,0.98)' }}>
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-0 px-4 py-2 font-mono text-xs text-white/25"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="col-span-1">#</span>
              <span className="col-span-1">Pass</span>
              <span className="col-span-5">Expected</span>
              <span className="col-span-5">Got</span>
            </div>

            {tests.map((t, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-0 px-4 py-2.5 font-mono text-xs items-center transition-all hover:bg-white/3"
                style={{
                  borderBottom: i < tests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: t.passed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                }}
              >
                <span className="col-span-1 text-white/30">{i + 1}</span>
                <span className="col-span-1 text-base">
                  {t.timed_out ? '⏱' : t.passed ? '✅' : '❌'}
                </span>
                <span className="col-span-5 text-white/60 truncate pr-2">
                  {t.expected_output || '—'}
                </span>
                <span className={`col-span-5 truncate ${t.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.actual_output || t.error || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* AI feedback */}
          {result.ai_feedback && (
            <div className="px-5 py-4" style={{ background: 'rgba(4,10,24,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-mono mb-2" style={{ color: 'rgba(96,165,250,0.7)' }}>
                <span className="text-white/20">// </span>ai_code_review
              </p>
              <div className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap font-mono"
                style={{ borderLeft: '2px solid rgba(96,165,250,0.2)', paddingLeft: 12 }}>
                {typeof result.ai_feedback === 'string'
                  ? result.ai_feedback
                  : JSON.stringify(result.ai_feedback, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
