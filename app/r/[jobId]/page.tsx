import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SharedResult } from "./shared-result";

export const revalidate = 0;

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) redirect("/create");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Generate a fresh signed URL — works as long as the file exists
  const { data, error } = await supabase.storage
    .from("cineamore")
    .createSignedUrl(`jobs/${jobId}/final.mp4`, 60 * 60 * 24); // 24h per visit

  if (error || !data?.signedUrl) redirect("/create");

  return <SharedResult videoUrl={data.signedUrl} />;
}
