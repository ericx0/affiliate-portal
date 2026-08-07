"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { QRCodeCanvas } from "qrcode.react";
import {
  Users,
  FileCheck,
  Wallet,
  Coins,
  Copy,
  Check,
  QrCode,
  Download,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
  CalendarClock,
  Hourglass,
  Medal,
} from "lucide-react";
import { useFormat } from "@/lib/format";

// Shape returned by GET /api/affiliate/me/stats (affiliate_get_my_stats RPC).
// Money fields are integer CENTS (migration 010).
interface StatsData {
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
  totalClicks: number;
  activeCodes: number;
}

// Shape returned by GET /api/affiliate/me/profile (affiliate_get_me RPC).
// Extended by migration 20260811000001 to expose role + agentLevel +
// commissionRate so the dashboard header can render a tier card
// without a second round-trip.
type AgentLevel = "basic" | "senior" | "regional";

interface ProfileData {
  status?: string;
  role?: "kol" | "agent";
  agentLevel?: AgentLevel | null;
  commissionRate?: number | null;
}

// Shape returned by GET /api/affiliate/me/codes entries.
interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  createdAt: string;
}

// Shape returned by GET /api/affiliate/me/payouts entries
// (grouped by stripe_transfer_id; amountCents in cents).
interface Payout {
  id: string;
  paidAt: string;
  amountCents: number;
  method: string;
  stripeTransferId: string | null;
  earningsCount: number;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://linkchinamed.com";

// Business rule (affiliate-service jobs/monthly-payout-batch.ts): the payout
// batch runs on the 14th of each month; balances below $50 roll over.
const PAYOUT_DAY = 14;
const MIN_PAYOUT_CENTS = 5000;

const fmtUsd = (cents: number | undefined) => ((cents ?? 0) / 100).toFixed(2);

function nextSettlementDate(): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), PAYOUT_DAY);
  if (now.getDate() >= PAYOUT_DAY) {
    return new Date(now.getFullYear(), now.getMonth() + 1, PAYOUT_DAY);
  }
  return d;
}

export default function DashboardOverview() {
  const t = useTranslations("dashboard");
  const fmt = useFormat();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [taxSubmitted, setTaxSubmitted] = useState<boolean | null>(null);
  const [accountPending, setAccountPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Sub-ID / UTM builder (P1-9) + QR poster download (P1-10)
  const [subId, setSubId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [copiedGenLink, setCopiedGenLink] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      const [profileRes, statsData, codesData, payoutData, stripeData, taxData] = await Promise.all([
        apiFetch<{ data: ProfileData | null }>("/api/affiliate/me/profile").catch(() => null),
        apiFetch<StatsData>("/api/affiliate/me/stats").catch(() => null),
        apiFetch<{ data: ReferralCode[] }>("/api/affiliate/me/codes").catch(() => null),
        apiFetch<{ data: Payout[] }>("/api/affiliate/me/payouts").catch(() => null),
        apiFetch<{ data: { connected: boolean; payoutsEnabled: boolean } }>("/api/affiliate/me/stripe-status").catch(() => null),
        apiFetch<{ data: unknown }>("/api/affiliate/me/tax-form").catch(() => null)
      ]);

      const profileData = profileRes?.data ?? null;
      setProfile(profileData);
      if (profileData?.status === "pending") {
        setAccountPending(true);
        return;
      }

      setStats(statsData);
      setCodes(codesData?.data ?? []);
      setPayouts(payoutData?.data ?? []);
      setStripeReady(stripeData ? stripeData.data.connected && stripeData.data.payoutsEnabled : null);
      setTaxSubmitted(taxData ? taxData.data != null : null);
    } catch (e: any) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // KOL account pending admin approval: show the review state. The user can
  // still finish Stripe onboarding and submit the tax form in Settings.
  if (accountPending) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Hourglass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("pendingTitle")}</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{t("pendingDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/dashboard/settings/stripe"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {t("pendingStripeCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/settings/tax"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
            >
              {t("pendingTaxCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Referral link / promo code come from the codes endpoint (stats RPC does
  // not return them). Prefer the first active code.
  const promoCode = codes.find((c) => c.active)?.code ?? codes[0]?.code ?? "";
  const referralLink = promoCode ? `${SITE_URL}/?ref=${promoCode}` : "";

  // P1-9: generated link with Sub-ID + UTM params appended.
  const generatedLink = (() => {
    if (!referralLink) return "";
    const params = new URLSearchParams();
    if (subId) params.set("sub_id", subId);
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    const qs = params.toString();
    return qs ? `${referralLink}&${qs}` : referralLink;
  })();

  // P1-10: real QR poster download (canvas -> PNG), replaces the alert.
  const handleDownloadPoster = () => {
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkchinamed-qr.png";
    a.click();
  };

  const handleCopyGenLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedGenLink(true);
    setTimeout(() => setCopiedGenLink(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("overviewTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("overviewSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Agent tier card (only rendered when role=agent). The
              /me/profile RPC returns agentLevel + commissionRate for
              agents; for KOLs the fields are null and we hide the card
              so the header doesn't waste space on a non-applicable badge. */}
          {profile?.role === "agent" && profile.agentLevel && (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
              <Medal
                className={`h-6 w-6 ${
                  profile.agentLevel === "regional"
                    ? "text-yellow-500"
                    : profile.agentLevel === "senior"
                    ? "text-slate-400"
                    : "text-amber-700"
                }`}
              />
              <div className="text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t("tierCardTitle")}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {profile.agentLevel === "regional"
                    ? t("tierGold")
                    : profile.agentLevel === "senior"
                    ? t("tierSilver")
                    : t("tierBronze")}
                  <span className="ml-2 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                    {t("tierCommissionLabel")} {profile.commissionRate ?? 5}%
                  </span>
                </div>
              </div>
            </div>
          )}
          {referralLink && (
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              {t("generateQrPoster")}
            </button>
          )}
          {/* TODO(marketing-assets): the "Marketing Assets" button used to read
              google_drive_url from the stats response, which the backend never
              returned. Hidden until the asset-library URL is served from a real
              source (e.g. a system_config endpoint). */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statClicks")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalClicks ?? 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-7 h-7 text-sky-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statActiveCodes")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.activeCodes ?? 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statSettleable")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${fmtUsd(stats?.totalApproved)}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Coins className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statPaidOut")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${fmtUsd(stats?.totalPaid)}</div>
          </div>
        </div>
      </div>

      {/* Automatic monthly payout via Stripe Connect (replaces the manual
          withdraw UI — there is no withdraw endpoint; commissions are paid
          by the monthly batch on the 14th, $50 minimum, or manually by an
          admin). */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("autoPayoutTitle")}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("autoPayoutDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-xs font-semibold text-slate-400">{t("nextSettlementLabel")}</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {fmt.date(nextSettlementDate())}
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-xs font-semibold text-slate-400">{t("minThresholdLabel")}</div>
            <div className="text-lg font-bold text-slate-900 mt-1">${fmtUsd(MIN_PAYOUT_CENTS)}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-xs font-semibold text-slate-400">{t("settleableBalanceLabel")}</div>
            <div className="text-lg font-bold text-emerald-600 mt-1">${fmtUsd(stats?.totalApproved)}</div>
          </div>
        </div>
        {(stripeReady === false || taxSubmitted === false) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {stripeReady === false && (
              <Link
                href="/dashboard/settings/stripe"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                {t("setupStripeCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {taxSubmitted === false && (
              <Link
                href="/dashboard/settings/tax"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
              >
                {t("submitTaxCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{t("referralLinkTitle")}</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" />{t("cookieTracking")}</span>
        </div>
        {referralLink ? (
          <div className="bg-slate-50 p-3 pl-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="font-mono text-sm text-slate-700 truncate select-all">{referralLink}</div>
            <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0">
              {copiedLink ? <><Check className="w-4 h-4" /> {t("copied")}</> : <><Copy className="w-4 h-4" /> {t("copyLink")}</>}
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 pl-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">{t("noCodeYet")}</span>
            <Link href="/dashboard/codes" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0">
              {t("createCodeCta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">01</span><span>{t("stepVisit")}</span>
          <span className="text-slate-300">······</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">02</span><span>{t("stepRegister")}</span>
          <span className="text-slate-300">······</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">03</span><span className="text-slate-900 font-semibold">{t("stepLinked")}</span>
        </div>
      </div>

      {promoCode && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">{t("promoCodeTitle")}</h2>
            <span className="text-xs text-slate-400">{t("promoCodeDesc")}</span>
          </div>
          <div className="bg-slate-50 p-3 pl-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="font-mono text-sm text-slate-700 font-semibold tracking-wide truncate select-all">{promoCode}</div>
            <button onClick={handleCopyCode} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0">
              {copiedCode ? <><Check className="w-4 h-4" /> {t("copied")}</> : <><Copy className="w-4 h-4" /> {t("copyCode")}</>}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">01</span><span>{t("stepBuy")}</span>
            <span className="text-slate-300">······</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">02</span><span>{t("stepUseCode")}</span>
            <span className="text-slate-300">······</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">03</span><span className="text-slate-900 font-semibold">{t("stepLinked")}</span>
          </div>
        </div>
      )}

      {/* Sub-ID / UTM Builder (P1-9) */}
      {referralLink && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("subIdTitle")}</h2>
            <p className="text-xs text-slate-400 mt-1">{t("subIdDesc")}</p>
            <details className="mt-3 group">
              <summary className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-700 list-none flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {t("subIdHelpToggle")}
              </summary>
              <div className="mt-2 text-sm text-slate-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100 leading-relaxed">
                {t("subIdHelpText")}
              </div>
            </details>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("subIdLabel")}</label>
              <input value={subId} onChange={(e) => setSubId(e.target.value)} placeholder="tiktok_video_01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("utmSourceLabel")}</label>
              <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="tiktok" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("utmMediumLabel")}</label>
              <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="social" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("utmCampaignLabel")}</label>
              <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="summer_promo" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" />
            </div>
          </div>
          {generatedLink !== referralLink && (
            <div className="bg-slate-50 p-3 pl-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="font-mono text-xs text-slate-700 truncate select-all">{generatedLink}</div>
              <button onClick={handleCopyGenLink} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex-shrink-0">
                {copiedGenLink ? <><Check className="w-4 h-4" /> {t("copied")}</> : <><Copy className="w-4 h-4" /> {t("copyLink")}</>}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900">{t("payoutHistory")}</h2>
        {payouts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">{t("noPayouts")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("thPayoutId")}</th>
                  <th className="py-3 px-4">{t("thDate")}</th>
                  <th className="py-3 px-4">{t("thAmount")}</th>
                  <th className="py-3 px-4">{t("thMethod")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono text-xs text-slate-700">{p.id.slice(0, 12)}</td>
                    <td className="py-4 px-4 text-slate-500">{fmt.date(p.paidAt)}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">${fmtUsd(p.amountCents)}</td>
                    <td className="py-4 px-4 text-slate-600 capitalize">{p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showQrModal && referralLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 relative shadow-2xl">
            <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{t("qrModalTitle")}</h3>
              <p className="text-xs text-slate-500">{t("qrModalDesc")}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-inner flex flex-col items-center justify-center text-white space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-lg" ref={qrWrapperRef}><QRCodeCanvas value={referralLink} size={180} level="H" includeMargin={true} /></div>
              <div className="text-center">
                <div className="font-bold text-sm">{t("qrBrand")}</div>
                <div className="text-[11px] text-blue-100 mt-0.5">{t("qrSubtitle")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopyLink} className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">{t("copyLink")}</button>
              <button onClick={handleDownloadPoster} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> {t("savePoster")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
