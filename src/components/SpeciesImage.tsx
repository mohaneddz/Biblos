import { useState, useEffect } from "react";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { getNodeCoverData } from "../data/classCovers";
import type { Animal } from "../types/animal";

type SpeciesImageProps = {
  animal: Animal;
  className: string;
  fitClassName?: string;
  labelClassName?: string;
  imageUrl?: string | null;
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

  const candidateUrls = [
    ...(imageUrl ? [imageUrl] : []),
    ...(animal.heroImage ? [animal.heroImage] : []),
    ...animal.images,
    ...(primaryImage?.url ? [primaryImage.url] : []),
    ...(primaryImage?.thumbnailUrl ? [primaryImage.thumbnailUrl] : []),
    coverData.heroUrl,
    coverData.thumbnailUrl,
  ].filter((url, index, self): url is string => Boolean(url) && self.indexOf(url) === index);

  const currentUrl = candidateUrls[errorIndex] ?? coverData.heroUrl;

  const handleImageError = () => {
    if (errorIndex < candidateUrls.length - 1) {
      setErrorIndex((prev) => prev + 1);
    }
  };

  const combinedClassName = `${className} ${fitClassName}`.trim();

  return (
    <img
      src={currentUrl}
      alt={animal.commonName}
      className={combinedClassName}
      onError={handleImageError}
    />
  );
}

