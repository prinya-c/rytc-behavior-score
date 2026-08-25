# ระบบประเมินคุณลักษณะอันพึงประสงค์ (จิตพิสัย)

แอปสำหรับอาจารย์วิทยาลัยเทคนิคระยองใช้กรอกและสรุปคะแนนแบบประเมินด้านคุณธรรม
จริยธรรม ค่านิยมและคุณลักษณะอันพึงประสงค์ (จิตพิสัย) ตามฟอร์มมาตรฐานของวิทยาลัย
สร้างด้วย Vite + React + Tailwind CSS และเก็บข้อมูลใน Firebase Firestore

## การทำงานของแอป

1. อาจารย์ลงทะเบียน/เข้าสู่ระบบด้วย **เลขบัตรประชาชน + รหัสผ่านที่ตั้งเอง**
2. เลือกสาขาวิชา/กลุ่มเรียน (ดึงรายชื่อนักเรียนจาก collection `out-of` — **อ่านอย่างเดียว
   แอปนี้จะไม่เขียนข้อมูลกลับไปที่ collection นี้เด็ดขาด**)
3. กรอกคะแนนแต่ละเกณฑ์ (16 รายการตามฟอร์ม, ให้คะแนน 0/1/2 หรือเว้นว่างถ้าไม่ประเมินรายการนั้น)
4. ระบบคำนวณ คะแนนรวม และ **จิตพิสัย = คะแนนรวม × 10 ÷ จำนวนรายการที่ประเมิน** ให้อัตโนมัติ
5. บันทึกคะแนนลง collection `behavior-score` และดูรายงานสรุปย้อนหลังได้ (พิมพ์/บันทึกเป็น PDF ได้)

## โครงสร้างข้อมูล Firestore

### `out-of` (อ่านอย่างเดียว, มีอยู่แล้วในระบบ)

`out-of` เป็นเอกสารเดียวที่มี subcollections อยู่ภายใน (ไม่ทราบ document ID ของเอกสารแม่
แอปจึงอ่านผ่าน Firestore `collectionGroup()` แทน ซึ่งค้นหา subcollection จากชื่อได้โดยไม่ต้องรู้
ID เอกสารแม่ — ดู `src/lib/outOf.js`):

```
out-of/{docId}/department/{depDocId}
  dep_id:   string   // รหัสสาขาวิชา
  dep_name: string   // ชื่อสาขาวิชา

out-of/{docId}/std_class/{classDocId}
  class_code:   number  // รหัสกลุ่มเรียน (ใช้ผูกกับ students.class_code)
  class_name:   string  // ชื่อกลุ่มเรียนเต็ม เช่น "ช่างยนต์ 3/1"
  short_name:   string  // ชื่อย่อ เช่น "ชย.3/1"
  dep_id:       string
  dep_name:     string
  advisor_name: string  // อาจารย์ที่ปรึกษา

out-of/{docId}/students/{studentDocId}
  sid:        string  // รหัสนักเรียน
  sname:      string  // ชื่อ-สกุล
  sidcard:    string  // เลขบัตรประชาชนนักเรียน
  class_code: number  // ผูกกับ std_class.class_code
  class_name, dep_id, dep_name, short_name: string  // denormalized สำหรับอ้างอิง

out-of/{docId}/teachers/{teacherDocId}   // รายชื่อบุคลากรทั้งวิทยาลัย ไม่ได้ใช้ในแอปนี้
  tidcard, tname, dep_id, dep_name, position: string
```

> แอปนี้ **อ่านอย่างเดียว** ไม่มีการเขียนกลับไปที่ `out-of` เด็ดขาด (บังคับเพิ่มด้วย
> `firestore.rules`: `allow write: if false`) การอ่านทั้งหมดใน `src/lib/outOf.js` ไม่มี
> `where`/`orderBy` จึงไม่ต้องสร้าง collection-group index เพิ่มใน Firebase Console

### `teacher-accounts` (สร้างใหม่โดยแอปนี้)

```
teacher-accounts/{nationalId}
  nationalId:   string
  fullName:     string
  passwordHash: string  // "salt:hash" จาก PBKDF2-SHA256 (ดู src/lib/passwordHash.js)
  createdAt:    timestamp
```

### `behavior-score` (สร้างใหม่โดยแอปนี้)

หนึ่งเอกสาร = คะแนนของนักเรียนหนึ่งคน ในวิชา/ภาคเรียนหนึ่ง:

```
behavior-score/{classId}_{studentKey}_{academicYear}_{term}
  classId, department, stdClass
  courseCode, courseName, term, academicYear
  studentKey, studentId, studentNo, studentName
  scores: { [criteriaKey]: 0 | 1 | 2 }   // เฉพาะรายการที่ประเมิน (16 คีย์ตาม src/lib/criteria.js)
  totalScore, evaluatedCount, jitphisai
  evaluatorNationalId, evaluatorName
  createdAt, updatedAt
```

## ⚠️ ไม่ใช้ Firebase Auth — ข้อจำกัดด้านความปลอดภัยที่ต้องรับทราบ

ตามที่ตกลงกันไว้ แอปนี้ **ไม่ใช้ Firebase Auth** ระบบล็อกอินเก็บบัญชีอาจารย์เองใน
Firestore (`teacher-accounts`) แทน ผลที่ตามมาคือ:

- Firestore Security Rules ตรวจสอบตัวตนได้จาก `request.auth` เท่านั้น เมื่อไม่มี Firebase Auth
  ก็ไม่มี `request.auth` ให้ตรวจ — กติกาที่เขียนได้จริงจึงเป็นเพียง **อ่าน/เขียนได้ทั้งหมด หรือ
  ปิดทั้งหมด** ต่อ collection ไม่สามารถจำกัดสิทธิ์ "เฉพาะเจ้าของบัญชี" ได้ในระดับฐานข้อมูล
- `firestore.rules` ที่แนบมาจึงเปิด read/write ทั้งหมดให้ `behavior-score` และ
  `teacher-accounts` — ใครก็ตามที่เปิด dev tools แล้วรู้ชื่อ collection สามารถอ่าน/แก้ไข/ลบข้อมูล
  ในสอง collection นี้ได้โดยตรง ไม่ผ่านหน้าเว็บแอป
- **สิ่งเดียวที่บังคับจริงในระดับฐานข้อมูลคือ `out-of` เป็น read-only** (`allow write: if false`)
  ไม่มีใครเขียนทับข้อมูลกลุ่มเรียน/รายชื่อนักเรียนได้ แม้แต่จากแอปนี้เอง
- รหัสผ่านเก็บแบบ hash (PBKDF2-SHA256, salt สุ่ม, 100,000 รอบ) ไม่ใช่ plaintext แต่เพราะ
  `teacher-accounts` อ่านได้แบบเปิด hash ที่เก็บไว้ก็ถูกดึงออกไปคำนวณย้อนกลับ (crack แบบ offline)
  ได้เช่นกัน — การ hash ช่วยชะลอ ไม่ได้ป้องกันสมบูรณ์

ถ้าต้องการยกระดับความปลอดภัยในอนาคต แนวทางที่ทำได้โดยไม่ต้องใช้ Firebase Auth product ตรงๆ
คือเขียน Cloud Function ออก custom token ให้ หรือใช้ App Check แต่จะซับซ้อนขึ้นมาก
และไม่อยู่ในขอบเขตของเวอร์ชันนี้

## การพัฒนา

```bash
npm install
npm run dev
```

## Deploy

Push ขึ้น branch `main` แล้ว GitHub Actions (`.github/workflows/deploy.yml`) จะ build และ
deploy ให้อัตโนมัติผ่าน GitHub Pages

**ก่อนใช้งานครั้งแรก** ต้องเปิดใช้ GitHub Pages แบบ "GitHub Actions" source ที่
Settings → Pages → Build and deployment → Source ของ repository นี้ก่อน ไม่เช่นนั้น workflow
จะรันผ่านแต่ deploy step จะ fail

แอปจะถูก serve ที่ `https://<owner>.github.io/rytc-behavior-score/`
(ตั้งค่า `base` ใน `vite.config.js` ไว้ตรงกับ path นี้แล้ว)

### Deploy Firestore rules (ทางเลือก)

`firestore.rules` แนบมาเป็นเอกสารอ้างอิง ต้อง deploy ผ่าน Firebase CLI เอง (ไม่ได้อยู่ใน GitHub
Actions workflow นี้):

```bash
firebase deploy --only firestore:rules --project rytc-app
```
