import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AppBackground from '../components/AppBackground'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const DEFAULT = {
  contact: { name: '', title: '', phone: '', email: '', location: '', linkedin: '' },
  summary: '',
  skills: [{ category: '', items: '' }],
  experience: [{ role: '', company: '', location: '', start_date: '', end_date: '', bullets: [''] }],
  education: [{ degree: '', institution: '', location: '', start_year: '', end_year: '', details: [''] }],
  awards: [''],
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-lg">{icon}</span>
      <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>{title}</h2>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', type = 'text', rows }) {
  const { isDark } = useTheme()
  const base = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border-2)',
    borderRadius: 10,
    color: 'var(--text)',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    resize: rows ? 'vertical' : undefined,
  }
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</label>}
      {rows ? (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  )
}

export default function ResumeCreator() {
  const nav = useNavigate()
  const { isDark } = useTheme()
  const [form, setForm] = useState(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const card = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 16,
  }

  // ── helpers ──
  function setContact(field, val) { setForm(f => ({ ...f, contact: { ...f.contact, [field]: val } })) }
  function setSummary(val) { setForm(f => ({ ...f, summary: val })) }

  function setSkill(i, field, val) {
    setForm(f => { const s = [...f.skills]; s[i] = { ...s[i], [field]: val }; return { ...f, skills: s } })
  }
  function addSkill()    { setForm(f => ({ ...f, skills: [...f.skills, { category: '', items: '' }] })) }
  function removeSkill(i){ setForm(f => ({ ...f, skills: f.skills.filter((_, j) => j !== i) })) }

  function setExp(i, field, val) {
    setForm(f => { const e = [...f.experience]; e[i] = { ...e[i], [field]: val }; return { ...f, experience: e } })
  }
  function setExpBullet(i, j, val) {
    setForm(f => { const e = [...f.experience]; const b = [...e[i].bullets]; b[j] = val; e[i] = { ...e[i], bullets: b }; return { ...f, experience: e } })
  }
  function addExpBullet(i)    { setForm(f => { const e = [...f.experience]; e[i].bullets = [...e[i].bullets, '']; return { ...f, experience: e } }) }
  function removeExpBullet(i,j){ setForm(f => { const e = [...f.experience]; e[i].bullets = e[i].bullets.filter((_,k)=>k!==j); return { ...f, experience: e } }) }
  function addExp()    { setForm(f => ({ ...f, experience: [...f.experience, { role:'', company:'', location:'', start_date:'', end_date:'', bullets:[''] }] })) }
  function removeExp(i){ setForm(f => ({ ...f, experience: f.experience.filter((_,j)=>j!==i) })) }

  function setEdu(i, field, val) {
    setForm(f => { const e = [...f.education]; e[i] = { ...e[i], [field]: val }; return { ...f, education: e } })
  }
  function setEduDetail(i,j,val) {
    setForm(f => { const e=[...f.education]; const d=[...e[i].details]; d[j]=val; e[i]={...e[i],details:d}; return {...f,education:e} })
  }
  function addEduDetail(i)     { setForm(f => { const e=[...f.education]; e[i].details=[...e[i].details,'']; return {...f,education:e} }) }
  function removeEduDetail(i,j){ setForm(f => { const e=[...f.education]; e[i].details=e[i].details.filter((_,k)=>k!==j); return {...f,education:e} }) }
  function addEdu()    { setForm(f => ({ ...f, education: [...f.education, { degree:'', institution:'', location:'', start_year:'', end_year:'', details:[''] }] })) }
  function removeEdu(i){ setForm(f => ({ ...f, education: f.education.filter((_,j)=>j!==i) })) }

  function setAward(i,val){ setForm(f => { const a=[...f.awards]; a[i]=val; return {...f,awards:a} }) }
  function addAward()     { setForm(f => ({ ...f, awards: [...f.awards, ''] })) }
  function removeAward(i) { setForm(f => ({ ...f, awards: f.awards.filter((_,j)=>j!==i) })) }

  async function handleGenerate() {
    if (!form.contact.name.trim()) { setError('Name is required'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        skills: form.skills.filter(s => s.category.trim()),
        experience: form.experience.map(e => ({ ...e, bullets: e.bullets.filter(b => b.trim()) })).filter(e => e.role.trim()),
        education: form.education.map(e => ({ ...e, details: e.details.filter(d => d.trim()) })).filter(e => e.degree.trim()),
        awards: form.awards.filter(a => a.trim()),
      }
      const blob = await api.generateResumePDF(payload)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.contact.name.replace(/\s+/g, '_')}_Resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const addBtn = (onClick, label) => (
    <button onClick={onClick} className="text-xs px-3 py-1.5 rounded-lg transition-all mt-2"
      style={{ color: '#818cf8', border: '1px dashed rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.06)' }}>
      + {label}
    </button>
  )
  const removeBtn = (onClick) => (
    <button onClick={onClick} className="text-xs px-2 py-1 rounded-lg ml-2 transition-all hover:opacity-80"
      style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)' }}>
      Remove
    </button>
  )

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AppBackground />

      <header className="glass-dark sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => nav('/')} className="text-sm" style={{ color: 'var(--text-3)' }}>← Dashboard</button>
          <span style={{ color: 'var(--text-3)' }}>|</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>📄 Resume Creator</span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleGenerate} disabled={loading}
              className="btn-primary text-sm py-2 px-5">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating…</span>
                : '⬇ Download PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* Contact Info */}
        <div style={card}>
          <SectionHeader icon="👤" title="Personal Information" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Full Name *" value={form.contact.name} onChange={v => setContact('name', v)} placeholder="your fullname e.g., John Doe" />
            <Field label="Professional Title" value={form.contact.title} onChange={v => setContact('title', v)} placeholder="Python Developer" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Phone" value={form.contact.phone} onChange={v => setContact('phone', v)} placeholder="+91 9999999999" />
            <Field label="Email" value={form.contact.email} onChange={v => setContact('email', v)} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" value={form.contact.location} onChange={v => setContact('location', v)} placeholder="Bangalore, India" />
            <Field label="LinkedIn URL" value={form.contact.linkedin} onChange={v => setContact('linkedin', v)} placeholder="linkedin.com/in/yourprofile" />
          </div>
        </div>

        {/* Summary */}
        <div style={card}>
          <SectionHeader icon="📝" title="Professional Summary" />
          <Field value={form.summary} onChange={setSummary} rows={4}
            placeholder="Results-driven developer with X years of experience…" />
        </div>

        {/* Skills */}
        <div style={card}>
          <SectionHeader icon="🛠️" title="Skills" />
          <div className="space-y-3">
            {form.skills.map((sk, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 items-start">
                <Field label={i === 0 ? 'Category' : ''} value={sk.category} onChange={v => setSkill(i, 'category', v)} placeholder="Programming" />
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Field label={i === 0 ? 'Skills / Tools' : ''} value={sk.items} onChange={v => setSkill(i, 'items', v)} placeholder="Python, Django, Flask" /></div>
                  {form.skills.length > 1 && removeBtn(() => removeSkill(i))}
                </div>
              </div>
            ))}
          </div>
          {addBtn(addSkill, 'Add Skill Category')}
        </div>

        {/* Experience */}
        <div style={card}>
          <SectionHeader icon="💼" title="Professional Experience" />
          <div className="space-y-6">
            {form.experience.map((exp, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>Experience {i + 1}</span>
                  {form.experience.length > 1 && removeBtn(() => removeExp(i))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Job Title" value={exp.role} onChange={v => setExp(i, 'role', v)} placeholder="Python Developer" />
                  <Field label="Company" value={exp.company} onChange={v => setExp(i, 'company', v)} placeholder="Tata Consultancy Services" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Field label="Location" value={exp.location} onChange={v => setExp(i, 'location', v)} placeholder="Bangalore, India" />
                  <Field label="Start Date" value={exp.start_date} onChange={v => setExp(i, 'start_date', v)} placeholder="12/2021" />
                  <Field label="End Date" value={exp.end_date} onChange={v => setExp(i, 'end_date', v)} placeholder="Present" />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-3)' }}>Responsibilities / Achievements</label>
                  <div className="space-y-2">
                    {exp.bullets.map((b, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="mt-2 text-xs" style={{ color: 'var(--text-3)' }}>•</span>
                        <div className="flex-1">
                          <Field value={b} onChange={v => setExpBullet(i, j, v)} placeholder="Built and maintained Python-based applications…" />
                        </div>
                        {exp.bullets.length > 1 && (
                          <button onClick={() => removeExpBullet(i, j)} className="mt-1.5 text-xs px-1.5 py-1 rounded text-red-400 opacity-60 hover:opacity-100">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {addBtn(() => addExpBullet(i), 'Add Bullet')}
                </div>
              </div>
            ))}
          </div>
          {addBtn(addExp, 'Add Experience')}
        </div>

        {/* Education */}
        <div style={card}>
          <SectionHeader icon="🎓" title="Education" />
          <div className="space-y-4">
            {form.education.map((edu, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>Education {i + 1}</span>
                  {form.education.length > 1 && removeBtn(() => removeEdu(i))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Degree / Programme" value={edu.degree} onChange={v => setEdu(i, 'degree', v)} placeholder="MCA" />
                  <Field label="Institution" value={edu.institution} onChange={v => setEdu(i, 'institution', v)} placeholder="Jain University" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Field label="Location" value={edu.location} onChange={v => setEdu(i, 'location', v)} placeholder="Bangalore, India" />
                  <Field label="Start Year" value={edu.start_year} onChange={v => setEdu(i, 'start_year', v)} placeholder="2022" />
                  <Field label="End Year" value={edu.end_year} onChange={v => setEdu(i, 'end_year', v)} placeholder="2024" />
                </div>
                <div className="space-y-2">
                  {edu.details.map((d, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="mt-2 text-xs" style={{ color: 'var(--text-3)' }}>•</span>
                      <div className="flex-1"><Field value={d} onChange={v => setEduDetail(i, j, v)} placeholder="Major in Computer Application (9.0 CGPA)" /></div>
                      {edu.details.length > 1 && (
                        <button onClick={() => removeEduDetail(i, j)} className="mt-1.5 text-xs px-1.5 py-1 rounded text-red-400 opacity-60 hover:opacity-100">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {addBtn(() => addEduDetail(i), 'Add Detail')}
              </div>
            ))}
          </div>
          {addBtn(addEdu, 'Add Education')}
        </div>

        {/* Awards */}
        <div style={card}>
          <SectionHeader icon="🏆" title="Awards & Certifications" />
          <div className="space-y-2">
            {form.awards.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>–</span>
                <div className="flex-1"><Field value={a} onChange={v => setAward(i, v)} placeholder="Google Cloud Certified — Associate Cloud Engineer" /></div>
                {form.awards.length > 1 && (
                  <button onClick={() => removeAward(i)} className="text-xs px-1.5 py-1 rounded text-red-400 opacity-60 hover:opacity-100">×</button>
                )}
              </div>
            ))}
          </div>
          {addBtn(addAward, 'Add Award')}
        </div>

        {/* Bottom generate button */}
        <div className="flex justify-center py-4">
          <button onClick={handleGenerate} disabled={loading} className="btn-primary px-10 py-3 text-sm">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating PDF…</span>
              : '⬇ Generate & Download PDF'}
          </button>
        </div>
      </main>
    </div>
  )
}
