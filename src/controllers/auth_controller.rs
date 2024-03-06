use crate::app_config::DB;
use crate::middleware::auth::{create_jwt, Claims};
use crate::models::response::Response;
use actix_session::Session;
use actix_web::http::header::ContentType;
use actix_web::{post, web, HttpRequest, HttpResponse, Result};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone, Eq, PartialEq)]
pub struct LoginForm {
    pub email: String,
    pub password: String,
}

#[rustfmt::skip]
#[post("/api/auth/login")]
pub async fn login(request: HttpRequest, req: Session, claims: Claims, db: web::Data<DB>, form: web::Json<LoginForm>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let db = &db.0;
    if claims.is_valid() {
            let response = Response::<String>::from_success("Already logged in");
            return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        }
    let user = entity::users::Entity::find().filter(entity::users::Column::Email.eq(&form.email)).one(db).await?;
    if let Some(user) = user {
    let client_info = request.connection_info();
    let client_ip = String::from(client_info.realip_remote_addr().unwrap_or("<unknown>"));
           if user.verify_password(&form.password) {
            let token = create_jwt(&user.email);
              req.insert("token", token.clone())?;
              req.insert("user_id", user.id)?;
              req.insert("ip", client_ip)?;
              req.insert("exp",chrono::Local::now() + chrono::Duration::days(7))?;
            let response = Response::<String>::from_success("successfully logged in");
             Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(response))
        } else {
            let response = Response::<String>::from_error("Invalid password");
            return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        }
    } else {
        let response = Response::<String>::from_error("User not found");
        return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
    }
}

#[rustfmt::skip]
#[post("/api/auth/logout")]
pub async fn logout(session: Session) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    session.purge();
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).json(Response::<String>::from_success("successfully logged out")))
}
