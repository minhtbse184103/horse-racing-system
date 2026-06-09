import API_BASE_URL from '../configs/apiConfig';

interface HttpRequestOptions<TBody = unknown> {
  method?: string;
  body?: TBody;
  auth?: boolean;
  headers?: Record<string, string>;
  fallbackError?: string;
}

interface ErrorItem {
  defaultMessage?: string;
  message?: string;
}

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Horse name is required': 'Tên ngựa không được để trống.',
  'Age must be zero or positive': 'Tuổi ngựa phải lớn hơn hoặc bằng 0.',
  'Weight must be a positive number': 'Cân nặng phải lớn hơn 0.',
  'Weight is required': 'Cân nặng không được để trống.',
  'Horse has participated in at least one race and cannot be deleted.': 'Không thể xóa hồ sơ ngựa đã có lịch sử tham gia race hoặc kết quả thi đấu.',
  'User is not authenticated.': 'Bạn cần đăng nhập để tiếp tục.',
  'Only owners can access this resource.': 'Chỉ Horse Owner mới được truy cập chức năng này.',
  'Owner does not exist.': 'Không tìm thấy tài khoản chủ ngựa.',
  'Horse does not exist.': 'Không tìm thấy hồ sơ ngựa hoặc hồ sơ không thuộc quyền quản lý của bạn.',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Email already exists': 'Email đã tồn tại trong hệ thống.',
  'Role not found': 'Vai trò không hợp lệ.',
  'Account is not active': 'Tài khoản không ở trạng thái ACTIVE nên không thể đăng nhập.'
};

export function getStoredToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function translateMessage(message: string): string {
  return MESSAGE_TRANSLATIONS[message] || message;
}

function hasStringField(value: unknown, field: 'message' | 'error'): value is Record<typeof field, string> {
  return typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>)[field] === 'string';
}

function hasErrorsArray(value: unknown): value is { errors: ErrorItem[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { errors?: unknown }).errors)
  );
}

export function getErrorMessage(data: unknown, fallbackMessage = 'Có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return translateMessage(data);
  if (hasStringField(data, 'message')) return translateMessage(data.message);
  if (hasStringField(data, 'error')) return translateMessage(data.error);

  if (hasErrorsArray(data) && data.errors.length > 0) {
    return data.errors
      .map((error) => translateMessage(error.defaultMessage || error.message || String(error)))
      .join('\n');
  }

  return fallbackMessage;
}

function parseResponseBody(text: string): unknown {
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export async function httpRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  options: HttpRequestOptions<TBody> = {}
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    fallbackError = 'Có lỗi xảy ra. Vui lòng thử lại.'
  } = options;

  const requestHeaders: Record<string, string> = { ...headers };

  if (!isFormData(body)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Bạn chưa đăng nhập hoặc token đã hết hạn.');
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders
  };

  if (body !== undefined) {
    fetchOptions.body = isFormData(body) || typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (response.status === 204) {
    if (!response.ok) throw new Error(fallbackError);
    return null as TResponse;
  }

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackError));
  }

  return data as TResponse;
}
