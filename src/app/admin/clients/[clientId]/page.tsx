import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { currentMonthIso } from "@/lib/month";
import type {
  Client,
  Improvement,
  Kpi,
  NextAction,
  Report,
} from "@/lib/supabase/types";
import { ClientDetailTabs } from "./_components/client-detail-tabs";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const month = currentMonthIso();

  const [clientRes, kpiRes, improvementsRes, nextActionsRes, reportsRes] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
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
        .order("done_at", { ascending: false })
        .limit(50),
      supabase
        .from("next_actions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("reports")
        .select("*")
        .eq("client_id", clientId)
        .order("month", { ascending: false })
        .limit(24),
    ]);

  if (clientRes.error || !clientRes.data) {
    if (clientRes.error?.code === "PGRST116" || !clientRes.data) notFound();
  }

  const client = clientRes.data as Client;
  const kpi = (kpiRes.data ?? null) as Kpi | null;
  const improvements = (improvementsRes.data ?? []) as Improvement[];
  const nextActions = (nextActionsRes.data ?? []) as NextAction[];
  const reports = (reportsRes.data ?? []) as Report[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-slate-900">
          クライアント
        </Link>
        <span>/</span>
        <span className="text-slate-900">{client.name}</span>
      </div>

      <ClientDetailTabs
        client={client}
        month={month}
        kpi={kpi}
        improvements={improvements}
        nextActions={nextActions}
        reports={reports}
      />
    </div>
  );
}
