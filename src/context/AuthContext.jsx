import { createContext, useContext, useEffect, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { hashPassword, verifyPassword } from '../lib/passwordHash'

const TEACHERS_COLLECTION = 'teacher-accounts'
const SESSION_STORAGE_KEY = 'rytc-behavior-score:session'
const NATIONAL_ID_RE = /^\d{13}$/

const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [teacherProfile, setTeacherProfile] = useState(() => readStoredSession())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (teacherProfile) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(teacherProfile))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [teacherProfile])

  async function register({ nationalId, fullName, password }) {
    const id = nationalId.trim()
    if (!NATIONAL_ID_RE.test(id)) {
      throw new Error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก')
    }
    if (!fullName.trim()) {
      throw new Error('กรุณากรอกชื่อ-สกุล')
    }
    if (password.length < 6) {
      throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    }

    setLoading(true)
    try {
      const ref = doc(db, TEACHERS_COLLECTION, id)
      const existing = await getDoc(ref)
      if (existing.exists()) {
        throw new Error('เลขบัตรประชาชนนี้ลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบแทน')
      }

      const passwordHash = await hashPassword(password)
      await setDoc(ref, {
        nationalId: id,
        fullName: fullName.trim(),
        passwordHash,
        createdAt: serverTimestamp(),
      })

      const profile = { nationalId: id, fullName: fullName.trim() }
      setTeacherProfile(profile)
      return profile
    } finally {
      setLoading(false)
    }
  }

  async function login({ nationalId, password }) {
    const id = nationalId.trim()
    if (!NATIONAL_ID_RE.test(id)) {
      throw new Error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก')
    }

    setLoading(true)
    try {
      const snap = await getDoc(doc(db, TEACHERS_COLLECTION, id))
      if (!snap.exists()) {
        throw new Error('ไม่พบบัญชีนี้ กรุณาลงทะเบียนก่อน')
      }
      const data = snap.data()
      const ok = await verifyPassword(password, data.passwordHash)
      if (!ok) {
        throw new Error('เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง')
      }

      const profile = { nationalId: id, fullName: data.fullName }
      setTeacherProfile(profile)
      return profile
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setTeacherProfile(null)
  }

  const value = {
    user: teacherProfile,
    teacherProfile,
    loading,
    register,
    login,
    logout,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
