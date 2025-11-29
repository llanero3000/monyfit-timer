"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Swiper 3D circular
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

// 👇 mismos IDs que en Settings (sin light)
type ThemeId =
  | "dark"
  | "neon"
  | "ocean"
  | "sepia"
  | "soft"
  | "neonGreen";

// Gradiente por tema para el fondo del Home
const THEME_BG: Record<ThemeId, string> = {
  dark: "from-[#020617] via-[#020617] to-black",
  neon: "from-[#1e0538] via-[#020617] to-[#0f172a]",
  ocean: "from-[#020617] via-[#022c4b] to-[#020617]",
  sepia: "from-[#3b2c26] via-[#2b211d] to-black",
  soft: "from-[#111827] via-[#1f2937] to-[#020617]",
  neonGreen: "from-black via-emerald-800 to-lime-500",
};

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [theme, setTheme] = useState<ThemeId>("dark");

  // Leer tema guardado en localStorage (el mismo de Settings)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("monyfit_theme") as ThemeId | null;
    if (raw && (Object.keys(THEME_BG) as ThemeId[]).includes(raw)) {
      setTheme(raw);
    }
  }, []);

  const themeBgClass = THEME_BG[theme] ?? THEME_BG.dark;

  const modes = [
    {
      id: "hiit",
      title: "HIIT Pro",
      subtitle: "Timer rápido para gym, con beeps, vibración y standby en 00.",
      href: "/workouts/hiit",
      tag: "Free Timer",
    },
    {
      id: "custom",
      title: "Entrenamiento personalizado",
      subtitle:
        "Arma tu rutina por bloques: prepare, work, rest, break largo y ejercicios.",
      href: "/workouts/custom",
      tag: "Builder PRO",
    },
    {
      id: "voice",
      title: "Voz MonyFit Coach",
      subtitle:
        "Frases motivacionales con la voz de Mony para acompañar tus rutinas.",
      href: null, // próximamente
      tag: "Próximamente",
    },
  ];

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${themeBgClass} text-slate-100 flex items-center justify-center`}
    >
      <div className="w-full max-w-4xl px-4 py-8 flex flex-col items-center">
        {/* Logo + encabezado */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 blur-3xl bg-fuchsia-500/40 rounded-full" />
            <Image
              src="/1.png"
              alt="MonyFit Logo"
              width={96}
              height={96}
              className="relative drop-shadow-[0_0_20px_#c86bf4]"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1">
            MonyFit Timer Lab
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            El tiempo de tu entrenamiento,
            <span className="text-fuchsia-400"> bajo control.</span>
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-400 text-center max-w-xl">
            Elige cómo quieres entrenar hoy. Empieza con HIIT Pro o diseña tu
            propio flujo de bloques. La voz de Mony viene en camino… 💜
          </p>
        </div>

        {/* Carrusel 3D circular */}
        <div className="w-full mb-6">
          <Swiper
            modules={[EffectCoverflow]}
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            loop={true}
            coverflowEffect={{
              rotate: 40,
              stretch: 0,
              depth: 180,
              modifier: 1.2,
              slideShadows: false,
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
            }}
            className="w-full py-2"
          >
            {modes.map((mode, index) => {
              const isActive = index === activeIndex;
              const Wrapper: any = mode.href ? Link : "div";

              return (
                <SwiperSlide
                  key={mode.id}
                  className="!w-[250px] !md:w-[280px] flex justify-center"
                >
                  <Wrapper
                    href={mode.href ?? "#"}
                    className={`group relative w-full transition-transform duration-300 ${
                      mode.href ? "cursor-pointer" : "cursor-default"
                    } ${isActive ? "scale-105" : "scale-90 opacity-70"}`}
                  >
                    <div
                      className={`
                        rounded-3xl border border-slate-700/80 bg-slate-900/80
                        overflow-hidden p-[1px]
                        transition-all duration-300
                        ${
                          isActive
                            ? "shadow-[0_0_45px_rgba(200,107,244,0.9)]"
                            : "shadow-[0_0_18px_rgba(15,23,42,0.9)]"
                        }
                      `}
                    >
                      {/* Borde interno con ligero gradiente */}
                      <div
                        className={`
                          rounded-[1.4rem] p-4 md:p-5
                          bg-gradient-to-br
                          ${
                            isActive
                              ? "from-fuchsia-500/60 via-slate-900/90 to-emerald-400/40"
                              : "from-slate-800/70 via-slate-900/90 to-slate-900/95"
                          }
                          relative overflow-hidden
                        `}
                      >
                        <div className="absolute inset-0 bg-slate-950/60" />

                        <div className="relative flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                              Modo
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border border-white/15 ${
                                mode.id === "voice"
                                  ? "bg-sky-500/20 text-sky-200"
                                  : "bg-emerald-400/20 text-emerald-200"
                              }`}
                            >
                              {mode.tag}
                            </span>
                          </div>

                          <h2 className="text-lg md:text-xl font-semibold mb-1">
                            {mode.title}
                          </h2>
                          <p className="text-xs md:text-sm text-slate-300 mb-4 flex-1">
                            {mode.subtitle}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive
                                    ? "bg-fuchsia-400 animate-pulse"
                                    : "bg-slate-500"
                                }`}
                              />
                              {mode.id === "hiit" && (
                                <span>Ideal para gym rápido</span>
                              )}
                              {mode.id === "custom" && (
                                <span>Perfecto para circuitos MonyFit</span>
                              )}
                              {mode.id === "voice" && (
                                <span className="italic">
                                  En preparación en el laboratorio 🔧
                                </span>
                              )}
                            </div>

                            {mode.href ? (
                              <span
                                className={`
                                  inline-flex items-center gap-1 text-[11px]
                                  px-3 py-1 rounded-full border
                                  transition
                                  ${
                                    isActive
                                      ? "bg-slate-900/80 border-fuchsia-400/80 text-slate-50"
                                      : "bg-slate-900/60 border-slate-600/70 text-slate-200"
                                  }
                                `}
                              >
                                Abrir
                                <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">
                                  →
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300/80 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-600/50 cursor-default">
                                Próximamente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Wrapper>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

{/* Botón de Settings arriba a la derecha */}
<div className="absolute top-4 right-4 z-20">
<Link
  href="/settings"
  className="h-10 w-10 rounded-full flex items-center justify-center
             bg-slate-900/60 border border-fuchsia-500/20 backdrop-blur 
             shadow-[0_0_12px_rgba(200,107,244,0.4)]
             hover:shadow-[0_0_18px_rgba(200,107,244,0.8)]
             transition text-lg text-fuchsia-300"
>
  ⚙️
</Link>
</div>


        {/* Consejo abajo */}
        <div className="mt-2 text-center px-4">
          <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
            Consejo: empieza probando{" "}
            <span className="text-slate-300 font-medium">HIIT Pro</span>, luego
            arma un circuito loco en{" "}
            <span className="text-slate-300 font-medium">
              Entrenamiento personalizado
            </span>{" "}
            y deja que Mony te destruya las piernas 🔥
          </p>
        </div>
      </div>
    </main>
  );
}
