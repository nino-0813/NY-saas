import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { diagnose, type CategoryScore } from "@/lib/scoring";
import type { HearingSubmission } from "@/lib/supabase/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AdminNoteForm,
  ConvertButton,
  DeleteButton,
  StatusSelect,
} from "./_components/admin-actions";

export const dynamic = "force-dynamic";

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabase
    .from("hearing_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const s = data as HearingSubmission;
  const d = diagnose(s);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/hearings" className="hover:text-slate-900">
          ヒアリング
        </Link>
        <span>/</span>
        <span className="text-slate-900">{s.company_name}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {s.company_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {s.industry ?? "業種未回答"} ・ 回答日{" "}
            {new Date(s.created_at).toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/hearing/result/${s.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            プロスペクト向け診断ページ ↗
          </a>
          <StatusSelect id={s.id} status={s.status} />
          <ConvertButton
            id={s.id}
            alreadyConverted={s.status === "converted"}
            convertedClientId={s.converted_to_client_id}
          />
        </div>
      </div>

      {/* Score summary */}
      <Card>
        <CardHeader>
          <CardTitle>診断スコア</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-slate-500">総合</p>
              <p className="text-3xl font-semibold">
                {d.total}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  / 100
                </span>
                <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {d.grade}
                </span>
              </p>
            </div>
            <div className="flex-1 min-w-[280px] space-y-2">
              {d.categories.map((c) => (
                <CategoryRow key={c.key} c={c} />
              ))}
            </div>
          </div>

          {d.highlights.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                上位の改善提案（プロスペクトにも表示）
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {d.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin note */}
      <Card>
        <CardHeader>
          <CardTitle>メモ（管理者のみ）</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminNoteForm id={s.id} defaultValue={s.admin_note ?? ""} />
        </CardContent>
      </Card>

      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle>回答内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <ResponseSection title="A. 会社情報">
            <Row label="会社名・サロン名" value={s.company_name} />
            <Row label="業種" value={s.industry} />
            <Row label="ご担当者名" value={s.contact_name} />
            <Row label="メール" value={s.contact_email} />
            <Row label="電話" value={s.contact_phone} />
            <Row label="LINE" value={s.contact_line} />
            <Row label="公式サイト URL" value={s.website_url} />
          </ResponseSection>

          <ResponseSection title="B. 商品とお客様">
            <Row label="メイン商品・サービス" value={s.main_product} />
            <Row label="客単価" value={priceRangeLabel(s.price_range)} />
            <Row label="ターゲット顧客" value={s.target_customer} />
          </ResponseSection>

          <ResponseSection title="C. 集客導線の現状">
            <Row label="公式サイト・LP" value={boolLabel(s.has_website)} />
            <Row label="GBP 整備" value={boolLabel(s.has_gbp)} />
            <Row label="GBP 口コミ件数" value={s.gbp_review_count} />
            <Row label="GBP 平均評価" value={s.gbp_rating} />
            <Row label="LINE 公式" value={boolLabel(s.has_line)} />
            <Row label="LINE 登録者数" value={s.line_subscriber_count} />
            <Row label="Instagram 運用" value={boolLabel(s.has_instagram)} />
            <Row
              label="Instagram フォロワー数"
              value={s.instagram_follower_count}
            />
            <Row label="予約方法" value={bookingMethodLabel(s.booking_method)} />
            <Row label="広告運用" value={boolLabel(s.has_ads)} />
          </ResponseSection>

          <ResponseSection title="D. 数字">
            <Row label="月間サイト訪問数" value={s.monthly_visitors} />
            <Row label="月間予約・問い合わせ数" value={s.monthly_bookings} />
            <Row
              label="月商イメージ"
              value={revenueRangeLabel(s.monthly_revenue_range)}
            />
            <Row label="リピート率" value={percentLabel(s.repeat_rate_percent)} />
          </ResponseSection>

          <ResponseSection title="E. 課題と目標">
            <Row label="一番の課題" value={s.biggest_issue} multiline />
            <Row label="6 ヶ月後の目標" value={s.six_month_goal} multiline />
            <Row label="これまで試したこと" value={s.past_attempts} multiline />
          </ResponseSection>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <DeleteButton id={s.id} />
      </div>
    </div>
  );
}

function CategoryRow({ c }: { c: CategoryScore }) {
  const pct = (c.score / c.max) * 100;
  const color =
    c.score >= 16
      ? "bg-emerald-500"
      : c.score >= 10
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-700">{c.label}</span>
        <span className="text-slate-500">
          {c.score} / {c.max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={"h-full " + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ResponseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[200px_1fr]">
        {children}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | number | null | undefined;
  multiline?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "number"
        ? value.toLocaleString("ja-JP")
        : value;
  const isEmpty = display === "—";

  return (
    <>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={
          (multiline ? "whitespace-pre-wrap " : "") +
          (isEmpty ? "text-slate-400 " : "text-slate-900 ") +
          "text-sm sm:border-l sm:border-slate-100 sm:pl-4"
        }
      >
        {display}
      </dd>
    </>
  );
}

function boolLabel(v: boolean | null): string | null {
  if (v === true) return "あり";
  if (v === false) return "なし";
  return null;
}

function priceRangeLabel(v: string | null): string | null {
  if (!v) return null;
  const map: Record<string, string> = {
    under_3000: "〜3,000円",
    "3000_10000": "3,000〜10,000円",
    "10000_30000": "10,000〜30,000円",
    "30000_100000": "30,000〜100,000円",
    over_100000: "100,000円以上",
  };
  return map[v] ?? v;
}

function revenueRangeLabel(v: string | null): string | null {
  if (!v) return null;
  const map: Record<string, string> = {
    under_50: "〜50万円",
    "50_100": "50〜100万円",
    "100_300": "100〜300万円",
    "300_1000": "300〜1,000万円",
    over_1000: "1,000万円以上",
  };
  return map[v] ?? v;
}

function bookingMethodLabel(v: string | null): string | null {
  if (!v) return null;
  const map: Record<string, string> = {
    both: "予約フォーム + LINE 予約",
    form: "予約フォームあり",
    line: "LINE 予約あり",
    phone: "電話のみ",
    none: "予約導線なし",
  };
  return map[v] ?? v;
}

function percentLabel(v: number | null): string | null {
  if (v == null) return null;
  return `${v}%`;
}
