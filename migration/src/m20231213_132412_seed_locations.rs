use entity::locations;
use sea_orm::Set;
use sea_orm_migration::prelude::*;
use serde_json::from_str;

use sea_orm::entity::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let file = std::fs::read_to_string("seed_data/locations.json").unwrap();
        let locations = from_str::<Vec<locations::Model>>(&file).unwrap();

        let active_locations: Vec<locations::ActiveModel> = locations
            .iter()
            .map(|loc| locations::ActiveModel {
                id: Set(loc.id.to_owned()),
                name: Set(loc.name.to_owned()),
                level: Set(2),
            })
            .collect();

        locations::Entity::insert_many(active_locations)
            .exec(db)
            .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        todo!()
    }
}
