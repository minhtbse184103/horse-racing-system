export function toast(message: string, bad = false): void {
  const node = document.createElement("div");
  node.className = "toast";
  node.style.background = bad ? "var(--danger)" : "#17241f";
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 3200);
}
