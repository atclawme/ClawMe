'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Loader2, Save, X, Plus, AlertTriangle } from 'lucide-react'
import type { HandleData } from '../page'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      if (res.status === 404) {
        router.replace('/claim')
        return
      }
      if (res.ok) {
        const data: HandleData = await res.json()
        setHandle(data)
        setDisplayName(data.display_name || '')
        setDescription(data.description || '')
        setMethods(data.supported_methods || [])
        setGatewayUrl(data.target_gateway || '')
        setPublicKey(data.public_key || '')
        setVisibilityTier(data.visibility_tier || 3)
        const rules = (data.auto_approve_rules as Record<string, unknown>) || {}
        setAutoApproveVerified(Boolean(rules.verified_only))
      }
      setLoading(false)
    }
    load()
  }, [router])

  const validateGateway = (url: string) => {
    if (!url) {
      setGatewayWarning('')
      return
    }
    if (!url.startsWith('https://') && !url.startsWith('wss://')) {
      setGatewayWarning('Gateway must start with https:// or wss://')
    } else if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
      setGatewayWarning('Warning: bare IP detected. Approved connections may see your real IP. Consider using a tunnel URL.')
    } else {
      setGatewayWarning('')
    }
  }

  const save = async (section: string) => {
    setSaving(true)
    const body: Record<string, unknown> = {}
    if (section === 'handle') {
      body.display_name = displayName
      body.description = description
      body.supported_methods = methods
    }
    if (section === 'agent') {
      body.target_gateway = gatewayUrl
      body.public_key = publicKey
    }
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
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const toggleMethod = (m: string) => {
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const addCustomMethod = () => {
    if (customMethod && !methods.includes(customMethod)) {
      setMethods((prev) => [...prev, customMethod.toUpperCase()])
      setCustomMethod('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const Section = ({
    title,
    description,
    children,
    onSave,
    sectionKey,
  }: {
    title: string
    description?: string
    children: React.ReactNode
    onSave: () => void
    sectionKey: string
  }) => (
    <Card className="border-border/70 bg-background/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
          {description && (
            <p className="text-[12px] text-muted-foreground">{description}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
        <div className="mt-5 flex justify-end">
          <Button
            onClick={onSave}
            disabled={saving}
            data-testid={`save-${sectionKey}-btn`}
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 pt-[60px] md:ml-60 md:pt-6">
        <div className="mx-auto max-w-[960px] space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-1">
            <h1
              className="text-[24px] font-semibold tracking-tight text-foreground"
              style={{ letterSpacing: '-0.02em' }}
            >
              Settings
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Tune how your handle looks, how your agent connects, and who can reach you.
            </p>
          </div>

          {/* Main layout: profile on the left, connectivity & access on the right */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            {/* Handle & profile */}
            <Section
              title="Handle & profile"
              description="Control how your handle appears on your public profile."
              onSave={() => save('handle')}
              sectionKey="handle"
            >
              <div className="space-y-4">
                {handle && (
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Handle
                      </p>
                      <p className="font-mono text-sm text-foreground">@{handle.handle}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="display-name"
                    className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Display name
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    placeholder="Your display name"
                    data-testid="display-name-input"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder="What does your agent do?"
                    data-testid="description-input"
                    className="text-sm"
                  />
                  <p className="mt-1 text-[12px] text-muted-foreground/80">{description.length}/280</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Supported methods
                  </Label>
                  <p className="text-[12px] text-muted-foreground">
                    Choose how other agents can interact with you. These appear on your Agent Card.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {METHOD_OPTIONS.map((m) => {
                      const active = methods.includes(m)
                      return (
                        <Button
                          key={m}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleMethod(m)}
                          className={`h-7 rounded-full px-3 text-[11px] font-medium ${
                            active
                              ? 'bg-primary/15 text-primary border-primary/70'
                              : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/60'
                          }`}
                        >
                          {m}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      placeholder="CUSTOM_METHOD"
                      className="h-9 flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && addCustomMethod()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addCustomMethod}
                      className="h-9 w-9"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {methods.filter((m) => !METHOD_OPTIONS.includes(m)).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {methods
                        .filter((m) => !METHOD_OPTIONS.includes(m))
                        .map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/70 bg-primary/10 px-3 py-1 text-[12px] text-primary"
                          >
                            {m}
                            <button
                              type="button"
                              onClick={() => setMethods((p) => p.filter((x) => x !== m))}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Connectivity & access */}
            <div className="space-y-5">
              <Section
                title="Agent connectivity"
                description="Connect your running agent so ClawMe can route traffic to it."
                onSave={() => save('agent')}
                sectionKey="agent"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="gateway-url"
                      className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Gateway URL
                    </Label>
                    <Input
                      id="gateway-url"
                      type="text"
                      value={gatewayUrl}
                      onChange={(e) => {
                        setGatewayUrl(e.target.value)
                        validateGateway(e.target.value)
                      }}
                      placeholder="https://your-agent.example.com"
                      data-testid="gateway-url-input"
                      className="h-10 font-mono text-xs"
                    />
                    {gatewayWarning && (
                      <Alert className="mt-2 border-amber-500/40 bg-amber-500/5 text-amber-100">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-[12px] leading-relaxed">
                          {gatewayWarning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="public-key"
                      className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Public key (Ed25519)
                    </Label>
                    <Textarea
                      id="public-key"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      rows={3}
                      placeholder="z6Mk..."
                      data-testid="public-key-input"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </Section>

              <Section
                title="Visibility & access"
                description="Decide who can see your full Agent Card and send you requests."
                onSave={() => save('visibility')}
                sectionKey="visibility"
              >
                <div className="space-y-3">
                  {TIER_OPTIONS.map((tier) => {
                    const active = visibilityTier === tier.value
                    return (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => setVisibilityTier(tier.value)}
                        className={`w-full rounded-lg border p-4 text-left transition-colors ${
                          active
                            ? 'border-primary/70 bg-primary/10'
                            : 'border-border/70 bg-background hover:bg-muted/60'
                        }`}
                      >
                        <p
                          className={`text-[14px] font-semibold ${
                            active ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {tier.label}
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">{tier.desc}</p>
                      </button>
                    )
                  })}
                  {visibilityTier === 3 && (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-medium text-foreground">
                          Auto-approve verified GitHub users
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          Requests from GitHub-verified accounts will be approved automatically.
                        </p>
                      </div>
                      <Switch
                        checked={autoApproveVerified}
                        onCheckedChange={(checked: boolean) => setAutoApproveVerified(checked)}
                        aria-label="Auto-approve verified GitHub users"
                      />
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-[13px] text-muted-foreground">
                Permanently delete your handle. This action cannot be undone.
              </p>
              <p className="text-[13px] text-muted-foreground">
                Type{' '}
                <span className="font-mono text-foreground">@{handle?.handle}</span> to confirm:
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={`@${handle?.handle}`}
                  className="h-10 flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirm !== `@${handle?.handle}`) {
                      setDeleteError('Handle does not match')
                      return
                    }
                    await fetch('/api/handle', { method: 'DELETE' })
                    const supabase = (await import('@/lib/supabase')).createClient()
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                  disabled={deleteConfirm !== `@${handle?.handle}`}
                  className="h-10 sm:w-[120px]"
                >
                  Delete
                </Button>
              </div>
              {deleteError && (
                <p className="text-[12px] text-destructive" data-testid="delete-error-message">
                  {deleteError}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
