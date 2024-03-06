use crate::{
    app_config::DB,
    models::response::{FilterOpts, Response, SortOrder},
};
use actix_web::{get, http::header::ContentType, post, web, HttpResponse};
use entity::{
    residents::{self, Entity as Resident},
    timestamps::{self, Entity as Timestamp, PostTimestamp, ResidentTimestamp},
};
use reqwest::StatusCode;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter,
    QueryOrder, Set,
};

#[rustfmt::skip]
#[get("/api/timestamps")]
pub async fn index_timestamps(db: web::Data<DB>, query_params: web::Query<FilterOpts>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    let query_params = query_params.into_inner();
    let mut query = Timestamp::find()
        .find_also_related(Resident).filter(residents::Column::IsDeleted.eq(false));
    if let Some(location) = query_params.location {
        query = query.filter(timestamps::Column::Location.eq(location));
    }
    if let Some(range) = query_params.get_range() {
            log::debug!("Range: {range:?}");
            query = query.filter(timestamps::Column::Ts.between(range.0, range.1));
    }
    if let Some(doc) = query_params.doc {
        query = query.filter(timestamps::Column::Doc.eq(doc));
    }
    match query_params.sort_order() {
        SortOrder::Asc => query = query.order_by_asc(timestamps::Column::Ts),
        SortOrder::Desc => query = query.order_by_desc(timestamps::Column::Ts),
    }
    let result = query.paginate(db, query_params.per_page.unwrap_or(10));
    let page = query_params.page.unwrap_or(1);
    let current_page = result.fetch_page(page.saturating_sub(1)).await?;
    let total = result.num_items_and_pages().await?;
    let response: Vec<ResidentTimestamp> = current_page.into_iter().map(|(timestamp, resident)| {
    let resident: residents::Model = resident.unwrap();
        ResidentTimestamp {
            id: resident.id,
            name: resident.name,
            doc: resident.doc,
            location: timestamp.location,
            ts: timestamp.ts,
        }
          }).collect();
          let response = Response::<ResidentTimestamp>::from_paginator(&total, response);
          return Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
}

#[rustfmt::skip]
#[post("/api/timestamps")]
pub async fn store_timestamp(db: web::Data<DB>, timestamp_data: web::Json<PostTimestamp>) -> Result<HttpResponse, Box<dyn std::error::Error>>{
    let db = &db.0;
    let mut timestamp = timestamp_data.into_inner();
    match Resident::find().filter(residents::Column::Rfid.eq(timestamp.rfid)).filter(residents::Column::IsDeleted.eq(false)).one(db).await? {
        Some(resident) => {
             let mut resident = resident.into_active_model();
                if timestamp.location == resident.current_location.to_owned().unwrap() {
                    resident.current_location = Set(0);
                    timestamp.location = 0;
                } else {
                    resident.current_location = Set(timestamp.location);
                }
                let updated_resident = resident.save(db).await?;
                let new_timestamp: timestamps::ActiveModel = timestamps::ActiveModel {
                        doc: Set(updated_resident.doc.to_owned().unwrap()),
                        location: Set(updated_resident.current_location.to_owned().unwrap()),
                    ..Default::default()
                };
                let new_ts = new_timestamp.save(db).await?;
                let response = Response::<ResidentTimestamp>::from_data(ResidentTimestamp {
                    id: updated_resident.id.to_owned().unwrap(),
                    name: updated_resident.name.to_owned().unwrap(),
                    doc: updated_resident.doc.to_owned().unwrap(),
                    location: new_ts.location.unwrap(),
                    ts: new_ts.ts.unwrap(),
                });
                Ok(HttpResponse::Ok().content_type(ContentType::json()).status(StatusCode::CREATED).json(response))
        }
        None => {
            let error_resp: Response<String> = Response::from_error(&String::from("Error retrieving resident: Not found in system, please add Resident."));
            Ok(HttpResponse::Ok().content_type(ContentType::json()).json(error_resp))
        }
    }
}
