// src/components/RestTimer.jsx
import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'

const PRESETS = [30, 60, 90, 120, 180]

export default function RestTimer({ defaultSeconds = 90, onClose }) {
  const [total, setTotal] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            // Vibrate on finish
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, remaining])

  const progress = ((total - remaining) / total) * 100
  const circumference = 2 * Math.PI * 52
  const strokeDash = circumference - (progress / 100) * circumference

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
  }

  const handlePreset = (sec) => {
    clearInterval(intervalRef.current)
    setTotal(sec)
    setRemaining(sec)
    setRunning(true)
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setRemaining(total)
    setRunning(true)
  }

  return (
    <div className="rest-timer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rest-timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontWeight: 800 }}>⏱ Rest Timer</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Timer Circle */}
        <div className="timer-circle">
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={remaining === 0 ? '#ff3b30' : 'var(--accent)'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px var(--accent))' }}
            />
          </svg>
          <div className="timer-value" style={{ color: remaining === 0 ? '#ff3b30' : 'var(--accent)' }}>
            {remaining === 0 ? 'GO!' : formatTime(remaining)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center mb-4">
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            <RotateCcw size={15} /> Reset
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setRunning(r => !r)}
          >
            {running ? <><Pause size={15}/> Pause</> : <><Play size={15}/> Lanjut</>}
          </button>
        </div>

        {/* Presets */}
        <div className="timer-presets">
          {PRESETS.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${total === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handlePreset(s)}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-2">
          Ketuk di luar untuk tutup
        </p>
      </div>
    </div>
  )
}
