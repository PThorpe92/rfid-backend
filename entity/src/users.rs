use pwhash::bcrypt;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::prelude::OrmSerializable;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,
    pub email: String,
    #[serde(skip_serializing)]
    pub password: String,
}

impl OrmSerializable for Model {}

impl Model {
    pub fn verify_password(&self, password: &str) -> bool {
        bcrypt::verify(password, &self.password)
    }
    pub fn hash_password(password: &str) -> String {
        bcrypt::hash(password).unwrap()
    }
}

#[derive(DeriveRelation, Copy, Clone, Debug, EnumIter)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
