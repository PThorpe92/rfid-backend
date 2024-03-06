use std::ops::Mul;

use crate::prelude::OrmSerializable;
use sea_orm::{entity::prelude::*, IntoActiveModel, Set};
use serde::{Deserialize, Serialize};

impl OrmSerializable for Model {}
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, DeriveRelatedEntity, Serialize, Deserialize,
)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub doc: i32,
    pub account_id: i32,
    pub kind: String,
    pub amount: i32,
    pub timestamp: DateTime,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PostItem {
    pub upc: String,
    pub quantity: i32,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PostTransaction {
    pub doc: i32,
    pub kind: String,
    pub amount: f64,
    pub items: Option<Vec<PostItem>>,
}

#[derive(Debug, PartialEq, Clone, Deserialize, Serialize)]
pub struct TransactionResult {
    pub doc: i32,
    pub account_id: i32,
    pub kind: String,
    pub amount: i32,
    pub balance: i32,
}

impl TransactionResult {
    fn init(transaction: &PostTransaction, id: i32) -> Self {
        Self {
            doc: transaction.doc,
            account_id: id,
            kind: transaction.kind.clone(),
            amount: transaction.amount.mul(100.0) as i32,
            balance: 0,
        }
    }
}

impl OrmSerializable for TransactionResult {}

impl PostTransaction {
    #[rustfmt::skip]
    pub async fn process_transaction(&self, db: &DatabaseConnection, id: i32) -> Result<TransactionResult, Box<dyn std::error::Error>> {
        let mut result = TransactionResult::init(self, id);

        let account = crate::accounts::Entity::find()
            .filter(crate::accounts::Column::Id.eq(result.account_id))
            .one(db)
            .await?;
        if account.is_none() {
            return Err("Account not found".into());
        }
        let account = account.unwrap();
        match &self.kind.as_str() {
             &"credit" => {
                let new_balance = account.balance + self.amount.mul(100.0) as i32;
                let mut active_model = account.into_active_model();
                active_model.balance = Set(new_balance);
                let _ = active_model.save(db).await?;
                result.balance = new_balance;
                Ok(result)
            }
            _ => {
                if account.balance == 0 || account.balance.mul(100) < self.amount.mul(100.0) as i32
                {
                    return Err("Insufficient funds".into());
                }
                let mut items_vec = vec![];
                let mut total = 0;
                for post_item in self.items.clone().unwrap() {
                    if let Ok(Some(mut item)) = crate::items::Entity::find()
                        .filter(crate::items::Column::Upc.eq(post_item.upc))
                        .one(db)
                        .await
                    {
                        total += (item.price) * (post_item.quantity);
                        item.quantity -= post_item.quantity;
                        items_vec.push(item.clone());
                    }
                }
                result.amount = total;
                if account.balance < result.amount {
                    return Err("Insufficient funds".into());
                }
                let active_model: ActiveModel = ActiveModel {
                    kind: Set(result.kind.clone()),
                    amount: Set(result.amount),
                    account_id: Set(result.account_id),
                    ..Default::default()
                };
                let transaction = active_model.save(db).await?;
                let transaction_id = transaction.id.clone().unwrap();
                for item in items_vec {
                    let item_id = item.id;
                    let transaction_item_model = crate::transaction_items::ActiveModel {
                        item_id: Set(item_id),
                        transaction_id: Set(transaction_id),
                        ..Default::default()
                    };
                    let _ = transaction_item_model.save(db).await?;
                    let event = crate::inventory_event::ActiveModel {
                        item_id: Set(item_id),
                        quantity: Set(item.quantity),
                        is_add: Set(false),
                        ..Default::default()
                    };
                    let _ = event.save(db).await?;
                }
                let new_balance = account.balance - self.amount.mul(100.0) as i32;
                let mut active_model = account.into_active_model();
                active_model.balance = Set(new_balance);
                let _ = active_model.save(db).await?;
                result.balance = new_balance;
                Ok(result)
            }
        }
    }
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
        belongs_to = "super::accounts::Entity",
        from = "Column::AccountId",
        to = "super::accounts::Column::Id"
    )]
    Accounts,
    #[sea_orm(
        has_many = "super::transaction_items::Entity",
        from = "Column::Id",
        to = "super::transaction_items::Column::TransactionId"
    )]
    TransactionItems,
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TransactionItems.def()
    }
}

impl Related<super::residents::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Residents.def()
    }
}
impl Related<super::accounts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Accounts.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
