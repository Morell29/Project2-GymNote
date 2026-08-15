// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/workout" element={<WorkoutLogger />} />
          <Route path="/history" element={<Navigate to="/workout" replace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}
