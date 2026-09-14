/**
 * Clock + sampler for a guided chapter track.
 *
 * The keyframes run off `requestAnimationFrame`. Web's counterpart also lets a
 * dropped-in voiceover file own the clock instead — no such file exists yet
 * (see web's `public/learn/audio/README.md`: the whole point is a chapter
 * runs silently on its own timer until a recording is dropped in), so that
 * branch is left out here rather than wiring up untested native audio
 * playback for files that don't exist. `hasAudio` stays `false`; hook it up
 * to `expo-av`/`expo-audio` here if narration is ever recorded.
 *
 * The hook knows nothing about any particular track — see
 * {@link @/lib/learn/chapter-tracks} — and drives whatever chapters are in it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { compileChapter, parseTime } from "./chapter-player";
import type { Chapter, ChapterSimState } from "./chapter-kit";
import type { ChapterTrack } from "./chapter-tracks";

export type DayChapterPlayer = {
  track: ChapterTrack;
  chapters: Chapter[];
  chapter: Chapter;
  index: number;
  time: number;
  duration: number;
  playing: boolean;
  ended: boolean;
  showWelcome: boolean;
  hasAudio: boolean;
  state: ChapterSimState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (ms: number) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  dismissWelcome: () => void;
  setOnFrame: (fn: (s: ChapterSimState) => void) => void;
};

/**
 * Did anything *step* between two samples?
 *
 * Numbers ease every frame and are written straight to the scene's refs by the
 * frame callback, so they must not force a React render. Everything else —
 * layer flags, camera target, the overlay id, the highlight — changes rarely
 * and has to reach React the moment it does.
 */
function stepped(next: ChapterSimState, prev: ChapterSimState): boolean {
  for (const key of Object.keys(next) as (keyof ChapterSimState)[]) {
    const v = next[key];
    if (typeof v === "number") continue;
    if (v !== prev[key]) return true;
  }
  return false;
}

export function useChapterTrack(track: ChapterTrack | null): DayChapterPlayer | null {
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasAudio] = useState(false);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const lastUi = useRef(0);
  const onFrameRef = useRef<(s: ChapterSimState) => void>(() => {});

  /* A null track still has to run the hooks below, so it falls back to an
     empty chapter rather than returning early — the value is thrown away at
     the bottom. */
  const chapters = track?.chapters ?? EMPTY;
  const chapter = chapters[index] ?? chapters[0] ?? BLANK;
  const compiled = useMemo(() => compileChapter(chapter.defaults, chapter.frames), [chapter]);

  const [state, setState] = useState<ChapterSimState>(() => compiled.stateAt(0));
  const stateRef = useRef(state);
  stateRef.current = state;

  const apply = useCallback(
    (ms: number, forceUi = false) => {
      const clamped = Math.max(0, Math.min(compiled.duration, ms));
      timeRef.current = clamped;
      const next = compiled.stateAt(clamped);
      onFrameRef.current(next);
      const now = performance.now();
      /* Time on the scrubber can tick without cloning the whole sim state.
         Pushing a new `state` every 80ms was resetting focus / layers in React
         while the reader was using them — especially once `handsOff` is on
         and the instruments are supposed to belong to them. */
      if (forceUi || stepped(next, stateRef.current)) {
        lastUi.current = now;
        setTime(clamped);
        setState(next);
      } else if (playingRef.current && now - lastUi.current > 80) {
        lastUi.current = now;
        setTime(clamped);
        if (!stateRef.current.handsOff) setState(next);
      }
    },
    [compiled],
  );

  useEffect(() => {
    timeRef.current = 0;
    setTime(0);
    setEnded(false);
    playingRef.current = false;
    setPlaying(false);
    apply(0, true);
  }, [index, apply]);

  const enabled = Boolean(track);
  const isFree = Boolean(chapter.free);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      /* Always sample — even when paused — so a drag/zoom can ease back. */
      if (isFree || !playingRef.current) {
        last = now;
        apply(timeRef.current);
        return;
      }
      const dt = last ? now - last : 0;
      last = now;
      const next = timeRef.current + dt;
      if (next >= compiled.duration) {
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        apply(compiled.duration, true);
        return;
      }
      apply(next);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, compiled.duration, apply, isFree]);

  /**
   * Backgrounding the app pauses the chapter.
   *
   * Narration playing on into a backgrounded app is the obvious half. The
   * other half is that the animation is the narration's other track: come
   * back after two minutes away and the camera is mid-move for a beat that
   * already finished. Pausing keeps the two together.
   */
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" || !playingRef.current) return;
      playingRef.current = false;
      setPlaying(false);
    });
    return () => sub.remove();
  }, [enabled]);

  const play = useCallback(() => {
    if (isFree) return;
    setShowWelcome(false);
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
  }, [isFree]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(compiled.duration, ms));
      apply(clamped, true);
      if (clamped < compiled.duration) setEnded(false);
    },
    [apply, compiled.duration],
  );

  const count = chapters.length;
  const goTo = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(count - 1, i));
      playingRef.current = false;
      setPlaying(false);
      setShowWelcome(next === 0);
      setIndex(next);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const setOnFrame = useCallback((fn: (s: ChapterSimState) => void) => {
    onFrameRef.current = fn;
  }, []);

  if (!track) return null;

  return {
    track,
    chapters,
    chapter,
    index,
    time,
    duration: compiled.duration,
    playing,
    ended,
    showWelcome,
    hasAudio,
    state,
    play,
    pause,
    toggle: () => (playingRef.current ? pause() : play()),
    seek,
    goTo,
    next,
    prev,
    dismissWelcome: () => setShowWelcome(false),
    setOnFrame,
  };
}

const EMPTY: Chapter[] = [];

/** Stand-in while no track is mounted — never rendered, only kept type-honest. */
const BLANK: Chapter = {
  id: "",
  titleKey: "",
  free: true,
  defaults: {} as ChapterSimState,
  frames: [],
};

export function chapterDurationMs(chapter: Chapter): number {
  let max = 0;
  for (const frame of chapter.frames) {
    const at = parseTime(frame.meta.at);
    if (at > max) max = at;
  }
  return max;
}
