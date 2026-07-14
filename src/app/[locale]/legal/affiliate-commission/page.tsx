export const metadata = { title: "Commission Rules — LinkChinaMed" };

export default function CommissionRules() {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 space-y-8">
      <h1 className="text-4xl font-bold text-slate-900">Commission Rules</h1>
      <p className="text-sm text-slate-500">Last updated: 2026-07-13 · template — lawyer &amp; tax advisor review required</p>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">1. What is commissionable</h2>
        <p>
          Commission is calculated on the <strong>service fees</strong>{" "}
          that referred customers pay to LinkChinaMed via the iOS app
          (coordination, translation, on-site escort, transportation,
          administrative concierge).{" "}
          <strong>Medical fees paid directly to the hospital are
          not commissionable</strong> and never appear in our books.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">2. Default rate</h2>
        <p>
          Standard rate is <strong>5% of net service fees</strong>{" "}
          (after Stripe fees, refunds, chargebacks). Custom rates
          (higher or lower) are visible in your promoter dashboard
          per partner tier.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">3. Cooling-off period</h2>
        <p>
          Commission becomes <strong>pending</strong> at order
          completion and moves to <strong>payable</strong> 30 days
          later, to absorb refund / chargeback risk.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">4. Cancellations &amp; refunds</h2>
        <p>
          If a referred customer is refunded, the related commission
          is reversed. Chargebacks cost the commission plus a{" "}
          <strong>15 USD fee</strong> deducted from your next payout
          (or invoiced separately if there is no next payout).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">5. Minimum payout &amp; schedule</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Minimum payout: <strong>50 USD</strong> (or equivalent).</li>
          <li>Payouts are processed on the <strong>15th of each month</strong>, covering payable balance from the previous month.</li>
          <li>Method: <strong>Stripe Connect</strong> (bank transfer or local rails depending on country).</li>
          <li>Currency: USD by default; EUR / GBP / JPY supported via Stripe's FX.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">6. Self-referrals &amp; fraud</h2>
        <p>
          Self-referrals (you, your household, accounts you control)
          and any fraudulent conversion are <strong>void</strong> and
          may result in account termination. We perform manual review
          on referrals flagged by our risk model.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">7. Tax</h2>
        <p>
          You are responsible for declaring and paying any tax due on
          your commission. For US persons, we will collect a W-9; for
          non-US persons, a W-8BEN. We may withhold US backup tax
          (24%) if the correct form is not on file. Consult your own
          tax advisor.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">8. Lifetime validity</h2>
        <p>
          A referred customer's first paid order attributes to you.
          Subsequent orders from the same customer also attribute to
          you for as long as your account is active and in good
          standing (no cookie expiry while the account remains open).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">9. Changes</h2>
        <p>
          We may update the commission rate, schedule, or rules with
          30 days' notice. Material changes are e-mailed and
          displayed in your dashboard.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">10. Contact</h2>
        <p>
          Questions? Email{" "}
          <a className="text-brand-600 hover:underline" href="mailto:affiliates@linkchinamed.com">affiliates@linkchinamed.com</a>.
        </p>
      </section>
    </article>
  );
}
