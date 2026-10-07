import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Trash2, Pencil, Inbox, Calendar, Dumbbell, ArrowUpFromLine, MoveDown, Activity, Zap } from 'lucide-react'
import UpdateProgressModal from '../components/UpdateProgressModal'
import { useWorkouts, useExerciseLibrary } from '../hooks/useStorage'
import { calculateVolume, getMaxWeight } from '../utils/workoutUtils'

const CAT_META = {
  'Push':        { Icon: ArrowUpFromLine, color: 'var(--push-color)' },
  'Pull':        { Icon: Dumbbell,        color: 'var(--pull-color)' },
  'Leg':         { Icon: MoveDown,        color: 'var(--leg-color)' },
  'Body Weight': { Icon: Activity,        color: 'var(--bw-color)' },
  'Others':      { Icon: Zap,             color: 'var(--others-color)' },
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
  const exCount = session.exercises?.length || 0
  const totalVol = session.exercises?.reduce((s, ex) => s + calculateVolume(ex), 0) || 0
  const dur = formatDuration(session.duration)

  return (
    <article className="history-session">
      <div className="history-session-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="history-session-meta">
            {exCount} gerakan{dur && ` · ${dur}`}{totalVol > 0 && ` · ${Math.round(totalVol)} vol`}
          </p>
        </div>
        <button
          type="button"
          className="history-action"
          aria-label={`Perbarui latihan ${session.name || category}`}
          onClick={() => onUpdateProgress(session)}
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="history-action"
          style={{ color: 'var(--danger)' }}
          aria-label={`Hapus sesi ${session.name || category}`}
          onClick={() => {
            if (window.confirm('Hapus sesi latihan ini? Data sesi akan dihapus permanen.')) onDelete(session.id)
          }}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {exCount > 0 ? session.exercises.map(ex => {
        const def = library.find(l => l.id === ex.exerciseId)
        const maxW = getMaxWeight(ex)
        const isOpen = exDetail === ex.exerciseId
        const singleValue = ex.unit === 'BW' || ex.unit === 'SEC'

        return (
          <div className="history-exercise" key={ex.exerciseId}>
            <button
              type="button"
              className="history-exercise-toggle"
              aria-expanded={isOpen}
              onClick={() => setExDetail(isOpen ? null : ex.exerciseId)}
            >
              <span style={{ flex: 1, minWidth: 0 }}>{def?.name || ex.exerciseId}</span>
              <span>{singleValue ? ex.unit : maxW > 0 ? `${maxW} ${ex.unit}` : '—'}</span>
              <span className="history-session-meta">{ex.sets.length} set</span>
              {isOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
            {isOpen && (
              <table className="history-set-table" aria-label={`Set ${def?.name || ex.exerciseId}`}>
                <thead>
                  <tr>
                    <th scope="col">Set</th>
                    <th scope="col">{ex.unit === 'BW' ? 'Reps' : ex.unit === 'SEC' ? 'Detik' : `Berat (${ex.unit || 'KG'})`}</th>
                    {!singleValue && <th scope="col">Reps</th>}
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, index) => (
                    <tr key={set.id || index}>
                      <th scope="row">{index + 1}</th>
                      <td>{set.weight || '—'}</td>
                      {!singleValue && <td>{set.reps || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      }) : <p className="history-session-meta">Detail latihan belum diisi.</p>}
    </article>
  )
}

function DayGroup({ dateKey, sessions, library, onUpdateProgress, onDelete }) {
  const dateStr = new Date(dateKey + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const categoryGroups = new Map()
  sessions.forEach(session => {
    const category = getCategoryFromSession(session, library)
    if (!categoryGroups.has(category)) categoryGroups.set(category, [])
    categoryGroups.get(category).push(session)
  })

  return (
    <section className="history-day" aria-label={dateStr}>
      <header className="history-day-header">
        <h2><time dateTime={dateKey}>{dateStr}</time></h2>
        <span className="history-session-meta">{sessions.length} sesi</span>
      </header>
      {[...categoryGroups].map(([category, categorySessions]) => {
        const meta = CAT_META[category] || CAT_META['Others']
        return (
          <section key={category} aria-label={category}>
            <h3 className="history-category-heading" style={{ color: meta.color }}>
              <meta.Icon size={20} aria-hidden="true" /> {category}
            </h3>
            {categorySessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                library={library}
                onUpdateProgress={onUpdateProgress}
                onDelete={onDelete}
              />
            ))}
          </section>
        )
      })}
    </section>
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
        <div className="history-timeline">
          {grouped.map(([dateKey, sessions]) => (
            <DayGroup
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
          setWorkouts={setWorkouts}
          onClose={() => setUpdateSession(null)}
        />
      )}
    </div>
  )
}
