import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { computeJitphisai } from './criteria'

export const SCORE_COLLECTION = 'student-scores'

function safeIdPart(value) {
  return String(value ?? '').replace(/[/\s]+/g, '-')
}

export function buildScoreDocId({ classId, studentKey, academicYear, term }) {
  return [safeIdPart(classId), safeIdPart(studentKey), safeIdPart(academicYear), safeIdPart(term)].join(
    '_',
  )
}

/** Returns a Map keyed by studentKey with the previously saved doc (or undefined). */
export async function loadScores({ classId, academicYear, term }) {
  const q = query(
    collection(db, SCORE_COLLECTION),
    where('classId', '==', classId),
    where('academicYear', '==', academicYear),
    where('term', '==', term),
  )
  const snap = await getDocs(q)
  const byStudentKey = new Map()
  snap.forEach((d) => byStudentKey.set(d.data().studentKey, { id: d.id, ...d.data() }))
  return byStudentKey
}

/**
 * scoresByStudentKey: { [studentKey]: { [criteriaKey]: 0|1|2|undefined } }
 * students: normalized list from lib/outOf.js
 * existing: Map from loadScores(), used to preserve createdAt on update
 */
export async function saveScores({
  classId,
  department,
  stdClass,
  courseCode,
  courseName,
  term,
  academicYear,
  students,
  scoresByStudentKey,
  existing,
  evaluator,
  selectedCriteria,
}) {
  const batch = writeBatch(db)

  for (const student of students) {
    const scores = scoresByStudentKey[student.key] ?? {}
    const { totalScore, evaluatedCount, jitphisai } = computeJitphisai(scores)
    const docId = buildScoreDocId({ classId, studentKey: student.key, academicYear, term })
    const prior = existing.get(student.key)

    batch.set(
      doc(db, SCORE_COLLECTION, docId),
      {
        classId,
        department,
        stdClass,
        courseCode,
        courseName,
        term,
        academicYear,
        studentKey: student.key,
        studentId: student.id,
        studentNo: student.no,
        studentName: student.fullName,
        scores,
        selectedCriteria,
        totalScore,
        evaluatedCount,
        jitphisai,
        evaluatorNationalId: evaluator.nationalId,
        evaluatorName: evaluator.fullName,
        createdAt: prior?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  await batch.commit()
}

function sessionKey({ classId, courseCode, term, academicYear }) {
  return [classId, courseCode, term, academicYear].join('_')
}

/**
 * Groups this teacher's saved score docs into one summary card per
 * (class, course, term, academic year) combination.
 */
export async function listMySessions(evaluatorNationalId) {
  const q = query(collection(db, SCORE_COLLECTION), where('evaluatorNationalId', '==', evaluatorNationalId))
  const snap = await getDocs(q)

  const sessions = new Map()
  snap.forEach((d) => {
    const data = d.data()
    const key = sessionKey(data)
    const existing = sessions.get(key)
    const evaluated = data.evaluatedCount > 0 ? 1 : 0
    const updatedAtMs = data.updatedAt?.toMillis?.() ?? 0

    if (!existing) {
      sessions.set(key, {
        key,
        classId: data.classId,
        department: data.department,
        stdClass: data.stdClass,
        courseCode: data.courseCode,
        courseName: data.courseName,
        term: data.term,
        academicYear: data.academicYear,
        selectedCriteria: data.selectedCriteria,
        studentCount: 1,
        evaluatedCount: evaluated,
        updatedAtMs,
      })
    } else {
      existing.studentCount += 1
      existing.evaluatedCount += evaluated
      existing.updatedAtMs = Math.max(existing.updatedAtMs, updatedAtMs)
    }
  })

  return [...sessions.values()].sort((a, b) => b.updatedAtMs - a.updatedAtMs)
}

/** Deletes every score doc belonging to one (class, course, term, year) session for this teacher. */
export async function deleteSession({ classId, courseCode, term, academicYear, evaluatorNationalId }) {
  const q = query(
    collection(db, SCORE_COLLECTION),
    where('classId', '==', classId),
    where('courseCode', '==', courseCode),
    where('term', '==', term),
    where('academicYear', '==', academicYear),
    where('evaluatorNationalId', '==', evaluatorNationalId),
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
