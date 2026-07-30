import API_BASE_URL from '../configs/apiConfig';

const LANGUAGE_STORAGE_KEY = 'horse-racing:language';
const DEFAULT_ERROR_MESSAGES = {
  vi: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  en: 'Something went wrong. Please try again.'
};

const MESSAGE_TRANSLATIONS = {
  'Horse name is required': 'Tên ngựa là bắt buộc.',
  'Age must be zero or positive': 'Tuổi phải là số không âm.',
  'Weight must be a positive number': 'Cân nặng phải là số dương.',
  'Weight is required': 'Cân nặng là bắt buộc.',
  'Horse has participated in at least one race and cannot be deleted.': 'Ngựa đã tham gia ít nhất một cuộc đua và không thể bị xóa.',
  'User is not authenticated.': 'Bạn phải đăng nhập để tiếp tục.',
  'Only owners can access this resource.': 'Chỉ owner mới có thể truy cập tính năng này.',
  'Owner does not exist.': 'Tài khoản owner không tồn tại.',
  'Horse does not exist.': 'Hồ sơ ngựa không tồn tại hoặc không thuộc về tài khoản của bạn.',
  'Invalid email or password': 'Email hoặc mật khẩu không hợp lệ.',
  'Email already exists': 'Email đã tồn tại.',
  'Role not found': 'Role không hợp lệ.',
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
  'Registration deadline cannot be after start date.': 'Hạn đăng ký không thể sau ngày bắt đầu.',
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
  'Jockey id is required': 'Vui lòng chọn jockey.',
  'Expired time must be in the future': 'Hạn phản hồi lời mời phải trong tương lai.',
  'Only active horses can be invited.': 'Chỉ có thể mời những con ngựa đang ACTIVE.',
  'Only active horses can be registered.': 'Chỉ có thể đăng ký những con ngựa đang ACTIVE.',
  'Tournament does not exist.': 'Không tìm thấy giải đấu.',
  'Jockey does not exist.': 'Không tìm thấy jockey.',
  'Jockey is not active.': 'Jockey không ở trạng thái ACTIVE.',
  'Selected jockey account is not active.': 'Tài khoản jockey đã chọn không ở trạng thái active.',
  'Selected jockey profile is not active.': 'Hồ sơ jockey đã chọn không ở trạng thái active.',
  'Invitation does not exist.': 'Không tìm thấy lời mời.',
  'Invitation is not pending.': 'Lời mời không còn PENDING.',
  'Only pending invitations can be responded to.': 'Chỉ những lời mời đang PENDING mới có thể được phản hồi.',
  'Invitation has expired.': 'Lời mời đã hết hạn.',
  'License number is required': 'Vui lòng nhập số giấy phép.',
  'License number must be between 5 and 50 characters': 'Số giấy phép phải từ 5 đến 50 ký tự.',
  'License number may contain only letters, numbers and hyphens': 'Số giấy phép chỉ có thể chứa chữ cái, số và dấu gạch ngang.',
  'Jockey weight must be at least 35 kg': 'Cân nặng jockey phải ít nhất 35 kg.',
  'Jockey weight must not exceed 90 kg': 'Cân nặng jockey không được vượt quá 90 kg.',
  'Loại bằng phải là TRAINEE, AMATEUR hoặc PROFESSIONAL': 'Loại bằng phải là Tập sự, Nghiệp dư hoặc Chuyên nghiệp.',
  'Jockey profile does not exist.': 'Hồ sơ jockey không tồn tại.',
  'Profile does not exist.': 'Hồ sơ jockey không tồn tại.',
  'Jockey profile already exists.': 'Hồ sơ jockey đã tồn tại.',
  'License number already exists.': 'Số giấy phép đã tồn tại.',
  'Only active jockey profiles can accept invitations.': 'Chỉ những hồ sơ jockey đang ACTIVE mới có thể chấp nhận lời mời.',
  'Only active jockey accounts can accept invitations.': 'Chỉ những tài khoản jockey đang ACTIVE mới có thể chấp nhận lời mời.',
  'Horse name already exists.': 'Tên ngựa đã tồn tại.',
  'Only pending horses can be approved.': 'Chỉ những con ngựa đang PENDING mới có thể được phê duyệt.',
  'Only pending horses can be rejected.': 'Chỉ những con ngựa đang PENDING mới có thể bị từ chối.',
  'Tournament program conflicts with existing data.': 'Chương trình Tournament bị trùng dữ liệu hiện có.',
  'At least one race is required.': 'Cần có ít nhất một Race.',
  'Race name already exists in this tournament.': 'Tên Race đã tồn tại trong Tournament này.',
  'Race order already exists in this tournament.': 'Thứ tự Race đã tồn tại trong Tournament này.',
  'Only spectators can place bets.': 'Chỉ khán giả mới có thể đặt cược.',
  'KYC is required before betting.': 'Cần nộp KYC trước khi đặt cược.',
  'KYC must be verified before betting.': 'KYC phải được duyệt trước khi đặt cược.',
  'Player must be at least 21 years old to bet.': 'Người chơi phải từ 21 tuổi trở lên để đặt cược.',
  'Wallet balance is not enough for this bet.': 'Số dư ví không đủ để đặt cược.',
  'Wallet deposit amount must be at least 10,000 VND.': 'Số tiền nạp tối thiểu là 10.000 VND.',
  'Stake exceeds the daily betting limit for this product.': 'Số tiền cược vượt giới hạn ngày của sản phẩm này.',
  'Betting event is not open.': 'Event cược chưa mở nhận cược.',
  'Betting event is outside its receiving window.': 'Event cược đang ngoài thời gian nhận cược.',
  'Bet ticket does not exist.': 'Vé cược không tồn tại.',
  'You can only cancel your own bet ticket.': 'Bạn chỉ có thể hủy vé cược của chính mình.',
  'Only placed bet tickets can be cancelled.': 'Chỉ có thể hủy vé cược đang chờ kết quả.',
  'Only open betting events allow ticket cancellation.': 'Chỉ có thể hủy vé khi event cược còn mở.',
  'Bet ticket can only be cancelled during the betting window.': 'Chỉ có thể hủy vé trong thời gian nhận cược.',
  'Race participants cannot bet on their own race entry.': 'Người tham gia cuộc đua không được đặt cược vào entry của mình.',
  'Betting open time must be before close time.': 'Thời gian mở cược phải trước thời gian đóng cược.',
  'Betting must close before race start time.': 'Thời gian đóng cược phải trước giờ bắt đầu race.',
  'Betting must close at least 1 minute before race start.': 'Phải đóng cược ít nhất 1 phút trước khi race bắt đầu.',
  'Betting cannot open more than 12 hours before race start.': 'Không được mở cược sớm hơn 12 giờ trước khi race bắt đầu.',
  'At least two race entries are required to open betting.': 'Cần ít nhất 2 entry trong race để mở cược.',
  'Official race results are required before settlement.': 'Cần kết quả race chính thức trước khi settle cược.',
  'Betting product does not exist.': 'Sản phẩm đặt cược không tồn tại.',
  'Betting event does not exist.': 'Event đặt cược không tồn tại.',
  'Bet entry does not exist.': 'Lựa chọn cược không tồn tại.',
  'Race does not have a start time.': 'Race chưa có thời gian bắt đầu.',
  'Race is required': 'Vui lòng chọn race.',
  'Betting product is required': 'Vui lòng chọn sản phẩm đặt cược.',
  'Race ID is required.': 'Vui lòng chọn race.',
  'Bet product ID is required.': 'Vui lòng chọn sản phẩm đặt cược.',
  'Open time is required': 'Vui lòng nhập thời gian mở cược.',
  'Close time is required': 'Vui lòng nhập thời gian đóng cược.',
  'Open time is required.': 'Vui lòng nhập thời gian mở cược.',
  'Close time is required.': 'Vui lòng nhập thời gian đóng cược.',
  'Open time cannot be in the past.': 'Thời gian mở cược không được ở quá khứ.',
  'Close time must be in the future.': 'Thời gian đóng cược phải ở tương lai.',
  'Race entry ID is required.': 'Vui lòng chọn ngựa muốn đặt cược.',
  'Stake is required.': 'Vui lòng nhập số tiền cược.',
  'Stake must be at least 10,000 VND': 'Số tiền cược tối thiểu là 10.000 VND.',
  'Stake must be at least 10,000 VND.': 'Số tiền cược tối thiểu là 10.000 VND.',
  'Stake is lower than the product minimum stake.': 'Số tiền cược thấp hơn mức tối thiểu của sản phẩm.',
  'Daily max stake must be at least 10,000 VND': 'Giới hạn cược/ngày tối thiểu là 10.000 VND.',
  'Maximum daily stake cannot be lower than minimum stake.': 'Giới hạn cược/ngày không được thấp hơn cược tối thiểu.',
  'Minimum stake is required.': 'Vui lòng nhập cược tối thiểu.',
  'Maximum daily stake is required.': 'Vui lòng nhập giới hạn cược/ngày.',
  'Minimum stake must be at least 10,000 VND.': 'Cược tối thiểu phải từ 10.000 VND.',
  'Maximum daily stake must be at least 10,000 VND.': 'Giới hạn cược/ngày phải từ 10.000 VND.',
  'Operator fee rate is required.': 'Vui lòng nhập phí nhà tổ chức.',
  'Operator fee rate cannot be negative.': 'Phí nhà tổ chức không được âm.',
  'Operator fee rate cannot exceed 50%.': 'Phí nhà tổ chức không được vượt quá 50%.',
  'Product name is required.': 'Vui lòng nhập tên sản phẩm.',
  'Product name cannot exceed 100 characters.': 'Tên sản phẩm không được vượt quá 100 ký tự.',
  'Description cannot exceed 500 characters.': 'Mô tả không được vượt quá 500 ký tự.',
  'Active status is required.': 'Vui lòng chọn trạng thái hoạt động.',
  'KYC has expired.': 'KYC đã hết hạn, vui lòng cập nhật lại.',
  'Race schedule overlaps with another race on the same track.': 'Lịch Race bị trùng với Race khác trên cùng đường đua.',
  'Registration opening time must be before closing time.': 'Thời gian mở Registration phải trước thời gian đóng.',
  'Registration must close before the tournament starts.': 'Registration phải đóng trước khi Tournament bắt đầu.',
  'Tournament start date cannot be after end date.': 'Ngày bắt đầu Tournament không được sau ngày kết thúc.',
  'Tournament start date cannot be in the past.': 'Ngày bắt đầu Tournament không được ở quá khứ.',
  'Registration closing time cannot be in the past.': 'Thời gian đóng Registration không được ở quá khứ.',
  'Race start time must be before end time.': 'Thời gian bắt đầu Race phải trước thời gian kết thúc.',
  'Race schedule must be inside the tournament date range.': 'Lịch Race phải nằm trong thời gian của Tournament.',
  'Race must contain at least one prize.': 'Race phải có ít nhất một prize rule.',
  'Race cannot contain duplicate prize ranks.': 'Race không được có hạng giải thưởng bị trùng.',
  'Owner and jockey prize percentages must total 100.': 'Tổng tỷ lệ giải thưởng của Owner và Jockey phải bằng 100.',
  'A tournament cannot contain duplicate condition types.': 'Tournament không được có loại điều kiện tham gia bị trùng.',
  'Gender conditions only support the EQ operator.': 'Điều kiện giới tính chỉ hỗ trợ toán tử EQ.',
  'Gender condition requires a value.': 'Điều kiện giới tính cần có giá trị.',
  'Gender condition cannot use minimum or maximum values.': 'Điều kiện giới tính không được dùng giá trị tối thiểu hoặc tối đa.',
  'Unsupported numeric condition operator.': 'Toán tử điều kiện số không được hỗ trợ.',
  'BETWEEN requires minimum and maximum values.': 'BETWEEN cần cả giá trị tối thiểu và tối đa.',
  'Minimum value cannot exceed maximum value.': 'Giá trị tối thiểu không được lớn hơn giá trị tối đa.',
  'BETWEEN cannot contain a single value.': 'BETWEEN không được chỉ có một giá trị.',
  'Numeric condition requires a value.': 'Điều kiện số cần có giá trị.',
  'This operator cannot use minimum or maximum values.': 'Toán tử này không được dùng giá trị tối thiểu hoặc tối đa.',
  'Condition value cannot be negative.': 'Giá trị điều kiện không được âm.',
  'AGE and WEIGHT condition values must be numeric.': 'Giá trị điều kiện AGE và WEIGHT phải là số.',
  'Authenticated administrator does not exist.': 'Không tìm thấy tài khoản Admin đã xác thực.',
  'Authenticated admin does not exist.': 'Không tìm thấy tài khoản Admin đã xác thực.',
  'Only administrators can manage tournaments.': 'Chỉ Admin mới có thể quản lý Tournament.',
  'Only administrators can manage races.': 'Chỉ Admin mới có thể quản lý Race.',
  'Only administrators can review registrations.': 'Chỉ Admin mới có thể duyệt Registration.',
  'Only administrators can assign RaceEntries.': 'Chỉ Admin mới có thể phân công RaceEntry.',
  'Only administrators can manage referee assignments.': 'Chỉ Admin mới có thể phân công Referee.',
  'Only administrators can run races.': 'Chỉ Admin mới có thể khởi chạy Race.',
  'Only admins can review race results.': 'Chỉ Admin mới có thể duyệt kết quả Race.',
  'Administrator account is not active.': 'Tài khoản Admin không ở trạng thái ACTIVE.',
  'Admin account is not active.': 'Tài khoản Admin không ở trạng thái ACTIVE.',
  'Tournament can no longer be modified.': 'Tournament không còn được phép chỉnh sửa.',
  'Tournament cannot be modified after registrations exist.': 'Không thể chỉnh sửa Tournament sau khi đã có Registration.',
  'Only a tournament open for registration can be closed.': 'Chỉ Tournament đang Open Registration mới có thể đóng Registration.',
  'A cancelled tournament cannot be completed.': 'Tournament đã CANCELLED không thể hoàn tất.',
  'Tournament is already completed.': 'Tournament đã COMPLETED.',
  'Tournament cannot be completed without races.': 'Tournament cần có Race trước khi hoàn tất.',
  'Every race must be completed before completing the tournament.': 'Tất cả Race phải COMPLETED trước khi hoàn tất Tournament.',
  'Tournament does not allow race setup.': 'Tournament không cho phép cấu hình Race.',
  'Race does not exist.': 'Không tìm thấy Race.',
  'Race name or order conflicts with another race.': 'Tên hoặc thứ tự Race bị trùng với Race khác.',
  'Race name, order, or prize rank conflicts.': 'Tên Race, thứ tự Race hoặc hạng giải thưởng bị trùng.',
  'Maximum runners cannot be lower than existing entries.': 'Sức chứa Race không được nhỏ hơn số RaceEntry hiện có.',
  'Only a race open for registration can be closed.': 'Chỉ Race đang Open Registration mới có thể đóng Registration.',
  'A cancelled race cannot be completed.': 'Race đã CANCELLED không thể hoàn tất.',
  'Race is already completed.': 'Race đã COMPLETED.',
  'Race must be in progress before it can be completed.': 'Race phải ở trạng thái In Progress trước khi hoàn tất.',
  'Race cannot be completed before its scheduled end time.': 'Race không thể hoàn tất trước thời gian kết thúc dự kiến.',
  'Race cannot be manually completed before official results exist.': 'Không thể hoàn tất Race thủ công trước khi có kết quả chính thức.',
  'Race can no longer be cancelled.': 'Race không còn được phép hủy.',
  'Race cannot be cancelled after entries have been assigned.': 'Không thể hủy Race sau khi đã có RaceEntry.',
  'Race can no longer be modified.': 'Race không còn được phép chỉnh sửa.',
  'Race cannot be modified after entries have been assigned.': 'Không thể chỉnh sửa Race sau khi đã có RaceEntry.',
  'Unsupported registration status.': 'Status Registration không được hỗ trợ.',
  'Unsupported payment status.': 'Payment Status không được hỗ trợ.',
  'An approved registration must remain PAID.': 'Registration đã APPROVED phải giữ Payment Status là PAID.',
  'Registration does not exist.': 'Không tìm thấy Registration.',
  'Only PENDING registrations can be reviewed.': 'Chỉ Registration đang PENDING mới có thể duyệt.',
  'Registration has already been assigned to a race.': 'Registration đã được phân công vào Race.',
  'Race has reached its maximum runner capacity.': 'Race đã đạt sức chứa tối đa.',
  'Race entry conflicts with an existing assignment.': 'RaceEntry bị trùng với phân công hiện có.',
  'Race entry does not exist.': 'Không tìm thấy RaceEntry.',
  'Only ASSIGNED race entries can be cancelled.': 'Chỉ RaceEntry đang ASSIGNED mới có thể hủy.',
  'Assigned race does not exist.': 'Không tìm thấy Race đã phân công.',
  'Assigned registration does not exist.': 'Không tìm thấy Registration đã phân công.',
  'Race start time is not configured.': 'Race chưa cấu hình thời gian bắt đầu.',
  'Race entry cannot be cancelled after the race starts.': 'Không thể hủy RaceEntry sau khi Race bắt đầu.',
  'Cancellation reason is required.': 'Vui lòng nhập lý do hủy.',
  'Race entry could not be cancelled.': 'Không thể hủy RaceEntry.',
  'Race has no available starting stalls.': 'Race không còn Stall trống.',
  'Race is not available for entry assignment.': 'Race chưa sẵn sàng để phân công RaceEntry.',
  'Entries cannot be assigned after the race starts.': 'Không thể phân công RaceEntry sau khi Race bắt đầu.',
  'Race maximum runner configuration is invalid.': 'Cấu hình sức chứa Race không hợp lệ.',
  'Only APPROVED registrations can be assigned.': 'Chỉ Registration APPROVED mới có thể phân công.',
  'Registration must be PAID before assignment.': 'Registration phải PAID trước khi phân công.',
  'Race and Registration must belong to the same Tournament.': 'Race và Registration phải thuộc cùng Tournament.',
  'Race already has an assigned referee.': 'Race đã có Referee được phân công.',
  'Race already has a referee assignment.': 'Race đã có phân công Referee.',
  'Selected referee is already assigned to this race.': 'Referee đã được phân công cho Race này.',
  'Race does not have a referee assignment.': 'Race chưa có phân công Referee.',
  'Race is not available for referee assignment.': 'Race chưa sẵn sàng để phân công Referee.',
  'Referee cannot be changed after the race starts.': 'Không thể đổi Referee sau khi Race bắt đầu.',
  'Race end time is required for referee assignment.': 'Cần có thời gian kết thúc Race để phân công Referee.',
  'Tournament does not allow referee assignment.': 'Tournament không cho phép phân công Referee.',
  'Referee does not exist.': 'Không tìm thấy Referee.',
  'Selected user is not a referee.': 'Người dùng đã chọn không phải Referee.',
  'Selected referee is not active.': 'Referee đã chọn không ở trạng thái ACTIVE.',
  'Referee is already assigned to an overlapping race.': 'Referee đã được phân công vào Race trùng lịch.',
  'Assigned Tournament does not exist.': 'Không tìm thấy Tournament đã phân công.',
  'Assigned referee does not exist.': 'Không tìm thấy Referee đã phân công.',
  'Failure reason is required.': 'Vui lòng nhập lý do lỗi.',
  'Race has not been launched yet.': 'Race chưa được khởi chạy.',
  'Completed race cannot be marked failed.': 'Race đã COMPLETED không thể đánh dấu lỗi.',
  'Race has already been cancelled.': 'Race đã CANCELLED.',
  'Only an in-progress launched race can be marked failed.': 'Chỉ Race đã khởi chạy và đang In Progress mới có thể đánh dấu lỗi.',
  'Race result has already been recorded.': 'Kết quả Race đã được ghi nhận.',
  'Race can no longer be run.': 'Race không còn được phép khởi chạy.',
  'Race cannot be run before it is ready.': 'Race chưa Ready nên chưa thể khởi chạy.',
  'Race has already been launched.': 'Race đã được khởi chạy.',
  'Race already has a result submission under review.': 'Race đã có kết quả đang chờ review.',
  'Please assign a referee before launching this race.': 'Vui lòng phân công Referee trước khi khởi chạy Race.',
  'Race has no assigned entries to record results for.': 'Race chưa có RaceEntry để ghi nhận kết quả.',
  'Finish position must be at least 1.': 'Thứ hạng hoàn thành phải từ 1 trở lên.',
  'Official race result already exists for this race.': 'Race đã có kết quả chính thức.',
  'Race has already been completed.': 'Race đã COMPLETED.',
  'Race has been cancelled.': 'Race đã CANCELLED.',
  'Race must be in progress before results can be recorded.': 'Race phải ở trạng thái In Progress trước khi ghi nhận kết quả.',
  'Race result submission does not exist.': 'Không tìm thấy submission kết quả Race.',
  'Flag reason is required.': 'Vui lòng nhập lý do flag.',
  'Authenticated referee does not exist.': 'Không tìm thấy tài khoản Referee đã xác thực.',
  'Only referees can review race results.': 'Chỉ Referee mới có thể review kết quả Race.',
  'Referee account is not active.': 'Tài khoản Referee không ở trạng thái ACTIVE.',
  'Referee is not assigned to this race.': 'Referee không được phân công cho Race này.',
  'Only submitted race results can be reviewed by referee.': 'Chỉ kết quả Race đang SUBMITTED mới có thể được Referee review.',
  'Race result submission has no result entries.': 'Submission kết quả Race không có dòng kết quả.',
  'Race result submission references an unknown race entry.': 'Submission kết quả Race tham chiếu RaceEntry không tồn tại.',
  'Admin rejection reason is required.': 'Vui lòng nhập lý do Admin từ chối.',
  'Only referee-reviewed race results can be reviewed by admin.': 'Chỉ kết quả đã được Referee review mới có thể được Admin duyệt.',
  'Cancelled race result cannot be approved.': 'Không thể duyệt kết quả của Race đã CANCELLED.',
  'Race must be pending result review before approval.': 'Race phải ở trạng thái Pending Result Review trước khi duyệt kết quả.',
  'Race result references an unknown race entry.': 'Kết quả Race tham chiếu RaceEntry không tồn tại.',
  'Race entry registration does not exist.': 'Registration của RaceEntry không tồn tại.',
  'Race entry registration does not have a jockey.': 'Registration của RaceEntry chưa có Jockey.',
  'Unity race engine executable path is not configured.': 'Chưa cấu hình đường dẫn Unity Race Engine.',
  'Unity race engine executable does not exist.': 'Không tìm thấy file chạy Unity Race Engine.',
  'Unable to start Unity race engine process.': 'Không thể khởi chạy Unity Race Engine.',
  'Invalid or expired race engine launch token.': 'Token khởi chạy Race Engine không hợp lệ hoặc đã hết hạn.',
  'Race is not currently live.': 'Race hiện không ở trạng thái live.',
  'Horse already has an active registration in this tournament.': 'Horse đã có Registration đang hoạt động trong Tournament này.',
  'Tournament has reached its registration capacity.': 'Tournament đã đạt sức chứa Registration tối đa.',
  'Tournament is not available for registration review.': 'Tournament chưa sẵn sàng để duyệt Registration.',
  'Registration must be paid before it can be approved.': 'Registration phải PAID trước khi được duyệt.',
  'Horse already has an approved registration in this tournament.': 'Horse đã có Registration APPROVED trong Tournament này.',
  'Tournament has reached its approved registration capacity.': 'Tournament đã đạt sức chứa Registration APPROVED tối đa.',
  'Tournament is not open for registration.': 'Tournament không ở trạng thái mở Registration.',
  'Tournament registration has not opened yet.': 'Thời gian Registration của Tournament chưa mở.',
  'Tournament registration is closed.': 'Thời gian Registration của Tournament đã đóng.',
  'Registration submission time is missing.': 'Registration thiếu thời gian gửi.',
  'Registration was submitted outside the registration window.': 'Registration được gửi ngoài thời gian cho phép.',
  'Owner account is not active.': 'Tài khoản Owner không ở trạng thái ACTIVE.',
  'Registration owner does not have the OWNER role.': 'Owner của Registration không có Role OWNER.',
  'Selected horse does not belong to the owner.': 'Horse đã chọn không thuộc Owner này.',
  'Horse is not active.': 'Horse không ở trạng thái ACTIVE.',
  'Horse health certificate expires before the tournament starts.': 'Giấy chứng nhận sức khỏe của Horse hết hạn trước khi Tournament bắt đầu.',
  'Horse age is missing.': 'Horse thiếu thông tin tuổi.',
  'Horse weight is missing.': 'Horse thiếu thông tin cân nặng.',
  'Selected user does not have the JOCKEY role.': 'Người dùng đã chọn không có Role JOCKEY.',
  'Jockey account is not active.': 'Tài khoản Jockey không ở trạng thái ACTIVE.',
  'Tournament contains an unsupported condition.': 'Tournament có điều kiện tham gia chưa được hỗ trợ.',
  'Horse date of birth is invalid.': 'Ngày sinh của Horse không hợp lệ.',
  'Horse does not satisfy the tournament age condition.': 'Ngựa không đáp ứng điều kiện độ tuổi của Tournament.',
  'Horse does not satisfy the tournament weight condition.': 'Ngựa không đáp ứng điều kiện cân nặng của Tournament.',
  'Gender condition has an invalid operator.': 'Điều kiện giới tính có toán tử không hợp lệ.',
  'Horse does not satisfy the tournament gender condition.': 'Horse không đáp ứng điều kiện giới tính của Tournament.',
  'Tournament condition has an invalid operator.': 'Điều kiện Tournament có toán tử không hợp lệ.',
  'Tournament condition contains an invalid numeric value.': 'Điều kiện Tournament có giá trị số không hợp lệ.',
  'Authenticated owner is required.': 'Bạn cần đăng nhập bằng tài khoản Owner.',
  'Authenticated owner does not exist.': 'Không tìm thấy tài khoản Owner đã xác thực.',
  'Only owners can submit tournament registrations.': 'Chỉ Owner mới có thể gửi Registration cho Tournament.',
  'Horse does not exist or does not belong to the current owner.': 'Horse không tồn tại hoặc không thuộc Owner hiện tại.',
  'Horse must be ACTIVE.': 'Horse phải ở trạng thái ACTIVE.',
  'Selected user is not a JOCKEY.': 'Người dùng đã chọn không phải JOCKEY.',
  'Jockey account is not ACTIVE.': 'Tài khoản Jockey không ở trạng thái ACTIVE.',
  'Tournament is not open for registration.': 'Tournament không ở trạng thái mở Registration.',
  'Tournament registration window is not configured.': 'Tournament chưa cấu hình thời gian Registration.',
  'An ACCEPTED jockey invitation is required before registration.': 'Cần có lời mời Jockey đã ACCEPTED trước khi gửi Registration.',
  'Horse already has an active registration in an overlapping tournament.': 'Horse đã có Registration đang hoạt động trong Tournament trùng lịch.',
  'Horse already has an active registration in an unfinished tournament.': 'Ngựa đang có Registration trong một Tournament chưa kết thúc.',
  'Owner already has an active registration in this tournament.': 'Owner đã có Registration đang hoạt động trong Tournament này.',
  'Jockey already has an active registration in this tournament.': 'Jockey đã có Registration đang hoạt động trong Tournament này.',
  'Jockey already has an active registration in an overlapping tournament.': 'Jockey đã có Registration đang hoạt động trong Tournament trùng lịch.',
  'Jockey already has an active registration in an unfinished tournament.': 'Jockey đang có Registration trong một Tournament chưa kết thúc.'
};

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function decodeTokenPayload(token) {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload || typeof atob !== 'function') return null;

    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');

    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function isExpiredToken(token) {
  const payload = decodeTokenPayload(token);
  return !payload || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000);
}

function expireStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

function requestError(message, status = null, data = null) {
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

export function getCurrentLanguage() {
  if (typeof window === 'undefined') return 'vi';
  const storedLanguage = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage === 'en' ? 'en' : 'vi';
}

function getDefaultErrorMessage() {
  return DEFAULT_ERROR_MESSAGES[getCurrentLanguage()] || DEFAULT_ERROR_MESSAGES.vi;
}

function translateMessage(message) {
  if (typeof message !== 'string') return message;
  if (getCurrentLanguage() !== 'vi') return message;
  if (message.startsWith('Race needs at least ') && message.endsWith(' assigned entries before it can be run.')) {
    const count = message.match(/Race needs at least (\d+)/)?.[1];
    return count
      ? `Race cần ít nhất ${count} RaceEntry đã phân công trước khi khởi chạy.`
      : 'Race chưa đủ RaceEntry đã phân công để khởi chạy.';
  }
  if (message.startsWith('Result entry count (')) {
    return 'Số dòng kết quả Unity gửi về không khớp với số RaceEntry đã phân công.';
  }
  if (message.startsWith('Starting stall ') && message.endsWith(' is not an assigned entry for this race.')) {
    const stall = message.match(/Starting stall (\d+)/)?.[1];
    return stall
      ? `Stall ${stall} không thuộc RaceEntry đã phân công cho Race này.`
      : 'Stall không thuộc RaceEntry đã phân công cho Race này.';
  }
  if (message.startsWith('Duplicate starting stall ') && message.endsWith(' in result.')) {
    const stall = message.match(/Duplicate starting stall (\d+)/)?.[1];
    return stall
      ? `Stall ${stall} bị trùng trong kết quả.`
      : 'Stall bị trùng trong kết quả.';
  }
  if (message.startsWith('Duplicate finish position ') && message.endsWith(' in result.')) {
    const position = message.match(/Duplicate finish position (\d+)/)?.[1];
    return position
      ? `Thứ hạng ${position} bị trùng trong kết quả.`
      : 'Thứ hạng hoàn thành bị trùng trong kết quả.';
  }
  if (message.startsWith('Finish positions must be contiguous from 1 to ')) {
    const count = message.match(/from 1 to (\d+)/)?.[1];
    return count
      ? `Thứ hạng hoàn thành phải liên tục từ 1 đến ${count}.`
      : 'Thứ hạng hoàn thành phải liên tục từ 1.';
  }
  return MESSAGE_TRANSLATIONS[message] || message;
}

function hasStringField(value, field) {
  return typeof value === 'object' && value !== null && typeof value[field] === 'string';
}

function hasErrorsArray(value) {
  return typeof value === 'object' && value !== null && Array.isArray(value.errors);
}

export function getErrorMessage(data, fallbackMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const fallback = fallbackMessage === DEFAULT_ERROR_MESSAGES.vi ? getDefaultErrorMessage() : fallbackMessage;
  if (!data) return fallback;
  if (typeof data === 'string') return translateMessage(data);
  if (hasStringField(data, 'message')) return translateMessage(data.message);
  if (hasStringField(data, 'error')) return translateMessage(data.error);
  if (hasErrorsArray(data) && data.errors.length > 0) {
    return data.errors
      .map((error) => translateMessage(error.defaultMessage || error.message || String(error)))
      .join('\n');
  }
  return fallback;
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
  const { method = 'GET', body, auth = true, headers = {}, fallbackError = getDefaultErrorMessage() } = options;
  const requestHeaders = { ...headers };

  if (!isFormData(body)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (!token) {
      throw requestError(
        getCurrentLanguage() === 'vi'
          ? 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.'
          : 'You are not signed in or your session has expired.',
        401
      );
    }
    if (isExpiredToken(token)) {
      expireStoredSession();
      throw requestError(
        getCurrentLanguage() === 'vi'
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : 'Your session has expired. Please sign in again.',
        401
      );
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
    if (response.status === 401) {
      expireStoredSession();
    }
    throw requestError(getErrorMessage(data, fallbackError), response.status, data);
  }

  return data;
}
