"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function str(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function num(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function bool(v: FormDataEntryValue | null): boolean | null {
  if (v === null) return null;
  const s = String(v);
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
}

export async function submitHearing(formData: FormData) {
  const company_name = String(formData.get("company_name") ?? "").trim();
  if (!company_name) {
    return { error: "会社名・サロン名は必須です" };
  }

  const payload = {
    company_name,
    industry: str(formData.get("industry")),
    contact_name: str(formData.get("contact_name")),
    contact_email: str(formData.get("contact_email")),
    contact_phone: str(formData.get("contact_phone")),
    contact_line: str(formData.get("contact_line")),
    website_url: str(formData.get("website_url")),

    main_product: str(formData.get("main_product")),
    price_range: str(formData.get("price_range")),
    target_customer: str(formData.get("target_customer")),

    has_website: bool(formData.get("has_website")),
    has_gbp: bool(formData.get("has_gbp")),
    gbp_review_count: num(formData.get("gbp_review_count")),
    gbp_rating: num(formData.get("gbp_rating")),
    has_line: bool(formData.get("has_line")),
    line_subscriber_count: num(formData.get("line_subscriber_count")),
    has_instagram: bool(formData.get("has_instagram")),
    instagram_follower_count: num(formData.get("instagram_follower_count")),
    booking_method: str(formData.get("booking_method")),
    has_ads: bool(formData.get("has_ads")),

    monthly_visitors: num(formData.get("monthly_visitors")),
    monthly_bookings: num(formData.get("monthly_bookings")),
    monthly_revenue_range: str(formData.get("monthly_revenue_range")),
    repeat_rate_percent: num(formData.get("repeat_rate_percent")),

    biggest_issue: str(formData.get("biggest_issue")),
    six_month_goal: str(formData.get("six_month_goal")),
    past_attempts: str(formData.get("past_attempts")),
  };

  const { data, error } = await supabase
    .from("hearing_submissions")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/hearing/result/${data.id}`);
}
