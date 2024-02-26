use crate::app_config::DB;
use crate::middleware::auth::{create_jwt, Claims};
use crate::models::response::Response;
use actix_session::{Session, SessionExt};
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
#[post("/login")]
pub async fn login(request: HttpRequest, req: web::Data<Session>, claims: web::Data<Claims>, db: web::Data<DB>, form: web::Json<LoginForm>) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let client_ip = request.connection_info();
    let client_ip = client_ip.realip_remote_addr().unwrap_or("<unknown>");
    let db = &db.0;
    let claims = claims.into_inner();
    if claims.valid {
            let response = Response::<String>::from_error("Already logged in");
            return Ok(HttpResponse::Ok()
            .insert_header(ContentType::json())
            .json(response));
        } else {
    let user = entity::users::Entity::find().filter(entity::users::Column::Email.eq(&form.email)).one(db).await?;
    if let Some(user) = user {
           if user.verify_password(&form.password) {
            let token = create_jwt(&user.email);
              req.insert("token", token.clone())?;
              req.insert("user_id", user.id)?;
              req.insert("ip", client_ip)?;
              req.insert("exp",chrono::Local::now() + chrono::Duration::days(7))?;
             Ok(HttpResponse::Ok().body(String::from("successfully logged in")))
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
}

#[rustfmt::skip]
#[post("/logout")]
pub async fn logout(req: HttpRequest) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    let session = req.get_session();
    session.purge();
    Ok(HttpResponse::Ok().body("successfully logged out"))
}
