import { Suspense } from 'react'
import ClaimClient from './ClaimClient'

export default function ClaimPage() {
  return (
    <Suspense>
      <ClaimClient />
    </Suspense>
  )
}
