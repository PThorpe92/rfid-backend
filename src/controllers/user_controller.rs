use crate::app_config::DB;
use crate::middleware::auth::Claims;
use crate::models::response::Response;
use actix_web::http::header::ContentType;
use actix_web::{get, post, web, HttpResponse, Result};
use sea_orm::{EntityTrait, IntoActiveValue};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone, Eq, PartialEq)]
pub struct PostUser {
    pub email: String,
    pub password: String,
}

#[rustfmt::skip]
#[get("/api/users")]
pub async fn get_users(claims: Claims, db: web::Data<DB>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !claims.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Unauthorized()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let users = entity::users::Entity::find().all(db).await?;
    let response = Response::from_vec(users);
        Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
}

#[rustfmt::skip]
#[post("/api/users")]
pub async fn create(claims: Claims, db: web::Data<DB>, user: web::Json<PostUser>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    if !claims.valid {
        let response = Response::<String>::from_error("Unauthorized");
        return Ok(HttpResponse::Unauthorized()
            .insert_header(ContentType::json())
            .json(response));
    }
    let db = &db.0;
    let user = entity::users::ActiveModel {
        email: user.email.clone().into_active_value(),
        password: entity::users::Model::hash_password(&user.password).into_active_value(),
        ..Default::default()
    };
    let _ = entity::users::Entity::insert(user).exec(db).await?;
        let response = Response::<String>::from_success("User created successfully");
        Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
}
