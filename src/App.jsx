import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import History from './pages/History'
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
        <Route path="/history" element={<History />} />
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
