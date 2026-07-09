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
  const directImage = animal.heroImage ?? animal.images[0] ?? null;
  const { primaryImage, loading } = useSpeciesMedia(animal, "primary");

  if (directImage) {
    return <img src={directImage} alt={animal.commonName} className={fitClassName} />;
  }

  if (primaryImage) {
    return <img src={primaryImage.thumbnailUrl ?? primaryImage.url} alt={primaryImage.alt} className={fitClassName} />;
  }

  return (
    <div className={`${className} placeholder-media flex items-end p-4`}>
      {loading ? <span className={labelClassName}>Resolving image...</span> : null}
    </div>
  );

}
