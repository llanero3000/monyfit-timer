"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type WakeLockMode = "disabled" | "timer" | "all";

// 👇 Agregamos light y neonGreen aquí
type ThemeId =
  | "dark"
  | "neon"
  | "ocean"
  | "sepia"
  | "soft"
  | "light"
  | "neonGreen";

const THEMES: {
  id: ThemeId;
  name: string;
  description: string;
  previewClass: string;
}[] = [
  {
    id: "dark",
    name: "Dark MonyFit",
    description: "Modo original: noche profunda con acentos púrpura.",
    previewClass: "from-[#020617] via-[#020617] to-black",
  },
  {
    id: "neon",
    name: "Neon Lab",
    description: "Toque futurista morado-neón, vibes de laboratorio.",
    previewClass: "from-[#1e0538] via-[#020617] to-[#0f172a]",
  },
  {
    id: "ocean",
    name: "Ocean Focus",
    description: "Azules fríos tipo océano para entrenar más chill.",
    previewClass: "from-[#020617] via-[#022c4b] to-[#020617]",
  },
  {
    id: "sepia",
    name: "Sepia Warm",
    description: "Tonos cálidos café, como gym con luz bajita.",
    previewClass: "from-[#3b2c26] via-[#2b211d] to-black",
  },
  {
    id: "soft",
    name: "Soft Night",
    description: "Noche suave, menos contraste para sesiones largas.",
    previewClass: "from-[#111827] via-[#1f2937] to-[#020617]",
  },
  // 🆕 Verde neón gamer
  {
    id: "neonGreen",
    name: "Neon Green",
    description: "Verde neón estilo gamer, energía a tope.",
    previewClass: "from-black via-emerald-800 to-lime-500",
  },
];

export default function SettingsPage() {
  const [wakeMode, setWakeMode] = useState<WakeLockMode>("timer");
  const [theme, setTheme] = useState<ThemeId>("dark");

  // Cargar settings guardados
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawWake = window.localStorage.getItem(
      "monyfit_wake_lock_mode"
    ) as WakeLockMode | null;
    if (rawWake === "disabled" || rawWake === "timer" || rawWake === "all") {
      setWakeMode(rawWake);
    } else {
      setWakeMode("timer");
      window.localStorage.setItem("monyfit_wake_lock_mode", "timer");
    }

    const rawTheme = window.localStorage.getItem(
      "monyfit_theme"
    ) as ThemeId | null;
    if (rawTheme && THEMES.some((t) => t.id === rawTheme)) {
      setTheme(rawTheme);
    } else {
      setTheme("dark");
      window.localStorage.setItem("monyfit_theme", "dark");
    }
  }, []);

  function handleWakeChange(value: WakeLockMode) {
    setWakeMode(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("monyfit_wake_lock_mode", value);
    }
  }

  function handleThemeChange(value: ThemeId) {
    setTheme(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("monyfit_theme", value);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-black text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto px-6 py-8 bg-slate-900/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-xs text-slate-300 hover:text-slate-100 inline-flex items-center gap-1"
          >
            ← Volver al menú
          </Link>

          <div className="flex items-center gap-2">
            <Image
              src="/1.png"
              alt="MonyFit Logo"
              width={40}
              height={40}
              className="drop-shadow-[0_0_10px_#c86bf4]"
            />
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Ajustes
            </span>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-2">
          Configuración de MonyFit Timer
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Aquí puedes ajustar cómo se comporta la pantalla y el estilo visual
          de la app mientras entrenas. Poco a poco iremos metiendo más magia
          MonyFit. 💜
        </p>

        {/* BLOQUE: PANTALLA ACTIVA */}
        <section className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4 text-xs mb-5">
          <p className="font-semibold text-slate-200 mb-1">⚡ Pantalla activa</p>
          <p className="text-slate-400 mb-3">
            Controla si el teléfono se apaga mientras usas MonyFit Timer.
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="wakelock"
                className="mt-0.5"
                checked={wakeMode === "disabled"}
                onChange={() => handleWakeChange("disabled")}
              />
              <div>
                <p className="text-slate-200">Disabled</p>
                <p className="text-slate-400">
                  Dejar que el teléfono se bloquee normal, según el tiempo de
                  pantalla del sistema.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="wakelock"
                className="mt-0.5"
                checked={wakeMode === "timer"}
                onChange={() => handleWakeChange("timer")}
              />
              <div>
                <p className="text-slate-200">
                  For timer screen only{" "}
                  <span className="text-emerald-400 font-semibold">
                    (recomendado)
                  </span>
                </p>
                <p className="text-slate-400">
                  Mantiene la pantalla activa solo cuando estás en las
                  pantallas de cronómetro (HIIT Pro o Entrenamiento
                  personalizado).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="wakelock"
                className="mt-0.5"
                checked={wakeMode === "all"}
                onChange={() => handleWakeChange("all")}
              />
              <div>
                <p className="text-slate-200">For all screens</p>
                <p className="text-slate-400">
                  Mientras la app esté abierta, la pantalla no se apaga (aunque
                  estés en el menú o en pausa).
                </p>
              </div>
            </label>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Nota: el bloqueo de pantalla depende del soporte del navegador /
            sistema. En algunos iPhone puede comportarse distinto a Android.
          </p>
        </section>

        {/* BLOQUE: TEMAS DE COLOR */}
        <section className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4 text-xs">
          <p className="font-semibold text-slate-200 mb-1">🎨 Tema visual</p>
          <p className="text-slate-400 mb-3">
            Cambia el ambiente de la app. El tema se guarda en el dispositivo y
            se aplica en HIIT, Entrenamiento personalizado y la pantalla
            principal.
          </p>

          <div className="space-y-3">
            {THEMES.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="theme"
                  className="mt-0.5"
                  checked={theme === t.id}
                  onChange={() => handleThemeChange(t.id)}
                />
                <div className="flex-1">
                  <p className="text-slate-200">{t.name}</p>
                  <p className="text-slate-400">{t.description}</p>
                </div>
                {/* mini preview del gradiente */}
                <div
                  className={`
                    h-8 w-16 rounded-xl bg-gradient-to-br ${t.previewClass}
                    border border-slate-600/70
                  `}
                />
              </label>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Tip: prueba{" "}
            <span className="text-fuchsia-300">Neon Lab</span> para clases
            intensas, <span className="text-emerald-300">Ocean Focus</span> para
            algo más chill, y <span className="text-lime-300">Neon Green</span>{" "}
            cuando quieras vibe gamer 😏.
          </p>
        </section>
      </div>
    </main>
  );
}
