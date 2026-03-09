export default function TunnelWarning() {
  return (
    <div
      className="rounded-lg p-3 mb-4 text-[12px] leading-[1.6]"
      style={{
        backgroundColor: '#F59E0B15',
        borderLeft: '3px solid #F59E0B',
        color: '#F59E0B',
      }}
      data-testid="tunnel-warning"
    >
      <span className="font-semibold">Agent not using a tunnel URL.</span>{' '}
      Approved connections may see your real IP. Set up Cloudflare Tunnel or Tailscale Funnel and update your gateway URL in Settings.
    </div>
  )
}
