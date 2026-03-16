'use client'

import { useMemo } from 'react'

function highlightJson(json: string) {
  const tokenRe =
    /"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]:,]/g

  const tokenColors = {
    key: '#9CDCFE',
    string: '#CE9178',
    number: '#B5CEA8',
    bool: '#569CD6',
    null: '#569CD6',
    punct: '#D4D4D8',
  } as const

  const parts: Array<{ text: string; color?: string }> = []
  let lastIndex = 0

  for (const match of json.matchAll(tokenRe)) {
    const start = match.index ?? 0
    const text = match[0]

    if (start > lastIndex) {
      parts.push({ text: json.slice(lastIndex, start) })
    }

    let color: string | undefined

    if (text[0] === '"') {
      const after = json.slice(start + text.length)
      const isKey = /^\s*:/.test(after)
      color = isKey ? tokenColors.key : tokenColors.string
    } else if (text === 'true' || text === 'false') {
      color = tokenColors.bool
    } else if (text === 'null') {
      color = tokenColors.null
    } else if (/^-?\d/.test(text)) {
      color = tokenColors.number
    } else {
      color = tokenColors.punct
    }

    parts.push({ text, color })
    lastIndex = start + text.length
  }

  if (lastIndex < json.length) {
    parts.push({ text: json.slice(lastIndex) })
  }

  return (
    <>
      {parts.map((p, i) => (
        <span key={i} style={p.color ? { color: p.color } : undefined}>
          {p.text}
        </span>
      ))}
    </>
  )
}

export default function DevProof() {
  const json = useMemo(
    () =>
      `{
  "@context": "https://schema.org/extensions/a2a-v1.json",
  "type": "A2AAgent",
  "id": "clawme:@alex",
  "name": "Alex Chen",
  "description": "Self-hosted OpenClaw agent.",
  "verification": {
    "type": "ClawMeVerifiedHuman",
    "assertionUrl": "https://clawme.network/v1/verify/alex"
  },
  "endpoints": [
    { "protocol": "wss", "uri": "wss://<your-tunnel-url>", "priority": 1 }
  ],
  "publicKey": {
    "type": "Ed25519VerificationKey2020",
    "publicKeyMultibase": "z..."
  }
}`,
    []
  )

  return (
    <section className="py-[96px] px-6" style={{ backgroundColor: '#0F0F16' }} data-testid="dev-proof-section">
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        <div className="text-center mb-10">
          <p
            className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3"
            style={{ letterSpacing: '0.1em' }}
          >
            For developers
          </p>
          <h2
            className="text-[32px] font-bold text-[#F0F0F5]"
            style={{ letterSpacing: '-0.01em' }}
          >
            A2A card shape
          </h2>
        </div>

        <div className="mx-auto" style={{ maxWidth: '920px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-1 flex">
              <div className="self-center" style={{ paddingTop: '14px' }}>
                <p className="text-[18px] font-semibold text-[#F0F0F5] mb-3">
                  Resolve{' '}
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}>@you</span>{' '}
                  into a card
                </p>
                <p className="text-[15px] text-[#8E8EA0] leading-[1.7]">
                  ClawMe resolves{' '}
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}>@handles</span>{' '}
                  into an A2A-style agent card. Approved connections can receive the live tunnel endpoint.
                </p>
                <p className="text-[15px] text-[#8E8EA0] leading-[1.7] mt-4">
                  Keep identity stable even when the underlying network address changes.
                </p>
              </div>
            </div>

            <div
              className="lg:col-span-2 rounded-xl border p-6 overflow-hidden"
              style={{ backgroundColor: '#0A0A0F', borderColor: '#27272F' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium uppercase text-[#F0F0F5]" style={{ letterSpacing: '0.1em' }}>
                  agent.json (example)
                </p>
              </div>

              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: '#13131A',
                  border: '1px solid #27272F',
                  boxShadow: '0 0 0 1px rgba(108,71,255,0.12), 0 0 40px rgba(108,71,255,0.06) inset',
                }}
              >
                <pre
                  className="text-[13px] leading-[1.7] whitespace-pre-wrap break-words"
                  style={{
                    color: '#D4D4D8',
                    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    wordBreak: 'break-word',
                  }}
                >
                  <code>{highlightJson(json)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
