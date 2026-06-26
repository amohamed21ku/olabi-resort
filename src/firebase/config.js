import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
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

// Auto-detect long polling fixes Firestore failures on mobile networks and iOS
// Safari where the default WebChannel streaming transport is blocked or breaks
// mid-request, causing transactions to throw "unavailable" / generic errors.
//
// persistentLocalCache keeps an IndexedDB copy of read data so repeat visits and
// in-app navigation render instantly from cache (critical on slow Syrian networks),
// and queues writes locally so a submit succeeds immediately and syncs in the
// background even when the connection is poor or briefly offline.
export const db      = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const auth    = getAuth(app)
export const storage = getStorage(app)
