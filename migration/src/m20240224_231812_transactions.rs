use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Transactions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Transactions::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Transactions::AccountId).integer().not_null())
                    .col(ColumnDef::new(Transactions::Doc).integer().not_null())
                    .col(ColumnDef::new(Transactions::Amount).integer().not_null())
                    .col(
                        ColumnDef::new(Transactions::Kind)
                            .string()
                            .not_null()
                            .default("credit"),
                    )
                    .col(
                        ColumnDef::new(Transactions::Timestamp)
                            .timestamp()
                            .default(chrono::Local::now())
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .table(Transactions::Table)
                    .name("idx_resident_id")
                    .col(Transactions::Doc)
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .table(Transactions::Table)
                    .name("idx_type")
                    .col(Transactions::Kind)
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_transaction_account_id")
                    .from(Transactions::Table, Transactions::AccountId)
                    .to(entity::accounts::Entity, entity::accounts::Column::Id)
                    .on_delete(ForeignKeyAction::NoAction)
                    .on_update(ForeignKeyAction::NoAction)
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_transaction_resident_id")
                    .from(Transactions::Table, Transactions::Doc)
                    .to(entity::residents::Entity, entity::residents::Column::Doc)
                    .on_delete(ForeignKeyAction::NoAction)
                    .on_update(ForeignKeyAction::NoAction)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Transactions::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Transactions {
    Table,
    Id,
    AccountId,
    Doc,
    Amount,
    Kind,
    Timestamp,
}
