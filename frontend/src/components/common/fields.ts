import type { SelectOption } from "../../lib/types";

export function field(name: string, label: string, type = "text", value = "", extra = ""): string {
  return `<label>${label}<input name="${name}" type="${type}" value="${value}" ${extra}></label>`;
}

export function selectField(name: string, label: string, options: SelectOption[]): string {
  const content = options.length
    ? options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")
    : `<option value="">Khong co du lieu</option>`;

  return `<label>${label}<select name="${name}" required>${content}</select></label>`;
}
