export const metadata = { title: "Non-Disclosure Agreement - LinkChinaMed" };

export default function NonDisclosureAgreement() {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 space-y-8">
      <h1 className="text-4xl font-bold text-slate-900">Non-Disclosure Agreement</h1>
      <p className="text-sm text-slate-500">Last updated: 2026-07-21</p>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Parties</h2>
        <p>
          This Non-Disclosure Agreement (&ldquo;Agreement&rdquo;) is between{" "}
          <strong>Ionverge LLC</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;),
          operating the LinkChinaMed platform, and the undersigned individual
          (&ldquo;Recipient&rdquo;) who accepted it when registering for the
          LinkChinaMed promoter programme.
        </p>
        <p className="text-sm text-slate-500">
          <strong>Governing Law:</strong> State of Wyoming, USA
          <br />
          <strong>Effective Date:</strong> the date you accepted this Agreement at registration.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">1. Definition of Confidential Information</h2>
        <p>&ldquo;Confidential Information&rdquo; includes, but is not limited to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Company&apos;s partner hospital lists, pricing structures, and service protocols</li>
          <li>Technical systems, source code, and database structures</li>
          <li>Business plans, financial data, and marketing strategies</li>
          <li>Internal communications (email, messaging, video calls)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">2. Obligations</h2>
        <p>Recipient agrees to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Hold all Confidential Information in strict confidence</li>
          <li>Not disclose Confidential Information to any third party</li>
          <li>Not use Confidential Information for any purpose other than the intended business relationship</li>
          <li>Notify Company within 48 hours upon discovering any unauthorized disclosure</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">3. Exclusions</h2>
        <p>This Agreement does not apply to information that:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Is or becomes publicly available through no fault of Recipient</li>
          <li>Was rightfully known to Recipient before disclosure</li>
          <li>Is required to be disclosed by law or court order (with prior written notice to Company)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">4. Duration</h2>
        <p>
          This Agreement is effective from the date of acceptance. The Recipient's 
          confidentiality obligations with respect to Company's business trade secrets 
          shall remain in force <strong>for as long as the information remains a trade secret under applicable law</strong>. 
          Obligations with respect to other Confidential Information shall remain in force 
          for <strong>three (3) years</strong> after termination of the business relationship.
        </p>
        <p className="mt-2">
          <strong>CRITICAL PRIVACY UNDERTAKING:</strong> Notwithstanding anything to the contrary, the 
          Recipient's confidentiality obligations with respect to any patient-related personal or health 
          information the Recipient may incidentally encounter, and any Personal Identifiable 
          Information (PII) or Protected Health Information (PHI), shall <strong>SURVIVE the termination of this Agreement INDEFINITELY</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">5. Independent Contractor</h2>
        <p>
          Recipient acknowledges that this Agreement does not create an
          employment relationship. Recipient is an independent contractor.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">6. Remedies</h2>
        <p>
          Recipient acknowledges that breach may cause irreparable harm and
          that Company is entitled to seek injunctive relief in addition to all
          other available remedies.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">7. Governing Law &amp; Jurisdiction</h2>
        <p>
          This Agreement is governed by the laws of the{" "}
          <strong>State of Wyoming, USA</strong>. Disputes shall be resolved in
          the courts of Wyoming.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">8. Entire Agreement</h2>
        <p>
          This Agreement constitutes the entire agreement between the parties
          regarding confidentiality and supersedes all prior agreements on the
          same subject.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">9. Whistleblower Immunity Notice (18 U.S.C. § 1833(b))</h2>
        <p>
          <strong>Immunity from Liability for Confidential Disclosure of a Trade Secret to the Government or in a Court Filing:</strong>
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>Immunity</strong> — An individual shall not be held criminally or civilly liable under any Federal or State trade secret law for the disclosure of a trade secret that is made (i) in confidence to a Federal, State, or local government official, either directly or indirectly, or to an attorney, and solely for the purpose of reporting or investigating a suspected violation of law; or (ii) in a complaint or other document filed in a lawsuit or other proceeding, if such filing is made under seal.
          </li>
          <li>
            <strong>Use of Trade Secret Information in Anti-Retaliation Lawsuit</strong> — An individual who files a lawsuit for retaliation by an employer for reporting a suspected violation of law may disclose the trade secret to the attorney of the individual and use the trade secret information in the court proceeding, if the individual files any document containing the trade secret under seal and does not disclose the trade secret, except pursuant to court order.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
        <p>
          Questions? Email{" "}
          <a className="text-brand-600 hover:underline" href="mailto:partnerships@linkchinamed.com">partnerships@linkchinamed.com</a>.
        </p>
      </section>
    </article>
  );
}
