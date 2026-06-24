"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  TableWrap,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { Category, WorkItem } from "@/lib/types";

export default function SettingsWorkItemsPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    default_unit: "",
    default_description: "",
  });

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: itemsData }, { data: categoriesData }] = await Promise.all([
      supabase.from("work_items").select("*").order("sort_order").order("name"),
      supabase
        .from("categories")
        .select("*")
        .eq("kind", "work_item")
        .order("sort_order"),
    ]);

    const categoryList = (categoriesData ?? []) as Category[];
    setCategories(categoryList);
    setItems((itemsData ?? []) as WorkItem[]);
    setForm((current) => ({
      ...current,
      category: current.category || categoryList[0]?.name || "",
    }));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const addCategory = async () => {
    const name = window.prompt("新しい業種名");
    if (!name?.trim()) {
      return;
    }

    const max = categories.reduce((acc, item) => Math.max(acc, item.sort_order), 0);
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert([
      {
        kind: "work_item",
        name: name.trim(),
        sort_order: max + 10,
        is_active: true,
      },
    ]);

    if (error) {
      alert(`追加に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  const addItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const max = items.reduce((acc, item) => Math.max(acc, item.sort_order), 0);
    const supabase = createClient();
    const { error } = await supabase.from("work_items").insert([
      {
        name: form.name.trim(),
        category: form.category,
        default_unit: form.default_unit || null,
        default_description: form.default_description || null,
        sort_order: max + 1,
        is_active: true,
      },
    ]);

    if (error) {
      alert(`登録失敗: ${error.message}`);
      return;
    }

    setForm({
      name: "",
      category: categories[0]?.name || "",
      default_unit: "",
      default_description: "",
    });
    void load();
  };

  const editItem = async (item: WorkItem) => {
    const name = window.prompt("項目名", item.name);
    if (!name?.trim()) {
      return;
    }
    const defaultUnit = window.prompt("単位", item.default_unit ?? "") ?? "";
    const defaultDescription =
      window.prompt("デフォルト摘要", item.default_description ?? "") ?? "";
    const supabase = createClient();
    const { error } = await supabase
      .from("work_items")
      .update({
        name: name.trim(),
        default_unit: defaultUnit || null,
        default_description: defaultDescription || null,
      })
      .eq("id", item.id);

    if (error) {
      alert(`更新失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const deleteItem = async (item: WorkItem) => {
    if (!window.confirm(`「${item.name}」を削除しますか？`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("work_items").delete().eq("id", item.id);
    if (error) {
      alert(`削除失敗: ${error.message}`);
      return;
    }
    void load();
  };

  return (
    <div>
      <PageHeader
        title="工事項目マスター"
        description="見積書・請求書・施工依頼書で使う工事項目を管理します。"
        action={
          <Button type="button" variant="secondary" onClick={() => void addCategory()}>
            業種追加
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader title="項目を追加" description="カテゴリ、単位、摘要の初期値を設定" />
          <CardBody>
            <form className="space-y-4" onSubmit={addItem}>
              <Field label="カテゴリ">
                <Select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="項目名 *">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="単位">
                <Input
                  value={form.default_unit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      default_unit: event.target.value,
                    }))
                  }
                  placeholder="例: ㎡, 箇所, 式"
                />
              </Field>
              <Field label="デフォルト摘要">
                <Input
                  value={form.default_description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      default_description: event.target.value,
                    }))
                  }
                />
              </Field>
              <Button type="submit">項目を追加</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="工事項目一覧"
            description="カテゴリごとに一覧表示し、簡易編集と削除に対応"
          />
          <CardBody>
            {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
            {!loading && items.length === 0 ? (
              <EmptyState
                title="工事項目がまだ登録されていません"
                description="左のフォームから最初の項目を追加してください。"
              />
            ) : null}

            {!loading && items.length > 0 ? (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">項目</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">単位</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-line/70">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.default_description || "摘要未設定"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.category}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.default_unit || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => void editItem(item)}
                            >
                              編集
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => void deleteItem(item)}
                            >
                              削除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
