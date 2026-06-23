export const metadata = { title: "プライバシーポリシー | Trendlinks" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-slate-500">最終更新日: ____年__月__日</p>

      <h2 className="mt-6 text-lg font-semibold">1. 取得する個人情報</h2>
      <p>
        当社は、本サービスの提供にあたり、スタッフ情報（氏名・連絡先・LINE
        ID）、顧客（取引先）情報、現場住所、位置情報（GPS）、決済関連情報
        （Stripe を通じて処理）等の個人情報を取得します。
      </p>

      <h2 className="mt-6 text-lg font-semibold">2. 利用目的</h2>
      <p>
        現場管理・作業指示配信・到着確認・報告書の作成および顧客への送付・
        課金処理・サポート対応のために利用します。
      </p>

      <h2 className="mt-6 text-lg font-semibold">3. 第三者提供・委託</h2>
      <p>
        本サービスは以下の外部サービスを業務委託先として利用します:
        Supabase、Vercel、Stripe、LINE、Brevo、Google。法令に基づく場合を除き、
        本人の同意なく第三者へ提供しません。
      </p>

      <h2 className="mt-6 text-lg font-semibold">4. 位置情報の取扱い</h2>
      <p>
        GPS による位置情報は、現場到着確認の目的に限り、利用者の同意のもとで
        取得・記録します。
      </p>

      <h2 className="mt-6 text-lg font-semibold">5. 保有期間・開示等の請求</h2>
      <p>
        利用目的の達成に必要な期間保有します。開示・訂正・削除等のご請求は
        下記窓口までご連絡ください。
      </p>

      <h2 className="mt-6 text-lg font-semibold">6. 個人情報保護管理者</h2>
      <p>個人情報保護管理者: 代表者 ____（氏名）</p>

      <h2 className="mt-6 text-lg font-semibold">7. お問い合わせ窓口</h2>
      <p>____（メールアドレス等）</p>

      <p className="mt-8 rounded bg-amber-50 p-3 text-sm text-amber-700">
        ※ 本文面は雛形です。事業者情報を記入のうえ、必要に応じ専門家の確認を受けてください。
      </p>
    </>
  );
}
