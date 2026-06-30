import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export const Button = ({
  className,
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={clsx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm outline-none transition-[color,background-color,border-color,box-shadow] active:translate-y-px focus-visible:shadow-[0_0_0_3px_var(--ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" &&
        "bg-brand text-white hover:bg-brand-soft",
      variant === "secondary" &&
        "border border-line bg-white text-slate-700 hover:border-line-strong hover:bg-panel-strong",
      variant === "ghost" &&
        "text-slate-700 hover:bg-slate-100",
      variant === "danger" &&
        "bg-danger text-white hover:bg-red-800",
      className,
    )}
    {...props}
  />
);

export const LinkButton = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <Link
    href={href}
    className={clsx(
      "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition-[color,background-color,border-color,box-shadow] active:translate-y-px hover:bg-brand-soft focus-visible:shadow-[0_0_0_3px_var(--ring)]",
      className,
    )}
  >
    {children}
  </Link>
);

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={clsx(
      "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-0 transition placeholder:text-slate-400 hover:border-line-strong focus:border-brand-soft focus:shadow-[0_0_0_3px_var(--ring)]",
      className,
    )}
    {...props}
  />
);

export const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={clsx(
      "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-0 transition placeholder:text-slate-400 hover:border-line-strong focus:border-brand-soft focus:shadow-[0_0_0_3px_var(--ring)]",
      className,
    )}
    {...props}
  />
);

export const Select = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={clsx(
      "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-0 transition hover:border-line-strong focus:border-brand-soft focus:shadow-[0_0_0_3px_var(--ring)]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={clsx(
      "rounded-[24px] border border-line bg-panel shadow-[var(--shadow-card)]",
      className,
    )}
  >
    {children}
  </section>
);

export const CardHeader = ({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-start md:justify-between">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const CardBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={clsx("px-5 py-4", className)}>{children}</div>;

export const Field = ({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <label className="block space-y-1.5">
    <span className="block text-sm font-medium text-slate-700">{label}</span>
    {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    {children}
  </label>
);

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const StatCard = ({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
}) => (
  <Card className="overflow-hidden">
    <CardBody className="space-y-2">
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="tnum text-3xl font-semibold text-slate-900">{value}</div>
      {sublabel ? <p className="text-sm text-slate-500">{sublabel}</p> : null}
    </CardBody>
  </Card>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="rounded-[24px] border border-dashed border-line bg-white/70 px-6 py-12 text-center">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {description ? (
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const Badge = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
      className,
    )}
  >
    {children}
  </span>
);

export const DataGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={clsx("grid gap-4 md:grid-cols-2", className)}>{children}</div>
);

export const SectionLabel = ({
  children,
}: {
  children: ReactNode;
}) => (
  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
    {children}
  </h3>
);

export const TableWrap = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="thin-scrollbar overflow-x-auto rounded-[20px] border border-line bg-white">
    {children}
  </div>
);
