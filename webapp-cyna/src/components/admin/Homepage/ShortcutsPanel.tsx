"use client";

import { Package, Layers } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Translations {
  title: string;
  productsTitle: string;
  productsDescription: string;
  categoriesTitle: string;
  categoriesDescription: string;
  go: string;
}

export default function ShortcutsPanel({
  translations,
}: {
  translations: Translations;
}) {
  const t = translations;

  const shortcuts = [
    {
      href: "/admin/products" as const,
      icon: Package,
      title: t.productsTitle,
      description: t.productsDescription,
    },
    {
      href: "/admin/categories" as const,
      icon: Layers,
      title: t.categoriesTitle,
      description: t.categoriesDescription,
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{t.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <shortcut.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{shortcut.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {shortcut.description}
              </p>
              <span className="mt-2 inline-block text-sm font-medium text-primary">
                {t.go} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
