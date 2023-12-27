use actix_cors::Cors;
use actix_web::{
    middleware,
    web::{Data, JsonConfig},
    App, HttpServer,
};
use scan_mvcf::{
    app_config::DB,
    controllers::{locations_controller, residents_controller, timestamps_controller},
};
use std::io;

#[actix_web::main]
async fn main() -> io::Result<()> {
    std::env::set_var("RUST_LOG", "debug");
    env_logger::init();
    dotenvy::dotenv().ok();
    let ip = std::env::var("LOCAL_IP").unwrap_or("localhost".to_string());
    log::info!("starting Actix-Web HTTP server at http://{}", ip);
    let json_config = JsonConfig::default().limit(4096);
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
                .app_data(json_config.clone())
                .service(locations_controller::index)
                .service(locations_controller::show)
                .service(locations_controller::show_location_timestamps)
                .service(locations_controller::show_location_timestamps_range)
                .service(locations_controller::show_location_residents)
                .service(locations_controller::store)
                .service(residents_controller::index)
                .service(residents_controller::show)
                .service(residents_controller::show_resident_timestamps)
                .service(residents_controller::show_resident_timestamps_range)
                .service(residents_controller::store)
                .service(residents_controller::destroy)
                .service(residents_controller::update)
                .service(timestamps_controller::index_timestamps)
                .service(timestamps_controller::show_range)
                .service(timestamps_controller::store_timestamp)
                .wrap(middleware::Logger::default())
                .wrap(cors)
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
