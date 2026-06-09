import API_BASE_URL from '../configs/apiConfig';

type ResponseData = Record<string, any> | string | null;

interface HttpRequestOptions extends Omit<RequestInit, 'body' | 'headers' | 'method'> {
  method?: string;
  body?: any;
  auth?: boolean;
  headers?: Record<string, string>;
  fallbackError?: string;
}

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}


const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Horse name is required': 'Tên ngựa không được để trống.',
  'Age must be zero or positive': 'Tuổi ngựa phải lớn hơn hoặc bằng 0.',
  'Weight must be a positive number': 'Cân nặng phải lớn hơn 0.',
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

function translateMessage(message: unknown) {
  if (!message || typeof message !== 'string') return message;
  return MESSAGE_TRANSLATIONS[message] || message;
}

export function getErrorMessage(data: any, fallbackMessage = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return translateMessage(data);
  if (typeof data.message === 'string') return translateMessage(data.message);
  if (typeof data.error === 'string') return translateMessage(data.error);
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((error: any) => translateMessage(error.defaultMessage || error.message || String(error)))
      .join('\n');
  }
  return fallbackMessage;
}

function parseResponseBody(text: string): ResponseData {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function httpRequest<T = any>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    fallbackError = 'Có lỗi xảy ra. Vui lòng thử lại.'
  } = options;

  const requestHeaders = { ...headers };

  if (!(body instanceof FormData)) {
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
    fetchOptions.body = body instanceof FormData || typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (response.status === 204) {
    if (!response.ok) throw new Error(fallbackError);
    return null as T;
  }

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackError));
  }

  return data as T;
}
