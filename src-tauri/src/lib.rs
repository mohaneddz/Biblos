mod species_store;

use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use species_store::{
    InatAutocompleteResponse, SearchResponse, SpeciesProfilePayload, StructuredFilters,
};

#[derive(Debug, Clone, Deserialize)]
struct AiNaturalistMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct GroqChatResponse {
    choices: Vec<GroqChoice>,
}

#[derive(Debug, Deserialize)]
struct GroqChoice {
    message: GroqMessage,
}

#[derive(Debug, Deserialize)]
struct GroqMessage {
    content: Option<String>,
}

#[tauri::command]
async fn initialize_species_store(app: tauri::AppHandle) -> Result<String, String> {
    species_store::initialize_database(Some(&app))
        .map(|path| path.display().to_string())
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn seed_species_store(app: tauri::AppHandle, limit: Option<usize>) -> Result<usize, String> {
    species_store::seed_index(Some(&app), limit.unwrap_or(10_000))
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn search_species_local(
    app: tauri::AppHandle,
    query: String,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<SearchResponse, String> {
    species_store::search_index(Some(&app), &query, limit.unwrap_or(36), offset.unwrap_or(0))
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn search_species_live_fallback(
    app: tauri::AppHandle,
    query: String,
    limit: Option<usize>,
) -> Result<SearchResponse, String> {
    species_store::live_search_fallback(Some(&app), &query, limit.unwrap_or(12))
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn lookup_species_and_store(
    app: tauri::AppHandle,
    query: String,
    limit: Option<usize>,
) -> Result<SearchResponse, String> {
    species_store::lookup_and_store_species(Some(&app), &query, limit.unwrap_or(50))
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn hydrate_species_profile(
    app: tauri::AppHandle,
    id: String,
    force_refresh: Option<bool>,
) -> Result<SpeciesProfilePayload, String> {
    species_store::get_or_hydrate_profile(Some(&app), &id, force_refresh.unwrap_or(false))
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn get_cached_species_profiles(
    app: tauri::AppHandle,
    ids: Vec<String>,
) -> Result<Vec<serde_json::Value>, String> {
    species_store::list_profiles_by_ids(Some(&app), &ids).map_err(|error| error.to_string())
}

#[tauri::command]
async fn search_inat_autocomplete(
    app: tauri::AppHandle,
    query: String,
    limit: Option<usize>,
) -> Result<InatAutocompleteResponse, String> {
    species_store::search_inat_autocomplete(Some(&app), &query, limit.unwrap_or(20))
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn parse_query_to_filters(
    query: String,
    groq_api_key: Option<String>,
    model: Option<String>,
) -> Result<StructuredFilters, String> {
    species_store::parse_query_to_filters(&query, groq_api_key, model)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn ask_ai_naturalist(
    question: String,
    history: Vec<AiNaturalistMessage>,
    context: String,
    groq_api_key: Option<String>,
    model: Option<String>,
) -> Result<String, String> {
    dotenvy::dotenv().ok();
    let api_key = groq_api_key
        .filter(|value| !value.trim().is_empty())
        .or_else(|| std::env::var("GROQ_API_KEY").ok())
        .ok_or_else(|| "No Groq API key is configured. Add one in Settings or .env.".to_string())?;

    let mut messages = vec![json!({
        "role": "system",
        "content": "You are Biblos AI Naturalist — a beautifully written, visually rich natural history assistant. FORMATTING RULES (follow strictly every response):\n- Use Markdown heavily: # headings for major topics, ## for sub-topics, **bold** for species names/key terms, *italic* for scientific names and emphasis, and `code` for taxonomic ranks or measurements.\n- Use bullet lists (- item) or numbered lists for any enumeration of 3+ items.\n- Use **horizontal rules** (---) to visually separate species sections when comparing multiple animals.\n- When comparing multiple species, give EACH species its own ## heading section.\n- Responses should feel like a beautifully formatted field guide entry — narrative, engaging, and information-dense. Avoid flat paragraph-only answers.\n\nKNOWLEDGE RULES:\n- Use the supplied retrieval context first. Fill gaps with careful general knowledge, clearly labelling anything inferred.\n- Ground taxonomy, biome fit, comparisons, and conservation answers in the provided records, then bridge gaps with best-effort reasoning."
    })];

    if !context.trim().is_empty() {
        messages.push(json!({
            "role": "system",
            "content": format!("Retrieved Biblos context:\n{}", context)
        }));
    }

    for entry in history
        .into_iter()
        .rev()
        .take(6)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
    {
        messages.push(json!({
            "role": entry.role,
            "content": entry.content,
        }));
    }

    messages.push(json!({
        "role": "user",
        "content": question,
    }));

    let response = Client::builder()
        .user_agent("Biblos/0.1")
        .build()
        .map_err(|error| error.to_string())?
        .post("https://api.groq.com/openai/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": model.unwrap_or_else(|| "llama-3.3-70b-versatile".to_string()),
            "temperature": 0.2,
            "messages": messages,
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error body".to_string());
        return Err(format!(
            "Groq request failed with status {}: {}",
            status, err_body
        ));
    }

    let payload: GroqChatResponse = response.json().await.map_err(|error| error.to_string())?;
    payload
        .choices
        .first()
        .and_then(|choice| choice.message.content.clone())
        .ok_or_else(|| "Groq returned an empty response.".to_string())
}

#[tauri::command]
async fn fetch_image_base64(url: String) -> Result<String, String> {
    use base64::Engine;
    let client = Client::builder()
        .user_agent("Biblos/0.1 (Desktop)")
        .build()
        .map_err(|error| error.to_string())?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let content_type = resp
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|val| val.to_str().ok())
        .unwrap_or("image/jpeg")
        .to_string();

    let bytes = resp.bytes().await.map_err(|error| error.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", content_type, b64))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            initialize_species_store,
            seed_species_store,
            search_species_local,
            search_species_live_fallback,
            lookup_species_and_store,
            hydrate_species_profile,
            get_cached_species_profiles,
            search_inat_autocomplete,
            parse_query_to_filters,
            ask_ai_naturalist,
            fetch_image_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
