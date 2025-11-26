"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import Image from "next/image";

type Mode = "config" | "running" | "paused" | "finished";
type Phase = "work" | "rest";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

// Para el reloj gigante (solo segundos si es <100)
function formatBigTime(totalSeconds: number) {
  if (totalSeconds < 100) {
    return String(totalSeconds).padStart(2, "0");
  }
  return formatTime(totalSeconds);
}

// Fondo según fase
function getPhaseBgClass(mode: Mode, phase: Phase | null): string {
  if (mode === "config") {
    return "from-slate-800 via-slate-900 to-black";
  }
  if (mode === "finished") {
    return "from-emerald-500 via-slate-900 to-black";
  }
  if (phase === "work") {
    return "from-fuchsia-700 via-slate-900 to-black";
  }
  if (phase === "rest") {
    return "from-cyan-700 via-slate-900 to-black";
  }
  return "from-slate-800 via-slate-900 to-black";
}

// Vibración segura (solo si existe y está activada)
function triggerVibration(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    (navigator as any).vibrate(pattern);
  } catch {
    // ignorar errores
  }
}

export default function HiitPage() {
  // Config (permiten "" mientras escribes)
  const [workSeconds, setWorkSeconds] = useState<number | "">(20);
  const [restSeconds, setRestSeconds] = useState<number | "">(10);
  const [rounds, setRounds] = useState<number | "">(8);

  // Estado del timer
  const [mode, setMode] = useState<Mode>("config");
  const [phase, setPhase] = useState<Phase | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [remaining, setRemaining] = useState(0);

  // Flag para saber si estamos en el 3-2-1 inicial
  const [isPrestart, setIsPrestart] = useState(false);

  // Sonido / vibración
  const [soundOn, setSoundOn] = useState(true);
  const [beepVolume, setBeepVolume] = useState(0.8);
  const [vibrationOn, setVibrationOn] = useState(false);
  const [toneReady, setToneReady] = useState(false);

  const zeroHandledRef = useRef(false);

  async function ensureToneStarted() {
    if (!toneReady) {
      await Tone.start();
      setToneReady(true);
    }
  }

  // Normalizar valores numéricos para la lógica
  const workVal = typeof workSeconds === "number" ? workSeconds : 0;
  const restVal = typeof restSeconds === "number" ? restSeconds : 0;
  const roundsVal = typeof rounds === "number" ? rounds : 0;

  // ---------- BEEPS ----------

  function playShortBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();
      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      }).connect(gain);

      const now = Tone.now();
      synth.triggerAttackRelease("A5", 0.12, now);

      setTimeout(() => {
        synth.dispose();
        gain.dispose();
      }, 250);
    }

    triggerVibration(vibrationOn, 80);
  }

  function playLongBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();
      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.7, release: 1.8 },
      }).connect(gain);

      const now = Tone.now();
      synth.triggerAttackRelease("A5", 2, now);

      setTimeout(() => {
        synth.dispose();
        gain.dispose();
      }, 2200);
    }

    triggerVibration(vibrationOn, 200);
  }

  function playEndBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();
      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0.2, release: 0.25 },
      }).connect(gain);

      const now = Tone.now();
      synth.triggerAttackRelease("A5", 0.12, now);
      synth.triggerAttackRelease("C6", 0.12, now + 0.18);
      synth.triggerAttackRelease("E6", 0.2, now + 0.36);

      setTimeout(() => {
        synth.dispose();
        gain.dispose();
      }, 1000);
    }

    triggerVibration(vibrationOn, [120, 80, 150]);
  }

  // ---------- TIMER PRINCIPAL ----------

  useEffect(() => {
    if (mode !== "running") return;

    const id = window.setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [mode]);

  // 3-2-1 beeps (prestart + normal)
  useEffect(() => {
    if (mode !== "running") return;
    if (remaining === 3 || remaining === 2 || remaining === 1) {
      playShortBeep();
    }
  }, [remaining, mode]);

  // Lógica cuando remaining llega a 0
  useEffect(() => {
    if (mode !== "running") {
      zeroHandledRef.current = false;
      return;
    }
    if (remaining > 0) {
      zeroHandledRef.current = false;
      return;
    }
    if (remaining !== 0) return;
    if (!phase) return;
    if (zeroHandledRef.current) return;

    zeroHandledRef.current = true;
    playLongBeep();

    const timeout = setTimeout(() => {
      // PRE-START: al terminar el 3-2-1
      if (isPrestart) {
        setIsPrestart(false);
        setRemaining(workVal);
        zeroHandledRef.current = false;
        return;
      }

      // Flujo normal work / rest / finish
      if (phase === "work") {
        if (restVal > 0) {
          setPhase("rest");
          setRemaining(restVal);
        } else {
          if (currentRound < roundsVal) {
            setCurrentRound((r) => r + 1);
            setPhase("work");
            setRemaining(workVal);
          } else {
            setMode("finished");
            setPhase(null);
            setRemaining(0);
            setIsPrestart(false);
            playEndBeep();
          }
        }
      } else if (phase === "rest") {
        if (currentRound < roundsVal) {
          setCurrentRound((r) => r + 1);
          setPhase("work");
          setRemaining(workVal);
        } else {
          setMode("finished");
          setPhase(null);
          setRemaining(0);
          setIsPrestart(false);
          playEndBeep();
        }
      }

      zeroHandledRef.current = false;
    }, 2000);

    return () => clearTimeout(timeout);
  }, [remaining, mode, phase, currentRound, workVal, restVal, roundsVal, isPrestart]);

  // ---------- CONTROLES ----------

  const hasValidConfig =
    typeof workSeconds === "number" &&
    typeof restSeconds === "number" &&
    typeof rounds === "number" &&
    workVal > 0 &&
    roundsVal > 0 &&
    restVal >= 0;

  async function startTimer() {
    if (!hasValidConfig) return;
    await ensureToneStarted();

    // PRE-START: 3-2-1-0 con fondo “prepare”
    setMode("running");
    setPhase("work"); // para lógica y para que ya cuente como fase de trabajo
    setCurrentRound(1);
    setIsPrestart(true);
    setRemaining(3);
    zeroHandledRef.current = false;
  }

  function pauseTimer() {
    if (mode === "running") setMode("paused");
  }

  function resumeTimer() {
    if (mode === "paused") setMode("running");
  }

  function resetToConfig() {
    setMode("config");
    setPhase(null);
    setCurrentRound(1);
    setRemaining(0);
    setIsPrestart(false);
    zeroHandledRef.current = false;
  }

  // Fondo: si es prestart, usamos el amarillo “prepare”
const bgClass = isPrestart
  ? "from-slate-900 via-emerald-500/60 to-black"
  : getPhaseBgClass(mode, phase);

  // ---------- HANDLERS DE INPUT ----------

  function handleWorkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value === "") {
      setWorkSeconds("");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) return;
    setWorkSeconds(Math.max(5, Math.min(600, n)));
  }

  function handleRestChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value === "") {
      setRestSeconds("");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) return;
    setRestSeconds(Math.max(0, Math.min(600, n)));
  }

  function handleRoundsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value === "") {
      setRounds("");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) return;
    setRounds(Math.max(1, Math.min(50, n)));
  }

  // ---------- UI ----------

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${bgClass} text-slate-100 flex items-center justify-center`}
    >
      {/* VISTA CONFIG */}
      {mode === "config" && (
        <div className="w-full max-w-xl mx-auto px-6 py-7 bg-slate-900/70 backdrop-blur rounded-2xl shadow-xl border border-slate-700">
          <div className="flex justify-center mb-4">
            <Image
              src="/1.png"
              alt="MonyFit Logo"
              width={80}
              height={80}
              className="drop-shadow-[0_0_12px_#c86bf4]"
            />
          </div>

          <h1 className="text-center text-2xl font-bold mb-1">
            MonyFit HIIT Pro
          </h1>
          <p className="text-center text-xs text-slate-400 mb-5">
            Timer HIIT rápido para gym: ajusta trabajo, descanso y rondas, y
            escucha los beeps estilo MonyFit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-5">
            <div>
              <p className="mb-1 text-slate-300">Trabajo (s)</p>
              <input
                type="number"
                min={5}
                max={600}
                value={workSeconds}
                onChange={handleWorkChange}
                className="w-full rounded-lg px-3 py-2 bg-slate-900 border border-slate-600"
              />
            </div>

            <div>
              <p className="mb-1 text-slate-300">Descanso (s)</p>
              <input
                type="number"
                min={0}
                max={600}
                value={restSeconds}
                onChange={handleRestChange}
                className="w-full rounded-lg px-3 py-2 bg-slate-900 border border-slate-600"
              />
            </div>

            <div>
              <p className="mb-1 text-slate-300">Rondas</p>
              <input
                type="number"
                min={1}
                max={50}
                value={rounds}
                onChange={handleRoundsChange}
                className="w-full rounded-lg px-3 py-2 bg-slate-900 border border-slate-600"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs mb-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={() => setSoundOn((v) => !v)}
                />
                <span>Sonido</span>
              </label>

              <div className="flex flex-col items-end gap-1">
                <span>Volumen beeps: {Math.round(beepVolume * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={beepVolume}
                  onChange={(e) => setBeepVolume(Number(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vibrationOn}
                  onChange={() => setVibrationOn((v) => !v)}
                />
                <span>Vibración (si el dispositivo lo soporta)</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-4">
            <button
              onClick={startTimer}
              disabled={!hasValidConfig}
              className={`w-full max-w-xs h-12 rounded-full text-lg font-semibold transition
              ${
                hasValidConfig
                  ? "bg-[#22c55e] hover:bg-[#4ade80] text-slate-900"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Empezar
            </button>

            <button
              onClick={resetToConfig}
              className="w-full max-w-xs h-10 rounded-full text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* VISTA FULL FOCUS */}
      {mode !== "config" && (
        <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col min-h-screen">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={resetToConfig}
              className="text-sm text-slate-200 bg-slate-900/70 px-4 py-2 rounded-full font-semibold hover:bg-slate-800"
            >
              ← Editar timer
            </button>

            <Image
              src="/1.png"
              alt="MonyFit Logo"
              width={60}
              height={60}
              className="drop-shadow-[0_0_10px_#c86bf4]"
            />

            {mode === "running" ? (
              <button
                onClick={pauseTimer}
                className="text-sm bg-yellow-400 text-slate-900 px-4 py-2 rounded-full font-semibold hover:bg-yellow-300"
              >
                Pausa
              </button>
            ) : mode === "paused" ? (
              <button
                onClick={resumeTimer}
                className="text-sm bg-emerald-400 text-slate-900 px-4 py-2 rounded-full font-semibold hover:bg-emerald-300"
              >
                Reanudar
              </button>
            ) : (
              <span className="text-sm text-emerald-300 font-semibold">
                Completado 🎉
              </span>
            )}
          </div>

          {/* Centro: fase + timer */}
          <div className="mt-4 mb-3 flex flex-col items-center">
            {mode !== "finished" && phase && (
              <>
                <div className="text-xs text-slate-200 mb-1">
                  Ronda {currentRound} de {roundsVal || 0}
                </div>
                <div className="text-lg font-semibold mb-2">
                  {isPrestart
                    ? "Comenzando"
                    : phase === "work"
                    ? "Work"
                    : "Rest"}
                </div>
              </>
            )}

            <div className="text-[32vw] md:text-[10vw] leading-none font-mono tracking-widest text-slate-100">
              {formatBigTime(remaining)}
            </div>

            {mode === "finished" && (
              <p className="mt-3 text-sm text-emerald-300">
                ¡HIIT completado! 🔥
              </p>
            )}
          </div>

          {/* Información de rondas abajo */}
          <div className="mt-2 mb-2 bg-slate-900/80 border border-slate-700 rounded-2xl flex-1 overflow-y-auto">
            {Array.from({ length: roundsVal || 0 }).map((_, idx) => {
              const isCurrent =
                mode !== "finished" && idx + 1 === currentRound;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 text-xs border-b border-slate-800 last:border-b-0 ${
                    isCurrent
                      ? "bg-[#c86bf4]/20 text-[#f2d6ff] font-semibold"
                      : "text-slate-200"
                  }`}
                >
                  <span>
                    Ronda {idx + 1} – {workVal}s work / {restVal}s rest
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
