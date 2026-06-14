import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.1)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.2)',
        color: isDark ? 'rgba(255,255,255,0.7)' : '#4338ca',
      }}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className="text-xs hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
