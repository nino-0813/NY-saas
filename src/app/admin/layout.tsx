import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold tracking-tight">
              NY33 Growth Board
            </span>
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/admin" className="hover:text-slate-900">
              クライアント
            </Link>
            <Link href="/admin/hearings" className="hover:text-slate-900">
              ヒアリング
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
