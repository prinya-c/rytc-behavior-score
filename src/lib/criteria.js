// Fixed 16-item rubric from the college's official จิตพิสัย form.
// Each item is scored 0-2 by the teacher; a blank means "not evaluated"
// and is excluded from both the sum and the divisor below.
export const CRITERIA = [
  { key: 'human_relations', label: 'ความมีมนุษยสัมพันธ์ที่ดี', short: 'มนุษย สัมพันธ์' },
  { key: 'discipline', label: 'ความมีวินัย', short: 'มีวินัย' },
  { key: 'responsibility', label: 'ความรับผิดชอบ', short: 'รับผิดชอบ' },
  { key: 'honesty', label: 'ความซื่อสัตย์สุจริต', short: 'ซื่อสัตย์' },
  { key: 'self_confidence', label: 'ความเชื่อมั่นในตนเอง', short: 'เชื่อมั่น ในตนเอง' },
  { key: 'thrift', label: 'การประหยัด', short: 'ประหยัด' },
  { key: 'eagerness_to_learn', label: 'ความสนใจใฝ่รู้', short: 'ใฝ่รู้' },
  { key: 'unity', label: 'ความรักสามัคคี', short: 'สามัคคี' },
  { key: 'gratitude', label: 'ความกตัญญู', short: 'กตัญญู' },
  { key: 'no_vice', label: 'ละเว้นสิ่งเสพติด/การพนัน', short: 'ละเว้น อบายมุข' },
  { key: 'creativity', label: 'ความคิดริเริ่มสร้างสรรค์', short: 'ริเริ่ม สร้างสรรค์' },
  { key: 'self_reliance', label: 'การพึ่งตนเอง', short: 'พึ่งตนเอง' },
  { key: 'safety', label: 'ความปลอดภัย', short: 'ปลอดภัย' },
  { key: 'patience', label: 'ความอดทนและอดกลั้น', short: 'อดทน อดกลั้น' },
  { key: 'morality', label: 'ความมีคุณธรรม/จริยธรรม', short: 'คุณธรรม จริยธรรม' },
  { key: 'punctuality', label: 'การตรงต่อเวลา', short: 'ตรงต่อเวลา' },
]

export const MAX_SCORE_PER_ITEM = 2
export const JITPHISAI_SCALE = 10 // จิตพิสัย = คะแนนรวม x 10 / จำนวนรายการที่ประเมิน

/**
 * scores: { [criteriaKey]: 0 | 1 | 2 | undefined }
 * A criterion left undefined/null is treated as "not evaluated" for this student.
 */
export function computeJitphisai(scores) {
  const entries = CRITERIA
    .map((c) => scores?.[c.key])
    .filter((v) => v === 0 || v === 1 || v === 2)

  const evaluatedCount = entries.length
  const totalScore = entries.reduce((sum, v) => sum + v, 0)
  const jitphisai = evaluatedCount > 0 ? (totalScore * JITPHISAI_SCALE) / evaluatedCount : 0

  return { totalScore, evaluatedCount, jitphisai: Math.round(jitphisai * 100) / 100 }
}
