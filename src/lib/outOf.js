import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { outOfDb } from './firebase'

// `out-of` is a separate named Firestore database (not a collection) holding
// the school's existing data as root collections: department, std_class,
// students, teachers. This app only ever reads from it — never writes.

let listCache = null // { departments, stdClasses } — small, rarely-changing, session-cached

async function loadLists() {
  if (listCache) return listCache

  const [deptSnap, classSnap] = await Promise.all([
    getDocs(collection(outOfDb, 'department')),
    getDocs(collection(outOfDb, 'std_class')),
  ])

  const departments = deptSnap.docs.map((d) => {
    const data = d.data()
    return { id: d.id, depId: data.dep_id ?? d.id, depName: data.dep_name ?? '' }
  })

  const stdClasses = classSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      classCode: data.class_code ?? d.id,
      className: data.class_name ?? '',
      shortName: data.short_name ?? '',
      depId: data.dep_id ?? '',
      depName: data.dep_name ?? '',
      advisorName: data.advisor_name ?? '',
    }
  })

  listCache = { departments, stdClasses }
  return listCache
}

export async function listDepartments() {
  return (await loadLists()).departments
}

export async function listStdClasses() {
  return (await loadLists()).stdClasses
}

/** Full detail for one std_class doc (by its Firestore document id), with its student roster. */
export async function getClassDetail(classId) {
  const { stdClasses } = await loadLists()
  const klass = stdClasses.find((c) => c.id === classId)
  if (!klass) return null

  const snap = await getDocs(
    query(collection(outOfDb, 'students'), where('class_code', '==', klass.classCode)),
  )
  const students = snap.docs
    .map((d) => {
      const data = d.data()
      return {
        key: data.sid ?? d.id,
        id: data.sid ?? d.id,
        fullName: data.sname ?? '',
        sidcard: data.sidcard ?? '',
      }
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((s, i) => ({ ...s, no: i + 1 }))

  return { ...klass, students }
}

/** Looks up a teacher's official record by national ID (out-of/teachers doc id = tidcard). */
export async function findTeacherByNationalId(nationalId) {
  const snap = await getDoc(doc(outOfDb, 'teachers', nationalId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    tidcard: data.tidcard ?? snap.id,
    fullName: data.tname ?? '',
    depId: data.dep_id ?? '',
    depName: data.dep_name ?? '',
    position: data.position ?? '',
  }
}
