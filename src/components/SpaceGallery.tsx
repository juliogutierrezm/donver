import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpaceGalleryProps {
  photos: string[];
  title: string;
}

export function SpaceGallery({ photos, title }: SpaceGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const displayPhotos = photos.slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden border border-border">
        {/* Main image */}
        <div
          className="col-span-2 row-span-2 cursor-pointer overflow-hidden bg-muted h-72"
          onClick={() => setSelectedImageIndex(0)}
        >
          <img
            src={displayPhotos[0]}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Smaller images */}
        {displayPhotos.slice(1, 5).map((photo, index) => (
          <div
            key={index}
            className="cursor-pointer overflow-hidden bg-muted h-36"
            onClick={() => setSelectedImageIndex(index + 1)}
          >
            <img
              src={photo}
              alt={`${title} ${index + 2}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {/* Fullscreen Gallery Dialog */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main image */}
          <div className="flex items-center justify-center max-w-5xl max-h-[80vh]">
            <img
              src={displayPhotos[selectedImageIndex]}
              alt="Full screen"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Thumbnail navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-3 rounded-lg">
            {displayPhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "w-12 h-12 rounded overflow-hidden border-2 transition-all",
                  selectedImageIndex === index
                    ? "border-white"
                    : "border-white/30 opacity-50 hover:opacity-75"
                )}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() =>
              setSelectedImageIndex(
                (selectedImageIndex - 1 + displayPhotos.length) %
                  displayPhotos.length
              )
            }
            className="absolute left-4 text-white hover:bg-white/20 p-3 rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={() =>
              setSelectedImageIndex((selectedImageIndex + 1) % displayPhotos.length)
            }
            className="absolute right-4 text-white hover:bg-white/20 p-3 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
