//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.6
use crate::prelude::OrmSerializable;
use sea_orm::{entity::prelude::*, FromQueryResult, Set};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "residents")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    #[serde(skip_deserializing)]
    pub id: i32,
    pub rfid: String,
    pub name: String,
    pub doc: i32,
    pub room: String,
    pub unit: i32,
    pub current_location: i32,
    pub level: i32,
    #[serde(skip)]
    pub is_deleted: bool,
}
impl OrmSerializable for Model {}
#[derive(Debug, Serialize, FromQueryResult, Deserialize)]
pub struct TimestampResident {
    pub id: String,
    pub location: i32,
    pub ts: DateTime,

    // Fields from the Resident model
    pub name: String,
    pub doc: i32,
    pub room: String,
    pub unit: i32,
    pub level: i32,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct UpdateResident {
    pub rfid: Option<String>,
    pub name: Option<String>,
    pub doc: Option<i32>,
    pub room: Option<String>,
    pub unit: Option<i32>,
    pub current_location: Option<i32>,
    pub level: Option<i32>,
}

impl UpdateResident {
    pub fn into_active_model(self) -> Result<ActiveModel, Box<dyn std::error::Error>> {
        let mut active_model: ActiveModel = ActiveModel {
            ..Default::default()
        };

        if let Some(rfid) = self.rfid {
            active_model.rfid = Set(rfid);
        }
        if let Some(name) = self.name {
            active_model.name = Set(name);
        }
        if let Some(doc) = self.doc {
            active_model.doc = Set(doc);
        }
        if let Some(room) = self.room {
            active_model.room = Set(room);
        }
        if let Some(unit) = self.unit {
            active_model.unit = Set(unit);
        }
        if let Some(current_location) = self.current_location {
            active_model.current_location = Set(current_location);
        }
        if let Some(level) = self.level {
            active_model.level = Set(level);
        }
        Ok(active_model)
    }
}
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::locations::Entity",
        from = "Column::CurrentLocation",
        to = "super::locations::Column::Id",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Locations2,
    #[sea_orm(
        belongs_to = "super::locations::Entity",
        from = "Column::Unit",
        to = "super::locations::Column::Id",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Locations1,
    #[sea_orm(has_many = "super::timestamps::Entity")]
    Timestamps,
    #[sea_orm(has_many = "super::accounts::Entity")]
    Accounts,
}

impl Related<super::timestamps::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Timestamps.def()
    }
}
impl Related<super::locations::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Locations1.def()
    }
}

impl Related<super::accounts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Accounts.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
