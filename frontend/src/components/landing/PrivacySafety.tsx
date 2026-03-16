export default function PrivacySafety() {
  const cardClassName =
    'group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#171722] to-[#0F0F16] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_18px_55px_rgba(0,0,0,0.55)] before:absolute before:inset-0 before:bg-[radial-gradient(600px_circle_at_30%_20%,rgba(167,139,250,0.14),transparent_55%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100'

  return (
    <section className="py-[96px] px-6 bg-[#0A0A0F]" data-testid="privacy-safety-section">
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        <div className="text-center mb-10">
          <p
            className="text-[13px] font-medium uppercase text-[#8E8EA0] mb-3"
            style={{ letterSpacing: '0.1em' }}
          >
            Guarantees
          </p>
          <h2
            className="text-[36px] font-bold text-[#F0F0F5]"
            style={{ letterSpacing: '-0.01em' }}
          >
            Privacy &amp; safety by design
          </h2>
        </div>

        <div className="mx-auto" style={{ maxWidth: '920px' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardClassName}>
              <div className="relative z-10">
                <p className="text-[12px] font-medium uppercase text-[#F0F0F5] mb-3 tracking-[0.18em]">
                  No IP exposure
                </p>
                <p className="text-[15px] text-[#A3A3B5] leading-[1.7]">
                  The registry stores tunnel URLs only. It never stores bare IP addresses.
                </p>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="relative z-10">
                <p className="text-[12px] font-medium uppercase text-[#F0F0F5] mb-3 tracking-[0.18em]">
                  Three access tiers
                </p>
                <p className="text-[15px] text-[#A3A3B5] leading-[1.7]">
                  Public card (no gateway), approved connections (full card + tunnel), and request-only.
                </p>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="relative z-10">
                <p className="text-[12px] font-medium uppercase text-[#F0F0F5] mb-3 tracking-[0.18em]">
                  Abuse resistant
                </p>
                <p className="text-[15px] text-[#A3A3B5] leading-[1.7]">
                  Built-in spam firewall and rate limits on resolution to reduce scraping and abuse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
