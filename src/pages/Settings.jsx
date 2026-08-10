// src/pages/Settings.jsx
import { useState } from 'react'
import { Download, Upload, Trash2, User, Clock, ChevronRight } from 'lucide-react'
import { useSettings, useWorkouts, useExerciseLibrary, useTemplates } from '../hooks/useStorage'

export default function Settings() {
  const { settings, setSettings } = useSettings()
  const { workouts, setWorkouts } = useWorkouts()
  const { library, setLibrary } = useExerciseLibrary()
  const { templates, setTemplates } = useTemplates()
  const [confirmClear, setConfirmClear] = useState(false)
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
        setImportMsg({ type: 'success', text: `✓ Berhasil import ${data.workouts?.length || 0} sesi latihan` })
      } catch {
        setImportMsg({ type: 'error', text: '✗ File tidak valid, gagal import' })
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const handleClearData = () => {
    if (confirmClear) {
      setWorkouts([])
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
    }
  }

  const REST_OPTIONS = [30, 60, 90, 120, 180]

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pengaturan <span style={{ color: 'var(--accent)' }}>⚙️</span></h1>
      </div>

      {/* Profile */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--accent-glow-sm)',
            border: '2px solid var(--border-accent)',
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

      {/* Rest Timer */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(10,132,255,0.12)',
            border: '2px solid rgba(10,132,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={20} color="#0a84ff" />
          </div>
          <div>
            <h2>Rest Timer Default</h2>
            <p className="text-xs text-muted">Durasi istirahat default saat selesai 1 set</p>
          </div>
        </div>
        <div className="unit-toggle" style={{ maxWidth: '100%' }}>
          {REST_OPTIONS.map(s => (
            <button
              key={s}
              className={settings.defaultRestSeconds === s ? 'active' : ''}
              onClick={() => setSettings(st => ({ ...st, defaultRestSeconds: s }))}
            >
              {s >= 60 ? `${s/60}m` : `${s}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="card mb-4">
        <h2 className="mb-4">📦 Kelola Data</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="text-sm text-muted">
            Data tersimpan di browser lokal ({workouts.length} sesi). Export secara berkala sebagai backup.
          </p>

          {importMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: importMsg.type === 'success' ? 'rgba(57,255,20,0.1)' : 'rgba(255,59,48,0.1)',
              border: `1px solid ${importMsg.type === 'success' ? 'rgba(57,255,20,0.3)' : 'rgba(255,59,48,0.3)'}`,
              color: importMsg.type === 'success' ? 'var(--accent)' : '#ff3b30',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
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

      {/* Danger zone */}
      <div className="card" style={{ border: '1px solid rgba(255,59,48,0.2)' }}>
        <h2 className="mb-3" style={{ color: '#ff3b30' }}>⚠️ Danger Zone</h2>
        <p className="text-sm text-muted mb-3">Hapus semua sesi latihan. Tindakan ini tidak bisa dibatalkan.</p>
        <button
          className={`btn btn-full ${confirmClear ? 'btn-danger' : 'btn-ghost'}`}
          onClick={handleClearData}
          style={{ borderColor: 'rgba(255,59,48,0.3)' }}
        >
          <Trash2 size={16} />
          {confirmClear ? '⚠️ Tekan lagi untuk konfirmasi' : 'Hapus Semua Sesi'}
        </button>
      </div>

      {/* About */}
      <div style={{ textAlign: 'center', padding: '32px 0 8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem', marginBottom: 4 }}>GymNote</p>
        <p>v1.0.0 — Progressive Overload Tracker</p>
        <p style={{ marginTop: 4, opacity: 0.5 }}>Data tersimpan di browser lokal</p>
      </div>
    </div>
  )
}
