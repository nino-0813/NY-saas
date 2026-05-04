"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function HearingShareLink() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/hearing/new`);
  }, []);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            ヒアリングシートの共有 URL
          </p>
          <p className="mt-1 break-all text-sm text-slate-700">
            {url || "（読み込み中）"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            このURLを送るだけで、相手はその場で診断スコアを受け取れます。
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(url).then(
                () => toast.success("コピーしました"),
                () => toast.error("コピーに失敗しました"),
              );
            }}
          >
            コピー
          </Button>
          <a href="/hearing/new" target="_blank" rel="noopener noreferrer">
            <Button type="button" size="sm" variant="outline">
              開く ↗
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
