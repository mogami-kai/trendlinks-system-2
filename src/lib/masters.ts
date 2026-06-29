import { createClient } from "@/lib/supabase/browser";
import type { Category, QuotePrice, TenantPrice, WorkItem } from "@/lib/types";

export type PriceInfo = {
  unit_price: number;
  unit: string | null;
};

export type Masters = {
  categories: Category[];
  workItems: WorkItem[];
  itemsByCategory: Record<string, WorkItem[]>;
  quotePriceMap: Record<string, PriceInfo>;
  tenantPriceMap: Record<string, PriceInfo>;
  workItemMap: Record<string, WorkItem>;
};

const emptyMasters = (): Masters => ({
  categories: [],
  workItems: [],
  itemsByCategory: {},
  quotePriceMap: {},
  tenantPriceMap: {},
  workItemMap: {},
});

export const loadMasters = async (): Promise<Masters> => {
  const supabase = createClient();
  const [
    { data: categoryData },
    { data: itemsData },
    { data: quoteData },
    { data: tenantData },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("kind", "work_item")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("work_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("quote_prices").select("*"),
    supabase.from("tenant_prices").select("*"),
  ]);

  const categories = (categoryData ?? []) as Category[];
  const workItems = (itemsData ?? []) as WorkItem[];

  const itemsByCategory: Record<string, WorkItem[]> = {};
  const workItemMap: Record<string, WorkItem> = {};
  for (const item of workItems) {
    workItemMap[item.id] = item;
    const key = item.category || "その他";
    if (!itemsByCategory[key]) {
      itemsByCategory[key] = [];
    }
    itemsByCategory[key].push(item);
  }

  const quotePriceMap: Record<string, PriceInfo> = {};
  for (const price of (quoteData ?? []) as QuotePrice[]) {
    quotePriceMap[price.work_item_id] = {
      unit_price: price.unit_price ?? 0,
      unit: price.unit,
    };
  }

  const tenantPriceMap: Record<string, PriceInfo> = {};
  for (const price of (tenantData ?? []) as TenantPrice[]) {
    tenantPriceMap[price.work_item_id] = {
      unit_price: price.unit_price ?? 0,
      unit: price.unit,
    };
  }

  return {
    categories,
    workItems,
    itemsByCategory,
    quotePriceMap,
    tenantPriceMap,
    workItemMap,
  };
};

export { emptyMasters };
