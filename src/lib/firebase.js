import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase web config is public by design — this app does not use Firebase
// Auth (by request), so there is no request.auth for Firestore Security
// Rules to check against. See src/lib/passwordHash.js and README.md for
// what that means for data access.
const firebaseConfig = {
  apiKey: 'AIzaSyBUgTbS3jy-SN4Ayw4Xj8WWgfmTuPG3MDo',
  authDomain: 'rytc-app.firebaseapp.com',
  projectId: 'rytc-app',
  storageBucket: 'rytc-app.firebasestorage.app',
  messagingSenderId: '660036117392',
  appId: '1:660036117392:web:46556419dc91455cbb4915',
  measurementId: 'G-PTT6W05ZF0',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
