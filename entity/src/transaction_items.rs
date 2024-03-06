use crate::prelude::OrmSerializable;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
impl OrmSerializable for Model {}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transaction_items")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub transaction_id: i32,
    pub item_id: i32,
    pub quantity: i32,
}

#[derive(Debug, EnumIter, Eq, PartialEq, Clone, Serialize, DeriveRelation, Deserialize)]
pub enum Relation {
    #[sea_orm(
        has_one = "super::transactions::Entity",
        from = "Column::TransactionId",
        to = "super::transactions::Column::Id"
    )]
    Transactions,
    #[sea_orm(
        has_one = "super::items::Entity",
        from = "Column::ItemId",
        to = "super::items::Column::Id"
    )]
    Items,
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transactions.def()
    }
}

impl Related<super::items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Items.def()
    }
}
impl ActiveModelBehavior for ActiveModel {}
