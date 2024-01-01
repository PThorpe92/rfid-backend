import { ServerResponse } from "../models/models";

export class API {
  public static url = import.meta.env.VITE_BACKEND_ADDR;
  public static port = import.meta.env.VITE_BACKEND_PORT;
  public static fullUrl = `http://${this.url}:${this.port}/api/`;

  public static headers = {
    accept: "application/json",
    "Content-Type": "application/json"
  };

  public static photoHeaders = {
    accept: "application/json",
    "Content-Type": "image/jpeg"
  };

  static async GET(uri: string): Promise<ServerResponse | undefined> {
    try {
      const response = await fetch(this.fullUrl + uri, {
        method: "GET",
        headers: this.headers,
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      let retResp = response.json();
      return await retResp;
    } catch (err) {
      console.error("GET ERROR:", err);
      return undefined;
    }
  }

  static async PATCH(
    uri: string,
    payload: any,
  ): Promise<ServerResponse | undefined> {
    try {
      const response = await fetch(this.fullUrl + uri, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return await response.json();
    } catch (err) {
      console.error("PATCH ERROR:", err);
      return undefined;
    }
  }

  static async POST(uri: string, payload: any): Promise<ServerResponse | undefined> {
    try {
      const response = await fetch(this.fullUrl + uri, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return await response.json();
    } catch (err) {
      console.error("POST ERROR:", err);
      return undefined;
    }
  }

  static async UPLOAD(uri: string, payload: FormData): Promise<ServerResponse | undefined> {
    try {
      const response = await fetch(this.fullUrl + uri, {
        method: "POST",
        headers: {
          accept: "application/json",
        },
        body: payload,
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return await response.json();
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      return undefined;
    }
  }

  static async DELETE(uri: string): Promise<ServerResponse | undefined> {
    try {
      const response = await fetch(this.fullUrl + uri, {
        method: "DELETE",
        headers: this.headers,
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return await response.json();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      return undefined;
    }
  }
}
