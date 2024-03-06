#[cfg(test)]
pub mod testapi {

    use reqwest::blocking::Response;
    use serde_json::{json, Value};
    use std::{collections::HashMap, time::Duration};

    fn make_request(
        endpoint: &str,
        method: reqwest::Method,
        body: Option<HashMap<&str, &str>>,
    ) -> Response {
        let ip = std::env::var("LOCAL_IP").unwrap_or("127.0.0.1".to_string());
        let ip = format!("{ip}:8080");
        let client = reqwest::blocking::Client::new();
        let url = format!("http://{ip}/api/{endpoint}");
        let request_builder = match method {
            reqwest::Method::GET => client.get(&url),
            reqwest::Method::POST => client.post(&url).json(&body.unwrap()),
            reqwest::Method::PATCH => client.patch(&url).json(&body.unwrap()),
            reqwest::Method::DELETE => client.delete(&url),
            _ => panic!("Unsupported HTTP method"),
        };

        request_builder
            .timeout(Duration::from_millis(500))
            .send()
            .expect("Failed to execute request")
    }

    #[test]
    fn test_residents_index() {
        let response = make_request("residents", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
    }
    #[test]
    fn test_residents_show() {
        let resident_id = "111111111111111";

        let response = make_request(
            format!("residents/{}", resident_id).as_str(),
            reqwest::Method::GET,
            None,
        );
        assert_eq!(response.status().as_u16(), 200);
    }
    #[test]
    fn test_residents_create() {
        let ip = std::env::var("LOCAL_IP").unwrap_or("localhost".to_string());
        let ip = format!("http://{}:8080/api", ip);
        let fake_location = json!({"rfid": "338888222889999", "name": "Fake resident", "doc": 29752, "room": "C-8", "unit": 4, "current_location": 4, "level": 4});
        let resp = reqwest::blocking::Client::new()
            .post(format!("{}/residents", ip))
            .json(&fake_location)
            .timeout(Duration::from_millis(20))
            .send()
            .expect("Failed to execute request");

        assert_eq!(resp.status().as_u16(), 200);
    }
    #[test]
    fn test_residents_update() {
        let resident_id = "111111111111111";
        let updated_data = [("name", "Updated Name")].iter().cloned().collect();
        let response = make_request(
            &format!("residents/{}", resident_id),
            reqwest::Method::PATCH,
            Some(updated_data),
        );
        assert_eq!(response.status().as_u16(), 200);
        assert_eq!(
            response.json::<Value>().unwrap()["data"]["name"],
            "Updated Name"
        );
    }

    #[test]
    fn test_residents_delete() {
        let resident_id = "111111111111111";
        let response = make_request(
            &format!("residents/{}", resident_id),
            reqwest::Method::DELETE,
            None,
        );
        assert_eq!(response.status().as_u16(), 200);
    }

    #[test]
    fn test_locations_index() {
        let response = make_request("locations", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
    }
    #[test]
    fn test_locations_show() {
        let response = make_request("locations/4", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
        assert_eq!(response.json::<Value>().unwrap()["data"][0]["name"], "ASU");
    }
    #[test]
    fn test_locations_create() {
        let ip: &str =
            &std::env::var("LOCAL_IP").unwrap_or("http://localhost:8080/api".to_string());
        let ip = format!("http://{}:8080/api", ip);
        let fake_location = json!({"id": 69, "name": "Fake Location", "level": 2});
        let resp = reqwest::blocking::Client::new()
            .post(format!("{}/locations", ip))
            .json(&fake_location)
            .timeout(Duration::from_millis(20))
            .send()
            .expect("Failed to execute request");
        assert_eq!(resp.status().as_u16(), 200);
    }

    #[test]
    fn test_locations_timestamps() {
        let response = make_request("locations/8/timestamps", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
        assert!(response.json::<Value>().unwrap()["data"].is_array());
    }

    #[test]
    fn test_locations_timestamps_between() {
        let response = make_request(
            "timestamps?range=2023-11-10;2023-11-30&location=8",
            reqwest::Method::GET,
            None,
        );
        assert_eq!(response.status().as_u16(), 200);
        for item in response.json::<Value>().unwrap()["data"]
            .as_array()
            .unwrap()
        {
            assert_eq!(item["location"], 8);
        }
    }
    #[test]
    fn test_locations_residents() {
        let response = make_request("locations/8/residents", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
        for item in response.json::<Value>().unwrap()["data"]
            .as_array()
            .unwrap()
        {
            assert_eq!(item["unit"], 8);
        }
    }

    #[test]
    fn test_timestamps_index() {
        // TestTimestampsController
        let response = make_request("timestamps", reqwest::Method::GET, None);
        assert_eq!(response.status().as_u16(), 200);
    }

    #[test]
    fn test_residents_location_current() {
        // TestTimestampsController
        let response = make_request(
            "locations/13/residents?active_scan=true",
            reqwest::Method::GET,
            None,
        );
        assert_eq!(response.status().as_u16(), 200);
        for item in response.json::<Value>().unwrap()["data"]
            .as_array()
            .unwrap()
        {
            assert_eq!(item["current_location"], 13);
        }
    }

    #[test]
    fn test_timestamps_post() {
        let mut body = HashMap::new();
        body.insert("rfid", "111111111111111");
        body.insert("location", "9");
        let response = make_request("/timestamps", reqwest::Method::POST, Some(body));
        assert_eq!(response.status().as_u16(), 201);
    }
    #[test]
    fn test_timestamps_between() {
        let response = make_request(
            "timestamps?range=2023-11-18;2023-11-30",
            reqwest::Method::GET,
            None,
        );
        assert_eq!(response.status().as_u16(), 200);
    }
}
