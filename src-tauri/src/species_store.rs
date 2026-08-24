use std::{
    cmp::Ordering,
    collections::{HashMap, HashSet},
    env, fs,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, Context, Result};
use chrono::Utc;
use reqwest::Client;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

const SEED_PAGE_SIZE: usize = 100;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeciesSearchHit {
    pub id: String,
    pub gbif_taxon_key: i64,
    pub scientific_name: String,
    pub canonical_name: String,
    pub common_name: Option<String>,
    pub rank: String,
    pub kingdom: Option<String>,
    pub phylum: Option<String>,
    pub class_name: Option<String>,
    pub order_name: Option<String>,
    pub family: Option<String>,
    pub genus: Option<String>,
    pub habitat: Option<String>,
    pub diet: Option<String>,
    pub activity_pattern: Option<String>,
    pub conservation_status: Option<String>,
    pub continents: Option<String>,
    /// Alternate vernacular names / synonyms (populated from iNaturalist or GBIF vernacularNames)
    pub aliases: Vec<String>,
    /// iNaturalist taxon ID — None when the hit was not sourced from iNaturalist
    pub inat_taxon_id: Option<i64>,
    /// Popularity score normalised to 0-1 from iNat observations count
    pub popularity_score: f64,
    pub source: String,
    pub updated_at: String,
    pub score: f64,
    pub match_reason: String,
    pub is_live_fallback: bool,
}

/// Result type for the `parse_query_to_filters` command.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StructuredFilters {
    pub habitat: Option<String>,
    pub diet: Option<String>,
    pub activity_pattern: Option<String>,
    pub conservation_status: Option<String>,
    pub continent: Option<String>,
    pub class_name: Option<String>,
    pub text_remainder: Option<String>,
}

/// Result type for the `search_inat_autocomplete` command.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InatAutocompleteResponse {
    pub hits: Vec<SpeciesSearchHit>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub hits: Vec<SpeciesSearchHit>,
    pub used_live_fallback: bool,
    #[serde(default)]
    pub total_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeciesProfilePayload {
    pub id: String,
    pub gbif_taxon_key: i64,
    pub animal: Value,
    pub cached: bool,
    pub partial: bool,
}

#[derive(Debug, Clone, Deserialize)]
struct GbifSearchResponse {
    #[serde(default)]
    results: Vec<GbifSpeciesSearchItem>,
}

#[derive(Debug, Clone, Deserialize)]
struct GbifSpeciesSearchItem {
    #[serde(rename = "key")]
    key: Option<i64>,
    #[serde(rename = "taxonKey")]
    taxon_key: Option<i64>,
    #[serde(rename = "acceptedTaxonKey")]
    accepted_taxon_key: Option<i64>,
    #[serde(rename = "scientificName")]
    scientific_name: Option<String>,
    #[serde(rename = "canonicalName")]
    canonical_name: Option<String>,
    #[serde(rename = "vernacularName")]
    vernacular_name: Option<String>,
    #[serde(rename = "vernacularNames", default)]
    vernacular_names: Vec<GbifVernacularName>,
    rank: Option<String>,
    kingdom: Option<String>,
    phylum: Option<String>,
    #[serde(rename = "class")]
    class_name: Option<String>,
    order: Option<String>,
    family: Option<String>,
    genus: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct GbifVernacularName {
    #[serde(rename = "vernacularName")]
    vernacular_name: Option<String>,
    language: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct GbifSpeciesDetails {
    #[serde(rename = "taxonKey")]
    taxon_key: Option<i64>,
    #[serde(rename = "scientificName")]
    scientific_name: Option<String>,
    #[serde(rename = "canonicalName")]
    canonical_name: Option<String>,
    rank: Option<String>,
    kingdom: Option<String>,
    phylum: Option<String>,
    #[serde(rename = "class")]
    class_name: Option<String>,
    order: Option<String>,
    family: Option<String>,
    genus: Option<String>,
    species: Option<String>,
    habitat: Option<String>,
    threat: Option<String>,
    native: Option<bool>,
    extinct: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikipediaSummary {
    title: Option<String>,
    extract: Option<String>,
    thumbnail: Option<WikipediaImage>,
    originalimage: Option<WikipediaImage>,
    content_urls: Option<WikipediaContentUrls>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikipediaImage {
    source: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikipediaContentUrls {
    desktop: Option<WikipediaDesktopUrl>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikipediaDesktopUrl {
    page: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikidataSearchResponse {
    #[serde(default)]
    search: Vec<WikidataSearchItem>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct WikidataSearchItem {
    id: Option<String>,
    label: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct INaturalistSearchResponse {
    #[serde(default)]
    results: Vec<INaturalistTaxon>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct INaturalistTaxon {
    id: Option<i64>,
    name: Option<String>,
    preferred_common_name: Option<String>,
    iconic_taxon_name: Option<String>,
    default_photo: Option<INaturalistPhoto>,
    #[serde(default)]
    observations_count: Option<i64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct INaturalistPhoto {
    medium_url: Option<String>,
    large_url: Option<String>,
    original_url: Option<String>,
    license_code: Option<String>,
    attribution: Option<String>,
    attribution_name: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct GroqChatResponse {
    choices: Vec<GroqChoice>,
}

#[derive(Debug, Clone, Deserialize)]
struct GroqChoice {
    message: GroqMessage,
}

#[derive(Debug, Clone, Deserialize)]
struct GroqMessage {
    content: Option<String>,
}

#[derive(Debug, Clone)]
struct IndexRecord {
    gbif_taxon_key: i64,
    scientific_name: String,
    canonical_name: String,
    common_name: Option<String>,
    /// Tab-separated alternate names stored in DB, split on read
    aliases: Vec<String>,
    inat_taxon_id: Option<i64>,
    popularity_score: f64,
    rank: String,
    kingdom: Option<String>,
    phylum: Option<String>,
    class_name: Option<String>,
    order_name: Option<String>,
    family: Option<String>,
    genus: Option<String>,
    habitat: Option<String>,
    diet: Option<String>,
    activity_pattern: Option<String>,
    conservation_status: Option<String>,
    continents: Option<String>,
    source: String,
    updated_at: String,
}

pub fn db_path_for_app(app: Option<&AppHandle>) -> Result<PathBuf> {
    dotenvy::dotenv().ok();

    if let Ok(explicit) = env::var("BIBLOS_DB_PATH") {
        let path = PathBuf::from(explicit);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        return Ok(path);
    }

    if let Some(app) = app {
        let dir = app
            .path()
            .app_local_data_dir()
            .map_err(|error| anyhow!("failed to resolve app data dir: {error}"))?;
        fs::create_dir_all(&dir)?;
        let target_path = dir.join("biblos.sqlite3");
        let mut potential_bundles = vec![
            PathBuf::from("src-tauri").join("biblos.sqlite3"),
            PathBuf::from("biblos.sqlite3"),
        ];
        if let Ok(res_dir) = app.path().resource_dir() {
            potential_bundles.push(res_dir.join("biblos.sqlite3"));
        }

        for bundled_path in potential_bundles {
            if bundled_path.exists() {
                let bundled_size = fs::metadata(&bundled_path).map(|m| m.len()).unwrap_or(0);
                let target_size = fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0);
                if bundled_size > target_size {
                    let _ = fs::copy(&bundled_path, &target_path);
                    break;
                }
            }
        }
        return Ok(target_path);
    }

    let path = PathBuf::from("src-tauri").join("biblos.sqlite3");
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(path)
}
fn open_connection(path: &Path) -> Result<Connection> {
    let connection = Connection::open(path)?;
    connection.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA temp_store = MEMORY;

        CREATE TABLE IF NOT EXISTS species_index (
          id TEXT PRIMARY KEY,
          gbif_taxon_key INTEGER NOT NULL UNIQUE,
          scientific_name TEXT NOT NULL,
          canonical_name TEXT NOT NULL,
          common_name TEXT,
          rank TEXT NOT NULL,
          kingdom TEXT,
          phylum TEXT,
          class_name TEXT,
          order_name TEXT,
          family TEXT,
          genus TEXT,
          source TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS species_profiles (
          gbif_taxon_key INTEGER PRIMARY KEY,
          full_json TEXT NOT NULL,
          hydrated_at TEXT NOT NULL
        );
        ",
    )?;

    // Backwards-compatible column migrations — SQLite ignores duplicate ADD COLUMN errors.
    for sql in [
        "ALTER TABLE species_index ADD COLUMN aliases TEXT",
        "ALTER TABLE species_index ADD COLUMN inat_taxon_id INTEGER",
        "ALTER TABLE species_index ADD COLUMN popularity_score REAL DEFAULT 0.0",
        "ALTER TABLE species_index ADD COLUMN habitat TEXT",
        "ALTER TABLE species_index ADD COLUMN diet TEXT",
        "ALTER TABLE species_index ADD COLUMN activity_pattern TEXT",
        "ALTER TABLE species_index ADD COLUMN conservation_status TEXT",
        "ALTER TABLE species_index ADD COLUMN continents TEXT",
    ] {
        let _ = connection.execute(sql, []);
    }

    connection.execute_batch(
        "
        CREATE VIRTUAL TABLE IF NOT EXISTS species_index_fts USING fts5(
          id UNINDEXED,
          scientific_name,
          canonical_name,
          common_name,
          aliases,
          class_name,
          family,
          genus,
          tokenize = 'unicode61 remove_diacritics 1'
        );

        CREATE TRIGGER IF NOT EXISTS species_index_ai AFTER INSERT ON species_index BEGIN
          INSERT INTO species_index_fts (rowid, id, scientific_name, canonical_name, common_name, aliases, class_name, family, genus)
          VALUES (new.rowid, new.id, new.scientific_name, new.canonical_name,
                  coalesce(new.common_name, ''), coalesce(new.aliases, ''),
                  coalesce(new.class_name, ''), coalesce(new.family, ''), coalesce(new.genus, ''));
        END;

        CREATE TRIGGER IF NOT EXISTS species_index_ad AFTER DELETE ON species_index BEGIN
          INSERT INTO species_index_fts(species_index_fts, rowid, id, scientific_name, canonical_name, common_name, aliases, class_name, family, genus)
          VALUES('delete', old.rowid, old.id, old.scientific_name, old.canonical_name,
                 coalesce(old.common_name, ''), coalesce(old.aliases, ''),
                 coalesce(old.class_name, ''), coalesce(old.family, ''), coalesce(old.genus, ''));
        END;

        CREATE TRIGGER IF NOT EXISTS species_index_au AFTER UPDATE ON species_index BEGIN
          INSERT INTO species_index_fts(species_index_fts, rowid, id, scientific_name, canonical_name, common_name, aliases, class_name, family, genus)
          VALUES('delete', old.rowid, old.id, old.scientific_name, old.canonical_name,
                 coalesce(old.common_name, ''), coalesce(old.aliases, ''),
                 coalesce(old.class_name, ''), coalesce(old.family, ''), coalesce(old.genus, ''));
          INSERT INTO species_index_fts (rowid, id, scientific_name, canonical_name, common_name, aliases, class_name, family, genus)
          VALUES (new.rowid, new.id, new.scientific_name, new.canonical_name,
                  coalesce(new.common_name, ''), coalesce(new.aliases, ''),
                  coalesce(new.class_name, ''), coalesce(new.family, ''), coalesce(new.genus, ''));
        END;
        ",
    )?;
    Ok(connection)
}

/// HTTP GET with exponential back-off on 429 / 503 responses.
/// Attempts: immediate, +1 s, +3 s.
async fn get_with_retry(client: &Client, url: &str) -> Result<reqwest::Response> {
    let delays_ms: &[u64] = &[0, 1000, 3000];
    let mut last_err: anyhow::Error = anyhow!("no attempts made");
    for (attempt, &delay) in delays_ms.iter().enumerate() {
        if delay > 0 {
            tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
        }
        match client.get(url).send().await {
            Ok(resp) if resp.status().as_u16() == 429 || resp.status().as_u16() == 503 => {
                last_err = anyhow!("rate-limited (attempt {}): {}", attempt + 1, resp.status());
                continue;
            }
            Ok(resp) => return Ok(resp),
            Err(err) => {
                last_err = err.into();
            }
        }
    }
    Err(last_err)
}

fn make_species_id(gbif_taxon_key: i64) -> String {
    format!("gbif-{gbif_taxon_key}")
}

fn normalize(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ch.is_alphanumeric() {
                ch.to_lowercase().to_string()
            } else {
                " ".to_string()
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn fts_query(query: &str) -> String {
    normalize(query)
        .split_whitespace()
        .map(|term| format!("{}*", term.replace('"', "")))
        .collect::<Vec<_>>()
        .join(" ")
}

fn score_local_hit(record: &IndexRecord, query: &str, fts_rank: f64) -> (f64, String) {
    let q = normalize(query);
    let common = record
        .common_name
        .as_deref()
        .map(normalize)
        .unwrap_or_default();
    let scientific = normalize(&record.scientific_name);
    let canonical = normalize(&record.canonical_name);
    let normalized_aliases: Vec<String> = record.aliases.iter().map(|a| normalize(a)).collect();

    if !common.is_empty() && common == q {
        return (300.0, "exact_common".into());
    }
    if scientific == q || canonical == q {
        return (260.0, "exact_scientific".into());
    }

    // Check alias exact match (synonyms, alternate vernacular names)
    for alias in &normalized_aliases {
        if !alias.is_empty() && alias == &q {
            return (280.0, "exact_alias".into());
        }
    }

    if !common.is_empty() && common.starts_with(&q) {
        return (220.0, "prefix_common".into());
    }
    if scientific.starts_with(&q) || canonical.starts_with(&q) {
        return (200.0, "prefix_scientific".into());
    }
    // Alias prefix match
    for alias in &normalized_aliases {
        if !alias.is_empty() && alias.starts_with(&q) {
            return (190.0, "prefix_alias".into());
        }
    }

    let mut fuzzy_candidates = vec![
        common.as_str(),
        scientific.as_str(),
        canonical.as_str(),
        record.family.as_deref().unwrap_or(""),
        record.genus.as_deref().unwrap_or(""),
        record.class_name.as_deref().unwrap_or(""),
    ];
    for alias in &normalized_aliases {
        fuzzy_candidates.push(alias.as_str());
    }

    let fuzzy = best_similarity(&q, &fuzzy_candidates);
    let token_bonus = q
        .split_whitespace()
        .filter(|token| !token.is_empty())
        .map(|token| {
            let token = token.trim();
            let alias_hit = normalized_aliases.iter().any(|a| a.contains(token));
            if common.contains(token)
                || scientific.contains(token)
                || canonical.contains(token)
                || alias_hit
            {
                0.12
            } else {
                0.0
            }
        })
        .sum::<f64>();

    (
        120.0 + fuzzy * 40.0 + token_bonus * 120.0 + fts_rank.max(0.0),
        "fts".into(),
    )
}

fn best_similarity(query: &str, values: &[&str]) -> f64 {
    values
        .iter()
        .filter(|value| !value.is_empty())
        .map(|value| normalized_similarity(query, value))
        .fold(0.0, f64::max)
}

fn normalized_similarity(a: &str, b: &str) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    if a == b {
        return 1.0;
    }
    let distance = levenshtein(a, b) as f64;
    let max_len = a.len().max(b.len()) as f64;
    (1.0 - distance / max_len).max(0.0)
}

fn levenshtein(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let mut costs: Vec<usize> = (0..=b_chars.len()).collect();

    for (i, ca) in a_chars.iter().enumerate() {
        let mut last = i;
        costs[0] = i + 1;

        for (j, cb) in b_chars.iter().enumerate() {
            let current = costs[j + 1];
            costs[j + 1] = if ca == cb {
                last
            } else {
                1 + last.min(costs[j]).min(costs[j + 1])
            };
            last = current;
        }
    }

    costs[b_chars.len()]
}

fn row_to_record(row: &rusqlite::Row<'_>) -> rusqlite::Result<IndexRecord> {
    let aliases_raw: Option<String> = row.get("aliases").ok().flatten();
    let aliases = aliases_raw
        .as_deref()
        .unwrap_or("")
        .split('\t')
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
        .collect();
    Ok(IndexRecord {
        gbif_taxon_key: row.get("gbif_taxon_key")?,
        scientific_name: row.get("scientific_name")?,
        canonical_name: row.get("canonical_name")?,
        common_name: row.get("common_name")?,
        aliases,
        inat_taxon_id: row.get("inat_taxon_id").ok().flatten(),
        popularity_score: row
            .get::<_, Option<f64>>("popularity_score")
            .ok()
            .flatten()
            .unwrap_or(0.0),
        rank: row.get("rank")?,
        kingdom: row.get("kingdom")?,
        phylum: row.get("phylum")?,
        class_name: row.get("class_name")?,
        order_name: row.get("order_name")?,
        family: row.get("family")?,
        genus: row.get("genus")?,
        habitat: row.get("habitat").ok().flatten(),
        diet: row.get("diet").ok().flatten(),
        activity_pattern: row.get("activity_pattern").ok().flatten(),
        conservation_status: row.get("conservation_status").ok().flatten(),
        continents: row.get("continents").ok().flatten(),
        source: row.get("source")?,
        updated_at: row.get("updated_at")?,
    })
}

fn to_search_hit(
    record: IndexRecord,
    score: f64,
    match_reason: String,
    is_live_fallback: bool,
) -> SpeciesSearchHit {
    SpeciesSearchHit {
        id: make_species_id(record.gbif_taxon_key),
        gbif_taxon_key: record.gbif_taxon_key,
        scientific_name: record.scientific_name,
        canonical_name: record.canonical_name,
        common_name: record.common_name,
        aliases: record.aliases,
        inat_taxon_id: record.inat_taxon_id,
        popularity_score: record.popularity_score,
        rank: record.rank,
        kingdom: record.kingdom,
        phylum: record.phylum,
        class_name: record.class_name,
        order_name: record.order_name,
        family: record.family,
        genus: record.genus,
        habitat: record.habitat,
        diet: record.diet,
        activity_pattern: record.activity_pattern,
        conservation_status: record.conservation_status,
        continents: record.continents,
        source: record.source,
        updated_at: record.updated_at,
        score,
        match_reason,
        is_live_fallback,
    }
}

fn search_hit_key(hit: &SpeciesSearchHit) -> String {
    let canonical = normalize(&hit.canonical_name);
    if !canonical.is_empty() {
        return canonical;
    }

    let scientific = normalize(&hit.scientific_name);
    if !scientific.is_empty() {
        return scientific;
    }

    let common = hit
        .common_name
        .as_deref()
        .map(normalize)
        .unwrap_or_default();
    if !common.is_empty() {
        return common;
    }

    hit.id.clone()
}

fn better_search_hit(candidate: &SpeciesSearchHit, existing: &SpeciesSearchHit) -> bool {
    candidate.score > existing.score
        || (candidate.score == existing.score
            && candidate.common_name.is_some()
            && existing.common_name.is_none())
        || (candidate.score == existing.score
            && candidate.is_live_fallback
            && !existing.is_live_fallback)
}

fn dedupe_search_hits(hits: Vec<SpeciesSearchHit>) -> Vec<SpeciesSearchHit> {
    let mut deduped: HashMap<String, SpeciesSearchHit> = HashMap::new();

    for hit in hits {
        let key = search_hit_key(&hit);
        match deduped.get_mut(&key) {
            Some(existing) => {
                if better_search_hit(&hit, existing) {
                    *existing = hit;
                }
            }
            None => {
                deduped.insert(key, hit);
            }
        }
    }

    let mut values = deduped.into_values().collect::<Vec<_>>();
    values.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(Ordering::Equal)
            .then_with(|| a.canonical_name.cmp(&b.canonical_name))
    });
    values
}

pub fn initialize_database(app: Option<&AppHandle>) -> Result<PathBuf> {
    let path = db_path_for_app(app)?;
    let _ = open_connection(&path)?;
    Ok(path)
}

fn upsert_species_index(connection: &Connection, record: &IndexRecord) -> Result<()> {
    let aliases_str = record.aliases.join("\t");
    connection.execute(
        "
        INSERT INTO species_index (
          id, gbif_taxon_key, scientific_name, canonical_name, common_name, aliases,
          inat_taxon_id, popularity_score, rank, kingdom, phylum, class_name, order_name, family, genus,
          habitat, diet, activity_pattern, conservation_status, continents, source, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)
        ON CONFLICT(gbif_taxon_key) DO UPDATE SET
          id = excluded.id,
          scientific_name = excluded.scientific_name,
          canonical_name = excluded.canonical_name,
          common_name = coalesce(excluded.common_name, species_index.common_name),
          aliases = case when excluded.aliases != '' then excluded.aliases else species_index.aliases end,
          inat_taxon_id = coalesce(excluded.inat_taxon_id, species_index.inat_taxon_id),
          popularity_score = case when excluded.popularity_score > 0 then excluded.popularity_score else species_index.popularity_score end,
          rank = excluded.rank,
          kingdom = excluded.kingdom,
          phylum = excluded.phylum,
          class_name = excluded.class_name,
          order_name = excluded.order_name,
          family = excluded.family,
          genus = excluded.genus,
          habitat = coalesce(excluded.habitat, species_index.habitat),
          diet = coalesce(excluded.diet, species_index.diet),
          activity_pattern = coalesce(excluded.activity_pattern, species_index.activity_pattern),
          conservation_status = coalesce(excluded.conservation_status, species_index.conservation_status),
          continents = coalesce(excluded.continents, species_index.continents),
          source = excluded.source,
          updated_at = excluded.updated_at
        ",
        params![
            make_species_id(record.gbif_taxon_key),
            record.gbif_taxon_key,
            record.scientific_name,
            record.canonical_name,
            record.common_name,
            if aliases_str.is_empty() { None } else { Some(aliases_str) },
            record.inat_taxon_id,
            record.popularity_score,
            record.rank,
            record.kingdom,
            record.phylum,
            record.class_name,
            record.order_name,
            record.family,
            record.genus,
            record.habitat,
            record.diet,
            record.activity_pattern,
            record.conservation_status,
            record.continents,
            record.source,
            record.updated_at,
        ],
    )?;
    Ok(())
}

fn gbif_item_to_record(
    item: &GbifSpeciesSearchItem,
    common_name: Option<String>,
) -> Option<IndexRecord> {
    let gbif_taxon_key = item.accepted_taxon_key.or(item.taxon_key).or(item.key)?;
    let scientific_name = item.scientific_name.clone()?;
    let canonical_name = item
        .canonical_name
        .clone()
        .unwrap_or_else(|| scientific_name.clone());

    // Collect all vernacular names as aliases (excluding the preferred common name already stored)
    let preferred = common_name.as_deref().map(|s| s.to_lowercase());
    let aliases: Vec<String> = item
        .vernacular_names
        .iter()
        .filter_map(|entry| {
            entry
                .vernacular_name
                .as_deref()
                .map(|s| s.trim().to_owned())
        })
        .filter(|name| !name.is_empty())
        .filter(|name| preferred.as_deref() != Some(&name.to_lowercase()))
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .take(10)
        .collect();

    Some(IndexRecord {
        gbif_taxon_key,
        scientific_name,
        canonical_name,
        common_name,
        aliases,
        inat_taxon_id: None,
        popularity_score: 0.0,
        rank: item.rank.clone().unwrap_or_else(|| "SPECIES".into()),
        kingdom: item.kingdom.clone(),
        phylum: item.phylum.clone(),
        class_name: item.class_name.clone(),
        order_name: item.order.clone(),
        family: item.family.clone(),
        genus: item.genus.clone(),
        habitat: None,
        diet: None,
        activity_pattern: None,
        conservation_status: None,
        continents: None,
        source: "GBIF".into(),
        updated_at: Utc::now().to_rfc3339(),
    })
}

pub fn delete_species_record(app: Option<&AppHandle>, id: &str) -> Result<()> {
    let path = db_path_for_app(app)?;
    let conn = open_connection(&path)?;

    let gbif_taxon_key: Option<i64> = id.strip_prefix("gbif-").and_then(|k| k.parse::<i64>().ok());

    if let Some(key) = gbif_taxon_key {
        let _ = conn.execute(
            "DELETE FROM species_profiles WHERE gbif_taxon_key = ?1",
            params![key],
        );
        let _ = conn.execute(
            "DELETE FROM species_index WHERE gbif_taxon_key = ?1",
            params![key],
        );
    }
    let _ = conn.execute("DELETE FROM species_index WHERE id = ?1", params![id]);

    Ok(())
}

fn preferred_common_name(item: &GbifSpeciesSearchItem) -> Option<String> {
    item.vernacular_name
        .clone()
        .or_else(|| {
            item.vernacular_names
                .iter()
                .find(|entry| {
                    entry
                        .language
                        .as_deref()
                        .map(|language| language.eq_ignore_ascii_case("eng"))
                        .unwrap_or(false)
                })
                .and_then(|entry| entry.vernacular_name.clone())
        })
        .or_else(|| {
            item.vernacular_names
                .iter()
                .find_map(|entry| entry.vernacular_name.clone())
        })
}

struct PrioritySeed<'a> {
    limit: usize,
    taxon_key: i64,
    class_name: &'a str,
    quota: usize,
}

async fn seed_priority_class(
    client: &Client,
    db_path: PathBuf,
    seen: &mut HashSet<i64>,
    inserted: &mut usize,
    seed: PrioritySeed<'_>,
) -> Result<()> {
    let mut offset = 0usize;
    let mut class_inserted = 0usize;

    while *inserted < seed.limit && class_inserted < seed.quota {
        let batch_limit = SEED_PAGE_SIZE.min(seed.quota - class_inserted);
        let url = format!(
            "https://api.gbif.org/v1/species/search?highertaxon_key={}&rank=SPECIES&status=ACCEPTED&limit={batch_limit}&offset={offset}",
            seed.taxon_key,
        );
        let response = match get_with_retry(client, &url).await {
            Ok(response) if response.status().is_success() => response,
            _ => break,
        };
        let payload: GbifSearchResponse = match response.json().await {
            Ok(payload) => payload,
            Err(_) => break,
        };
        if payload.results.is_empty() {
            break;
        }

        let fetched_count = payload.results.len();
        let connection = open_connection(&db_path)?;
        for item in payload.results {
            if *inserted >= seed.limit || class_inserted >= seed.quota {
                break;
            }
            let Some(gbif_taxon_key) = item.accepted_taxon_key.or(item.taxon_key).or(item.key)
            else {
                continue;
            };
            if !seen.insert(gbif_taxon_key) {
                continue;
            }
            let Some(common_name) = preferred_common_name(&item) else {
                continue;
            };
            let Some(record) = gbif_item_to_record(&item, Some(common_name)) else {
                continue;
            };
            if upsert_species_index(&connection, &record).is_ok() {
                *inserted += 1;
                class_inserted += 1;
                if (*inserted).is_multiple_of(25) || *inserted >= seed.limit {
                    println!(
                        "--> Priority class {}: indexed {}/{}",
                        seed.class_name, *inserted, seed.limit
                    );
                }
            }
        }
        offset += fetched_count;
    }

    Ok(())
}

/// Curated dinosaur-lineage species (Paleobiology Database, body-fossil
/// taxa only — ichnotaxa/ootaxa and modern bird orders excluded).
/// Bundled at compile time since there's no single GBIF highertaxon node
/// that cleanly groups "Dinosauria" the way the priority classes above do.
#[derive(Debug, Clone, Deserialize)]
struct DinosaurSeed {
    name: String,
    common: Option<String>,
    clade: Option<String>,
    family: Option<String>,
}

const DINOSAUR_SEED_JSON: &str = include_str!("../data/dinosaurs.json");

async fn seed_dinosaurs(
    client: &Client,
    db_path: PathBuf,
    seen: &mut HashSet<i64>,
    inserted: &mut usize,
    limit: usize,
) -> Result<()> {
    let entries: Vec<DinosaurSeed> = serde_json::from_str(DINOSAUR_SEED_JSON)?;
    let mut indexed = 0usize;

    for entry in &entries {
        if *inserted >= limit {
            break;
        }

        let gbif_url = format!(
            "https://api.gbif.org/v1/species/match?name={}&kingdom=Animalia",
            urlencoding::encode(&entry.name)
        );
        let gbif_resp = match get_with_retry(client, &gbif_url).await {
            Ok(r) if r.status().is_success() => r,
            _ => continue,
        };
        let gbif_data: Value = match gbif_resp.json().await {
            Ok(d) => d,
            Err(_) => continue,
        };

        let match_type = gbif_data
            .get("matchType")
            .and_then(|v| v.as_str())
            .unwrap_or("NONE");
        if match_type == "NONE" {
            continue;
        }
        let gbif_kingdom = gbif_data
            .get("kingdom")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();
        if !gbif_kingdom.is_empty() && gbif_kingdom != "animalia" {
            continue;
        }
        let gbif_taxon_key = match gbif_data.get("usageKey").and_then(|v| v.as_i64()) {
            Some(k) if k > 0 => k,
            _ => continue,
        };
        if !seen.insert(gbif_taxon_key) {
            continue;
        }

        let canonical = gbif_data
            .get("canonicalName")
            .and_then(|v| v.as_str())
            .unwrap_or(&entry.name)
            .to_owned();
        let sci_name = gbif_data
            .get("scientificName")
            .and_then(|v| v.as_str())
            .unwrap_or(&entry.name)
            .to_owned();
        let genus = gbif_data
            .get("genus")
            .and_then(|v| v.as_str())
            .map(ToOwned::to_owned)
            .or_else(|| canonical.split_whitespace().next().map(ToOwned::to_owned));

        // Most non-avian dinosaur species have no popular vernacular name —
        // the genus name itself is how the public refers to them (nobody
        // says "tyrant lizard king", everyone says "Tyrannosaurus").
        let common_name = entry
            .common
            .clone()
            .or_else(|| genus.clone())
            .unwrap_or_else(|| canonical.clone());

        let record = IndexRecord {
            gbif_taxon_key,
            scientific_name: sci_name,
            canonical_name: canonical,
            common_name: Some(common_name),
            aliases: Vec::new(),
            inat_taxon_id: None,
            popularity_score: 0.0,
            rank: "SPECIES".into(),
            kingdom: gbif_data
                .get("kingdom")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            phylum: gbif_data
                .get("phylum")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            class_name: Some("Reptilia".into()),
            // PBDB exposes Ornithischia/Saurischia as its `class` value for
            // many taxa, but leaves numerous theropods at Reptilia. Under the
            // traditional dinosaur split, every remaining dinosaur-lineage
            // taxon belongs to Saurischia (including extinct bird lineages).
            order_name: Some(entry.clade.clone().unwrap_or_else(|| "Saurischia".into())),
            family: gbif_data
                .get("family")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned)
                .or_else(|| entry.family.clone()),
            genus,
            habitat: None,
            diet: None,
            activity_pattern: None,
            conservation_status: Some("Extinct".into()),
            continents: None,
            source: "PBDB+GBIF".into(),
            updated_at: Utc::now().to_rfc3339(),
        };

        let connection = open_connection(&db_path)?;
        if upsert_species_index(&connection, &record).is_ok() {
            *inserted += 1;
            indexed += 1;
            if indexed.is_multiple_of(25) {
                println!(
                    "--> Dinosaurs: indexed {indexed}/{} ({}/{})",
                    entries.len(),
                    *inserted,
                    limit
                );
            }
        }
    }

    println!("--> Dinosaurs: indexed {indexed}/{} total", entries.len());
    Ok(())
}

pub async fn seed_index(app: Option<&AppHandle>, limit: usize) -> Result<usize> {
    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let client = Client::builder()
        .user_agent("Biblos/0.7 (contact@biblos.app)")
        .timeout(std::time::Duration::from_secs(20))
        .build()?;
    let mut seen = HashSet::new();
    let mut inserted: usize;

    // Load existing keys from database so we don't re-fetch
    {
        let mut stmt = connection.prepare("SELECT gbif_taxon_key FROM species_index")?;
        let rows = stmt.query_map([], |row| row.get::<_, i64>(0))?;
        for key in rows.flatten() {
            seen.insert(key);
        }
        inserted = seen.len();
        println!(
            "Database currently has {} species indexed. Target: {}",
            inserted, limit
        );
        if inserted >= limit {
            return Ok(inserted);
        }
    }

    // Curated dinosaur-lineage species (Jurassic update) go first and get first
    // claim on the budget — priority_classes below share one quota where the
    // first class with enough supply can consume all of it, so anything
    // placed after that loop isn't guaranteed to run at all.
    seed_dinosaurs(&client, path.clone(), &mut seen, &mut inserted, limit).await?;

    // Prioritize low-coverage classes before the broad animal seed. These are
    // real GBIF classes under sparsely represented branches of the life tree.
    // Reptilia is represented by its accepted GBIF child classes (Squamata,
    // Testudines, and Crocodylia), since GBIF treats Reptilia as a higher clade.
    let priority_classes: &[(i64, &str)] = &[
        (11592253, "Squamata"),
        (11418114, "Testudines"),
        (11493978, "Crocodylia"),
        (136, "Cephalopoda"),
        (131, "Amphibia"),
        (137, "Bivalvia"),
        (206, "Anthozoa"),
        (214, "Asteroidea"),
        (205, "Hydrozoa"),
        (221, "Echinoidea"),
        (255, "Clitellata"),
        (229, "Malacostraca"),
        (225, "Gastropoda"),
        (361, "Diplopoda"),
        (360, "Chilopoda"),
        (121, "Elasmobranchii"),
        (120, "Holocephali"),
    ];
    let priority_quota = limit.saturating_sub(inserted).max(1);
    for (taxon_key, class_name) in priority_classes {
        if inserted >= limit {
            break;
        }
        seed_priority_class(
            &client,
            path.clone(),
            &mut seen,
            &mut inserted,
            PrioritySeed {
                limit,
                taxon_key: *taxon_key,
                class_name,
                quota: priority_quota,
            },
        )
        .await?;
    }

    // Phase 1: Seed from iNaturalist top observed animal taxa (most famous/observed species first)
    let per_page = 100;
    let mut page = 1;
    let max_pages = 25;

    while inserted < limit && page <= max_pages {
        let url = format!(
            "https://api.inaturalist.org/v1/taxa?taxon_id=1&rank=species&order_by=observations_count&per_page={}&page={}",
            per_page, page
        );

        let resp = match get_with_retry(&client, &url).await {
            Ok(r) if r.status().is_success() => r,
            _ => {
                page += 1;
                continue;
            }
        };

        let inat_data: INaturalistSearchResponse = match resp.json().await {
            Ok(d) => d,
            Err(_) => {
                page += 1;
                continue;
            }
        };

        if inat_data.results.is_empty() {
            break;
        }

        let max_obs = inat_data
            .results
            .iter()
            .filter_map(|t| t.observations_count)
            .max()
            .unwrap_or(1)
            .max(1) as f64;

        for taxon in inat_data.results {
            let scientific_name = match taxon.name.as_deref() {
                Some(s) if !s.is_empty() => s.to_owned(),
                _ => continue,
            };
            let common_name = taxon.preferred_common_name.clone();
            // High quality filter: require a common name!
            let Some(ref c_name) = common_name else {
                continue;
            };
            if c_name.trim().is_empty() {
                continue;
            }

            let obs_count = taxon.observations_count.unwrap_or(0);
            let popularity = (obs_count as f64 / max_obs).clamp(0.0, 1.0);

            // GBIF strict match to get canonical taxonomy & usage key
            let gbif_url = format!(
                "https://api.gbif.org/v1/species/match?name={}&kingdom=Animalia",
                urlencoding::encode(&scientific_name)
            );
            let gbif_resp = match get_with_retry(&client, &gbif_url).await {
                Ok(r) if r.status().is_success() => r,
                _ => continue,
            };
            let gbif_data: serde_json::Value = match gbif_resp.json().await {
                Ok(d) => d,
                Err(_) => continue,
            };

            let match_type = gbif_data
                .get("matchType")
                .and_then(|v| v.as_str())
                .unwrap_or("NONE");
            if match_type == "NONE" {
                continue;
            }

            let gbif_kingdom = gbif_data
                .get("kingdom")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_lowercase();
            if !gbif_kingdom.is_empty() && gbif_kingdom != "animalia" {
                continue;
            }

            let gbif_taxon_key = match gbif_data.get("usageKey").and_then(|v| v.as_i64()) {
                Some(k) if k > 0 => k,
                _ => continue,
            };

            if !seen.insert(gbif_taxon_key) {
                continue;
            }

            let canonical = gbif_data
                .get("canonicalName")
                .and_then(|v| v.as_str())
                .unwrap_or(&scientific_name)
                .to_owned();
            let sci_name = gbif_data
                .get("scientificName")
                .and_then(|v| v.as_str())
                .unwrap_or(&scientific_name)
                .to_owned();

            let mut aliases: Vec<String> = vec![];
            aliases.push(c_name.clone());
            if let Some(icon) = &taxon.iconic_taxon_name {
                if !icon.is_empty() {
                    aliases.push(icon.clone());
                }
            }
            aliases.dedup();

            let class_name = gbif_data
                .get("class")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned)
                .or_else(|| {
                    let order = gbif_data
                        .get("order")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_lowercase();
                    if [
                        "carnivora",
                        "primates",
                        "rodentia",
                        "cetacea",
                        "chiroptera",
                        "artiodactyla",
                        "perissodactyla",
                        "diprotodontia",
                        "eulipotyphla",
                        "lagomorpha",
                        "proboscidea",
                    ]
                    .contains(&order.as_str())
                    {
                        Some("Mammalia".into())
                    } else if [
                        "passeriformes",
                        "accipitriformes",
                        "falconiformes",
                        "anseriformes",
                        "columbiformes",
                        "psittaciformes",
                        "charadriiformes",
                        "pelecaniformes",
                        "sphenisciformes",
                        "strigiformes",
                    ]
                    .contains(&order.as_str())
                    {
                        Some("Aves".into())
                    } else if ["squamata", "testudines", "crocodilia"].contains(&order.as_str()) {
                        Some("Reptilia".into())
                    } else if ["anura", "caudata"].contains(&order.as_str()) {
                        Some("Amphibia".into())
                    } else if [
                        "perciformes",
                        "cypriniformes",
                        "siluriformes",
                        "salmoniformes",
                    ]
                    .contains(&order.as_str())
                    {
                        Some("Actinopterygii".into())
                    } else {
                        Some("Mammalia".into())
                    }
                });

            let record = IndexRecord {
                gbif_taxon_key,
                scientific_name: sci_name,
                canonical_name: canonical,
                common_name: Some(c_name.clone()),
                aliases,
                inat_taxon_id: taxon.id,
                popularity_score: popularity,
                rank: "SPECIES".into(),
                kingdom: gbif_data
                    .get("kingdom")
                    .and_then(|v| v.as_str())
                    .map(ToOwned::to_owned),
                phylum: gbif_data
                    .get("phylum")
                    .and_then(|v| v.as_str())
                    .map(ToOwned::to_owned),
                class_name,
                order_name: gbif_data
                    .get("order")
                    .and_then(|v| v.as_str())
                    .map(ToOwned::to_owned),
                family: gbif_data
                    .get("family")
                    .and_then(|v| v.as_str())
                    .map(ToOwned::to_owned),
                genus: gbif_data
                    .get("genus")
                    .and_then(|v| v.as_str())
                    .map(ToOwned::to_owned),
                habitat: None,
                diet: None,
                activity_pattern: None,
                conservation_status: None,
                continents: None,
                source: "iNaturalist".into(),
                updated_at: Utc::now().to_rfc3339(),
            };

            if upsert_species_index(&connection, &record).is_ok() {
                inserted += 1;
                if inserted.is_multiple_of(25) || inserted >= limit {
                    println!(
                        "--> Progress: indexed {}/{} high-quality species",
                        inserted, limit
                    );
                }
                if inserted >= limit {
                    break;
                }
            }
        }
        page += 1;
    }

    // Phase 2: If we still need more, query GBIF search but filter strictly for items with common names
    let mut offset = 0usize;
    while inserted < limit {
        let batch_limit = SEED_PAGE_SIZE.min(limit - inserted);
        let url = format!(
            "https://api.gbif.org/v1/species/search?kingdom=Animalia&rank=SPECIES&status=ACCEPTED&limit={batch_limit}&offset={offset}"
        );
        let response = match get_with_retry(&client, &url).await {
            Ok(r) if r.status().is_success() => r,
            _ => {
                offset += batch_limit;
                continue;
            }
        };
        let payload: GbifSearchResponse = match response.json().await {
            Ok(p) => p,
            Err(_) => {
                offset += batch_limit;
                continue;
            }
        };

        if payload.results.is_empty() {
            break;
        }

        let fetched_count = payload.results.len();

        for item in payload.results {
            let Some(taxon_key) = item.accepted_taxon_key.or(item.taxon_key) else {
                continue;
            };
            if !seen.insert(taxon_key) {
                continue;
            }

            let common_name = preferred_common_name(&item);
            // Require common name for high quality!
            if common_name.is_none() {
                continue;
            }

            if let Some(record) = gbif_item_to_record(&item, common_name) {
                if upsert_species_index(&connection, &record).is_ok() {
                    inserted += 1;
                    if inserted.is_multiple_of(25) || inserted >= limit {
                        println!(
                            "--> Progress: indexed {}/{} high-quality species",
                            inserted, limit
                        );
                    }
                    if inserted >= limit {
                        break;
                    }
                }
            }
        }

        offset += fetched_count;
    }

    println!(
        "Seeding completed! Successfully indexed {} high-quality species into {}",
        inserted,
        path.display()
    );

    // Also copy to AppData local directory if it exists so the running Tauri app sees all 1000 items!
    if let Ok(appdata) = std::env::var("LOCALAPPDATA") {
        for app_dir_name in [
            "com.biblos.app",
            "tauri-playtoys",
            "com.tauri-playtoys.dev",
            "biblos",
        ] {
            let target_dir = PathBuf::from(&appdata).join(app_dir_name);
            if target_dir.exists() {
                let target_file = target_dir.join("biblos.sqlite3");
                let _ = std::fs::copy(&path, &target_file);
                println!("Synced database to {}", target_file.display());
            }
        }
    }

    Ok(inserted)
}

fn local_fts_search(
    connection: &Connection,
    query: &str,
    limit: usize,
    offset: usize,
) -> Result<(Vec<SpeciesSearchHit>, usize)> {
    let total_count: usize = connection
        .query_row("SELECT COUNT(*) FROM species_index", [], |row| row.get(0))
        .unwrap_or(0);

    if query.trim().is_empty() {
        let mut stmt = connection.prepare(
            "
            SELECT gbif_taxon_key, scientific_name, canonical_name, common_name, aliases, inat_taxon_id, popularity_score, rank, kingdom, phylum, class_name, order_name, family, genus, habitat, diet, activity_pattern, conservation_status, continents, source, updated_at
            FROM species_index
            ORDER BY popularity_score DESC, common_name IS NULL, common_name ASC, scientific_name ASC
            LIMIT ?1 OFFSET ?2
            ",
        )?;

        let rows = stmt.query_map(params![limit as i64, offset as i64], row_to_record)?;
        let mut hits = Vec::new();
        for row in rows {
            let record = row?;
            hits.push(to_search_hit(record, 0.0, "browse".into(), false));
        }
        return Ok((hits, total_count));
    }

    let mut results = Vec::new();
    let fts = fts_query(query);
    let mut stmt = connection.prepare(
        "
        SELECT si.gbif_taxon_key, si.scientific_name, si.canonical_name, si.common_name, si.aliases, si.inat_taxon_id, si.popularity_score, si.rank, si.kingdom, si.phylum, si.class_name, si.order_name, si.family, si.genus, si.habitat, si.diet, si.activity_pattern, si.conservation_status, si.continents, si.source, si.updated_at, bm25(species_index_fts) AS rank_score
        FROM species_index_fts
        JOIN species_index si ON si.rowid = species_index_fts.rowid
        WHERE species_index_fts MATCH ?1
        LIMIT ?2
        ",
    )?;

    let rows = stmt.query_map(params![fts, (limit * 3) as i64], |row| {
        Ok((row_to_record(row)?, row.get::<_, f64>("rank_score")?))
    })?;

    for row in rows {
        let (record, rank_score) = row?;
        let (score, match_reason) = score_local_hit(&record, query, -rank_score);
        results.push(to_search_hit(record, score, match_reason, false));
    }

    if results.is_empty() {
        let mut fallback_stmt = connection.prepare(
            "
            SELECT gbif_taxon_key, scientific_name, canonical_name, common_name, aliases, inat_taxon_id, popularity_score, rank, kingdom, phylum, class_name, order_name, family, genus, habitat, diet, activity_pattern, conservation_status, continents, source, updated_at
            FROM species_index
            ",
        )?;
        let rows = fallback_stmt.query_map([], row_to_record)?;
        for row in rows {
            let record = row?;
            let similarity = best_similarity(
                &normalize(query),
                &[
                    record.common_name.as_deref().unwrap_or(""),
                    &record.scientific_name,
                    &record.canonical_name,
                    record.genus.as_deref().unwrap_or(""),
                    record.family.as_deref().unwrap_or(""),
                ],
            );
            if similarity >= 0.45 {
                results.push(to_search_hit(
                    record,
                    80.0 + similarity * 50.0,
                    "fuzzy".into(),
                    false,
                ));
            }
        }
    }

    let mut results = dedupe_search_hits(results);
    let search_total = results.len();
    if offset < results.len() {
        results = results.into_iter().skip(offset).take(limit).collect();
    } else {
        results.clear();
    }
    Ok((results, search_total))
}

pub fn search_index(
    app: Option<&AppHandle>,
    query: &str,
    limit: usize,
    offset: usize,
) -> Result<SearchResponse> {
    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let (hits, total_count) = local_fts_search(&connection, query, limit, offset)?;
    Ok(SearchResponse {
        hits,
        used_live_fallback: false,
        total_count,
    })
}

fn ingest_gbif_results(
    connection: &Connection,
    payload: GbifSearchResponse,
) -> Result<Vec<IndexRecord>> {
    let mut inserted = Vec::new();

    for item in payload.results {
        let Some(taxon_key) = item.accepted_taxon_key.or(item.taxon_key) else {
            continue;
        };
        if let Some(record) = gbif_item_to_record(&item, preferred_common_name(&item)) {
            upsert_species_index(connection, &record)?;
            inserted.push(record);
        } else {
            let _ = taxon_key;
        }
    }

    Ok(inserted)
}

pub async fn live_search_fallback(
    app: Option<&AppHandle>,
    query: &str,
    limit: usize,
) -> Result<SearchResponse> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(SearchResponse {
            hits: Vec::new(),
            used_live_fallback: false,
            total_count: 0,
        });
    }

    let local = search_index(app, trimmed, limit, 0)?;
    let strong_local = local
        .hits
        .first()
        .map(|hit| hit.score >= 180.0)
        .unwrap_or(false);
    if strong_local || !local.hits.is_empty() {
        return Ok(local);
    }

    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let client = Client::builder().user_agent("Biblos/0.7").build()?;
    let url = format!(
        "https://api.gbif.org/v1/species/search?q={}&kingdom=Animalia&status=ACCEPTED&limit={}",
        urlencoding::encode(trimmed),
        limit
    );

    let response = client.get(url).send().await?;
    if !response.status().is_success() {
        return Ok(local);
    }

    let payload: GbifSearchResponse = response.json().await?;
    let records = ingest_gbif_results(&connection, payload)?;
    let mut hits = Vec::new();
    for record in records {
        let (score, reason) = score_local_hit(&record, trimmed, 0.0);
        hits.push(to_search_hit(record, score, reason, true));
    }

    let mut hits = dedupe_search_hits(hits);
    hits.truncate(limit);

    let hits_len = hits.len();
    Ok(SearchResponse {
        hits,
        used_live_fallback: true,
        total_count: hits_len,
    })
}

pub async fn lookup_and_store_species(
    app: Option<&AppHandle>,
    query: &str,
    limit: usize,
) -> Result<SearchResponse> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(SearchResponse {
            hits: Vec::new(),
            used_live_fallback: false,
            total_count: 0,
        });
    }

    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let client = Client::builder().user_agent("Biblos/0.7").build()?;
    let url = format!(
        "https://api.gbif.org/v1/species/search?q={}&kingdom=Animalia&status=ACCEPTED&limit={}",
        urlencoding::encode(trimmed),
        limit.max(20)
    );
    let response = client.get(url).send().await?;
    if !response.status().is_success() {
        return search_index(app, trimmed, limit, 0);
    }

    let payload: GbifSearchResponse = response.json().await?;
    let records = ingest_gbif_results(&connection, payload)?;
    let mut hits = Vec::new();
    for record in records {
        let (score, reason) = score_local_hit(&record, trimmed, 0.0);
        hits.push(to_search_hit(record, score, reason, false));
    }
    let mut hits = dedupe_search_hits(hits);
    hits.truncate(limit);

    let hits_len = hits.len();
    Ok(SearchResponse {
        hits,
        used_live_fallback: false,
        total_count: hits_len,
    })
}

fn open_profile_cache(
    connection: &Connection,
    gbif_taxon_key: i64,
) -> Result<Option<SpeciesProfilePayload>> {
    let row: Option<(String, String)> = connection
        .query_row(
            "SELECT full_json, hydrated_at FROM species_profiles WHERE gbif_taxon_key = ?1",
            params![gbif_taxon_key],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;

    if let Some((full_json, _hydrated_at)) = row {
        let animal: Value = serde_json::from_str(&full_json)?;
        let id = animal
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let partial = animal
            .get("partial")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        return Ok(Some(SpeciesProfilePayload {
            id,
            gbif_taxon_key,
            animal,
            cached: true,
            partial,
        }));
    }

    Ok(None)
}

async fn fetch_json<T: for<'de> Deserialize<'de>>(client: &Client, url: &str) -> Option<T> {
    let response = client.get(url).send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    response.json::<T>().await.ok()
}

async fn fetch_wikipedia_summary(client: &Client, candidate: &str) -> Option<WikipediaSummary> {
    let title = candidate.replace(' ', "_");
    let url = format!(
        "https://en.wikipedia.org/api/rest_v1/page/summary/{}",
        urlencoding::encode(&title)
    );
    fetch_json(client, &url).await
}

async fn fetch_wikidata_search(client: &Client, candidate: &str) -> Option<WikidataSearchResponse> {
    let url = format!(
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&search={}&language=en&format=json&limit=5",
        urlencoding::encode(candidate)
    );
    fetch_json(client, &url).await
}

async fn fetch_inaturalist_taxon(
    client: &Client,
    scientific_name: &str,
    common_name: Option<&str>,
) -> Option<INaturalistTaxon> {
    for candidate in [Some(scientific_name), common_name].into_iter().flatten() {
        let url = format!(
            "https://api.inaturalist.org/v1/taxa?q={}&per_page=5",
            urlencoding::encode(candidate)
        );
        let response: INaturalistSearchResponse = fetch_json(client, &url).await?;
        if let Some(exact) = response
            .results
            .iter()
            .find(|item| item.name.as_deref().map(normalize) == Some(normalize(scientific_name)))
        {
            return Some(exact.clone());
        }
        if let Some(first) = response.results.into_iter().next() {
            return Some(first);
        }
    }
    None
}

fn infer_conservation_status(raw: &[String], gbif: &GbifSpeciesDetails) -> &'static str {
    let joined = normalize(&raw.join(" "));
    if joined.contains("critically endangered") {
        "Critically Endangered"
    } else if joined.contains("endangered") {
        "Endangered"
    } else if joined.contains("vulnerable") {
        "Vulnerable"
    } else if joined.contains("near threatened") {
        "Near Threatened"
    } else if gbif.extinct.unwrap_or(false) {
        "Extinct"
    } else {
        "Unknown"
    }
}

fn infer_diet(text: &str) -> &'static str {
    let value = normalize(text);
    // Check specific diet categories before the broad herbivore/omnivore/carnivore
    // buckets — e.g. "frugivore" and "resident frugivore" never contain "herbiv".
    if value.contains("frugivor") {
        "Frugivore"
    } else if value.contains("piscivor") {
        "Piscivore"
    } else if value.contains("insectivor") {
        "Insectivore"
    } else if value.contains("filter feed")
        || value.contains("filter-feed")
        || value.contains("planktivor")
    {
        "Filter Feeder"
    } else if value.contains("detritivor") || value.contains("scaveng") {
        "Detritivore"
    } else if value.contains("herbiv")
        || value.contains("folivor")
        || value.contains("granivor")
        || value.contains("nectarivor")
    {
        "Herbivore"
    } else if value.contains("omniv") {
        "Omnivore"
    } else if value.contains("carniv")
        || value.contains("predator")
        || value.contains("prey on")
        || value.contains("preys on")
    {
        "Carnivore"
    } else {
        "Unknown"
    }
}

fn infer_activity(text: &str) -> &'static str {
    let value = normalize(text);
    if value.contains("nocturn") {
        "Nocturnal"
    } else if value.contains("crepus")
        || value.contains("dawn and dusk")
        || value.contains("dusk and dawn")
    {
        "Crepuscular"
    } else if value.contains("cathemer") {
        "Cathemeral"
    } else if value.contains("diurn")
        || value.contains("active during the day")
        || value.contains("active by day")
    {
        "Diurnal"
    } else {
        "Unknown"
    }
}

fn infer_habitat(parts: &[String], gbif: &GbifSpeciesDetails) -> Vec<String> {
    let mut habitats = Vec::new();
    if let Some(habitat) = &gbif.habitat {
        habitats.push(habitat.clone());
    }
    for keyword in [
        "forest",
        "grassland",
        "savannah",
        "wetland",
        "ocean",
        "coast",
        "mountain",
        "desert",
        "tundra",
        "rainforest",
        "mangrove",
        "urban",
        "reef",
        "river",
        "lake",
        "cave",
    ] {
        if parts.iter().any(|part| normalize(part).contains(keyword)) {
            habitats.push(keyword.to_string());
        }
    }
    habitats.sort();
    habitats.dedup();
    if habitats.is_empty() {
        habitats.push("Unknown".into());
    }
    habitats
}

/// Coarse keyword-based continent/region inference from raw reference text
/// (Wikipedia extract, Wikidata description, GBIF habitat/threat fields).
/// Used only when the Groq normalization pass is unavailable or fails — a
/// best-effort fallback, not authoritative range data.
fn infer_continents(parts: &[String]) -> Vec<String> {
    let joined = normalize(&parts.join(" "));
    let checks: &[(&str, &str)] = &[
        ("north america", "North America"),
        ("south america", "South America"),
        ("central america", "South America"),
        ("africa", "Africa"),
        ("madagascar", "Africa"),
        ("sahara", "Africa"),
        ("sub-saharan", "Africa"),
        ("europe", "Europe"),
        ("scandinavia", "Europe"),
        ("mediterranean", "Europe"),
        ("united kingdom", "Europe"),
        ("britain", "Europe"),
        ("asia", "Asia"),
        ("himalaya", "Asia"),
        ("siberia", "Asia"),
        ("southeast asia", "Asia"),
        ("indian subcontinent", "Asia"),
        ("china", "Asia"),
        ("india", "Asia"),
        ("japan", "Asia"),
        ("australia", "Australia"),
        ("oceania", "Australia"),
        ("new guinea", "Australia"),
        ("new zealand", "Australia"),
        ("antarctica", "Antarctica"),
        ("antarctic", "Antarctica"),
        ("pacific ocean", "Oceans"),
        ("atlantic ocean", "Oceans"),
        ("indian ocean", "Oceans"),
        ("arctic ocean", "Oceans"),
        ("indo-pacific", "Oceans"),
        ("pelagic", "Oceans"),
        ("amazon", "South America"),
        ("brazil", "South America"),
        ("andes", "South America"),
    ];

    let mut found: Vec<String> = checks
        .iter()
        .filter(|(needle, _)| joined.contains(needle))
        .map(|(_, continent)| continent.to_string())
        .collect();
    found.sort();
    found.dedup();
    if found.is_empty() {
        found.push("Unknown".into());
    }
    found
}

async fn groq_enrich(raw: &Value, api_key_override: Option<&str>, model: Option<&str>) -> Option<Value> {
    dotenvy::dotenv().ok();
    // Settings-configured key (from the frontend) takes priority; .env is only
    // the fallback for users who never opened Settings.
    let api_key = api_key_override
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .or_else(|| env::var("GROQ_API_KEY").ok())?;
    if api_key.trim().is_empty() {
        return None;
    }

    let client = Client::builder().user_agent("Biblos/0.7").build().ok()?;
    // Mirrors the schema used by the manual "Enrich with AI" action (aiSpeciesService.ts)
    // so the automatic, on-open hydration reaches the same completeness — including the
    // numeric fields (lifespan/size/weight) the raw APIs rarely provide directly.
    let prompt = format!(
        "You are a world-class zoologist normalizing animal encyclopedia data. Ground short_description, \
        detailed_description, habitat, cool_facts, and conservation_status in the raw reference facts provided. \
        For diet, activity_pattern, continents, and the numeric fields, use the raw facts when present, otherwise \
        estimate from known family/order biology — never output 'Unknown' or null for a field unless truly nothing \
        can be reasonably inferred. Return ONLY a raw JSON object with exactly these keys: \
        short_description (1 sentence), detailed_description (3-5 sentences), \
        habitat (array of 2-3 specific habitat types), \
        diet (one of: Herbivore, Carnivore, Omnivore, Insectivore, Piscivore, Frugivore, Filter Feeder, Detritivore, Scavenger), \
        activity_pattern (one of: Diurnal, Nocturnal, Crepuscular, Cathemeral), \
        conservation_status (one of: Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, Extinct, Data Deficient), \
        continents (array of continents/oceans where found), \
        cool_facts (array of 3-5 specific facts), \
        average_lifespan_years (number, estimate from family/order averages if exact data is unavailable), \
        length_cm (number or null), height_cm (number or null), wingspan_cm (number or null, birds/bats/insects only), \
        weight_kg (number, estimate from family/order averages if exact data is unavailable). \
        Raw reference data: {}",
        raw
    );

    let body = json!({
        "model": model.filter(|value| !value.trim().is_empty()).unwrap_or("llama-3.3-70b-versatile"),
        "temperature": 0.2,
        "response_format": { "type": "json_object" },
        "messages": [
            {"role": "system", "content": "Return only a single valid JSON object matching the requested schema. No markdown, no commentary, no code fences."},
            {"role": "user", "content": prompt}
        ]
    });

    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }
    let payload: GroqChatResponse = response.json().await.ok()?;
    let content = payload.choices.first()?.message.content.as_ref()?;
    serde_json::from_str(content).ok()
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .map(ToOwned::to_owned)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

async fn hydrate_species_record(
    record: &IndexRecord,
    groq_api_key: Option<&str>,
    groq_model: Option<&str>,
) -> Result<Value> {
    let client = Client::builder().user_agent("Biblos/0.7").build()?;
    let gbif_details: GbifSpeciesDetails = fetch_json(
        &client,
        &format!("https://api.gbif.org/v1/species/{}", record.gbif_taxon_key),
    )
    .await
    .ok_or_else(|| anyhow!("GBIF details not found"))?;

    // Wikipedia's summary endpoint expects a page title and usually rejects
    // GBIF names containing authorship (for example, "Osborn, 1905").
    let wiki_summary =
        if let Some(summary) = fetch_wikipedia_summary(&client, &record.canonical_name).await {
            Some(summary)
        } else if let Some(common_name) = record.common_name.as_deref() {
            fetch_wikipedia_summary(&client, common_name).await
        } else {
            None
        };

    let wikidata =
        if let Some(summary) = fetch_wikidata_search(&client, &record.canonical_name).await {
            Some(summary)
        } else if let Some(common_name) = record.common_name.as_deref() {
            fetch_wikidata_search(&client, common_name).await
        } else {
            None
        };

    let inat = fetch_inaturalist_taxon(
        &client,
        &record.canonical_name,
        record.common_name.as_deref(),
    )
    .await;

    let hero_image = wiki_summary
        .as_ref()
        .and_then(|summary| {
            summary
                .originalimage
                .as_ref()
                .and_then(|image| image.source.clone())
        })
        .or_else(|| {
            wiki_summary.as_ref().and_then(|summary| {
                summary
                    .thumbnail
                    .as_ref()
                    .and_then(|image| image.source.clone())
            })
        })
        .or_else(|| {
            inat.as_ref().and_then(|taxon| {
                taxon.default_photo.as_ref().and_then(|photo| {
                    photo
                        .large_url
                        .clone()
                        .or(photo.original_url.clone())
                        .or(photo.medium_url.clone())
                })
            })
        });

    let sources = vec![
        Some("https://www.gbif.org/".to_string()),
        wiki_summary
            .as_ref()
            .and_then(|summary| summary.content_urls.as_ref())
            .and_then(|urls| urls.desktop.as_ref())
            .and_then(|desktop| desktop.page.clone()),
        Some("https://www.wikidata.org/".to_string()),
        inat.as_ref().and_then(|taxon| {
            taxon
                .id
                .map(|id| format!("https://www.inaturalist.org/taxa/{id}"))
        }),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>();

    let raw_text_parts = vec![
        wiki_summary
            .as_ref()
            .and_then(|summary| summary.extract.clone()),
        wikidata
            .as_ref()
            .and_then(|payload| payload.search.first())
            .and_then(|item| item.description.clone()),
        gbif_details.habitat.clone(),
        gbif_details.threat.clone(),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>();

    let raw_payload = json!({
        "gbif": gbif_details,
        "wikipedia": wiki_summary,
        "wikidata": wikidata,
        "inat": inat,
        "source_urls": sources,
    });

    let ai = groq_enrich(&raw_payload, groq_api_key, groq_model).await;
    let summary_text = ai
        .as_ref()
        .and_then(|value| value.get("short_description"))
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .or_else(|| {
            wiki_summary
                .as_ref()
                .and_then(|summary| summary.extract.clone())
        })
        .unwrap_or_else(|| {
            format!(
                "{} profile is still being hydrated from open biodiversity sources.",
                record.canonical_name
            )
        });

    let detail_text = ai
        .as_ref()
        .and_then(|value| value.get("detailed_description"))
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .or_else(|| {
            wiki_summary
                .as_ref()
                .and_then(|summary| summary.extract.clone())
        })
        .unwrap_or_else(|| summary_text.clone());

    let habitats = {
        let from_ai = string_array(ai.as_ref().and_then(|value| value.get("habitat")));
        if from_ai.is_empty() {
            infer_habitat(&raw_text_parts, &gbif_details)
        } else {
            from_ai
        }
    };

    let diet = ai
        .as_ref()
        .and_then(|value| value.get("diet"))
        .and_then(Value::as_str)
        .unwrap_or_else(|| infer_diet(&raw_text_parts.join(" ")))
        .to_string();
    let activity = ai
        .as_ref()
        .and_then(|value| value.get("activity_pattern"))
        .and_then(Value::as_str)
        .unwrap_or_else(|| infer_activity(&raw_text_parts.join(" ")))
        .to_string();
    let conservation_status = ai
        .as_ref()
        .and_then(|value| value.get("conservation_status"))
        .and_then(Value::as_str)
        .unwrap_or_else(|| infer_conservation_status(&raw_text_parts, &gbif_details))
        .to_string();

    let cool_facts = {
        let from_ai = string_array(ai.as_ref().and_then(|value| value.get("cool_facts")));
        if from_ai.is_empty() {
            raw_text_parts.iter().take(3).cloned().collect::<Vec<_>>()
        } else {
            from_ai
        }
    };

    let continents = {
        let from_ai = string_array(ai.as_ref().and_then(|value| value.get("continents")));
        if from_ai.is_empty() {
            infer_continents(&raw_text_parts)
        } else {
            from_ai
        }
    };

    // Rarely present in GBIF/Wikipedia/iNat raw data — only the AI pass can
    // reasonably fill these, so they stay null when no key is configured.
    let average_lifespan_years = ai
        .as_ref()
        .and_then(|value| value.get("average_lifespan_years"))
        .and_then(Value::as_f64);
    let length_cm = ai
        .as_ref()
        .and_then(|value| value.get("length_cm"))
        .and_then(Value::as_f64);
    let height_cm = ai
        .as_ref()
        .and_then(|value| value.get("height_cm"))
        .and_then(Value::as_f64);
    let wingspan_cm = ai
        .as_ref()
        .and_then(|value| value.get("wingspan_cm"))
        .and_then(Value::as_f64);
    let weight_kg = ai
        .as_ref()
        .and_then(|value| value.get("weight_kg"))
        .and_then(Value::as_f64);

    Ok(json!({
        "id": make_species_id(record.gbif_taxon_key),
        "gbifTaxonKey": record.gbif_taxon_key,
        "commonName": record.common_name.clone().unwrap_or_else(|| record.canonical_name.clone()),
        "scientificName": record.scientific_name,
        "averageLifespanYears": average_lifespan_years,
        "shortDescription": summary_text,
        "detailedDescription": detail_text,
        "coolFacts": cool_facts,
        "classification": {
            "kingdom": gbif_details.kingdom.or(record.kingdom.clone()).unwrap_or_else(|| "Animalia".into()),
            "phylum": gbif_details.phylum.or(record.phylum.clone()).unwrap_or_else(|| "Unknown".into()),
            "className": gbif_details.class_name.or(record.class_name.clone()).unwrap_or_else(|| "Unknown".into()),
            "order": gbif_details.order.or(record.order_name.clone()).unwrap_or_else(|| "Unknown".into()),
            "family": gbif_details.family.or(record.family.clone()).unwrap_or_else(|| "Unknown".into()),
            "genus": gbif_details.genus.or(record.genus.clone()).unwrap_or_else(|| "Unknown".into()),
            "species": gbif_details.species.unwrap_or_else(|| record.canonical_name.clone())
        },
        "habitat": habitats,
        "diet": diet,
        "activityPattern": activity,
        "continents": continents,
        "conservationStatus": conservation_status,
        "size": {
            "lengthCm": length_cm,
            "heightCm": height_cm,
            "wingspanCm": wingspan_cm
        },
        "weightKg": weight_kg,
        "images": hero_image.clone().map(|value| vec![value]).unwrap_or_default(),
        "heroImage": hero_image,
        "has3DModel": false,
        "sourceUrls": sources,
        "lastFetchedAt": Utc::now().to_rfc3339(),
        "partial": false
    }))
}

fn save_profile(connection: &Connection, gbif_taxon_key: i64, animal: &Value) -> Result<()> {
    connection.execute(
        "
        INSERT INTO species_profiles (gbif_taxon_key, full_json, hydrated_at)
        VALUES (?1, ?2, ?3)
        ON CONFLICT(gbif_taxon_key) DO UPDATE SET
          full_json = excluded.full_json,
          hydrated_at = excluded.hydrated_at
        ",
        params![
            gbif_taxon_key,
            serde_json::to_string(animal)?,
            Utc::now().to_rfc3339()
        ],
    )?;
    Ok(())
}

fn get_index_record(connection: &Connection, gbif_taxon_key: i64) -> Result<Option<IndexRecord>> {
    connection
        .query_row(
            "
            SELECT gbif_taxon_key, scientific_name, canonical_name, common_name, aliases, inat_taxon_id, popularity_score, rank, kingdom, phylum, class_name, order_name, family, genus, habitat, diet, activity_pattern, conservation_status, continents, source, updated_at
            FROM species_index
            WHERE gbif_taxon_key = ?1
            ",
            params![gbif_taxon_key],
            row_to_record,
        )
        .optional()
        .map_err(Into::into)
}

pub async fn get_or_hydrate_profile(
    app: Option<&AppHandle>,
    id: &str,
    force_refresh: bool,
    groq_api_key: Option<&str>,
    groq_model: Option<&str>,
) -> Result<SpeciesProfilePayload> {
    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let gbif_taxon_key: i64 = id
        .trim_start_matches("gbif-")
        .parse()
        .with_context(|| format!("invalid species id '{id}'"))?;

    if !force_refresh {
        if let Some(cached) = open_profile_cache(&connection, gbif_taxon_key)? {
            return Ok(cached);
        }
    }

    let record = get_index_record(&connection, gbif_taxon_key)?
        .ok_or_else(|| anyhow!("species index entry {gbif_taxon_key} not found"))?;

    let animal = match hydrate_species_record(&record, groq_api_key, groq_model).await {
        Ok(animal) => animal,
        Err(_) => json!({
            "id": make_species_id(record.gbif_taxon_key),
            "gbifTaxonKey": record.gbif_taxon_key,
            "commonName": record.common_name.clone().unwrap_or_else(|| record.canonical_name.clone()),
            "scientificName": record.scientific_name,
            "averageLifespanYears": Value::Null,
            "shortDescription": "This species record is not fully hydrated yet.",
            "detailedDescription": "Biblos found the indexed species name locally, but upstream profile sources did not return a complete record yet.",
            "coolFacts": [],
            "classification": {
                "kingdom": record.kingdom.clone().unwrap_or_else(|| "Animalia".into()),
                "phylum": record.phylum.clone().unwrap_or_else(|| "Unknown".into()),
                "className": record.class_name.clone().unwrap_or_else(|| "Unknown".into()),
                "order": record.order_name.clone().unwrap_or_else(|| "Unknown".into()),
                "family": record.family.clone().unwrap_or_else(|| "Unknown".into()),
                "genus": record.genus.clone().unwrap_or_else(|| "Unknown".into()),
                "species": record.canonical_name.clone()
            },
            "habitat": ["Unknown"],
            "diet": "Unknown",
            "activityPattern": "Unknown",
            "continents": ["Unknown"],
            "conservationStatus": "Unknown",
            "size": {
                "lengthCm": Value::Null,
                "heightCm": Value::Null,
                "wingspanCm": Value::Null
            },
            "weightKg": Value::Null,
            "images": [],
            "has3DModel": false,
            "sourceUrls": ["https://www.gbif.org/"],
            "lastFetchedAt": Utc::now().to_rfc3339(),
            "partial": true
        }),
    };

    save_profile(&connection, gbif_taxon_key, &animal)?;

    Ok(SpeciesProfilePayload {
        id: make_species_id(gbif_taxon_key),
        gbif_taxon_key,
        animal: animal.clone(),
        cached: false,
        partial: animal
            .get("partial")
            .and_then(Value::as_bool)
            .unwrap_or(false),
    })
}

pub fn list_profiles_by_ids(app: Option<&AppHandle>, ids: &[String]) -> Result<Vec<Value>> {
    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let mut animals = Vec::new();
    for id in ids {
        let gbif_taxon_key: i64 = match id.trim_start_matches("gbif-").parse() {
            Ok(value) => value,
            Err(_) => continue,
        };
        if let Some(cached) = open_profile_cache(&connection, gbif_taxon_key)? {
            animals.push(cached.animal);
        }
    }
    Ok(animals)
}

// ── iNaturalist autocomplete ──────────────────────────────────────────────────

/// Queries the iNaturalist taxa autocomplete API, canonicalises each result
/// through the GBIF match endpoint (strict: rejects matchType=NONE), upserts
/// the resolved records into the local species index, and returns ranked hits.
///
/// This is the authoritative-first path: iNat provides common-name richness
/// and popularity signals, GBIF provides canonical taxonomy.
pub async fn search_inat_autocomplete(
    app: Option<&AppHandle>,
    query: &str,
    limit: usize,
) -> Result<InatAutocompleteResponse> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(InatAutocompleteResponse { hits: vec![] });
    }

    let path = initialize_database(app)?;
    let connection = open_connection(&path)?;
    let client = Client::builder()
        .user_agent("Biblos/0.7 (contact@biblos.app)")
        .build()?;

    // 1. Query iNaturalist autocomplete — ordered by observations_count descending
    let inat_url = format!(
        "https://api.inaturalist.org/v1/taxa?q={}&taxon_id=1&per_page={}&order_by=observations_count&rank=species,subspecies",
        urlencoding::encode(trimmed),
        limit.min(30)
    );

    let inat_resp = match get_with_retry(&client, &inat_url).await {
        Ok(r) if r.status().is_success() => r,
        _ => return Ok(InatAutocompleteResponse { hits: vec![] }),
    };

    let inat_data: INaturalistSearchResponse = match inat_resp.json().await {
        Ok(d) => d,
        Err(_) => return Ok(InatAutocompleteResponse { hits: vec![] }),
    };

    // Normalise observations count for popularity score
    let max_obs = inat_data
        .results
        .iter()
        .filter_map(|t| t.observations_count)
        .max()
        .unwrap_or(1)
        .max(1) as f64;

    // 2. For each iNat taxon, canonicalise via GBIF match (reject NONE matches)
    let mut hits: Vec<SpeciesSearchHit> = vec![];

    for (rank_idx, taxon) in inat_data.results.into_iter().take(limit).enumerate() {
        let scientific_name = match taxon.name.as_deref() {
            Some(s) if !s.is_empty() => s.to_owned(),
            _ => continue,
        };
        let common_name = taxon.preferred_common_name.clone();
        let inat_id = taxon.id;
        let obs_count = taxon.observations_count.unwrap_or(0);
        let popularity = (obs_count as f64 / max_obs).clamp(0.0, 1.0);

        // GBIF strict match
        let gbif_url = format!(
            "https://api.gbif.org/v1/species/match?name={}&kingdom=Animalia",
            urlencoding::encode(&scientific_name)
        );
        let gbif_resp = match get_with_retry(&client, &gbif_url).await {
            Ok(r) if r.status().is_success() => r,
            _ => continue,
        };
        let gbif_data: serde_json::Value = match gbif_resp.json().await {
            Ok(d) => d,
            Err(_) => continue,
        };

        // Reject unresolved matches
        let match_type = gbif_data
            .get("matchType")
            .and_then(|v| v.as_str())
            .unwrap_or("NONE");
        if match_type == "NONE" {
            continue;
        }

        let gbif_kingdom = gbif_data
            .get("kingdom")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();
        if !gbif_kingdom.is_empty() && gbif_kingdom != "animalia" {
            continue;
        }

        let gbif_taxon_key = match gbif_data.get("usageKey").and_then(|v| v.as_i64()) {
            Some(k) if k > 0 => k,
            _ => continue,
        };

        let canonical = gbif_data
            .get("canonicalName")
            .and_then(|v| v.as_str())
            .unwrap_or(&scientific_name)
            .to_owned();
        let sci_name = gbif_data
            .get("scientificName")
            .and_then(|v| v.as_str())
            .unwrap_or(&scientific_name)
            .to_owned();

        // Build aliases: include iNat common name if different from GBIF vernacular
        let mut aliases: Vec<String> = vec![];
        if let Some(ref cn) = common_name {
            aliases.push(cn.clone());
        }
        if let Some(icon) = &taxon.iconic_taxon_name {
            if !icon.is_empty() {
                aliases.push(icon.clone());
            }
        }
        aliases.dedup();

        let record = IndexRecord {
            gbif_taxon_key,
            scientific_name: sci_name.clone(),
            canonical_name: canonical.clone(),
            common_name: common_name.clone(),
            aliases: aliases.clone(),
            inat_taxon_id: inat_id,
            popularity_score: popularity,
            rank: "SPECIES".into(),
            kingdom: gbif_data
                .get("kingdom")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            phylum: gbif_data
                .get("phylum")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            class_name: gbif_data
                .get("class")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            order_name: gbif_data
                .get("order")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            family: gbif_data
                .get("family")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            genus: gbif_data
                .get("genus")
                .and_then(|v| v.as_str())
                .map(ToOwned::to_owned),
            habitat: None,
            diet: None,
            activity_pattern: None,
            conservation_status: None,
            continents: None,
            source: "iNaturalist".into(),
            updated_at: Utc::now().to_rfc3339(),
        };

        let _ = upsert_species_index(&connection, &record);

        let (score, match_reason) = score_local_hit(&record, trimmed, (limit - rank_idx) as f64);
        // Boost by popularity (up to +30 points) — only breaks ties, never outranks exact match
        let final_score = score + popularity * 30.0;

        hits.push(SpeciesSearchHit {
            id: make_species_id(gbif_taxon_key),
            gbif_taxon_key,
            scientific_name: sci_name,
            canonical_name: canonical,
            common_name: common_name.clone(),
            aliases,
            inat_taxon_id: inat_id,
            popularity_score: popularity,
            rank: "SPECIES".into(),
            kingdom: record.kingdom,
            phylum: record.phylum,
            class_name: record.class_name,
            order_name: record.order_name,
            family: record.family,
            genus: record.genus,
            habitat: record.habitat,
            diet: record.diet,
            activity_pattern: record.activity_pattern,
            conservation_status: record.conservation_status,
            continents: record.continents,
            source: "iNaturalist".into(),
            updated_at: record.updated_at,
            score: final_score,
            match_reason,
            is_live_fallback: true,
        });
    }

    // Apply lexical deduplication (same species key)
    let hits = dedupe_search_hits(hits);
    Ok(InatAutocompleteResponse { hits })
}

// ── Natural-language query parser (Groq JSON-schema mode) ────────────────────

/// Parses a natural-language query (e.g. "small nocturnal desert animal") into
/// structured filter fields using Groq's JSON-schema structured output mode.
///
/// IMPORTANT: This function **never** invents or suggests species names.
/// Its sole purpose is to convert user intent into filter constraints that the
/// authoritative search pipeline (FTS5 + GBIF + iNat) can apply.
///
/// Returns `StructuredFilters::default()` (all None) on error or for short queries.
pub async fn parse_query_to_filters(
    query: &str,
    groq_api_key: Option<String>,
    model: Option<String>,
) -> Result<StructuredFilters> {
    let trimmed = query.trim();
    // Only activate for phrases that look like natural language (>= 3 words, no binomial)
    let word_count = trimmed.split_whitespace().count();
    let looks_binomial = trimmed.contains(' ')
        && trimmed
            .chars()
            .next()
            .map(|c| c.is_uppercase())
            .unwrap_or(false);
    if word_count < 3 || looks_binomial {
        return Ok(StructuredFilters {
            text_remainder: Some(trimmed.to_owned()),
            ..Default::default()
        });
    }

    dotenvy::dotenv().ok();
    let api_key = groq_api_key
        .filter(|k| !k.trim().is_empty())
        .or_else(|| std::env::var("GROQ_API_KEY").ok())
        .filter(|k| !k.trim().is_empty());

    let Some(api_key) = api_key else {
        return Ok(StructuredFilters {
            text_remainder: Some(trimmed.to_owned()),
            ..Default::default()
        });
    };

    let selected_model = model
        .filter(|m| !m.trim().is_empty())
        .unwrap_or_else(|| "llama-3.3-70b-versatile".to_owned());

    let system_prompt = "You are a taxonomy filter parser. Your ONLY job is to extract filter constraints from the user query. \
        You MUST NOT suggest, invent, or name any species. Return ONLY a JSON object with these optional string keys: \
        habitat (e.g. 'Desert', 'Ocean'), diet (one of: Carnivore, Herbivore, Omnivore, Detritivore, Filter Feeder, Scavenger, Planktivore), \
        activityPattern (one of: Diurnal, Nocturnal, Crepuscular, Cathemeral), \
        conservationStatus (one of: Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, Extinct), \
        continent (e.g. 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Australia', 'Antarctica', 'Oceans'), \
        className (e.g. 'Mammalia', 'Aves', 'Reptilia'), \
        text_remainder (any part of the query not mapped to a filter). Omit keys you are not confident about.";

    let body = json!({
        "model": selected_model,
        "temperature": 0.0,
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": format!("Parse this query into filters: \"{}\"", trimmed) }
        ]
    });

    let client = Client::builder().user_agent("Biblos/0.7").build()?;
    let resp = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| anyhow!("Groq request failed: {e}"))?;

    if !resp.status().is_success() {
        return Ok(StructuredFilters {
            text_remainder: Some(trimmed.to_owned()),
            ..Default::default()
        });
    }

    let payload: GroqChatResponse = resp
        .json()
        .await
        .map_err(|e| anyhow!("Groq parse error: {e}"))?;
    let content = payload
        .choices
        .into_iter()
        .next()
        .and_then(|c| c.message.content)
        .unwrap_or_default();

    let data: serde_json::Value = serde_json::from_str(&content).unwrap_or_default();

    fn opt_str(v: &serde_json::Value, key: &str) -> Option<String> {
        v.get(key)
            .and_then(|x| x.as_str())
            .filter(|s| !s.is_empty())
            .map(ToOwned::to_owned)
    }

    Ok(StructuredFilters {
        habitat: opt_str(&data, "habitat"),
        diet: opt_str(&data, "diet"),
        activity_pattern: opt_str(&data, "activityPattern"),
        conservation_status: opt_str(&data, "conservationStatus"),
        continent: opt_str(&data, "continent"),
        class_name: opt_str(&data, "className"),
        text_remainder: opt_str(&data, "text_remainder").or_else(|| Some(trimmed.to_owned())),
    })
}
