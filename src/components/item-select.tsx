"use client";

import { Select } from "@/components/ui";
import type { Masters } from "@/lib/masters";
import type { WorkItem } from "@/lib/types";

export type ItemSelectValue = {
  category: string | null;
  workItemId: string | null;
};

type Props = {
  masters: Masters;
  value: ItemSelectValue;
  onChange: (next: {
    category: string | null;
    workItemId: string | null;
    workItem: WorkItem | null;
  }) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function ItemSelect({ masters, value, onChange, disabled, compact }: Props) {
  const items = value.category ? (masters.itemsByCategory[value.category] ?? []) : [];

  const handleCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value || null;
    onChange({ category: cat, workItemId: null, workItem: null });
  };

  const handleWorkItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    const wi = id ? (masters.workItemMap[id] ?? null) : null;
    onChange({ category: value.category, workItemId: id, workItem: wi });
  };

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex items-center gap-2"}>
      <Select
        value={value.category ?? ""}
        onChange={handleCategory}
        disabled={disabled}
        className={compact ? "py-1 text-xs" : undefined}
      >
        <option value="">区分を選択</option>
        {masters.categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </Select>

      <Select
        value={value.workItemId ?? ""}
        onChange={handleWorkItem}
        disabled={disabled || !value.category}
        className={compact ? "py-1 text-xs" : undefined}
      >
        <option value="">項目を選択</option>
        {items.map((wi) => (
          <option key={wi.id} value={wi.id}>
            {wi.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
