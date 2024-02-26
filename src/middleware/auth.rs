use actix_session::SessionExt;
use actix_web::{Error, FromRequest};
use futures::future::{ok, Ready};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

pub static SECRET_KEY: OnceLock<String> = OnceLock::new();

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub valid: bool,
    pub sub: String,
    pub exp: usize,
}
impl Default for Claims {
    fn default() -> Self {
        Self {
            valid: false,
            sub: "".to_string(),
            exp: 0,
        }
    }
}

impl FromRequest for Claims {
    type Error = Error;
    type Future = Ready<Result<Claims, Error>>;

    #[rustfmt::skip]
    fn from_request(req: &actix_web::HttpRequest, _payload: &mut actix_web::dev::Payload) -> Self::Future {
        let session = req.get_session();
        if let Ok(Some(jwt)) = session.get::<String>("token") {
            if let Some(token) = validate_jwt(&jwt) {
                 ok(token)
            } else {
                ok(Claims::default())
            }
        } else {
              ok(Claims::default())
        } 
    }
}

pub fn create_jwt(sub: &str) -> String {
    let secret = SECRET_KEY.get_or_init(|| std::env::var("JWT_SECRET_KEY").unwrap_or("secret".to_string())).clone();
    let expiration = chrono::offset::Local::now() + chrono::Duration::days(1);
    let claims = Claims {
        valid: true,
        sub: sub.to_owned(),
        exp: expiration.timestamp_millis() as usize,
    };
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap();
    token
}
impl Claims {
    pub fn update_jwt(&self) -> String {
    let secret = SECRET_KEY.get_or_init(|| std::env::var("JWT_SECRET_KEY").unwrap_or("secret".to_string())).clone();
        let expiration = chrono::offset::Local::now() + chrono::Duration::days(1);
        let claims = Claims {
            valid: true,
            sub: self.sub.to_owned(),
            exp: expiration.timestamp_millis() as usize,
        };
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .unwrap();
        token
    }
}

pub fn validate_jwt(token: &str) -> Option<Claims> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(SECRET_KEY.get().unwrap().as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .ok()
}
