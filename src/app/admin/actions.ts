"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;

  if (!name) {
    return { error: "クライアント名を入力してください" };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ name, industry })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  redirect(`/admin/clients/${data.id}`);
}

export async function deleteClient(clientId: string) {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  redirect("/admin");
}
