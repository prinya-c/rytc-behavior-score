import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, lookupTeacher } = useAuth()
  const navigate = useNavigate()
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [lookupState, setLookupState] = useState('idle') // idle | loading | found | not-found
  const [teacherName, setTeacherName] = useState('')

  useEffect(() => {
    if (!/^\d{13}$/.test(nationalId)) {
      setLookupState('idle')
      setTeacherName('')
      return
    }

    let cancelled = false
    setLookupState('loading')
    lookupTeacher(nationalId).then((teacher) => {
      if (cancelled) return
      if (teacher) {
        setTeacherName(teacher.fullName)
        setLookupState('found')
      } else {
        setTeacherName('')
        setLookupState('not-found')
      }
    })
    return () => {
      cancelled = true
    }
  }, [nationalId, lookupTeacher])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (lookupState !== 'found') {
      setError('กรุณากรอกเลขบัตรประชาชนที่มีข้อมูลอาจารย์อยู่ในระบบ')
      return
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setSubmitting(true)
    try {
      await register({ nationalId, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-800 text-center">ลงทะเบียนอาจารย์</h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">
          ใช้เลขบัตรประชาชนเป็นชื่อผู้ใช้งาน ระบบจะค้นหาชื่อ-สกุลให้อัตโนมัติ
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="13 หลัก"
            />
            {lookupState === 'loading' && (
              <p className="text-xs text-slate-400 mt-1">กำลังค้นหาข้อมูล...</p>
            )}
            {lookupState === 'found' && (
              <p className="text-sm text-emerald-700 mt-1">ชื่อ-สกุล: {teacherName}</p>
            )}
            {lookupState === 'not-found' && (
              <p className="text-sm text-red-600 mt-1">
                ไม่พบข้อมูลอาจารย์ตามเลขบัตรนี้ กรุณาติดต่อผู้ดูแลระบบ
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || lookupState !== 'found'}
            className="w-full rounded-lg bg-sky-600 text-white py-2.5 font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-sky-600 font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}
