"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitHearing } from "../actions";

export function HearingForm() {
  const [pending, startTransition] = useTransition();

  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null);
  const [hasGbp, setHasGbp] = useState<boolean | null>(null);
  const [hasLine, setHasLine] = useState<boolean | null>(null);
  const [hasInstagram, setHasInstagram] = useState<boolean | null>(null);
  const [hasAds, setHasAds] = useState<boolean | null>(null);
  const [bookingMethod, setBookingMethod] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [revenueRange, setRevenueRange] = useState<string>("");

  return (
    <form
      action={(formData) => {
        if (bookingMethod) formData.set("booking_method", bookingMethod);
        if (priceRange) formData.set("price_range", priceRange);
        if (revenueRange) formData.set("monthly_revenue_range", revenueRange);
        startTransition(async () => {
          const result = await submitHearing(formData);
          if (result?.error) toast.error(result.error);
        });
      }}
      className="space-y-12"
    >
      <Section letter="A" title="会社情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="会社名・サロン名" required>
            <Input name="company_name" required placeholder="例：合同会社NY33" />
          </Field>
          <Field label="業種">
            <Input name="industry" placeholder="例：サービス業 / 小売 / 飲食 / 士業 など" />
          </Field>
          <Field label="ご担当者名">
            <Input name="contact_name" placeholder="例：山田 太郎" />
          </Field>
          <Field label="メール">
            <Input name="contact_email" type="email" placeholder="例：info@example.com" />
          </Field>
          <Field label="電話">
            <Input name="contact_phone" placeholder="例：090-xxxx-xxxx" />
          </Field>
          <Field label="LINE ID または LINE URL">
            <Input name="contact_line" placeholder="例：@xxxx / lin.ee/xxxxx" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="公式サイト URL（あれば）">
              <Input name="website_url" type="url" placeholder="https://..." />
            </Field>
          </div>
        </div>
      </Section>

      <Section letter="B" title="商品とお客様">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="メインの商品・サービス">
            <Input name="main_product" placeholder="例：月額サブスク / カット＋カラー / 業務委託コンサル" />
          </Field>
          <Field label="客単価（目安）">
            <Select value={priceRange} onValueChange={(v) => setPriceRange(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under_3000">〜3,000円</SelectItem>
                <SelectItem value="3000_10000">3,000〜10,000円</SelectItem>
                <SelectItem value="10000_30000">10,000〜30,000円</SelectItem>
                <SelectItem value="30000_100000">30,000〜100,000円</SelectItem>
                <SelectItem value="over_100000">100,000円以上</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="メインのターゲットお客様">
              <Textarea
                name="target_customer"
                rows={2}
                placeholder="例：初めて来店する20〜40代、近隣の法人の担当者など"
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section letter="C" title="集客導線の現状">
        <div className="space-y-6">
          <YesNoQuestion
            label="公式サイト・LP はありますか？"
            name="has_website"
            value={hasWebsite}
            onChange={setHasWebsite}
          />

          <YesNoQuestion
            label="Google ビジネスプロフィール（マップに表示される情報）は整備していますか？"
            name="has_gbp"
            value={hasGbp}
            onChange={setHasGbp}
          />
          {hasGbp && (
            <div className="grid gap-4 pl-1 sm:grid-cols-2">
              <Field label="Google 口コミ件数（だいたいで OK）">
                <Input
                  name="gbp_review_count"
                  type="number"
                  inputMode="numeric"
                  placeholder="例：12"
                />
              </Field>
              <Field label="Google 平均評価（★、だいたいで OK）">
                <Input
                  name="gbp_rating"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="例：4.3"
                />
              </Field>
            </div>
          )}

          <YesNoQuestion
            label="LINE 公式アカウントはありますか？"
            name="has_line"
            value={hasLine}
            onChange={setHasLine}
          />
          {hasLine && (
            <Field label="LINE 登録者数（だいたいで OK）">
              <Input
                name="line_subscriber_count"
                type="number"
                inputMode="numeric"
                placeholder="例：120"
                className="sm:max-w-[260px]"
              />
            </Field>
          )}

          <YesNoQuestion
            label="Instagram は運用していますか？"
            name="has_instagram"
            value={hasInstagram}
            onChange={setHasInstagram}
          />
          {hasInstagram && (
            <Field label="Instagram フォロワー数（だいたいで OK）">
              <Input
                name="instagram_follower_count"
                type="number"
                inputMode="numeric"
                placeholder="例：450"
                className="sm:max-w-[260px]"
              />
            </Field>
          )}

          <Field label="現在の予約方法">
            <RadioGrid
              name="booking_method"
              value={bookingMethod}
              onChange={setBookingMethod}
              options={[
                { value: "both", label: "予約フォームと LINE 予約の両方" },
                { value: "form", label: "予約フォームあり" },
                { value: "line", label: "LINE 予約あり" },
                { value: "phone", label: "電話のみ" },
                { value: "none", label: "予約導線なし" },
              ]}
            />
          </Field>

          <YesNoQuestion
            label="広告（Google / Meta など）は運用していますか？"
            name="has_ads"
            value={hasAds}
            onChange={setHasAds}
          />
        </div>
      </Section>

      <Section letter="D" title="数字（だいたいで OK）">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="月間サイト訪問数">
            <Input
              name="monthly_visitors"
              type="number"
              inputMode="numeric"
              placeholder="例：800"
            />
          </Field>
          <Field label="月間予約・問い合わせ数">
            <Input
              name="monthly_bookings"
              type="number"
              inputMode="numeric"
              placeholder="例：25"
            />
          </Field>
          <Field label="月商イメージ">
            <Select value={revenueRange} onValueChange={(v) => setRevenueRange(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under_50">〜50万円</SelectItem>
                <SelectItem value="50_100">50〜100万円</SelectItem>
                <SelectItem value="100_300">100〜300万円</SelectItem>
                <SelectItem value="300_1000">300〜1,000万円</SelectItem>
                <SelectItem value="over_1000">1,000万円以上</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="リピート率（%）">
            <Input
              name="repeat_rate_percent"
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              placeholder="例：35"
            />
          </Field>
        </div>
      </Section>

      <Section letter="E" title="課題と目標">
        <div className="grid gap-4">
          <Field label="一番の課題（自由記述）">
            <Textarea
              name="biggest_issue"
              rows={3}
              placeholder="例：直前予約が少ない / 口コミが集まらない / リピートが弱い"
            />
          </Field>
          <Field label="6 ヶ月後の目標">
            <Textarea
              name="six_month_goal"
              rows={3}
              placeholder="例：月商を 1.5 倍にする / 予約数を月 +30 件 / LINE 登録 1,000 人"
            />
          </Field>
          <Field label="これまで試したこと">
            <Textarea
              name="past_attempts"
              rows={3}
              placeholder="例：MEO 業者を試した / Instagram を始めた / 広告は出していない"
            />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-8">
        <p className="text-center text-sm text-slate-500">
          送信ボタンを押すと、その場で集客導線のスコア・改善提案が表示されます。
        </p>
        <Button type="submit" size="lg" className="px-12" disabled={pending}>
          {pending ? "診断中..." : "診断結果を見る"}
        </Button>
      </div>
    </form>
  );
}

// ---------- atoms ----------

function Section({
  letter,
  title,
  children,
}: {
  letter: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {letter}
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function YesNoQuestion({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <RadioPill
          name={name}
          radioValue="true"
          checked={value === true}
          onChange={() => onChange(true)}
          label="あり"
        />
        <RadioPill
          name={name}
          radioValue="false"
          checked={value === false}
          onChange={() => onChange(false)}
          label="なし"
        />
      </div>
    </div>
  );
}

function RadioPill({
  name,
  radioValue,
  checked,
  onChange,
  label,
}: {
  name: string;
  radioValue: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={
        "cursor-pointer rounded-full border px-5 py-1.5 text-sm transition " +
        (checked
          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")
      }
    >
      <input
        type="radio"
        name={name}
        value={radioValue}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function RadioGrid({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={
            "flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition " +
            (value === opt.value
              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-white hover:border-slate-300")
          }
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
