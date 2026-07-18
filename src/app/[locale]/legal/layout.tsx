import Link from "next/link";

/**
 * Shared layout for the affiliate-portal legal pages. Each page
 * supplies its own title and content; this layout adds the
 * top-of-page "template, needs lawyer review" disclaimer and the
 * cross-page navigation footer.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {children}
      <nav className="mt-12 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm">
        <Link
          href="/legal/affiliate-agreement"
          className="text-brand-600 hover:underline"
        >
          Affiliate Agreement
        </Link>
        <Link
          href="/legal/affiliate-privacy"
          className="text-brand-600 hover:underline"
        >
          Promoter Privacy Policy
        </Link>
        <Link
          href="/legal/affiliate-code-of-conduct"
          className="text-brand-600 hover:underline"
        >
          Code of Conduct
        </Link>
        <Link
          href="/legal/affiliate-commission"
          className="text-brand-600 hover:underline"
        >
          Commission Rules
        </Link>
        <Link
          href="/legal/nda"
          className="text-brand-600 hover:underline"
        >
          Non-Disclosure Agreement
        </Link>
      </nav>
    </main>
  );
}
