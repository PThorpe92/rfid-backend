//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.6

use crate::prelude::OrmSerializable;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
impl OrmSerializable for Model {}

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, DeriveRelatedEntity, Eq, Serialize, Deserialize,
)]
#[sea_orm(table_name = "timestamps")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub rfid: i32,
    pub location: i32,
    pub ts: DateTime,
}

impl OrmSerializable for ResidentTimestamp {}
impl OrmSerializable for sea_orm::JsonValue {}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ResidentTimestamp {
    pub id: i32,
    pub doc: String,
    pub name: String,
    pub location: i32,
    pub ts: DateTime, // Adjust the DateTime type based on your schema
}

// Implement conversion from the tuple of models to `ResidentTimestamp`
// Assume we have a tuple like (ResidentModel, LocationModel, TimestampModel)
impl From<(crate::residents::Model, Model)> for ResidentTimestamp {
    fn from(tuple: (crate::residents::Model, Model)) -> Self {
        ResidentTimestamp {
            id: tuple.0.id,
            doc: tuple.0.doc,
            name: tuple.0.name,
            location: tuple.1.location,
            ts: tuple.1.ts,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedTimestamp {
    pub rfid: i32,
    pub location: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PostTimestamp {
    pub rfid: String,
    pub location: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::locations::Entity",
        from = "Column::Location",
        to = "super::locations::Column::Id",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Locations,
    #[sea_orm(
        belongs_to = "super::residents::Entity",
        from = "Column::Rfid",
        to = "super::residents::Column::Id",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Residents,
}

impl Related<super::locations::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Locations.def()
    }
}

impl Related<super::residents::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Residents.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
