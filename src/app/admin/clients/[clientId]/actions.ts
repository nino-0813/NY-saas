"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type {
  ClientStatus,
  Improvement,
  ImprovementSnapshot,
  Kpi,
  KpiSnapshot,
  NextAction,
  NextActionPriority,
  NextActionSnapshot,
  NextActionStatus,
} from "@/lib/supabase/types";

function num(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function str(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// ---------- client basic info ----------

export async function updateClient(clientId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "クライアント名は必須です" };

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      industry: str(formData.get("industry")),
      status: (str(formData.get("status")) ?? "active") as ClientStatus,
      monthly_goal: str(formData.get("monthly_goal")),
      current_issue: str(formData.get("current_issue")),
    })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteClient(clientId: string) {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  redirect("/admin");
}

// ---------- KPI ----------

export async function upsertKpi(clientId: string, formData: FormData) {
  const month = String(formData.get("month") ?? "").trim();
  if (!/^\d{4}-\d{2}-01$/.test(month)) {
    return { error: "月の形式が不正です（YYYY-MM-01）" };
  }

  const { error } = await supabase.from("kpis").upsert(
    {
      client_id: clientId,
      month,
      site_visits: num(formData.get("site_visits")),
      line_signups: num(formData.get("line_signups")),
      inquiries: num(formData.get("inquiries")),
      expected_revenue: num(formData.get("expected_revenue")),
      improvements_count: num(formData.get("improvements_count")),
      estimated_impact: str(formData.get("estimated_impact")),
    },
    { onConflict: "client_id,month" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

// ---------- improvements ----------

export async function addImprovement(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "タイトルを入力してください" };

  const done_at = str(formData.get("done_at")) ?? new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("improvements").insert({
    client_id: clientId,
    title,
    description: str(formData.get("description")),
    purpose: str(formData.get("purpose")),
    result: str(formData.get("result")),
    done_at,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

export async function deleteImprovement(clientId: string, id: string) {
  const { error } = await supabase.from("improvements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

// ---------- next actions ----------

export async function addNextAction(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "タイトルを入力してください" };

  const { error } = await supabase.from("next_actions").insert({
    client_id: clientId,
    title,
    expected_effect: str(formData.get("expected_effect")),
    priority: (str(formData.get("priority")) ?? "medium") as NextActionPriority,
    status: (str(formData.get("status")) ?? "todo") as NextActionStatus,
    due_date: str(formData.get("due_date")),
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

export async function updateNextActionStatus(
  clientId: string,
  id: string,
  status: NextActionStatus,
) {
  const { error } = await supabase
    .from("next_actions")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

export async function deleteNextAction(clientId: string, id: string) {
  const { error } = await supabase.from("next_actions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

// ---------- monthly reports ----------

function nextMonthIso(month: string): string {
  const [y, m] = month.split("-").map(Number);
  // m is 1-indexed; new Date(y, m, 1) gives the 1st of the next month.
  const d = new Date(y, m, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

async function buildSnapshots(clientId: string, month: string) {
  const monthEnd = nextMonthIso(month);

  const [kpiRes, impRes, naRes] = await Promise.all([
    supabase
      .from("kpis")
      .select("*")
      .eq("client_id", clientId)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("improvements")
      .select("*")
      .eq("client_id", clientId)
      .gte("done_at", month)
      .lt("done_at", monthEnd)
      .order("done_at", { ascending: true }),
    supabase
      .from("next_actions")
      .select("*")
      .eq("client_id", clientId)
      .neq("status", "done")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const kpi = (kpiRes.data ?? null) as Kpi | null;
  const improvements = (impRes.data ?? []) as Improvement[];
  const nextActions = (naRes.data ?? []) as NextAction[];

  const kpi_snapshot: KpiSnapshot | null = kpi
    ? {
        site_visits: kpi.site_visits,
        line_signups: kpi.line_signups,
        inquiries: kpi.inquiries,
        expected_revenue: kpi.expected_revenue,
        improvements_count: kpi.improvements_count,
        estimated_impact: kpi.estimated_impact,
      }
    : null;

  const improvements_snapshot: ImprovementSnapshot[] = improvements.map((i) => ({
    title: i.title,
    description: i.description,
    purpose: i.purpose,
    result: i.result,
    done_at: i.done_at,
  }));

  const next_actions_snapshot: NextActionSnapshot[] = nextActions.map((n) => ({
    title: n.title,
    expected_effect: n.expected_effect,
    priority: n.priority,
    due_date: n.due_date,
  }));

  return { kpi_snapshot, improvements_snapshot, next_actions_snapshot };
}

export async function saveReport(
  clientId: string,
  formData: FormData,
  opts: { publish?: boolean; unpublish?: boolean } = {},
) {
  const month = String(formData.get("month") ?? "").trim();
  if (!/^\d{4}-\d{2}-01$/.test(month)) {
    return { error: "月の形式が不正です（YYYY-MM-01）" };
  }

  const snapshots = await buildSnapshots(clientId, month);

  // Determine published flag based on opts and current state
  let published: boolean | undefined;
  let published_at: string | null | undefined;

  if (opts.publish) {
    published = true;
    // Set published_at only if not already published
    const { data: existing } = await supabase
      .from("reports")
      .select("published, published_at")
      .eq("client_id", clientId)
      .eq("month", month)
      .maybeSingle();
    published_at =
      existing?.published && existing.published_at
        ? existing.published_at
        : new Date().toISOString();
  } else if (opts.unpublish) {
    published = false;
    published_at = null;
  }

  const payload: Record<string, unknown> = {
    client_id: clientId,
    month,
    highlight: str(formData.get("highlight")),
    achievements: str(formData.get("achievements")),
    implemented_summary: str(formData.get("implemented_summary")),
    next_focus: str(formData.get("next_focus")),
    ...snapshots,
  };
  if (published !== undefined) payload.published = published;
  if (published_at !== undefined) payload.published_at = published_at;

  const { error } = await supabase
    .from("reports")
    .upsert(payload, { onConflict: "client_id,month" });

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}

export async function deleteReport(clientId: string, reportId: string) {
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true as const };
}
