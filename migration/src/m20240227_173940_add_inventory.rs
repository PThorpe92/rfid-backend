use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(InventoryEvents::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryEvents::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(InventoryEvents::ItemId).integer().not_null())
                    .col(
                        ColumnDef::new(InventoryEvents::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(InventoryEvents::IsAdd).boolean().not_null())
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_inventory_event_item")
                    .from(InventoryEvents::Table, InventoryEvents::ItemId)
                    .to(entity::items::Entity, entity::items::Column::Id)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(InventoryEvents::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum InventoryEvents {
    Table,
    Id,
    ItemId,
    Quantity,
    IsAdd,
}
