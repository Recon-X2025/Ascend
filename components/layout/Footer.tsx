import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-white py-16 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div>
          <p className="font-display font-extrabold text-[1.2rem] tracking-wide text-white">
            Ascend
          </p>
          <p className="font-body text-[0.58rem] tracking-[0.18em] uppercase text-white/25 mt-0.5">
            A Coheron Product
          </p>
          <p className="font-body text-[0.9rem] text-white/65 mt-2 leading-relaxed">
            Where you&apos;re going, <span className="text-white/40 font-light">intelligently.</span>
          </p>
        </div>
        <div>
          <p className="font-body text-[0.68rem] tracking-[0.2em] uppercase text-white/25 mb-3">
            Product
          </p>
          <ul className="space-y-2">
            {[
              { href: "/jobs", label: "Jobs" },
              { href: "/companies", label: "Companies" },
              { href: "/salary", label: "Salary Insights" },
              { href: "/network", label: "Network" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-body text-[0.68rem] tracking-[0.2em] uppercase text-white/25 mb-3">
            Company
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                About
              </Link>
            </li>
            <li>
              <a
                href="https://coheron.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                coheron.tech
                <span className="opacity-60">↗</span>
              </a>
            </li>
            <li>
              <Link href="/contact" className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-body text-[0.68rem] tracking-[0.2em] uppercase text-white/25 mb-3">
            Legal
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/privacy" className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/legal/cookies" className="font-body text-[0.85rem] text-white/50 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-body font-light text-[0.75rem] text-white/20">
          © 2025 Ascend by Coheron
        </span>
        <a
          href="https://coheron.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body font-light text-[0.75rem] text-white/20 hover:text-green transition-colors"
        >
          coheron.tech ↗
        </a>
      </div>
    </footer>
  );
}
