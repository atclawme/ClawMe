export default function Footer() {
  return (
    <footer
      className="py-12 px-6"
      style={{ borderTop: '1px solid #27272F' }}
      data-testid="footer"
    >
      <div
        className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ maxWidth: '1100px' }}
      >
        <span className="text-[13px] font-bold text-[#52525B]">@ClawMe</span>
        <div className="text-[13px] text-[#52525B] flex items-center gap-2 flex-wrap justify-center">
          <span>Built for OpenClaw</span>
          <span>·</span>
          <span>A2A Protocol</span>
          <span>·</span>
          <a
            href="https://github.com/clawme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8E8EA0] hover:text-[#F0F0F5] transition-colors"
            style={{ transitionDuration: '150ms' }}
            data-testid="footer-github-link"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
