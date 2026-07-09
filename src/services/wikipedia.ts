import { useEffect, useState } from "react";

export type WikipediaSummary = {
  title: string;
  extract?: string;
  thumbnailUrl?: string | null;
  pageUrl?: string;
};

const cache = new Map<string, WikipediaSummary>();

async function fetchSummary(title: string): Promise<WikipediaSummary> {
  if (cache.has(title)) {
    return cache.get(title)!;
  }

  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!response.ok) {
    const fallback = { title, thumbnailUrl: null };
    cache.set(title, fallback);
    return fallback;
  }

  const payload = (await response.json()) as {
    title?: string;
    extract?: string;
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
  };

  const summary = {
    title: payload.title ?? title,
    extract: payload.extract,
    thumbnailUrl: payload.thumbnail?.source ?? null,
    pageUrl: payload.content_urls?.desktop?.page,
  } satisfies WikipediaSummary;
  cache.set(title, summary);
  return summary;
}

export function useWikipediaSummaries(titles: string[]) {
  const [summaries, setSummaries] = useState<Record<string, WikipediaSummary>>({});

  useEffect(() => {
    let active = true;
    const pending = titles.filter((title) => !summaries[title]);
    if (pending.length === 0) {
      return;
    }

    void Promise.all(pending.map((title) => fetchSummary(title))).then((results) => {
      if (!active) {
        return;
      }

      setSummaries((current) => {
        const next = { ...current };
        for (const result of results) {
          next[result.title] = result;
        }
        for (let index = 0; index < pending.length; index += 1) {
          next[pending[index]] = results[index];
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [summaries, titles]);

  return summaries;
}
