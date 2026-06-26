import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { HIKE_DOC, DEFAULT_HIKE_CONTENT } from '../firebase/services'

// Live subscription to the single hiking-event content doc (siteContent/hike).
// Falls back to the bundled defaults before an admin has saved anything.
export function useHike() {
  const [content, setContent] = useState(DEFAULT_HIKE_CONTENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, HIKE_DOC.col, HIKE_DOC.id),
      (snap) => {
        setContent(snap.exists()
          ? { ...DEFAULT_HIKE_CONTENT, ...snap.data() }
          : DEFAULT_HIKE_CONTENT)
        setLoading(false)
      },
      () => { setContent(DEFAULT_HIKE_CONTENT); setLoading(false) },
    )
    return unsub
  }, [])

  return { content, loading }
}
