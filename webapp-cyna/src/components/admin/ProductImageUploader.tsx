"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ExistingImage {
  id_image: number;
  lien_image_produit: string;
  ordre_affichage: number | null;
}

interface ProductImageUploaderProps {
  initialImages?: ExistingImage[];
  onImagesChange: (files: File[], removedIds: number[]) => void;
  readOnly?: boolean;
  maxImages?: number;
}

export function ProductImageUploader({
  initialImages = [],
  onImagesChange,
  readOnly = false,
  maxImages = 10,
}: ProductImageUploaderProps) {
  const t = useTranslations("admin.productForm");
  const [existingImages, setExistingImages] =
    useState<ExistingImage[]>(initialImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);

  const totalCount = existingImages.length + newFiles.length;
  const remaining = maxImages - totalCount;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const allowed = acceptedFiles.slice(0, remaining);
      const updatedFiles = [...newFiles, ...allowed];
      const updatedPreviews = [
        ...newPreviews,
        ...allowed.map((f) => URL.createObjectURL(f)),
      ];
      setNewFiles(updatedFiles);
      setNewPreviews(updatedPreviews);
      onImagesChange(updatedFiles, removedIds);
    },
    [newFiles, newPreviews, removedIds, remaining, onImagesChange],
  );

  const removeExisting = (id: number) => {
    const updatedExisting = existingImages.filter((img) => img.id_image !== id);
    const updatedRemoved = [...removedIds, id];
    setExistingImages(updatedExisting);
    setRemovedIds(updatedRemoved);
    onImagesChange(newFiles, updatedRemoved);
  };

  const removeNew = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    const updatedFiles = newFiles.filter((_, i) => i !== index);
    const updatedPreviews = newPreviews.filter((_, i) => i !== index);
    setNewFiles(updatedFiles);
    setNewPreviews(updatedPreviews);
    onImagesChange(updatedFiles, removedIds);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: remaining,
    multiple: true,
    disabled: remaining <= 0,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("images")}</h3>
        <span className="text-sm text-muted-foreground">
          {t("imagesCount", { current: totalCount, max: maxImages })}
        </span>
      </div>

      {/* Image grid */}
      {totalCount > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {existingImages.map((img) => (
            <div key={`existing-${img.id_image}`} className="relative">
              <img
                src={img.lien_image_produit}
                alt=""
                className="h-24 w-full rounded-lg border object-cover shadow-sm"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeExisting(img.id_image)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          {newPreviews.map((url, index) => (
            <div key={`new-${index}`} className="relative">
              <img
                src={url}
                alt=""
                className="h-24 w-full rounded-lg border object-cover shadow-sm"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeNew(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No images message in readOnly */}
      {readOnly && totalCount === 0 && (
        <p className="text-sm text-muted-foreground">{t("noImages")}</p>
      )}

      {/* Dropzone */}
      {!readOnly &&
        (remaining > 0 ? (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <p className="font-medium text-gray-600">
              {isDragActive ? t("imagesDropHere") : t("imagesDragOrClick")}
            </p>
            <p className="text-sm text-gray-500">{t("imagesHint")}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("imagesMax")}</p>
        ))}
    </div>
  );
}
