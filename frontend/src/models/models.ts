export interface SResidentTimestamp {
  [key: string]: any;
  id: number;
  doc: number,
  name: string,
  location: number,
  unit: number,
  ts: string,
  level: number
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
  doc: number;
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
  doc: number;
  location: number;
  ts?: string;
}
export interface SItem {
  [key: string]: string | number;
  id: number;
  upc: string;
  name: string;
  price: number;
  quantity: number;
}

// we get this back
export interface STransaction {
  [key: string]: string | number | string[];
  id: number;
  residentDoc: number;
  total: number;
}

// we send this to the server
export interface PostTransaction {
  [key: string]: string | number | string[];
  id: number;
  residentId: number;
  accountId: number;
  total: number;
  // these are UPCs
  items: string[];
}

export interface ServerResponse {
  success: boolean;
  message?: string;
  data: SResident[] | STimestamp[] | SLocation[] | SResidentTimestamp[] | SUser[] | SItem[] | STransaction[];
}
