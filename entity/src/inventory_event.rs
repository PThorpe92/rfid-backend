use crate::prelude::OrmSerializable;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "inventory_events")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub item_id: i32,
    pub quantity: i32,
    pub is_add: bool,
}

impl OrmSerializable for Model {}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        has_one = "super::items::Entity",
        from = "Column::ItemId",
        to = "super::items::Column::Id"
    )]
    Items,
}

impl Related<super::items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Items.def()
    }
}

impl<T> OrmSerializable for (T, Vec<crate::transaction_items::Model>) {}

impl ActiveModelBehavior for ActiveModel {}
