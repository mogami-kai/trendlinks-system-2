import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

let browserClient:
  | ReturnType<typeof createBrowserClient>
  | undefined;

export const createClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
    );
  }

  return browserClient;
};
