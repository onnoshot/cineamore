import { createClient } from "./client";

const BUCKET = "cineamore";

export async function uploadImage(
  blob: Blob,
  path: string
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteFile(path: string) {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
