use crate::prelude::OrmSerializable;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

impl OrmSerializable for Model {}

#[derive(
    Clone,
    Default,
    Debug,
    PartialEq,
    DeriveEntityModel,
    DeriveRelatedEntity,
    Eq,
    Serialize,
    Deserialize,
)]
#[sea_orm(table_name = "accounts")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub doc: i32,
    pub balance: i32,
    pub is_deleted: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::residents::Entity",
        from = "Column::Doc",
        to = "super::residents::Column::Doc"
    )]
    Residents,
    #[sea_orm(
        has_many = "super::transactions::Entity",
        from = "Column::Id",
        to = "super::transactions::Column::AccountId"
    )]
    Transactions,
}

impl Related<super::residents::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Residents.def()
    }
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transactions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
