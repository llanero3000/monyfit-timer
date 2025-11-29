"use client";

import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import Link from "next/link";

type PhaseType = "prepare" | "work" | "rest" | "longBreak" | "custom";
type Mode = "editing" | "running" | "paused" | "finished";
type ThemeId = "dark" | "neon" | "ocean" | "sepia" | "soft";

interface Interval {
  id: number;
  type: PhaseType;
  label: string;
  duration: number; // segundos
}

interface SavedWorkout {
  id: string;
  name: string;
  intervals: Interval[];
  createdAt: number;
}

const STORAGE_KEY = "monyfit_saved_custom_workouts_v1";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

// Para el reloj grande: solo segundos si es < 100
function formatBigTime(totalSeconds: number) {
  if (totalSeconds < 100) {
    return String(totalSeconds).padStart(2, "0");
  }
  return formatTime(totalSeconds);
}

function getPhaseDefaults(type: PhaseType): { label: string; color: string } {
  switch (type) {
    case "prepare":
      return {
        label: "Prepare",
        color: "bg-amber-500/15 border-amber-400",
      };
    case "work":
      return {
        label: "Work",
        color: "bg-fuchsia-500/15 border-fuchsia-400",
      };
    case "rest":
      return {
        label: "Rest",
        color: "bg-cyan-500/15 border-cyan-400",
      };
    case "longBreak":
      return {
        label: "Break largo",
        color: "bg-emerald-500/15 border-emerald-400",
      };
    case "custom":
    default:
      return {
        label: "Ejercicio",
        color: "bg-slate-500/15 border-slate-400",
      };
  }
}

// Fondo por fase (para la PANTALLA DE ENTRENAMIENTO)
function getPhaseBgClass(type: PhaseType): string {
  switch (type) {
    case "prepare":
      return "from-amber-600 via-slate-900 to-black";
    case "work":
      return "from-fuchsia-700 via-slate-900 to-black";
    case "rest":
      return "from-cyan-700 via-slate-900 to-black";
    case "longBreak":
      return "from-emerald-600 via-slate-900 to-black";
    case "custom":
    default:
      return "from-slate-800 via-slate-900 to-black";
  }
}

// Fondo por TEMA (para el EDITOR)
function getThemeBgClass(theme: ThemeId): string {
  switch (theme) {
    case "neon":
      return "from-[#1e0538] via-[#020617] to-[#0f172a]";
    case "ocean":
      return "from-[#020617] via-[#022c4b] to-[#020617]";
    case "sepia":
      return "from-[#3b2c26] via-[#2b211d] to-black";
    case "soft":
      return "from-[#111827] via-[#1f2937] to-[#020617]";
    case "dark":
    default:
      return "from-[#020617] via-[#020617] to-black";
  }
}

// Vibración segura (como en HIIT Pro)
function triggerVibration(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    (navigator as any).vibrate(pattern);
  } catch {
    // ignoramos errores
  }
}

export default function CustomWorkoutPage() {
  const [intervals, setIntervals] = useState<Interval[]>([
    { id: 1, type: "prepare", label: "Prepare", duration: 10 },
    { id: 2, type: "work", label: "Work", duration: 20 },
    { id: 3, type: "rest", label: "Rest", duration: 10 },
  ]);

  const [mode, setMode] = useState<Mode>("editing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [soundOn, setSoundOn] = useState(true);
  const [beepVolume, setBeepVolume] = useState(0.8);
  const [vibrationOn, setVibrationOn] = useState(false);
  const [toneReady, setToneReady] = useState(false);

  const nextIdRef = useRef(4);
  const zeroHandledRef = useRef(false);

  // drag & drop
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // PRE-START global (3-2-1-0 antes de la rutina)
  const [isPrestart, setIsPrestart] = useState(false);

  // Tema visual (igual que HIIT / Settings)
  const [theme, setTheme] = useState<ThemeId>("dark");

  // Rutinas guardadas
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);

  // Cargar tema y rutinas guardadas
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawTheme = window.localStorage.getItem(
      "monyfit_theme"
    ) as ThemeId | null;
    if (
      rawTheme === "dark" ||
      rawTheme === "neon" ||
      rawTheme === "ocean" ||
      rawTheme === "sepia" ||
      rawTheme === "soft"
    ) {
      setTheme(rawTheme);
    } else {
      setTheme("dark");
    }

    const rawSaved = window.localStorage.getItem(STORAGE_KEY);
    if (rawSaved) {
      try {
        const parsed = JSON.parse(rawSaved) as SavedWorkout[];
        if (Array.isArray(parsed)) {
          setSavedWorkouts(parsed);
        }
      } catch {
        // si falla el parse, ignoramos
      }
    }
  }, []);

  function persistSaved(next: SavedWorkout[]) {
    setSavedWorkouts(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  async function ensureToneStarted() {
    if (!toneReady) {
      await Tone.start();
      setToneReady(true);
    }
  }

  // ---------- BEEPS (con vibración) ----------

  function playShortBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();

      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: {
          attack: 0.001,
          decay: 0.06,
          sustain: 0,
          release: 0.04,
        },
      }).connect(gain);

      const now = Tone.now();
      synth.triggerAttackRelease("A5", 0.12, now);

      setTimeout(() => {
        synth.dispose();
        gain.dispose();
      }, 250);
    }

    triggerVibration(vibrationOn, 80); // vibración cortica
  }

  function playLongBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();

      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0.7,
          release: 1.8,
        },
      }).connect(gain);

      const now = Tone.now();
      synth.triggerAttackRelease("A5", 2, now); // ~2s

      setTimeout(() => {
        synth.dispose();
        gain.dispose();
      }, 2200);
    }

    // vibración larga del mismo estilo que el beep (~2s)
    triggerVibration(vibrationOn, 2000);
  }

  function playEndBeep() {
    if (!soundOn && !vibrationOn) return;

    if (soundOn) {
      const gain = new Tone.Gain(beepVolume).toDestination();

      const synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: {
          attack: 0.001,
          decay: 0.12,
          sustain: 0.2,
          release: 0.25,
        },
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

    // patrón tipo “fin de rutina”
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

  // ---------- BEEPS 3-2-1 ----------

  useEffect(() => {
    if (mode !== "running") return;
    if (remaining === 3 || remaining === 2 || remaining === 1) {
      playShortBeep();
    }
  }, [remaining, mode]);

  // ---------- LÓGICA 00:00 CON STANDBY 2s (incluye prestart) ----------

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
    if (!intervals.length) return;
    if (zeroHandledRef.current) return;

    zeroHandledRef.current = true;

    playLongBeep();

    const timeout = setTimeout(() => {
      // 1) Si estamos en el pre-conteo global 3-2-1-0
      if (isPrestart) {
        setIsPrestart(false);
        // arrancamos el PRIMER bloque de la rutina
        setCurrentIndex(0);
        setRemaining(intervals[0].duration);
        zeroHandledRef.current = false;
        return;
      }

      // 2) Flujo normal entre bloques
      const nextIndex = currentIndex + 1;

      if (nextIndex >= intervals.length) {
        setMode("finished");
        setRemaining(0);
        setIsPrestart(false);
        playEndBeep();
      } else {
        setCurrentIndex(nextIndex);
        setRemaining(intervals[nextIndex].duration);
      }

      zeroHandledRef.current = false;
    }, 2000); // 2 segundos en 00:00

    return () => clearTimeout(timeout);
  }, [remaining, mode, currentIndex, intervals, isPrestart]);

  // ---------- EDICIÓN DE INTERVALOS ----------

  function addInterval(type: PhaseType) {
    const defaults = getPhaseDefaults(type);
    const newInterval: Interval = {
      id: nextIdRef.current++,
      type,
      label: type === "custom" ? "Ejercicio personalizado" : defaults.label,
      duration: type === "prepare" ? 10 : type === "rest" ? 15 : 20,
    };
    setIntervals((prev) => [...prev, newInterval]);
  }

  function updateInterval(id: number, patch: Partial<Interval>) {
    setIntervals((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  function removeInterval(id: number) {
    setIntervals((prev) => prev.filter((it) => it.id !== id));
  }

  // ----- DRAG & DROP (INSERCIÓN ENTRE BLOQUES) -----

  function handleDragStart(id: number) {
    if (mode !== "editing") return;
    setDraggingId(id);
  }

  function handleDragOver(e: any, targetId: number) {
    if (mode !== "editing") return;
    e.preventDefault();
    if (draggingId === null || draggingId === targetId) return;
  }

  function handleDrop(e: any, targetId: number) {
    if (mode !== "editing") return;
    e.preventDefault();

    setIntervals((prev) => {
      if (draggingId === null || draggingId === targetId) return prev;

      const fromIndex = prev.findIndex((i) => i.id === draggingId);
      const toIndex = prev.findIndex((i) => i.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      // Inserta ANTES del target
      arr.splice(toIndex, 0, moved);

      return arr;
    });

    setDraggingId(null);
  }

  const totalSeconds = intervals.reduce((acc, it) => acc + it.duration, 0);
  const totalTimeFormatted = formatTime(totalSeconds);
  const isRunnable = intervals.length > 0 && totalSeconds > 0;

  // ---------- GUARDAR / CARGAR RUTINAS ----------

  function handleSaveWorkout() {
    if (!isRunnable) return;

    if (typeof window === "undefined") return;

    const defaultName = `Rutina ${savedWorkouts.length + 1}`;
    const name = window
      .prompt("Nombre para este entrenamiento:", defaultName)
      ?.trim();

    if (!name) return;

    const newWorkout: SavedWorkout = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      intervals: intervals.map((it) => ({ ...it })), // copia
      createdAt: Date.now(),
    };

    const nextList = [newWorkout, ...savedWorkouts];
    persistSaved(nextList);
  }

  function handleLoadWorkout(id: string) {
    const workout = savedWorkouts.find((w) => w.id === id);
    if (!workout) return;

    // re-asignamos IDs para evitar conflictos con nextIdRef
    let nextId = 1;
    const rebuilt: Interval[] = workout.intervals.map((it) => ({
      ...it,
      id: nextId++,
    }));
    nextIdRef.current = nextId;

    setIntervals(rebuilt);
    setMode("editing");
    setCurrentIndex(0);
    setRemaining(0);
    setIsPrestart(false);
    zeroHandledRef.current = false;
  }

  function handleDeleteWorkout(id: string) {
    const nextList = savedWorkouts.filter((w) => w.id !== id);
    persistSaved(nextList);
  }

  // ---------- CONTROL PRINCIPAL ----------

  async function startRoutine() {
    if (!isRunnable) return;
    await ensureToneStarted();

    // Igual que HIIT Pro: pre-conteo 3-2-1-0 antes del primer bloque
    setMode("running");
    setIsPrestart(true);
    setCurrentIndex(0); // primer bloque será este
    setRemaining(3);
    zeroHandledRef.current = false;
  }

  function pauseRoutine() {
    if (mode === "running") {
      setMode("paused");
    }
  }

  function resumeRoutine() {
    if (mode === "paused") {
      setMode("running");
    }
  }

  function resetRoutine() {
    setMode("editing");
    setCurrentIndex(0);
    setRemaining(0);
    setIsPrestart(false);
    zeroHandledRef.current = false;
  }

  const currentInterval =
    currentIndex >= 0 && currentIndex < intervals.length
      ? intervals[currentIndex]
      : null;

  const currentPhaseDefaults = currentInterval
    ? getPhaseDefaults(currentInterval.type)
    : null;

  // Fondo:
  // - EDITOR → tema seleccionado
  // - RUNNING:
  //    - prestart → gradiente emerald que te gustó
  //    - normal → color de fase
  const bgClass =
    mode === "editing"
      ? getThemeBgClass(theme)
      : isPrestart
      ? "from-slate-900 via-emerald-500 to-black"
      : currentInterval
      ? getPhaseBgClass(currentInterval.type)
      : getThemeBgClass(theme);

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${bgClass} text-slate-100 flex items-center justify-center`}
    >
      {/* VISTA 1: EDITOR */}
      {mode === "editing" && (
        <div className="w-full max-w-xl mx-auto px-6 py-7 bg-slate-900/70 backdrop-blur rounded-2xl shadow-xl border border-slate-700">
          {/* Top bar: back + logo pequeño */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-slate-100 transition"
            >
              ← Volver al menú
            </Link>
            <img
              src="/1.png"
              alt="MonyFit Logo"
              className="h-16 w-auto drop-shadow-[0_0_10px_#c86bf4] slow-pulse"
            />
          </div>

          <h1 className="text-xl font-bold mb-1 text-center">
            Entrenamiento personalizado
          </h1>
          <p className="text-center text-xs text-slate-400 mb-4">
            Diseña tu rutina paso a paso. Cada bloque tiene su color y su
            tiempo.
          </p>

          {/* Resumen + Guardar */}
          <div className="flex items-center justify-between text-xs mb-4">
            <div>
              <p className="text-slate-300">
                Intervalos:{" "}
                <span className="font-semibold">{intervals.length}</span>
              </p>
              <p className="text-slate-300">
                Tiempo total:{" "}
                <span className="font-semibold">{totalTimeFormatted}</span>
              </p>
            </div>

            <button
              onClick={handleSaveWorkout}
              disabled={!isRunnable}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition
                ${
                  isRunnable
                    ? "bg-slate-800 hover:bg-slate-700 border-fuchsia-500/60 text-slate-100"
                    : "bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed"
                }`}
            >
              💾 Guardar rutina
            </button>
          </div>

          {/* Sonido + Vibración */}
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
                  className="w-32 mony-slider"
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

          {/* Lista de intervalos */}
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
            {intervals.map((interval, index) => {
              const { color } = getPhaseDefaults(interval.type);

              return (
                <div
                  key={interval.id}
                  onDragOver={(e) => handleDragOver(e, interval.id)}
                  onDrop={(e) => handleDrop(e, interval.id)}
                  className={`border rounded-2xl px-4 py-3 text-sm flex items-center gap-4 transition ${color}`}
                >
                  {/* Handle drag + número */}
                  <div className="flex flex-col items-center justify-center text-slate-500 mr-1">
                    <div
                      className={`flex flex-col items-center justify-center cursor-grab`}
                      draggable
                      onDragStart={() => handleDragStart(interval.id)}
                    >
                      <span className="h-0.5 w-4 bg-slate-500 rounded mb-0.5" />
                      <span className="h-0.5 w-4 bg-slate-500 rounded mb-0.5" />
                      <span className="h-0.5 w-4 bg-slate-500 rounded" />
                    </div>
                    <span className="text-[11px] mt-1 text-slate-400">
                      {index + 1}
                    </span>
                  </div>

                  {/* Datos */}
                  <div className="flex-1 space-y-2">
                    {/* Tipo + nombre */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={interval.type}
                        onChange={(e) => {
                          const newType = e.target.value as PhaseType;
                          const defs = getPhaseDefaults(newType);
                          updateInterval(interval.id, {
                            type: newType,
                            label:
                              newType === "custom"
                                ? interval.label || "Ejercicio personalizado"
                                : defs.label,
                          });
                        }}
                        className="bg-slate-900/80 border border-slate-600 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="prepare">Prepare</option>
                        <option value="work">Work</option>
                        <option value="rest">Rest</option>
                        <option value="longBreak">Break largo</option>
                        <option value="custom">Ejercicio personalizado</option>
                      </select>

                      {interval.type === "custom" && (
                        <input
                          type="text"
                          value={interval.label}
                          onChange={(e) =>
                            updateInterval(interval.id, {
                              label: e.target.value,
                            })
                          }
                          className="bg-slate-900/80 border border-slate-600 rounded-lg px-2 py-1 text-xs flex-1"
                          placeholder="Nombre del ejercicio"
                        />
                      )}

                      {interval.type !== "custom" && (
                        <span className="text-xs text-slate-100 font-semibold">
                          {interval.label}
                        </span>
                      )}
                    </div>

                    {/* Duración */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-300">
                        Duración:
                      </span>
                      <button
                        onClick={() =>
                          updateInterval(interval.id, {
                            duration: Math.max(5, interval.duration - 5),
                          })
                        }
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-base"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-mono text-lg">
                        {interval.duration}
                      </span>
                      <button
                        onClick={() =>
                          updateInterval(interval.id, {
                            duration: interval.duration + 5,
                          })
                        }
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-base"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-400">
                        segundos
                      </span>
                    </div>
                  </div>

                  {/* Borrar */}
                  <button
                    onClick={() => removeInterval(interval.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {intervals.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">
                Aún no tienes bloques. Agrega al menos un intervalo para
                empezar.
              </p>
            )}
          </div>

          {/* Botones para agregar bloques */}
          <div className="flex flex-wrap gap-2 text-[11px] mb-5">
            <span className="text-slate-300 mr-1">Añadir bloque:</span>
            <button
              onClick={() => addInterval("prepare")}
              className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400"
            >
              Prepare
            </button>
            <button
              onClick={() => addInterval("work")}
              className="px-2.5 py-1 rounded-full bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400"
            >
              Work
            </button>
            <button
              onClick={() => addInterval("rest")}
              className="px-2.5 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400"
            >
              Rest
            </button>
            <button
              onClick={() => addInterval("longBreak")}
              className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400"
            >
              Break largo
            </button>
            <button
              onClick={() => addInterval("custom")}
              className="px-2.5 py-1 rounded-full bg-slate-700/60 hover:bg-slate-700 border border-slate-500"
            >
              Ejercicio personalizado
            </button>
          </div>

          {/* Rutinas guardadas */}
          {savedWorkouts.length > 0 && (
            <div className="mb-5 border-t border-slate-700 pt-3">
              <p className="text-xs font-semibold text-slate-200 mb-2">
                📂 Rutinas guardadas
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {savedWorkouts.map((w) => {
                  const total = w.intervals.reduce(
                    (acc, it) => acc + it.duration,
                    0
                  );
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-[11px]"
                    >
                      <div className="flex-1 mr-2">
                        <p className="text-slate-100 font-semibold truncate">
                          {w.name}
                        </p>
                        <p className="text-slate-400">
                          Duración: {formatTime(total)} ·{" "}
                          {w.intervals.length} bloques
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadWorkout(w.id)}
                          className="px-2 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="px-2 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/60"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón principal */}
          <div className="flex flex-col items-center gap-3 border-t border-slate-700 pt-4">
            <button
              onClick={startRoutine}
              disabled={!isRunnable}
              className={`w-full max-w-xs h-12 rounded-full text-lg font-semibold transition
                ${
                  isRunnable
                    ? "bg-[#c86bf4] hover:bg-[#d790ff] text-slate-900"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
            >
              Empezar rutina
            </button>
          </div>
        </div>
      )}

      {/* VISTA 2: PANTALLA DE ENTRENAMIENTO FULL FOCUS */}
      {mode !== "editing" && (
        <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col min-h-screen">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={resetRoutine}
              className="text-sm text-slate-200 bg-slate-900/70 px-4 py-2 rounded-full font-semibold hover:bg-slate-800"
            >
              ← Editar rutina
            </button>

            <img
              src="/1.png"
              alt="MonyFit Logo"
              className="h-16 w-auto drop-shadow-[0_0_10px_#c86bf4]"
            />

            {mode === "running" ? (
              <button
                onClick={pauseRoutine}
                className="text-sm bg-yellow-400 text-slate-900 px-4 py-2 rounded-full font-semibold hover:bg-yellow-300"
              >
                Pausa
              </button>
            ) : mode === "paused" ? (
              <button
                onClick={resumeRoutine}
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

          {/* Centro: fase + reloj */}
          <div className="mt-4 mb-3 flex flex-col items-center">
            {currentInterval && (
              <>
                <div className="text-xs md:text-sm text-slate-300">
                  Bloque {currentIndex + 1} de {intervals.length}
                </div>
                <div className="text-lg md:text-xl font-semibold mt-1 mb-2">
                  {isPrestart
                    ? "Comenzando"
                    : currentPhaseDefaults?.label ?? currentInterval.label}
                </div>
              </>
            )}

            <div className="text-[32vw] md:text-[10vw] leading-none font-mono tracking-widest text-slate-100">
              {formatBigTime(remaining)}
            </div>

            {mode === "finished" && (
              <p className="mt-3 text-sm text-emerald-300">
                ¡Rutina completada! 🔥
              </p>
            )}
          </div>

          {/* Lista compacta de bloques – llena el espacio de abajo */}
          <div className="mt-2 mb-2 bg-slate-900/80 border border-slate-700 rounded-2xl flex-1 overflow-y-auto">
            {intervals.map((it, idx) => {
              const isCurrent = idx === currentIndex && mode !== "finished";
              return (
                <div
                  key={it.id}
                  className={`flex items-center justify-between px-3 py-2 text-xs border-b border-slate-800 last:border-b-0 ${
                    isCurrent
                      ? "bg-[#c86bf4]/20 text-[#f2d6ff] font-semibold"
                      : "text-slate-200"
                  }`}
                >
                  <span>
                    {idx + 1}. {it.label}
                  </span>
                  <span className="font-mono">{it.duration}s</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
