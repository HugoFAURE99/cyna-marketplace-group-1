"use client";

import { useEffect, useState, useRef } from "react";
import { Accessibility } from "lucide-react";

export default function A11yMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [daltonisme, setDaltonisme] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const html = document.documentElement;
    if (daltonisme) {
      html.classList.add("a11y-daltonisme");
    } else {
      html.classList.remove("a11y-daltonisme");
    }
  }, [daltonisme]);

  // Handle large font
  useEffect(() => {
    const html = document.documentElement;
    if (largeFont) {
      html.classList.add("a11y-large-font");
    } else {
      html.classList.remove("a11y-large-font");
    }
  }, [largeFont]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
        aria-label="Menu d'accessibilité"
        aria-expanded={isOpen}
      >
        <Accessibility className="size-6" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-slate-900/5 z-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-daltonisme" className="text-sm font-medium text-slate-700">
                Daltonisme
              </label>
              <ToggleSwitch id="a11y-daltonisme" checked={daltonisme} onChange={setDaltonisme} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="a11y-large-font" className="text-sm font-medium text-slate-700">
                Augmenter Police
              </label>
              <ToggleSwitch id="a11y-large-font" checked={largeFont} onChange={setLargeFont} />
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
