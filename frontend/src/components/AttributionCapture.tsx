'use client'

import { useEffect } from 'react'
import { setAttributionCookieFromCurrentUrl } from '@/lib/attribution'

export default function AttributionCapture() {
  useEffect(() => {
    setAttributionCookieFromCurrentUrl()
  }, [])

  return null
}
