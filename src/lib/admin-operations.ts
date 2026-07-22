import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/shop";

export type PaymentSettings = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  westernUnionReceiverName: string;
  westernUnionCountry: string;
  westernUnionCity: string;
  westernUnionPhone: string;
  westernUnionInstructions: string;
};

export type AdminOrderEvent = {
  id: string;
  orderId: string;
  eventType: string;
  title: string;
  detail: string | null;
  statusFrom: OrderStatus | null;
  statusTo: OrderStatus | null;
  actorType: "customer" | "admin" | "system";
  createdAt: string;
};

export type AdminOrderRefund = {
  id: string;
  orderId: string;
  amountThb: number;
  reason: string;
  status: "pending" | "completed" | "cancelled";
  transferReference: string | null;
  restocked: boolean;
  requestedAt: string;
  completedAt: string | null;
};

export type AdminNotification = {
  id: string;
  orderId: string | null;
  kind: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

const defaultPaymentSettings: PaymentSettings = {
  bankName: "ธนาคารกสิกรไทย",
  bankAccountName: "จุฑารัตน์ อินทรณรงค์",
  bankAccountNumber: "0348696793",
  westernUnionReceiverName: "",
  westernUnionCountry: "Thailand",
  westernUnionCity: "",
  westernUnionPhone: "",
  westernUnionInstructions: "",
};

export async function getAdminSettings() {
  const supabase = await createClient();
  const [{ data: rows }, operationsResult, loginResult] = await Promise.all([
    supabase.from("app_settings").select("key, value").in("key", ["bank_transfer", "western_union"]),
    supabase.rpc("get_admin_operations_status"),
    supabase.from("admin_login_events").select("created_at, user_agent").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const settings = { ...defaultPaymentSettings };
  for (const row of rows ?? []) {
    const value = row.value as Record<string, unknown>;
    if (row.key === "bank_transfer") {
      settings.bankName = String(value.bank_name ?? settings.bankName);
      settings.bankAccountName = String(value.account_name ?? settings.bankAccountName);
      settings.bankAccountNumber = String(value.account_number ?? settings.bankAccountNumber);
    }
    if (row.key === "western_union") {
      settings.westernUnionReceiverName = String(value.receiver_name ?? "");
      settings.westernUnionCountry = String(value.country ?? "Thailand");
      settings.westernUnionCity = String(value.city ?? "");
      settings.westernUnionPhone = String(value.phone ?? "");
      settings.westernUnionInstructions = String(value.instructions ?? "");
    }
  }

  const operations = operationsResult.data as { cron_configured?: boolean } | null;
  return {
    payment: settings,
    cronConfigured: operations?.cron_configured === true,
    lastLoginAt: loginResult.data?.created_at ?? null,
    lastLoginUserAgent: loginResult.data?.user_agent ?? null,
  };
}

export async function getAdminOrderActivity() {
  const supabase = await createClient();
  const [eventsResult, refundsResult] = await Promise.all([
    supabase
      .from("order_events")
      .select("id, order_id, event_type, title, detail, status_from, status_to, actor_type, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("order_refunds")
      .select("id, order_id, amount_thb, reason, status, transfer_reference, restocked, requested_at, completed_at")
      .order("requested_at", { ascending: false }),
  ]);

  const events: AdminOrderEvent[] = (eventsResult.data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    title: row.title,
    detail: row.detail,
    statusFrom: row.status_from as OrderStatus | null,
    statusTo: row.status_to as OrderStatus | null,
    actorType: row.actor_type as AdminOrderEvent["actorType"],
    createdAt: row.created_at,
  }));
  const refunds: AdminOrderRefund[] = (refundsResult.data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    amountThb: Number(row.amount_thb),
    reason: row.reason,
    status: row.status as AdminOrderRefund["status"],
    transferReference: row.transfer_reference,
    restocked: row.restocked,
    requestedAt: row.requested_at,
    completedAt: row.completed_at,
  }));

  return { events, refunds };
}

export async function getAdminNotifications(limit = 100): Promise<AdminNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_notifications")
    .select("id, order_id, kind, title, body, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function getUnreadAdminNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  return count ?? 0;
}
