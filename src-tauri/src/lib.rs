mod species_store;

use species_store::{SearchResponse, SpeciesProfilePayload};

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
) -> Result<SearchResponse, String> {
    species_store::search_index(Some(&app), &query, limit.unwrap_or(24)).map_err(|error| error.to_string())
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
async fn get_cached_species_profiles(app: tauri::AppHandle, ids: Vec<String>) -> Result<Vec<serde_json::Value>, String> {
    species_store::list_profiles_by_ids(Some(&app), &ids).map_err(|error| error.to_string())
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
            hydrate_species_profile,
            get_cached_species_profiles
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
