import { apiFetch } from "./api";

export interface InAppNotification {
  id: string;
  category:
    | "commission_pending"
    | "commission_paid"
    | "commission_reversed"
    | "payout_sent"
    | "payout_failed"
    | "new_referral"
    | "system";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  link: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  commission_pending: boolean;
  commission_paid: boolean;
  commission_reversed: boolean;
  payout_sent: boolean;
  payout_failed: boolean;
  new_referral: boolean;
}

const READ_STORAGE_KEY = "lcm_kol_read_notifications_v1";

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markAsRead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getReadIds();
    set.add(id);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage quota error
  }
}

export function markAllAsRead(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const set = getReadIds();
    ids.forEach((id) => set.add(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage quota error
  }
}

export async function fetchKolNotifications(): Promise<InAppNotification[]> {
  const readSet = getReadIds();
  const notifications: InAppNotification[] = [];

  try {
    const [earningsRes, payoutsRes, statsRes] = await Promise.allSettled([
      apiFetch<{ data: { commissions?: Array<{ id: string; amount_cents: number; status: string; created_at: string; order_id?: string }> } }>("/api/affiliate/me/earnings"),
      apiFetch<{ data: { payouts?: Array<{ id: string; amount_cents: number; status: string; created_at: string; method?: string }> } }>("/api/affiliate/me/payouts"),
      apiFetch<{ data: { recent_referrals?: Array<{ id: string; created_at: string; name?: string }> } }>("/api/affiliate/me/stats"),
    ]);

    if (earningsRes.status === "fulfilled" && earningsRes.value?.data?.commissions) {
      for (const comm of earningsRes.value.data.commissions.slice(0, 15)) {
        const dollars = (comm.amount_cents / 100).toFixed(2);
        const isPaid = comm.status === "paid";
        const isReversed = comm.status === "reversed";
        const category = isPaid ? "commission_paid" : isReversed ? "commission_reversed" : "commission_pending";
        notifications.push({
          id: `comm_${comm.id}`,
          category,
          title: isPaid ? "佣金已结算入账" : isReversed ? "佣金已被撤回" : "产生新的待入账佣金",
          description: `金额: $${dollars} USD (订单 #${comm.order_id?.slice(0, 8) || comm.id.slice(0, 8)})`,
          createdAt: comm.created_at || new Date().toISOString(),
          read: readSet.has(`comm_${comm.id}`),
          link: "/kol/dashboard/earnings",
        });
      }
    }

    if (payoutsRes.status === "fulfilled" && payoutsRes.value?.data?.payouts) {
      for (const p of payoutsRes.value.data.payouts.slice(0, 10)) {
        const dollars = (p.amount_cents / 100).toFixed(2);
        const isFailed = p.status === "failed";
        notifications.push({
          id: `payout_${p.id}`,
          category: isFailed ? "payout_failed" : "payout_sent",
          title: isFailed ? "打款出金失败提醒" : "出金打款成功已汇出",
          description: `金额: $${dollars} USD · 状态: ${p.status}`,
          createdAt: p.created_at || new Date().toISOString(),
          read: readSet.has(`payout_${p.id}`),
          link: "/kol/dashboard/payouts",
        });
      }
    }

    if (statsRes.status === "fulfilled" && statsRes.value?.data?.recent_referrals) {
      for (const ref of statsRes.value.data.recent_referrals.slice(0, 10)) {
        notifications.push({
          id: `ref_${ref.id}`,
          category: "new_referral",
          title: "新客户成功绑定",
          description: `客户 ${ref.name || "保密客户"} 已通过您的推广码完成注册`,
          createdAt: ref.created_at || new Date().toISOString(),
          read: readSet.has(`ref_${ref.id}`),
          link: "/kol/dashboard/clients",
        });
      }
    }
  } catch (err) {
    console.warn("fetchKolNotifications error:", err);
  }

  // Sort by timestamp desc
  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function fetchKolNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const res = await apiFetch<{ data: Record<string, boolean> }>("/api/affiliate/me/notification-prefs");
    const raw = res?.data ?? {};
    return {
      email_enabled: raw.email_enabled !== false,
      commission_pending: raw.commission_pending !== false,
      commission_paid: raw.commission_paid !== false,
      commission_reversed: raw.commission_reversed !== false,
      payout_sent: raw.payout_sent !== false,
      payout_failed: raw.payout_failed !== false,
      new_referral: raw.new_referral !== false,
    };
  } catch {
    return {
      email_enabled: true,
      commission_pending: true,
      commission_paid: true,
      commission_reversed: true,
      payout_sent: true,
      payout_failed: true,
      new_referral: true,
    };
  }
}

export async function updateKolNotificationPrefs(
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  await apiFetch("/api/affiliate/me/notification-prefs", {
    method: "PATCH",
    body: { prefs },
  });
}
