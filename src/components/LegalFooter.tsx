import Link from "next/link";

/**
 * Persistent footer with links to the four affiliate legal pages.
 * Rendered in the main locale layout so it appears on every page.
 */
export default function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
        <Link
          href="/legal/affiliate-agreement"
          className="hover:text-slate-900"
        >
          Affiliate Agreement
        </Link>
        <Link
          href="/legal/affiliate-privacy"
          className="hover:text-slate-900"
        >
          Promoter Privacy
        </Link>
        <Link
          href="/legal/affiliate-code-of-conduct"
          className="hover:text-slate-900"
        >
          Code of Conduct
        </Link>
        <Link
          href="/legal/affiliate-commission"
          className="hover:text-slate-900"
        >
          Commission Rules
        </Link>
        <span className="ml-auto text-xs text-slate-400">
          © {new Date().getFullYear()} LinkChinaMed · Ionverge LLC
        </span>
      </div>
    </footer>
  );
}
