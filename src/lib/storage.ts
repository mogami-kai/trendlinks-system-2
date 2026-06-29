import { createClient } from "@/lib/supabase/browser";

export const createSignedUrl = async (bucket: string, path: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
};

export const createSignedUrlMap = async (bucket: string, paths: string[]) => {
  const filtered = paths.filter(Boolean);
  if (filtered.length === 0) {
    return {} as Record<string, string | null>;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(filtered, 60 * 10);

  if (error || !data) {
    return {} as Record<string, string | null>;
  }

  const urlMap: Record<string, string | null> = {};
  for (const item of data as Array<{ path: string; signedUrl?: string | null }>) {
    urlMap[item.path] = item.signedUrl ?? null;
  }

  return urlMap;
};

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  contentType?: string,
) => {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  });

  return { error };
};

export const removeFile = async (bucket: string, path: string) => {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  return { error };
};
