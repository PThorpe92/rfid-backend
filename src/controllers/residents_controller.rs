use super::timestamps_controller::FilterOpts;
use crate::app_config::DB;
use crate::models::residents::UpdateResident;
use crate::models::{
    residents::{PathParams, Rfid},
    response::Response,
};
use actix_multipart::Multipart;
use actix_web::{
    delete, get,
    http::{header, StatusCode},
    patch, post, web, HttpResponse,
};
use entity::{
    residents::{self, Entity as Resident},
    timestamps,
};
use futures_util::{StreamExt, TryStreamExt};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set, TryIntoModel,
};

use std::io::Write;

#[rustfmt::skip]
#[post("/api/residents/{doc}/upload")]
async fn upload_jpg(path: web::Path<String>, mut payload: Multipart) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let filename = path.into_inner();
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name();
        if field_name == Some("file") {
        let filepath = format!("frontend/imgs/{}.jpg", filename);
            let mut f = web::block(move || std::fs::File::create(filepath))
                .await?
                .unwrap();
            while let Some(chunk) = field.next().await {
                let data = chunk.unwrap();
                f = web::block(move || f.write_all(&data).map(|_| f)).await?.unwrap();
            }
        }
    }
    Ok(HttpResponse::Ok()
        .insert_header(header::ContentType::json())
        .json(Response::<String>::from_success("File uploaded")))
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
    let residents = Resident::find().paginate(db, per_page);
    let resp = residents.fetch_page(page - 1).await?;
    let total_pages = residents.num_pages().await?;
    let response = Response::from_paginator(total_pages, resp);
    Ok(HttpResponse::Ok()
        .insert_header(header::ContentType::json())
        .json(response))
}

#[rustfmt::skip]
#[get("/api/residents/{rfid}")]
pub async fn show(db: web::Data<DB>, rfid: actix_web::web::Path<Rfid>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let rfid = rfid.into_inner().rfid;
    if let Ok(resident) = Resident::find().filter(residents::Column::IsDeleted.eq(false)).filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await {
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
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(Response::<residents::Model>::from_success("Resident deleted")))
    } else {
        Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(Response::<String>::from_error("Error deleting resident")))
    }
}

#[rustfmt::skip]
#[patch("/api/residents/{rfid}")]
pub async fn update(db: web::Data<DB>, rfid: actix_web::web::Path<Rfid>, resident: web::Json<UpdateResident>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
     let db = &db.0;
    let rfid = rfid.into_inner().rfid;
    let resident = resident.into_inner();
    if let Ok(to_update) = Resident::find().filter(residents::Column::IsDeleted.eq(false)).filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await {
    if to_update.is_none() {
        let error = Response::<String>::from_error("Error retrieving resident");
        return Ok(HttpResponse::Ok()
            .insert_header(header::ContentType::json())
            .json(error));
    } else {
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
    }

} else {
        Ok(HttpResponse::Ok().body("Error updating resident"))
    }
}

#[rustfmt::skip]
#[get("/api/residents/{rfid}/timestamps")]
pub async fn show_resident_timestamps(db: web::Data<DB>, rfid: actix_web::web::Path<Rfid>, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let query_params = query.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let db = &db.0;
    let rfid = rfid.into_inner().rfid;
    if let Some(resident) = residents::Entity::find().filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await? {
    let ts = timestamps::Entity::find()
        .filter(timestamps::Column::Rfid.eq(resident.id))
        .paginate(db, per_page);
    let ts = ts.fetch_page(page - 1).await?;
    let response: Response<timestamps::Model> = Response::from_vec(ts);
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
     } else {
    let response = Response::<String>::from_error("Error retrieving timestamps");
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
    }
}

#[rustfmt::skip]
#[get("/api/residents/{rfid}/timestamps/{start_date}/{end_date}")]
pub async fn show_resident_timestamps_range(db: web::Data<DB>, rfid: actix_web::web::Path<PathParams>, query: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let query_params = query.into_inner();
    let per_page = query_params.per_page.unwrap_or(10);
    let page = query_params.page.unwrap_or(1);
    let db = &db.0;
    let path = rfid.into_inner();
    let rfid = path.rfid;
    if let Some(resident) = residents::Entity::find().filter(residents::Column::Rfid.eq(rfid.clone())).one(db).await? {
    let ts = timestamps::Entity::find()
        .filter(timestamps::Column::Rfid.eq(resident.id)).filter(timestamps::Column::Ts.between(path.start_date, path.end_date))
        .paginate(db, per_page);
    let ts = ts.fetch_page(page - 1).await?;
    let response: Response<timestamps::Model> = Response::from_vec(ts);
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
     } else {
    let response = Response::<String>::from_error("Error retrieving timestamps");
    Ok(HttpResponse::Ok().insert_header(header::ContentType::json()).json(response))
    }
}
