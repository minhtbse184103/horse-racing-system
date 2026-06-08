import type { ApiObject } from "../lib/types";

export interface AdminState {
  token: string;
  activeForm: string;
  conditions: ApiObject[];
  connectionStatus: string;
}

export const adminState: AdminState = {
  token: localStorage.getItem("token") || "",
  activeForm: "tournament",
  conditions: [],
  connectionStatus: "Dang ket noi backend...",
};

export function setAdminToken(token: string): void {
  adminState.token = token;
  token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
}
