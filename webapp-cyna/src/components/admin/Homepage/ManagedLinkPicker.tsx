"use client";

import { useId, useMemo, useState } from "react";
import { Link2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  ManagedLinkOption,
  ManagedLinkOptionKind,
} from "@/lib/navigation/managed-link";

export type ManagedLinkPickerTranslations = {
  groups: Record<ManagedLinkOptionKind, string>;
  hint: string;
  noResults: string;
  placeholder: string;
};

const GROUP_ORDER: ManagedLinkOptionKind[] = [
  "page",
  "anchor",
  "category",
  "product",
];

function searchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

export default function ManagedLinkPicker({
  ariaLabel,
  error,
  onChange,
  options,
  translations,
  value,
}: {
  ariaLabel: string;
  error?: string | null;
  onChange: (value: string) => void;
  options: ManagedLinkOption[];
  translations: ManagedLinkPickerTranslations;
  value: string;
}) {
  const listId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const query = searchKey(value);
    if (!query || options.some((option) => option.href === value)) return options;
    return options.filter((option) =>
      searchKey(`${option.label} ${option.href}`).includes(query),
    );
  }, [options, value]);

  const select = (option: ManagedLinkOption) => {
    onChange(option.href);
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <Link2
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
        />
        <input
          aria-autocomplete="list"
          aria-controls={listId}
          aria-describedby={error ? errorId : undefined}
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          aria-label={ariaLabel}
          className={cn(
            "w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring",
            error && "border-destructive focus:ring-destructive/30",
          )}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && filtered[activeIndex]) {
              event.preventDefault();
              select(filtered[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={translations.placeholder}
          role="combobox"
          value={value}
        />

        {open && (
          <div
            className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
            id={listId}
            role="listbox"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                <Search aria-hidden="true" className="mx-auto mb-2 size-5" />
                {translations.noResults}
              </p>
            ) : (
              GROUP_ORDER.map((kind) => {
                const group = filtered.filter((option) => option.kind === kind);
                if (!group.length) return null;
                return (
                  <div className="py-1" key={kind}>
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {translations.groups[kind]}
                    </p>
                    {group.map((option) => {
                      const index = filtered.indexOf(option);
                      return (
                        <button
                          aria-selected={index === activeIndex}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                            index === activeIndex && "bg-muted",
                          )}
                          key={`${option.kind}:${option.href}`}
                          onClick={() => select(option)}
                          onFocus={() => setActiveIndex(index)}
                          role="option"
                          type="button"
                        >
                          <span className="min-w-0 truncate font-medium">{option.label}</span>
                          <span className="shrink-0 truncate font-mono text-xs text-muted-foreground">
                            {option.href}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{translations.hint}</p>
      {error && (
        <p className="text-sm text-destructive" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
