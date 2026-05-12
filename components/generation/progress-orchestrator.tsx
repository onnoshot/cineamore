"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGenerationStore } from "@/store/generation-store";
import { hapticSuccess, hapticError } from "@/lib/utils/haptic";
import { SCENES } from "@/lib/ai/prompts";

export function ProgressOrchestrator() {
  const router = useRouter();
  const store = useGenerationStore();
  const started = useRef(false);

  const runPipeline = useCallback(async () => {
    const { jobId, manRef, womanRef, updateScene, setFinalVideoUrl, setOverallError } = store;
    if (!jobId || !manRef || !womanRef) return;

    try {
      // Step 1: Generate all 4 images in parallel
      const imagePromises = SCENES.map((_, i) =>
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, sceneIndex: i, manUrl: manRef, womanUrl: womanRef }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `Scene ${i} image failed`);
          updateScene(i, { imageUrl: data.imageUrl, status: "generating-video" });
          hapticSuccess();
          return data.imageUrl as string;
        }).catch((err: Error) => {
          updateScene(i, { status: "error", error: err.message });
          throw err;
        })
      );

      // Update status as each starts
      SCENES.forEach((_, i) => updateScene(i, { status: "generating-image" }));

      const imageUrls = await Promise.all(imagePromises);

      // Step 2: Generate all 4 videos in parallel (after images)
      const videoPromises = imageUrls.map((imageUrl, i) =>
        fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, sceneIndex: i, imageUrl }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `Scene ${i} video failed`);
          updateScene(i, { videoUrl: data.videoUrl, status: "done" });
          hapticSuccess();
          return data.videoUrl as string;
        }).catch((err: Error) => {
          updateScene(i, { status: "error", error: err.message });
          throw err;
        })
      );

      const videoUrls = await Promise.all(videoPromises);

      // Step 3: Finalize
      store.setPhase("finalizing");
      const userEmail = (() => {
        try { return JSON.parse(localStorage.getItem("cineamore_user") ?? "{}").email ?? null; }
        catch { return null; }
      })();
      const finalRes = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, videoUrls, email: userEmail }),
      });
      const finalData = await finalRes.json();
      if (!finalRes.ok) throw new Error(finalData.error ?? "Finalize failed");

      setFinalVideoUrl(finalData.finalVideoUrl);
      hapticSuccess();
      router.push(`/create/${jobId}`);
    } catch (err: unknown) {
      hapticError();
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      setOverallError(msg);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      runPipeline();
    }
  }, [runPipeline]);

  return null;
}
