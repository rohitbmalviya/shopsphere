"use client";

import { useState } from "react";
import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  url: string;
  position: number;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = images[selectedIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square md:aspect-[4/5] rounded-xl overflow-hidden bg-muted">
        <SafeImage
          src={current.url}
          alt={`${productName} — image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={selectedIndex === 0}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Product images">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              role="listitem"
              aria-label={`View image ${idx + 1}`}
              aria-pressed={idx === selectedIndex}
              className={cn(
                "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                idx === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              <SafeImage
                src={img.url}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
