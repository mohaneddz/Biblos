#[path = "../species_store.rs"]
#[allow(dead_code)]
mod species_store;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let limit = std::env::args()
        .skip(1)
        .find_map(|value| value.parse::<usize>().ok())
        .unwrap_or(10_000);

    let db_path = species_store::initialize_database(None)?;
    let inserted = species_store::seed_index(None, limit).await?;
    println!("Seeded {inserted} species into {}", db_path.display());
    Ok(())
}
