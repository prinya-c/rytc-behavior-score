import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { teacherProfile, logout } = useAuth()

  return (
    <header className="no-print bg-primary">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-white">
          ระบบประเมินคุณลักษณะอันพึงประสงค์
        </Link>
        {teacherProfile && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/90">{teacherProfile.fullName}</span>
            <button
              onClick={logout}
              className="rounded-md border border-white/30 px-3 py-1.5 text-white hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
