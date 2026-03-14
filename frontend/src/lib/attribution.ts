export type AttributionPayload = {
  sourceCandidate: string
  capturedAt: string
}

const ATTR_COOKIE = 'clawme_attrib'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const REF_MAP: Record<string, string> = {
  ph: 'producthunt',
  rsh: 'reddit_selfhosted',
  gh: 'github',
  dc: 'openclaw_discord',
}

function normalizeSource(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '')
    .slice(0, 64)
}

function parseSearchParams(search: string): URLSearchParams {
  if (search.startsWith('?')) return new URLSearchParams(search)
  return new URLSearchParams(search ? `?${search}` : '')
}

export function deriveSourceFromUrl(search: string): string {
  const sp = parseSearchParams(search)

  const ref = sp.get('ref')?.trim().toLowerCase() || ''
  if (ref && REF_MAP[ref]) return REF_MAP[ref]

  const utmCampaign = sp.get('utm_campaign') || ''
  if (utmCampaign) return normalizeSource(utmCampaign)

  const utmSource = sp.get('utm_source') || ''
  if (utmSource) return normalizeSource(utmSource)

  return 'landing_page'
}

export function setAttributionCookieFromCurrentUrl(): void {
  if (typeof window === 'undefined') return

  const sourceCandidate = deriveSourceFromUrl(window.location.search)
  const payload: AttributionPayload = {
    sourceCandidate,
    capturedAt: new Date().toISOString(),
  }

  const encoded = encodeURIComponent(JSON.stringify(payload))
  document.cookie = `${ATTR_COOKIE}=${encoded}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

export function getAttributionSource(): string {
  if (typeof document === 'undefined') return 'landing_page'

  const cookie = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ATTR_COOKIE}=`))

  if (!cookie) return 'landing_page'

  const value = cookie.slice(`${ATTR_COOKIE}=`.length)
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<AttributionPayload>
    if (typeof parsed.sourceCandidate !== 'string') return 'landing_page'
    const normalized = normalizeSource(parsed.sourceCandidate)
    return normalized || 'landing_page'
  } catch {
    return 'landing_page'
  }
}
