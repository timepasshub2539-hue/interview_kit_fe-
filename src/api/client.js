const BASE = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(method, path, { body, json, form, _retried = false } = {}) {
  const headers = authHeaders(json ? { 'Content-Type': 'application/json' } : {})
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: json ? JSON.stringify(body) : form ? body : undefined,
  })

  if (res.status === 401) {
    if (!_retried) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        return request(method, path, { body, json, form, _retried: true })
      }
    }
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    return true
  } catch {
    return false
  }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body, json: true }),
  postForm: (path, formData) => request('POST', path, { body: formData, form: true }),
  delete: (path) => request('DELETE', path),

  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => request('PUT', '/auth/profile', { body: data, json: true }),
  changePassword: (data) => api.post('/auth/change-password', data),

  // Sessions
  createSession: (title, sessionType = 'jd_match', difficulty = 'medium', targetCompany = null) =>
    api.post('/sessions', { title: title || null, session_type: sessionType, difficulty, target_company: targetCompany }),
  listSessions: () => api.get('/sessions'),
  getSession: (id) => api.get(`/sessions/${id}`),
  uploadResume: (sessionId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.postForm(`/sessions/${sessionId}/upload-resume`, fd)
  },
  uploadJDText: (sessionId, text) => api.post(`/sessions/${sessionId}/upload-jd`, { text }),
  uploadJDFile: (sessionId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.postForm(`/sessions/${sessionId}/upload-jd`, fd)
  },
  analyzeSession: (sessionId) => api.post(`/sessions/${sessionId}/analyze`, {}),
  getAnalysis: (sessionId) => api.get(`/sessions/${sessionId}/analysis`),
  deleteSession: (sessionId) => api.delete(`/sessions/${sessionId}`),

  // Interviews
  startInterview: (sessionId) => api.post(`/sessions/${sessionId}/start-interview`, {}),
  startResumeInterview: (sessionId) => api.post(`/sessions/${sessionId}/start-resume-interview`, {}),
  startJDInterview: (sessionId) => api.post(`/sessions/${sessionId}/start-jd-interview`, {}),
  getAIAnswer: (questionId) => api.post(`/questions/${questionId}/ai-answer`, {}),
  getRounds: (sessionId) => api.get(`/sessions/${sessionId}/rounds`),
  getRound: (roundId) => api.get(`/rounds/${roundId}`),
  activateRound: (roundId) => api.post(`/rounds/${roundId}/activate`, {}),

  // Answers
  submitTextAnswer: (questionId, text) =>
    api.post(`/questions/${questionId}/submit-text-answer`, { answer_text: text }),
  submitVoiceAnswer: (questionId, audioBlob, ext = 'webm') => {
    const fd = new FormData()
    fd.append('audio', audioBlob, `recording.${ext}`)
    return api.postForm(`/questions/${questionId}/submit-voice-answer`, fd)
  },
  getAnswer: (answerId) => api.get(`/answers/${answerId}`),
  getScoreStatus: (answerId) => api.get(`/answers/${answerId}/score-status`),

  // Code
  getProblem: (problemId) => api.get(`/code-problems/${problemId}`),
  submitCode: (problemId, sourceCode, language) =>
    api.post(`/code-problems/${problemId}/submit`, { source_code: sourceCode, language }),
  getSubmission: (submissionId) => api.get(`/code-submissions/${submissionId}`),

  // Reports
  generateReport: (sessionId) => api.post(`/sessions/${sessionId}/generate-report`, {}),
  getReport: (sessionId) => api.get(`/sessions/${sessionId}/report`),

  // Resume Builder — returns raw blob
  generateResumePDF: async (data) => {
    const token = localStorage.getItem('access_token')
    const res = await fetch('/api/resume-builder/generate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed') }
    return res.blob()
  },

  // Roadmap
  generateRoadmap: (role, skillRatings) => api.post('/roadmap/generate', { role, skill_ratings: skillRatings }),

  // Chat
  chat: (messages) => api.post('/chat', { messages }),

  // Analytics
  getAnalytics: () => api.get('/analytics/overview'),

  // Study
  getStudyCourses: () => api.get('/study/courses'),
  getStudyCurriculum: (language = 'python') => api.get(`/study/curriculum?language=${language}`),
  getStudyConcept: (id, generate = false) => api.get(`/study/concepts/${id}${generate ? '?generate=true' : ''}`),
  updateStudyProgress: (id, data) => api.post(`/study/concepts/${id}/progress`, data),
  getStudyOverview: () => api.get('/study/progress/overview'),
  createCustomCourse: (name) => api.post('/study/courses/custom', { name }),

  // Bookmarks
  bookmarkQuestion: (questionId) => api.post(`/questions/${questionId}/bookmark`, {}),
  removeBookmark: (questionId) => request('DELETE', `/questions/${questionId}/bookmark`),
  getBookmarks: () => api.get('/bookmarks'),
  getBookmarkStatus: (questionId) => api.get(`/questions/${questionId}/bookmark-status`),
}
