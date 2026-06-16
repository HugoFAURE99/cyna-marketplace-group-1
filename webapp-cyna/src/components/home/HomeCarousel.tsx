"use client";

// Hero carousel: manual prev/next + dot controls, no autoplay.

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeCarouselSlide } from "@/lib/home/public-home";

type HomeCarouselProps = {
  slides: HomeCarouselSlide[];
};

export default function HomeCarousel({ slides }: HomeCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Clamp the index in case the slide list shrinks.
  const safeIndex = selectedIndex < slides.length ? selectedIndex : 0;
  const currentSlide = slides[safeIndex];
  const hasMultipleSlides = slides.length > 1;
  // JSON.stringify quotes/escapes the URL safely for CSS url().
  const backgroundStyle = currentSlide
    ? {
        backgroundImage: `url(${JSON.stringify(
          currentSlide.lien_image_caroussel,
        )})`,
      }
    : undefined;

  if (slides.length === 0) {
    return (
      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[280px] w-full max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-white/60">
              CYNA
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
              Carousel content is not configured yet.
            </h1>
          </div>
        </div>
      </section>
    );
  }

  const goToPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setSelectedIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div
        aria-label={currentSlide.titre_image}
        className="absolute inset-0 bg-cover bg-center"
        role="img"
        style={backgroundStyle}
      />
      <div className="absolute inset-0 bg-slate-950/55" />

      <div className="relative mx-auto flex min-h-[360px] w-full max-w-6xl items-center justify-center px-4 py-16 text-center sm:min-h-[440px] sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
            {currentSlide.titre_image}
          </h1>
          {currentSlide.description_image && (
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              {currentSlide.description_image}
            </p>
          )}
          <Link
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-purple-700 px-6 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            href="#top-products"
          >
            Explore Services
          </Link>
        </div>
      </div>

      {hasMultipleSlides && (
        <>
          <button
            aria-label="Previous hero slide"
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:inline-flex"
            onClick={goToPrevious}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            aria-label="Next hero slide"
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:inline-flex"
            onClick={goToNext}
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                aria-label={`Show hero slide ${index + 1}`}
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
