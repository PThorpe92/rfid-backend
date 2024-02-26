use actix_web::ResponseError;
use entity::prelude::OrmSerializable as Serializable;
use serde::{Deserialize, Serialize};
use std::fmt::Formatter;

#[derive(Debug, Deserialize, Serialize)]
pub struct Response<T> {
    pub success: bool,
    pub message: String,
    pub data: Option<Vec<T>>,
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
    pub fn from_paginator(pages: u64, data: Vec<T>) -> Self {
        Self {
            success: true,
            message: format!("total_pages={}", pages),
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
