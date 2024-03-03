import { ServerResponse } from "../models/models";
import axios from "axios";
axios.defaults.withCredentials = true;

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

  public static async GET(uri: string): Promise<ServerResponse> {
    try {
      const response = await axios(this.fullUrl + uri, {
        method: "GET",
        headers: this.headers,
      });
      if (response.status !== 200) {
        return { success: false, message: `error: status ${response.status} ${response.statusText}`, data: [] };
      }
      let retResp = response.data;
      return retResp;
    } catch (err) {
      return { success: false, message: "error" + err, data: [] };
    }
  }

  public static async PATCH(
    uri: string,
    payload: any,
  ): Promise<ServerResponse> {
    try {
      const response = await axios(this.fullUrl + uri, {
        method: "PATCH",
        headers: this.headers,
        data: payload,
      });
      if (response.status !== 200 && response.status !== 201) {
        return { success: false, message: `error: status ${response.status} ${response.statusText}`, data: [] };
      }
      return response.data;
    } catch (err) {
      return { success: false, message: "error" + err, data: [] };
    }
  }

  public static async POST(uri: string, payload: any): Promise<ServerResponse> {
    try {
      const response = await axios(this.fullUrl + uri, {
        method: "POST",
        headers: this.headers,
        data: payload,
      });
      if (response.status !== 200 && response.status !== 201) {
        return { success: false, message: `error: status ${response.status} ${response.statusText}`, data: [] };
      }
      return response.data;
    } catch (err) {
      return { success: false, message: "error: " + err, data: [] };
    }
  }

  public static async UPLOAD(uri: string, payload: FormData): Promise<ServerResponse> {
    try {
      const response = await axios(this.fullUrl + uri, {
        method: "POST",
        headers: {
          accept: "application/json",
        },
        data: payload,
      });
      if (response.status !== 200) {
        return { success: false, message: `error: status ${response.status} ${response.statusText}`, data: [] };
      }
      return await response.data;
    } catch (err) {
      return { success: false, message: "error", data: [] };
    }
  }

  public static async DELETE(uri: string): Promise<ServerResponse> {
    try {
      const response = await axios(this.fullUrl + uri, {
        method: "DELETE",
        headers: this.headers,
      });
      if (response.status !== 200 && response.status !== 204) {
        return { success: false, message: `error: status ${response.status} ${response.statusText}`, data: [] };
      }
      return response.data;
    } catch (err) {
      return { success: false, message: "error", data: [] };
    }
  }
}
