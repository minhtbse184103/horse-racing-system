import { seedAdmin } from "../configs/seedAdmin";
import { loginAdmin } from "../api/adminApi";
import { adminState, setAdminToken } from "../states/adminState";

export async function connectAsSeedAdmin(): Promise<void> {
  try {
    const result = await loginAdmin(seedAdmin.email, seedAdmin.password);
    const token = String(result.token || result.accessToken || result.jwt || "");
    if (!token) throw new Error("Backend khong tra token admin.");

    setAdminToken(token);
    adminState.connectionStatus = `Da ket noi ADMIN: ${seedAdmin.email}`;
  } catch (error) {
    setAdminToken("");
    adminState.connectionStatus = `Chua ket noi duoc admin: ${(error as Error).message}`;
  }
}
