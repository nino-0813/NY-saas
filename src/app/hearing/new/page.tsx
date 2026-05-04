import { HearingForm } from "./_components/hearing-form";

export const metadata = {
  title: "集客導線ヒアリングシート | NY33 Growth Board",
  description:
    "3〜5分の質問に答えるだけで、現状の集客導線スコアと改善提案がその場で表示されます。",
};

export default function HearingNewPage() {
  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
            Growth Hearing Sheet
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            集客導線ヒアリングシート
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            3〜5分の質問にお答えいただくと、その場で
            <strong className="text-slate-900">集客導線スコア（100点満点）</strong>と
            <strong className="text-slate-900">5カテゴリ別の診断・改善提案</strong>を表示します。
            数字や項目はだいたいで OK です。途中で止まっても診断は出ます。
          </p>
        </header>

        <div className="pt-10">
          <HearingForm />
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          NY33 Growth Board
        </footer>
      </div>
    </div>
  );
}
