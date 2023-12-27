use entity::locations::{self};
use entity::residents::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Entity)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Column::Id)
                            .integer()
                            .primary_key()
                            .auto_increment()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Column::Rfid)
                            .string()
                            .unique_key()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Column::Name).string().not_null())
                    .col(ColumnDef::new(Column::Doc).string().not_null())
                    .col(ColumnDef::new(Column::Room).string().not_null())
                    .col(ColumnDef::new(Column::Unit).integer().not_null())
                    .col(
                        ColumnDef::new(Column::CurrentLocation)
                            .integer()
                            .not_null()
                            .default("0"),
                    )
                    .col(
                        ColumnDef::new(Column::Level)
                            .integer()
                            .not_null()
                            .default(4),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_residents_unit")
                    .from(Entity, Column::Unit)
                    .to(locations::Entity, locations::Column::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Entity).to_owned())
            .await
    }
}
