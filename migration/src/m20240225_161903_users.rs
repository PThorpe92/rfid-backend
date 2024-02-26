use sea_orm_migration::{
    prelude::*,
    sea_orm::{EntityTrait, IntoActiveModel},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Users::Email).string().not_null())
                    .col(ColumnDef::new(Users::Password).string().not_null())
                    .to_owned(),
            )
            .await?;
        let db = manager.get_connection();
        let user = entity::users::Model {
            id: Default::default(),
            email: "admin".to_owned(),
            password: entity::users::Model::hash_password("admin"),
        };
        entity::users::Entity::insert(user.into_active_model())
            .exec(db)
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Email,
    Password,
}
