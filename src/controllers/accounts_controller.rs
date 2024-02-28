use crate::app_config::DB;
use crate::middleware::auth::Claims;
use crate::models::response::Response;
use actix_web::http::header::ContentType;
use actix_web::{get, post, web, HttpResponse, Result};
use entity::prelude::{Accounts, Transactions};

use entity::transactions::{PostTransaction, TransactionResult};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};

use super::timestamps_controller::FilterOpts;

#[rustfmt::skip]
#[get("/api/accounts")]
pub async fn index_accounts(db: web::Data<DB>, auth: Claims, query_params: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let query_params = query_params.into_inner();
    let mut query = Accounts::find();
    if let Some(doc) = query_params.doc {
        query = query.filter(entity::residents::Column::Doc.eq(doc));
    }
    if let Some(per_page) = query_params.per_page {
        let paginator = query.paginate(db, per_page);
        let page = query_params.page.unwrap_or(1);
        let result = paginator.fetch_page(page).await?;

        let response = Response::from_paginator(page, result);
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    } 
        let result = query.all(db).await;
        let response = Response::from_vec(result.unwrap_or_default());
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
}

#[rustfmt::skip]
#[get("/api/accounts/{id}")]
pub async fn show_account(db: web::Data<DB>,id: web::Path<i32>, auth: Claims) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
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
pub async fn get_all_transactions(db: web::Data<DB>, auth: Claims, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
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
pub async fn show_account_transactions(db: web::Data<DB>, id: web::Path<i32>, auth: Claims, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
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
pub async fn post_transaction(db: web::Data<DB>, id: web::Path<i32>, auth: Claims, transaction: web::Json<PostTransaction>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !auth.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let id = id.into_inner();
    match transaction.process_transaction(db, id).await {
        Ok(ref result) => {  
        let response = Response::<TransactionResult>::from_data(result.clone());
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        } 
        Err(e) => {
            let response = Response::<String>::from_error(e.to_string().as_str());
            return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        }
    }
}
