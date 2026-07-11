"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_GAIN, getTrackTheme, getTrackGain } from "@/lib/bgmTracks";
import { dispatchVisualTheme, dispatchRipple } from "@/lib/ascii/events";

export type VolumeState = "full" | "off";

const FADE_MS = 800;
const FADE_STEPS = 20;

function createAudioCtx(): AudioContext {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor();
}

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
 * - 곡마다 bgmTracks의 정규화 배율(gain)을 곱해 모든 곡이 같은 체감 음량으로 재생
 * - 곡이 바뀔 때마다 bgmTracks의 트랙 테마를 시각 이벤트로 브로드캐스트
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
  const volumeStateRef = useRef<VolumeState>("full");
  const fadeTimersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  /** setGain으로 마지막에 쓴 값. 페이드 중 스킵 연타 시 팝 없이 이어서 페이드하기 위함 */
  const lastGainRef = useRef(BASE_GAIN);
  /** 스킵 페이드아웃이 src 교체를 예약해 둔 상태 (onEnded/음소거가 이를 존중해야 한다) */
  const pendingSwapRef = useRef(false);
  /** 사용자가 볼륨 버튼으로 직접 끈 상태 — 자동재생 차단으로 꺼진 것과 구분한다 */
  const mutedByUserRef = useRef(false);

  const clearFadeTimers = useCallback(() => {
    for (const timer of fadeTimersRef.current) clearInterval(timer);
    fadeTimersRef.current = [];
  }, []);

  /** 현재 곡의 정규화 배율이 반영된 재생 게인 (곡 로드 전엔 BASE_GAIN) */
  const currentEffectiveGain = useCallback(() => {
    const track = listRef.current[indexRef.current];
    return BASE_GAIN * (track ? getTrackGain(track) : 1);
  }, []);

  const setGain = useCallback((value: number) => {
    lastGainRef.current = value;
    const gain = gainNodeRef.current;
    const audio = audioRef.current;
    if (gain) gain.gain.value = value;
    else if (audio) try { audio.volume = Math.min(1, value); } catch {}
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
    volumeStateRef.current = state;
    setVolumeState(state);
    if (state === "off") {
      // 진행 중인 페이드가 음소거를 되살리지 못하게 끊고,
      // 스킵이 예약해 둔 곡 교체가 있으면 조용히 마무리한다
      clearFadeTimers();
      const audio = audioRef.current;
      if (pendingSwapRef.current && audio) {
        pendingSwapRef.current = false;
        const track = listRef.current[indexRef.current];
        if (track) {
          audio.src = `/bgm/${track}`;
          normalizePlaybackRate();
        }
      }
      setGain(0);
      audio?.pause();
    } else {
      setGain(currentEffectiveGain());
    }
  }, [clearFadeTimers, currentEffectiveGain, normalizePlaybackRate, setGain]);

  /** 오디오 엘리먼트를 GainNode 그래프에 물린다. 컨텍스트는 호출부가 준비한다. */
  const buildAudioGraph = useCallback((ctx: AudioContext) => {
    const audio = audioRef.current;
    if (!audio) return false;
    const gain = ctx.createGain();
    gain.gain.value = volumeStateRef.current === "off" ? 0 : lastGainRef.current;
    const source = ctx.createMediaElementSource(audio);
    source.connect(gain);
    gain.connect(ctx.destination);
    // 볼륨 제어를 게인 노드에 전적으로 맡긴다
    try { audio.volume = 1; } catch {}
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
    return true;
  }, []);

  /**
   * 자동재생이 허용된 환경이면 첫 사용자 제스처를 기다리지 않고 그래프를 미리 만든다.
   * 재생 '중'에 createMediaElementSource로 출력을 갈아끼우면 소리가 순간 끊기고,
   * AudioContext 생성 비용이 첫 클릭 프레임의 랙에 더해지기 때문에 재생 시작 전에 만든다.
   * 정책상 잠긴(suspended) 컨텍스트에 물리면 소리가 아예 안 나므로, 그 경우엔 닫고
   * 기존대로 첫 제스처(ensureAudioGraph)에 맡긴다 — 그때는 어차피 재생 전이라 안 끊긴다.
   */
  const tryEagerAudioGraph = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const ctx = createAudioCtx();
      if (ctx.state === "running") buildAudioGraph(ctx);
      else ctx.close();
    } catch {}
  }, [buildAudioGraph]);

  /** 첫 사용자 인터랙션에서 Web Audio 그래프를 지연 생성/재개한다. */
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return;
    }
    if (!audioRef.current) return;
    const ctx = createAudioCtx();
    if (!buildAudioGraph(ctx)) return;
    ctx.resume();
    if (volumeStateRef.current === "off") audioRef.current.pause();
  }, [buildAudioGraph]);

  /**
   * play() 실패 처리: 자동재생 차단(NotAllowedError)일 때만 음소거로 전환한다.
   * src 교체로 이전 play()가 중단된 AbortError까지 음소거로 오인하면 안 된다.
   */
  const muteOnAutoplayBlock = useCallback((err: unknown) => {
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      setSyncedVolumeState("off");
    }
  }, [setSyncedVolumeState]);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || listRef.current.length === 0) return;
    clearFadeTimers();
    pendingSwapRef.current = false;
    indexRef.current = index;
    const track = listRef.current[index];
    audio.src = `/bgm/${track}`;
    normalizePlaybackRate();
    applyTrackTheme(track);
    const gainValue = volumeStateRef.current === "off" ? 0 : currentEffectiveGain();
    setGain(gainValue);
    // Web Audio 초기화 전에는 엘리먼트 볼륨이 폴백
    if (!gainNodeRef.current) try { audio.volume = Math.min(1, gainValue); } catch {}
    audio.play()
      .then(() => {
        if (volumeStateRef.current === "off") audio.pause();
      })
      .catch(muteOnAutoplayBlock);
  }, [applyTrackTheme, clearFadeTimers, currentEffectiveGain, muteOnAutoplayBlock, normalizePlaybackRate, setGain]);

  const getNextTrackIndex = useCallback(() => {
    const list = listRef.current;
    if (list.length < 2) return indexRef.current;
    return (indexRef.current + 1) % list.length;
  }, []);

  const cycleVolume = useCallback(() => {
    ensureAudioGraph();
    if (volumeStateRef.current === "full") {
      mutedByUserRef.current = true;
      setSyncedVolumeState("off");
    } else {
      mutedByUserRef.current = false;
      setSyncedVolumeState("full");
      normalizePlaybackRate();
      audioRef.current?.play().catch(() => {});
    }
  }, [ensureAudioGraph, normalizePlaybackRate, setSyncedVolumeState]);

  /**
   * 외부 링크로 떠날 때 호출: 다른 사이트 소리와 겹치지 않게 BGM을 끈다.
   * 사용자가 직접 끈 게 아니므로, 돌아와서 화면을 클릭하면 resumeIfAutoMuted가
   * 다시 켤 수 있다. 호출부는 클릭 이벤트의 전파를 끊어야 한다 —
   * 같은 클릭이 window의 재생 동의 리스너에 닿으면 즉시 되살아난다.
   */
  const muteForExternalNav = useCallback(() => {
    if (volumeStateRef.current === "off") return;
    mutedByUserRef.current = false;
    setSyncedVolumeState("off");
  }, [setSyncedVolumeState]);

  /**
   * 화면 어딘가를 터치(클릭)한 것을 재생 동의로 간주한다:
   * 자동재생 차단 때문에 꺼져 있으면 다시 켠다. 사용자가 볼륨 버튼으로
   * 직접 껐다면 그 선택을 존중해 아무것도 하지 않는다.
   */
  const resumeIfAutoMuted = useCallback(() => {
    if (volumeStateRef.current !== "off" || mutedByUserRef.current) return;
    ensureAudioGraph();
    setSyncedVolumeState("full");
    normalizePlaybackRate();
    audioRef.current?.play().catch(muteOnAutoplayBlock);
  }, [ensureAudioGraph, muteOnAutoplayBlock, normalizePlaybackRate, setSyncedVolumeState]);

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
    // 인덱스는 즉시 전진: 페이드 중에 또 스킵해도 매번 다음 곡으로 간다
    indexRef.current = next;

    if (volumeStateRef.current === "off") {
      audio.src = `/bgm/${list[next]}`;
      normalizePlaybackRate();
      audio.pause();
      return;
    }

    pendingSwapRef.current = true;

    // 현재 실제 게인에서 페이드아웃 → 곡 교체 → 다음 곡의 정규화 게인으로 페이드인
    // (직전 페이드가 진행 중이었어도 lastGainRef 덕에 볼륨이 튀지 않는다)
    const fromGain = lastGainRef.current;
    const toGain = BASE_GAIN * getTrackGain(list[next]);

    const completeSwap = () => {
      pendingSwapRef.current = false;
      audio.src = `/bgm/${list[next]}`;
      normalizePlaybackRate();
      if (volumeStateRef.current === "off") {
        audio.pause();
        return;
      }
      audio.play()
        .then(() => {
          if (volumeStateRef.current === "off") audio.pause();
        })
        .catch(muteOnAutoplayBlock);

      let stepIn = 0;
      const fadeIn = setInterval(() => {
        stepIn++;
        if (volumeStateRef.current === "off") {
          clearInterval(fadeIn);
          return;
        }
        setGain(toGain * Math.min(1, stepIn / FADE_STEPS));
        if (stepIn >= FADE_STEPS) clearInterval(fadeIn);
      }, FADE_MS / FADE_STEPS);
      fadeTimersRef.current.push(fadeIn);
    };

    // 이미 사실상 무음이면(직전 스킵 직후 등) 페이드아웃을 생략해 무음 구간을 만들지 않는다
    if (fromGain <= toGain * 0.02) {
      completeSwap();
      return;
    }

    let step = 0;
    const fadeOut = setInterval(() => {
      step++;
      setGain(fromGain * (1 - step / FADE_STEPS));
      if (step < FADE_STEPS) return;
      clearInterval(fadeOut);
      completeSwap();
    }, FADE_MS / FADE_STEPS);
    fadeTimersRef.current.push(fadeOut);
  }, [applyTrackTheme, clearFadeTimers, getNextTrackIndex, muteOnAutoplayBlock, normalizePlaybackRate, setGain]);

  /** <audio>의 onEnded에 연결: 다음 곡 자동 재생 */
  const onTrackEnded = useCallback(() => {
    if (!listRef.current.length) return;
    // 스킵 페이드아웃이 곧 src를 교체할 예정이면 그쪽에 맡긴다
    if (pendingSwapRef.current) return;
    // src가 방금 교체됐다면 이전 곡의 ended 이벤트가 뒤늦게 도착한 것 — 새 src는 ended가 아니다
    if (audioRef.current && !audioRef.current.ended) return;
    playTrack(getNextTrackIndex());
  }, [getNextTrackIndex, playTrack]);

  // 플레이리스트 로드 + 첫 곡 재생
  useEffect(() => {
    fetch("/api/bgm")
      .then((r) => r.json())
      .then(({ files }: { files: string[] }) => {
        if (!files?.length) return;
        listRef.current = shuffle(files);
        // 자동재생이 허용된 환경이면 재생 시작 전에 그래프를 만들어 둔다
        // (첫 클릭에서 재생 중 경로 교체로 생기던 순간 끊김 방지)
        tryEagerAudioGraph();
        playTrack(0);
      })
      .catch(() => {});
  }, [playTrack, tryEagerAudioGraph]);

  useEffect(() => clearFadeTimers, [clearFadeTimers]);

  return {
    audioRef,
    volumeState,
    cycleVolume,
    skipToNextTrack,
    ensureAudioGraph,
    resumeIfAutoMuted,
    muteForExternalNav,
    onTrackEnded,
  };
}
