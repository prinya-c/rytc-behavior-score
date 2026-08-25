import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ScoreEntry from './pages/ScoreEntry'
import Report from './pages/Report'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/score/:classId"
              element={
                <PrivateRoute>
                  <ScoreEntry />
                </PrivateRoute>
              }
            />
            <Route
              path="/report/:classId"
              element={
                <PrivateRoute>
                  <Report />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  )
}
