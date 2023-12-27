use super::timestamps_controller::FilterOpts;
use crate::app_config::DB;
use crate::models::response::Response;
use actix_web::http::header::ContentType;
use actix_web::{get, post, web, HttpResponse, Responder, ResponseError};
use chrono::NaiveDate;
use entity::{
    locations::{self, Entity as Locations},
    residents::Entity as Residents,
};
use entity::{residents, timestamps};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};
use serde::{Deserialize, Deserializer};
use std::fmt::{Display, Formatter};

#[derive(Debug, Deserialize)]
pub struct LocationRange {
    location_id: i32,
    #[serde(deserialize_with = "deserialize_date")]
    start_date: NaiveDate,
    #[serde(deserialize_with = "deserialize_date")]
    end_date: NaiveDate,
}
#[derive(Debug, Deserialize)]
pub struct Params {
    pub current: Option<bool>,
}

// Deserialize date strings into NaiveDate
fn deserialize_date<'de, D>(deserializer: D) -> Result<NaiveDate, D::Error>
where
    D: Deserializer<'de>,
{
    let date_str = String::deserialize(deserializer)?;
    NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").map_err(serde::de::Error::custom)
}
#[derive(Debug, Clone, Copy, Deserialize)]
pub struct Id {
    pub location_id: i32,
}

impl Display for Id {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Location Id: {}", self.location_id)
    }
}

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
pub async fn index(db: web::Data<DB>, query: web::Query<FilterOpts>) -> impl Responder {
    let db = &db.0;
    let query_params = query.into_inner();
    if let Some(true) = query_params.all {
        let locations = Locations::find().all(db).await.unwrap_or(Vec::new());
        let response: Response<locations::Model> = Response::from_vec(locations);
        return HttpResponse::Ok().insert_header(ContentType::json()).json(response);
    }
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let paginator = Locations::find().paginate(db, per_page);
    let locations = paginator.fetch_page(page - 1).await.unwrap_or(Vec::new());
    let total_pages = paginator.num_pages().await.unwrap_or(0);
    HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_paginator(total_pages, locations))
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

// Get location name from ID
#[get("/api/locations/{location_id}")]
pub async fn show(db: web::Data<DB>, id: web::Path<Id>) -> impl Responder {
    let db = &db.0;
    let id = id.into_inner().location_id;
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

// include range in url to show timestamps from /start/end
#[rustfmt::skip]
#[get("/api/locations/{location_id}/timestamps/{start_date}/{end_date}")]
pub async fn show_location_timestamps_range(db: web::Data<DB>, path: web::Path<LocationRange>, query_params: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let query_params = query_params.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let path = path.into_inner();
    let id = path.location_id;
    let start_date = path.start_date;
    let end_date = path.end_date;
    let db = &db.0;
    let paginator = timestamps::Entity::find().filter(timestamps::Column::Location.eq(id)).filter(
        timestamps::Column::Ts.between(start_date, end_date)
    ).paginate(db, per_page);
    let ts = paginator.fetch_page(page - 1).await.unwrap_or(Vec::new());
    let total_pages = paginator.num_pages().await.unwrap_or(0);
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_paginator(total_pages, ts)))
}

// show timestamps from today for a location
#[rustfmt::skip]
#[get("/api/locations/{location_id}/timestamps")]
pub async fn show_location_timestamps(db: web::Data<DB>, id: web::Path<Id>, query_params: web::Query<FilterOpts>) -> impl Responder {
    let query_params = query_params.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let id = id.into_inner().location_id;
    let db = &db.0;
    let paginator = timestamps::Entity::find().filter(timestamps::Column::Location.eq(id)).paginate(db, per_page);
    let ts = paginator.fetch_page(page - 1).await.unwrap_or(Vec::new());
    let total_pages = paginator.num_pages().await.unwrap_or(0);
    HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_paginator(total_pages, ts))
}

// show all residents for a given location
#[rustfmt::skip]
#[get("/api/locations/{location_id}/residents")]
pub async fn show_location_residents(db: web::Data<DB>, id: web::Path<Id>, curr: web::Query<Params>) -> impl Responder  {
    let db = &db.0;
    let id = id.into_inner().location_id;
    if curr.into_inner().current.is_some_and(|c| c) {
        let residents: Vec<residents::Model> = Residents::find()
            .filter(residents::Column::CurrentLocation.eq(id))
            .all(db)
            .await.unwrap_or(Vec::new());
        let response: Response<residents::Model> = Response::from_vec(residents);
        HttpResponse::Ok().insert_header(ContentType::json()).json(response)
    } else {
        let residents: Vec<residents::Model> = Residents::find()
            .filter(residents::Column::Unit.eq(id))
            .all(db)
            .await.unwrap_or(Vec::new());
        HttpResponse::Ok().insert_header(ContentType::json()).json(Response::from_vec(residents))
    }
}
