import { useState, useRef, useEffect } from 'react'

function getSupportedMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

function getExt(mime) {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

export default function AudioRecorder({ onSubmit, disabled }) {
  const [state, setState] = useState('idle') // idle | recording | stopped
  const [elapsed, setElapsed] = useState(0)
  const [blob, setBlob] = useState(null)
  const mediaRef = useRef(null)
  const streamRef = useRef(null)
  const chunks = useRef([])
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  async function start() {
    chunks.current = []
    setBlob(null)
    setElapsed(0)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const mime = getSupportedMime()
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
    mediaRef.current = recorder
    recorder.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
    recorder.onstop = () => {
      const b = new Blob(chunks.current, { type: mime || 'audio/webm' })
      setBlob(b)
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start(250)
    setState('recording')
    timer.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }

  function stop() {
    clearInterval(timer.current)
    mediaRef.current?.stop()
    setState('stopped')
  }

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  function handleSubmit() {
    if (!blob) return
    const mime = getSupportedMime()
    onSubmit(blob, getExt(mime))
  }

  return (
    <div className="space-y-2">
      {state === 'idle' && (
        <button
          onClick={start}
          disabled={disabled}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          Start Recording
        </button>
      )}
      {state === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono">{fmt(elapsed)}</span>
          <button onClick={stop} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">
            Stop
          </button>
        </div>
      )}
      {state === 'stopped' && blob && (
        <div className="space-y-2">
          <audio controls src={URL.createObjectURL(blob)} className="w-full" />
          <div className="flex gap-2">
            <button onClick={start} className="text-sm text-gray-500 hover:underline">
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              Submit Recording
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
