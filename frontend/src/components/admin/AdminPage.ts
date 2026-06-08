import { API_BASE } from "../../configs/appConfig";
import { connectAsSeedAdmin } from "../../services/authService";
import { loadConditions } from "../../services/conditionService";
import { submitAdminCreate } from "../../services/adminCreateService";
import { adminState } from "../../states/adminState";
import { serializeForm } from "../../utils/form";
import { toast } from "../common/toast";
import { formSpecs } from "./formSpecs";

export function renderAdminPage(root: HTMLDivElement): void {
  const specs = formSpecs();
  const current = specs.find((spec) => spec.id === adminState.activeForm) || specs[0];

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>Admin Tools</strong>
          <span>Tao giai, race, round</span>
        </div>
        <nav class="nav">
          ${specs.map((spec) => `<button class="${adminState.activeForm === spec.id ? "active" : ""}" data-form="${spec.id}">${spec.title}</button>`).join("")}
        </nav>
        <div class="userbox">
          <strong>${adminState.token ? "Da ket noi" : "Chua ket noi"}</strong>
          <span>${adminState.connectionStatus}</span>
          <button class="ghost-btn" id="connectBtn">Ket noi lai</button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${current.title}</h1>
            <p class="muted">${current.description}</p>
          </div>
          <button class="btn secondary" id="reloadBtn">Tai lai dieu kien</button>
        </header>
        <section class="panel">
          <div class="row" style="margin-bottom:12px">
            <span class="pill">${API_BASE}</span>
            <span class="${adminState.token ? "status" : "status bad"}">${adminState.connectionStatus}</span>
          </div>
          <form class="form form-grid" id="adminForm">
            ${current.fields}
            <button class="btn" type="submit" ${current.disabled ? "disabled" : ""}>Tao</button>
          </form>
          ${current.disabled ? `<p class="muted">Khong sua backend nen chuc nang nay can backend bo sung endpoint truoc khi dung duoc.</p>` : ""}
        </section>
      </main>
    </div>`;

  document.querySelectorAll<HTMLButtonElement>("[data-form]").forEach((button) => {
    button.onclick = () => {
      adminState.activeForm = button.dataset.form || "tournament";
      renderAdminPage(root);
    };
  });

  document.querySelector<HTMLButtonElement>("#reloadBtn")!.onclick = async () => {
    adminState.conditions = await loadConditions();
    renderAdminPage(root);
  };

  document.querySelector<HTMLButtonElement>("#connectBtn")!.onclick = async () => {
    await connectAsSeedAdmin();
    adminState.conditions = await loadConditions();
    renderAdminPage(root);
  };

  document.querySelector<HTMLFormElement>("#adminForm")!.onsubmit = async (event) => {
    event.preventDefault();
    if (!current.endpoint || current.disabled) return;

    try {
      await submitAdminCreate(current.endpoint, serializeForm(event.currentTarget as HTMLFormElement));
      toast(current.success);
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error) {
      toast((error as Error).message, true);
    }
  };
}
