const HIGGSFIELD_BASE = "https://api.higgsfield.ai/v1";
const API_KEY = process.env.HIGGSFIELD_API_KEY!;

interface GenerateVideoOptions {
  imageUrl: string;
  prompt: string;
  duration?: number;
  aspectRatio?: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "done" | "failed";
  output?: { url: string }[];
  error?: string;
}

async function hfFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${HIGGSFIELD_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Higgsfield ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export async function startVideoGeneration({
  imageUrl,
  prompt,
  duration = 3,
  aspectRatio = "9:16",
}: GenerateVideoOptions): Promise<string> {
  const body = {
    model: "seedance_2_0",
    medias: [{ role: "start_image", value: imageUrl }],
    prompt,
    duration,
    aspect_ratio: aspectRatio,
  };
  const data = await hfFetch("/generate", { method: "POST", body: JSON.stringify(body) });
  return data.id as string;
}

export async function pollVideoJob(jobId: string): Promise<string> {
  const MAX_WAIT_MS = 5 * 60 * 1000;
  const POLL_INTERVAL = 5000;
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    const data: JobStatus = await hfFetch(`/jobs/${jobId}`);
    if (data.status === "done") {
      const url = data.output?.[0]?.url;
      if (!url) throw new Error("Job done but no output URL");
      return url;
    }
    if (data.status === "failed") {
      throw new Error(data.error ?? "Video generation failed");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error("Video generation timed out");
}
