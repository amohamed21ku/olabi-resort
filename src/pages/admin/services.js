// Single relative-path boundary between the admin UI (src/pages/admin/**) and
// the business-logic layer. Every admin file imports Firebase/services access
// from here ('../services' / '../../services' depending on nesting) instead of
// computing its own path to src/firebase/*. No logic lives in this file.
export * from '../../firebase/services'
export { seedRooms, CATEGORIES } from '../../firebase/seed'
export { compressImage } from '../../utils/imageCompress'
export { auth, db, storage } from '../../firebase/config'
export {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  query, orderBy, where, getDocs, getDoc, addDoc, Timestamp,
} from 'firebase/firestore'
export { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
export { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
