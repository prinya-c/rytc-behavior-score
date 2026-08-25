import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getClassDetail } from '../lib/outOf'
import { loadScores } from '../lib/behaviorScore'
import { CRITERIA, MAX_SCORE_PER_ITEM } from '../lib/criteria'

function RotatedHeader({ children }) {
  return (
    <div className="h-[150px] flex items-end justify-center pb-1">
      <span className="rotated-header text-[9px] leading-none">{children}</span>
    </div>
  )
}

/** จิตพิสัย column header: rendered as a fraction (numerator/denominator), each line rotated. */
function RotatedFractionHeader({ numerator, denominator }) {
  return (
    <div className="h-[150px] flex items-end justify-center gap-1 pb-1">
      <span className="rotated-header text-[9px] leading-none">{numerator}</span>
      <span className="rotated-header text-[9px] leading-none">{denominator}</span>
    </div>
  )
}

const ROWS_PER_PAGE = 30

function PrintPage({ rows, existing, courseCode, courseName, term, academicYear, klass }) {
  return (
    <div className="print-page">
      <div className="text-center mb-2">
        <p className="font-semibold text-sm">วิทยาลัยเทคนิคระยอง สถาบันการอาชีวศึกษาภาคตะวันออก</p>
        <p className="font-semibold text-sm">
          แบบสรุปผลการประเมินด้านคุณธรรม จริยธรรม ค่านิยมและคุณลักษณะอันพึงประสงค์(จิตพิสัย)
        </p>
      </div>

      <table className="w-full border-collapse text-[8px] table-fixed">
        <colgroup>
          <col className="w-6" />
          <col className="w-[150px]" />
          {CRITERIA.map((c) => (
            <col key={c.key} className="w-[26px]" />
          ))}
          <col className="w-[26px]" />
          <col className="w-[52px]" />
        </colgroup>
        <thead>
          <tr>
            <th
              colSpan={2}
              rowSpan={2}
              className="border border-black px-1.5 py-1 text-left align-top font-normal leading-relaxed"
            >
              <p>รหัสวิชา {courseCode}</p>
              <p>ชื่อวิชา {courseName}</p>
              <p>
                ภาคเรียนที่ {term} ปีการศึกษา {academicYear}
              </p>
              <p>แผนกวิชา {klass.depName}</p>
              <p>อาจารย์ที่ปรึกษา {klass.advisorName || '-'}</p>
            </th>
            <th colSpan={CRITERIA.length} className="border border-black px-1 py-1 font-normal">
              รายการประเมิน
            </th>
            <th rowSpan={2} className="border border-black p-0 align-bottom overflow-hidden w-[26px]">
              <RotatedHeader>คะแนน</RotatedHeader>
            </th>
            <th rowSpan={2} className="border border-black p-0 align-bottom overflow-hidden w-[52px]">
              <RotatedFractionHeader
                numerator="จิตพิสัย = คะแนนรวม x 10"
                denominator="จำนวนรายงานที่ประเมิน"
              />
            </th>
          </tr>
          <tr>
            {CRITERIA.map((c) => (
              <th
                key={c.key}
                className="border border-black p-0 align-bottom overflow-hidden w-[26px]"
              >
                <RotatedHeader>{c.label}</RotatedHeader>
              </th>
            ))}
          </tr>
          <tr>
            <th className="border border-black px-1 py-0.5 w-6">ที่</th>
            <th className="border border-black px-1 py-0.5 text-left w-[150px]">ชื่อ - สกุล</th>
            {CRITERIA.map((c) => (
              <th key={c.key} className="border border-black px-1 py-0.5 font-normal w-[26px]">
                {MAX_SCORE_PER_ITEM}
              </th>
            ))}
            <th className="border border-black px-1 py-0.5 font-normal">
              {MAX_SCORE_PER_ITEM * CRITERIA.length}
            </th>
            <th className="border border-black px-1 py-0.5 font-normal">
              {MAX_SCORE_PER_ITEM * 10}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((student, i) => {
            const record = student ? existing.get(student.key) : null
            const scores = record?.scores ?? {}
            return (
              <tr key={student?.key ?? `blank-${i}`} style={{ height: '5.5mm' }}>
                <td className="border border-black px-1 py-0.5 text-center">
                  {student?.no ?? ''}
                </td>
                <td className="border border-black px-1 py-0.5 whitespace-nowrap overflow-hidden">
                  {student?.fullName ?? ''}
                </td>
                {CRITERIA.map((c) => (
                  <td key={c.key} className="border border-black px-1 py-0.5 text-center">
                    {scores[c.key] ?? ''}
                  </td>
                ))}
                <td className="border border-black px-1 py-0.5 text-center">
                  {record?.totalScore ?? ''}
                </td>
                <td className="border border-black px-1 py-0.5 text-center">
                  {record?.jitphisai ?? ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-between items-start mt-4 text-xs">
        <div className="space-y-0.5">
          <p>ระดับ 2 หมายถึง ปฏิบัติเป็นประจำ</p>
          <p>ระดับ 1 หมายถึง ปฏิบัติเป็นบางครั้ง</p>
          <p>ระดับ 0 หมายถึง ไม่เคยปฏิบัติ</p>
          <p className="mt-1">คะแนนจิตพิสัย = คะแนนรวม x 10/จำนวนรายการที่ประเมิน</p>
        </div>
        <div className="flex gap-16 mt-4">
          <div className="text-center">
            <p>ลงชื่อ.....................................................</p>
            <p className="mt-1">อาจารย์ประจำวิชา</p>
          </div>
          <div className="text-center">
            <p>ลงชื่อ.....................................................</p>
            <p className="mt-1">หัวหน้าแผนกวิชา</p>
          </div>
        </div>
      </div>

      <p className="text-[9px] mt-4">
        หมายเหตุ แบบสรุปผลการประเมินจิตพิสัยนี้ให้แนบมากับแบบบันทึกเวลาเรียนและประเมินผลการเรียนส่งงานวัดผล
        ฯ เมื่อสิ้นภาคเรียน
      </p>
    </div>
  )
}

export default function Report() {
  const { classId } = useParams()
  const [params] = useSearchParams()

  const courseCode = params.get('courseCode') ?? ''
  const courseName = params.get('courseName') ?? ''
  const term = params.get('term') ?? ''
  const academicYear = params.get('academicYear') ?? ''
  const autoPrint = params.get('autoPrint') === '1'

  const [klass, setKlass] = useState(null)
  const [existing, setExisting] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getClassDetail(classId), loadScores({ classId, academicYear, term })])
      .then(([classData, existingMap]) => {
        if (!classData) {
          setError('ไม่พบกลุ่มเรียนนี้')
          return
        }
        setKlass(classData)
        setExisting(existingMap)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [classId, academicYear, term])

  useEffect(() => {
    if (!autoPrint || loading || error || !klass) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [autoPrint, loading, error, klass])

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-slate-500">กำลังโหลด...</div>
  if (error) return <div className="max-w-6xl mx-auto px-4 py-10 text-danger">{error}</div>
  if (!klass) return null

  const pageCount = Math.max(1, Math.ceil(klass.students.length / ROWS_PER_PAGE))
  const printPages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const start = pageIndex * ROWS_PER_PAGE
    const pageStudents = klass.students.slice(start, start + ROWS_PER_PAGE)
    return Array.from({ length: ROWS_PER_PAGE }, (_, i) => pageStudents[i] ?? null)
  })

  return (
    <div className="max-w-full px-4 py-8">
      <div className="no-print max-w-6xl mx-auto mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            แบบสรุปผลการประเมินด้านคุณธรรม จริยธรรม ค่านิยมและคุณลักษณะอันพึงประสงค์ (จิตพิสัย)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            รหัสวิชา {courseCode} · {courseName} · ภาคเรียนที่ {term} ปีการศึกษา {academicYear} ·{' '}
            {klass.depName} {klass.className}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Link
            to="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {/* On-screen view: compact, horizontally scrollable */}
      <div className="print:hidden overflow-x-auto border border-slate-200 rounded-2xl bg-white">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-r border-slate-200 px-3 py-2 w-10">ที่</th>
              <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px]">
                ชื่อ-สกุล
              </th>
              {CRITERIA.map((c) => (
                <th
                  key={c.key}
                  title={c.label}
                  className="border-b border-r border-slate-200 px-2 py-2 min-w-[70px] font-normal text-slate-600"
                >
                  {c.short}
                </th>
              ))}
              <th className="border-b border-slate-200 px-2 py-2 min-w-[70px]">รวม</th>
              <th className="border-b border-slate-200 px-2 py-2 min-w-[80px]">จิตพิสัย</th>
            </tr>
          </thead>
          <tbody>
            {klass.students.map((student) => {
              const record = existing.get(student.key)
              const scores = record?.scores ?? {}
              return (
                <tr key={student.key} className="even:bg-slate-50/50">
                  <td className="border-b border-r border-slate-200 px-3 py-1.5 text-center">
                    {student.no}
                  </td>
                  <td className="border-b border-r border-slate-200 px-3 py-1.5 whitespace-nowrap">
                    {student.fullName}
                  </td>
                  {CRITERIA.map((c) => (
                    <td
                      key={c.key}
                      className="border-b border-r border-slate-200 px-2 py-1.5 text-center"
                    >
                      {scores[c.key] ?? '-'}
                    </td>
                  ))}
                  <td className="border-b border-slate-200 px-2 py-1.5 text-center font-medium">
                    {record?.totalScore ?? '-'}
                  </td>
                  <td className="border-b border-slate-200 px-2 py-1.5 text-center font-semibold text-secondary">
                    {record?.jitphisai ?? '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="print:hidden max-w-6xl mx-auto mt-4 text-xs text-slate-500">
        ระดับ 2 หมายถึง ปฏิบัติเป็นประจำ · ระดับ 1 หมายถึง ปฏิบัติเป็นบางครั้ง · ระดับ 0 หมายถึง
        ไม่เคยปฏิบัติ · จิตพิสัย = คะแนนรวม × 10 ÷ จำนวนรายการที่ประเมิน
      </p>

      {/* Print view: paginated to match the college's official จิตพิสัย form, 30 rows/page */}
      <div className="hidden print:block text-black">
        {printPages.map((rows, pageIndex) => (
          <PrintPage
            key={pageIndex}
            rows={rows}
            existing={existing}
            courseCode={courseCode}
            courseName={courseName}
            term={term}
            academicYear={academicYear}
            klass={klass}
          />
        ))}
      </div>
    </div>
  )
}
