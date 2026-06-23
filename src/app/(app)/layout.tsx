import { requireSession } from "@/lib/auth";
import { Sidebar, BottomNav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <div className="flex min-h-screen">
      <Sidebar companyName={session.companyName} role={session.role} />
      <div className="flex-1 pb-16 md:pb-0">
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
