use crate::app_config::DB;
use crate::models::response::{FilterOpts, Response};
use actix_web::http::header::ContentType;
use actix_web::{delete, get, patch, post, web, HttpResponse, Responder, ResponseError};
use entity::residents;
use entity::{
    locations::{self, Entity as Locations},
    residents::Entity as Residents,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, Set,
};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct LocationsError(pub String);
impl ResponseError for LocationsError {}

impl std::fmt::Display for LocationsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "A validation error occured on the input: {}", self.0)
    }
}

// index all locations
#[rustfmt::skip]
#[get("/api/locations")]
pub async fn index(db: web::Data<DB>, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let query_params = query.into_inner();
    if let Some(true) = query_params.all {
        let locations = Locations::find().all(db).await.unwrap_or(Vec::new());
        let response: Response<locations::Model> = Response::from_vec(locations);
        return Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response));
    }
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let paginator = Locations::find().paginate(db, per_page);
    let items_pages = paginator.num_items_and_pages().await?;
    let locations = paginator.fetch_page(page.saturating_sub(1)).await.unwrap_or(Vec::new());
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_paginator(&items_pages, locations)))
}

// add a new location
#[rustfmt::skip]
#[post("/api/locations")]
pub async fn store(db: web::Data<DB>, loc: web::Json<locations::Model>) -> impl Responder {
    let db = &db.0;
    log::info!("POST: locations controller");
    let loc = loc.into_inner();
    let location = locations::ActiveModel {
        id: Set(loc.id),
        name: Set(loc.name),
        ..Default::default()
    };
    if Locations::insert(location).exec(db).await.is_ok() {
    let resp: Response<String> = Response::from_success("Location successfully added");
    HttpResponse::Ok().insert_header(ContentType::json()).json(resp)
    } else {
    HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error adding location"))
    }
}

#[rustfmt::skip]
#[patch("/api/locations/{location_id}")]
pub async fn update(db: web::Data<DB>, id: web::Path<i32>, loc: web::Json<locations::Model>) -> impl Responder {
    let db = &db.0;
    let id = id.into_inner();
    if let Some(location) = Locations::find_by_id(id).one(db).await.unwrap_or(None) {
        let mut active = location.into_active_model();
        let loc = loc.into_inner();
        active.name = Set(loc.name);
        if active.save(db).await.is_ok() {
            let resp: Response<String> = Response::from_success("Location successfully updated");
            HttpResponse::Ok().insert_header(ContentType::json()).json(resp)
        } else {
            HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error updating location"))
        }
    } else {
        HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error updating location, location not found"))
    }
}
// Get location name from ID
#[get("/api/locations/{location_id}")]
pub async fn show(db: web::Data<DB>, id: web::Path<i32>) -> impl Responder {
    let db = &db.0;
    let id = id.into_inner();
    log::info!("GET: Locations Show: {}", id);
    if let Some(location) = Locations::find_by_id(id).one(db).await.unwrap() {
        let response: Response<entity::locations::Model> = Response::from_data(location);
        HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response)
    } else {
        let response = Response::<String>::from_error("Error retrieving location");
        HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response)
    }
}

// show all residents for a given location
#[rustfmt::skip]
#[get("/api/locations/{location_id}/residents")]
pub async fn show_location_residents(db: web::Data<DB>, id: web::Path<i32>, curr: web::Query<FilterOpts>) -> impl Responder  {
    let db = &db.0;
    let id = id.into_inner();
    let curr = curr.into_inner();
    
    // get ONLY the residents who are currently at the scan location (useful for Monitors)
    if curr.current.is_some_and(|c| c) {
        let residents: Vec<residents::Model> = Residents::find()
            .filter(residents::Column::CurrentLocation.eq(id))
            .all(db)
            .await.unwrap_or(Vec::new());
        let response: Response<residents::Model> = Response::from_vec(residents);
        HttpResponse::Ok().insert_header(ContentType::json()).json(response)
    } else if curr.active_scan.is_some_and(|c| c) {
        
        // get all residents who live at the unit, as well as those who are currently at the unit (i.e. have scanned in)
        let residents: Vec<residents::Model> = Residents::find()
            .filter(residents::Column::Unit.eq(id).or(residents::Column::CurrentLocation.eq(id)))
            .all(db)
            .await.unwrap_or(Vec::new());
        HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_vec(residents))
    } else {
        
        // get all residents who live at the unit, (useful for admin page/reports)
        let residents = Residents::find()
            .filter(residents::Column::Unit.eq(id))
            .all(db)
            .await.unwrap_or(Vec::new());
        if residents.is_empty() {
            HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error retrieving residents"))
        } else {
            let response: Response<residents::Model> = Response::from_vec(residents);
            HttpResponse::Ok().insert_header(ContentType::json()).json(response)
        }
    }
}

#[rustfmt::skip]
#[delete("/api/locations/{location_id}")]
pub async fn destroy(db: web::Data<DB>, id: web::Path<i32>) -> impl Responder {
    let db = &db.0;
    let id = id.into_inner();
    if Locations::find_by_id(id).one(db).await.unwrap_or(None).is_some() {
        if Locations::delete_by_id(id).exec(db).await.is_ok() {
            let resp: Response<String> = Response::from_success("Location successfully deleted");
            HttpResponse::Ok().insert_header(ContentType::json()).json(resp)
        } else {
            HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error deleting location"))
        }
    } else {
        HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_error("Error deleting location, location not found"))
    }
}
