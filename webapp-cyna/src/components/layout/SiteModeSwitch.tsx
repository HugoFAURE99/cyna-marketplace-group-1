"use client";

import { House, Settings } from "lucide-react";
import { useSiteTransition } from "@/components/layout/SiteTransitionProvider";
import { cn } from "@/lib/utils";

export default function SiteModeSwitch({
  className,
  direction,
  href,
  label,
  onNavigate,
  pendingLabel,
  tone = "neutral",
}: {
  className?: string;
  direction: "enter" | "exit";
  href: string;
  label: string;
  onNavigate?: () => void;
  pendingLabel: string;
  tone?: "brand" | "neutral";
}) {
  const { isTransitioning, startTransition } = useSiteTransition();

  function handleSwitch() {
    startTransition({
      destination: direction === "enter" ? "admin" : "marketplace",
      href,
      label: pendingLabel,
      onNavigate,
    });
  }

  const Icon = direction === "enter" ? Settings : House;
  const isBrand = tone === "brand";

  return (
    <button
      aria-busy={isTransitioning}
      className={cn(
        "group inline-flex w-full cursor-pointer items-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait",
        isBrand
          ? "min-h-11 justify-center bg-purple-700 px-3 text-white hover:bg-purple-800 focus-visible:ring-purple-700"
          : cn(
              "min-h-10 px-2 text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-sidebar-ring",
              direction === "enter" ? "justify-center" : "justify-start",
            ),
        className,
      )}
      disabled={isTransitioning}
      onClick={handleSwitch}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
