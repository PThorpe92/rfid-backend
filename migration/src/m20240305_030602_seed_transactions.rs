use sea_orm_migration::{
    prelude::*,
    sea_orm::{EntityTrait, Set},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        let accounts = entity::accounts::Entity::find().all(db).await?;
        let transactions = accounts
            .iter()
            .map(|account| entity::transactions::ActiveModel {
                account_id: Set(account.id),
                doc: Set(account.doc),
                kind: Set("credit".to_owned()),
                amount: Set(12),
                ..Default::default()
            });
        let _ = entity::transactions::Entity::insert_many(transactions)
            .exec(db)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        todo!();
    }
}
