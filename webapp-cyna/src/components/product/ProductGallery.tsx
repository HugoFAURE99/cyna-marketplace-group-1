"use client";

// Image gallery with a thumbnail strip; falls back to the category image.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicProductImage } from "@/lib/products/public-products";

type DisplayImage = {
  id: string;
  label: string;
  url: string;
};

type ProductGalleryProps = {
  fallbackImageUrl: string | null;
  images: PublicProductImage[];
  productName: string;
};

export default function ProductGallery({
  fallbackImageUrl,
  images,
  productName,
}: ProductGalleryProps) {
  const displayImages = useMemo(
    () => buildDisplayImages(images, fallbackImageUrl, productName),
    [fallbackImageUrl, images, productName],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeSelectedIndex =
    selectedIndex < displayImages.length ? selectedIndex : 0;
  const selectedImage = displayImages[safeSelectedIndex];

  const showControls = displayImages.length > 1;

  const goToPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? displayImages.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setSelectedIndex((current) =>
      current === displayImages.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-white ring-1 ring-black/10">
        {selectedImage ? (
          <div
            aria-label={selectedImage.label}
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{
              backgroundImage: `url(${JSON.stringify(selectedImage.url)})`,
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-white text-slate-500">
            <ImageOff className="size-10" aria-hidden="true" />
            <span className="text-sm font-medium">Image unavailable</span>
          </div>
        )}

        {showControls && (
          <>
            <Button
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-slate-950 hover:bg-white"
              onClick={goToPrevious}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-slate-950 hover:bg-white"
              onClick={goToNext}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {showControls && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {displayImages.map((image, index) => (
            <button
              aria-label={`Show image ${index + 1}`}
              aria-pressed={safeSelectedIndex === index}
              className={cn(
                "h-20 w-20 shrink-0 rounded-lg border bg-cover bg-center transition",
                safeSelectedIndex === index
                  ? "border-purple-700 ring-2 ring-purple-700"
                  : "border-transparent hover:border-purple-300",
              )}
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              style={{ backgroundImage: `url(${JSON.stringify(image.url)})` }}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildDisplayImages(
  images: PublicProductImage[],
  fallbackImageUrl: string | null,
  productName: string,
): DisplayImage[] {
  if (images.length > 0) {
    return images.map((image, index) => ({
      id: String(image.id_image),
      label: `${productName} image ${index + 1}`,
      url: image.lien_image_produit,
    }));
  }

  if (fallbackImageUrl) {
    return [
      {
        id: "category-fallback",
        label: `${productName} category image`,
        url: fallbackImageUrl,
      },
    ];
  }

  return [];
}
