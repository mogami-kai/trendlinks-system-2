import { z } from "zod";

export const siteSchema = z.object({
  name: z.string().min(1, "現場名は必須です"),
  customer_id: z.string().uuid().optional().nullable(),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address_line: z.string().optional(),
  building: z.string().optional(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  status: z.enum(["active", "paused", "canceled"]).default("active"),
});
export type SiteInput = z.infer<typeof siteSchema>;

export const workOrderSchema = z.object({
  site_id: z.string().uuid("現場を選択してください"),
  scheduled_from: z.string().optional().nullable(),
  scheduled_to: z.string().optional().nullable(),
  time_range: z.string().optional(),
  instructions: z.string().optional(),
  priority: z.coerce.number().int().min(0).max(5).default(0),
  assignee_ids: z.array(z.string().uuid()).default([]),
});
export type WorkOrderInput = z.infer<typeof workOrderSchema>;

export const customerSchema = z.object({
  name: z.string().min(1, "取引先名は必須です"),
  email: z.string().email().optional().or(z.literal("")),
  contact: z.string().optional(),
});

export const reportSchema = z.object({
  work_order_id: z.string().uuid(),
  comment: z.string().optional(),
});

export const arrivalSchema = z.object({
  work_order_id: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
});
