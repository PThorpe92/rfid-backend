use crate::{
    app_config::DB,
    middleware::auth::Claims,
    models::response::{FilterOpts, Response},
};
use actix_web::{get, http::header::ContentType, patch, post, web, HttpResponse};
use entity::items::{CreateItem, Entity as Item};
use reqwest::StatusCode;
use sea_orm::{EntityTrait, PaginatorTrait, TryIntoModel};

#[rustfmt::skip]
#[get("/api/items")]
pub async fn index_items(db: web::Data<DB>, auth: Claims, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.is_valid() {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Unauthorized()
            .insert_header(ContentType::json())
            .json(response));
    };
    let db = &db.0;
    let query = query.into_inner();
    let per_page = query.per_page.unwrap_or(10);
    let page = query.page.unwrap_or(1);
    let items = Item::find().paginate(db, per_page);
    let resp = items.fetch_page(page.saturating_sub(1)).await?;
    let total_pages = items.num_items_and_pages().await?;
    let response = Response::from_paginator(&total_pages, resp);
    Ok(HttpResponse::Ok()
        .insert_header(ContentType::json())
        .json(response))
}

#[rustfmt::skip]
#[patch("/api/items/{id}")]
pub async fn update_item(db: web::Data<DB>, auth: Claims, id: web::Path<i32>, item: web::Json<entity::items::PatchItem>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.is_valid() {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Unauthorized()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let id = id.into_inner();
    let result = item.update_item(id, db).await?;
    let item = result.try_into_model()?;
    let response = Response::<entity::items::Model>::from_data(item);
    Ok(HttpResponse::Ok()
        .insert_header(ContentType::json())
        .json(response))
}

#[rustfmt::skip]
#[post("/api/items")]
pub async fn create_item(db: web::Data<DB>, auth: Claims, item: web::Json<CreateItem>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.is_valid() {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Unauthorized()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let _ = Item::insert(item.into_inner().into_active_model()).exec(db).await?;
    let response = Response::<String>::from_success("Item created successfully");
    Ok(HttpResponse::Ok()
        .status(StatusCode::CREATED)
        .insert_header(ContentType::json())
        .json(response))
}
