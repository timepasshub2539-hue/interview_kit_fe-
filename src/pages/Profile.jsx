import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false, hint = '' }) {
  const { isDark } = useTheme()
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 font-mono" style={{ color: 'var(--text-3)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        style={{
          background: readOnly
            ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'),
          border: `1px solid ${readOnly ? 'var(--border)' : 'rgba(99,102,241,0.3)'}`,
          color: 'var(--text)',
          cursor: readOnly ? 'not-allowed' : 'text',
        }}
      />
      {hint && <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  )
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed,#ec4899)', boxShadow: '0 16px 40px rgba(99,102,241,0.4)' }}>
      {initials}
    </div>
  )
}

export default function Profile() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [tab, setTab] = useState('profile')
  const [user, setUser] = useState(null)

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [location, setLocation] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null) // { type: 'ok'|'err', text }

  // Password form state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    api.me().then(u => {
      setUser(u)
      setFullName(u.full_name || '')
      setMobile(u.mobile || '')
      setJobTitle(u.job_title || '')
      setLinkedinUrl(u.linkedin_url || '')
      setLocation(u.location || '')
    }).catch(() => nav('/login'))
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const updated = await api.updateProfile({
        full_name: fullName || undefined,
        mobile: mobile || undefined,
        job_title: jobTitle || undefined,
        linkedin_url: linkedinUrl || undefined,
        location: location || undefined,
      })
      setUser(updated)
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'err', text: 'New passwords do not match' })
      return
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'err', text: 'Password must be at least 8 characters' })
      return
    }
    setPwSaving(true)
    try {
      await api.changePassword({ current_password: currentPw, new_password: newPw })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwMsg({ type: 'ok', text: 'Password changed successfully!' })
    } catch (err) {
      setPwMsg({ type: 'err', text: err.message || 'Failed to change password' })
    } finally {
      setPwSaving(false)
    }
  }

  const card = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
  }

  const tabActive = {
    background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
    color: '#fff',
  }
  const tabInactive = {
    color: 'var(--text-2)',
    background: 'transparent',
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      {/* Header */}
      <header className="relative z-10 sticky top-0"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => nav('/')}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-2)' }}>
            ← Dashboard
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--text)' }}>
          My{' '}
          <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Profile
          </span>
        </h1>

        {/* Avatar + identity card */}
        <div className="rounded-2xl p-6 mb-6 flex items-center gap-6" style={card}>
          <Avatar name={user.full_name} />
          <div className="min-w-0">
            <p className="text-xl font-bold truncate" style={{ color: 'var(--text)' }}>{user.full_name || 'No name set'}</p>
            {user.job_title && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{user.job_title}</p>
            )}
            <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-3)' }}>{user.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {user.location && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}>
                  📍 {user.location}
                </span>
              )}
              {user.mobile && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  📱 {user.mobile}
                </span>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                  🔗 LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'profile', label: '👤 Profile Details' },
            { key: 'security', label: '🔒 Security' },
            { key: 'badges', label: '🏆 Badges' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.key ? tabActive : tabInactive}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Details */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile}>
            <div className="rounded-2xl p-6 space-y-5" style={card}>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Alex Pattanaik" />
                <Field label="Email" value={user.email} readOnly hint="Email cannot be changed" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Mobile Number" value={mobile} onChange={setMobile} placeholder="+91 98765 43210" type="tel" />
                <Field label="Job Title / Role" value={jobTitle} onChange={setJobTitle} placeholder="Software Engineer" />
              </div>
              <Field label="LinkedIn URL" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/yourprofile" type="url" />
              <Field label="Location" value={location} onChange={setLocation} placeholder="Bengaluru, India" />

              {profileMsg && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: profileMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${profileMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: profileMsg.type === 'ok' ? '#34d399' : '#f87171',
                  }}>
                  {profileMsg.type === 'ok' ? '✓ ' : '✕ '}{profileMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={profileSaving}
                  className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 0 25px rgba(99,102,241,0.35)' }}>
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Badges */}
        {tab === 'badges' && (
          <div className="rounded-2xl p-6" style={card}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Achievements</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{user.badges?.filter(b => b.earned).length || 0} / {user.badges?.length || 0} earned</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <span>🔥</span>
                <span className="text-sm font-bold" style={{ color: '#f97316' }}>{user.streak_count} day streak</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(user.badges || []).map(badge => (
                <div key={badge.id} className="rounded-xl p-4 text-center transition-all"
                  style={{
                    background: badge.earned ? (isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'),
                    border: badge.earned ? '1px solid rgba(99,102,241,0.35)' : '1px solid var(--border)',
                    opacity: badge.earned ? 1 : 0.45,
                  }}>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-xs font-bold mb-1" style={{ color: badge.earned ? 'var(--text)' : 'var(--text-3)' }}>{badge.name}</p>
                  <p className="text-xs leading-tight" style={{ color: 'var(--text-3)' }}>{badge.description}</p>
                  {badge.earned && <div className="mt-2 text-xs font-semibold" style={{ color: '#a78bfa' }}>✓ Earned</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <form onSubmit={savePassword}>
            <div className="rounded-2xl p-6 space-y-5" style={card}>
              <div>
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Change Password</p>
                <div className="space-y-4">
                  <Field label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="Enter your current password" />
                  <Field label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="At least 8 characters" hint="Min 8 characters" />
                  <Field label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Repeat new password" />
                </div>
              </div>

              {pwMsg && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: pwMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${pwMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: pwMsg.type === 'ok' ? '#34d399' : '#f87171',
                  }}>
                  {pwMsg.type === 'ok' ? '✓ ' : '✕ '}{pwMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#7c3aed)', boxShadow: '0 0 25px rgba(124,58,237,0.3)' }}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
