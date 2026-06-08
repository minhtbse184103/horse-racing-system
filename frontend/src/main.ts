import "../styles.css";
import { renderAdminPage } from "./components/admin/AdminPage";
import { connectAsSeedAdmin } from "./services/authService";
import { loadConditions } from "./services/conditionService";
import { adminState } from "./states/adminState";

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (!rootElement) throw new Error("Missing #app");
const root: HTMLDivElement = rootElement;

async function start(): Promise<void> {
  await connectAsSeedAdmin();
  adminState.conditions = await loadConditions();
  renderAdminPage(root);
}

void start();
