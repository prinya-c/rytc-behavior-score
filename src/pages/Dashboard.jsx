import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDepartments, listStdClasses } from '../lib/outOf'
import { deleteSession, listMySessions } from '../lib/behaviorScore'
import { CRITERIA } from '../lib/criteria'
import { useAuth } from '../context/AuthContext'

const ALL_CRITERIA_KEYS = CRITERIA.map((c) => c.key)

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
  const [selectedCriteria, setSelectedCriteria] = useState(ALL_CRITERIA_KEYS)

  function toggleCriterion(key) {
    setSelectedCriteria((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

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
      criteria: selectedCriteria.join(','),
      ...overrides,
    }).toString()
  }

  function goToScoreEntry(e) {
    e.preventDefault()
    if (!classId || selectedCriteria.length === 0) return
    navigate(`/score/${classId}?${buildParams()}`)
  }

  function buildSessionParams(session, overrides = {}) {
    return new URLSearchParams({
      courseCode: session.courseCode ?? '',
      courseName: session.courseName ?? '',
      term: session.term ?? '',
      academicYear: session.academicYear ?? '',
      criteria: (session.selectedCriteria?.length ? session.selectedCriteria : ALL_CRITERIA_KEYS).join(
        ',',
      ),
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
      <div className="max-w-3xl mx-auto px-4 py-10 text-danger">
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
          className="shrink-0 w-11 h-11 rounded-full bg-primary text-white text-2xl leading-none flex items-center justify-center hover:bg-primary-hover shadow-sm"
        >
          +
        </button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowForm(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xl"
          >
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  รายการประเมิน ({selectedCriteria.length}/{CRITERIA.length})
                </label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {CRITERIA.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedCriteria.includes(c.key)}
                        onChange={() => toggleCriterion(c.key)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={goToScoreEntry}
                  disabled={selectedCriteria.length === 0}
                  className="rounded-lg bg-primary text-white px-4 py-2.5 font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  กรอกคะแนนจิตพิสัย
                </button>
              </div>
            </>
          )}
          </form>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
          <p>ยังไม่มีรายการที่บันทึกไว้</p>
          <p className="text-sm mt-1">กดปุ่ม + ด้านบนเพื่อเริ่มกรอกคะแนนรายการแรก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sessions.map((session, index) => (
            <div
              key={session.key}
              className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${
                index % 2 === 0 ? 'border-l-primary' : 'border-l-secondary'
              } p-4 flex flex-col gap-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800">
                  {session.classId} - {session.stdClass}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => viewSession(session)}
                    title="ดูรายละเอียด"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-info/10 text-info hover:bg-info/20"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => printSession(session)}
                    title="พิมพ์"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-secondary/10 text-secondary hover:bg-secondary/20"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.127-.153V2.75zm8.5 3.397a41.533 41.533 0 00-7 0V2.75a.25.25 0 01.25-.25h6.5a.25.25 0 01.25.25v3.397zM6 15l-.317 2.066a.25.25 0 00.247.284h8.14a.25.25 0 00.247-.284L14 15H6zm-.5-6.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => editSession(session)}
                    title="แก้ไข"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-warning/10 text-warning hover:bg-warning/20"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
                      <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeSession(session)}
                    title="ลบ"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-danger/10 text-danger hover:bg-danger/20"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.808a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482 41.03 41.03 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500">{session.courseCode}</p>
              <p className="text-sm text-slate-700">{session.courseName || '(ไม่ระบุชื่อวิชา)'}</p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  ภาคเรียนที่ {session.term} ปีการศึกษา {session.academicYear}
                </span>
                <span className="font-medium text-secondary bg-secondary/10 rounded-full px-2 py-0.5">
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
