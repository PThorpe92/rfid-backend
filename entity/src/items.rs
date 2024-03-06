use std::ops::Mul;

use sea_orm::{entity::prelude::*, IntoActiveModel, Set};
use serde::{Deserialize, Serialize};

use crate::prelude::OrmSerializable;

#[derive(Clone, Default, Serialize, Deserialize, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "items")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub upc: String,
    pub name: String,
    pub price: i32,
    pub quantity: i32,
    #[serde(skip)]
    pub is_deleted: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct PatchItem {
    pub purchase_order_id: i32,
    pub price: Option<f64>,
    pub quantity: Option<i32>,
}

impl PatchItem {
    #[rustfmt::skip]
    pub async fn update_item(&self, id: i32, db: &DatabaseConnection) -> Result<ActiveModel, sea_orm::DbErr> {
        let model = Entity::find_by_id(id)
            .one(db)
            .await?
            .expect("Item not found");
        let mut active = model.into_active_model();
        if let Some(price) = self.price {
            active.price = Set(price.mul(100.0) as i32);
        }
        if let Some(quantity) = self.quantity {
            active.quantity = Set(active.quantity.to_owned().unwrap() + quantity);
        }
        let order = crate::inventory_event::ActiveModel {
            item_id: Set(id),
            quantity: Set(self.quantity.unwrap()),
            purchase_order_id: Set(self.purchase_order_id),
            is_add: Set(true),
            ..Default::default()
        };
        order.save(db).await?;
        active.save(db).await
    }
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        has_one = "super::inventory_event::Entity",
        from = "Column::Id",
        to = "super::inventory_event::Column::ItemId"
    )]
    InventoryEvents,
    #[sea_orm(
        has_one = "super::transaction_items::Entity",
        from = "Column::Id",
        to = "super::transaction_items::Column::ItemId"
    )]
    TransactionItems,
}

impl OrmSerializable for Model {}
impl OrmSerializable for CreateItem {}

#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct CreateItem {
    pub upc: String,
    pub name: String,
    pub price: f64,
    pub quantity: i32,
}

impl CreateItem {
    pub fn into_active_model(self) -> ActiveModel {
        ActiveModel {
            upc: Set(self.upc),
            name: Set(self.name),
            price: Set(self.price.mul(100.0) as i32),
            quantity: Set(self.quantity),
            ..Default::default()
        }
    }
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
