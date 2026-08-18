// src/pages/History.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, X, Trash2, TrendingUp, Calendar, Inbox } from 'lucide-react'
import ProgressChart from '../components/ProgressChart'
import { useWorkouts, useExerciseLibrary } from '../hooks/useStorage'
import { formatRelativeDate, getExerciseHistory, calculateVolume, getMaxWeight } from '../utils/workoutUtils'

function SessionDetail({ session, library, workouts, onClose, onDelete }) {
  const [selectedExercise, setSelectedExercise] = useState(null)

  const formatDuration = (s) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}j ${m % 60}m`
    return `${m}m`
  }

  const totalVolume = session.exercises?.reduce((sum, ex) => sum + calculateVolume(ex), 0) || 0

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '90dvh' }}>
        <div className="modal-handle" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2>{session.name || 'Latihan'}</h2>
            <p className="text-xs text-muted">{new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Stats */}
        <div className="stat-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-box">
            <div className="stat-val" style={{ fontSize: '1.1rem' }}>{session.exercises?.length || 0}</div>
            <div className="stat-label">Gerakan</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ fontSize: '1.1rem' }}>{formatDuration(session.duration)}</div>
            <div className="stat-label">Durasi</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ fontSize: '1.1rem' }}>{Math.round(totalVolume)}</div>
            <div className="stat-label">Volume</div>
          </div>
        </div>

        {/* Exercises */}
        {session.exercises?.map(ex => {
          const def = library.find(l => l.id === ex.exerciseId)
          const history = getExerciseHistory(workouts, ex.exerciseId)
          const isSelected = selectedExercise === ex.exerciseId

          return (
            <div key={ex.exerciseId} className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="exercise-header"
                onClick={() => setSelectedExercise(isSelected ? null : ex.exerciseId)}
                style={{ padding: '12px 14px' }}
              >
                <div>
                  <p style={{ fontWeight: 700 }}>{def?.name || ex.exerciseId}</p>
                  <p className="text-xs text-muted">
                    {ex.sets.length} set · Maks {getMaxWeight(ex)} {ex.unit || 'KG'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                </div>
              </div>

              {isSelected && (
                <div style={{ padding: '0 14px 14px' }}>
                  {/* Sets detail */}
                  <div className="set-header-row" style={{ gridTemplateColumns: '32px 1fr 1fr 60px', marginBottom: 6 }}>
                    <span>Set</span><span>{ex.unit||'KG'}</span><span>Reps</span><span>RPE</span>
                  </div>
                  {ex.sets.map((s, i) => (
                    <div key={s.id || i} style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr 1fr 60px',
                      gap: 8,
                      marginBottom: 6,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}>
                      <div className="set-num done">{i+1}</div>
                      <div style={{ textAlign: 'center', background: 'var(--bg-input)', borderRadius: 8, padding: '8px 6px' }}>{s.weight || '—'}</div>
                      <div style={{ textAlign: 'center', background: 'var(--bg-input)', borderRadius: 8, padding: '8px 6px' }}>{s.reps || '—'}</div>
                      <div style={{ textAlign: 'center', background: 'var(--bg-input)', borderRadius: 8, padding: '8px 6px', color: 'var(--text-muted)' }}>{s.rpe || '—'}</div>
                    </div>
                  ))}
                  {/* Chart */}
                  {history.length >= 2 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted mb-2" style={{ fontWeight: 700 }}>PERKEMBANGAN BERAT</p>
                      <ProgressChart data={history} dataKey="maxWeight" name="Berat Maks" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <button className="btn btn-danger btn-full mt-3" onClick={onDelete}>
          <Trash2 size={16} /> Hapus Sesi Ini
        </button>
      </div>
    </div>
  )
}

export default function History() {
  const { workouts, setWorkouts } = useWorkouts()
  const { library } = useExerciseLibrary()
  const [selectedSession, setSelectedSession] = useState(null)

  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))

  const deleteSession = (id) => {
    setWorkouts(prev => prev.filter(w => w.id !== id))
    setSelectedSession(null)
  }

  const formatDuration = (s) => {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}j ${m % 60}m`
    return `${m}m`
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Riwayat <Calendar size={22} color="var(--accent)" /></h1>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Inbox size={48} strokeWidth={1} /></div>
          <h3>Belum ada riwayat</h3>
          <p>Selesaikan sesi latihan pertamamu</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">{sorted.length} sesi tersimpan</p>
          {sorted.map(session => {
            const totalVol = session.exercises?.reduce((sum, ex) => sum + calculateVolume(ex), 0) || 0
            return (
              <div
                key={session.id}
                className="history-item"
                onClick={() => setSelectedSession(session)}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{session.name || 'Latihan'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted">{formatRelativeDate(session.date)}</p>
                    {session.duration && <span className="text-xs text-muted">· {formatDuration(session.duration)}</span>}
                    <span className="text-xs text-muted">· {session.exercises?.length || 0} gerakan</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalVol > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>{Math.round(totalVol)}</p>
                      <p className="text-xs text-muted">vol</p>
                    </div>
                  )}
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            )
          })}
        </>
      )}

      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          library={library}
          workouts={workouts}
          onClose={() => setSelectedSession(null)}
          onDelete={() => deleteSession(selectedSession.id)}
        />
      )}
    </div>
  )
}
