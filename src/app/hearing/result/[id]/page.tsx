import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { diagnose, type CategoryScore } from "@/lib/scoring";
import type { HearingSubmission } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HearingResultPage({
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

  const submittedAt = new Date(s.created_at).toLocaleDateString("ja-JP");

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
            Growth Diagnosis
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {s.company_name} 様 集客導線診断レポート
          </h1>
          <p className="mt-2 text-sm text-slate-500">回答日：{submittedAt}</p>
        </header>

        {/* Total score */}
        <section className="flex flex-col items-center pt-12 sm:flex-row sm:gap-10">
          <ScoreCircle total={d.total} grade={d.grade} />
          <div className="mt-6 text-center sm:mt-0 sm:flex-1 sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              総合スコア
            </p>
            <p className="mt-2 text-base leading-relaxed text-slate-700">
              {gradeBlurb(d.grade)}
            </p>
          </div>
        </section>

        {/* Category bars */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            カテゴリ別スコア
          </h2>
          <ul className="mt-4 space-y-4">
            {d.categories.map((c) => (
              <CategoryBar key={c.key} category={c} />
            ))}
          </ul>
        </section>

        {/* Recommendations */}
        {d.highlights.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              NY33 からの改善提案
            </h2>
            <ol className="mt-4 space-y-3">
              {d.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700">{h}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Per-category recommendations */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            カテゴリ別の詳しい改善ヒント
          </h2>
          <div className="mt-4 space-y-4">
            {d.categories.map((c) =>
              c.recommendations.length === 0 ? null : (
                <div
                  key={c.key}
                  className="rounded-lg border border-slate-200 bg-slate-50/40 p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {c.label}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {c.score}/{c.max} 点
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                    {c.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-xl bg-emerald-600 p-8 text-white">
          <h2 className="text-lg font-semibold">
            この診断をもとに、{s.company_name} 様専用の改善プランをお作りします
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50">
            診断結果はすでに NY33 にも届いています。
            数日以内に担当よりご連絡を差し上げます。お急ぎの場合は下記までご連絡ください。
          </p>
          <p className="mt-4 text-sm text-emerald-50">
            ご相談：NY33 担当まで（このページの URL を共有していただけるとスムーズです）
          </p>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          NY33 Growth Board
        </footer>
      </div>
    </div>
  );
}

function gradeBlurb(grade: string): string {
  switch (grade) {
    case "S":
      return "集客導線が非常によく整っています。次は数字を見ながら個別最適を進める段階です。";
    case "A":
      return "基盤は整っています。弱い1〜2カテゴリを強化すれば、大きく伸びる余地があります。";
    case "B":
      return "改善余地が複数あります。優先度の高い順に着手すると、3ヶ月で景色が変わります。";
    case "C":
      return "集客導線の整備が途中の段階です。土台から整えれば、半年で別物になります。";
    default:
      return "改善余地が大きい状態です。基本の3点（HP / LINE / 予約導線）から整備すれば、すぐに反応が出ます。";
  }
}

function ScoreCircle({ total, grade }: { total: number; grade: string }) {
  const pct = Math.max(0, Math.min(100, total));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="relative grid h-48 w-48 place-items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-semibold tracking-tight text-slate-900">
          {total}
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
        <span className="mt-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
          Grade {grade}
        </span>
      </div>
    </div>
  );
}

function CategoryBar({ category }: { category: CategoryScore }) {
  const pct = (category.score / category.max) * 100;
  const color =
    category.score >= 16
      ? "bg-emerald-500"
      : category.score >= 10
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <li>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-900">{category.label}</span>
        <span className="text-xs text-slate-500">
          {category.score} / {category.max} 点
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={"h-full " + color} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}
