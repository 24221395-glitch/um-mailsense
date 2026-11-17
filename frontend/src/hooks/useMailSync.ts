import { useCallback, useEffect, useRef, useState } from 'react'
import { processEmails, syncNow } from '../api/emails'
import type { ProcessResult } from '../types/api'

/**
 * Keeps the inbox fresh without a background server timer (works on serverless hosting):
 * on open, fetch new mail if a sync is due, then ask the server to sort emails with the AI
 * in small batches until nothing is left. `onChange` reloads the page's data.
 */
export function useMailSync(onChange: () => unknown, onError: (err: unknown) => void) {
  const [checking, setChecking] = useState(true) // looking for new mail on open
  const [syncing, setSyncing] = useState(false) // manual refresh running
  const [work, setWork] = useState<ProcessResult | null>(null) // AI work left
  const [stalls, setStalls] = useState(0)
  const opened = useRef(false)
  const changeRef = useRef(onChange)

  useEffect(() => {
    changeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (opened.current) return
    opened.current = true
    syncNow(true)
      .catch(onError)
      .finally(async () => {
        setChecking(false)
        await changeRef.current()
        processEmails()
          .then(setWork)
          .catch(() => {})
      })
  }, [onError])

  // While emails are "Sorting…", process the next batch. Stop after 3 calls without progress.
  const pending = work ? work.unsorted + work.unscored : 0
  const keepWorking = !!work && work.ai_ready && pending > 0 && stalls < 3
  useEffect(() => {
    if (!keepWorking || !work) return
    const timer = window.setTimeout(async () => {
      try {
        const next = await processEmails()
        const stuck = next.unsorted === work.unsorted && next.unscored === work.unscored
        setStalls((n) => (stuck ? n + 1 : 0))
        setWork(next)
        changeRef.current()
      } catch {
        setStalls((n) => n + 1)
      }
    }, 800)
    return () => window.clearTimeout(timer)
  }, [keepWorking, work])

  const refresh = useCallback(async () => {
    setSyncing(true)
    setStalls(0)
    try {
      await syncNow()
      await changeRef.current()
      setWork(await processEmails())
    } catch (err) {
      onError(err)
    } finally {
      setSyncing(false)
    }
  }, [onError])

  return { checking, syncing, work, keepWorking, refresh, busy: checking || syncing || keepWorking }
}
