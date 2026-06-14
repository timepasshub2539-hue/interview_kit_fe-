import { useTheme } from '../context/ThemeContext'

export default function AppBackground() {
  const { isDark } = useTheme()

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {isDark ? (
        <>
          {/* Dark: deep navy base */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#05080f 0%,#080d1c 55%,#060a17 100%)' }}/>
          {/* Subtle radial glows — static, no animation */}
          <div className="absolute" style={{ top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)'}}/>
          <div className="absolute" style={{ bottom: '-15%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)'}}/>
          <div className="absolute" style={{ top: '40%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.04) 0%,transparent 70%)'}}/>
          {/* Subtle dot grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>
          {/* Thin horizontal line accent */}
          <div className="absolute left-0 right-0" style={{ top: '30%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.06),transparent)'}}/>
        </>
      ) : (
        <>
          {/* Light: clean white-blue base */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#e8effe 55%,#f5f7ff 100%)' }}/>
          {/* Subtle colour blobs */}
          <div className="absolute" style={{ top: '-8%', left: '-4%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)'}}/>
          <div className="absolute" style={{ bottom: '-10%', right: '-4%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)'}}/>
          {/* Dot grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>
        </>
      )}
    </div>
  )
}
