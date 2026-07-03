"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTrackTheme } from "@/lib/bgmThemes";
import { dispatchVisualTheme, dispatchRipple } from "@/lib/ascii/events";

export type VolumeState = "full" | "off";

const BASE_GAIN = 0.3;
const FADE_MS = 800;
const FADE_STEPS = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * BGM 재생 전담 훅.
 * - /api/bgm 목록을 셔플해 순환 재생
 * - Web Audio GainNode로 볼륨 제어 (iOS 대응), 곡 전환 시 페이드아웃/인
 * - 곡이 바뀔 때마다 bgmThemes의 트랙 테마를 시각 이벤트로 브로드캐스트
 *
 * 반환한 audioRef와 onTrackEnded를 <audio> 엘리먼트에 연결해야 한다.
 */
export function useBgmPlayer() {
  const [volumeState, setVolumeState] = useState<VolumeState>("full");

  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const gainValueRef = useRef(BASE_GAIN);
  const volumeStateRef = useRef<VolumeState>("full");
  const fadeTimersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearFadeTimers = useCallback(() => {
    for (const timer of fadeTimersRef.current) clearInterval(timer);
    fadeTimersRef.current = [];
  }, []);

  const setGain = useCallback((value: number) => {
    const gain = gainNodeRef.current;
    const audio = audioRef.current;
    if (gain) gain.gain.value = value;
    else if (audio) try { audio.volume = value; } catch {}
  }, []);

  const normalizePlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
  }, []);

  const applyTrackTheme = useCallback((fileName: string, transition = false) => {
    const theme = getTrackTheme(fileName);
    dispatchVisualTheme({ ...theme, transition });
    return theme;
  }, []);

  const setSyncedVolumeState = useCallback((state: VolumeState) => {
    const nextGain = state === "full" ? BASE_GAIN : 0;
    volumeStateRef.current = state;
    gainValueRef.current = nextGain;
    setVolumeState(state);
    setGain(nextGain);
    if (state === "off") audioRef.current?.pause();
  }, [setGain]);

  /** 첫 사용자 인터랙션에서 Web Audio 그래프를 지연 생성/재개한다. */
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = volumeStateRef.current === "off" ? 0 : gainValueRef.current;
    const source = ctx.createMediaElementSource(audio);
    source.connect(gain);
    gain.connect(ctx.destination);
    // 볼륨 제어를 게인 노드에 전적으로 맡긴다
    try { audio.volume = 1; } catch {}
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
    ctx.resume();
    if (volumeStateRef.current === "off") audio.pause();
  }, []);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || listRef.current.length === 0) return;
    const track = listRef.current[index];
    audio.src = `/bgm/${track}`;
    normalizePlaybackRate();
    applyTrackTheme(track);
    // Web Audio 초기화 전에는 엘리먼트 볼륨이 폴백
    try { audio.volume = gainValueRef.current; } catch {}
    audio.play()
      .then(() => {
        if (volumeStateRef.current === "off") audio.pause();
      })
      .catch(() => setSyncedVolumeState("off"));
  }, [applyTrackTheme, normalizePlaybackRate, setSyncedVolumeState]);

  const getNextTrackIndex = useCallback(() => {
    const list = listRef.current;
    if (list.length < 2) return indexRef.current;
    return (indexRef.current + 1) % list.length;
  }, []);

  const cycleVolume = useCallback(() => {
    ensureAudioGraph();
    if (volumeStateRef.current === "full") {
      setSyncedVolumeState("off");
    } else {
      setSyncedVolumeState("full");
      normalizePlaybackRate();
      audioRef.current?.play().catch(() => {});
    }
  }, [ensureAudioGraph, normalizePlaybackRate, setSyncedVolumeState]);

  /** 페이지 로드 때 만들어진 랜덤 순서를 따라 다음 곡으로 전환 (좌표에서 리플 발사) */
  const skipToNextTrack = useCallback((originX: number, originY: number) => {
    const list = listRef.current;
    const next = getNextTrackIndex();
    if (!list.length || next === indexRef.current) return;
    const nextTheme = applyTrackTheme(list[next], true);

    // 다음 곡 색의 진한 리플 발사
    dispatchRipple({ x: originX, y: originY, color: nextTheme.rippleColor });

    const audio = audioRef.current;
    if (!audio) return;
    clearFadeTimers();

    if (volumeStateRef.current === "off") {
      indexRef.current = next;
      audio.src = `/bgm/${list[next]}`;
      normalizePlaybackRate();
      audio.pause();
      return;
    }

    // 볼륨 페이드아웃 → 곡 교체 → 페이드인
    const savedGain = gainValueRef.current;
    let step = 0;
    const fadeOut = setInterval(() => {
      step++;
      setGain(savedGain * (1 - step / FADE_STEPS));
      if (step < FADE_STEPS) return;
      clearInterval(fadeOut);

      indexRef.current = next;
      audio.src = `/bgm/${list[next]}`;
      normalizePlaybackRate();
      audio.play().catch(() => setSyncedVolumeState("off"));

      let stepIn = 0;
      const fadeIn = setInterval(() => {
        stepIn++;
        setGain(savedGain * Math.min(1, stepIn / FADE_STEPS));
        if (stepIn >= FADE_STEPS) clearInterval(fadeIn);
      }, FADE_MS / FADE_STEPS);
      fadeTimersRef.current.push(fadeIn);
    }, FADE_MS / FADE_STEPS);
    fadeTimersRef.current.push(fadeOut);
  }, [applyTrackTheme, clearFadeTimers, getNextTrackIndex, normalizePlaybackRate, setGain, setSyncedVolumeState]);

  /** <audio>의 onEnded에 연결: 다음 곡 자동 재생 */
  const onTrackEnded = useCallback(() => {
    if (!listRef.current.length) return;
    indexRef.current = getNextTrackIndex();
    playTrack(indexRef.current);
  }, [getNextTrackIndex, playTrack]);

  // 플레이리스트 로드 + 첫 곡 재생
  useEffect(() => {
    fetch("/api/bgm")
      .then((r) => r.json())
      .then(({ files }: { files: string[] }) => {
        if (!files?.length) return;
        listRef.current = shuffle(files);
        indexRef.current = 0;
        playTrack(0);
      })
      .catch(() => {});
  }, [playTrack]);

  useEffect(() => clearFadeTimers, [clearFadeTimers]);

  return {
    audioRef,
    volumeState,
    cycleVolume,
    skipToNextTrack,
    ensureAudioGraph,
    onTrackEnded,
  };
}
