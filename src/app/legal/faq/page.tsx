export const metadata = { title: "FAQ | Trendlinks" };

const faqs: [string, string][] = [
  ["無料で使えますか？", "Free プラン（現場3件・スタッフ5名）を無料でご利用いただけます。"],
  ["GPS到着確認やPDF生成はどのプランで使えますか？", "Pro プランでご利用いただけます。"],
  ["スマホだけで使えますか？", "はい。スマートフォン1台で現場到着・報告・写真添付まで完結します。"],
  ["データ移行はできますか？", "CSVエクスポート等での移行に対応予定です。詳細はお問い合わせください。"],
  ["解約はいつでもできますか？", "マイページからいつでも解約できます。"],
  ["セキュリティは大丈夫ですか？", "通信はすべて暗号化され、テナントごとにデータが分離されています。"],
];

export default function FaqPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">よくある質問（FAQ）</h1>
      <dl className="mt-6 space-y-5">
        {faqs.map(([q, a]) => (
          <div key={q} className="card">
            <dt className="font-semibold text-brand-700">Q. {q}</dt>
            <dd className="mt-2 text-sm text-slate-600">A. {a}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
