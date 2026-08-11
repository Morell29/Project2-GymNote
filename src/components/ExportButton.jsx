// src/components/ExportButton.jsx
// Export progressive overload data as PDF or Image (PNG)

import { useRef, useState, forwardRef } from 'react'
import { X, Loader } from 'lucide-react'
import { getMaxWeight, calculateStreak } from '../utils/workoutUtils'

const CATEGORIES = [
  { key: 'Push',        emoji: '💪', color: '#e07b6a' },
  { key: 'Pull',        emoji: '🏋️', color: '#6a9ee0' },
  { key: 'Leg',         emoji: '🦵', color: '#7ace8a' },
  { key: 'Body Weight', emoji: '🤸', color: '#c98ae0' },
]

function getExerciseSummary(workouts, exerciseId) {
  const sessions = workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (!sessions.length) return { maxWeight: null, totalSessions: 0, unit: 'KG', trend: null }

  const latest = sessions[0].exercises.find(e => e.exerciseId === exerciseId)
  const maxWeight = getMaxWeight(latest)
  const unit = latest.unit || 'KG'

  let trend = null
  if (sessions.length >= 2) {
    const prev = sessions[1].exercises.find(e => e.exerciseId === exerciseId)
    const prevMax = getMaxWeight(prev)
    if (maxWeight > prevMax) trend = 'up'
    else if (maxWeight < prevMax) trend = 'down'
    else trend = 'same'
  } else if (sessions.length === 1) {
    trend = 'new'
  }

  return { maxWeight, totalSessions: sessions.length, unit, trend }
}

function TrendBadge({ trend }) {
  if (!trend) return <span style={{ color: '#5d7a94', fontSize: 11 }}>—</span>
  const map = {
    up:   { icon: '↗', color: '#7ace8a', label: 'Naik' },
    down: { icon: '↘', color: '#ff6b6b', label: 'Turun' },
    same: { icon: '→', color: '#5d7a94', label: 'Sama' },
    new:  { icon: '★', color: '#d4b896', label: 'Pertama' },
  }
  const t = map[trend]
  return <span style={{ color: t.color, fontWeight: 700, fontSize: 12 }}>{t.icon} {t.label}</span>
}

// Hidden printable element that gets captured
const ExportTemplate = forwardRef(function ExportTemplate({ workouts, library, username, exportDate }, ref) {
  const streak = calculateStreak(workouts)

  return (
    <div
      ref={ref}
      style={{
        width: 480,
        background: '#0c1825',
        color: '#f0e9df',
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        padding: '28px 24px 32px',
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #132035 0%, #1a2d47 100%)',
        borderRadius: 16,
        padding: '20px 20px 16px',
        marginBottom: 20,
        border: '1px solid rgba(212,184,150,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: '#9fb3c8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              GymNote · Progressive Overload Report
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f0e9df', marginBottom: 6 }}>
              {username} 💪
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#d4b896' }}>{workouts.length}</div>
                <div style={{ fontSize: 10, color: '#5d7a94', textTransform: 'uppercase', fontWeight: 700 }}>Total Sesi</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#d4b896' }}>{streak}</div>
                <div style={{ fontSize: 10, color: '#5d7a94', textTransform: 'uppercase', fontWeight: 700 }}>🔥 Streak</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#5d7a94', marginBottom: 2 }}>Tanggal Export</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9fb3c8' }}>{exportDate}</div>
          </div>
        </div>
      </div>

      {/* Per category */}
      {CATEGORIES.map(cat => {
        const catExercises = library.filter(ex => ex.category === cat.key)
        const trainedExercises = catExercises.filter(ex =>
          workouts.some(w => w.exercises.some(e => e.exerciseId === ex.id))
        )

        return (
          <div key={cat.key} style={{ marginBottom: 16 }}>
            {/* Category title */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: `${cat.color}18`,
              borderRadius: 10,
              marginBottom: 8,
              border: `1px solid ${cat.color}35`,
            }}>
              <span style={{ fontSize: 14 }}>{cat.emoji}</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {cat.key}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#5d7a94', fontWeight: 600 }}>
                {trainedExercises.length} / {catExercises.length} dilatih
              </span>
            </div>

            {/* Exercise table */}
            {trainedExercises.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', color: '#5d7a94', fontSize: 11 }}>
                Belum ada latihan di kategori ini
              </div>
            ) : (
              <div style={{ background: '#132035', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 60px 70px',
                  padding: '8px 12px',
                  background: '#1a2d47',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#5d7a94',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span>Exercise</span>
                  <span style={{ textAlign: 'right' }}>Maks</span>
                  <span style={{ textAlign: 'center' }}>Sesi</span>
                  <span style={{ textAlign: 'right' }}>Trend</span>
                </div>

                {/* Exercise rows */}
                {trainedExercises.map((ex, idx) => {
                  const { maxWeight, totalSessions, unit, trend } = getExerciseSummary(workouts, ex.id)
                  return (
                    <div key={ex.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 60px 70px',
                      padding: '9px 12px',
                      alignItems: 'center',
                      borderBottom: idx < trainedExercises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f0e9df' }}>{ex.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#d4b896', textAlign: 'right' }}>
                        {maxWeight !== null
                          ? (unit === 'BW' || unit === 'SEC' ? unit : `${maxWeight} ${unit}`)
                          : '—'
                        }
                      </span>
                      <span style={{ fontSize: 11, color: '#9fb3c8', textAlign: 'center', fontWeight: 700 }}>
                        {totalSessions}x
                      </span>
                      <span style={{ textAlign: 'right' }}>
                        <TrendBadge trend={trend} />
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      <div style={{
        marginTop: 16,
        padding: '10px 14px',
        background: '#132035',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 10, color: '#5d7a94', fontWeight: 600 }}>GymNote · Track Your Progress</span>
        <span style={{ fontSize: 10, color: '#5d7a94' }}>Diekspor: {exportDate}</span>
      </div>
    </div>
  )
})

export default function ExportButton({ workouts, library, username, onClose }) {
  const exportRef = useRef(null)
  const [loading, setLoading] = useState(null) // 'pdf' | 'img' | null

  const exportDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleExportImage = async () => {
    setLoading('img')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0c1825',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `GymNote_Progress_${new Date().toISOString().slice(0,10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export image error:', err)
    }
    setLoading(null)
    onClose()
  }

  const handleExportPDF = async () => {
    setLoading('pdf')
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0c1825',
        scale: 2,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`GymNote_Progress_${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (err) {
      console.error('Export PDF error:', err)
    }
    setLoading(null)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 2 }}>Export Progress</h2>
            <p className="text-xs text-muted">{exportDate}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} id="btn-close-export">
            <X size={18} />
          </button>
        </div>

        {/* Export options */}
        <button
          className="export-option-btn"
          id="btn-export-image"
          onClick={handleExportImage}
          disabled={!!loading}
        >
          <div className="export-option-icon" style={{ background: 'rgba(106,158,224,0.15)', color: '#6a9ee0' }}>
            {loading === 'img' ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : '🖼️'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
              Export sebagai Gambar
            </div>
            <div className="text-xs text-muted">Download file PNG berkualitas tinggi</div>
          </div>
        </button>

        <button
          className="export-option-btn"
          id="btn-export-pdf"
          onClick={handleExportPDF}
          disabled={!!loading}
        >
          <div className="export-option-icon" style={{ background: 'rgba(224,123,106,0.15)', color: '#e07b6a' }}>
            {loading === 'pdf' ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : '📄'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
              Export sebagai PDF
            </div>
            <div className="text-xs text-muted">Download file PDF yang bisa dibagikan</div>
          </div>
        </button>

        <p className="text-xs text-muted text-center mt-3" style={{ opacity: 0.7 }}>
          Berisi semua exercise yang pernah dilatih beserta progress terakhirnya
        </p>

        {/* Hidden export template */}
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <ExportTemplate
            ref={exportRef}
            workouts={workouts}
            library={library}
            username={username}
            exportDate={exportDate}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
