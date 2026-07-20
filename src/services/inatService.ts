/**
 * inatService.ts
 *
 * Wraps the iNaturalist taxa autocomplete API for the frontend.
 * Provides debounced, cancellable autocomplete with stale-while-revalidate caching.
 *
 * Role in the authoritative-first pipeline:
 *   - iNaturalist → common-name richness + popularity signals
 *   - GBIF match → canonical taxonomy (handled in Rust backend)
 *   - No AI involvement — candidates only come from authoritative sources.
 */

import { invoke } from "@tauri-apps/api/core";
import type { SpeciesSearchHit } from "../types/speciesStore";
import { reportError } from "./errorReporter";

// ── Session-level stale-while-revalidate cache ─────────────────────────────

const SESSION_CACHE_KEY_PREFIX = "biblos:inat:autocomplete:";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  hits: SpeciesSearchHit[];
  timestamp: number;
};

function readCache(query: string): SpeciesSearchHit[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY_PREFIX + query.toLowerCase());
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(SESSION_CACHE_KEY_PREFIX + query.toLowerCase());
      return null;
    }
    return entry.hits;
  } catch {
    return null;
  }
}

function writeCache(query: string, hits: SpeciesSearchHit[]) {
  try {
    const entry: CacheEntry = { hits, timestamp: Date.now() };
    sessionStorage.setItem(SESSION_CACHE_KEY_PREFIX + query.toLowerCase(), JSON.stringify(entry));
  } catch {
    // sessionStorage quota exceeded — ignore
  }
}

// ── Debounced autocomplete ─────────────────────────────────────────────────

/** Pending debounce timer for the iNat autocomplete call */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Requests iNaturalist autocomplete results for the given query.
 *
 * - Results are debounced at 250ms to avoid hammering the API on every keystroke.
 * - Stale cached results are returned immediately while a fresh request is in flight.
 * - Calls the Tauri `search_inat_autocomplete` backend command which:
 *     1. Queries iNaturalist API (ordered by observations_count)
 *     2. Canonicalises each hit through GBIF match (rejects matchType=NONE)
 *     3. Upserts resolved records into the local SQLite index
 * - The returned AbortController can be used to cancel a pending debounce.
 *
 * @param query - Search term
 * @param onResults - Callback invoked when hits arrive (may be called twice: stale then fresh)
 * @param limit - Maximum number of hits to return (default 20)
 * @returns A cleanup function that cancels any pending debounced call
 */
export function searchInatAutocomplete(
  query: string,
  onResults: (hits: SpeciesSearchHit[]) => void,
  limit = 20,
): () => void {
  const trimmed = query.trim();

  // Clear any pending debounce
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!trimmed) {
    onResults([]);
    return () => {};
  }

  // Serve stale cache immediately (stale-while-revalidate)
  const cached = readCache(trimmed);
  if (cached) {
    onResults(cached);
  }

  let cancelled = false;

  debounceTimer = setTimeout(async () => {
    if (cancelled) return;
    try {
      const response = await invoke<{ hits: SpeciesSearchHit[] }>("search_inat_autocomplete", {
        query: trimmed,
        limit,
      });
      if (cancelled) return;
      const hits = response.hits ?? [];
      writeCache(trimmed, hits);
      onResults(hits);
    } catch (err) {
      if (cancelled) return;
      reportError(`iNaturalist autocomplete failed for query "${trimmed}"`, err);
      // Don't clear results if we already served stale cache
      if (!cached) onResults([]);
    }
  }, 250);

  return () => {
    cancelled = true;
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
}
