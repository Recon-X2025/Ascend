"use client";

import Image from "next/image";
import { useState } from "react";

interface MediaItem {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

interface MediaGalleryProps {
  media: MediaItem[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photos = media.filter((m) => m.type === "PHOTO");
  const video = media.find((m) => m.type === "VIDEO_EMBED");
  const tour = media.find((m) => m.type === "VIRTUAL_TOUR");

  if (media.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media</h3>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((m) => (
            <button
              key={m.id}
              type="button"
              className="aspect-video rounded-lg overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary relative"
              onClick={() => setLightbox(m.url)}
            >
              <Image src={m.url} alt={m.caption ?? ""} fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
      {video && (
        <div className="aspect-video max-w-2xl rounded-lg overflow-hidden bg-muted">
          <iframe
            src={video.url.startsWith("http") ? video.url : `https://www.youtube.com/embed/${video.url}`}
            title="Video"
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}
      {tour && (
        <a
          href={tour.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Virtual tour →
        </a>
      )}
      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          aria-label="Close"
        >
          <Image src={lightbox} alt="" width={1200} height={800} className="max-h-full max-w-full object-contain" unoptimized />
        </button>
      )}
    </div>
  );
}
