"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Users,
  CreditCard,
  Settings,
  Check,
} from "lucide-react";
import { useRouter, Link } from "@/navigation";
import {
  fetchKolNotifications,
  markAsRead,
  markAllAsRead,
  type InAppNotification,
} from "@/lib/notifications";

export default function NotificationBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const data = await fetchKolNotifications();
      setItems(data);
    } catch {
      // Best-effort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 60s for new background events
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, []);

  // Click outside & Escape key listeners
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleItemClick = (item: InAppNotification) => {
    markAsRead(item.id);
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
    setOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead(items.map((n) => n.id));
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getCategoryIcon = (cat: InAppNotification["category"]) => {
    switch (cat) {
      case "commission_paid":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "commission_pending":
        return <DollarSign className="w-4 h-4 text-brand-600" />;
      case "commission_reversed":
      case "payout_failed":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "payout_sent":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "new_referral":
        return <Users className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t("justNow");
      if (diffMins < 60) return `${diffMins}m ${t("ago")}`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ${t("ago")}`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ${t("ago")}`;
      return d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 hover:text-brand-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label={t("title")}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">{t("title")}</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-brand-50 text-brand-700 rounded-full">
                  {unreadCount} {t("unread")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t("loading")}...
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">{t("noNotifications")}</p>
                <p className="text-xs mt-1 text-slate-400">{t("noNotificationsSub")}</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !item.read ? "bg-brand-50/30" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-slate-100">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !item.read
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/kol/dashboard/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              {t("preferences")}
            </Link>
            <Link
              href="/kol/dashboard/earnings"
              onClick={() => setOpen(false)}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              {t("viewEarnings")} &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
