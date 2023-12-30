
/**
 * This is the model for data returned about
 * a resident and their location. As seen by the server.
 * */
export interface STimestampResident {
  [key: string]: string | number;
  rfid: string;
  name: string;
  doc: string;
  room: string;
  unit: number;
  timestampLeft: string;
  location: number;
  destinationLabel: string; // The idea is this comes from the Timestamp destinationId, and is resolved to a location name
}

export interface SResident {
  [key: string]: string | number;
  current_location: number;
  rfid: string;
  name: string;
  doc: string;
  room: string; // Pod + room + bunk
  unit: number; // Unit ID
  level: number;
}

export interface SLocation {
  [key: string]: string | number;
  id: number;
  name: string;
  level: number;
}

export interface STimestamp {
  [key: string]: string | number | undefined;
  rfid: string;
  location: number;
  time?: string;
}

export interface ServerResponse {
  success: boolean;
  message?: string;
  data?: SResident[] | STimestamp[] | SLocation[];
}
