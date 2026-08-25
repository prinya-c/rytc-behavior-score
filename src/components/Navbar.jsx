import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { teacherProfile, logout } = useAuth()

  return (
    <header className="no-print bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-primary">
          ระบบประเมินคุณลักษณะอันพึงประสงค์
        </Link>
        {teacherProfile && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{teacherProfile.fullName}</span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
