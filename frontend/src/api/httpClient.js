import API_BASE_URL from '../configs/apiConfig';

const MESSAGE_TRANSLATIONS = {
  'Horse name is required': 'Tên ngựa là bắt buộc.',
  'Age must be zero or positive': 'Tuổi phải là số không âm.',
  'Weight must be a positive number': 'Cân nặng phải là số dương.',
  'Weight is required': 'Cân nặng là bắt buộc.',
  'Horse has participated in at least one race and cannot be deleted.': 'Ngựa đã tham gia ít nhất một cuộc đua và không thể bị xóa.',
  'User is not authenticated.': 'Bạn phải đăng nhập để tiếp tục.',
  'Only owners can access this resource.': 'Chỉ chủ ngựa mới có thể truy cập tính năng này.',
  'Owner does not exist.': 'Tài khoản chủ ngựa không tồn tại.',
  'Horse does not exist.': 'Hồ sơ ngựa không tồn tại hoặc không thuộc về tài khoản của bạn.',
  'Invalid email or password': 'Email hoặc mật khẩu không hợp lệ.',
  'Email already exists': 'Email đã tồn tại.',
  'Role not found': 'Vai trò không hợp lệ.',
  'Account is not active': 'Tài khoản không hoạt động và không thể đăng nhập.',
  'Horse name must be between 2 and 100 characters': 'Tên ngựa phải có từ 2 đến 100 ký tự.',
  'Horse name contains invalid characters': 'Tên ngựa chứa ký tự không hợp lệ.',
  'Breed is required': 'Giống ngựa là bắt buộc.',
  'Breed must be between 2 and 100 characters': 'Tên giống ngựa phải có từ 2 đến 100 ký tự.',
  'Breed contains invalid characters': 'Tên giống ngựa chứa ký tự không hợp lệ.',
  'Gender is required': 'Giới tính là bắt buộc.',
  'Gender must be MALE or FEMALE': 'Giới tính phải là Đực hoặc Cái.',
  'Color is required': 'Màu lông là bắt buộc.',
  'Color must be between 2 and 50 characters': 'Màu lông phải có từ 2 đến 50 ký tự.',
  'Color contains invalid characters': 'Màu lông chứa ký tự không hợp lệ.',
  'Date of birth is required': 'Ngày sinh là bắt buộc.',
  'Date of birth must be today or in the past': 'Ngày sinh phải là hôm nay hoặc một ngày trong quá khứ.',
  'Horse weight must be at least 200 kg': 'Cân nặng ngựa phải ít nhất 200 kg.',
  'Horse weight must not exceed 1000 kg': 'Cân nặng ngựa không được vượt quá 1000 kg.',
  'Health certificate expiry is required': 'Ngày hết hạn chứng nhận sức khỏe là bắt buộc.',
  'Health certificate expiry must be today or in the future': 'Ngày hết hạn chứng nhận sức khỏe phải là hôm nay hoặc một ngày trong tương lai.',
  'Status is required': 'Status là bắt buộc.',
  'Status must be ACTIVE or INACTIVE': 'Status must be ACTIVE or INACTIVE.',
  'Image URL is required': 'Hình ảnh hồ sơ là bắt buộc.',
  'Image URL must be a valid HTTP or HTTPS URL': 'Hình ảnh hồ sơ phải là một tài nguyên được nhập khẩu cục bộ hoặc một URL hình ảnh hợp lệ.',
  'Tournament name is required': 'Tên giải đấu là bắt buộc.',
  'Location is required': 'Địa điểm là bắt buộc.',
  'Start date is required': 'Ngày bắt đầu là bắt buộc.',
  'End date is required': 'Ngày kết thúc là bắt buộc.',
  'Registration deadline is required': 'Hạn đăng ký là bắt buộc.',
  'Minimum participants is required': 'Số lượng người tham gia tối thiểu là bắt buộc.',
  'Minimum participants must be positive': 'Số lượng người tham gia tối thiểu phải là số dương.',
  'Maximum participants is required': 'Số lượng người tham gia tối đa là bắt buộc.',
  'Maximum participants must be positive': 'Số lượng người tham gia tối đa phải là số dương.',
  'Tournament condition is required': 'Điều kiện giải đấu là bắt buộc.',
  'Start date cannot be after end date.': 'Ngày bắt đầu không thể sau ngày kết thúc.',
  'Registration deadline cannot be after start date.': 'Hạn đăng ký không thể sau ngày bắt đầu.'
  'Minimum participants cannot be greater than maximum participants.': 'Số lượng người tham gia tối thiểu không thể lớn hơn số lượng người tham gia tối đa.',
  'Tournament condition does not exist.': 'Điều kiện giải đấu không tồn tại.',
  'Tournament already exists at this location with the same start date and end date.': 'Giải đấu đã tồn tại tại địa điểm này với cùng ngày bắt đầu và kết thúc.',
  'Only draft tournaments can be opened for registration.': 'Chỉ có thể mở đăng ký cho các giải đấu ở trạng thái bản nháp.',
  'Tournament start date must not have passed.': 'Ngày bắt đầu giải đấu không được quá hạn.',
  'Tournament registration deadline must not have passed.': 'Hạn đăng ký giải đấu không được quá hạn.',
  'Tournament participant limits are invalid.': 'Giới hạn người tham gia giải đấu không hợp lệ.',
  'Tournament must have the required draft rounds before registration can open.': 'Giải đấu phải có các vòng loại cần thiết trước khi đăng ký có thể mở.',
  'Tournament id is required': 'Vui lòng chọn giải đấu.',
  'Horse id is required': 'Vui lòng chọn ngựa.',
  'Jockey id is required': 'Vui lòng chọn nài ngựa.',
  'Expired time must be in the future': 'Hạn phản hồi lời mời phải trong tương lai.',
  'Only active horses can be invited.': 'Chỉ có thể mời những con ngựa đang ACTIVE.'
  'Only active horses can be registered.': 'Chỉ có thể đăng ký những con ngựa đang ACTIVE.',
  'Tournament does not exist.': 'Không tìm thấy giải đấu.',
  'Jockey does not exist.': 'Không tìm thấy nài ngựa.',
  'Jockey is not active.': 'Nài ngựa không ở trạng thái ACTIVE.',
  'Selected jockey account is not active.': 'Tài khoản nài ngựa đã chọn không ở trạng thái active.',
  'Selected jockey profile is not active.': 'Hồ sơ nài ngựa đã chọn không ở trạng thái active.',
  'Invitation does not exist.': 'Không tìm thấy lời mời.',
  'Invitation is not pending.': 'Lời mời không còn PENDING.',
  'Only pending invitations can be responded to.': 'Chỉ những lời mời đang PENDING mới có thể được phản hồi.',
  'Invitation has expired.': 'Lời mời đã hết hạn.',
  'License number is required': 'Vui lòng nhập số giấy phép.',
  'License number must be between 5 and 50 characters': 'Số giấy phép phải từ 5 đến 50 ký tự.',
  'License number may contain only letters, numbers and hyphens': 'Số giấy phép chỉ có thể chứa chữ cái, số và dấu gạch ngang.',
  'Jockey weight must be at least 35 kg': 'Cân nặng nài ngựa phải ít nhất 35 kg.',
  'Jockey weight must not exceed 90 kg': 'Cân nặng nài ngựa không được vượt quá 90 kg.',
  'Ranking is required': 'Vui lòng chọn xếp hạng.',
  'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE': 'Xếp hạng phải là BEGINNER, INTERMEDIATE, PROFESSIONAL hoặc ELITE.',
  'Jockey profile does not exist.': 'Hồ sơ nài ngựa không tồn tại.',
  'Profile does not exist.': 'Hồ sơ nài ngựa không tồn tại.',
  'Jockey profile already exists.': 'Hồ sơ nài ngựa đã tồn tại.',
  'License number already exists.': 'Số giấy phép đã tồn tại.',
  'Only active jockey profiles can accept invitations.': 'Chỉ những hồ sơ nài ngựa đang ACTIVE mới có thể chấp nhận lời mời.',
  'Only active jockey accounts can accept invitations.': 'Chỉ những tài khoản nài ngựa đang ACTIVE mới có thể chấp nhận lời mời.',
  'Horse name already exists.': 'Tên ngựa đã tồn tại.',
  'Only pending horses can be approved.': 'Chỉ những con ngựa đang PENDING mới có thể được phê duyệt.',
  'Only pending horses can be rejected.': 'Chỉ những con ngựa đang PENDING mới có thể bị từ chối.'
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
