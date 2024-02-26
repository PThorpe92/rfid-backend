use entity::residents;
use entity::timestamps;
use entity::timestamps::PostTimestamp;
use sea_orm::Set;
use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::EntityTrait;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), sea_orm_migration::DbErr> {
        let db = manager.get_connection();
        let residents = std::fs::read_to_string("seed_data/residents.json").unwrap();
        let residents = serde_json::from_str::<Vec<entity::residents::Model>>(&residents).unwrap();
        let residents: Vec<residents::ActiveModel> = residents
            .iter()
            .map(|res| residents::ActiveModel {
                rfid: Set(res.rfid.to_owned()),
                name: Set(res.name.to_owned()),
                doc: Set(res.doc.to_owned()),
                room: Set(res.room.to_owned()),
                unit: Set(res.unit.to_owned()),
                current_location: Set(res.current_location.to_owned()),
                level: Set(res.level.to_owned()),
                ..Default::default()
            })
            .collect();
        entity::residents::Entity::insert_many(residents)
            .exec(db)
            .await?;
        let timestamps = std::fs::read_to_string("seed_data/timestamps.json").unwrap();
        let timestamps = serde_json::from_str::<Vec<PostTimestamp>>(&timestamps).unwrap();
        let timestamps: Vec<timestamps::ActiveModel> = timestamps
            .iter()
            .map(|ts| timestamps::ActiveModel {
                rfid: Set(ts.rfid.to_owned()),
                location: Set(ts.location.to_owned()),
                ..Default::default()
            })
            .collect();
        entity::timestamps::Entity::insert_many(timestamps)
            .exec(db)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        todo!()
    }
}
