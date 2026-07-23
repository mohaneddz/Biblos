import { useState, useEffect } from "react";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { getNodeCoverData } from "../data/classCovers";
import type { Animal } from "../types/animal";

type SpeciesImageProps = {
  animal: Animal;
  className?: string;
  fitClassName?: string;
  labelClassName?: string;
  imageUrl?: string | null;
  showBadge?: boolean;
};

export function SpeciesImage({
  animal,
  className = "",
  fitClassName = "h-full w-full object-cover",
  imageUrl,
}: SpeciesImageProps) {
  const { primaryImage } = useSpeciesMedia(animal, "primary");
  const [errorIndex, setErrorIndex] = useState(0);

  useEffect(() => {
    setErrorIndex(0);
  }, [animal.id, imageUrl]);

  const coverData = getNodeCoverData(
    animal.classification?.className || animal.classification?.kingdom || animal.classification?.order
  );

  const realImages = [
    ...(imageUrl ? [imageUrl] : []),
    ...(animal.heroImage ? [animal.heroImage] : []),
    ...animal.images,
    ...(primaryImage?.url ? [primaryImage.url] : []),
    ...(primaryImage?.thumbnailUrl ? [primaryImage.thumbnailUrl] : []),
  ].filter((url, index, self): url is string => Boolean(url) && self.indexOf(url) === index);

  const candidateUrls = [
    ...realImages,
    coverData.heroUrl,
    coverData.thumbnailUrl,
  ].filter((url, index, self): url is string => Boolean(url) && self.indexOf(url) === index);

  const currentUrl = candidateUrls[errorIndex] ?? coverData.heroUrl;

  const handleImageError = () => {
    if (errorIndex < candidateUrls.length - 1) {
      setErrorIndex((prev) => prev + 1);
    }
  };

  const isPlaceholder =
    realImages.length === 0 ||
    currentUrl === coverData.heroUrl ||
    currentUrl === coverData.thumbnailUrl ||
    errorIndex >= realImages.length;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentUrl}
        alt={animal.commonName}
        className={`${fitClassName} ${isPlaceholder ? "brightness-[0.42] contrast-[1.15] saturate-[0.55] transition duration-300" : ""}`}
        onError={handleImageError}
      />
      {isPlaceholder && (
        <>
          {/* Dark Primary Color Overlay & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040805]/95 via-[#07130c]/80 to-[#040805]/65 pointer-events-none" />
          <div className="absolute inset-0 bg-[#081a10]/45 mix-blend-multiply pointer-events-none" />
        </>
      )}
    </div>
  );
}
