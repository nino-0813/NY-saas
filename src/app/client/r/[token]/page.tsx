import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatMonthLabel } from "@/lib/month";
import type {
  Client,
  ImprovementSnapshot,
  KpiSnapshot,
  NextActionSnapshot,
  Report,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PublicClientReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();

  if (!client) notFound();
  const c = client as Client;

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("client_id", c.id)
    .eq("published", true)
    .order("month", { ascending: false })
    .limit(24);

  const allReports = (reports ?? []) as Report[];
  const latest = allReports[0] ?? null;
  const past = allReports.slice(1);

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Letterhead */}
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
            Growth Report
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.name}
          </h1>
          {latest && (
            <p className="mt-3 font-serif text-lg text-slate-600">
              {formatMonthLabel(latest.month)}号
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            発行：NY33 Growth Board
          </p>
        </header>

        {!latest ? (
          <EmptyState />
        ) : (
          <ReportBody report={latest} client={c} />
        )}

        {past.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-6">
            <h2 className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Past Reports
            </h2>
            <ul className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              {past.map((r) => (
                <li key={r.id}>{formatMonthLabel(r.month)}号</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">
              ※ 過去のレポートを見たい場合は担当（NY33）までお声がけください。
            </p>
          </section>
        )}

        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          このレポートは NY33 Growth Board により生成されています。
        </footer>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
      <p className="text-sm text-slate-600">
        最新のレポートを準備中です。
      </p>
      <p className="mt-1 text-xs text-slate-400">
        月末に NY33 が発行します。少々お待ちください。
      </p>
    </div>
  );
}

function ReportBody({ report, client }: { report: Report; client: Client }) {
  const kpi = report.kpi_snapshot;
  const improvements = report.improvements_snapshot ?? [];
  const nextActions = report.next_actions_snapshot ?? [];

  return (
    <div className="space-y-12 pt-10">
      {/* Highlight + Achievements */}
      <section>
        <SectionLabel>今月のハイライト</SectionLabel>
        {report.highlight ? (
          <p className="mt-3 text-xl font-medium leading-snug text-slate-900">
            {report.highlight}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">（記載なし）</p>
        )}

        {report.achievements && (
          <div className="mt-6 rounded-lg bg-emerald-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              主な成果
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950">
              {report.achievements}
            </p>
          </div>
        )}
      </section>

      {/* KPI cards */}
      {kpi && hasAnyKpi(kpi) && (
        <section>
          <SectionLabel>今月の数字</SectionLabel>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="サイト訪問"
              value={kpi.site_visits}
              suffix=""
            />
            <KpiCard
              label="LINE登録"
              value={kpi.line_signups}
              suffix="人"
            />
            <KpiCard
              label="問い合わせ・予約"
              value={kpi.inquiries}
              suffix="件"
            />
            <KpiCard
              label="売上見込み"
              value={kpi.expected_revenue}
              suffix="円"
              format="yen"
            />
            <KpiCard
              label="実施した改善"
              value={kpi.improvements_count}
              suffix="件"
            />
          </div>
          {kpi.estimated_impact && (
            <p className="mt-3 text-xs text-slate-500">
              {kpi.estimated_impact}
            </p>
          )}
        </section>
      )}

      {/* Improvements timeline */}
      <section>
        <SectionLabel>今月実施した改善</SectionLabel>
        {report.implemented_summary && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {report.implemented_summary}
          </p>
        )}
        {improvements.length > 0 ? (
          <ol className="mt-5 space-y-5 border-l border-slate-200 pl-5">
            {improvements.map((imp, i) => (
              <ImprovementItem key={i} item={imp} />
            ))}
          </ol>
        ) : (
          !report.implemented_summary && (
            <p className="mt-3 text-sm text-slate-400">（記載なし）</p>
          )
        )}
      </section>

      {/* Next actions */}
      <section>
        <SectionLabel>次に取り組むこと</SectionLabel>
        {report.next_focus && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {report.next_focus}
          </p>
        )}
        {nextActions.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {nextActions.map((na, i) => (
              <NextActionItem key={i} item={na} />
            ))}
          </ul>
        )}
        {nextActions.length === 0 && !report.next_focus && (
          <p className="mt-3 text-sm text-slate-400">（記載なし）</p>
        )}
      </section>

      {/* Contact (placeholder) */}
      <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
        <SectionLabel>ご質問・ご相談</SectionLabel>
        <p className="mt-2 text-sm text-slate-600">
          内容についてのご質問や次月の方針へのご要望は、
          NY33 担当（{client.name}担当）までお気軽にお声がけください。
        </p>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </h2>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  format,
}: {
  label: string;
  value: number | null | undefined;
  suffix: string;
  format?: "yen";
}) {
  const display =
    value == null
      ? "—"
      : format === "yen"
        ? formatYen(value)
        : value.toLocaleString("ja-JP");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {display}
        {value != null && format !== "yen" && suffix && (
          <span className="ml-1 text-sm font-normal text-slate-500">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function ImprovementItem({ item }: { item: ImprovementSnapshot }) {
  return (
    <li className="relative">
      <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
      <p className="text-xs text-slate-500">{item.done_at}</p>
      <p className="mt-0.5 font-medium text-slate-900">{item.title}</p>
      {item.purpose && (
        <p className="mt-0.5 text-sm text-slate-600">
          <span className="text-slate-400">目的：</span>
          {item.purpose}
        </p>
      )}
      {item.description && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
          {item.description}
        </p>
      )}
      {item.result && (
        <p className="mt-1 text-sm font-medium text-emerald-700">
          {item.result}
        </p>
      )}
    </li>
  );
}

function NextActionItem({ item }: { item: NextActionSnapshot }) {
  return (
    <li className="flex items-start gap-3 rounded border border-slate-200 bg-white p-3">
      <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-slate-300" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.priority === "high" && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
              優先度: 高
            </span>
          )}
          {item.due_date && (
            <span className="text-xs text-slate-500">
              期限: {item.due_date}
            </span>
          )}
        </div>
        <p className="mt-1 font-medium text-slate-900">{item.title}</p>
        {item.expected_effect && (
          <p className="mt-0.5 text-sm text-slate-600">
            期待効果: {item.expected_effect}
          </p>
        )}
      </div>
    </li>
  );
}

function hasAnyKpi(k: KpiSnapshot): boolean {
  return (
    k.site_visits != null ||
    k.line_signups != null ||
    k.inquiries != null ||
    k.expected_revenue != null ||
    k.improvements_count != null
  );
}

function formatYen(n: number): string {
  if (n >= 10000) {
    return `${(n / 10000).toLocaleString("ja-JP", {
      maximumFractionDigits: 1,
    })}万円`;
  }
  return `${n.toLocaleString("ja-JP")}円`;
}
