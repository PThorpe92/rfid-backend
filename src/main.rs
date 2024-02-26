use actix_cors::Cors;
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{
    cookie::Key,
    middleware,
    web::{Data, JsonConfig},
    App, HttpServer,
};
use scan_mvcf::{
    app_config::DB,
    controllers::{
        accounts_controller, auth_controller, locations_controller, residents_controller,
        timestamps_controller,
    },
    middleware::auth::SECRET_KEY,
};
use std::io;

#[actix_web::main]
async fn main() -> io::Result<()> {
    std::env::set_var("RUST_LOG", "debug");
    env_logger::init();
    dotenvy::dotenv().ok();
    let upload_dir = std::env::var("UPLOAD_FILE_PATH");
    log::debug!(
        "Temp file path: {:?}",
        upload_dir.clone().unwrap_or("dumb".to_string())
    );
    let key = Key::derive_from(
        SECRET_KEY
            .get_or_init(|| std::env::var("JWT_SECRET_KEY").unwrap())
            .as_bytes(),
    );
    let ip = std::env::var("LOCAL_IP").unwrap_or("localhost".to_string());
    log::info!("starting Actix-Web HTTP server at http://{}", ip);
    let json_config = JsonConfig::default().limit(4096);
    let tempfile_path = actix_multipart::form::tempfile::TempFileConfig::default();
    let tempfile_path = tempfile_path.directory(upload_dir.unwrap_or_default());
    if let Ok(db) = DB::get().await {
        log::info!("Connected to database");

        HttpServer::new(move || {
            let cors = Cors::permissive()
                .allow_any_origin()
                .allow_any_header()
                .allow_any_method()
                .block_on_origin_mismatch(false)
                .max_age(3600);

            App::new()
                .app_data(Data::new(db.clone()))
                .app_data(Data::new(tempfile_path.clone()))
                .app_data(json_config.clone())
                .service(locations_controller::index)
                .service(locations_controller::show)
                .service(locations_controller::show_location_timestamps)
                .service(locations_controller::show_location_timestamps_range)
                .service(locations_controller::show_location_residents)
                .service(locations_controller::store)
                .service(locations_controller::update)
                .service(locations_controller::destroy)
                .service(residents_controller::index)
                .service(residents_controller::show)
                .service(residents_controller::show_resident_timestamps)
                .service(residents_controller::show_resident_timestamps_range)
                .service(residents_controller::store)
                .service(residents_controller::destroy)
                .service(residents_controller::update)
                .service(residents_controller::upload_jpg)
                .service(timestamps_controller::index_timestamps)
                .service(timestamps_controller::store_timestamp)
                .service(auth_controller::login)
                .service(auth_controller::logout)
                .service(accounts_controller::get_all_transactions)
                .service(accounts_controller::index_accounts)
                .service(accounts_controller::show_account)
                .service(accounts_controller::create_account_transaction)
                .service(accounts_controller::show_account_transactions)
                .wrap(middleware::Logger::default())
                .wrap(cors)
                .wrap(SessionMiddleware::new(
                    CookieSessionStore::default(),
                    key.clone(),
                ))
        })
        .bind((ip, 8080))?
        .workers(4)
        .run()
        .await
    } else {
        log::error!("Failed to connect to database");
        Ok(())
    }
}
