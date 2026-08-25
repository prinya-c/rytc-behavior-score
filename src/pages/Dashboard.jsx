import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDepartments, listStdClasses } from '../lib/outOf'

const currentBuddhistYear = new Date().getFullYear() + 543

export default function Dashboard() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [stdClasses, setStdClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [depId, setDepId] = useState('')
  const [classId, setClassId] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [term, setTerm] = useState('1')
  const [academicYear, setAcademicYear] = useState(String(currentBuddhistYear))

  useEffect(() => {
    Promise.all([listDepartments(), listStdClasses()])
      .then(([deptData, classData]) => {
        setDepartments(deptData)
        setStdClasses(classData)
        if (deptData.length > 0) setDepId(deptData[0].depId)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  function buildParams() {
    return new URLSearchParams({
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      term,
      academicYear,
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">เลือกวิชาและกลุ่มเรียน</h1>
      <p className="text-slate-500 mb-6">
        ข้อมูลกลุ่มเรียนและรายชื่อนักเรียนดึงมาจาก collection <code>out-of</code> (อ่านอย่างเดียว)
      </p>

      {stdClasses.length === 0 ? (
        <p className="text-slate-500">ยังไม่มีข้อมูลกลุ่มเรียนใน out-of</p>
      ) : (
        <form className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สาขาวิชา</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">กลุ่มเรียน</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสวิชา</label>
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="เช่น 31901-2002"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อวิชา</label>
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
        </form>
      )}
    </div>
  )
}
