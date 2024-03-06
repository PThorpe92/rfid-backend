use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TransactionItems::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TransactionItems::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(TransactionItems::TransactionId)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(TransactionItems::ItemId)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(TransactionItems::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("transaction_items_item_id_fkey")
                    .from(TransactionItems::Table, TransactionItems::ItemId)
                    .to(entity::items::Entity, entity::items::Column::Id)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TransactionItems::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum TransactionItems {
    Table,
    Id,
    ItemId,
    TransactionId,
    Quantity,
}
