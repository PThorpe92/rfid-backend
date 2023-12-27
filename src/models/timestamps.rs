use std::fmt::{Display, Formatter};

use chrono::NaiveDate;
use entity::residents;
use serde::Deserializer;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RangeParams {
    #[serde(deserialize_with = "deserialize_date")]
    pub start_date: NaiveDate,
    #[serde(deserialize_with = "deserialize_date")]
    pub end_date: NaiveDate,
}

#[derive(Debug, Eq, PartialEq, Clone, Deserialize, Serialize)]
pub struct ResidentTimestamp {
    pub resident: entity::residents::Model,
    pub timestamp: entity::timestamps::Model,
}

impl ResidentTimestamp {
    pub fn new(resident: residents::Model, timestamp: entity::timestamps::Model) -> Self {
        Self {
            resident,
            timestamp,
        }
    }
}

// Deserialize date strings into NaiveDate
fn deserialize_date<'de, D>(deserializer: D) -> Result<NaiveDate, D::Error>
where
    D: Deserializer<'de>,
{
    let date_str = String::deserialize(deserializer)?;
    NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").map_err(serde::de::Error::custom)
}

impl Display for PostTimestamp {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "RFID: {}, Location: {}", self.rfid, self.location)
    }
}

#[derive(Debug, Serialize, Clone, Deserialize, Eq, PartialEq)]
pub struct PostTimestamp {
    pub rfid: String,
    pub location: i32,
}
