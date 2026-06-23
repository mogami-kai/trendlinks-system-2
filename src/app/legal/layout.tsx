import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 px-6 py-4">
        <Link href="/" className="text-xl font-bold text-brand-700">
          Trendlinks
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="prose prose-slate max-w-none">{children}</article>
        <nav className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal/terms">利用規約</Link>
          <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
          <Link href="/legal/faq">FAQ</Link>
        </nav>
      </main>
    </div>
  );
}
