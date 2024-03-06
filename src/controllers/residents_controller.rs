use crate::app_config::DB;
use crate::models::response::{FilterOpts, ResidentHours, Response};
use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::{
    delete, get,
    http::{header, StatusCode},
    patch, post, web, HttpResponse,
};
use chrono::NaiveDateTime;
use entity::prelude::UpdateResident;
use entity::{
    residents::{self, Entity as Resident},
    timestamps,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set,
    TryIntoModel,
};
use std::path::PathBuf;

#[derive(MultipartForm)]
pub struct FormData {
    pub file: TempFile,
}

#[rustfmt::skip]
#[post("/api/residents/{doc}/upload")]
async fn upload_jpg(path: web::Path<String>,  form: MultipartForm<FormData>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let default = std::env::var("UPLOAD_FILE_PATH").unwrap_or_default();
    let path = path.into_inner();
    let path = format!("{}.jpg", path);
    const MAX_FILE_SIZE: u64 = 1024 * 1024 * 20; // 20 MB
    match form.file.size {
        0 => return Ok(HttpResponse::BadRequest().finish()),
        length if length > MAX_FILE_SIZE as usize => {
            return Ok(HttpResponse::BadRequest()
                .body(format!("The uploaded file is too large. Maximum size is {} bytes.", MAX_FILE_SIZE)));
        },
        _ => {}
    };
    // get the filename and path we want
    let pathbuf = PathBuf::from(default);
    let pathbuf = pathbuf.join(path);

    let file_path = form.file.file.path();
    let received_file = PathBuf::from(file_path);

    match std::fs::rename(received_file, pathbuf.clone()) {
        Ok(_) =>  {
             log::debug!("File saved to {:?}", pathbuf);
            Ok(HttpResponse::Ok().json(Response::<String>::from_success("File uploaded")))
        }
        Err(e) => {
            log::error!("Error renaming file: {}", e);
            Ok(HttpResponse::InternalServerError().finish())
        }
    }
}

#[rustfmt::skip]
#[get("/api/residents")]
pub async fn index(db: web::Data<DB>,params: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let params = params.into_inner();
    if let Some(true) = params.all {
        let residents = Resident::find().filter(residents::Column::IsDeleted.eq(false)).all(db).await?;
        let response: Response<residents::Model> = Response::from_vec(residents);
        return Ok(HttpResponse::Ok()
            .insert_header(header::ContentType::json())
            .json(response));
    }
    let per_page = params.per_page.unwrap_or(10);
    let page = params.page.unwrap_or(1);
    let residents = Resident::find().filter(residents::Column::IsDeleted.eq(false)).paginate(db, per_page);
    let resp = residents.fetch_page(page.saturating_sub(1)).await?;
    let total_pages = residents.num_items_and_pages().await?;
    let response = Response::from_paginator(&total_pages, resp);
    Ok(HttpResponse::Ok()
        .insert_header(header::ContentType::json())
        .json(response))
}

#[rustfmt::skip]
#[get("/api/residents/{rfid}")]
pub async fn show(db: web::Data<DB>, doc: actix_web::web::Path<i32>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let doc = doc.into_inner();
    if let Ok(resident) = Resident::find().filter(residents::Column::IsDeleted.eq(false)).filter(residents::Column::Doc.eq(doc)).one(db).await {
    if resident.is_none() {
        let error = Response::<String>::from_error("Error retrieving residents");
        return Ok(HttpResponse::Ok()
            .insert_header(header::ContentType::json())
            .json(error));
    }
    let response: Response<residents::Model> = Response::from_data(resident.unwrap());
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
    } else {
        let response = Response::<String>::from_error("Error retrieving residents");
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
    }
}

#[rustfmt::skip]
#[get("/api/residents/{doc}/hours")]
pub async fn get_resident_hours(db: web::Data<DB>, path: web::Path<i32>, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let resident_id = path.into_inner();
    let query_params = query.into_inner();
    let range = query_params.get_range().unwrap_or_default();
    let target_location = query_params.location.unwrap();

    // Retrieve all timestamps for the resident within the given period, ordered by timestamp
    let timestamps = timestamps::Entity::find()
        .filter(timestamps::Column::Doc.eq(resident_id))
        .filter(timestamps::Column::Ts.between(range.0, range.1))
        .order_by(timestamps::Column::Ts, sea_orm::Order::Asc)
        .all(db)
        .await?;

    let mut total_duration_secs = 0i64;
    let mut entry_ts: Option<NaiveDateTime> = None;

    for timestamp in timestamps.iter() {
        if timestamp.location == target_location && entry_ts.is_some() {
            let duration = timestamp.ts.signed_duration_since(entry_ts.unwrap());
            total_duration_secs += duration.num_seconds();
            log::debug!("Duration: {}", duration.num_seconds());
            entry_ts = None;
        } else if timestamp.location == target_location && entry_ts.is_none() {
            entry_ts = Some(timestamp.ts);
        } else {
            continue;
        }
    }
    // Convert total seconds to hours
    let total_hours = total_duration_secs as f32 / 3600.0;

    log::debug!("Total hours: {}", total_hours);
    let result = ResidentHours {
        resident_doc: resident_id,
        location: target_location,
        hours: total_hours,
    };
    let response = Response::from_data(result);
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
}

#[rustfmt::skip]
#[post("/api/residents")]
pub async fn store(db: web::Data<DB>, resident: web::Json<UpdateResident>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let resident = resident.into_inner();
    if let Ok(resident) = resident.into_active_model()?.save(db).await {
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).status(StatusCode::CREATED).json(Response::<residents::Model>::from_data(resident.try_into_model()?)))
    } else {
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(Response::<String>::from_error("Error adding Resident, please check your fields")))
    }
}

#[rustfmt::skip]
#[delete("/api/residents/{rfid}")]
pub async fn destroy(db: web::Data<DB>, rfid: web::Path<String>,) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let rfid = rfid.into_inner();
    if let Ok(resident) = Resident::find().filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await {
    let mut resident: residents::ActiveModel = resident.unwrap().into();
        resident.is_deleted = Set(true);
    resident.save(db).await?;
        Ok(HttpResponse::Ok().status(StatusCode::NO_CONTENT).insert_header(header::ContentType::json()).json(Response::<residents::Model>::from_success("Resident deleted")))
    } else {
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(Response::<String>::from_error("Error deleting resident")))
    }
}

#[rustfmt::skip]
#[patch("/api/residents/{rfid}")]
pub async fn update(db: web::Data<DB>, rfid: actix_web::web::Path<String>, resident: web::Json<UpdateResident>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
     let db = &db.0;
    let rfid = rfid.into_inner();
    let resident = resident.into_inner();
    if let Ok(to_update) = Resident::find().filter(residents::Column::IsDeleted.eq(false)).filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await {
    if to_update.is_none() {
        let error = Response::<String>::from_error("Error retrieving resident");
        return Ok(HttpResponse::Ok()
            .insert_header(header::ContentType::json())
            .json(error));
    } 
        let mut to_update: residents::ActiveModel = to_update.unwrap().into();
        to_update.rfid = Set(resident.rfid.unwrap_or_else(|| to_update.rfid.unwrap()));
        to_update.name = Set(resident.name.unwrap_or_else(|| to_update.name.unwrap()));
        to_update.room = Set(resident.room.unwrap_or_else(|| to_update.room.unwrap()));
        to_update.unit = Set(resident.unit.unwrap_or_else(|| to_update.unit.unwrap()));
        to_update.current_location = Set(resident.current_location.unwrap_or_else(|| to_update.current_location.unwrap()));
        to_update.level = Set(resident.level.unwrap_or_else(|| to_update.level.unwrap()));
        let updated = to_update.save(db).await?;
        let response: Response<residents::Model> = Response::from_data(updated.try_into_model()?);
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
    } else {
        Ok(HttpResponse::Ok().body("Error updating resident"))
    }
}
