"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  convertHearingToClient,
  deleteHearing,
  updateHearingNote,
  updateHearingStatus,
} from "../../actions";
import type { HearingStatus } from "@/lib/supabase/types";

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: HearingStatus;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      onValueChange={(v) => {
        if (!v) return;
        startTransition(async () => {
          const result = await updateHearingStatus(id, v as HearingStatus);
          if (result?.error) toast.error(result.error);
          else toast.success("状態を更新しました");
        });
      }}
    >
      <SelectTrigger className="w-[160px]" disabled={pending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">新規</SelectItem>
        <SelectItem value="contacted">連絡済</SelectItem>
        <SelectItem value="converted">顧客化</SelectItem>
        <SelectItem value="archived">アーカイブ</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ConvertButton({
  id,
  alreadyConverted,
  convertedClientId,
}: {
  id: string;
  alreadyConverted: boolean;
  convertedClientId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (alreadyConverted && convertedClientId) {
    return (
      <a href={`/admin/clients/${convertedClientId}`}>
        <Button variant="outline">変換済み・クライアントを開く ↗</Button>
      </a>
    );
  }

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("このヒアリングをクライアントに変換しますか？"))
          return;
        startTransition(async () => {
          const result = await convertHearingToClient(id);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      {pending ? "変換中..." : "クライアントに変換"}
    </Button>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      disabled={pending}
      onClick={() => {
        if (!confirm("このヒアリングを削除します。よろしいですか？")) return;
        startTransition(async () => {
          const result = await deleteHearing(id);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      {pending ? "削除中..." : "削除"}
    </Button>
  );
}

export function AdminNoteForm({
  id,
  defaultValue,
}: {
  id: string;
  defaultValue: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await updateHearingNote(id, formData);
          if (result?.error) toast.error(result.error);
          else toast.success("メモを保存しました");
        });
      }}
      className="grid gap-2"
    >
      <Textarea
        name="admin_note"
        defaultValue={defaultValue}
        rows={3}
        placeholder="このヒアリングへのメモ（プロスペクトには見えません）"
      />
      <div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "保存中..." : "メモを保存"}
        </Button>
      </div>
    </form>
  );
}
