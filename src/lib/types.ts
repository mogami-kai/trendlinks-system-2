export type Nullable<T> = T | null;

export type ManagementCompany = {
  id: string;
  name: string;
  address: Nullable<string>;
  phone: Nullable<string>;
  fax: Nullable<string>;
  email: Nullable<string>;
  contact_person: Nullable<string>;
  payment_terms: Nullable<string>;
  notes: Nullable<string>;
  created_at?: string;
  updated_at?: string;
};

export type Property = {
  id: string;
  management_company_id: string;
  name: string;
  address: Nullable<string>;
  notes: Nullable<string>;
  created_at?: string;
  updated_at?: string;
};

export type Room = {
  id: string;
  property_id: string;
  room_number: string;
  layout: Nullable<string>;
  area: Nullable<number>;
  notes: Nullable<string>;
  created_at?: string;
  updated_at?: string;
};

export type Contractor = {
  id: string;
  name: string;
  category: Nullable<string>;
  phone: Nullable<string>;
  phone2: Nullable<string>;
  email: Nullable<string>;
  fax: Nullable<string>;
  area: Nullable<string>;
  payment_terms: Nullable<string>;
  request_method: Nullable<string>;
  notes: Nullable<string>;
  is_tax_excluded: Nullable<boolean>;
  is_active: Nullable<boolean>;
  contact_person: Nullable<string>;
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  kind: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type WorkItem = {
  id: string;
  category: string;
  name: string;
  default_unit: Nullable<string>;
  default_description: Nullable<string>;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ContractorPrice = {
  id: string;
  contractor_id: string;
  work_item_id: string;
  unit_price: Nullable<number>;
  unit: Nullable<string>;
  is_unavailable: boolean;
  notes: Nullable<string>;
};

export type QuotePrice = {
  id: string;
  work_item_id: string;
  unit_price: Nullable<number>;
  unit: Nullable<string>;
};

export type TenantPrice = {
  id: string;
  work_item_id: string;
  unit_price: Nullable<number>;
  unit: Nullable<string>;
};

export type JobStatus =
  | "move_out_received"
  | "inspection_scheduled"
  | "inspection_done"
  | "quoted"
  | "ordered"
  | "in_progress"
  | "completed"
  | "billed"
  | "paid";

export type Job = {
  id: string;
  room_id: Nullable<string>;
  management_company_id: Nullable<string>;
  job_number: Nullable<string>;
  title: string;
  status: JobStatus;
  tenant_name: Nullable<string>;
  contract_date: Nullable<string>;
  move_out_date: Nullable<string>;
  deposit_amount: Nullable<number>;
  prepaid_amount: Nullable<number>;
  inspection_date: Nullable<string>;
  inspector_name: Nullable<string>;
  key_location: Nullable<string>;
  autolock_release: Nullable<string>;
  notes: Nullable<string>;
  job_type: Nullable<string>;
  order_amount: Nullable<number>;
  order_date: Nullable<string>;
  work_start_date: Nullable<string>;
  work_end_date: Nullable<string>;
  billing_month: Nullable<string>;
  billed_at: Nullable<string>;
  payment_received_at: Nullable<string>;
  payment_terms_override: Nullable<string>;
  referral_fee: Nullable<number>;
  key_returned_at: Nullable<string>;
  created_at?: string;
  updated_at?: string;
};

export type WorkOrder = {
  id: string;
  job_id: string;
  contractor_id: Nullable<string>;
  order_number: string;
  issue_date: Nullable<string>;
  work_start_date: Nullable<string>;
  completion_date: Nullable<string>;
  total: Nullable<number>;
  is_provisional: boolean;
  notes: Nullable<string>;
  pdf_path: Nullable<string>;
  fax_sent_at: Nullable<string>;
  fax_sent_method: Nullable<string>;
  invoice_received_at: Nullable<string>;
  payment_due_date: Nullable<string>;
  paid_at: Nullable<string>;
};

export type QuoteLineItem = {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  amount: number;
  work_item_id?: Nullable<string>;
  category?: Nullable<string>;
  description?: Nullable<string>;
};

export type Quote = {
  id: string;
  job_id: string;
  quote_number: string;
  issue_date: Nullable<string>;
  total: Nullable<number>;
  pdf_path: Nullable<string>;
  line_items: Nullable<QuoteLineItem[]>;
  notes: Nullable<string>;
};

export type TenantInvoiceLineItem = {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  amount: number;
  ratio: number;
  tenant_amount: number;
  landlord_amount?: number;
  work_item_id?: Nullable<string>;
  category?: Nullable<string>;
  description?: Nullable<string>;
};

export type TenantInvoice = {
  id: string;
  job_id: string;
  invoice_number: string;
  issue_date: Nullable<string>;
  total: Nullable<number>;
  pdf_path: Nullable<string>;
  tenant_signature: Nullable<string>;
  line_items: Nullable<TenantInvoiceLineItem[]>;
  deposit_offset: Nullable<number>;
  notes: Nullable<string>;
};

export type InspectionReport = {
  id: string;
  job_id: string;
  report_number: string;
  inspection_date: Nullable<string>;
  total: Nullable<number>;
  pdf_path: Nullable<string>;
  tenant_signature: Nullable<string>;
};

export type JobDocument = {
  id: string;
  job_id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  created_at?: string;
};

export type Photo = {
  id: string;
  room_id: string;
  file_name: Nullable<string>;
  file_path: string;
  caption: Nullable<string>;
  taken_at: Nullable<string>;
  created_at?: string;
};

export type CompanySettings = {
  id: string;
  company_name: string;
  postal_code: Nullable<string>;
  address: Nullable<string>;
  phone: Nullable<string>;
  fax: Nullable<string>;
  email: Nullable<string>;
  representative_name: Nullable<string>;
  default_contact_name: Nullable<string>;
  invoice_registration_number: Nullable<string>;
  bank_name: Nullable<string>;
  bank_branch: Nullable<string>;
  bank_account_type: Nullable<string>;
  bank_account_number: Nullable<string>;
  bank_account_holder: Nullable<string>;
  seal_image_path: Nullable<string>;
};

export type JobProfitRow = {
  job_id: string;
  title: string;
  status: JobStatus;
  management_company_id: Nullable<string>;
  billing_month: Nullable<string>;
  order_amount: Nullable<number>;
  referral_fee: Nullable<number>;
  inspection_date: Nullable<string>;
  inspector_name: Nullable<string>;
  work_end_date: Nullable<string>;
  key_returned_at: Nullable<string>;
  billed_at: Nullable<string>;
  payment_received_at: Nullable<string>;
  outsourcing_total: Nullable<number>;
  contractor_names: Nullable<string>;
  gross_profit: Nullable<number>;
  gross_margin_percent: Nullable<number>;
};
