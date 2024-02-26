export interface SResidentTimestamp {
  [key: string]: any;
  resident: SResident;
  timestamp: STimestamp;
}

export enum ExitType {
  Success,
  ImageError,
  ImageSuccess,
  Error,
  Cancel,
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

export interface SUser {
  [key: string]: string;
  username: string;
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
  ts?: string;
}

export interface ServerResponse {
  success: boolean;
  message?: string;
  data: SResident[] | STimestamp[] | SLocation[] | SResidentTimestamp[] | SUser[];
}
