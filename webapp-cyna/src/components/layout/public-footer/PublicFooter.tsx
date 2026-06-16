// Public site footer: company/legal link columns, socials, and copyright.
import Link from "next/link";

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/legal", label: "Legal Notices" },
  { href: "/terms", label: "Terms of Use" },
];

const socialLinks = [
  { href: "https://facebook.com", icon: FacebookIcon, label: "Facebook" },
  { href: "https://twitter.com", icon: TwitterIcon, label: "Twitter" },
  { href: "https://linkedin.com", icon: LinkedInIcon, label: "LinkedIn" },
  { href: "https://instagram.com", icon: InstagramIcon, label: "Instagram" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[#2b0958] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="text-base font-bold">CYNA</h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Enterprise cybersecurity solutions for modern businesses.
            </p>
          </div>

          <FooterLinkGroup links={companyLinks} title="Company" />
          <FooterLinkGroup links={legalLinks} title="Legal" />

          <div>
            <h2 className="text-base font-bold">Follow Us</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  aria-label={link.label}
                  className="inline-flex size-8 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  <link.icon aria-hidden="true" className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-8 text-center text-sm text-white/45">
          &copy; 2026 CYNA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14 8h3V4h-3c-3.1 0-5 1.9-5 5v2H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.2 4h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.2L5.7 22H2.6l7.3-8.4L2.2 4h6.4l4.4 5.6L18.2 4Zm-1.1 16.2h1.7L7.7 5.7H5.8l11.3 14.5Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.9 8.8H3.2V21h3.7V8.8ZM5.1 3a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Zm15.7 11.2c0-3.5-1.9-5.7-4.8-5.7-1.7 0-2.9.9-3.4 1.8h-.1V8.8H9V21h3.7v-6.4c0-1.7.8-2.7 2.2-2.7s2.2 1 2.2 2.8V21h3.7v-6.8Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="16" rx="4" width="16" x="4" y="4" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M17.4 6.8h.01" />
    </svg>
  );
}

function FooterLinkGroup({
  links,
  title,
}: {
  links: { href: string; label: string }[];
  title: string;
}) {
  return (
    <div>
      <h2 className="text-base font-bold">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-sm text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
