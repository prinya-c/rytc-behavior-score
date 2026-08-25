import { collectionGroup, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// `out-of` is a single document with subcollections: department, std_class,
// students, teachers (confirmed from the live Firestore console — not a
// flat collection of per-class documents as first assumed). We don't know
// that document's ID, so we read via collectionGroup() instead, which finds
// a subcollection by name regardless of its parent path. All reads here are
// unfiltered (no where/orderBy) so no collection-group index is required.

let cache = null // { departments, stdClasses, students } — page-session only

async function loadAll() {
  if (cache) return cache

  const [deptSnap, classSnap, studentSnap] = await Promise.all([
    getDocs(collectionGroup(db, 'department')),
    getDocs(collectionGroup(db, 'std_class')),
    getDocs(collectionGroup(db, 'students')),
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

  const students = studentSnap.docs.map((d) => {
    const data = d.data()
    return {
      key: data.sid ?? d.id,
      id: data.sid ?? d.id,
      fullName: data.sname ?? '',
      sidcard: data.sidcard ?? '',
      classCode: data.class_code,
    }
  })

  cache = { departments, stdClasses, students }
  return cache
}

export async function listDepartments() {
  return (await loadAll()).departments
}

export async function listStdClasses() {
  return (await loadAll()).stdClasses
}

/** Full detail for one std_class doc (by its Firestore document id), with its student roster. */
export async function getClassDetail(classId) {
  const { stdClasses, students } = await loadAll()
  const klass = stdClasses.find((c) => c.id === classId)
  if (!klass) return null

  const roster = students
    .filter((s) => String(s.classCode) === String(klass.classCode))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((s, i) => ({ ...s, no: i + 1 }))

  return { ...klass, students: roster }
}
