use crate::{
    app_config::DB,
    middleware::auth::Claims,
    models::response::{FilterOpts, Response},
};
use actix_web::{
    get,
    http::header::ContentType,
    web::{Data, Query},
    HttpResponse,
};
use entity::{prelude::OrmSerializable, transaction_items::Entity as Orders};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};
use serde::{Deserialize, Serialize};
use std::ops::Sub;

#[derive(Serialize, Debug, Deserialize)]
pub struct ReturnOrder {
    pub transaction_id: i32,
    pub items: Vec<ReturnItem>,
    pub quantity: i32,
}
impl OrmSerializable for ReturnItem {}
impl OrmSerializable for ReturnOrder {}
#[derive(Serialize, Debug, Deserialize)]
pub struct ReturnItem {
    pub item_id: i32,
    pub quantity: i32,
}

impl ReturnOrder {
    #[rustfmt::skip]
    pub fn from_vec(items: Vec<(entity::transactions::Model, Vec<entity::transaction_items::Model>)>) -> Vec<Self> {
        items
            .iter()
            .map(|(transaction, items)| {
                let mut return_order = ReturnOrder {
                    transaction_id: transaction.to_owned().id,
                    items: vec![],
                    quantity: 0,
                };
                for item in items {
                    return_order.items.push(ReturnItem {
                        item_id: item.to_owned().id,
                        quantity: item.to_owned().quantity,
                    });
                    return_order.quantity = item.quantity;
                }
                return_order
            })
            .collect()
    }
}

#[rustfmt::skip]
#[get("/api/orders")]
pub async fn get_orders(auth: Claims, db: Data<DB>, params: Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.is_valid() {
       let response = Response::<String>::from_error("Unauthorized");
       return Ok(HttpResponse::Ok().json(response));
    }
    let db = &db.0;
    let query_params = params.into_inner();
    let per_page = query_params.per_page.unwrap_or(15);
    let page = query_params.page.unwrap_or(1);
    if let Some(order_id) = query_params.order_id {
        if let Ok(items) = entity::transactions::Entity::find_by_id(order_id).find_with_related(Orders).all(db).await {
        let items = ReturnOrder::from_vec(items);
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(items));
    }
    }
    if let Some(range) = query_params.get_range() {
        let items = entity::transactions::Entity::find().filter(entity::transactions::Column::Timestamp.between(range.0, range.1)).paginate(db, per_page);
        let num = items.num_items_and_pages().await?;
        let page = query_params.page.unwrap_or(1);
        let items = items.fetch_page(page.saturating_sub(1)).await?;
        let response = Response::from_paginator(&num, items);
    return Ok(HttpResponse::Ok()
        .insert_header(ContentType::json())
        .json(response));
        }
        let date = chrono::Utc::now();
        let end = chrono::Utc::now().sub(chrono::Duration::days(1));
        let items = entity::transactions::Entity::find().filter(entity::transactions::Column::Timestamp.between(date, end)).paginate(db, per_page);
        let num = items.num_items_and_pages().await?;
        let items = items.fetch_page(page.saturating_sub(1)).await?;
        let response = Response::from_paginator(&num, items);
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
}
