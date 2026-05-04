import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { diagnose } from "@/lib/scoring";
import type { HearingStatus, HearingSubmission } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HearingShareLink } from "./_components/share-link";

export const dynamic = "force-dynamic";

export default async function HearingsListPage() {
  const { data } = await supabase
    .from("hearing_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const submissions = (data ?? []) as HearingSubmission[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ヒアリングシート
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          見込み客が入力した集客導線ヒアリングの一覧です。
        </p>
      </div>

      <HearingShareLink />

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <p>まだヒアリング回答がありません。</p>
            <p className="mt-1 text-sm">
              上の共有 URL を見込み客に送ると、ここに結果が貯まります。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会社名・サロン名</TableHead>
                  <TableHead>業種</TableHead>
                  <TableHead className="text-right">スコア</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead className="text-right">回答日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => {
                  const d = diagnose(s);
                  return (
                    <TableRow key={s.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/hearings/${s.id}`}
                          className="hover:underline"
                        >
                          {s.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {s.industry ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className="inline-flex items-center gap-1">
                          {d.total}
                          <span className="text-xs font-normal text-slate-400">
                            /100
                          </span>
                          <GradePill grade={d.grade} />
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={s.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {s.contact_email ?? s.contact_phone ?? s.contact_line ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {new Date(s.created_at).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GradePill({ grade }: { grade: string }) {
  const cls =
    grade === "S" || grade === "A"
      ? "bg-emerald-100 text-emerald-800"
      : grade === "B"
        ? "bg-blue-100 text-blue-800"
        : grade === "C"
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800";
  return (
    <span className={"ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold " + cls}>
      {grade}
    </span>
  );
}

function StatusPill({ status }: { status: HearingStatus }) {
  const map: Record<HearingStatus, { cls: string; label: string }> = {
    new: { cls: "bg-blue-100 text-blue-800", label: "新規" },
    contacted: { cls: "bg-amber-100 text-amber-800", label: "連絡済" },
    converted: { cls: "bg-emerald-100 text-emerald-800", label: "顧客化" },
    archived: { cls: "bg-slate-100 text-slate-600", label: "アーカイブ" },
  };
  const { cls, label } = map[status];
  return (
    <span className={"rounded px-1.5 py-0.5 text-xs font-semibold " + cls}>
      {label}
    </span>
  );
}
