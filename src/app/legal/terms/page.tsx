export const metadata = { title: "利用規約 | Trendlinks" };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="mt-2 text-sm text-slate-500">最終更新日: ____年__月__日</p>

      <h2 className="mt-6 text-lg font-semibold">第1条（適用）</h2>
      <p>本規約は、本サービスの提供条件および当社と利用者の関係を定めます。</p>

      <h2 className="mt-6 text-lg font-semibold">第2条（アカウント）</h2>
      <p>
        利用者は自己の責任でアカウントを管理するものとし、第三者への貸与・譲渡を
        禁止します。
      </p>

      <h2 className="mt-6 text-lg font-semibold">第3条（料金・サブスクリプション）</h2>
      <p>
        利用者は選択したプランに応じた月額料金を支払うものとします。決済は
        Stripe を通じて行われ、更新・解約・返金の条件は特定商取引法に基づく
        表記に従います。
      </p>

      <h2 className="mt-6 text-lg font-semibold">第4条（禁止事項）</h2>
      <p>法令違反、第三者の権利侵害、サービス運営の妨害等を禁止します。</p>

      <h2 className="mt-6 text-lg font-semibold">第5条（データの帰属）</h2>
      <p>
        利用者が入力した現場・作業・報告等のデータは、当該利用者（テナント）に
        帰属します。
      </p>

      <h2 className="mt-6 text-lg font-semibold">第6条（免責）</h2>
      <p>当社は、本サービスの中断・データ消失等について法令の範囲で免責されます。</p>

      <h2 className="mt-6 text-lg font-semibold">第7条（準拠法・管轄）</h2>
      <p>本規約は日本法に準拠し、____地方裁判所を専属的合意管轄とします。</p>

      <p className="mt-8 rounded bg-amber-50 p-3 text-sm text-amber-700">
        ※ 本文面は雛形です。事業者情報を記入のうえ、必要に応じ専門家の確認を受けてください。
      </p>
    </>
  );
}
