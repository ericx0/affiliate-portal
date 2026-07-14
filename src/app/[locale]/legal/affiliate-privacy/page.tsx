export const metadata = { title: "Promoter Privacy Policy — LinkChinaMed" };

export default function AffiliatePrivacy() {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 space-y-8">
      <h1 className="text-4xl font-bold text-slate-900">Promoter Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: 2026-07-13 · template — lawyer review required</p>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">1. Scope</h2>
        <p>
          This Promoter Privacy Policy supplements the main{" "}
          <a
            className="text-brand-600 hover:underline"
            href="https://linkchinamed.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkChinaMed Privacy Policy
          </a>{" "}
          and applies specifically to data we collect from
          independent promoters who join our affiliate programme. If
          anything here conflicts with the main policy, the main
          policy prevails for the matters it covers.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">2. Data we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account &amp; identity: name, email, password hash, profile photo (optional), country.</li>
          <li>Payout: bank account or Stripe Connect account details, tax form (W-9 / W-8BEN as required by US tax law).</li>
          <li>Tracking: clicks, conversions, referring IP, device type — via cookies and your referral link.</li>
          <li>Communications: messages you send us, support tickets.</li>
          <li>Tax-relevant records: total commissions earned, paid, withheld (kept for 7+ years per US IRS rules).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">3. Why we collect it (legal basis)</h2>
        <p>Under GDPR, our bases are:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Contract (Art. 6(1)(b))</strong> — to register you, track referrals, calculate and pay commission.</li>
          <li><strong>Legal obligation (Art. 6(1)(c))</strong> — to keep tax records (US 7-year retention).</li>
          <li><strong>Legitimate interest (Art. 6(1)(f))</strong> — to prevent fraud, audit commission calculations, enforce the Code of Conduct.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">4. Sharing</h2>
        <p>
          We share your data only with: Stripe (payouts and tax
          reporting), our accountant / tax advisor, law-enforcement if
          legally required. We do not sell or rent promoter data.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">5. International transfers</h2>
        <p>
          Our servers are in the United States. We rely on the EU-US
          Data Privacy Framework and on Standard Contractual Clauses
          (2021/914) for transfers from the EEA, UK or Switzerland
          to the US. You can request a copy of the safeguards at{" "}
          <a className="text-brand-600 hover:underline" href="mailto:privacy@linkchinamed.com">privacy@linkchinamed.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">6. Retention</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Active promoter data: until you close your account + 1 year.</li>
          <li>Tax-relevant records: at least 7 years (US IRS).</li>
          <li>Tracking data: 24 months in identifiable form; then aggregated.</li>
          <li>After termination, we delete non-essential data within 90 days; tax-relevant records are kept for the legal minimum.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">7. Your rights</h2>
        <p>
          You have the right to access, correct, delete, port and
          restrict or object to processing of your data, and to
          withdraw consent. Email{" "}
          <a className="text-brand-600 hover:underline" href="mailto:privacy@linkchinamed.com">privacy@linkchinamed.com</a>.
          We respond within 30 days. You can also lodge a complaint
          with your local data-protection authority (for EEA users, 
          your national DPA; for UK users, the Information Commissioner's 
          Office (ICO)).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">8. Cookies set on the promoter portal</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Essential (always on):</strong> session cookie, CSRF token.</li>
          <li><strong>Analytics (opt-out):</strong> aggregated, cookieless page views.</li>
        </ul>
        <p>No advertising cookies; no third-party tracking.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">9. Contact</h2>
        <p>
          <strong>Data controller:</strong> Ionverge LLC
          <br />
          <strong>Address:</strong> 30 N Gould St, Ste N, Sheridan, WY 82801, USA
          <br />
          <strong>Email:</strong>{" "}
          <a className="text-brand-600 hover:underline" href="mailto:privacy@linkchinamed.com">privacy@linkchinamed.com</a>
        </p>
      </section>
    </article>
  );
}
