"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "../actions";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>+ クライアントを追加</DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await createClient(formData);
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              setOpen(false);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>クライアントを追加</DialogTitle>
            <DialogDescription>
              基本情報だけ登録します。詳細は作成後に編集できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">クライアント名 *</Label>
              <Input
                id="name"
                name="name"
                placeholder="例：Hotel PG"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">業種</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="例：宿泊・観光"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
