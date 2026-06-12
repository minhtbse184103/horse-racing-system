import API_BASE_URL from '../configs/apiConfig';

const MESSAGE_TRANSLATIONS = {
  'Horse name is required': 'Tên ngựa là bắt buộc.',
  'Age must be zero or positive': 'Age must be zero or positive.',
  'Weight must be a positive number': 'Weight must be a positive number.',
  'Weight is required': 'Cân nặng là bắt buộc.',
  'Horse has participated in at least one race and cannot be deleted.': 'Horse has participated in at least one race and cannot be deleted.',
  'User is not authenticated.': 'You must sign in to continue.',
  'Only owners can access this resource.': 'Only horse owners can access this feature.',
  'Owner does not exist.': 'Owner account was not found.',
  'Horse does not exist.': 'Horse profile was not found or does not belong to your account.',
  'Invalid email or password': 'Invalid email or password.',
  'Email already exists': 'Email already exists.',
  'Role not found': 'Role is invalid.',
  'Account is not active': 'Account is not ACTIVE and cannot sign in.',
  'Horse name must be between 2 and 100 characters': 'Tên ngựa phải có từ 2 đến 100 ký tự.',
  'Horse name contains invalid characters': 'Tên ngựa chứa ký tự không hợp lệ.',
  'Breed is required': 'Giống ngựa là bắt buộc.',
  'Breed must be between 2 and 100 characters': 'Tên giống ngựa phải có từ 2 đến 100 ký tự.',
  'Breed contains invalid characters': 'Tên giống ngựa chứa ký tự không hợp lệ.',
  'Gender is required': 'Gender is required.',
  'Gender must be MALE or FEMALE': 'Gender must be MALE or FEMALE.',
  'Color is required': 'Màu lông là bắt buộc.',
  'Color must be between 2 and 50 characters': 'Màu lông phải có từ 2 đến 50 ký tự.',
  'Color contains invalid characters': 'Màu lông chứa ký tự không hợp lệ.',
  'Date of birth is required': 'Ngày sinh là bắt buộc.',
  'Date of birth must be today or in the past': 'Ngày sinh phải là hôm nay hoặc một ngày trong quá khứ.',
  'Horse weight must be at least 200 kg': 'Horse weight must be at least 200 kg.',
  'Horse weight must not exceed 1000 kg': 'Horse weight must not exceed 1000 kg.',
  'Health certificate expiry is required': 'Ngày hết hạn chứng nhận sức khỏe là bắt buộc.',
  'Health certificate expiry must be today or in the future': 'Ngày hết hạn chứng nhận sức khỏe phải là hôm nay hoặc một ngày trong tương lai.',
  'Status is required': 'Status is required.',
  'Status must be ACTIVE or INACTIVE': 'Status must be ACTIVE or INACTIVE.',
  'Image URL is required': 'Profile image is required.',
  'Image URL must be a valid HTTP or HTTPS URL': 'Profile image must be a local imported asset or a valid image URL.',
  'Tournament name is required': 'Tournament name is required.',
  'Location is required': 'Location is required.',
  'Start date is required': 'Start date is required.',
  'End date is required': 'End date is required.',
  'Registration deadline is required': 'Registration deadline is required.',
  'Minimum participants is required': 'Minimum participants is required.',
  'Minimum participants must be positive': 'Minimum participants must be positive.',
  'Maximum participants is required': 'Maximum participants is required.',
  'Maximum participants must be positive': 'Maximum participants must be positive.',
  'Tournament condition is required': 'Tournament condition is required.',
  'Start date cannot be after end date.': 'Start date cannot be after end date.',
  'Registration deadline cannot be after start date.': 'Registration deadline cannot be after start date.',
  'Minimum participants cannot be greater than maximum participants.': 'Minimum participants cannot be greater than maximum participants.',
  'Tournament condition does not exist.': 'Tournament condition does not exist.',
  'Tournament already exists at this location with the same start date and end date.': 'Tournament already exists at this location with the same start date and end date.',
  'Only draft tournaments can be opened for registration.': 'Only DRAFT tournaments can be opened for registration.',
  'Tournament start date must not have passed.': 'Tournament start date must not have passed.',
  'Tournament registration deadline must not have passed.': 'Tournament registration deadline must not have passed.',
  'Tournament participant limits are invalid.': 'Tournament participant limits are invalid.',
  'Tournament must have the required draft rounds before registration can open.': 'Tournament must have the required draft rounds before registration can open.',
  'Tournament id is required': 'Vui lòng chọn giải đấu.',
  'Horse id is required': 'Vui lòng chọn ngựa.',
  'Jockey id is required': 'Vui lòng chọn nài ngựa.',
  'Expired time must be in the future': 'Invitation response deadline must be in the future.',
  'Only active horses can be invited.': 'Only ACTIVE horses can be invited.',
  'Only active horses can be registered.': 'Only ACTIVE horses can be registered.',
  'Tournament does not exist.': 'Tournament was not found.',
  'Jockey does not exist.': 'Jockey was not found.',
  'Jockey is not active.': 'Jockey is not ACTIVE yet.',
  'Selected jockey account is not active.': 'Selected jockey account is not active.',
  'Selected jockey profile is not active.': 'Selected jockey profile is not active.',
  'Invitation does not exist.': 'Invitation was not found.',
  'Invitation is not pending.': 'Invitation is no longer PENDING.',
  'Only pending invitations can be responded to.': 'Only PENDING invitations can be responded to.',
  'Invitation has expired.': 'Invitation has expired.',
  'License number is required': 'License number is required.',
  'License number must be between 5 and 50 characters': 'License number must be between 5 and 50 characters.',
  'License number may contain only letters, numbers and hyphens': 'License number may contain only letters, numbers, and hyphens.',
  'Jockey weight must be at least 35 kg': 'Jockey weight must be at least 35 kg.',
  'Jockey weight must not exceed 90 kg': 'Jockey weight must not exceed 90 kg.',
  'Ranking is required': 'Ranking is required.',
  'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE': 'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL, or ELITE.',
  'Jockey profile does not exist.': 'Jockey profile does not exist.',
  'Profile does not exist.': 'Jockey profile does not exist.',
  'Jockey profile already exists.': 'Jockey profile already exists.',
  'License number already exists.': 'License number already exists.',
  'Only active jockey profiles can accept invitations.': 'Only ACTIVE jockey profiles can accept invitations.',
  'Only active jockey accounts can accept invitations.': 'Only ACTIVE jockey accounts can accept invitations.',
  'Horse name already exists.': 'Horse name already exists.',
  'Only pending horses can be approved.': 'Only PENDING horses can be approved.',
  'Only pending horses can be rejected.': 'Only PENDING horses can be rejected.'
};

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function translateMessage(message) {
  return MESSAGE_TRANSLATIONS[message] || message;
}

function hasStringField(value, field) {
  return typeof value === 'object' && value !== null && typeof value[field] === 'string';
}

function hasErrorsArray(value) {
  return typeof value === 'object' && value !== null && Array.isArray(value.errors);
}

export function getErrorMessage(data, fallbackMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
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

function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export async function httpRequest(path, options = {}) {
  const { method = 'GET', body, auth = true, headers = {}, fallbackError = 'Đã xảy ra lỗi. Vui lòng thử lại.' } = options;
  const requestHeaders = { ...headers };

  if (!isFormData(body)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData(body) ? body : JSON.stringify(body)
  });

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackError));
  }

  return data;
}
