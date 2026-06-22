# TestBE - Tổng hợp Backend cho role OWNER và JOCKEY

Tài liệu này tổng hợp theo code thật trong Backend hiện tại, tập trung vào 2 role:

- `OWNER` / Horse Owner / Chủ ngựa
- `JOCKEY` / Nài ngựa

Mục tiêu khi học: hiểu request từ frontend đi qua `Security/JWT -> Controller -> Service -> Repository/JdbcTemplate -> Entity/DB -> Response/Error`.

## 1. Tổng quan công nghệ và cấu trúc Backend

Backend là Spring Boot, package chính:

- Entry point: `Backend/src/main/java/com/example/backend/Application.java`
- Controller: `Backend/src/main/java/com/example/backend/controller/...`
- Service: `Backend/src/main/java/com/example/backend/service/...`
- Repository: `Backend/src/main/java/com/example/backend/repository/...`
- Entity: `Backend/src/main/java/com/example/backend/entity/...`
- DTO request/response: `Backend/src/main/java/com/example/backend/dto/...`
- Security JWT: `Backend/src/main/java/com/example/backend/security/...`
- Exception handler: `Backend/src/main/java/com/example/backend/exception/...`

Các bảng/entity chính liên quan OWNER và JOCKEY:

- `Users`: entity `User.java`
- `Roles`: entity `Role.java`
- `Horse`: entity `Horse.java`
- `JockeyProfile`: entity `JockeyProfile.java`
- `JockeyInvitation`: entity `JockeyInvitation.java`
- `Registration`: entity `Registration.java`
- `Tournament`: được service lấy bằng `JdbcTemplate` hoặc repository ở một số service admin

## 2. Luồng bảo mật JWT trước khi vào Controller

File liên quan:

- `Backend/src/main/java/com/example/backend/security/SecurityConfig.java`
- `Backend/src/main/java/com/example/backend/security/JwtFilter.java`
- `Backend/src/main/java/com/example/backend/security/JwtUtil.java`
- `Backend/src/main/java/com/example/backend/service/AuthService.java`
- `Backend/src/main/java/com/example/backend/controller/AuthController.java`

Luồng login:

1. Frontend gửi `POST /api/auth/login` với body gồm `email`, `password`.
2. `AuthController.login()` nhận `LoginRequest`.
3. `AuthService.login(email, password)` kiểm tra email/password.
4. Nếu đúng, lấy role từ `user.getRole().getRoleName()`.
5. `JwtUtil.generateToken(email, roleName)` tạo JWT, trong token có:
   - subject là email
   - claim `role`
6. Response trả về `LoginResponse` gồm:
   - `token`
   - `user`

Khi gọi API OWNER/JOCKEY:

1. Frontend gửi header:

```http
Authorization: Bearer <token>
```

2. `JwtFilter.doFilterInternal()` đọc header `Authorization`.
3. Nếu token hợp lệ, `JwtUtil.extractClaims(token)` lấy:
   - `email = claims.getSubject()`
   - `role = claims.get("role", String.class)`
4. Filter set authentication vào `SecurityContextHolder` với authority:

```java
new SimpleGrantedAuthority("ROLE_" + role)
```

Ví dụ role trong JWT là `OWNER` thì authority là `ROLE_OWNER`.

Phân quyền trong `SecurityConfig`:

- `/api/auth/**`: cho phép không cần login.
- `/api/owner/**`: phải có role `OWNER`.
- Các controller owner còn có `@PreAuthorize("hasRole('OWNER')")`.
- `JockeyController` có `@PreAuthorize("hasRole('JOCKEY')")`.

Lưu ý: `SecurityConfig` hiện có rule rõ cho `/api/owner/**`, còn `/api/jockey/**` không được match riêng trong `SecurityConfig` nhưng vẫn bị chặn bởi `.anyRequest().authenticated()` và `@PreAuthorize("hasRole('JOCKEY')")` ở controller.

## 3. Exception và validation

File liên quan:

- `Backend/src/main/java/com/example/backend/exception/ApiException.java`
- `Backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
- `Backend/src/main/java/com/example/backend/dto/response/ErrorResponse.java`

Service thường throw:

```java
throw new ApiException(HttpStatus.CONFLICT, "Tên ngựa đã tồn tại.");
```

`GlobalExceptionHandler` bắt lỗi và trả JSON:

```json
{
  "status": 409,
  "message": "Tên ngựa đã tồn tại."
}
```

Nếu DTO có annotation `@Valid` bị sai, Spring throw `MethodArgumentNotValidException`, handler trả HTTP 400 với message validation đầu tiên.

## 4. Role OWNER - Các file chính

Controller OWNER:

- `Backend/src/main/java/com/example/backend/controller/OwnerController.java`
- `Backend/src/main/java/com/example/backend/controller/OwnerHorseController.java`
- `Backend/src/main/java/com/example/backend/controller/OwnerInvitationController.java`

Service:

- Interface: `Backend/src/main/java/com/example/backend/service/OwnerService.java`
- Implement: `Backend/src/main/java/com/example/backend/service/OwnerServiceImpl.java`

DTO request:

- `Backend/src/main/java/com/example/backend/dto/request/CreateHorseRequest.java`
- `Backend/src/main/java/com/example/backend/dto/request/UpdateHorseRequest.java`
- `Backend/src/main/java/com/example/backend/dto/request/InviteJockeyRequest.java`

DTO response:

- `Backend/src/main/java/com/example/backend/dto/response/OwnerDashboardResponse.java`
- `Backend/src/main/java/com/example/backend/dto/response/HorseResponse.java`
- `Backend/src/main/java/com/example/backend/dto/response/JockeyInvitationResponse.java`

Repository:

- `Backend/src/main/java/com/example/backend/repository/HorseRepository.java`
- `Backend/src/main/java/com/example/backend/repository/RegistrationRepository.java`
- `Backend/src/main/java/com/example/backend/repository/JockeyInvitationRepository.java`
- `Backend/src/main/java/com/example/backend/repository/JockeyProfileRepository.java`
- `Backend/src/main/java/com/example/backend/repository/UserRepository.java`

Entity:

- `Backend/src/main/java/com/example/backend/entity/Horse.java`
- `Backend/src/main/java/com/example/backend/entity/JockeyInvitation.java`
- `Backend/src/main/java/com/example/backend/entity/Registration.java`
- `Backend/src/main/java/com/example/backend/entity/JockeyProfile.java`
- `Backend/src/main/java/com/example/backend/entity/User.java`
- `Backend/src/main/java/com/example/backend/entity/Role.java`

## 5. OWNER - API dashboard

Endpoint:

```http
GET /api/owner/dashboard
```

Controller:

- File: `Backend/src/main/java/com/example/backend/controller/OwnerController.java`
- Method: `getDashboard()`
- Gọi: `ownerService.getDashboard()`

Service:

- File: `Backend/src/main/java/com/example/backend/service/OwnerServiceImpl.java`
- Method: `getDashboard()`

Luồng chạy:

1. Request đi qua `JwtFilter`, token hợp lệ thì lưu email vào `SecurityContextHolder`.
2. `OwnerController.getDashboard()` được gọi.
3. Service gọi private method `getCurrentOwner()`.
4. `getCurrentOwner()` lấy `authentication.getName()` chính là email từ JWT.
5. Gọi `userRepository.findByEmail(email)` để lấy user.
6. Kiểm tra `user.getRole().getRoleName()` phải là `OWNER`.
7. Lấy `ownerId = owner.getUserID()`.
8. Gọi:
   - `horseRepository.findByOwnerId(ownerId)`
   - `horseRepository.countByOwnerId(ownerId)`
   - `registrationRepository.countByOwnerId(ownerId)`
   - `registrationRepository.countRegisteredHorsesByOwnerId(ownerId)`
9. Với từng horse, service kiểm tra có registration active không bằng:
   - `registrationRepository.findRegistrationIdsByHorseId(horseId)`
   - `registrationRepository.countByRegistrationIdInAndStatusIn(..., ACCEPTED/CONFIRMED)`
10. Trả `OwnerDashboardResponse`.

Response fields:

- `ownerId`
- `ownerName`
- `totalHorses`
- `totalRegistrations`
- `registeredHorses`
- `participatedHorses`

## 6. OWNER - Quản lý ngựa

Base endpoint:

```http
/api/owner/horses
```

Controller:

- File: `Backend/src/main/java/com/example/backend/controller/OwnerHorseController.java`
- Class có `@RequestMapping("/api/owner/horses")`
- Class có `@PreAuthorize("hasRole('OWNER')")`

### 6.1 Lấy danh sách ngựa của owner

Endpoint:

```http
GET /api/owner/horses
```

Luồng:

1. `OwnerHorseController.getMyHorses()`
2. `OwnerServiceImpl.getMyHorses()`
3. `getCurrentOwner()` lấy owner đang login.
4. `horseRepository.findByOwnerId(ownerId)` lấy danh sách ngựa.
5. Mỗi `Horse` được map qua `mapHorseToResponse(horse)`.
6. Khi map response, service lấy thêm registration của ngựa để tính:
   - `registrationCount`
   - `participated`

Response là list `HorseResponse`.

### 6.2 Lấy chi tiết một ngựa

Endpoint:

```http
GET /api/owner/horses/{horseId}
```

Luồng:

1. `OwnerHorseController.getMyHorseById(@PathVariable Integer horseId)`
2. `OwnerServiceImpl.getMyHorseById(horseId)`
3. Gọi `getOwnedHorse(horseId)`.
4. `getOwnedHorse()` lấy owner hiện tại rồi gọi:

```java
horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
```

5. Nếu không có, throw 404 `"Ngựa không tồn tại."`
6. Nếu có, map sang `HorseResponse`.

Điểm để trả lời cô: API này không cho owner xem ngựa của người khác vì query dùng cả `horseId` và `ownerId`.

### 6.3 Tạo hồ sơ ngựa

Endpoint:

```http
POST /api/owner/horses
```

Request DTO:

- File: `Backend/src/main/java/com/example/backend/dto/request/CreateHorseRequest.java`

Body ví dụ:

```json
{
  "horseName": "Lightning",
  "breed": "Arabian",
  "gender": "MALE",
  "color": "Brown",
  "dayOfBirth": "2021-05-10",
  "weight": 450.50,
  "healthCertExpiry": "2026-12-31",
  "imgUrl": "https://example.com/horse.jpg"
}
```

Validation trong DTO:

- `horseName`: bắt buộc, 2-100 ký tự, pattern hợp lệ.
- `breed`: bắt buộc, 2-100 ký tự.
- `gender`: `MALE` hoặc `FEMALE`, không phân biệt hoa thường.
- `color`: bắt buộc, 2-50 ký tự.
- `dayOfBirth`: bắt buộc, quá khứ hoặc hiện tại.
- `weight`: bắt buộc, từ `200.00` đến `1000.00`.
- `healthCertExpiry`: bắt buộc, hiện tại hoặc tương lai.
- `imgUrl`: bắt buộc, phải bắt đầu bằng `http://` hoặc `https://`.

Luồng:

1. `OwnerHorseController.createHorse(@Valid @RequestBody CreateHorseRequest request)`
2. Nếu body sai validation, chưa vào service, trả 400.
3. Gọi `OwnerServiceImpl.createHorse(request)`.
4. Lấy owner hiện tại bằng `getCurrentOwner()`.
5. Chuẩn hóa tên ngựa bằng `normalizeText(request.getHorseName())`.
6. Kiểm tra trùng tên:

```java
horseRepository.existsByHorseNameIgnoreCase(horseName)
```

7. Nếu trùng, throw 409 `"Tên ngựa đã tồn tại."`
8. Build entity `Horse`:
   - `ownerId` là user đang login
   - `gender` được uppercase
   - `status = "PENDING"`
   - `rejectionReason = null`
9. `horseRepository.save(horse)` lưu DB.
10. Map sang `HorseResponse`.
11. Controller trả HTTP 201 Created.

Lưu ý trạng thái: Owner tạo/cập nhật ngựa thì ngựa ở `PENDING`. Admin phải duyệt qua `AdminHorseService.approveHorse()` thì ngựa mới thành `ACTIVE`.

### 6.4 Cập nhật ngựa

Endpoint:

```http
PUT /api/owner/horses/{horseId}
```

Request DTO:

- File: `Backend/src/main/java/com/example/backend/dto/request/UpdateHorseRequest.java`
- Field và validation giống `CreateHorseRequest`.

Luồng:

1. `OwnerHorseController.updateHorse(horseId, request)`
2. `OwnerServiceImpl.updateHorse(horseId, request)`
3. Gọi `getOwnedHorse(horseId)` để bảo đảm ngựa thuộc owner.
4. Kiểm tra tên ngựa không trùng với ngựa khác:

```java
horseRepository.existsByHorseNameIgnoreCaseAndHorseIdNot(horseName, horse.getHorseId())
```

5. Set lại thông tin ngựa.
6. Set `status = "PENDING"` và `rejectionReason = null`.
7. Save lại bằng `horseRepository.save(horse)`.
8. Trả `HorseResponse`.

Điểm cần nhớ: Sau khi owner update ngựa, hệ thống đưa ngựa về `PENDING` để admin duyệt lại.

### 6.5 Xóa ngựa

Endpoint:

```http
DELETE /api/owner/horses/{horseId}
```

Luồng:

1. `OwnerHorseController.deleteHorse(horseId)`
2. `OwnerServiceImpl.deleteHorse(horseId)`
3. `getOwnedHorse(horseId)` kiểm tra ownership.
4. Kiểm tra ngựa đã có lời mời jockey chưa:

```java
jockeyInvitationRepository.existsByHorseId(horseId)
```

5. Nếu có, throw 409 `"Ngựa đã có lời mời nài ngựa nên không thể xóa."`
6. Kiểm tra ngựa đã có registration chưa:

```java
registrationRepository.existsByHorseId(horseId)
```

7. Nếu có, throw 409 `"Ngựa đã có đơn đăng ký giải đấu nên không thể xóa."`
8. Nếu không vướng, gọi `horseRepository.delete(horse)`.
9. Controller trả HTTP 204 No Content.

## 7. OWNER - Gửi và quản lý lời mời Jockey

Base endpoint:

```http
/api/owner/invitations
```

Controller:

- File: `Backend/src/main/java/com/example/backend/controller/OwnerInvitationController.java`

Service:

- File: `Backend/src/main/java/com/example/backend/service/OwnerServiceImpl.java`

### 7.1 Lấy danh sách lời mời owner đã gửi

Endpoint:

```http
GET /api/owner/invitations
```

Luồng:

1. `OwnerInvitationController.getMyInvitations()`
2. `OwnerServiceImpl.getMyInvitations()`
3. Lấy owner hiện tại.
4. Gọi:

```java
jockeyInvitationRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
```

5. Map từng `JockeyInvitation` sang `JockeyInvitationResponse`.

Khi map response, service lấy thêm:

- `Registration` nếu `registrationId` có giá trị.
- `Tournament` bằng `JdbcTemplate` qua `getTournamentSnapshotOrNull(tournamentId)`.
- `Horse` bằng `horseRepository.findById(horseId)`.
- `owner` và `jockey` bằng `userRepository.findById(...)`.

### 7.2 Owner gửi lời mời Jockey

Endpoint:

```http
POST /api/owner/invitations
```

Request DTO:

- File: `Backend/src/main/java/com/example/backend/dto/request/InviteJockeyRequest.java`

Body ví dụ:

```json
{
  "tournamentId": 1,
  "horseId": 10,
  "jockeyId": 20,
  "expiredAt": "2026-06-20T10:00:00",
  "message": "Bạn tham gia giải này với ngựa của tôi nhé."
}
```

Validation:

- `tournamentId`: bắt buộc.
- `horseId`: bắt buộc.
- `jockeyId`: bắt buộc.
- `expiredAt`: nếu có thì phải là tương lai.
- `message`: không có validation trong DTO.

Luồng chi tiết:

1. `OwnerInvitationController.inviteJockey(@Valid @RequestBody InviteJockeyRequest request)`
2. Gọi `OwnerServiceImpl.inviteJockey(request)`.
3. `getCurrentOwner()` lấy owner hiện tại.
4. `getOwnedHorse(request.getHorseId())` lấy ngựa và đảm bảo ngựa thuộc owner.
5. `getTournamentSnapshot(request.getTournamentId())` query trực tiếp bảng `Tournament` bằng `JdbcTemplate`.

SQL trong service:

```sql
SELECT tournamentID, tournamentName, startDate, endDate, registrationDeadline, maxParticipants, status
FROM Tournament
WHERE tournamentID = ?
```

6. `validateHorseCanRegister(horse, tournament)` kiểm tra:
   - ngựa phải `ACTIVE`
   - tournament status phải là `"OpenForRegistration"`
   - nếu `registrationDeadline` đã qua thì không cho mời
   - nếu `maxParticipants` đã đủ số lượng active registration thì không cho mời
7. `validateInvitationExpiry(request.getExpiredAt(), tournament)` kiểm tra `expiredAt` phải trước `registrationDeadline` nếu cả hai có giá trị.
8. `validateOwnerCanRegisterForTournament(ownerId, tournamentId, null)` kiểm tra:
   - owner chưa có registration `ACCEPTED` hoặc `CONFIRMED` trong tournament đó.
   - owner chưa có invitation `PENDING` khác trong tournament đó.
9. `validateHorseActiveRegistrationForTournament(horseId, tournamentId, null)` kiểm tra ngựa chưa có registration active trong tournament đó.
10. `getJockey(request.getJockeyId())` kiểm tra:
   - user jockey tồn tại.
   - role phải là `JOCKEY`.
   - account status phải `ACTIVE`.
   - `JockeyProfile` tồn tại.
   - profile status phải `ACTIVE`.
11. `validateJockeyAvailableForTournament(...)` kiểm tra jockey chưa bị trùng lịch:
   - chưa có registration active cùng tournament.
   - chưa có registration active ở tournament overlap thời gian.
   - chưa có invitation pending ở tournament overlap thời gian.
12. `validateHorseJockeyPairAvailableForOverlappingTournament(...)` kiểm tra cặp ngựa + jockey chưa được dùng ở tournament overlap.
13. Tìm registration cũ theo tournament và horse:

```java
registrationRepository.findByTournamentIdAndHorseId(tournamentId, horseId)
```

Nếu đã có registration mà status không phải `CANCELLED` hoặc `REJECTED`, throw conflict.

14. Kiểm tra đã tồn tại invitation pending cùng tournament, horse, jockey chưa:

```java
jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndJockeyIdAndStatus(...)
```

15. Build `JockeyInvitation`:
   - `tournamentId`
   - `horseId`
   - `ownerId`
   - `jockeyId`
   - `expiredAt`
   - `message`
   - `status = "PENDING"`
16. Save bằng `jockeyInvitationRepository.save(invitation)`.
17. Map sang `JockeyInvitationResponse`.
18. Controller trả HTTP 201 Created.

Điểm cần trả lời cô: Owner gửi lời mời chưa tạo registration ngay. Registration chỉ được tạo/cập nhật khi Jockey accept invitation ở `JockeyServiceImpl.acceptInvitation()`.

### 7.3 Owner hủy lời mời

Endpoint:

```http
PUT /api/owner/invitations/{invitationId}/cancel
```

Luồng:

1. `OwnerInvitationController.cancelInvitation(invitationId)`
2. `OwnerServiceImpl.cancelInvitation(invitationId)`
3. Lấy owner hiện tại.
4. Tìm invitation thuộc owner:

```java
jockeyInvitationRepository.findByInvitationIdAndOwnerId(invitationId, ownerId)
```

5. Nếu không có, throw 404 `"Lời mời không tồn tại."`
6. Chỉ cho hủy nếu invitation status là `PENDING`.
7. Nếu invitation có `registrationId`, tìm registration đó.
8. Set invitation:
   - `status = "CANCELLED"`
   - `respondedAt = LocalDateTime.now()`
9. Nếu có registration liên quan:
   - `registration.status = "CANCELLED"`
   - `registration.jockeyId = null`
   - save registration
10. Save invitation.
11. Trả `JockeyInvitationResponse`.

## 8. Role JOCKEY - Các file chính

Controller:

- `Backend/src/main/java/com/example/backend/controller/JockeyController.java`

Service:

- Interface: `Backend/src/main/java/com/example/backend/service/JockeyService.java`
- Implement: `Backend/src/main/java/com/example/backend/service/JockeyServiceImpl.java`

DTO request:

- `Backend/src/main/java/com/example/backend/dto/request/JockeyProfileRequest.java`

DTO response:

- `Backend/src/main/java/com/example/backend/dto/response/JockeyProfileResponse.java`
- `Backend/src/main/java/com/example/backend/dto/response/JockeyInvitationResponse.java`

Repository:

- `Backend/src/main/java/com/example/backend/repository/JockeyProfileRepository.java`
- `Backend/src/main/java/com/example/backend/repository/JockeyInvitationRepository.java`
- `Backend/src/main/java/com/example/backend/repository/RegistrationRepository.java`
- `Backend/src/main/java/com/example/backend/repository/HorseRepository.java`
- `Backend/src/main/java/com/example/backend/repository/UserRepository.java`

## 9. JOCKEY - Hồ sơ Jockey

Base endpoint:

```http
/api/jockey
```

Controller:

- File: `Backend/src/main/java/com/example/backend/controller/JockeyController.java`
- Class có `@PreAuthorize("hasRole('JOCKEY')")`

### 9.1 Lấy profile Jockey

Endpoint:

```http
GET /api/jockey/profile
```

Luồng:

1. `JockeyController.getProfile()`
2. `JockeyServiceImpl.getProfile()`
3. `getCurrentJockey()` lấy email từ `SecurityContextHolder`.
4. `userRepository.findByEmail(email)` lấy user.
5. Kiểm tra role phải là `JOCKEY`.
6. `jockeyProfileRepository.findById(jockey.getUserID())` lấy profile.
7. Nếu không có profile, throw 404 `"Hồ sơ nài ngựa không tồn tại."`
8. `mapProfileToResponse(profile, jockey)` trả `JockeyProfileResponse`.

Response fields:

- `jockeyId`
- `fullName`
- `email`
- `licenseNo`
- `weight`
- `ranking`
- `status`
- `rejectionReason`
- `imgUrl`

### 9.2 Tạo profile Jockey

Endpoint:

```http
POST /api/jockey/profile
```

Request DTO:

- File: `Backend/src/main/java/com/example/backend/dto/request/JockeyProfileRequest.java`

Body ví dụ:

```json
{
  "licenseNo": "JOC-2026-001",
  "weight": 52.50,
  "ranking": "PROFESSIONAL",
  "imgUrl": "https://example.com/jockey.jpg"
}
```

Validation:

- `licenseNo`: bắt buộc, 5-50 ký tự, chỉ chữ cái, số và dấu gạch nối.
- `weight`: bắt buộc, từ `35.00` đến `90.00`.
- `ranking`: `BEGINNER`, `INTERMEDIATE`, `PROFESSIONAL`, `ELITE`.
- `imgUrl`: bắt buộc, phải là HTTP/HTTPS URL.

Luồng:

1. `JockeyController.createProfile(@Valid @RequestBody JockeyProfileRequest request)`
2. Nếu validation fail, trả 400.
3. `JockeyServiceImpl.createProfile(request)`.
4. `getCurrentJockey()` lấy user hiện tại và kiểm tra role `JOCKEY`.
5. Nếu đã có profile:

```java
jockeyProfileRepository.existsById(jockeyId)
```

thì throw 409 `"Hồ sơ nài ngựa đã tồn tại."`

6. Chuẩn hóa `licenseNo` uppercase.
7. Kiểm tra license trùng:

```java
jockeyProfileRepository.existsByLicenseNo(licenseNo)
```

8. Build `JockeyProfile`:
   - `jockeyId = userID`
   - `licenseNo`
   - `weight`
   - `ranking` uppercase
   - `status = "UNDER_REVIEW"`
   - `rejectionReason = null`
   - `imgUrl`
9. Save profile.
10. Gọi `markProfileUnderReview(jockey)`:
   - set `User.status = "UNDER_REVIEW"`
   - `userRepository.save(jockey)`
11. Trả `JockeyProfileResponse`.
12. Controller trả HTTP 201 Created.

Điểm cần nhớ: Jockey tự tạo profile xong chưa ACTIVE ngay. Profile và user chuyển sang `UNDER_REVIEW`, cần admin duyệt.

### 9.3 Cập nhật profile Jockey

Endpoint:

```http
PUT /api/jockey/profile
```

Luồng:

1. `JockeyController.updateProfile(request)`
2. `JockeyServiceImpl.updateProfile(request)`
3. `getCurrentJockey()`
4. Tìm profile bằng `jockeyProfileRepository.findById(jockeyId)`.
5. Kiểm tra license không trùng với jockey khác:

```java
jockeyProfileRepository.existsByLicenseNoAndJockeyIdNot(licenseNo, jockeyId)
```

6. Update field:
   - `licenseNo`
   - `weight`
   - `ranking`
   - `status = "UNDER_REVIEW"`
   - `rejectionReason = null`
   - `imgUrl`
7. Save profile.
8. Gọi `markProfileUnderReview(jockey)` để user cũng thành `UNDER_REVIEW`.
9. Trả `JockeyProfileResponse`.

Điểm cần nhớ: Jockey update profile cũng phải chờ admin duyệt lại.

### 9.4 Deactivate profile

Endpoint:

```http
PUT /api/jockey/profile/inactive
```

Luồng:

1. `JockeyController.deactivateProfile()`
2. `JockeyServiceImpl.deactivateProfile()`
3. Lấy jockey hiện tại.
4. Tìm profile.
5. Set `profile.status = "INACTIVE"`.
6. Save profile.
7. Trả `JockeyProfileResponse`.

Lưu ý theo code hiện tại: method này chỉ set status trong `JockeyProfile`, không set `User.status` thành `INACTIVE`.

## 10. JOCKEY - Xem và phản hồi invitation

### 10.1 Lấy lời mời gửi cho Jockey

Endpoint:

```http
GET /api/jockey/invitations
```

Luồng:

1. `JockeyController.getMyInvitations()`
2. `JockeyServiceImpl.getMyInvitations()`
3. Lấy jockey hiện tại.
4. Gọi:

```java
jockeyInvitationRepository.findByJockeyIdOrderByCreatedAtDesc(jockeyId)
```

5. Map từng `JockeyInvitation` sang `JockeyInvitationResponse`.

### 10.2 Jockey accept invitation

Endpoint:

```http
PUT /api/jockey/invitations/{invitationId}/accept
```

Luồng quan trọng:

1. `JockeyController.acceptInvitation(@PathVariable Integer invitationId)`
2. `JockeyServiceImpl.acceptInvitation(invitationId)`
3. Gọi `getCurrentJockeyWithActiveProfile()`.
4. Method này kiểm tra:
   - user hiện tại role `JOCKEY`
   - `JockeyProfile` tồn tại
   - profile status phải `ACTIVE`
   - user status phải `ACTIVE`
5. Lấy invitation thuộc jockey hiện tại:

```java
jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
```

6. `validateInvitationNotExpired(invitation)`:
   - invitation phải `PENDING`
   - nếu `expiredAt` trước hiện tại thì set invitation thành `EXPIRED`, save, rồi throw 400 `"Lời mời đã hết hạn."`
7. Lấy tournament snapshot bằng `JdbcTemplate`.

SQL:

```sql
SELECT tournamentID, tournamentName, startDate, endDate
FROM Tournament
WHERE tournamentID = ?
```

8. `validateOwnerHorseForInvitation(invitation)`:
   - tìm horse bằng `horseRepository.findById(invitation.getHorseId())`
   - kiểm tra horse thuộc đúng `ownerId` của invitation
   - horse status phải `ACTIVE`
9. Kiểm tra conflict giống lúc owner gửi lời mời:
   - jockey không trùng tournament hoặc tournament overlap
   - owner không có registration active hoặc invitation pending khác trong tournament
   - horse chưa có registration active trong tournament
   - cặp horse + jockey không bị overlap
10. Tìm registration theo tournament và horse:

```java
registrationRepository.findByTournamentIdAndHorseId(tournamentId, horseId)
```

Nếu chưa có thì tạo `new Registration()`.

11. Nếu registration cũ tồn tại và status không phải `CANCELLED` hoặc `REJECTED`, throw conflict.
12. Set invitation:
   - `status = "ACCEPTED"`
   - `respondedAt = LocalDateTime.now()`
13. Set registration:
   - `tournamentId = invitation.getTournamentId()`
   - `horseId = horse.getHorseId()`
   - `ownerId = invitation.getOwnerId()`
   - `jockeyId = current jockeyId`
   - `status = "ACCEPTED"`
14. Save registration bằng `registrationRepository.save(registration)`.
15. Set `invitation.registrationId = registration.getRegistrationId()`.
16. Save invitation.
17. Trả `JockeyInvitationResponse`.

Điểm cần trả lời cô: Accept invitation là chỗ tạo hoặc cập nhật `Registration`. Sau khi accept, registration mới ở `ACCEPTED`, chưa phải `CONFIRMED`. Admin cần confirm ở `AdminRegistrationService.confirmRegistration()`.

### 10.3 Jockey reject invitation

Endpoint:

```http
PUT /api/jockey/invitations/{invitationId}/reject
```

Luồng:

1. `JockeyController.rejectInvitation(invitationId)`
2. `JockeyServiceImpl.rejectInvitation(invitationId)`
3. Lấy jockey hiện tại bằng `getCurrentJockey()`.
4. Tìm invitation thuộc jockey:

```java
jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
```

5. `validateInvitationNotExpired(invitation)` kiểm tra invitation đang `PENDING` và chưa hết hạn.
6. Set:
   - `invitation.status = "REJECTED"`
   - `invitation.respondedAt = LocalDateTime.now()`
7. Save invitation.
8. Trả `JockeyInvitationResponse`.

Lưu ý theo code hiện tại: reject invitation không tạo registration và không set registration status.

## 11. Admin ảnh hưởng đến OWNER/JOCKEY

Dù tài liệu tập trung OWNER/JOCKEY, cần nhớ vài luồng admin vì trạng thái quyết định owner/jockey có được đăng ký tournament không.

### 11.1 Admin duyệt ngựa

File:

- Controller: `Backend/src/main/java/com/example/backend/controller/AdminHorseController.java`
- Service: `Backend/src/main/java/com/example/backend/service/AdminHorseService.java`

API:

```http
GET /api/admin/horses/pending
PUT /api/admin/horses/{horseId}/approve
PUT /api/admin/horses/{horseId}/reject
```

Code thật:

- Owner tạo/update ngựa thì `Horse.status = "PENDING"`.
- Admin approve thì `Horse.status = "ACTIVE"`.
- Admin reject thì `Horse.status = "REJECTED"` và lưu `rejectionReason`.
- Owner chỉ mời jockey bằng ngựa `ACTIVE`, vì `OwnerServiceImpl.validateHorseCanRegister()` kiểm tra:

```java
if (!STATUS_ACTIVE.equals(horse.getStatus())) ...
```

### 11.2 Admin duyệt Jockey profile

File:

- Controller: `Backend/src/main/java/com/example/backend/controller/AdminController.java`
- Service: `Backend/src/main/java/com/example/backend/service/UserService.java`

API:

```http
GET /api/admin/jockey-profiles/under-review
PUT /api/admin/jockey-profiles/{jockeyId}/approve
PUT /api/admin/jockey-profiles/{jockeyId}/reject
```

Code thật:

- Jockey tạo/update profile thì `User.status` và `JockeyProfile.status` thành `UNDER_REVIEW`.
- Admin approve thì cả user và profile thành `ACTIVE`.
- Admin reject thì cả user và profile thành `REJECTED`, profile có `rejectionReason`.
- Jockey accept invitation phải có cả `User.status = ACTIVE` và `JockeyProfile.status = ACTIVE`.

### 11.3 Admin confirm registration

File:

- Controller: `Backend/src/main/java/com/example/backend/controller/AdminRegistrationController.java`
- Service: `Backend/src/main/java/com/example/backend/service/AdminRegistrationService.java`

API:

```http
GET /api/admin/registrations/accepted
PUT /api/admin/registrations/{registrationId}/confirm
PUT /api/admin/registrations/{registrationId}/reject
GET /api/admin/registrations/history
```

Code thật:

- Jockey accept invitation tạo registration status `ACCEPTED`.
- Admin confirm registration đổi status thành `CONFIRMED`.
- Admin reject registration đổi status thành `REJECTED`.
- Khi confirm, service kiểm tra:
  - tournament phải đang `OPEN_FOR_REGISTRATION` hoặc `CLOSED_REGISTRATION`
  - owner phải `ACTIVE`
  - horse phải thuộc owner, status `ACTIVE`, health cert còn hạn, weight không vượt điều kiện tournament
  - jockey phải `ACTIVE`
  - jockey profile phải `ACTIVE`
  - jockey weight không vượt điều kiện tournament
  - không duplicate confirmed registration của horse/jockey trong tournament
  - tournament chưa vượt `maxParticipants`

## 12. Tóm tắt luồng nghiệp vụ chính

### Luồng Owner tạo ngựa

```text
Frontend click "Create Horse"
-> POST /api/owner/horses
-> JwtFilter đọc token
-> SecurityConfig + @PreAuthorize kiểm tra OWNER
-> OwnerHorseController.createHorse()
-> OwnerServiceImpl.createHorse()
-> getCurrentOwner()
-> HorseRepository.existsByHorseNameIgnoreCase()
-> HorseRepository.save()
-> mapHorseToResponse()
-> trả HTTP 201 + HorseResponse
```

Kết quả: Horse mới có status `PENDING`.

### Luồng Admin duyệt ngựa

```text
Admin click approve horse
-> PUT /api/admin/horses/{horseId}/approve
-> AdminHorseController.approveHorse()
-> AdminHorseService.approveHorse()
-> HorseRepository.findById()
-> kiểm tra horse đang PENDING, healthCertExpiry còn hạn, imgUrl có dữ liệu
-> set status ACTIVE
-> HorseRepository.save()
-> trả HorseResponse
```

Kết quả: Owner có thể dùng ngựa này để mời jockey.

### Luồng Jockey tạo profile

```text
Frontend click "Create Jockey Profile"
-> POST /api/jockey/profile
-> JwtFilter đọc token
-> @PreAuthorize kiểm tra JOCKEY
-> JockeyController.createProfile()
-> JockeyServiceImpl.createProfile()
-> getCurrentJockey()
-> JockeyProfileRepository.existsById()
-> JockeyProfileRepository.existsByLicenseNo()
-> JockeyProfileRepository.save()
-> markProfileUnderReview(): User.status = UNDER_REVIEW
-> UserRepository.save()
-> trả HTTP 201 + JockeyProfileResponse
```

Kết quả: Jockey cần admin approve trước khi accept invitation.

### Luồng Owner mời Jockey tham gia tournament

```text
Frontend click "Invite Jockey"
-> POST /api/owner/invitations
-> JwtFilter đọc token
-> SecurityConfig + @PreAuthorize kiểm tra OWNER
-> OwnerInvitationController.inviteJockey()
-> OwnerServiceImpl.inviteJockey()
-> getCurrentOwner()
-> getOwnedHorse()
-> getTournamentSnapshot() bằng JdbcTemplate
-> validateHorseCanRegister()
-> validateInvitationExpiry()
-> validateOwnerCanRegisterForTournament()
-> validateHorseActiveRegistrationForTournament()
-> getJockey()
-> validateJockeyAvailableForTournament()
-> validateHorseJockeyPairAvailableForOverlappingTournament()
-> RegistrationRepository.findByTournamentIdAndHorseId()
-> JockeyInvitationRepository.existsByTournamentIdAndHorseIdAndJockeyIdAndStatus()
-> JockeyInvitationRepository.save()
-> mapInvitationToResponse()
-> trả HTTP 201 + JockeyInvitationResponse
```

Kết quả: Invitation có status `PENDING`. Chưa có registration mới ở bước này.

### Luồng Jockey accept invitation

```text
Frontend click "Accept"
-> PUT /api/jockey/invitations/{invitationId}/accept
-> JwtFilter đọc token
-> @PreAuthorize kiểm tra JOCKEY
-> JockeyController.acceptInvitation()
-> JockeyServiceImpl.acceptInvitation()
-> getCurrentJockeyWithActiveProfile()
-> getOwnedInvitation()
-> validateInvitationNotExpired()
-> getTournamentSnapshot() bằng JdbcTemplate
-> validateOwnerHorseForInvitation()
-> validateJockeyAvailableForTournament()
-> validateOwnerCanRegisterForTournament()
-> validateHorseActiveRegistrationForTournament()
-> validateHorseJockeyPairAvailableForOverlappingTournament()
-> RegistrationRepository.findByTournamentIdAndHorseId()
-> nếu chưa có Registration thì new Registration()
-> set Registration status ACCEPTED
-> RegistrationRepository.save()
-> set Invitation status ACCEPTED + registrationId
-> JockeyInvitationRepository.save()
-> mapInvitationToResponse()
-> trả JockeyInvitationResponse
```

Kết quả: Invitation `ACCEPTED`, Registration `ACCEPTED`.

### Luồng Admin confirm registration

```text
Admin click confirm registration
-> PUT /api/admin/registrations/{registrationId}/confirm
-> AdminRegistrationController.confirmRegistration()
-> AdminRegistrationService.confirmRegistration()
-> RegistrationRepository.findByIdForUpdate()
-> validateRegistrationForConfirmation()
-> kiểm tra tournament, owner, horse, jockey, condition, duplicate, capacity
-> set Registration status CONFIRMED
-> RegistrationRepository.save()
-> trả AdminRegistrationResponse
```

Kết quả: Registration `CONFIRMED`, được xem là registration active trong nhiều rule của owner/jockey service.

## 13. Các status quan trọng trong code

User status:

- `ACTIVE`
- `PENDING`
- `UNDER_REVIEW`
- `REJECTED`
- `INACTIVE`

Horse status:

- `PENDING`
- `ACTIVE`
- `REJECTED`

JockeyProfile status:

- `UNDER_REVIEW`
- `ACTIVE`
- `REJECTED`
- `INACTIVE`

JockeyInvitation status:

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `CANCELLED`
- `EXPIRED`

Registration status:

- `ACCEPTED`
- `CONFIRMED`
- `CANCELLED`
- `REJECTED`
- `EXPIRED` có constant trong `JockeyServiceImpl` nhưng trong các method đọc được ở đây không thấy set trực tiếp.

Trong rule kiểm tra active registration, code thường xem `ACCEPTED` và `CONFIRMED` là active.

## 14. Câu trả lời mẫu khi cô hỏi

### Hỏi: Sau khi user gửi request tạo ngựa thì Backend chạy qua đâu?

Trả lời:

Request `POST /api/owner/horses` đi qua `JwtFilter` để đọc Bearer token và set authentication. Sau đó `SecurityConfig` và `@PreAuthorize("hasRole('OWNER')")` đảm bảo user có role OWNER. Controller nhận request ở `OwnerHorseController.createHorse()`, validate body bằng `CreateHorseRequest`. Nếu hợp lệ controller gọi `OwnerServiceImpl.createHorse()`. Service lấy owner hiện tại từ `SecurityContextHolder`, kiểm tra tên ngựa không trùng qua `HorseRepository`, build entity `Horse` status `PENDING`, save vào DB, rồi map sang `HorseResponse` trả về HTTP 201.

### Hỏi: Vì sao owner không sửa/xóa được ngựa của owner khác?

Trả lời:

Trong `OwnerServiceImpl`, trước khi xem/sửa/xóa ngựa đều gọi `getOwnedHorse(horseId)`. Method này lấy `ownerId` từ user đang login rồi query:

```java
horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
```

Nếu ngựa không thuộc owner đó thì query không ra dữ liệu và service trả 404 `"Ngựa không tồn tại."`

### Hỏi: Owner gửi lời mời có tạo registration ngay không?

Trả lời:

Không. Trong `OwnerServiceImpl.inviteJockey()`, service chỉ tạo `JockeyInvitation` với status `PENDING`. Registration chỉ được tạo hoặc cập nhật khi jockey gọi `PUT /api/jockey/invitations/{invitationId}/accept` trong `JockeyServiceImpl.acceptInvitation()`.

### Hỏi: Jockey accept invitation thì chuyện gì xảy ra?

Trả lời:

`JockeyController.acceptInvitation()` gọi `JockeyServiceImpl.acceptInvitation()`. Service kiểm tra jockey hiện tại phải có user và profile `ACTIVE`, invitation phải thuộc jockey đó, status `PENDING` và chưa hết hạn. Sau đó kiểm tra horse thuộc owner, horse active, không trùng tournament/overlap. Nếu hợp lệ, service tạo hoặc lấy `Registration`, set `ownerId`, `horseId`, `jockeyId`, `tournamentId`, status `ACCEPTED`, save registration. Cuối cùng set invitation status `ACCEPTED`, lưu `registrationId`, rồi trả `JockeyInvitationResponse`.

### Hỏi: Khi nào registration thành CONFIRMED?

Trả lời:

Jockey accept chỉ tạo registration status `ACCEPTED`. Muốn thành `CONFIRMED` thì admin gọi `PUT /api/admin/registrations/{registrationId}/confirm`, chạy vào `AdminRegistrationService.confirmRegistration()`. Service kiểm tra tournament, owner, horse, jockey, profile, điều kiện cân nặng, trùng đăng ký và số lượng tối đa rồi mới set status `CONFIRMED`.

### Hỏi: Jockey vừa signup xong có accept invitation được không?

Trả lời:

Theo code thì chưa chắc được. `AuthService.signup()` nếu role là `JOCKEY` thì user status ban đầu là `PENDING`. Jockey cần tạo profile, profile và user chuyển sang `UNDER_REVIEW`, sau đó admin approve để cả user và profile thành `ACTIVE`. Method `JockeyServiceImpl.acceptInvitation()` gọi `getCurrentJockeyWithActiveProfile()` nên bắt buộc cả account và profile đều `ACTIVE`.

## 15. Test liên quan đã có

File test liên quan trực tiếp:

- `Backend/src/test/java/com/example/backend/service/OwnerServiceTest.java`

Test hiện có kiểm tra case:

- `inviteJockeyRejectsExpiryAtOrAfterTournamentRegistrationDeadline()`
- Nghĩa là khi owner invite jockey mà `expiredAt` bằng hoặc sau `registrationDeadline` của tournament, service throw `ApiException` HTTP 400 với message `"Thời hạn lời mời phải trước hạn đăng ký của giải đấu."`
- Test cũng verify không gọi `userRepository.findById(20)` và không save invitation khi lỗi này xảy ra.

File test liên quan registration/admin/race:

- `Backend/src/test/java/com/example/backend/service/AdminRegistrationServiceTest.java`
- `Backend/src/test/java/com/example/backend/service/RaceEntryServiceTest.java`

Các test này không phải API OWNER/JOCKEY trực tiếp, nhưng có liên quan vì registration sau khi jockey accept sẽ được admin confirm rồi mới dùng tiếp trong race entry.
