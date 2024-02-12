use crate::{
    app_config::DB,
    models::timestamps::PostTimestamp,
    models::{response::Response, timestamps::ResidentTimestamp},
};
use actix_web::{get, http::header::ContentType, post, web, HttpResponse};
use entity::{
    residents::{self, Entity as Resident},
    timestamps::{self, Entity as Timestamp},
};
use reqwest::StatusCode;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter,
    QuerySelect, Set, TryIntoModel,
};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct FilterOpts {
    // query string parameters
    pub unique: Option<bool>,
    pub per_page: Option<u64>,
    pub page: Option<u64>,
    pub all: Option<bool>,
    pub range: Option<String>,
    pub location: Option<i32>,
    pub rfid: Option<String>,
}

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
    if let Some(range) = query_params.range.clone() {
        let range: Vec<&str> = range.split(',').collect();
        if range.len() == 2 {
            let start_date = range[0];
            let end_date = range[1];
            query = query.filter(timestamps::Column::Ts.between(start_date, end_date));
        }
    }
    if let Some(true) = query_params.unique {
        query = query.distinct_on([(residents::Entity, residents::Column::Id)]);
    }
    // Executing the query
    if let Some(per_page) = query_params.per_page {
         let paginator = query.paginate(db, per_page);
        let page = query_params.page.unwrap_or(1);
        let query = paginator.fetch_page(page).await?;

        let result: Vec<ResidentTimestamp> = query.into_iter().map(|(timestamp, resident)| {
        ResidentTimestamp {
            resident: resident.unwrap_or(residents::Model {
                id: 0,
                name: "".to_string(),
                rfid: "".to_string(),
                current_location: 0,
                is_deleted: false,
                unit: 0,
                doc: "".to_string(),
                room: "".to_string(),
                level: 0,
            }),
            timestamp
        }
    }).collect();
        let response = Response::<ResidentTimestamp>::from_paginator(page, result);
        return Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
    }

    let result = query.all(db).await?;

    // Mapping the result to the ResidentTimestamp struct
    let response: Vec<ResidentTimestamp> = result.into_iter().map(|(timestamp, resident)| {
        let resident: residents::Model = resident.unwrap(); // Handle the unwrap properly in production code
        let timestamp: timestamps::Model = timestamp;
        ResidentTimestamp {
            resident,
            timestamp
        }
    }).collect();
    let response = Response::<ResidentTimestamp>::from_vec(response);
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
}

/// POST: /api/timestamps/{timestamp}
#[rustfmt::skip]
#[post("/api/timestamps")]
pub async fn store_timestamp(db: web::Data<DB>, timestamp_data: web::Json<PostTimestamp>) -> Result<HttpResponse, Box<dyn std::error::Error>>{
    let db = &db.0;
    let mut timestamp = timestamp_data.into_inner();
    match Resident::find().filter(residents::Column::Rfid.eq(timestamp.rfid.clone())).filter(residents::Column::IsDeleted.eq(false)).one(db).await? {
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
                        rfid: Set(updated_resident.id.to_owned().unwrap()),
                        location: Set(updated_resident.current_location.to_owned().unwrap()),
                    ..Default::default()
                };
                let new_ts = new_timestamp.save(db).await?;

                let response = Response::<crate::models::timestamps::ResidentTimestamp>::from_data(crate::models::timestamps::ResidentTimestamp {
                    resident: updated_resident.try_into_model().unwrap(),
                    timestamp: new_ts.try_into_model().unwrap(),
                });
                Ok(HttpResponse::Ok().content_type(ContentType::json()).status(StatusCode::CREATED).json(response))
        }
        None => {
            let error_resp: Response<String> = Response::from_error(&String::from("Error retrieving resident: Not found in system, please add Resident."));
            Ok(HttpResponse::Ok().content_type(ContentType::json()).json(error_resp))
        }
    }
}
