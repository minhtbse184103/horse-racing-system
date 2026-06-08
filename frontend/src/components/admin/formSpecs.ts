import { field, selectField } from "../common/fields";
import { adminState } from "../../states/adminState";
import type { ApiObject, FormSpec, SelectOption } from "../../lib/types";

function conditionOptions(): SelectOption[] {
  return adminState.conditions.map((condition: ApiObject) => {
    const id = condition.conditionId ?? condition.conditionID ?? condition.id ?? "";
    const label = condition.conditionName ?? `Condition ${id}`;
    return { value: String(id), label: String(label) };
  });
}

export function formSpecs(): FormSpec[] {
  return [
    {
      title: "Tao giai dau",
      description: "Gui du lieu toi POST /api/tournaments.",
      id: "tournament",
      endpoint: "/api/tournaments",
      success: "Tao giai dau thanh cong.",
      fields: `
        ${field("tournamentName", "Ten giai dau", "text", "", "required")}
        ${field("location", "Dia diem", "text", "", "required")}
        ${field("startDate", "Ngay bat dau", "date", "", "required")}
        ${field("endDate", "Ngay ket thuc", "date", "", "required")}
        ${field("registrationDeadline", "Han dang ky", "date", "", "required")}
        ${field("minParticipants", "So nguoi toi thieu", "number", "2", "required min='1'")}
        ${field("maxParticipants", "So nguoi toi da", "number", "8", "required min='1'")}
        ${selectField("conditionId", "Dieu kien giai dau", conditionOptions())}
      `,
    },
    {
      title: "Tao race",
      description: "Gui du lieu toi POST /api/races.",
      id: "race",
      endpoint: "/api/races",
      success: "Tao race thanh cong.",
      fields: `
        ${field("roundId", "Round ID", "number", "", "required min='1'")}
        ${field("startTime", "Gio bat dau", "datetime-local", "", "required")}
        ${field("endTime", "Gio ket thuc", "datetime-local", "", "required")}
        ${field("distance", "Cu ly", "number", "1000", "required min='1'")}
      `,
    },
    {
      title: "Tao round",
      description: "Backend hien chua co endpoint POST cho /api/tournament-rounds.",
      id: "round",
      success: "",
      disabled: true,
      fields: `
        ${field("tournamentId", "Tournament ID", "number", "", "disabled")}
        ${field("roundName", "Ten round", "text", "", "disabled")}
        ${field("roundOrder", "Thu tu round", "number", "", "disabled")}
        <label>Trang thai<input value="Khong the gui vi backend chua ho tro tao round" disabled></label>
      `,
    },
  ];
}
