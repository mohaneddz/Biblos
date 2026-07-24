import { useEffect, useRef, useState } from "react";
import { useSpeciesMedia } from "../hooks/useSpeciesMedia";
import { getNodeCoverData } from "../data/classCovers";
import type { Animal } from "../types/animal";
import {
  AmphibianIcon,
  BirdIcon,
  FungiIcon,
  LeafClusterIcon,
  MammalIcon,
  MarineIcon,
  MicrobeIcon,
  PawIcon,
  ReptileIcon,
} from "./icons";

type SpeciesImageProps = {
  animal: Animal;
  className?: string;
  fitClassName?: string;
  labelClassName?: string;
  imageUrl?: string | null;
  showBadge?: boolean;
};

/** Coarse class → icon mapping used only as a last-resort visual when every
 * remote image URL (including the curated class cover) fails to load. */
function classFallbackIcon(className?: string | null) {
  const key = (className || "").toLowerCase();
  if (key === "mammalia") return MammalIcon;
  if (key === "aves") return BirdIcon;
  if (["reptilia", "squamata", "testudines", "crocodylia"].includes(key)) return ReptileIcon;
  if (["amphibia", "anura", "urodela"].includes(key)) return AmphibianIcon;
  if (
    ["actinopterygii", "elasmobranchii", "holocephali", "sarcopterygii", "myxini", "petromyzontida", "mollusca", "cephalopoda", "gastropoda", "bivalvia"].includes(key)
  ) {
    return MarineIcon;
  }
  if (["plantae", "bryophyta", "pteridophyta", "gymnosperms", "angiosperms"].includes(key)) return LeafClusterIcon;
  if (["fungi", "ascomycota", "basidiomycota"].includes(key)) return FungiIcon;
  if (["bacteria", "archaea"].includes(key)) return MicrobeIcon;
  return PawIcon;
}

/** Lazily flips to true once the element scrolls near the viewport, then
 * stays true. Keeps off-screen cards from firing cover-image requests. */
function useNearViewport<T extends HTMLElement>(rootMargin = "400px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView] as const;
}

export function SpeciesImage({
  animal,
  className = "",
  fitClassName = "h-full w-full object-cover",
  imageUrl,
}: SpeciesImageProps) {
  const [containerRef, inView] = useNearViewport<HTMLDivElement>();
  const [errorIndex, setErrorIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const knownImage = imageUrl || animal.heroImage || animal.images[0] || null;
  // Skip the network round-trip entirely once we already have a real image
  // to show, and don't fetch anything until the card is actually on screen.
  const { primaryImage, loading } = useSpeciesMedia(animal, "primary", inView && !knownImage);

  useEffect(() => {
    setErrorIndex(0);
    setExhausted(false);
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
    } else {
      // Every candidate — including the curated class cover — failed to load.
      // Stop rendering an <img> so the browser's broken-image glyph never shows.
      setExhausted(true);
    }
  };

  const isPlaceholder =
    realImages.length === 0 ||
    currentUrl === coverData.heroUrl ||
    currentUrl === coverData.thumbnailUrl ||
    errorIndex >= realImages.length;

  // Only worth signalling "downloading" while the card has nothing real to
  // show yet — once a real image (or the permanent placeholder) is settled,
  // hide the indicator even if a background refresh is still in flight.
  const showLoadingIndicator = inView && loading && isPlaceholder && !exhausted;

  const isAbsolute = className.includes("absolute") || className.includes("fixed");
  const containerClass = `${isAbsolute ? "" : "relative "}overflow-hidden ${className}`.trim();
  const FallbackIcon = classFallbackIcon(animal.classification?.className);

  return (
    <div ref={containerRef} className={containerClass}>
      {exhausted ? (
        <div className={`flex items-center justify-center bg-gradient-to-br ${coverData.gradient} ${fitClassName}`}>
          <FallbackIcon className="h-10 w-10 text-white/30" />
        </div>
      ) : (
        <img
          src={currentUrl}
          alt={animal.commonName}
          className={`${fitClassName} ${isPlaceholder ? "brightness-[0.42] contrast-[1.15] saturate-[0.55] transition duration-300" : ""}`}
          onError={handleImageError}
        />
      )}
      {isPlaceholder && !exhausted && (
        <>
          {/* Dark Primary Color Overlay & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040805]/95 via-[#07130c]/80 to-[#040805]/65 pointer-events-none" />
          <div className="absolute inset-0 bg-[#081a10]/45 mix-blend-multiply pointer-events-none" />
        </>
      )}
      {showLoadingIndicator && (
        <div
          className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-white/80 backdrop-blur-sm"
          title="Downloading cover image…"
        >
          <span className="spinner-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}
    </div>
  );
}
