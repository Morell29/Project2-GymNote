import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Trash2, Pencil, Inbox, Calendar, Dumbbell, ArrowUpFromLine, MoveDown, Activity, Zap } from 'lucide-react'
import UpdateProgressModal from '../components/UpdateProgressModal'
import { useWorkouts, useExerciseLibrary } from '../hooks/useStorage'
import { calculateVolume, getMaxWeight } from '../utils/workoutUtils'

const CAT_META = {
  'Push':        { Icon: ArrowUpFromLine, color: 'var(--push-color)',   bg: 'var(--push-bg)' },
  'Pull':        { Icon: Dumbbell,        color: 'var(--pull-color)',   bg: 'var(--pull-bg)' },
  'Leg':         { Icon: MoveDown,        color: 'var(--leg-color)',    bg: 'var(--leg-bg)' },
  'Body Weight': { Icon: Activity,        color: 'var(--bw-color)',     bg: 'var(--bw-bg)' },
  'Others':      { Icon: Zap,             color: 'var(--others-color)', bg: 'var(--others-bg)' },
}

function getCategoryFromSession(session, library) {
  if (session.category) return session.category
  const firstEx = session.exercises?.[0]
  if (firstEx) {
    const def = library.find(l => l.id === firstEx.exerciseId)
    if (def?.category) return def.category
  }
  return 'Others'
}

function formatDuration(s) {
  if (!s) return null
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}j ${m % 60}m` : `${m}m`
}

function toDateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function SessionItem({ session, library, onUpdateProgress, onDelete }) {
  const [exDetail, setExDetail] = useState(null)

  const category = getCategoryFromSession(session, library)
  const meta     = CAT_META[category] || CAT_META['Others']
  const exCount  = session.exercises?.length || 0
  const totalVol = session.exercises?.reduce((s, ex) => s + calculateVolume(ex), 0) || 0
  const dur      = formatDuration(session.duration)

  return (
    <div style={{
      background: 'var(--bg-card-2)', borderRadius: '6px',
      marginBottom: 8, overflow: 'hidden', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6,
          background: meta.bg, border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <meta.Icon size={15} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: '13px', color: meta.color }}>
            {session.category || session.name || 'Latihan'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {dur && <span className="text-xs text-muted">{dur}</span>}
            <span className="text-xs text-muted">{exCount} gerakan</span>
            {totalVol > 0 && <span className="text-xs text-muted">· {Math.round(totalVol)} vol</span>}
          </div>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => onUpdateProgress(session)}
          style={{
            background: meta.color, color: 'var(--text-on-accent)',
            fontWeight: 500, fontSize: '12px', padding: '5px 10px', gap: 4,
          }}
        >
          <Pencil size={12} />
        </button>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onDelete(session.id)}
          style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', padding: 5 }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {exCount > 0 && (
        <div style={{ padding: '0 12px 10px' }}>
          {session.exercises.map(ex => {
            const def    = library.find(l => l.id === ex.exerciseId)
            const maxW   = getMaxWeight(ex)
            const isOpen = exDetail === ex.exerciseId

            return (
              <div key={ex.exerciseId} style={{
                background: 'var(--bg-card)', borderRadius: '6px',
                marginBottom: 4, overflow: 'hidden', border: '1px solid var(--border)',
              }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', cursor: 'pointer', gap: 6 }}
                  onClick={() => setExDetail(isOpen ? null : ex.exerciseId)}
                >
                  <span style={{ fontWeight: 500, fontSize: '13px', flex: 1 }}>
                    {def?.name || ex.exerciseId}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {maxW > 0
                      ? (ex.unit === 'BW' || ex.unit === 'SEC' ? ex.unit : `${maxW} ${ex.unit}`)
                      : '—'}
                  </span>
                  <span className="text-xs text-muted">{ex.sets.length}×</span>
                  {isOpen ? <ChevronUp size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
                </div>

                {isOpen && (
                  <div style={{ padding: '0 10px 8px' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 1fr',
                      gap: 6, marginBottom: 6,
                      fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'center',
                    }}>
                      <span>Set</span>
                      <span>{ex.unit === 'BW' ? 'Reps' : ex.unit === 'SEC' ? 'Detik' : 'Berat'}</span>
                      <span>{ex.unit === 'BW' || ex.unit === 'SEC' ? '—' : 'Reps'}</span>
                    </div>
                    {ex.sets.map((s, idx) => (
                      <div key={s.id || idx} style={{
                        display: 'grid', gridTemplateColumns: '28px 1fr 1fr',
                        gap: 6, marginBottom: 5,
                      }}>
                        <div className="set-num done" style={{ fontSize: '12px' }}>{idx + 1}</div>
                        <div style={{
                          textAlign: 'center', background: 'var(--bg-input)',
                          borderRadius: 6, padding: '6px 4px', border: '1px solid var(--border)',
                          fontSize: '14px', fontWeight: 500,
                        }}>{s.weight || '—'}</div>
                        <div style={{
                          textAlign: 'center', background: 'var(--bg-input)',
                          borderRadius: 6, padding: '6px 4px', border: '1px solid var(--border)',
                          fontSize: '14px', fontWeight: 500,
                        }}>{s.reps || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DayCard({ dateKey, sessions, library, onUpdateProgress, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const dateStr = new Date(dateKey + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const totalSessions = sessions.length
  const totalExercises = sessions.reduce((s, w) => s + (w.exercises?.length || 0), 0)
  const totalVol = sessions.reduce((s, w) =>
    s + (w.exercises?.reduce((v, ex) => v + calculateVolume(ex), 0) || 0), 0)

  const categories = [...new Set(sessions.map(s => getCategoryFromSession(s, library)))]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${expanded ? 'var(--border-hover)' : 'var(--border)'}`,
      borderRadius: '6px', marginBottom: 10, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', cursor: 'pointer', gap: 10 }}
        onClick={() => setExpanded(p => !p)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 6,
          background: 'var(--bg-card-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Calendar size={18} color="var(--accent)" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', marginBottom: 2 }}>
            {dateStr}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="text-xs text-muted">{totalSessions} sesi</span>
            <span className="text-xs text-muted">· {totalExercises} gerakan</span>
            {categories.map(cat => {
              const meta = CAT_META[cat] || CAT_META['Others']
              return (
                <span key={cat} style={{
                  fontSize: '10px', fontWeight: 500, color: meta.color,
                  background: meta.bg, padding: '1px 6px', borderRadius: 4,
                }}>{cat}</span>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {totalVol > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {Math.round(totalVol)}
              </div>
              <div className="text-xs text-muted">vol</div>
            </div>
          )}
          {expanded
            ? <ChevronUp size={16} color="var(--text-muted)" />
            : <ChevronDown size={16} color="var(--text-muted)" />
          }
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 10 }}>
            {sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                library={library}
                onUpdateProgress={onUpdateProgress}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function History() {
  const { workouts, setWorkouts } = useWorkouts()
  const { library } = useExerciseLibrary()
  const [updateSession, setUpdateSession] = useState(null)

  const deleteSession = (id) => setWorkouts(prev => prev.filter(w => w.id !== id))

  const grouped = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))
    const map = new Map()
    sorted.forEach(s => {
      const key = toDateKey(s.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    })
    return [...map.entries()]
  }, [workouts])

  return (
    <div className="page">
      <div className="page-header" style={{ paddingTop: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '-0.104px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Riwayat <Calendar size={22} color="var(--accent)" />
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            {workouts.length} sesi · {grouped.length} hari
          </p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Inbox size={48} strokeWidth={1} /></div>
          <h3>Belum ada riwayat</h3>
          <p>Selesaikan sesi latihan pertamamu</p>
        </div>
      ) : (
        <div>
          {grouped.map(([dateKey, sessions]) => (
            <DayCard
              key={dateKey}
              dateKey={dateKey}
              sessions={sessions}
              library={library}
              onUpdateProgress={setUpdateSession}
              onDelete={deleteSession}
            />
          ))}
        </div>
      )}

      {updateSession && (
        <UpdateProgressModal
          session={updateSession}
          library={library}
          onClose={() => setUpdateSession(null)}
        />
      )}
    </div>
  )
}
