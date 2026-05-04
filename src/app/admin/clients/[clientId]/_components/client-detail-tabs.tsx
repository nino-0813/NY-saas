"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatMonthLabel } from "@/lib/month";
import type {
  Client,
  Improvement,
  Kpi,
  NextAction,
  NextActionStatus,
  Report,
} from "@/lib/supabase/types";
import {
  addImprovement,
  addNextAction,
  deleteClient,
  deleteImprovement,
  deleteNextAction,
  deleteReport,
  saveReport,
  updateClient,
  updateNextActionStatus,
  upsertKpi,
} from "../actions";

type Props = {
  client: Client;
  month: string;
  kpi: Kpi | null;
  improvements: Improvement[];
  nextActions: NextAction[];
  reports: Report[];
};

export function ClientDetailTabs({
  client,
  month,
  kpi,
  improvements,
  nextActions,
  reports,
}: Props) {
  const publicHref = `/client/r/${client.share_token}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.name}
          </h1>
          {client.industry && (
            <p className="mt-1 text-sm text-slate-500">{client.industry}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={publicHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              公開ページを開く ↗
            </Button>
          </a>
          <CopyShareLinkButton href={publicHref} />
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="kpi">
            KPI（{formatMonthLabel(month)}）
          </TabsTrigger>
          <TabsTrigger value="improvements">
            改善ログ ({improvements.length})
          </TabsTrigger>
          <TabsTrigger value="next">
            次にやること ({nextActions.length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            月次レポート ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <BasicInfoCard client={client} />
        </TabsContent>

        <TabsContent value="kpi" className="mt-4">
          <KpiCard clientId={client.id} month={month} kpi={kpi} />
        </TabsContent>

        <TabsContent value="improvements" className="mt-4">
          <ImprovementsCard
            clientId={client.id}
            improvements={improvements}
          />
        </TabsContent>

        <TabsContent value="next" className="mt-4">
          <NextActionsCard clientId={client.id} nextActions={nextActions} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportTab
            clientId={client.id}
            reports={reports}
            defaultMonth={month}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CopyShareLinkButton({ href }: { href: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const url = `${window.location.origin}${href}`;
        navigator.clipboard.writeText(url).then(
          () => toast.success("共有URLをコピーしました"),
          () => toast.error("コピーに失敗しました"),
        );
      }}
    >
      共有URLをコピー
    </Button>
  );
}

// ---------- 基本情報 ----------

function BasicInfoCard({ client }: { client: Client }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(client.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
        <CardDescription>
          クライアントの基本情報・今月のゴール・現在の課題を編集します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              formData.set("status", status);
              const result = await updateClient(client.id, formData);
              if (result?.error) toast.error(result.error);
              else toast.success("保存しました");
            });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="クライアント名 *" htmlFor="name">
              <Input
                id="name"
                name="name"
                defaultValue={client.name}
                required
              />
            </Field>
            <Field label="業種" htmlFor="industry">
              <Input
                id="industry"
                name="industry"
                defaultValue={client.industry ?? ""}
                placeholder="例：宿泊・観光"
              />
            </Field>
          </div>

          <Field label="ステータス" htmlFor="status">
            <Select value={status} onValueChange={(v) => setStatus(v as Client["status"])}>
              <SelectTrigger id="status" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="paused">paused</SelectItem>
                <SelectItem value="archived">archived</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="今月のゴール" htmlFor="monthly_goal">
            <Textarea
              id="monthly_goal"
              name="monthly_goal"
              defaultValue={client.monthly_goal ?? ""}
              placeholder="例：LINE登録を月+30人、予約を+10件"
              rows={3}
            />
          </Field>

          <Field label="現在の課題" htmlFor="current_issue">
            <Textarea
              id="current_issue"
              name="current_issue"
              defaultValue={client.current_issue ?? ""}
              placeholder="例：直前予約が少ない / 口コミが集まらない"
              rows={3}
            />
          </Field>

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : "保存"}
            </Button>

            <DeleteClientButton clientId={client.id} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteClientButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "このクライアントを削除します。関連する KPI・改善ログ・次にやることもすべて削除されます。よろしいですか？",
          )
        )
          return;
        startTransition(async () => {
          const result = await deleteClient(clientId);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      {pending ? "削除中..." : "クライアントを削除"}
    </Button>
  );
}

// ---------- KPI ----------

function KpiCard({
  clientId,
  month,
  kpi,
}: {
  clientId: string;
  month: string;
  kpi: Kpi | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatMonthLabel(month)} のKPI</CardTitle>
        <CardDescription>
          今月のKPI数値を入力します。同じ月で再保存すると上書きされます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            startTransition(async () => {
              formData.set("month", month);
              const result = await upsertKpi(clientId, formData);
              if (result?.error) toast.error(result.error);
              else toast.success("KPIを保存しました");
            });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumField label="サイト訪問数" name="site_visits" defaultValue={kpi?.site_visits} />
            <NumField label="LINE登録数" name="line_signups" defaultValue={kpi?.line_signups} />
            <NumField label="問い合わせ・予約数" name="inquiries" defaultValue={kpi?.inquiries} />
            <NumField label="売上見込み（円）" name="expected_revenue" defaultValue={kpi?.expected_revenue} />
            <NumField label="改善実行数" name="improvements_count" defaultValue={kpi?.improvements_count} />
          </div>

          <Field label="推定改善インパクト（メモ）" htmlFor="estimated_impact">
            <Textarea
              id="estimated_impact"
              name="estimated_impact"
              defaultValue={kpi?.estimated_impact ?? ""}
              placeholder="例：LP CTA改善で予約クリック率+12% / LINE導線で登録+30%"
              rows={3}
            />
          </Field>

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : "KPIを保存"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- 改善ログ ----------

function ImprovementsCard({
  clientId,
  improvements,
}: {
  clientId: string;
  improvements: Improvement[];
}) {
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>改善ログを追加</CardTitle>
          <CardDescription>今月実施した改善を記録します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => {
              startTransition(async () => {
                const result = await addImprovement(clientId, formData);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("改善ログを追加しました");
                  (document.getElementById("improvement-form") as HTMLFormElement)?.reset();
                }
              });
            }}
            id="improvement-form"
            className="grid gap-3"
          >
            <Field label="タイトル *" htmlFor="title">
              <Input
                id="title"
                name="title"
                placeholder="例：LP CTAを「今すぐ予約」に変更"
                required
              />
            </Field>
            <Field label="目的" htmlFor="purpose">
              <Input
                id="purpose"
                name="purpose"
                placeholder="例：予約導線のコンバージョンを上げるため"
              />
            </Field>
            <Field label="内容" htmlFor="description">
              <Textarea id="description" name="description" rows={3} />
            </Field>
            <Field label="結果" htmlFor="result">
              <Input
                id="result"
                name="result"
                placeholder="例：CTAクリック率 4.2% → 6.1%"
              />
            </Field>
            <Field label="実施日" htmlFor="done_at">
              <Input
                id="done_at"
                name="done_at"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? "追加中..." : "追加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>改善ログ</CardTitle>
          <CardDescription>新しい順に最大50件表示します。</CardDescription>
        </CardHeader>
        <CardContent>
          {improvements.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              まだ改善ログがありません。
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {improvements.map((imp) => (
                <li key={imp.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{imp.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {imp.done_at}
                      </p>
                      {imp.purpose && (
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="text-xs text-slate-400">目的: </span>
                          {imp.purpose}
                        </p>
                      )}
                      {imp.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {imp.description}
                        </p>
                      )}
                      {imp.result && (
                        <p className="mt-1 text-sm text-emerald-700">
                          <span className="text-xs text-slate-400">結果: </span>
                          {imp.result}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600"
                      disabled={deletingId === imp.id}
                      onClick={() => {
                        if (!confirm("この改善ログを削除しますか？")) return;
                        setDeletingId(imp.id);
                        startTransition(async () => {
                          const result = await deleteImprovement(clientId, imp.id);
                          setDeletingId(null);
                          if (result?.error) toast.error(result.error);
                        });
                      }}
                    >
                      削除
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- 次にやること ----------

function NextActionsCard({
  clientId,
  nextActions,
}: {
  clientId: string;
  nextActions: NextAction[];
}) {
  const [pending, startTransition] = useTransition();
  const [priority, setPriority] = useState<string>("medium");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>次にやることを追加</CardTitle>
          <CardDescription>
            来週・来月に取り組む施策を登録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => {
              startTransition(async () => {
                formData.set("priority", priority);
                const result = await addNextAction(clientId, formData);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("追加しました");
                  (document.getElementById("next-form") as HTMLFormElement)?.reset();
                  setPriority("medium");
                }
              });
            }}
            id="next-form"
            className="grid gap-3"
          >
            <Field label="タイトル *" htmlFor="na_title">
              <Input
                id="na_title"
                name="title"
                placeholder="例：サイクリスト向けLPを作成"
                required
              />
            </Field>
            <Field label="期待効果" htmlFor="expected_effect">
              <Input
                id="expected_effect"
                name="expected_effect"
                placeholder="例：直前予約 +5件/月"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="優先度" htmlFor="priority">
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v ?? "medium")}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="low">low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="期限" htmlFor="due_date">
                <Input id="due_date" name="due_date" type="date" />
              </Field>
            </div>
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? "追加中..." : "追加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>次にやること</CardTitle>
          <CardDescription>新しい順に最大50件表示します。</CardDescription>
        </CardHeader>
        <CardContent>
          {nextActions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              まだ登録がありません。
            </p>
          ) : (
            <ul className="space-y-2">
              {nextActions.map((na) => (
                <NextActionRow key={na.id} clientId={clientId} action={na} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NextActionRow({
  clientId,
  action,
}: {
  clientId: string;
  action: NextAction;
}) {
  const [pending, startTransition] = useTransition();
  const isDone = action.status === "done";

  return (
    <li className="flex items-start justify-between gap-3 rounded border border-slate-100 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={action.priority} />
          <StatusBadge status={action.status} />
          {action.due_date && (
            <span className="text-xs text-slate-500">期限: {action.due_date}</span>
          )}
        </div>
        <p
          className={
            "mt-1 font-medium " +
            (isDone ? "text-slate-400 line-through" : "text-slate-900")
          }
        >
          {action.title}
        </p>
        {action.expected_effect && (
          <p className="mt-0.5 text-sm text-slate-600">
            期待効果: {action.expected_effect}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Select
          value={action.status}
          onValueChange={(v) => {
            startTransition(async () => {
              const result = await updateNextActionStatus(
                clientId,
                action.id,
                v as NextActionStatus,
              );
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs" disabled={pending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">todo</SelectItem>
            <SelectItem value="doing">doing</SelectItem>
            <SelectItem value="done">done</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-400 hover:text-red-600"
          disabled={pending}
          onClick={() => {
            if (!confirm("このタスクを削除しますか？")) return;
            startTransition(async () => {
              const result = await deleteNextAction(clientId, action.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          削除
        </Button>
      </div>
    </li>
  );
}

// ---------- 月次レポート ----------

function ReportTab({
  clientId,
  reports,
  defaultMonth,
}: {
  clientId: string;
  reports: Report[];
  defaultMonth: string;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [intent, setIntent] = useState<"save" | "publish" | "unpublish">("save");
  const [pending, startTransition] = useTransition();

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}-01`;
    });
  }, []);

  const current = reports.find((r) => r.month === month);
  const isPublished = !!current?.published;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>月次レポート</CardTitle>
              <CardDescription>
                クライアント閲覧ページに表示される月次レポートを編集します。
                保存時に当月のKPI・改善ログ・次にやることのスナップショットを取ります。
              </CardDescription>
            </div>
            <PublishedBadge published={isPublished} hasReport={!!current} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Label className="text-sm text-slate-600">対象月</Label>
            <Select
              value={month}
              onValueChange={(v) => {
                if (v) setMonth(v);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => {
                  const r = reports.find((rr) => rr.month === m);
                  return (
                    <SelectItem key={m} value={m}>
                      {formatMonthLabel(m)}
                      {r?.published ? " ・公開済" : r ? " ・下書き" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <form
            key={month}
            action={(formData) => {
              const currentIntent = intent;
              startTransition(async () => {
                formData.set("month", month);
                const result = await saveReport(clientId, formData, {
                  publish: currentIntent === "publish",
                  unpublish: currentIntent === "unpublish",
                });
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  currentIntent === "publish"
                    ? "公開しました"
                    : currentIntent === "unpublish"
                      ? "公開を取り消しました"
                      : "保存しました",
                );
              });
            }}
            className="grid gap-4"
          >
            <Field label="今月のハイライト" htmlFor="highlight">
              <Input
                id="highlight"
                name="highlight"
                defaultValue={current?.highlight ?? ""}
                placeholder="例：LINE登録 +31人 / 予約 +9件"
              />
            </Field>

            <Field label="主な成果" htmlFor="achievements">
              <Textarea
                id="achievements"
                name="achievements"
                defaultValue={current?.achievements ?? ""}
                rows={4}
                placeholder={"例：\n・LINE登録が前月比+30%\n・新しいCTAで予約クリック率が改善\n・口コミ件数が+5件"}
              />
            </Field>

            <Field label="実施した改善のまとめ（任意）" htmlFor="implemented_summary">
              <Textarea
                id="implemented_summary"
                name="implemented_summary"
                defaultValue={current?.implemented_summary ?? ""}
                rows={3}
                placeholder="文章での振り返り。空欄なら改善ログ一覧がそのまま使われます。"
              />
            </Field>

            <Field label="次月の重点" htmlFor="next_focus">
              <Textarea
                id="next_focus"
                name="next_focus"
                defaultValue={current?.next_focus ?? ""}
                rows={3}
                placeholder="例：サイクリスト向けLPを公開し、直前予約導線を強化"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                disabled={pending}
                onClick={() => setIntent("save")}
              >
                {pending && intent === "save" ? "保存中..." : "下書き保存"}
              </Button>

              {!isPublished && (
                <Button
                  type="submit"
                  disabled={pending}
                  onClick={() => setIntent("publish")}
                >
                  {pending && intent === "publish" ? "公開中..." : "公開する"}
                </Button>
              )}

              {isPublished && (
                <Button
                  type="submit"
                  variant="ghost"
                  className="text-slate-600"
                  disabled={pending}
                  onClick={() => setIntent("unpublish")}
                >
                  {pending && intent === "unpublish"
                    ? "取消中..."
                    : "公開を取り消す"}
                </Button>
              )}

              {current && (
                <DeleteReportButton
                  clientId={clientId}
                  reportId={current.id}
                  monthLabel={formatMonthLabel(month)}
                />
              )}
            </div>

            {isPublished && current?.published_at && (
              <p className="pt-1 text-xs text-emerald-700">
                公開日時: {new Date(current.published_at).toLocaleString("ja-JP")}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>過去のレポート</CardTitle>
          <CardDescription>
            最大24ヶ月分。クリックで対象月を切り替えます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              まだレポートがありません。
            </p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setMonth(r.month)}
                    className={
                      "flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm transition " +
                      (r.month === month
                        ? "border-slate-300 bg-slate-50"
                        : "border-slate-100 hover:bg-slate-50")
                    }
                  >
                    <span>{formatMonthLabel(r.month)}</span>
                    <PublishedBadge published={r.published} hasReport />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PublishedBadge({
  published,
  hasReport,
}: {
  published: boolean;
  hasReport: boolean;
}) {
  if (!hasReport)
    return (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        未作成
      </span>
    );
  return published ? (
    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      公開済
    </span>
  ) : (
    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      下書き
    </span>
  );
}

function DeleteReportButton({
  clientId,
  reportId,
  monthLabel,
}: {
  clientId: string;
  reportId: string;
  monthLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="ml-auto text-slate-400 hover:text-red-600"
      disabled={pending}
      onClick={() => {
        if (!confirm(`${monthLabel} のレポートを削除しますか？`)) return;
        startTransition(async () => {
          const result = await deleteReport(clientId, reportId);
          if (result?.error) toast.error(result.error);
          else toast.success("削除しました");
        });
      }}
    >
      削除
    </Button>
  );
}

// ---------- shared atoms ----------

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NumField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number | null | undefined;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <Input
        id={name}
        name={name}
        type="number"
        inputMode="numeric"
        defaultValue={defaultValue ?? ""}
      />
    </Field>
  );
}

function PriorityBadge({ priority }: { priority: NextAction["priority"] }) {
  const cls =
    priority === "high"
      ? "bg-red-100 text-red-800"
      : priority === "low"
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold " + cls}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: NextAction["status"] }) {
  const cls =
    status === "done"
      ? "bg-emerald-100 text-emerald-800"
      : status === "doing"
        ? "bg-blue-100 text-blue-800"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold " + cls}>
      {status}
    </span>
  );
}
