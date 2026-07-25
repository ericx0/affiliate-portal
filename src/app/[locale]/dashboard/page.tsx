"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import {
  Users,
  FileCheck,
  Wallet,
  Coins,
  Copy,
  Check,
  QrCode,
  Download,
  FolderDown,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  CreditCard,
  Building2,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface StatsData {
  invite_count?: number;
  valid_orders?: number;
  withdrawable_amount?: number;
  paid_out_amount?: number;
  referral_link?: string;
  promo_code?: string;
  google_drive_url?: string;
  totalPaid?: number;
  totalPending?: number;
  totalApproved?: number;
  activeCodes?: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payout_method: string;
  payout_details: string;
}

export default function DashboardOverview() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("paypal");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const data = await apiFetch<StatsData>("/api/affiliate/me/stats").catch(
        () => null,
      );

      setStats({
        invite_count: data?.invite_count ?? 0,
        valid_orders: data?.valid_orders ?? 0,
        withdrawable_amount: data?.withdrawable_amount ?? 0,
        paid_out_amount: data?.paid_out_amount ?? 0,
        referral_link:
          data?.referral_link ||
          (data?.promo_code
            ? `https://linkchinamed.com/?ref=${data.promo_code}`
            : ""),
        promo_code: data?.promo_code ?? "",
        google_drive_url: data?.google_drive_url ?? "",
      });

      const payoutData = await apiFetch<PayoutRecord[]>(
        "/api/affiliate/me/payouts",
      ).catch(() => []);
      setPayouts(payoutData || []);
    } catch (e: any) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!stats?.referral_link) return;
    navigator.clipboard.writeText(stats.referral_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!stats?.promo_code) return;
    navigator.clipboard.writeText(stats.promo_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setWithdrawMsg(t("invalidAmount"));
      return;
    }
    try {
      setSubmittingWithdraw(true);
      setWithdrawMsg("");
      await apiFetch("/api/affiliate/me/withdraw", {
        method: "POST",
        body: {
          amount: Number(withdrawAmount),
          method: payoutMethod,
          details: payoutDetails,
        },
      });
      setWithdrawMsg(t("withdrawSubmitted"));
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawMsg("");
        fetchDashboardData();
      }, 1800);
    } catch (err: any) {
      setWithdrawMsg(`${t("submitFailed")}${err.message || ""}`);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const referralLink = stats?.referral_link ?? "";
  const promoCode = stats?.promo_code ?? "";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("overviewTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("overviewSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            {t("generateQrPoster")}
          </button>
          <a
            href={stats?.google_drive_url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors shadow-sm"
          >
            <FolderDown className="w-4 h-4 text-blue-600" />
            {t("assetLibrary")}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statInvites")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.invite_count || 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-7 h-7 text-sky-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statOrders")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.valid_orders || 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">{t("statWithdrawable")}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">${(stats?.withdrawable_amount || 0).toFixed(2)}</div>
            </div>
          </div>
          <button onClick={() => setShowWithdrawModal(true)} className="px-4 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full font-bold text-xs transition-colors shadow-sm flex-shrink-0">{t("withdraw")}</button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Coins className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">{t("statPaidOut")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${(stats?.paid_out_amount || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{t("referralLinkTitle")}</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" />{t("cookieTracking")}</span>
        </div>
        <div className="bg-slate-50 p-3 pl-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="font-mono text-sm text-slate-700 truncate select-all">{referralLink}</div>
          <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0">
            {copiedLink ? <><Check className="w-4 h-4" /> {t("copied")}</> : <><Copy className="w-4 h-4" /> {t("copyLink")}</>}
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">01</span><span>{t("stepVisit")}</span>
          <span className="text-slate-300">······</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">02</span><span>{t("stepRegister")}</span>
          <span className="text-slate-300">······</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">03</span><span className="text-slate-900 font-semibold">{t("stepLinked")}</span>
        </div>
      </div>

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

      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-300 border border-white/10 backdrop-blur-sm"><FolderDown className="w-3.5 h-3.5 text-blue-400" />{t("assetBadge")}</div>
          <h3 className="text-2xl font-bold">{t("assetTitle")}</h3>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">{t("assetDesc")}</p>
        </div>
        <a href={stats?.google_drive_url || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/30 flex-shrink-0">{t("openDrive")}<ExternalLink className="w-4 h-4" /></a>
      </div>

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
                  <th className="py-3 px-4">{t("thStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono text-xs text-slate-700">{p.id.slice(0, 8)}</td>
                    <td className="py-4 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">${p.amount.toFixed(2)}</td>
                    <td className="py-4 px-4 text-slate-600 capitalize">{p.payout_method}</td>
                    <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : p.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{p.status === "paid" ? t("statusPaid") : p.status === "pending" ? t("statusPending") : p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 relative shadow-2xl">
            <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{t("qrModalTitle")}</h3>
              <p className="text-xs text-slate-500">{t("qrModalDesc")}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-inner flex flex-col items-center justify-center text-white space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-lg"><QRCodeSVG value={referralLink} size={180} level="H" includeMargin={true} /></div>
              <div className="text-center">
                <div className="font-bold text-sm">{t("qrBrand")}</div>
                <div className="text-[11px] text-blue-100 mt-0.5">{t("qrSubtitle")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopyLink} className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">{t("copyLink")}</button>
              <button onClick={() => alert(t("qrSaveHint"))} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> {t("savePoster")}</button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl">
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("withdrawModalTitle")}</h3>
              <p className="text-xs text-slate-500 mt-1">{t("withdrawBalance")} <span className="font-bold text-emerald-600">${(stats?.withdrawable_amount || 0).toFixed(2)}</span></p>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("withdrawAmountLabel")}</label>
                <input type="number" step="0.01" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("withdrawMethodLabel")}</label>
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="paypal">{t("methodPaypal")}</option>
                  <option value="wire">{t("methodWire")}</option>
                  <option value="wise">{t("methodWise")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t("withdrawDetailsLabel")}</label>
                <textarea rows={2} placeholder={payoutMethod === "paypal" ? t("ppPaypalPlaceholder") : t("ppBankPlaceholder")} value={payoutDetails} onChange={(e) => setPayoutDetails(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {withdrawMsg && <div className={`text-xs p-3 rounded-xl font-medium ${withdrawMsg.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{withdrawMsg}</div>}
              <button type="submit" disabled={submittingWithdraw} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2">{submittingWithdraw ? <Loader2 className="w-4 h-4 animate-spin" /> : t("submitWithdraw")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
