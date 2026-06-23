import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link href="/" className="mb-6 text-2xl font-bold text-brand-700">
        Trendlinks
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
