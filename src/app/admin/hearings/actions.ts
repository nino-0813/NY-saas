"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { HearingStatus } from "@/lib/supabase/types";

export async function updateHearingStatus(id: string, status: HearingStatus) {
  const { error } = await supabase
    .from("hearing_submissions")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/hearings");
  revalidatePath(`/admin/hearings/${id}`);
  return { ok: true as const };
}

export async function updateHearingNote(id: string, formData: FormData) {
  const note = String(formData.get("admin_note") ?? "").trim();
  const { error } = await supabase
    .from("hearing_submissions")
    .update({ admin_note: note === "" ? null : note })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/hearings/${id}`);
  return { ok: true as const };
}

export async function deleteHearing(id: string) {
  const { error } = await supabase
    .from("hearing_submissions")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/hearings");
  redirect("/admin/hearings");
}

export async function convertHearingToClient(id: string) {
  const { data: hearing, error: fetchErr } = await supabase
    .from("hearing_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!hearing) return { error: "ヒアリングが見つかりません" };
  if (hearing.converted_to_client_id) {
    return {
      error: "すでにクライアントに変換済みです",
      clientId: hearing.converted_to_client_id as string,
    };
  }

  const { data: client, error: insertErr } = await supabase
    .from("clients")
    .insert({
      name: hearing.company_name,
      industry: hearing.industry,
      monthly_goal: hearing.six_month_goal,
      current_issue: hearing.biggest_issue,
    })
    .select("id")
    .single();

  if (insertErr) return { error: insertErr.message };

  const { error: updateErr } = await supabase
    .from("hearing_submissions")
    .update({ status: "converted", converted_to_client_id: client.id })
    .eq("id", id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/admin/hearings");
  revalidatePath("/admin");
  redirect(`/admin/clients/${client.id}`);
}
