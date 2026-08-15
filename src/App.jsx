import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import Settings from './pages/Settings'
import { useSettings } from './hooks/useStorage'

function AppShell() {
  const { settings } = useSettings()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/"        element={<Dashboard />} />
        <Route path="/workout" element={<WorkoutLogger />} />
        <Route path="/history" element={<Navigate to="/workout" replace />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <NavBar />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
