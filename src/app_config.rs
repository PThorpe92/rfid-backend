use std::{env::var, time::Duration};

use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
#[derive(Clone)]
pub struct DB(pub DatabaseConnection);

impl DB {
    pub async fn get() -> Result<Self, Box<dyn std::error::Error>> {
        dotenvy::dotenv().expect("failed to read .env file");
        let db_path = var("DATABASE_URL").unwrap();
        log::info!("Connecting to database: {}", db_path);
        let mut opt = ConnectOptions::new(db_path);
        opt.max_connections(100)
            .min_connections(5)
            .connect_timeout(Duration::from_secs(8))
            .idle_timeout(Duration::from_secs(8))
            .max_lifetime(Duration::from_secs(8))
            .sqlx_logging(true);

        let db = Database::connect(opt).await?;
        Migrator::up(&db, None).await?;
        Ok(DB(db.clone()))
    }
}
