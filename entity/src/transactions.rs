use std::fmt::{Display, Formatter};

use crate::prelude::OrmSerializable;
use sea_orm::{entity::prelude::*, sea_query::ValueTypeErr, IntoActiveModel, Set, TryGetable};
use serde::{Deserialize, Serialize};

impl OrmSerializable for Model {}
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, DeriveRelatedEntity, Serialize, Deserialize,
)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub resident_id: i32,
    pub account_id: i32,
    pub kind: TransactionKind,
    pub amount: f64,
    pub timestamp: DateTime,
}

#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum TransactionKind {
    Credit,
    Withdrawl,
}
impl TryGetable for TransactionKind {
    fn try_get_by<I: sea_orm::ColIdx>(
        res: &QueryResult,
        idx: I,
    ) -> Result<Self, sea_orm::TryGetError> {
        <String as TryGetable>::try_get_by(res, idx).and_then(|s| match s.as_str() {
            "credit" => Ok(TransactionKind::Credit),
            "withdrawl" => Ok(TransactionKind::Withdrawl),
            _ => Err(sea_orm::TryGetError::Null(String::from("TransactionKind"))),
        })
    }
}

impl sea_orm::sea_query::ValueType for TransactionKind {
    fn array_type() -> sea_orm::sea_query::ArrayType {
        sea_orm::sea_query::ArrayType::String
    }
    fn try_from(v: Value) -> Result<Self, sea_orm::sea_query::ValueTypeErr> {
        match v.to_string().as_str() {
            "credit" => Ok(TransactionKind::Credit),
            "withdrawl" => Ok(TransactionKind::Withdrawl),
            _ => Err(ValueTypeErr {}),
        }
    }
    fn column_type() -> ColumnType {
        ColumnType::String(Some(255))
    }
    fn type_name() -> String {
        String::from("VARCHAR")
    }
}
impl Display for TransactionKind {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            TransactionKind::Credit => write!(f, "credit"),
            TransactionKind::Withdrawl => write!(f, "withdrawl"),
        }
    }
}
impl From<TransactionKind> for sea_orm::Value {
    fn from(t: TransactionKind) -> sea_orm::Value {
        match t {
            TransactionKind::Credit => sea_orm::Value::String(Some(Box::new("credit".to_string()))),
            TransactionKind::Withdrawl => {
                sea_orm::Value::String(Some(Box::new("withdrawl".to_string())))
            }
        }
    }
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PostItem {
    pub upc: String,
    pub quantity: i32,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PostTransaction {
    pub resident_id: i32,
    pub kind: TransactionKind,
    pub amount: f64,
    pub items: Option<Vec<PostItem>>,
}

#[derive(Debug, PartialEq, Clone, Deserialize, Serialize)]
pub struct TransactionResult {
    pub resident_id: i32,
    pub account_id: i32,
    pub kind: TransactionKind,
    pub amount: f64,
    pub balance: f64,
}

impl TransactionResult {
    fn init(transaction: &PostTransaction, id: i32) -> Self {
        Self {
            resident_id: transaction.resident_id,
            account_id: id,
            kind: transaction.kind,
            amount: transaction.amount,
            balance: 0.0,
        }
    }
}

impl OrmSerializable for TransactionResult {}

impl PostTransaction {
    pub async fn process_transaction(
        &self,
        db: &DatabaseConnection,
        id: i32,
    ) -> Result<TransactionResult, Box<dyn std::error::Error>> {
        let mut result = TransactionResult::init(self, id);

        let account = crate::accounts::Entity::find()
            .filter(crate::accounts::Column::Id.eq(result.account_id))
            .one(db)
            .await?;
        if account.is_none() {
            return Err("Account not found".into());
        }
        let account = account.unwrap();
        match self.kind {
            TransactionKind::Credit => {
                let new_balance = account.balance + self.amount;
                let mut active_model = account.into_active_model();
                active_model.balance = Set(new_balance);
                let _ = active_model.save(db).await?;
                result.balance = new_balance;
                Ok(result)
            }
            TransactionKind::Withdrawl => {
                if account.balance == 0.0 || account.balance < self.amount {
                    return Err("Insufficient funds".into());
                }
                let mut items_vec = vec![];
                let mut total = 0.0;
                for post_item in self.items.clone().unwrap() {
                    if let Ok(Some(mut item)) = crate::items::Entity::find()
                        .filter(crate::items::Column::Upc.eq(post_item.upc))
                        .one(db)
                        .await
                    {
                        total += (item.price) * (post_item.quantity as f64);
                        item.quantity -= post_item.quantity;
                        items_vec.push(item.clone());
                    }
                }
                result.amount = total;
                if account.balance < result.amount {
                    return Err("Insufficient funds".into());
                }
                let active_model: ActiveModel = ActiveModel {
                    resident_id: Set(result.resident_id),
                    kind: Set(result.kind),
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
                let new_balance = account.balance - self.amount;
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
        from = "Column::ResidentId",
        to = "super::residents::Column::Doc"
    )]
    Residents,
    #[sea_orm(
        belongs_to = "super::accounts::Entity",
        from = "Column::AccountId",
        to = "super::accounts::Column::Id"
    )]
    Accounts,
    #[sea_orm(has_one = "super::transaction_items::Entity")]
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
