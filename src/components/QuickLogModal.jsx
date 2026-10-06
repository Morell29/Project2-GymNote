import { useState } from 'react'
import { X, Check, ArrowUpFromLine, Dumbbell, MoveDown, Activity, Zap, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { generateId, parseWorkoutDate } from '../utils/workoutUtils'

const CATS = [
  { key: 'Push',        Icon: ArrowUpFromLine, label: 'Push',        colorVar: '--push-color',   bgVar: '--push-bg'   },
  { key: 'Pull',        Icon: Dumbbell,        label: 'Pull',        colorVar: '--pull-color',   bgVar: '--pull-bg'   },
  { key: 'Leg',         Icon: MoveDown,        label: 'Leg',         colorVar: '--leg-color',    bgVar: '--leg-bg'    },
  { key: 'Body Weight', Icon: Activity,        label: 'Body Weight', colorVar: '--bw-color',     bgVar: '--bw-bg'     },
  { key: 'Others',      Icon: Zap,             label: 'Others',      colorVar: '--others-color', bgVar: '--others-bg' },
]

export default function QuickLogModal({ onClose, onLogged, setWorkouts }) {
  const [selectedCat, setSelectedCat] = useState(null)

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [calMonth, setCalMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const monthLabel = calMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const leadingDays = (calMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const workoutDate = parseWorkoutDate(selectedDate)
  const dateDisplay = workoutDate?.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleConfirm = () => {
    if (!selectedCat || !workoutDate) return

    const session = {
      id: generateId(),
      name: selectedCat,
      date: workoutDate.toISOString(),
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
            <p className="text-xs" style={{ color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> {dateDisplay}
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

        <section className="mb-4" aria-label="Tanggal latihan" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Bulan sebelumnya"
              disabled={year === 1 && month === 0}
              onClick={() => setCalMonth(prev => {
                const next = new Date(prev)
                next.setMonth(next.getMonth() - 1)
                return next
              })}
            >
              <ChevronLeft size={18} />
            </button>
            <h3 aria-live="polite" style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{monthLabel}</h3>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Bulan berikutnya"
              disabled={year === 9999 && month === 11}
              onClick={() => setCalMonth(prev => {
                const next = new Date(prev)
                next.setMonth(next.getMonth() + 1)
                return next
              })}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
              <div key={`weekday-${i}`} style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', padding: '4px 0' }}>{day}</div>
            ))}
            {Array.from({ length: leadingDays }, (_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const key = `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = selectedDate === key
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${day} ${monthLabel}`}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => setSelectedDate(key)}
                  style={{
                    minHeight: 36,
                    borderRadius: 8,
                    fontSize: '14px',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    color: isSelected || isToday ? 'var(--accent)' : 'var(--text-primary)',
                    background: isSelected ? 'var(--accent-glow-sm)' : 'transparent',
                    border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </section>

        <p
          className="text-sm"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Pilih jenis latihan:
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
                <span style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <cat.Icon size={20} color={isSelected ? `var(${cat.colorVar})` : 'var(--text-muted)'} />
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
          disabled={!selectedCat || !workoutDate}
          style={{ opacity: selectedCat && workoutDate ? 1 : 0.45, transition: 'opacity 0.2s' }}
        >
          <Check size={17} />
          Simpan Catatan
        </button>
      </div>
    </div>
  )
}
