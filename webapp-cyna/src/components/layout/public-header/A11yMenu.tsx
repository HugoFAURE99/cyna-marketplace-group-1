"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const SETTINGS_CHANGED_EVENT = "cyna:a11y-settings-changed";
const SETTINGS = {
  daltonisme: {
    className: "a11y-daltonisme",
    storageKey: "a11y_daltonisme",
  },
  dyslexicFont: {
    className: "a11y-dyslexic-font",
    storageKey: "a11y_dyslexicFont",
  },
  highlightLinks: {
    className: "a11y-highlight-links",
    storageKey: "a11y_highlightLinks",
  },
  largeFont: {
    className: "a11y-large-font",
    storageKey: "a11y_largeFont",
  },
} as const;

type SettingName = keyof typeof SETTINGS;

export function A11yProvider() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Re-apply classes on client-side navigation because React can reconcile
    // classes set on <html> outside its render tree.
    const html = document.documentElement;
    Object.values(SETTINGS).forEach(({ className, storageKey }) => {
      html.classList.toggle(className, readStoredSetting(storageKey));
    });
  }, [pathname]);

  return null;
}

function A11yIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
    </svg>
  );
}

export default function A11yMenu({
  align = "right",
  placement = "top",
}: {
  align?: "center" | "right";
  placement?: "bottom" | "top";
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [daltonisme, setDaltonisme] = useA11ySetting("daltonisme");
  const [largeFont, setLargeFont] = useA11ySetting("largeFont");
  const [dyslexicFont, setDyslexicFont] = useA11ySetting("dyslexicFont");
  const [highlightLinks, setHighlightLinks] = useA11ySetting("highlightLinks");
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const titleId = useId();
  const t = useTranslations("a11y");

  // Close the popover with the same mouse and keyboard conventions as the
  // other header menus.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (isOpen && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
      ref={menuRef}
    >
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        className="flex size-11 cursor-pointer items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <A11yIcon className="size-7" />
      </button>

      {isOpen && (
        <div
          aria-labelledby={titleId}
          className={`absolute z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-900/5 ${align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"} ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
          id={menuId}
          role="region"
        >
          <h3
            className="px-2 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500"
            id={titleId}
          >
            {t("title")}
          </h3>
          <div className="space-y-1">
            <ToggleSwitch checked={daltonisme} id="a11y-daltonisme" label={t("colorBlindness")} onChange={setDaltonisme} />
            <ToggleSwitch checked={largeFont} id="a11y-large-font" label={t("increaseFont")} onChange={setLargeFont} />
            <ToggleSwitch checked={dyslexicFont} id="a11y-dyslexic-font" label={t("dyslexicFont")} onChange={setDyslexicFont} />
            <ToggleSwitch checked={highlightLinks} id="a11y-highlight-links" label={t("highlightLinks")} onChange={setHighlightLinks} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ id, checked, label, onChange }: { id: string; checked: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
      id={id}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="text-sm font-medium text-slate-700" id={`${id}-label`}>
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-purple-700" : "bg-slate-300"}`}
      >
        <span
          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200 ease-in-out ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}

function useA11ySetting(name: SettingName) {
  const setting = SETTINGS[name];
  const enabled = useSyncExternalStore(
    subscribeToSettings,
    () => readStoredSetting(setting.storageKey),
    () => false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle(setting.className, enabled);
  }, [enabled, setting.className]);

  const setEnabled = (next: boolean) => {
    try {
      localStorage.setItem(setting.storageKey, String(next));
    } catch {
      // The visual option still works for the current page when storage is unavailable.
    }
    document.documentElement.classList.toggle(setting.className, next);
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
  };

  return [enabled, setEnabled] as const;
}

function subscribeToSettings(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SETTINGS_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SETTINGS_CHANGED_EVENT, onStoreChange);
  };
}

function readStoredSetting(storageKey: string) {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}
