import { createClient } from "./client";

export interface UploadResult {
  url: string;
  path: string;
}

export type UploadBucket = "avatars" | "covers" | "events";

/**
 * Upload a File to the given Supabase Storage bucket under the current user's
 * folder. Path is `<userId>/<timestamp>-<safe-filename>`. Requires the user to
 * be signed in; throws otherwise.
 *
 * The bucket is assumed to be public — the returned `url` is the public CDN URL.
 */
export async function uploadImage({
  bucket,
  file,
}: {
  bucket: UploadBucket;
  file: File;
}): Promise<UploadResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("You need to be signed in to upload.");

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80) || "upload";
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
