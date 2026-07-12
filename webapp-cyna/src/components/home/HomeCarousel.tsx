"use client";

// Hero carousel: auto-advancing with a smooth cross-fade between slides
// (image + text fade together). Pauses on hover; manual controls reset the
// timer. Slides are stacked and cross-faded via opacity.

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeCarouselSlide } from "@/lib/home/public-home";

type HomeCarouselProps = {
  slides: HomeCarouselSlide[];
  buttonHref: string;
};

const AUTOPLAY_MS = 6000;

export default function HomeCarousel({ slides, buttonHref }: HomeCarouselProps) {
  const t = useTranslations("home");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const hasMultipleSlides = slides.length > 1;
  // Clamp the index in case the slide list shrinks.
  const safeIndex = selectedIndex < slides.length ? selectedIndex : 0;

  const goToNext = useCallback(() => {
    setSelectedIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  }, [slides.length]);

  // Auto-advance. Re-runs on each index change, so manual navigation resets
  // the countdown; pauses while hovered.
  useEffect(() => {
    if (!hasMultipleSlides || paused) {
      return;
    }
    const timer = setInterval(goToNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [hasMultipleSlides, paused, goToNext, safeIndex]);

  if (slides.length === 0) {
    return (
      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[280px] w-full max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-white/60">
              CYNA
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
              {t("carouselEmpty")}
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[500px] w-full sm:min-h-[440px]">
        {slides.map((slide, index) => {
          const active = index === safeIndex;
          // Only the active slide carries the page <h1>; others stay neutral
          // to avoid multiple top-level headings.
          const Heading = active ? "h1" : "div";

          return (
            <div
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                active ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              key={slide.id_image}
            >
              <div
                aria-label={slide.titre_image}
                className="absolute inset-0 bg-cover bg-center"
                role="img"
                style={{
                  backgroundImage: `url(${JSON.stringify(
                    slide.lien_image_caroussel,
                  )})`,
                }}
              />
              <div className="absolute inset-0 bg-slate-950/55" />

              <div className="relative flex h-full w-full items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <Heading className="text-3xl font-bold tracking-normal sm:text-5xl">
                    {slide.titre_image}
                  </Heading>
                  {slide.description_image && (
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                      {slide.description_image}
                    </p>
                  )}
                  <a
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-purple-700 px-6 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    href={buttonHref}
                    tabIndex={active ? undefined : -1}
                  >
                    {t("exploreServices")}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMultipleSlides && (
        <>
          <button
            aria-label={t("carouselPrevious")}
            className="absolute left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:inline-flex"
            onClick={goToPrevious}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            aria-label={t("carouselNext")}
            className="absolute right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:inline-flex"
            onClick={goToNext}
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                aria-label={t("carouselGoToSlide", { number: index + 1 })}
                aria-pressed={safeIndex === index}
                className={cn(
                  "h-2 rounded-full transition",
                  safeIndex === index ? "w-8 bg-white" : "w-2 bg-white/50",
                )}
                key={slide.id_image}
                onClick={() => setSelectedIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
