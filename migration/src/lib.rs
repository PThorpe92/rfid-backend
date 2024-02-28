pub use sea_orm_migration::prelude::*;

mod m20220101_000001_locations;
mod m20231210_134627_residents;
mod m20231210_134639_timestamps;
mod m20231210_150005_levels;
mod m20231213_132412_seed_locations;
mod m20231213_162420_seed_test_data;
mod m20240224_203835_accounts;
mod m20240224_231812_transactions;
mod m20240225_161903_users;
mod m20240227_010532_items;
mod m20240227_021210_transaction_items;
mod m20240227_173940_add_inventory;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_locations::Migration),
            Box::new(m20231210_134627_residents::Migration),
            Box::new(m20231210_134639_timestamps::Migration),
            Box::new(m20231210_150005_levels::Migration),
            Box::new(m20231213_132412_seed_locations::Migration),
            Box::new(m20231213_162420_seed_test_data::Migration),
            Box::new(m20240224_203835_accounts::Migration),
            Box::new(m20240224_231812_transactions::Migration),
            Box::new(m20240225_161903_users::Migration),
            Box::new(m20240227_010532_items::Migration),
            Box::new(m20240227_021210_transaction_items::Migration),
            Box::new(m20240227_173940_add_inventory::Migration),
        ]
    }
}
