use crate::prelude::OrmSerializable;
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

impl OrmSerializable for Model {}
#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, DeriveRelatedEntity, Eq, Serialize, Deserialize,
)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub resident_id: i32,
    pub account_id: i32,
    pub kind: String,
    pub amount: i32,
    pub timestamp: DateTime,
}

#[derive(Debug, Eq, PartialEq, Clone, Serialize, Deserialize, DeriveIntoActiveModel)]
pub struct PostTransaction {
    pub resident_id: i32,
    pub account_id: i32,
    pub kind: String,
    pub amount: i32,
}

impl PostTransaction {
    pub fn into_active_model(self) -> Result<ActiveModel, Box<dyn std::error::Error>> {
        let mut active_model: ActiveModel = ActiveModel {
            ..Default::default()
        };
        active_model.resident_id = Set(self.resident_id);
        active_model.kind = Set(self.kind);
        active_model.amount = Set(self.amount);
        Ok(active_model)
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
