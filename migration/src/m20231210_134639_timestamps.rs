use entity::{
    locations,
    prelude::{Locations, Residents, Timestamps},
    residents, timestamps,
};
use sea_orm_migration::prelude::*;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Timestamps)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(timestamps::Column::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(timestamps::Column::Rfid)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(timestamps::Column::Location)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(timestamps::Column::Ts)
                            .date_time()
                            .timestamp()
                            .default(chrono::Local::now()),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_timestamps_residents")
                    .from(Timestamps, timestamps::Column::Rfid)
                    .to(Residents, residents::Column::Id)
                    .on_delete(ForeignKeyAction::NoAction)
                    .to_owned(),
            )
            .await?;
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_timestamps_locations")
                    .from(Timestamps, timestamps::Column::Location)
                    .to(Locations, locations::Column::Id)
                    .on_delete(ForeignKeyAction::NoAction)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Timestamps).to_owned())
            .await
    }
}
