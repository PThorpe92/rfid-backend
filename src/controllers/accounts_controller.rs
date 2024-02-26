use crate::app_config::DB;
use crate::models::response::Response;
use actix_web::http::header::ContentType;
use actix_web::{get, post, web, HttpResponse, Result};
use entity::prelude::{Accounts, Transactions};

use entity::transactions::PostTransaction;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, Set,
    TryIntoModel,
};

use super::timestamps_controller::FilterOpts;

#[rustfmt::skip]
#[get("/api/accounts")]
pub async fn index_accounts(db: web::Data<DB>, query_params: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let query_params = query_params.into_inner();
    let mut query = Accounts::find();
    if let Some(doc) = query_params.doc {
        query = query.filter(entity::residents::Column::Doc.eq(doc));
    }
    // Executing the query
    if let Some(per_page) = query_params.per_page {
        let paginator = query.paginate(db, per_page);
        let page = query_params.page.unwrap_or(1);
        let result = paginator.fetch_page(page).await?;

        let response = Response::from_paginator(page, result);
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    } else {
        let result = query.all(db).await;
        let response = Response::from_vec(result.unwrap_or_default());
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
}

#[rustfmt::skip]
#[get("/api/accounts/{id}")]
pub async fn show_account(db: web::Data<DB>,id: web::Path<i32>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let id = id.into_inner();
    let account = Accounts::find_by_id(id).one(db).await?;

    if let Some(account) = account {
        let response = Response::from_data(account);
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    } else {
        let response = Response::<String>::from_error("Error retrieving account");
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    }
}
#[rustfmt::skip]
#[get("/api/transactions")]
pub async fn get_all_transactions(db: web::Data<DB>, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let query_params = query.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let ts = Transactions::find().paginate(db, per_page);
    let ts = ts.fetch_page(page - 1).await?;
    let response = Response::from_paginator(page, ts);
    Ok(HttpResponse::Ok()
        .insert_header(ContentType::json())
        .json(response))
}

#[rustfmt::skip]
#[get("/api/accounts/{id}/transactions")]
pub async fn show_account_transactions(db: web::Data<DB>, id: web::Path<i32>,query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let query_params = query.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let db = &db.0;
    let id = id.into_inner();
    if let Some(account) = Accounts::find().filter(entity::accounts::Column::ResidentId.eq(id)).one(db).await? {
        let ts = entity::transactions::Entity::find()
            .filter(entity::transactions::Column::AccountId.eq(account.id))
            .paginate(db, per_page);
        let ts = ts.fetch_page(page - 1).await?;
        let response = Response::from_paginator(page, ts);
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    } else {
        let response = Response::<String>::from_error("Error retrieving transactions");
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    }
}

#[rustfmt::skip]
#[post("/api/accounts/{id}/transactions")]
pub async fn create_account_transaction(db: web::Data<DB>, id: web::Path<i32>, transaction: web::Json<PostTransaction>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let id = id.into_inner();
    let transaction = transaction.into_inner();
    if let Some(account) = Accounts::find().filter(entity::transactions::Column::ResidentId.eq(id)).one(db).await? {
        if account.balance < transaction.amount {
            let response = Response::<String>::from_error("Insufficient funds");
            return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        }
        let mut account = account.into_active_model();
        let balance = account.balance.to_owned().unwrap() - transaction.amount;
        account.balance = Set(balance);
        let saved = account.save(db).await?;
        let _ = transaction.into_active_model().unwrap_or_default().save(db).await?;
        let response = Response::from_data(saved.try_into_model().unwrap());
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    } else {
        let response = Response::<String>::from_error("Error creating transaction");
        Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response))
    }
}
