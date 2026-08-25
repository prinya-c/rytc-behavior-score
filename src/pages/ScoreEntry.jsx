import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getClassDetail } from '../lib/outOf'
import { loadScores, saveScores } from '../lib/behaviorScore'
import { CRITERIA, computeJitphisai } from '../lib/criteria'
import { useAuth } from '../context/AuthContext'

export default function ScoreEntry() {
  const { classId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { teacherProfile } = useAuth()

  const courseCode = params.get('courseCode') ?? ''
  const courseName = params.get('courseName') ?? ''
  const term = params.get('term') ?? ''
  const academicYear = params.get('academicYear') ?? ''

  const [klass, setKlass] = useState(null)
  const [existing, setExisting] = useState(new Map())
  const [scoresByStudentKey, setScoresByStudentKey] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    Promise.all([getClassDetail(classId), loadScores({ classId, academicYear, term })])
      .then(([classData, existingMap]) => {
        if (!classData) {
          setError('ไม่พบกลุ่มเรียนนี้')
          return
        }
        setKlass(classData)
        setExisting(existingMap)
        const initial = {}
        for (const student of classData.students) {
          initial[student.key] = existingMap.get(student.key)?.scores ?? {}
        }
        setScoresByStudentKey(initial)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [classId, academicYear, term])

  function setScore(studentKey, criteriaKey, rawValue) {
    setScoresByStudentKey((prev) => {
      const studentScores = { ...(prev[studentKey] ?? {}) }
      if (rawValue === '') {
        delete studentScores[criteriaKey]
      } else {
        studentScores[criteriaKey] = Number(rawValue)
      }
      return { ...prev, [studentKey]: studentScores }
    })
  }

  const totals = useMemo(() => {
    const map = {}
    for (const key of Object.keys(scoresByStudentKey)) {
      map[key] = computeJitphisai(scoresByStudentKey[key])
    }
    return map
  }, [scoresByStudentKey])

  async function handleSave() {
    if (!klass) return
    setSaving(true)
    setSaveMessage('')
    setError('')
    try {
      await saveScores({
        classId,
        department: klass.depName,
        stdClass: klass.className,
        courseCode,
        courseName,
        term,
        academicYear,
        students: klass.students,
        scoresByStudentKey,
        existing,
        evaluator: teacherProfile,
      })
      setSaveMessage('บันทึกคะแนนเรียบร้อยแล้ว')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-500">กำลังโหลด...</div>
  if (error) return <div className="max-w-6xl mx-auto px-4 py-10 text-red-600">{error}</div>
  if (!klass) return null

  return (
    <div className="max-w-full px-4 py-8">
      <div className="max-w-6xl mx-auto mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            แบบประเมินคุณลักษณะอันพึงประสงค์ (จิตพิสัย)
          </h1>
          <p className="text-slate-500 mt-1">
            {courseCode} {courseName} · ภาคเรียนที่ {term}/{academicYear} · {klass.depName}{' '}
            {klass.className}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/report/${classId}?${params.toString()}`)}
            className="no-print rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            ดูรายงาน
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="no-print rounded-lg bg-sky-600 text-white px-4 py-2 font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <p className="max-w-6xl mx-auto mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          {saveMessage}
        </p>
      )}

      <p className="max-w-6xl mx-auto mb-3 text-xs text-slate-500">
        ระดับ 2 = ปฏิบัติเป็นประจำ, 1 = ปฏิบัติเป็นบางครั้ง, 0 = ไม่เคยปฏิบัติ, ว่าง = ไม่ประเมินรายการนี้
      </p>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left w-10">
                ที่
              </th>
              <th className="sticky left-10 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px]">
                ชื่อ-สกุล
              </th>
              {CRITERIA.map((c) => (
                <th
                  key={c.key}
                  title={c.label}
                  className="border-b border-r border-slate-200 px-2 py-2 text-center align-bottom min-w-[70px] font-normal text-slate-600"
                >
                  {c.short}
                </th>
              ))}
              <th className="border-b border-slate-200 px-2 py-2 text-center min-w-[70px]">รวม</th>
              <th className="border-b border-slate-200 px-2 py-2 text-center min-w-[80px]">
                จิตพิสัย
              </th>
            </tr>
          </thead>
          <tbody>
            {klass.students.map((student) => {
              const studentScores = scoresByStudentKey[student.key] ?? {}
              const { totalScore, jitphisai } = totals[student.key] ?? {
                totalScore: 0,
                jitphisai: 0,
              }
              return (
                <tr key={student.key} className="even:bg-slate-50/50">
                  <td className="sticky left-0 bg-inherit border-b border-r border-slate-200 px-3 py-1.5">
                    {student.no}
                  </td>
                  <td className="sticky left-10 bg-inherit border-b border-r border-slate-200 px-3 py-1.5 whitespace-nowrap">
                    {student.fullName}
                  </td>
                  {CRITERIA.map((c) => (
                    <td key={c.key} className="border-b border-r border-slate-200 px-1 py-1 text-center">
                      <select
                        value={studentScores[c.key] ?? ''}
                        onChange={(e) => setScore(student.key, c.key, e.target.value)}
                        className="w-14 rounded border border-slate-200 py-1 text-center bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">-</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </td>
                  ))}
                  <td className="border-b border-slate-200 px-2 py-1.5 text-center font-medium">
                    {totalScore}
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1.5 text-center font-semibold text-sky-700">
                    {jitphisai}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
