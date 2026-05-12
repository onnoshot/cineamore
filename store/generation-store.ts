import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SceneStatus = "idle" | "generating-image" | "generating-video" | "done" | "error";

export interface SceneState {
  imageUrl?: string;
  videoUrl?: string;
  status: SceneStatus;
  error?: string;
}

export interface GenerationState {
  jobId: string | null;
  manRef: string | null;
  womanRef: string | null;
  manName: string;
  womanName: string;
  scenes: [SceneState, SceneState, SceneState, SceneState];
  finalVideoUrl: string | null;
  phase: "idle" | "uploading" | "generating" | "finalizing" | "done" | "error";
  overallError: string | null;

  // Actions
  setRefs: (manRef: string, womanRef: string) => void;
  setNames: (manName: string, womanName: string) => void;
  setJobId: (id: string) => void;
  setPhase: (phase: GenerationState["phase"]) => void;
  updateScene: (index: number, update: Partial<SceneState>) => void;
  setFinalVideoUrl: (url: string) => void;
  setOverallError: (error: string) => void;
  reset: () => void;
}

const defaultScenes: [SceneState, SceneState, SceneState, SceneState] = [
  { status: "idle" },
  { status: "idle" },
  { status: "idle" },
  { status: "idle" },
];

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set) => ({
      jobId: null,
      manRef: null,
      womanRef: null,
      manName: "Sen",
      womanName: "O",
      scenes: defaultScenes,
      finalVideoUrl: null,
      phase: "idle",
      overallError: null,

      setRefs: (manRef, womanRef) => set({ manRef, womanRef }),
      setNames: (manName, womanName) => set({ manName, womanName }),
      setJobId: (jobId) => set({ jobId }),
      setPhase: (phase) => set({ phase }),
      updateScene: (index, update) =>
        set((state) => {
          const scenes = [...state.scenes] as GenerationState["scenes"];
          scenes[index] = { ...scenes[index], ...update };
          return { scenes };
        }),
      setFinalVideoUrl: (finalVideoUrl) => set({ finalVideoUrl, phase: "done" }),
      setOverallError: (overallError) => set({ overallError, phase: "error" }),
      reset: () =>
        set({
          jobId: null,
          manRef: null,
          womanRef: null,
          manName: "Sen",
          womanName: "O",
          scenes: defaultScenes,
          finalVideoUrl: null,
          phase: "idle",
          overallError: null,
        }),
    }),
    { name: "cineamore-generation" }
  )
);
