import { getSettings } from "./cache";
import { reportError } from "./errorReporter";
import type { SpeciesVideo } from "../types/animal";

const YT_CACHE_PREFIX = "biblos.youtube.";
const YT_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 2 weeks

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cacheKey(query: string) {
  return `${YT_CACHE_PREFIX}${query.toLowerCase().trim().replace(/\s+/g, "_")}`;
}

function readCache(query: string): SpeciesVideo[] | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(query));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { videos: SpeciesVideo[]; cachedAt: string };
    const age = Date.now() - Date.parse(parsed.cachedAt);
    if (age > YT_CACHE_TTL_MS) return null;
    return parsed.videos;
  } catch {
    return null;
  }
}

function writeCache(query: string, videos: SpeciesVideo[]) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(
      cacheKey(query),
      JSON.stringify({ videos, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Storage full, ignore
  }
}

function scoreVideoRelevance(
  title: string,
  description: string,
  channelTitle: string,
  commonName: string,
  scientificName: string
): number {
  const cleanTitle = title.toLowerCase();
  const cleanDesc = description.toLowerCase();
  const cleanChannel = channelTitle.toLowerCase();

  const cleanCommon = commonName.toLowerCase();
  const cleanSci = scientificName.toLowerCase();

  let score = 0;

  // 1. Exact phrase matches (highest priority)
  if (cleanTitle.includes(cleanCommon)) {
    score += 40;
  }
  if (cleanTitle.includes(cleanSci)) {
    score += 50;
  }
  if (cleanDesc.includes(cleanCommon)) {
    score += 20;
  }
  if (cleanDesc.includes(cleanSci)) {
    score += 25;
  }

  // 2. Individual word matches (excluding stop words)
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "animal", "animals", "species"]);
  
  const commonWords = cleanCommon.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  for (const word of commonWords) {
    if (cleanTitle.includes(word)) score += 15;
    else if (cleanDesc.includes(word)) score += 5;
  }

  const sciWords = cleanSci.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  for (const word of sciWords) {
    if (cleanTitle.includes(word)) score += 20;
    else if (cleanDesc.includes(word)) score += 8;
  }

  // 3. Channel authoritativeness
  const authoritativeChannels = ["nat geo", "national geographic", "bbc", "earth", "nature", "wild", "smithsonian", "pbs", "deep look", "naturalist", "safari"];
  for (const auth of authoritativeChannels) {
    if (cleanChannel.includes(auth)) {
      score += 15;
      break;
    }
  }

  return score;
}

/**
 * Search YouTube Data API v3 for real videos about a species.
 * Returns verified video objects with real IDs, titles, and descriptions.
 * Applies a custom relevance heuristic to filter and rank search results.
 */
export async function searchSpeciesVideos(
  commonName: string,
  scientificName: string,
  maxResults = 8
): Promise<SpeciesVideo[]> {
  const settings = getSettings();
  const apiKey = settings.youtubeApiKey?.trim();

  if (!apiKey) {
    return [];
  }

  // Check cache first
  const queryKey = `${commonName} ${scientificName}`;
  const cached = readCache(queryKey);
  if (cached) return cached;

  // Build search queries — try species-specific terms
  const queries = [
    `${commonName} animal wildlife documentary`,
    `${scientificName} species nature`,
  ];

  const rawVideos: { video: SpeciesVideo; score: number }[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      url.searchParams.set("videoCategoryId", "15"); // Pets & Animals
      // Request up to 15 items per query to give us a good pool for ranking
      url.searchParams.set("maxResults", "15");
      url.searchParams.set("order", "relevance");
      url.searchParams.set("safeSearch", "strict");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        reportError(`YouTube API search failed (${response.status}): ${errorText}`);
        continue;
      }

      const data = (await response.json()) as YouTubeSearchResponse;
      const items = data.items ?? [];

      for (const item of items) {
        const videoId = item.id?.videoId;
        const snippet = item.snippet;
        if (!videoId || !snippet || seenIds.has(videoId)) continue;
        seenIds.add(videoId);

        // Classify the video type based on channel or title
        let videoType = "Wildlife Video";
        const channel = (snippet.channelTitle ?? "").toLowerCase();
        const title = (snippet.title ?? "").toLowerCase();
        if (channel.includes("nat geo") || channel.includes("national geographic")) {
          videoType = "National Geographic";
        } else if (channel.includes("bbc") || channel.includes("bbc earth")) {
          videoType = "BBC Earth";
        } else if (title.includes("documentary") || title.includes("doc")) {
          videoType = "Documentary";
        } else if (title.includes("spotlight") || title.includes("feature")) {
          videoType = "Feature";
        }

        const video: SpeciesVideo = {
          title: snippet.title ?? `${commonName} video`,
          duration: "", // YouTube search API doesn't return duration
          type: videoType,
          description: snippet.description ?? `A video about ${commonName}`,
          youtubeId: videoId,
        };

        const score = scoreVideoRelevance(
          video.title,
          video.description,
          snippet.channelTitle ?? "",
          commonName,
          scientificName
        );

        rawVideos.push({ video, score });
      }
    } catch (err) {
      reportError(`YouTube search failed for query "${query}"`, err);
    }
  }

  // Sort raw results by relevance score descending
  rawVideos.sort((a, b) => b.score - a.score);

  // Filter: Keep highly related videos (score >= 15).
  // But if that leaves us with fewer than 3, fallback to top 3 raw videos to ensure a minimum is returned.
  const highQuality = rawVideos.filter((v) => v.score >= 15);
  const finalVideos =
    highQuality.length >= 3
      ? highQuality.map((v) => v.video)
      : rawVideos.slice(0, 3).map((v) => v.video);

  const finalSelection = finalVideos.slice(0, maxResults);

  // Cache results even if empty (to avoid repeated failed API calls)
  writeCache(queryKey, finalSelection);
  return finalSelection;
}
