"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function A11yProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Re-apply classes on client-side navigation because React strips them when reconciling <html>
    const html = document.documentElement;
    if (localStorage.getItem("a11y_daltonisme") === "true") html.classList.add("a11y-daltonisme");
    if (localStorage.getItem("a11y_largeFont") === "true") html.classList.add("a11y-large-font");
    if (localStorage.getItem("a11y_dyslexicFont") === "true") html.classList.add("a11y-dyslexic-font");
    if (localStorage.getItem("a11y_highlightLinks") === "true") html.classList.add("a11y-highlight-links");
  }, [pathname]);

  return null;
}

let hasHydrated = false;

export function A11yInitScript() {
  const [isClient, setIsClient] = useState(hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    setIsClient(true);
  }, []);

  if (isClient) return null;

  const a11yScript = `
    try {
      if (localStorage.getItem("a11y_daltonisme") === "true") document.documentElement.classList.add("a11y-daltonisme");
      if (localStorage.getItem("a11y_largeFont") === "true") document.documentElement.classList.add("a11y-large-font");
      if (localStorage.getItem("a11y_dyslexicFont") === "true") document.documentElement.classList.add("a11y-dyslexic-font");
      if (localStorage.getItem("a11y_highlightLinks") === "true") document.documentElement.classList.add("a11y-highlight-links");
    } catch (e) {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: a11yScript }} suppressHydrationWarning />;
}

const MobileA11yIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  </svg>
);

export default function A11yMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [daltonisme, setDaltonisme] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("a11y");

  // Load from localStorage on mount
  useEffect(() => {
    setDaltonisme(localStorage.getItem("a11y_daltonisme") === "true");
    setLargeFont(localStorage.getItem("a11y_largeFont") === "true");
    setDyslexicFont(localStorage.getItem("a11y_dyslexicFont") === "true");
    setHighlightLinks(localStorage.getItem("a11y_highlightLinks") === "true");
    setIsLoaded(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle daltonisme (grayscale + contrast)
  useEffect(() => {
    if (!isLoaded) return;
    const html = document.documentElement;
    if (daltonisme) {
      html.classList.add("a11y-daltonisme");
      localStorage.setItem("a11y_daltonisme", "true");
    } else {
      html.classList.remove("a11y-daltonisme");
      localStorage.setItem("a11y_daltonisme", "false");
    }
  }, [daltonisme, isLoaded]);

  // Handle large font
  useEffect(() => {
    if (!isLoaded) return;
    const html = document.documentElement;
    if (largeFont) {
      html.classList.add("a11y-large-font");
      localStorage.setItem("a11y_largeFont", "true");
    } else {
      html.classList.remove("a11y-large-font");
      localStorage.setItem("a11y_largeFont", "false");
    }
  }, [largeFont, isLoaded]);

  // Handle dyslexic font
  useEffect(() => {
    if (!isLoaded) return;
    const html = document.documentElement;
    if (dyslexicFont) {
      html.classList.add("a11y-dyslexic-font");
      localStorage.setItem("a11y_dyslexicFont", "true");
    } else {
      html.classList.remove("a11y-dyslexic-font");
      localStorage.setItem("a11y_dyslexicFont", "false");
    }
  }, [dyslexicFont, isLoaded]);

  // Handle highlight links
  useEffect(() => {
    if (!isLoaded) return;
    const html = document.documentElement;
    if (highlightLinks) {
      html.classList.add("a11y-highlight-links");
      localStorage.setItem("a11y_highlightLinks", "true");
    } else {
      html.classList.remove("a11y-highlight-links");
      localStorage.setItem("a11y_highlightLinks", "false");
    }
  }, [highlightLinks, isLoaded]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
        aria-label="Menu d'accessibilité"
        aria-expanded={isOpen}
      >
        <MobileA11yIcon className="size-7" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-slate-900/5 z-50">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
            {t("title")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-daltonisme" className="text-sm font-medium text-slate-700">
                {t("colorBlindness")}
              </label>
              <ToggleSwitch id="a11y-daltonisme" checked={daltonisme} onChange={setDaltonisme} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-large-font" className="text-sm font-medium text-slate-700">
                {t("increaseFont")}
              </label>
              <ToggleSwitch id="a11y-large-font" checked={largeFont} onChange={setLargeFont} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-dyslexic-font" className="text-sm font-medium text-slate-700">
                {t("dyslexicFont")}
              </label>
              <ToggleSwitch id="a11y-dyslexic-font" checked={dyslexicFont} onChange={setDyslexicFont} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-highlight-links" className="text-sm font-medium text-slate-700">
                {t("highlightLinks")}
              </label>
              <ToggleSwitch id="a11y-highlight-links" checked={highlightLinks} onChange={setHighlightLinks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        checked ? "bg-slate-700" : "bg-slate-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      >
        {/* Inner circle to mimic the screenshot's toggle handle if needed, though clean circle is nicer */}
      </span>
    </button>
  );
}
