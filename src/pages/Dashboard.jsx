import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDepartments, listStdClasses } from '../lib/outOf'
import { deleteSession, listMySessions } from '../lib/behaviorScore'
import { useAuth } from '../context/AuthContext'

const currentBuddhistYear = new Date().getFullYear() + 543

export default function Dashboard() {
  const navigate = useNavigate()
  const { teacherProfile } = useAuth()

  const [departments, setDepartments] = useState([])
  const [stdClasses, setStdClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [depId, setDepId] = useState('')
  const [classId, setClassId] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [term, setTerm] = useState('1')
  const [academicYear, setAcademicYear] = useState(String(currentBuddhistYear))

  function reloadSessions() {
    return listMySessions(teacherProfile.nationalId).then(setSessions)
  }

  useEffect(() => {
    Promise.all([listDepartments(), listStdClasses(), listMySessions(teacherProfile.nationalId)])
      .then(([deptData, classData, sessionData]) => {
        setDepartments(deptData)
        setStdClasses(classData)
        setSessions(sessionData)
        if (deptData.length > 0) setDepId(deptData[0].depId)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [teacherProfile.nationalId])

  const classesInDepartment = useMemo(
    () => stdClasses.filter((c) => c.depId === depId),
    [stdClasses, depId],
  )

  useEffect(() => {
    if (classesInDepartment.length > 0 && !classesInDepartment.some((c) => c.id === classId)) {
      setClassId(classesInDepartment[0].id)
    }
  }, [classesInDepartment, classId])

  const selectedClass = stdClasses.find((c) => c.id === classId)

  function buildParams(overrides = {}) {
    return new URLSearchParams({
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      term,
      academicYear,
      ...overrides,
    }).toString()
  }

  function goToScoreEntry(e) {
    e.preventDefault()
    if (!classId) return
    navigate(`/score/${classId}?${buildParams()}`)
  }

  function goToReport(e) {
    e.preventDefault()
    if (!classId) return
    navigate(`/report/${classId}?${buildParams()}`)
  }

  function buildSessionParams(session, overrides = {}) {
    return new URLSearchParams({
      courseCode: session.courseCode ?? '',
      courseName: session.courseName ?? '',
      term: session.term ?? '',
      academicYear: session.academicYear ?? '',
      ...overrides,
    }).toString()
  }

  function editSession(session) {
    navigate(`/score/${session.classId}?${buildSessionParams(session)}`)
  }

  function viewSession(session) {
    navigate(`/report/${session.classId}?${buildSessionParams(session)}`)
  }

  function printSession(session) {
    navigate(`/report/${session.classId}?${buildSessionParams(session, { autoPrint: '1' })}`)
  }

  async function removeSession(session) {
    if (
      !window.confirm(
        `ลบข้อมูลคะแนน "${session.courseName}" (${session.stdClass}) ทั้งหมดหรือไม่? การลบนี้ย้อนกลับไม่ได้`,
      )
    ) {
      return
    }
    await deleteSession({
      classId: session.classId,
      courseCode: session.courseCode,
      term: session.term,
      academicYear: session.academicYear,
      evaluatorNationalId: teacherProfile.nationalId,
    })
    reloadSessions()
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-500">กำลังโหลดข้อมูล...</div>
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-red-600">
        โหลดข้อมูลไม่สำเร็จ: {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">บันทึกคะแนนจิตพิสัย</h1>
          <p className="text-slate-500 mt-1">ทั้งหมด {sessions.length} รายการ</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          title="เพิ่มรายการใหม่"
          className="shrink-0 w-11 h-11 rounded-full bg-sky-600 text-white text-2xl leading-none flex items-center justify-center hover:bg-sky-700 shadow-sm"
        >
          +
        </button>
      </div>

      {showForm && (
        <form className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-800">เลือกวิชาและกลุ่มเรียน</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ยกเลิก
            </button>
          </div>
          <p className="text-sm text-slate-500 -mt-3">
            ข้อมูลกลุ่มเรียนและรายชื่อนักเรียนดึงมาจาก collection <code>out-of</code> (อ่านอย่างเดียว)
          </p>

          {stdClasses.length === 0 ? (
            <p className="text-slate-500">ยังไม่มีข้อมูลกลุ่มเรียนใน out-of</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    สาขาวิชา
                  </label>
                  <select
                    value={depId}
                    onChange={(e) => setDepId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {departments.map((d) => (
                      <option key={d.depId} value={d.depId}>
                        {d.depName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    กลุ่มเรียน
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {classesInDepartment.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.classCode} - {c.shortName || c.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    รหัสวิชา
                  </label>
                  <input
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="เช่น 31901-2002"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ชื่อวิชา
                  </label>
                  <input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="เช่น ระบบปฏิบัติการเครื่องแม่ข่าย"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ภาคเรียนที่
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3 (ฤดูร้อน)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              {selectedClass && (
                <p className="text-sm text-slate-500">
                  {selectedClass.className} · อาจารย์ที่ปรึกษา {selectedClass.advisorName || '-'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={goToScoreEntry}
                  className="rounded-lg bg-sky-600 text-white px-4 py-2.5 font-medium hover:bg-sky-700"
                >
                  กรอกคะแนนจิตพิสัย
                </button>
                <button
                  onClick={goToReport}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  ดูรายงานสรุป
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
          <p>ยังไม่มีรายการที่บันทึกไว้</p>
          <p className="text-sm mt-1">กดปุ่ม + ด้านบนเพื่อเริ่มกรอกคะแนนรายการแรก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div
              key={session.key}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800">
                  {session.classId} - {session.stdClass}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => viewSession(session)}
                    title="ดูรายละเอียด"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => printSession(session)}
                    title="พิมพ์"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                  >
                    🖨
                  </button>
                  <button
                    onClick={() => editSession(session)}
                    title="แก้ไข"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => removeSession(session)}
                    title="ลบ"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500">{session.courseCode}</p>
              <p className="text-sm text-slate-700">{session.courseName || '(ไม่ระบุชื่อวิชา)'}</p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  ภาคเรียนที่ {session.term} ปีการศึกษา {session.academicYear}
                </span>
                <span className="font-medium text-slate-700">
                  {session.evaluatedCount}/{session.studentCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
