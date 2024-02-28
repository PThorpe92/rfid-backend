use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(InventoryEvent::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryEvent::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(InventoryEvent::ItemId).integer().not_null())
                    .col(
                        ColumnDef::new(InventoryEvent::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(InventoryEvent::IsAdd).boolean().not_null())
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_inventory_event_item")
                    .from(InventoryEvent::Table, InventoryEvent::ItemId)
                    .to(entity::items::Entity, entity::items::Column::Id)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(InventoryEvent::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum InventoryEvent {
    Table,
    Id,
    ItemId,
    Quantity,
    IsAdd,
}
