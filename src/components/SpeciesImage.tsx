import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import type { Animal } from "../types/animal";

type SpeciesImageProps = {
  animal: Animal;
  className: string;
  fitClassName?: string;
  labelClassName?: string;
};

export function SpeciesImage({
  animal,
  className,
  fitClassName = "h-full w-full object-cover",
  labelClassName = "text-sm text-app-text",
}: SpeciesImageProps) {
  const { primaryImage, loading } = useSpeciesMedia(animal, "primary");

  if (primaryImage) {
    return <img src={primaryImage.thumbnailUrl ?? primaryImage.url} alt={primaryImage.alt} className={fitClassName} />;
  }

  return (
    <div className={`${className} placeholder-media flex items-end p-4`}>
      <span className={labelClassName}>{loading ? "Resolving image..." : animal.commonName}</span>
    </div>
  );
}
