import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function concatVideosWithAudio(
  videoUrls: string[],
  audioPath: string
): Promise<Buffer> {
  const workDir = join(tmpdir(), `cineamore-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const localVideos: string[] = [];

  // Download each video
  for (let i = 0; i < videoUrls.length; i++) {
    const res = await fetch(videoUrls[i]);
    if (!res.ok) throw new Error(`Failed to download video ${i}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const filePath = join(workDir, `scene${i}.mp4`);
    await writeFile(filePath, buffer);
    localVideos.push(filePath);
  }

  const concatListPath = join(workDir, "list.txt");
  const listContent = localVideos.map((v) => `file '${v}'`).join("\n");
  await writeFile(concatListPath, listContent);

  const tempVideoPath = join(workDir, "temp_video.mp4");
  const finalPath = join(workDir, "final.mp4");

  // Step 1: concat
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(tempVideoPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  // Step 2: add audio
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(tempVideoPath)
      .input(audioPath)
      .outputOptions(["-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart"])
      .output(finalPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const { readFile } = await import("fs/promises");
  const buffer = await readFile(finalPath);

  // Cleanup
  await Promise.allSettled([
    ...localVideos.map(unlink),
    unlink(concatListPath),
    unlink(tempVideoPath),
    unlink(finalPath),
  ]);

  return buffer;
}
