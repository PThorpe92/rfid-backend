use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "items")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub upc: String,
    pub name: String,
    pub price: f64,
    pub quantity: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_one = "super::inventory_event::Entity")]
    InventoryEvents,
    #[sea_orm(has_one = "super::transaction_items::Entity")]
    TransactionItems,
}

impl Related<super::inventory_event::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::InventoryEvents.def()
    }
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TransactionItems.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
