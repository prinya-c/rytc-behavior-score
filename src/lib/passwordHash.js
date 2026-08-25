// No Firebase Auth is used in this app (by explicit request), so teacher
// accounts and password hashes live directly in Firestore. This means
// Firestore Security Rules cannot verify identity (there is no
// request.auth) — access control here is enforced only in the browser, not
// at the database layer. Hashing still avoids storing raw passwords.
const ITERATIONS = 100_000

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

async function deriveHash(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return toHex(bits)
}

/** Returns a single string "salt:hash" safe to store in Firestore. */
export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const hash = await deriveHash(password, saltBytes)
  return `${toHex(saltBytes)}:${hash}`
}

export async function verifyPassword(password, stored) {
  const [saltHex, expectedHash] = String(stored ?? '').split(':')
  if (!saltHex || !expectedHash) return false
  const hash = await deriveHash(password, fromHex(saltHex))
  return hash === expectedHash
}
