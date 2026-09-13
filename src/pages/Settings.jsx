import { useState } from 'react'
import { Download, Upload, Trash2, User, Sun, Moon, Settings2, Package, AlertTriangle, CheckCircle, XCircle, Flame, Calendar, Trophy } from 'lucide-react'
import { useSettings, useWorkouts, useExerciseLibrary, useTemplates } from '../hooks/useStorage'
import { getMaxWeight, getMaxReps, calculateStreak } from '../utils/workoutUtils'

export default function Settings() {
  const { settings, setSettings } = useSettings()
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary } = useExerciseLibrary()
  const { templates, setTemplates } = useTemplates()
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [importMsg, setImportMsg] = useState(null)

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts,
      library,
      templates,
      settings,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `GymNote-backup-${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.workouts) setWorkouts(data.workouts)
        if (data.library) setLibrary(data.library)
        if (data.templates) setTemplates(data.templates)
        if (data.settings) setSettings(data.settings)
        setImportMsg({ type: 'success', text: `Berhasil import ${data.workouts?.length || 0} sesi latihan` })
      } catch {
        setImportMsg({ type: 'error', text: 'File tidak valid, gagal import' })
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const handleClearData = () => {
    if (confirmClear && confirmText === 'Ya') {
      setWorkouts([])
      setConfirmClear(false)
      setConfirmText('')
    } else if (!confirmClear) {
      setConfirmClear(true)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontSize: '26px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>Pengaturan <Settings2 size={22} color="var(--accent)" /></h1>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--accent-glow-sm)',
            border: '1px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={20} color="var(--accent)" />
          </div>
          <h2>Profil</h2>
        </div>
        <div className="input-group">
          <label className="input-label">Nama</label>
          <input
            className="input"
            value={settings.username}
            onChange={e => setSettings(s => ({ ...s, username: e.target.value }))}
            placeholder="Nama kamu..."
          />
        </div>
      </div>

      <div className="greeting-card" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 300, color: 'var(--text-on-dark)', letterSpacing: '-0.104px', marginBottom: 18 }}>
          {settings.username}
        </h1>
        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{calculateStreak(workouts)}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={11} color="#f97316" /> Streak</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{workouts.length}</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Sesi</div>
          </div>
          {(() => {
            const lastSession = workouts.length
              ? [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
              : null
            const prCount = lastSession?.exercises?.filter(ex => {
              const prev = workouts
                .filter(w => w.id !== lastSession.id && w.exercises.some(e => e.exerciseId === ex.exerciseId))
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                ?.exercises.find(e => e.exerciseId === ex.exerciseId)
              if (!prev) return false
              if (getMaxWeight(ex) > getMaxWeight(prev)) return true
              if (getMaxWeight(ex) === getMaxWeight(prev) && getMaxReps(ex) > getMaxReps(prev)) return true
              return false
            }).length || 0
            return prCount > 0 ? (
              <div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)', lineHeight: 1 }}>{prCount}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-on-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={11} /> PR Baru</div>
              </div>
            ) : null
          })()}
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: settings.darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(217, 119, 6, 0.08)',
              border: `1px solid ${settings.darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {settings.darkMode ? <Moon size={20} color="#8b5cf6" /> : <Sun size={20} color="#d97706" />}
            </div>
            <div>
              <h2>Tampilan</h2>
              <p className="text-xs text-muted">{settings.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.darkMode || false}
              onChange={() => {
                const next = !settings.darkMode
                setSettings(s => ({ ...s, darkMode: next }))
                document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
              }}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} /> Kelola Data</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="text-sm text-muted">
            Data tersimpan di browser lokal ({workouts.length} sesi). Export secara berkala sebagai backup.
          </p>

          {importMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 6,
              background: importMsg.type === 'success' ? 'rgba(45,157,74,0.06)' : 'rgba(223,28,47,0.06)',
              border: `1px solid ${importMsg.type === 'success' ? 'rgba(45,157,74,0.2)' : 'rgba(223,28,47,0.2)'}`,
              color: importMsg.type === 'success' ? '#2d9d4a' : 'var(--accent)',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {importMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {importMsg.text}
            </div>
          )}

          <button className="btn btn-ghost btn-full" onClick={handleExport}>
            <Download size={17} /> Export Backup (JSON)
          </button>

          <label className="btn btn-ghost btn-full" style={{ cursor: 'pointer' }}>
            <Upload size={17} /> Import Backup (JSON)
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border-accent)' }}>
        <h2 className="mb-3" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} /> Danger Zone</h2>
        <p className="text-sm text-muted mb-3">Hapus semua sesi latihan. Tindakan ini tidak bisa dibatalkan.</p>
        {confirmClear && (
          <div style={{ marginBottom: 10 }}>
            <label className="text-sm" style={{ display: 'block', marginBottom: 6 }}>
              Ketik <strong>Ya</strong> untuk konfirmasi penghapusan:
            </label>
            <input
              className="input"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Ketik Ya"
              autoFocus
            />
          </div>
        )}
        <button
          className={`btn btn-full ${confirmClear ? 'btn-danger' : 'btn-ghost'}`}
          onClick={handleClearData}
          disabled={confirmClear && confirmText !== 'Ya'}
          style={{ borderColor: 'var(--border-accent)' }}
        >
          <Trash2 size={16} />
          {confirmClear ? 'Konfirmasi Hapus' : 'Hapus Semua Sesi'}
        </button>
        {confirmClear && (
          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 8 }}
            onClick={() => { setConfirmClear(false); setConfirmText('') }}
          >
            Batal
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0 8px', color: 'var(--text-muted)', fontSize: '12px' }}>
        <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '16px', marginBottom: 4 }}>GymNote</p>
        <p>v1.0.0 — Progressive Overload Tracker</p>
        <p style={{ marginTop: 4, opacity: 0.5 }}>Data tersimpan di browser lokal</p>
      </div>
    </div>
  )
}
