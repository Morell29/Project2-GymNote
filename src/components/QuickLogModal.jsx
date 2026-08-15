import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useWorkouts } from '../hooks/useStorage'
import { generateId } from '../utils/workoutUtils'

const CATS = [
  { key: 'Push',        emoji: '💪', label: 'Push',        colorVar: '--push-color',   bgVar: '--push-bg'   },
  { key: 'Pull',        emoji: '🏋️', label: 'Pull',        colorVar: '--pull-color',   bgVar: '--pull-bg'   },
  { key: 'Leg',         emoji: '🦵', label: 'Leg',         colorVar: '--leg-color',    bgVar: '--leg-bg'    },
  { key: 'Body Weight', emoji: '🤸', label: 'Body Weight', colorVar: '--bw-color',     bgVar: '--bw-bg'     },
  { key: 'Others',      emoji: '⚡', label: 'Others',      colorVar: '--others-color', bgVar: '--others-bg' },
]

export default function QuickLogModal({ onClose, onLogged }) {
  const { setWorkouts } = useWorkouts()
  const [selectedCat, setSelectedCat] = useState(null)

  const today = new Date()
  const dateDisplay = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleConfirm = () => {
    if (!selectedCat) return

    const session = {
      id: generateId(),
      name: selectedCat,
      date: today.toISOString(),
      duration: 0,
      exercises: [],
      category: selectedCat,
    }

    setWorkouts(prev => [session, ...prev])
    onLogged(session)
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: 3 }}>Catat Latihan</h2>
            <p className="text-xs" style={{ color: 'var(--accent)', fontWeight: 500 }}>
              📅 {dateDisplay}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            id="btn-close-quicklog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <p
          className="text-sm"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Pilih jenis latihan hari ini:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {CATS.map(cat => {
            const isSelected = selectedCat === cat.key
            return (
              <button
                key={cat.key}
                id={`quicklog-cat-${cat.key.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setSelectedCat(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 16px',
                  borderRadius: '6px',
                  border: `1.5px solid ${isSelected ? `var(${cat.colorVar})` : 'var(--border)'}`,
                  background: isSelected ? `var(${cat.bgVar})` : 'var(--bg-card-2)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center' }}>
                  {cat.emoji}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: '15px',
                    flex: 1,
                    color: isSelected ? `var(${cat.colorVar})` : 'var(--text-primary)',
                    transition: 'var(--transition)',
                  }}
                >
                  {cat.label}
                </span>
                {isSelected && (
                  <span style={{ color: `var(${cat.colorVar})`, display: 'flex' }}>
                    <Check size={18} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-primary btn-full"
          id="btn-confirm-quicklog"
          onClick={handleConfirm}
          disabled={!selectedCat}
          style={{ opacity: selectedCat ? 1 : 0.45, transition: 'opacity 0.2s' }}
        >
          <Check size={17} />
          Simpan Catatan
        </button>
      </div>
    </div>
  )
}
