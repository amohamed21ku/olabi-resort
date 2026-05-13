import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            'AIzaSyCYLnTDFO80O_sU1dIdeyF40D5_-hZPWUo',
  authDomain:        'olabi-resort.firebaseapp.com',
  projectId:         'olabi-resort',
  storageBucket:     'olabi-resort.firebasestorage.app',
  messagingSenderId: '999786279699',
  appId:             '1:999786279699:web:25a4b727fbc41989ff60e6',
  measurementId:     'G-VT0ZZ8F4PQ',
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const auth    = getAuth(app)
export const storage = getStorage(app)
