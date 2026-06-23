export const metadata = { title: "特定商取引法に基づく表記 | Trendlinks" };

export default function TokushohoPage() {
  const rows: [string, string][] = [
    ["事業者名", "____"],
    ["代表者", "____"],
    ["所在地", "____"],
    ["連絡先", "____（メール / 電話）"],
    ["販売価格", "Free ¥0 / Starter ¥1,980 / Pro ¥4,980（月額・税込）"],
    ["支払方法", "クレジットカード（Stripe）"],
    ["支払時期", "申込時および毎月の更新日に課金"],
    ["サービス提供時期", "決済完了後ただちに利用可能"],
    ["解約・返金", "マイページよりいつでも解約可。原則として日割返金なし"],
  ];
  return (
    <>
      <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>
      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-200">
              <th className="w-40 bg-slate-50 p-3 text-left font-medium align-top">
                {k}
              </th>
              <td className="p-3">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-8 rounded bg-amber-50 p-3 text-sm text-amber-700">
        ※ 「____」を事業者情報で埋めてください。
      </p>
    </>
  );
}
