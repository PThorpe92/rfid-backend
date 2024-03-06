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
        let transactions = entity::transactions::Entity::find().all(db).await?;
        let items: Vec<entity::items::Model> =
            serde_json::from_str(include_str!("../../seed_data/transaction_items.json"))
                .map_err(|_| DbErr::Custom("Serde".to_string()))
                .unwrap();
        let items = items.iter().map(|item| entity::items::ActiveModel {
            upc: Set(item.upc.clone()),
            name: Set(item.name.clone()),
            price: Set(item.price),
            quantity: Set(item.quantity),
            ..Default::default()
        });
        let _ = entity::items::Entity::insert_many(items).exec(db).await?;
        let mut counter = 1;
        let trans_items = transactions
            .iter()
            .map(|trans| {
                if counter == 5 {
                    counter = 1;
                } else {
                    counter += 1;
                }
                entity::transaction_items::ActiveModel {
                    transaction_id: Set(trans.id.to_owned()),
                    item_id: Set(counter),
                    quantity: Set(counter * 2),
                    ..Default::default()
                }
            })
            .collect::<Vec<_>>();
        entity::transaction_items::Entity::insert_many(trans_items)
            .exec(db)
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        todo!();
    }
}
