import { supabase } from "./client";

const BUCKET = "cineamore";

export async function uploadImage(
  blob: Blob,
  path: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteFile(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}
