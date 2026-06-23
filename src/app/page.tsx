import Link from "next/link";
import { PLANS } from "@/lib/plans";

const features = [
  { title: "現場管理", desc: "現場名・住所・担当・契約内容を一元管理。" },
  { title: "作業指示書", desc: "現場別・スタッフ別・日程範囲でフィルタ。" },
  { title: "LINE作業指示配信", desc: "スタッフ全員へ作業指示を自動送信。" },
  { title: "現場報告+写真", desc: "スマホで完了報告・写真最大5枚。" },
  { title: "GPS到着確認", desc: "現場200m以内で到着を自動記録。" },
  { title: "顧客報告書PDF", desc: "1クリックで品質証明レポートを生成。" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="text-xl font-bold text-brand-700">Trendlinks</div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">
            ログイン
          </Link>
          <Link href="/signup" className="btn-primary">
            無料で始める
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          清掃現場の管理を、
          <span className="text-brand-600">スマホ1台</span>で。
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          現場管理・作業指示・現場報告・GPS到着確認・顧客報告書PDF自動生成を
          ワンパッケージに。月額 ¥1,980 から導入できる清掃業特化の現場管理SaaSです。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="btn-primary px-6 py-3">
            無料で始める
          </Link>
          <Link href="/legal/faq" className="btn-secondary px-6 py-3">
            よくある質問
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-8 text-center text-2xl font-bold">主な機能</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold text-brand-700">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-8 text-center text-2xl font-bold">料金プラン</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {(["free", "starter", "pro"] as const).map((p) => (
            <div key={p} className="card flex flex-col">
              <h3 className="text-lg font-bold">{PLANS[p].label}</h3>
              <p className="mt-2 text-3xl font-bold">
                ¥{PLANS[p].priceJpy.toLocaleString()}
                <span className="text-base font-normal text-slate-500">/月</span>
              </p>
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                <li>
                  現場:{" "}
                  {PLANS[p].maxSites < 0 ? "無制限" : `${PLANS[p].maxSites}件`}
                </li>
                <li>
                  スタッフ:{" "}
                  {PLANS[p].maxStaff < 0 ? "無制限" : `${PLANS[p].maxStaff}名`}
                </li>
                <li>{PLANS[p].gpsArrival ? "✓" : "—"} GPS到着確認</li>
                <li>{PLANS[p].pdfReport ? "✓" : "—"} 顧客報告書PDF</li>
              </ul>
              <Link href="/signup" className="btn-primary mt-6">
                選択する
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/legal/privacy" className="hover:text-brand-600">
            プライバシーポリシー
          </Link>
          <Link href="/legal/terms" className="hover:text-brand-600">
            利用規約
          </Link>
          <Link href="/legal/tokushoho" className="hover:text-brand-600">
            特定商取引法に基づく表記
          </Link>
          <Link href="/legal/faq" className="hover:text-brand-600">
            FAQ
          </Link>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Trendlinks</p>
      </footer>
    </main>
  );
}
