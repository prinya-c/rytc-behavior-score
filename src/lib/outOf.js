import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const OUT_OF_COLLECTION = 'out-of'

// The exact key names inside each student/teacher record weren't confirmed
// when this was built, so we probe a handful of common variants instead of
// hard-coding one. If your real data uses different keys, add them to these
// lists — everything else in the app reads from the normalized shape below.
const NAME_KEYS = ['fullName', 'full_name', 'name', 'ชื่อ-สกุล', 'ชื่อสกุล', 'studentName']
const FIRST_NAME_KEYS = ['firstName', 'first_name', 'ชื่อ']
const LAST_NAME_KEYS = ['lastName', 'last_name', 'สกุล', 'นามสกุล']
const PREFIX_KEYS = ['prefix', 'title', 'คำนำหน้า']
const ID_KEYS = ['studentId', 'student_id', 'id', 'code', 'รหัสนักเรียน', 'รหัสประจำตัว']
const NO_KEYS = ['no', 'order', 'seq', 'ที่']

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
  }
  return undefined
}

function toEntries(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((v, i) => [String(i), v])
  if (typeof raw === 'object') return Object.entries(raw)
  return []
}

function normalizePerson(key, raw, index) {
  const prefix = pick(raw, PREFIX_KEYS) ?? ''
  const first = pick(raw, FIRST_NAME_KEYS)
  const last = pick(raw, LAST_NAME_KEYS)
  const combinedName = [prefix, first, last].filter(Boolean).join(' ').trim()
  const fullName = pick(raw, NAME_KEYS) ?? combinedName ?? `(ไม่พบชื่อ: ${key})`

  return {
    key,
    id: pick(raw, ID_KEYS) ?? key,
    no: pick(raw, NO_KEYS) ?? index + 1,
    fullName,
    raw,
  }
}

export function normalizeStudents(rawStudents) {
  return toEntries(rawStudents)
    .map(([key, raw], i) => normalizePerson(key, raw, i))
    .sort((a, b) => Number(a.no) - Number(b.no) || a.fullName.localeCompare(b.fullName, 'th'))
}

export function normalizeTeachers(rawTeachers) {
  return toEntries(rawTeachers).map(([key, raw], i) => normalizePerson(key, raw, i))
}

/** One document in `out-of` = one department + กลุ่มเรียน (class section). */
export async function listOutOfClasses() {
  const snap = await getDocs(collection(db, OUT_OF_COLLECTION))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      department: data.department ?? '',
      stdClass: data.std_class ?? '',
      students: normalizeStudents(data.students),
      teachers: normalizeTeachers(data.teachers),
    }
  })
}

export async function getOutOfClass(classId) {
  const snap = await getDoc(doc(db, OUT_OF_COLLECTION, classId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    department: data.department ?? '',
    stdClass: data.std_class ?? '',
    students: normalizeStudents(data.students),
    teachers: normalizeTeachers(data.teachers),
  }
}
