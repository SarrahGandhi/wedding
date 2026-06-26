"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SRC = "/audio/ambient.mp3";
const TARGET_VOLUME = 0.4; // capped so it never blasts, even at full device volume
const FADE_MS = 3000; // gentle fade-in to TARGET_VOLUME
const STORAGE_KEY = "bg-music"; // sessionStorage: { currentTime, playing }

type Saved = { currentTime: number; playing: boolean };

function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(value: Saved) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Safari private mode throws on setItem — playback still works, just no resume.
  }
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);
  const lastSaveRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  // Ramp volume from its current value up to TARGET_VOLUME over FADE_MS.
  const fadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) window.clearInterval(fadeRef.current);
    const start = performance.now();
    const from = audio.volume;
    fadeRef.current = window.setInterval(() => {
      const t = Math.min((performance.now() - start) / FADE_MS, 1);
      audio.volume = from + (TARGET_VOLUME - from) * t;
      if (t >= 1 && fadeRef.current) {
        window.clearInterval(fadeRef.current);
        fadeRef.current = null;
      }
    }, 50);
  };

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        fadeIn();
      })
      // Autoplay policy can reject before a gesture — keep the icon honest.
      .catch(() => setPlaying(false));
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      play();
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  // Restore saved position, then arm gentle auto-start on first interaction.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const saved = readSaved();
    if (saved) {
      const restore = () => {
        if (saved.currentTime && saved.currentTime < audio.duration) {
          audio.currentTime = saved.currentTime;
        }
      };
      if (audio.readyState >= 1) restore();
      else audio.addEventListener("loadedmetadata", restore, { once: true });
    }

    // Users who reduce motion likely also prefer no surprise audio — require an
    // explicit button press instead of auto-starting.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const onFirstInteraction = () => {
      if (audioRef.current?.paused) play();
    };
    document.addEventListener("pointerdown", onFirstInteraction, {
      once: true,
      passive: true,
    });
    document.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      document.removeEventListener("pointerdown", onFirstInteraction);
      document.removeEventListener("keydown", onFirstInteraction);
      if (fadeRef.current) window.clearInterval(fadeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist position (throttled) and play/pause state for resume-on-reload.
  const persist = (isPlaying: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    writeSaved({ currentTime: audio.currentTime, playing: isPlaying });
  };

  const onTimeUpdate = () => {
    const now = performance.now();
    if (now - lastSaveRef.current < 1000) return;
    lastSaveRef.current = now;
    persist(!audioRef.current?.paused);
  };

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="none"
        onTimeUpdate={onTimeUpdate}
        onPlay={() => persist(true)}
        onPause={() => persist(false)}
      >
        <source src={SRC} type="audio/mpeg" />
      </audio>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mute background music" : "Play background music"}
        aria-pressed={playing}
        title={playing ? "Mute music" : "Play music"}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-warm-white/75 text-text-secondary shadow-[0_16px_38px_-26px_rgba(90,80,90,0.45)] backdrop-blur-xl transition-transform duration-300 hover:scale-105"
      >
        {playing ? (
          <Volume2Icon className="h-5 w-5" strokeWidth={1.75} />
        ) : (
          <VolumeXIcon className="h-5 w-5" strokeWidth={1.75} />
        )}
      </button>
    </>
  );
}
