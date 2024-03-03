use actix_web::ResponseError;
use chrono::{DateTime, Duration, NaiveDate, TimeZone, Utc};
use entity::prelude::OrmSerializable as Serializable;
use sea_orm::ItemsAndPagesNumber;
use serde::{Deserialize, Serialize};
use std::borrow::Borrow;
use std::fmt::Formatter;
#[derive(Debug, Deserialize, Serialize)]
pub struct Response<T> {
    pub success: bool,
    pub message: String,
    pub data: Option<Vec<T>>,
}

#[derive(Debug, Deserialize)]
pub struct FilterOpts {
    // query string parameters
    pub unique: Option<bool>,
    pub per_page: Option<u64>,
    pub page: Option<u64>,
    pub sort_order: Option<String>,
    pub all: Option<bool>,
    pub range: Option<String>,
    pub location: Option<i32>,
    pub rfid: Option<String>,
    pub doc: Option<i32>,
    pub order_id: Option<i32>,
    pub current: Option<bool>,
    pub active_scan: Option<bool>,
}

impl FilterOpts {
    pub fn get_range(&self) -> Option<(DateTime<Utc>, DateTime<Utc>)> {
        if let Some(range) = self.range.clone() {
            let range_parts: Vec<&str> = range.split(&[';', ',']).collect();
            if range_parts.len() == 1 {
                let start_date = NaiveDate::parse_from_str(range_parts[0], "%Y-%m-%d").unwrap_or(
                    NaiveDate::parse_from_str(range_parts[0], "%Y:%m:%d").unwrap_or_default(),
                );
                let start_datetime = Utc.from_utc_datetime(&start_date.into());
                let end_datetime = Utc::now();
                return Some((start_datetime, end_datetime));
            }
            if range_parts.len() == 2 {
                let start_date = NaiveDate::parse_from_str(range_parts[0], "%Y-%m-%d").unwrap_or(
                    NaiveDate::parse_from_str(range_parts[0], "%Y:%m:%d").unwrap_or_default(),
                );
                let end_date = NaiveDate::parse_from_str(range_parts[1], "%Y-%m-%d").unwrap_or(
                    NaiveDate::parse_from_str(range_parts[1], "%Y:%m:%d").unwrap_or_default(),
                );
                let end = end_date.and_hms_opt(23, 59, 59).unwrap_or_else(|| {
                    end_date
                        .checked_add_signed(Duration::days(1))
                        .unwrap_or(end_date)
                        .into()
                });
                let start_datetime = Utc.from_utc_datetime(&start_date.into());
                // Include the full day for the end date
                let end_datetime = Utc.from_utc_datetime(&end);
                return Some((start_datetime, end_datetime));
            }
        }
        None
    }
    pub fn sort_order(&self) -> SortOrder {
        match self.sort_order.borrow().as_deref() {
            Some("asc") => SortOrder::Asc,
            Some("desc") => SortOrder::Desc,
            _ => SortOrder::Asc,
        }
    }
}

#[derive(Debug, Deserialize)]
pub enum SortOrder {
    Asc,
    Desc,
}
impl<T> std::fmt::Display for Response<T>
where
    T: Serializable + std::fmt::Debug,
{
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Response: {}", self.message)
    }
}

impl<T: Serializable + std::fmt::Debug> ResponseError for Response<T> {}

impl<T> From<Box<dyn std::error::Error>> for Response<T>
where
    T: Serializable + std::fmt::Debug + Serialize,
{
    fn from(e: Box<dyn std::error::Error>) -> Self {
        Self {
            success: false,
            message: e.to_string(),
            data: None,
        }
    }
}

impl<T> std::error::Error for Response<T>
where
    T: Serializable + std::fmt::Debug,
{
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }
}

impl Serializable for ResidentHours {}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResidentHours {
    pub resident_doc: i32,
    pub hours: f32,
    pub location: i32,
}

impl<T> Response<T>
where
    T: Serializable + std::fmt::Debug + serde::Serialize,
{
    pub fn from_success(msg: &str) -> Self {
        Self {
            success: true,
            message: msg.to_string(),
            data: None,
        }
    }
    pub fn from_join(data: Vec<(T, T)>) -> Self {
        Self {
            success: true,
            message: "Data successfully retrieved".to_string(),
            data: Some(data.into_iter().flat_map(|(a, b)| vec![a, b]).collect()),
        }
    }
    pub fn from_error(msg: &str) -> Self {
        Self {
            success: false,
            message: msg.to_string(),
            data: None,
        }
    }
    pub fn from_vec(data: Vec<T>) -> Self {
        Self {
            success: true,
            message: "Data successfully retrieved".to_string(),
            data: Some(data),
        }
    }
    pub fn from_data(data: T) -> Self {
        Self {
            success: true,
            message: "Data successfully retrieved".to_string(),
            data: Some(vec![data]),
        }
    }
    pub fn from_paginator(pages: &ItemsAndPagesNumber, data: Vec<T>) -> Self {
        Self {
            success: true,
            message: format!(
                "total_pages={},total_items={}",
                pages.number_of_pages, pages.number_of_items
            ),
            data: Some(data),
        }
    }
    pub fn resident_not_found() -> Self {
        Self {
            success: false,
            message: "Resident not found".to_string(),
            data: None,
        }
    }
}
