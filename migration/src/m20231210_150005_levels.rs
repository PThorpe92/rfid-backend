use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .create_table(
                Table::create()
                    .table(Levels::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Levels::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Levels::Permission).integer().not_null())
                    .col(ColumnDef::new(Levels::Text).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Levels::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Levels {
    Table,
    Id,
    Permission,
    Text,
}
