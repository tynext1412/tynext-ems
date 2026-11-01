import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { daypartAt, type Daypart } from "../domain/daypart";
import { startGaplessLoop, supportsGaplessLoop } from "./video/gapless-loop";

const VIDEO: Record<Daypart, string> = { day: "/day.mp4", night: "/night.mp4" };
const RECHECK_MS = 60_000;

// Latar video halaman login (public/day.mp4 dan public/night.mp4): dipilih menurut jam lokal
// perangkat dan dicek ulang tiap menit; selalu tanpa suara, tanpa kontrol, dan terus berulang
// tanpa jeda lewat MSE (lihat video/gapless-loop.ts). Browser tanpa MSE memakai atribut `loop` biasa.
export function LoginVideoBackdrop({ className }: { className?: string }) {
  const [daypart, setDaypart] = useState<Daypart>(() => daypartAt(new Date()));
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<"gapless" | "native">(() => (supportsGaplessLoop() ? "gapless" : "native"));
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = setInterval(() => setDaypart(daypartAt(new Date())), RECHECK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // `muted` dipaksa lewat properti (React tidak selalu menulis atributnya) supaya autoplay diizinkan browser.
    video.muted = true;
    video.defaultMuted = true;
    if (mode !== "gapless") {
      video.play().catch(() => {
        /* autoplay ditolak: frame pertama tetap jadi latar */
      });
      return;
    }
    const controller = new AbortController();
    startGaplessLoop(video, VIDEO[daypart], controller.signal).catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setMode("native");
    });
    return () => controller.abort();
  }, [daypart, mode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) video.pause();
    else video.play().catch(() => {});
  }, [reducedMotion]);

  if (failed) return null;

  return (
    <video
      key={`${mode}-${daypart}`}
      ref={videoRef}
      src={mode === "native" ? VIDEO[daypart] : undefined}
      loop={mode === "native"}
      autoPlay={mode === "native" && !reducedMotion}
      className={className}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      controls={false}
      aria-hidden
      tabIndex={-1}
      onError={() => (mode === "gapless" ? setMode("native") : setFailed(true))}
      data-daypart={daypart}
      data-mode={mode}
    />
  );
}
