import API_BASE_URL from '../configs/apiConfig';
const MESSAGE_TRANSLATIONS = {
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
    'Account is not active': 'Tài khoản không ở trạng thái ACTIVE nên không thể đăng nhập.',
    'Horse name must be between 2 and 100 characters': 'Tên ngựa phải từ 2 đến 100 ký tự.',
    'Horse name contains invalid characters': 'Tên ngựa chứa ký tự không hợp lệ.',
    'Breed is required': 'Giống ngựa không được để trống.',
    'Breed must be between 2 and 100 characters': 'Giống ngựa phải từ 2 đến 100 ký tự.',
    'Breed contains invalid characters': 'Giống ngựa chứa ký tự không hợp lệ.',
    'Gender is required': 'Giới tính không được để trống.',
    'Gender must be MALE or FEMALE': 'Giới tính chỉ được là MALE hoặc FEMALE.',
    'Color is required': 'Màu lông không được để trống.',
    'Color must be between 2 and 50 characters': 'Màu lông phải từ 2 đến 50 ký tự.',
    'Color contains invalid characters': 'Màu lông chứa ký tự không hợp lệ.',
    'Date of birth is required': 'Ngày sinh không được để trống.',
    'Date of birth must be today or in the past': 'Ngày sinh phải là hôm nay hoặc trong quá khứ.',
    'Horse weight must be at least 200 kg': 'Cân nặng ngựa phải từ 200 kg trở lên.',
    'Horse weight must not exceed 1000 kg': 'Cân nặng ngựa không được vượt quá 1000 kg.',
    'Health certificate expiry is required': 'Hạn giấy chứng nhận sức khỏe không được để trống.',
    'Health certificate expiry must be today or in the future': 'Hạn giấy chứng nhận sức khỏe phải là hôm nay hoặc trong tương lai.',
    'Status is required': 'Trạng thái không được để trống.',
    'Status must be ACTIVE or INACTIVE': 'Trạng thái chỉ được là ACTIVE hoặc INACTIVE.',
    'Image URL is required': 'Image URL không được để trống.',
    'Image URL must be a valid HTTP or HTTPS URL': 'Image URL phải bắt đầu bằng http:// hoặc https://.',
    'Tournament name is required': 'Tên giải đấu không được để trống.',
    'Location is required': 'Địa điểm không được để trống.',
    'Start date is required': 'Ngày bắt đầu không được để trống.',
    'End date is required': 'Ngày kết thúc không được để trống.',
    'Registration deadline is required': 'Hạn đăng ký không được để trống.',
    'Minimum participants is required': 'Số người tối thiểu không được để trống.',
    'Minimum participants must be positive': 'Số người tối thiểu phải lớn hơn 0.',
    'Maximum participants is required': 'Số người tối đa không được để trống.',
    'Maximum participants must be positive': 'Số người tối đa phải lớn hơn 0.',
    'Tournament condition is required': 'Bạn phải chọn điều kiện giải đấu.',
    'Start date cannot be after end date.': 'Ngày bắt đầu không được sau ngày kết thúc.',
    'Registration deadline cannot be after start date.': 'Hạn đăng ký không được sau ngày bắt đầu.',
    'Minimum participants cannot be greater than maximum participants.': 'Số người tối thiểu không được lớn hơn số người tối đa.',
    'Tournament condition does not exist.': 'Điều kiện giải đấu không tồn tại.',
    'Tournament already exists at this location with the same start date and end date.': 'Đã có giải đấu tại địa điểm này với cùng ngày bắt đầu và ngày kết thúc.',
    'Only draft tournaments can be opened for registration.': 'Chỉ giải đấu DRAFT mới được mở đăng ký.',
    'Tournament start date must not have passed.': 'Ngày bắt đầu giải đấu không được là ngày đã qua.',
    'Tournament registration deadline must not have passed.': 'Hạn đăng ký giải đấu không được là thời gian đã qua.',
    'Tournament participant limits are invalid.': 'Giới hạn số người tham gia không hợp lệ.',
    'Tournament must have the required draft rounds before registration can open.': 'Giải đấu phải có đủ các round DRAFT bắt buộc trước khi mở đăng ký.',
    'Tournament id is required': 'Bạn phải chọn giải đấu.',
    'Horse id is required': 'Bạn phải chọn ngựa.',
    'Jockey id is required': 'Bạn phải chọn jockey.',
    'Expired time must be in the future': 'Hạn phản hồi lời mời phải là thời gian trong tương lai.',
    'Only active horses can be invited.': 'Chỉ ngựa ACTIVE mới được gửi lời mời tham gia giải đấu.',
    'Tournament does not exist.': 'Không tìm thấy giải đấu.',
    'Jockey does not exist.': 'Không tìm thấy jockey.',
    'Jockey is not active.': 'Jockey chưa ở trạng thái ACTIVE.',
    'Invitation does not exist.': 'Không tìm thấy lời mời.',
    'Invitation is not pending.': 'Lời mời không còn ở trạng thái PENDING.',
    'License number is required': 'License number không được để trống.',
    'License number must be between 5 and 50 characters': 'License number phải từ 5 đến 50 ký tự.',
    'License number may contain only letters, numbers and hyphens': 'License number chỉ được chứa chữ, số và dấu gạch ngang.',
    'Jockey weight must be at least 35 kg': 'Cân nặng jockey phải từ 35 kg trở lên.',
    'Jockey weight must not exceed 90 kg': 'Cân nặng jockey không được vượt quá 90 kg.',
    'Ranking is required': 'Ranking không được để trống.',
    'Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE': 'Ranking phải là BEGINNER, INTERMEDIATE, PROFESSIONAL hoặc ELITE.',
    'Jockey profile does not exist.': 'Jockey chưa có hồ sơ profile.',
    'Profile does not exist.': 'Jockey chưa có hồ sơ profile.',
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
    return (typeof value === 'object' &&
        value !== null &&
        Array.isArray(value.errors));
}
export function getErrorMessage(data, fallbackMessage = 'Có lỗi xảy ra. Vui lòng thử lại.') {
    if (!data)
        return fallbackMessage;
    if (typeof data === 'string')
        return translateMessage(data);
    if (hasStringField(data, 'message'))
        return translateMessage(data.message);
    if (hasStringField(data, 'error'))
        return translateMessage(data.error);
    if (hasErrorsArray(data) && data.errors.length > 0) {
        return data.errors
            .map((error) => translateMessage(error.defaultMessage || error.message || String(error)))
            .join('\n');
    }
    return fallbackMessage;
}
function parseResponseBody(text) {
    if (!text)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function isFormData(value) {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}
export async function httpRequest(path, options = {}) {
    const { method = 'GET', body, auth = true, headers = {}, fallbackError = 'Có lỗi xảy ra. Vui lòng thử lại.' } = options;
    const requestHeaders = { ...headers };
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
    const fetchOptions = {
        method,
        headers: requestHeaders
    };
    if (body !== undefined) {
        fetchOptions.body = isFormData(body) || typeof body === 'string' ? body : JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
    if (response.status === 204) {
        if (!response.ok)
            throw new Error(fallbackError);
        return null;
    }
    const text = await response.text();
    const data = parseResponseBody(text);
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new Error(getErrorMessage(data, fallbackError));
    }
    return data;
}
