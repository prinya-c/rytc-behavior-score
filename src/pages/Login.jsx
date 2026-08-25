import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_VERSION } from '../lib/version'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ nationalId, password })
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-secondary flex-col items-center justify-center p-10 text-white text-center">
        <h2 className="text-3xl font-bold">วิทยาลัยเทคนิคระยอง</h2>
        <p className="mt-3 text-white/90 whitespace-nowrap">
          ระบบประเมินคุณลักษณะอันพึงประสงค์ (จิตพิสัย) สำหรับอาจารย์
        </p>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-slate-800 text-center">
            เข้าสู่ระบบอาจารย์
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">
            ระบบประเมินคุณลักษณะอันพึงประสงค์
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เลขบัตรประชาชน
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={13}
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="13 หลัก"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary text-white py-2.5 font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              ลงทะเบียน
            </Link>
          </p>
          <p className="text-xs text-slate-400 text-center mt-4">v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  )
}
