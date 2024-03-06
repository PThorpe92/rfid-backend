use sea_orm_migration::{
    prelude::*,
    sea_orm::{EntityTrait, Set},
};
use std::default::Default;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let residents = entity::residents::Entity::find().all(db).await?;
        let accounts = residents.iter().map(|res| entity::accounts::ActiveModel {
            doc: Set(res.doc.to_owned()),
            balance: Set(0),
            ..Default::default()
        });
        entity::accounts::Entity::insert_many(accounts)
            .exec(db)
            .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        todo!();
    }
}
