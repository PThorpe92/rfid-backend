## RFID based attendance system built for MVCF. Point of sale, inventory and time clock system is in development.

__Rust: Actix-Web + SqlX/Sea-ORM__ - Backend

__Typescript: SolidJS/DaiseyUI__ - Frontend

Rust msrv: 1.76

Datebase: Postgres

This allows for the current locations of students to be monitored in real time across the facility, while providing a system of reports and analytics for administration. This requires RFID scanners with HID emulation to be used in the browser. An independent client for embedded RFID on an Raspberry Pi is in development.

Allows for data to be stored about students, the facility, accounts, attendance, and inventory items can be signed out to students. Time clock reports can be generated for payroll. This is a work in progress, many features are not yet fully implemented.

Certain parts are currently "hard-coded", but the `seed-data` directory can be altered to fit the needs of other facilities, the `locations` will have to be updated with the new locations of the facility, and the `` will have to be updated with the students that are attending the facility.

<img src="./examples/attendance.png" width=550px >

<img src="./examples/reports.png" width=550px >

To use this repository:

Create a `.env` file in the root directory with the following fields:

`HOST`
`PORT`
`DATABASE_URL` #example: `postgres://mvcf:dev@localhost:5432/mvcf_scanner`
`UPLOAD_FILE_PATH`= #recommended: .../{repository root}/frontend/imgs/

`JWT_SECRET_KEY="` #recommended: generate a key for the JWT for the auth

Upload filepath is because the front end is currently setup to look for images in the `frontened/imgs` directory. They are currently uploaded to the back-end,
which writes temp files then re-names them in the manner of `mv` to the value of the resident ID.png, in `UPLOAD_FILE_PATH` in the `.env` file

NOTE: This will not work if the directory is not on the same partition.

```bash

clone the repository 

run `docker compose up -d`

run `cargo run` in the root directory

cd into the `frontend` directory and run `npm install`

run `npm run dev` and `npx tailwindcss -o ./src/styles.css --watch` in separate terminals

```

TESTING: 
```bash
cd testapi

cargo test
```
