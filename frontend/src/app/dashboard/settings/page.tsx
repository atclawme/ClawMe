'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Loader2, Save, X, Plus } from 'lucide-react'
import type { HandleData } from '../page'

const METHOD_OPTIONS = ['GET_AVAILABILITY', 'PROPOSE_MEETING', 'SEND_MESSAGE', 'SHARE_CONTEXT', 'REQUEST_ACTION']
const TIER_OPTIONS = [
  { value: 1, label: 'Public (Tier 1)', desc: 'Anyone sees your name, description, and methods. Gateway URL is never exposed.' },
  { value: 2, label: 'Connections Only (Tier 2)', desc: 'Only approved connections receive your full Agent Card.' },
  { value: 3, label: 'Approval Required (Tier 3)', desc: 'Unknown agents see a partial card and a request URL. You approve each connection manually.' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [handle, setHandle] = useState<HandleData | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [methods, setMethods] = useState<string[]>([])
  const [customMethod, setCustomMethod] = useState('')
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [visibilityTier, setVisibilityTier] = useState(3)
  const [autoApproveVerified, setAutoApproveVerified] = useState(false)
  const [gatewayWarning, setGatewayWarning] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/handle/me', { credentials: 'include' })
      if (res.status === 401) { router.replace('/login'); return }
      if (res.status === 404) { router.replace('/claim'); return }
      if (res.ok) {
        const data: HandleData = await res.json()
        setHandle(data)
        setDisplayName(data.display_name || '')
        setDescription(data.description || '')
        setMethods(data.supported_methods || [])
        setGatewayUrl(data.target_gateway || '')
        setPublicKey(data.public_key || '')
        setVisibilityTier(data.visibility_tier || 3)
        const rules = data.auto_approve_rules as Record<string, unknown> || {}
        setAutoApproveVerified(Boolean(rules.verified_only))
      }
      setLoading(false)
    }
    load()
  }, [router])

  const validateGateway = (url: string) => {
    if (!url) { setGatewayWarning(''); return }
    if (!url.startsWith('https://') && !url.startsWith('wss://')) {
      setGatewayWarning('Gateway must start with https:// or wss://')
    } else if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
      setGatewayWarning('Warning: bare IP detected. Approved connections may see your real IP. Consider using a tunnel URL.')
    } else { setGatewayWarning('') }
  }

  const save = async (section: string) => {
    setSaving(true)
    const body: Record<string, unknown> = {}
    if (section === 'handle') { body.display_name = displayName; body.description = description; body.supported_methods = methods }
    if (section === 'agent') { body.target_gateway = gatewayUrl; body.public_key = publicKey }
    if (section === 'visibility') {
      body.visibility_tier = visibilityTier
      if (visibilityTier === 3) body.auto_approve_rules = { verified_only: autoApproveVerified }
    }
    const res = await fetch('/api/handle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const toggleMethod = (m: string) => {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  const addCustomMethod = () => {
    if (customMethod && !methods.includes(customMethod)) {
      setMethods((prev) => [...prev, customMethod.toUpperCase()])
      setCustomMethod('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-6 h-6 animate-spin text-[#6C47FF]" />
      </div>
    )
  }

  const Section = ({ title, children, onSave, sectionKey }: { title: string; children: React.ReactNode; onSave: () => void; sectionKey: string }) => (
    <div className="rounded-xl p-6 mb-5" style={{ backgroundColor: '#13131A', border: '1px solid #27272F' }}>
      <h2 className="text-[16px] font-semibold text-[#F0F0F5] mb-5">{title}</h2>
      {children}
      <button
        onClick={onSave}
        disabled={saving}
        data-testid={`save-${sectionKey}-btn`}
        className="mt-5 px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors"
        style={{ backgroundColor: '#6C47FF', transitionDuration: '150ms' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save changes'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <Sidebar />
      <main className="flex-1 md:ml-[240px] p-6 pt-[60px] md:pt-6">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-[24px] font-bold text-[#F0F0F5] mb-8" style={{ letterSpacing: '-0.01em' }}>Settings</h1>

          {/* Handle Settings */}
          <Section title="Handle Settings" onSave={() => save('handle')} sectionKey="handle">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>Display name</label>
                <input
                  type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50}
                  placeholder="Your display name"
                  data-testid="display-name-input"
                  className="w-full h-11 rounded-lg px-4 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none"
                  style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C47FF')}
                  onBlur={(e) => (e.target.style.borderColor = '#3F3F50')}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>Description</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} rows={3}
                  placeholder="What does your agent do?"
                  data-testid="description-input"
                  className="w-full rounded-lg px-4 py-3 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none resize-none"
                  style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C47FF')}
                  onBlur={(e) => (e.target.style.borderColor = '#3F3F50')}
                />
                <p className="text-[12px] text-[#52525B] mt-1">{description.length}/280</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>Supported methods</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {METHOD_OPTIONS.map((m) => (
                    <button key={m} onClick={() => toggleMethod(m)}
                      className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
                      style={{
                        backgroundColor: methods.includes(m) ? '#6C47FF1A' : '#1C1C28',
                        border: `1px solid ${methods.includes(m) ? '#6C47FF' : '#3F3F50'}`,
                        color: methods.includes(m) ? '#6C47FF' : '#8E8EA0',
                      }}
                    >{m}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customMethod} onChange={(e) => setCustomMethod(e.target.value)} placeholder="CUSTOM_METHOD"
                    className="flex-1 h-9 rounded-lg px-3 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none"
                    style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50' }}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomMethod()}
                  />
                  <button onClick={addCustomMethod} className="px-3 h-9 rounded-lg text-[#6C47FF] transition-colors" style={{ border: '1px solid #3F3F50' }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {methods.filter((m) => !METHOD_OPTIONS.includes(m)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {methods.filter((m) => !METHOD_OPTIONS.includes(m)).map((m) => (
                      <span key={m} className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px]"
                        style={{ backgroundColor: '#6C47FF1A', border: '1px solid #6C47FF', color: '#6C47FF' }}>
                        {m}
                        <button onClick={() => setMethods((p) => p.filter((x) => x !== m))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Agent Settings */}
          <Section title="Agent Settings" onSave={() => save('agent')} sectionKey="agent">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>Gateway URL</label>
                <input type="text" value={gatewayUrl}
                  onChange={(e) => { setGatewayUrl(e.target.value); validateGateway(e.target.value) }}
                  placeholder="https://your-agent.example.com"
                  data-testid="gateway-url-input"
                  className="w-full h-11 rounded-lg px-4 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none"
                  style={{ backgroundColor: '#1C1C28', border: `1px solid ${gatewayWarning ? '#F59E0B' : '#3F3F50'}`, fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                />
                {gatewayWarning && <p className="text-[12px] mt-1" style={{ color: '#F59E0B' }}>{gatewayWarning}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium uppercase text-[#8E8EA0] mb-2" style={{ letterSpacing: '0.05em' }}>Public key (Ed25519)</label>
                <textarea value={publicKey} onChange={(e) => setPublicKey(e.target.value)} rows={3}
                  placeholder="z6Mk..."
                  data-testid="public-key-input"
                  className="w-full rounded-lg px-4 py-3 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none resize-none"
                  style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                />
              </div>
            </div>
          </Section>

          {/* Visibility */}
          <Section title="Visibility and Access" onSave={() => save('visibility')} sectionKey="visibility">
            <div className="space-y-3">
              {TIER_OPTIONS.map((tier) => (
                <button key={tier.value} onClick={() => setVisibilityTier(tier.value)}
                  className="w-full text-left rounded-lg p-4 transition-colors"
                  style={{
                    backgroundColor: visibilityTier === tier.value ? '#6C47FF1A' : '#1C1C28',
                    border: `1px solid ${visibilityTier === tier.value ? '#6C47FF' : '#3F3F50'}`,
                  }}>
                  <p className="text-[14px] font-semibold" style={{ color: visibilityTier === tier.value ? '#6C47FF' : '#F0F0F5' }}>{tier.label}</p>
                  <p className="text-[13px] text-[#8E8EA0] mt-1">{tier.desc}</p>
                </button>
              ))}
              {visibilityTier === 3 && (
                <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer" style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50' }}>
                  <input type="checkbox" checked={autoApproveVerified} onChange={(e) => setAutoApproveVerified(e.target.checked)}
                    className="w-4 h-4 accent-[#6C47FF]" />
                  <span className="text-[14px] text-[#F0F0F5]">Auto-approve verified GitHub users</span>
                </label>
              )}
            </div>
          </Section>

          {/* Danger Zone */}
          <div className="rounded-xl p-6" style={{ backgroundColor: '#13131A', border: '1px solid #EF444440' }}>
            <h2 className="text-[16px] font-semibold text-[#EF4444] mb-2">Danger Zone</h2>
            <p className="text-[13px] text-[#8E8EA0] mb-4">Permanently delete your handle. This action cannot be undone.</p>
            <p className="text-[13px] text-[#8E8EA0] mb-3">
              Type <span className="font-mono text-[#F0F0F5]">@{handle?.handle}</span> to confirm:
            </p>
            <div className="flex gap-3">
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={`@${handle?.handle}`}
                className="flex-1 h-10 rounded-lg px-3 text-[#F0F0F5] text-sm placeholder-[#52525B] outline-none"
                style={{ backgroundColor: '#1C1C28', border: '1px solid #3F3F50', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              />
              <button
                onClick={async () => {
                  if (deleteConfirm !== `@${handle?.handle}`) { setDeleteError('Handle does not match'); return }
                  await fetch('/api/handle', { method: 'DELETE' })
                  const supabase = (await import('@/lib/supabase')).createClient()
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                disabled={deleteConfirm !== `@${handle?.handle}`}
                className="px-4 h-10 rounded-lg text-sm font-semibold text-[#EF4444] transition-colors"
                style={{ border: '1px solid #EF444440', opacity: deleteConfirm !== `@${handle?.handle}` ? 0.5 : 1 }}
              >
                Delete
              </button>
            </div>
            {deleteError && <p className="text-[12px] mt-2" style={{ color: '#EF4444' }}>{deleteError}</p>}
          </div>
        </div>
      </main>
    </div>
  )
}
