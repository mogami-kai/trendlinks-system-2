"use client";

import Link from "next/link";

import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { settingsCards } from "@/lib/app";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="設定"
        description="自社情報、工事項目、単価マスターを整備して、帳票と案件運用の土台を揃えます。"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Card key={card.href}>
            <CardHeader title={card.title} description={card.description} />
            <CardBody>
              <Link
                href={card.href}
                className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-soft"
              >
                開く
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
