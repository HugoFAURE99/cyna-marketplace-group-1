"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface CategoryImageUploaderProps {
  initialImageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
}

export function CategoryImageUploader({
  initialImageUrl,
  onFileSelect,
}: CategoryImageUploaderProps) {
  const t = useTranslations("admin.categoryForm");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl || null,
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileSelect(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("image")}</h3>

      {previewUrl ? (
        <div className="relative inline-block">
          <Image
            src={previewUrl}
            alt=""
            className="max-w-xs rounded-lg border shadow-md"
            height={240}
            unoptimized
            width={320}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute -top-2 -right-2"
          >
            ✕
          </Button>
        </div>
      ) : (
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
            {isDragActive ? t("dropHere") : t("dragOrClick")}
          </p>
          <p className="text-sm text-gray-500">{t("imageHint")}</p>
        </div>
      )}
    </div>
  );
}
