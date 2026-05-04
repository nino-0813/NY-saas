import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateClientDialog } from "./_components/create-client-dialog";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as Client[];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            クライアント
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            全クライアントの一覧。クリックで月次の改善運用ボードを開きます。
          </p>
        </div>
        <CreateClientDialog />
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">
            データ取得に失敗しました: {error.message}
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <p>まだクライアントが登録されていません。</p>
            <p className="mt-1 text-sm">
              右上の「+ クライアントを追加」から最初の1社を登録してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`}>
              <Card className="h-full transition hover:border-slate-300 hover:shadow-sm">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {c.status}
                    </Badge>
                  </div>
                  {c.industry && (
                    <p className="text-xs text-slate-500">{c.industry}</p>
                  )}
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  {c.monthly_goal ? (
                    <p className="line-clamp-2">
                      <span className="text-xs text-slate-400">
                        今月のゴール:{" "}
                      </span>
                      {c.monthly_goal}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      今月のゴール未設定
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
