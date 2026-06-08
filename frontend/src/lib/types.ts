export type ApiObject = Record<string, unknown>;

export interface LoginResponse extends ApiObject {
  token?: string;
  accessToken?: string;
  jwt?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSpec {
  title: string;
  description: string;
  id: string;
  endpoint?: string;
  fields: string;
  success: string;
  method?: "POST";
  disabled?: boolean;
}
