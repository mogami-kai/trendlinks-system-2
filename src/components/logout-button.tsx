"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

export const LogoutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onLogout}
      disabled={loading}
    >
      <LogOut size={14} />
      {loading ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
};
