// "Browse by Category" grid of image-backed category tiles.
import Link from "next/link";
import { ImageOff } from "lucide-react";

import type { HomeCategory } from "@/lib/home/public-home";

type CategoryGridProps = {
  categories: HomeCategory[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section aria-labelledby="home-categories" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-purple-700">
          Categories
        </p>
        <h2 id="home-categories" className="text-2xl font-bold text-slate-950">
          Browse by Category
        </h2>
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              className="group relative min-h-40 overflow-hidden rounded-md border border-slate-200 bg-slate-950 text-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200"
              href={`/categories/${category.id_categorie}`}
              key={category.id_categorie}
            >
              {category.lien_image_cat ? (
                <div
                  aria-label={`${category.cat_nom} category image`}
                  className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                  role="img"
                  style={{
                    backgroundImage: `url(${JSON.stringify(
                      category.lien_image_cat,
                    )})`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500">
                  <ImageOff aria-hidden="true" className="size-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/55" />
              <div className="relative flex h-full min-h-40 items-end p-5">
                <h3 className="text-lg font-semibold">{category.cat_nom}</h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No public categories are available yet.
        </div>
      )}
    </section>
  );
}
