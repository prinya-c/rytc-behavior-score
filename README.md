# ระบบประเมินคุณลักษณะอันพึงประสงค์ (จิตพิสัย)

แอปสำหรับอาจารย์วิทยาลัยเทคนิคระยองใช้กรอกและสรุปคะแนนแบบประเมินด้านคุณธรรม
จริยธรรม ค่านิยมและคุณลักษณะอันพึงประสงค์ (จิตพิสัย) ตามฟอร์มมาตรฐานของวิทยาลัย
สร้างด้วย Vite + React + Tailwind CSS และเก็บข้อมูลใน Firebase Firestore

## สถาปัตยกรรมข้อมูล: สอง Firestore database ในโปรเจกต์เดียว

โปรเจกต์ Firebase `rytc-app` มี Firestore **สอง database แยกกัน** (ไม่ใช่แค่สอง collection):

- **`out-of`** — ฐานข้อมูลเดิมของวิทยาลัย (สาขาวิชา, กลุ่มเรียน, รายชื่อนักเรียน, บุคลากร)
  แอปนี้**อ่านอย่างเดียวเท่านั้น ไม่มีการเขียนกลับไปเด็ดขาด**
- **`behavior-score`** — ฐานข้อมูลของแอปนี้เอง เก็บบัญชีอาจารย์และคะแนนที่บันทึก

ดู `src/lib/firebase.js` (`outOfDb` กับ `db`) ที่ประกาศ client ของทั้งสอง database แยกกันด้วย
`getFirestore(app, databaseId)`

## การทำงานของแอป

1. **ลงทะเบียน**: อาจารย์กรอกเลขบัตรประชาชน ระบบค้นหาชื่อ-สกุลจาก `out-of/teachers`
   (document id = เลขบัตรประชาชน) มาแสดงให้ยืนยันอัตโนมัติ — ถ้าไม่พบข้อมูลจะลงทะเบียนไม่ได้
   จากนั้นอาจารย์ตั้งรหัสผ่านเอง ข้อมูลบัญชีถูกบันทึกลง `behavior-score/teacher-accounts`
2. **เข้าสู่ระบบ**: เลขบัตรประชาชน + รหัสผ่านที่ตั้งไว้
3. **เลือกกลุ่มเรียน**: ดึงรายชื่อจาก `out-of/std_class` แล้วกรองนักเรียนจาก `out-of/students`
   เฉพาะที่ตรงกับกลุ่มเรียนที่เลือก (อ่านอย่างเดียวทั้งหมด)
4. **กรอกคะแนน**: 16 เกณฑ์ตามฟอร์ม ให้คะแนน 0/1/2 หรือเว้นว่างถ้าไม่ประเมินรายการนั้น ระบบคำนวณ
   คะแนนรวม และ **จิตพิสัย = คะแนนรวม × 10 ÷ จำนวนรายการที่ประเมิน** ให้อัตโนมัติ
5. **บันทึก**: ลง `behavior-score/student-scores` และดูรายงานสรุปย้อนหลังได้ (พิมพ์/บันทึกเป็น PDF)

## โครงสร้างข้อมูล Firestore

### database `out-of` (อ่านอย่างเดียว, มีอยู่แล้วในระบบ)

Root collections ภายใน database นี้:

```
department/{depDocId}
  dep_id:   string   // รหัสสาขาวิชา
  dep_name: string   // ชื่อสาขาวิชา

std_class/{classDocId}
  class_code:   number  // รหัสกลุ่มเรียน (ใช้ผูกกับ students.class_code)
  class_name:   string  // ชื่อกลุ่มเรียนเต็ม เช่น "ช่างยนต์ 3/1"
  short_name:   string  // ชื่อย่อ เช่น "ชย.3/1"
  dep_id:       string
  dep_name:     string
  advisor_name: string  // อาจารย์ที่ปรึกษา

students/{studentDocId}
  sid:        string  // รหัสนักเรียน
  sname:      string  // ชื่อ-สกุล
  sidcard:    string  // เลขบัตรประชาชนนักเรียน
  class_code: number  // ผูกกับ std_class.class_code
  class_name, dep_id, dep_name, short_name: string  // denormalized สำหรับอ้างอิง

teachers/{teacherDocId}   // document id = เลขบัตรประชาชน (tidcard) — ใช้ตอนลงทะเบียน
  tidcard, tname, dep_id, dep_name, position: string
```

> แอปนี้ **อ่านอย่างเดียว** ไม่มีการเขียนกลับไปที่ database `out-of` เด็ดขาด — ไม่ได้อยู่ใน
> ขอบเขตความรับผิดชอบของแอปนี้เลยด้วยซ้ำ (`firestore.rules` ที่แนบมาครอบคลุมเฉพาะ database
> `behavior-score` เท่านั้น ดูหัวข้อ Deploy Firestore rules ด้านล่าง)

### database `behavior-score` (สร้างใหม่โดยแอปนี้)

#### collection `teacher-accounts`

```
teacher-accounts/{nationalId}
  nationalId:   string
  fullName:     string  // คัดลอกมาจาก out-of/teachers.tname ตอนลงทะเบียน
  depId, depName: string
  passwordHash: string  // "salt:hash" จาก PBKDF2-SHA256 (ดู src/lib/passwordHash.js)
  createdAt:    timestamp
```

#### collection `student-scores`

หนึ่งเอกสาร = คะแนนของนักเรียนหนึ่งคน ในวิชา/ภาคเรียนหนึ่ง:

```
student-scores/{classId}_{studentKey}_{academicYear}_{term}
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
`behavior-score/teacher-accounts` แทน ผลที่ตามมาคือ:

- Firestore Security Rules ตรวจสอบตัวตนได้จาก `request.auth` เท่านั้น เมื่อไม่มี Firebase Auth
  ก็ไม่มี `request.auth` ให้ตรวจ — กติกาที่เขียนได้จริงจึงเป็นเพียง **อ่าน/เขียนได้ทั้งหมด หรือ
  ปิดทั้งหมด** ต่อ collection ไม่สามารถจำกัดสิทธิ์ "เฉพาะเจ้าของบัญชี" ได้ในระดับฐานข้อมูล
- `firestore.rules` ที่แนบมาจึงเปิด read/write ทั้งหมดให้ `student-scores` และ
  `teacher-accounts` (ใน database `behavior-score`) — ใครก็ตามที่เปิด dev tools แล้วรู้ชื่อ
  collection สามารถอ่าน/แก้ไข/ลบข้อมูลในสอง collection นี้ได้โดยตรง ไม่ผ่านหน้าเว็บแอป
- การแยกเป็นคนละ database กับ `out-of` ช่วยกันไม่ให้ความเสี่ยงนี้ลามไปกระทบข้อมูลนักเรียน/
  บุคลากรตัวจริงของวิทยาลัย — ต่อให้ `behavior-score` ถูกเข้าถึงตรง ก็ยังแก้ไข `out-of` ไม่ได้
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

**ต้องมี Firestore database ชื่อ `behavior-score` อยู่ในโปรเจกต์ `rytc-app` ก่อนใช้งานจริง**
(แยกจาก database `(default)`/`out-of` ที่มีอยู่แล้ว) ถ้ายังไม่มี ให้สร้างผ่าน Firebase Console
หรือคำสั่ง `firebase firestore:databases:create behavior-score --project rytc-app --location <region>`

### Deploy Firestore rules (ทางเลือก)

`firestore.rules` แนบมาเป็นเอกสารอ้างอิง ครอบคลุมเฉพาะ database `behavior-score`
(กำหนด target ไว้ใน `firebase.json`) ต้อง deploy ผ่าน Firebase CLI เอง (ไม่ได้อยู่ใน GitHub
Actions workflow นี้):

```bash
firebase deploy --only firestore:rules --project rytc-app
```
