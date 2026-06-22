# Test kien thuc Backend - Horse Racing System

> Muc tieu: hoc de co the giai thich code backend khi bi hoi. Khong hoc frontend.

## 1. Backend nay dung cong nghe gi?

Backend la mot ung dung **Spring Boot** viet bang Java.

Nhung thu quan trong trong `backend/pom.xml`:

- `spring-boot-starter-web`: tao REST API bang controller.
- `spring-boot-starter-validation`: validate request body bang annotation nhu `@NotBlank`, `@Size`, `@Pattern`.
- `spring-boot-starter-data-jpa`: lam viec voi database bang Entity va Repository.
- `mysql-connector-j`: ket noi MySQL.
- `spring-boot-starter-security`: bao mat API, phan quyen.
- `jjwt`: tao va doc JWT token.
- `lombok`: giam code getter/setter/constructor/builder.
- `springdoc-openapi`: Swagger UI de xem/test API.

File chay chinh:

```java
backend/src/main/java/com/example/backend/Application.java
```

Trong do co:

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

Khi run backend, Spring Boot se scan package `com.example.backend`, tao bean cho controller, service, repository, security config...

## 2. Cau truc folder backend

Backend chia theo layer:

```text
backend/src/main/java/com/example/backend
|-- controller   // Nhan HTTP request, goi service, tra response
|-- service      // Xu ly nghiep vu chinh
|-- repository   // Truy van database
|-- entity       // Mapping bang database
|-- dto
|   |-- request  // Object nhan request body
|   |-- response // Object tra response cho client
|-- security     // JWT, filter, security config
|-- exception    // Xu ly loi tap trung
|-- config       // Swagger config
|-- constant     // Hang so, enum
```

Cach giai thich ngan gon:

> Client gui request len API. Controller nhan request body/path variable, Spring validate DTO, sau do controller goi service. Service xu ly rule nghiep vu, lay user tu token neu can, goi repository de doc/ghi database. Repository lam viec voi Entity. Sau khi xu ly xong, service map Entity sang Response DTO va controller tra JSON ve client. Neu co loi thi throw `ApiException`, `GlobalExceptionHandler` bat loi va tra response loi.

## 3. Luong request tong quat

Vi du mot request tao ngua:

```http
POST /api/owner/horses
Authorization: Bearer <token>
Content-Type: application/json

{
  "horseName": "Lightning",
  "breed": "Arabian",
  "gender": "MALE",
  "color": "Black",
  "dayOfBirth": "2020-01-01",
  "weight": 450,
  "healthCertExpiry": "2026-12-31",
  "imgUrl": "https://example.com/horse.jpg"
}
```

Luong chay:

1. Request di vao Spring Security.
2. `JwtFilter` doc header `Authorization`.
3. Neu token hop le, `JwtFilter` lay email va role tu token, set vao `SecurityContextHolder`.
4. Security check endpoint `/api/owner/**` can role `OWNER`.
5. Request di vao `OwnerHorseController.createHorse`.
6. Spring convert JSON body thanh `CreateHorseRequest`.
7. `@Valid` kiem tra cac annotation trong DTO.
8. Controller goi `ownerService.createHorse(request)`.
9. `OwnerServiceImpl.createHorse` lay owner dang login tu token.
10. Service check ten ngua co trung khong.
11. Service tao Entity `Horse`.
12. Service goi `horseRepository.save(horse)` de insert database.
13. Service map `Horse` sang `HorseResponse`.
14. Controller tra HTTP `201 CREATED` kem JSON response.

## 4. Controller la gi?

Controller la lop dung de expose API.

Vi du `AuthController`:

```java
@RestController
@RequestMapping("/api/auth/")
@AllArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.getEmail(), request.getPassword());
    }
}
```

Giai thich annotation:

- `@RestController`: class nay la REST controller, return object se duoc convert thanh JSON.
- `@RequestMapping("/api/auth/")`: prefix URL chung.
- `@PostMapping("login")`: map method POST `/api/auth/login`.
- `@RequestBody`: lay JSON body cua request gan vao object Java.
- `@Valid`: bat validation tren DTO.
- `ResponseEntity`: cho phep custom HTTP status, vi du `201 CREATED`.

Controller khong nen viet nhieu logic nghiep vu. Controller chi nen:

- nhan request,
- lay path variable/body,
- goi service,
- tra response.

## 5. DTO Request va Response

DTO la object trung gian giua client va backend.

### Request DTO

Vi du `CreateHorseRequest`:

```java
public class CreateHorseRequest {
    @NotBlank(message = "Ten ngua la bat buoc")
    @Size(min = 2, max = 100)
    private String horseName;

    @NotNull
    @PastOrPresent
    private LocalDate dayOfBirth;
}
```

Y nghia:

- Client gui JSON body.
- Spring convert JSON thanh object `CreateHorseRequest`.
- `@Valid` trong controller kich hoat validate.
- Neu sai validation, Spring nem `MethodArgumentNotValidException`.
- `GlobalExceptionHandler` bat loi va tra HTTP 400.

Mot so annotation hay gap:

- `@NotBlank`: String khong duoc null, rong, hoac toan space.
- `@NotNull`: khong duoc null.
- `@Size`: do dai min/max.
- `@Pattern`: regex.
- `@Email`: format email.
- `@PastOrPresent`: ngay qua khu hoac hom nay.
- `@FutureOrPresent`: ngay tuong lai hoac hom nay.
- `@DecimalMin`, `@DecimalMax`: gioi han so.

### Response DTO

Response DTO dung de tra ve dung thong tin client can, khong tra thang Entity.

Vi du `HorseResponse` co the tra:

- `horseId`
- `ownerId`
- `horseName`
- `status`
- `registrationCount`
- `participated`

Ly do dung Response DTO:

- Che giau field nhay cam.
- Format data theo nhu cau man hinh.
- Khong bi lo cau truc database.

## 6. Service la gi?

Service la noi xu ly nghiep vu.

Vi du `AuthService.login`:

1. Validate email/password.
2. Tim user bang `userRepository.findByEmail(email)`.
3. Check user co duoc login khong.
4. Check password bang `passwordEncoder.matches`.
5. Tao JWT token bang `jwtUtil.generateToken`.
6. Tao `LoginResponse` tra ve token va user info.

Vi du `OwnerServiceImpl.createHorse`:

1. Lay owner hien tai bang `getCurrentOwner`.
2. Trim ten ngua.
3. Check ten ngua trung bang `horseRepository.existsByHorseNameIgnoreCase`.
4. Tao Entity `Horse`.
5. Set status ban dau la `PENDING`.
6. Save database.
7. Map sang `HorseResponse`.

Service thuong co:

- `@Service`: danh dau class service de Spring quan ly.
- `@Transactional`: dam bao cac thao tac database trong cung transaction.
- `@Transactional(readOnly = true)`: chi doc database, toi uu hon.
- Throw `ApiException` khi gap loi nghiep vu.

## 7. Repository la gi?

Repository la layer truy van database.

Vi du:

```java
@Repository
public interface HorseRepository extends JpaRepository<Horse, Integer> {
    List<Horse> findByOwnerId(Integer ownerId);
    Optional<Horse> findByHorseIdAndOwnerId(Integer horseId, Integer ownerId);
    boolean existsByHorseNameIgnoreCase(String horseName);
}
```

`JpaRepository<Horse, Integer>` nghia la:

- Entity la `Horse`.
- Khoa chinh cua `Horse` co type `Integer`.

Spring Data JPA tu sinh query dua theo ten method:

- `findByOwnerId`: select horse theo ownerId.
- `existsByHorseNameIgnoreCase`: check co horseName trung khong, khong phan biet hoa thuong.
- `countByOwnerId`: dem so luong ngua cua owner.

Khi query phuc tap thi dung `@Query`.

Vi du trong `RegistrationRepository` co query check tournament bi trung thoi gian:

```java
@Query("""
    select count(r)
    from Registration r
    join Tournament t on t.tournamentId = r.tournamentId
    where r.jockeyId = :jockeyId
      and r.status in :statuses
      and t.startDate <= :endDate
      and t.endDate >= :startDate
""")
long countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(...);
```

Y nghia: dem so registration cua jockey nam trong tournament co thoi gian bi overlap.

## 8. Entity la gi?

Entity mapping voi table trong database.

Vi du `Horse`:

```java
@Entity
@Table(name = "Horse")
public class Horse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "horseID")
    private Integer horseId;

    @Column(name = "ownerID", nullable = false)
    private Integer ownerId;
}
```

Giai thich:

- `@Entity`: class nay la entity JPA.
- `@Table(name = "Horse")`: map voi table `Horse`.
- `@Id`: khoa chinh.
- `@GeneratedValue`: database tu tang ID.
- `@Column`: map field Java voi column database.

Trong `Horse` co:

```java
@PrePersist
void prePersist() {
    createdAt = now;
    updatedAt = now;
    if (status == null) {
        status = "PENDING";
    }
}

@PreUpdate
void preUpdate() {
    updatedAt = LocalDateTime.now();
}
```

Y nghia:

- Truoc khi insert, tu set `createdAt`, `updatedAt`, status default.
- Truoc khi update, tu cap nhat `updatedAt`.

## 9. Dependency Injection trong code

Code hay dung constructor injection:

```java
private final OwnerService ownerService;

public OwnerHorseController(OwnerService ownerService) {
    this.ownerService = ownerService;
}
```

Y nghia:

- Spring tu tao object `OwnerServiceImpl`.
- Spring inject vao controller.
- Controller khong can `new OwnerServiceImpl()`.

Co cho dung Lombok:

```java
@AllArgsConstructor
public class AuthController {
    private final AuthService authService;
}
```

`@AllArgsConstructor` tu sinh constructor cho field `final`.

## 10. Security va JWT

Backend dung JWT de xac thuc.

### SecurityConfig

File:

```text
backend/src/main/java/com/example/backend/security/SecurityConfig.java
```

Nhung cau hinh chinh:

- Tat CSRF: vi backend dung REST API stateless.
- Session stateless: server khong luu session login.
- Allow CORS cho localhost/ngrok.
- `/api/auth/**` cho phep public.
- GET tournament/race public.
- POST/PUT/DELETE tournament/race chi ADMIN.
- `/api/admin/**` chi ADMIN.
- `/api/owner/**` chi OWNER.
- `/api/user/me` can authenticated.
- Cac request khac can login.

### JwtUtil

`JwtUtil.generateToken(email, role)` tao token:

- subject la email.
- claim `role` la role user.
- co issuedAt va expiration.
- sign bang secret key.

`JwtUtil.extractClaims(token)` doc token va verify chu ky.

### JwtFilter

`JwtFilter` chay truoc controller.

Luong:

1. Lay header `Authorization`.
2. Neu bat dau bang `Bearer ` thi cat token.
3. Goi `jwtUtil.extractClaims(token)`.
4. Lay email tu subject.
5. Lay role tu claim `role`.
6. Tao `UsernamePasswordAuthenticationToken`.
7. Set vao `SecurityContextHolder`.

Sau do service co the lay user hien tai:

```java
Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
String email = authentication.getName();
```

## 11. Phan quyen theo role

Trong `SecurityConfig`:

```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/owner/**").hasRole("OWNER")
```

Trong controller cung co:

```java
@PreAuthorize("hasRole('OWNER')")
```

Y nghia:

- Request phai co JWT.
- JWT phai co role phu hop.
- Trong `JwtFilter`, role duoc convert thanh authority `ROLE_` + role.
- Vi du role `OWNER` thanh `ROLE_OWNER`.

Neu sai role thi bi 403 Forbidden.
Neu khong co token/khong authenticated thi bi 401 Unauthorized hoac bi Security chan.

## 12. Exception handling

Backend co xu ly loi tap trung bang:

```java
@RestControllerAdvice
public class GlobalExceptionHandler
```

`ApiException` co:

```java
private final HttpStatus status;
```

Service throw loi:

```java
throw new ApiException(HttpStatus.CONFLICT, "Ten ngua da ton tai.");
```

`GlobalExceptionHandler` bat:

```java
@ExceptionHandler(ApiException.class)
public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
    ErrorResponse error = new ErrorResponse(ex.getStatus().value(), ex.getMessage());
    return ResponseEntity.status(ex.getStatus()).body(error);
}
```

Ket qua client nhan JSON loi, vi du:

```json
{
  "status": 409,
  "message": "Ten ngua da ton tai."
}
```

Nhung loai loi co handler:

- `ApiException`: loi nghiep vu co status tuy chon.
- `MethodArgumentNotValidException`: loi validation request body, tra 400.
- `NoResourceFoundException`: endpoint/tai nguyen khong ton tai, tra 404.
- `HttpRequestMethodNotSupportedException`: sai method HTTP, tra 405.
- `Exception`: loi khac, tra 500.

## 13. Flow mau: Login

Endpoint:

```http
POST /api/auth/login
```

Controller:

```java
public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request.getEmail(), request.getPassword());
}
```

Luong:

1. Client gui email/password.
2. Spring map JSON thanh `LoginRequest`.
3. `@Valid` check email/password.
4. Controller goi `AuthService.login`.
5. Service validate lai email/password bang logic rieng.
6. Service tim user theo email.
7. Neu khong thay user: throw 401.
8. Neu user khong duoc login: throw 401.
9. Check password:
   - Neu password trong DB la BCrypt thi dung `passwordEncoder.matches`.
   - Neu password cu dang plain text va dung thi encode lai roi save.
10. Tao token JWT co email va role.
11. Tra `LoginResponse(token, userInfo)`.

Cau tra loi mau:

> Login di qua `AuthController`, request body duoc map vao `LoginRequest` va validate bang `@Valid`. Sau do controller goi `AuthService.login`. Service tim user bang email, check trang thai tai khoan, check password bang BCrypt, tao JWT bang `JwtUtil`, roi tra ve `LoginResponse` gom token va thong tin user.

## 14. Flow mau: Signup

Endpoint:

```http
POST /api/auth/signup
```

Luong:

1. Client gui `SignupRequest`.
2. Controller goi `authService.signup(request)`.
3. Service validate email, fullName, password, phone, role.
4. Check email da ton tai chua.
5. Check phone da ton tai chua.
6. Role public chi duoc `OWNER`, `JOCKEY`, `SPECTATOR`.
7. Neu khong gui role thi default la `SPECTATOR`.
8. Lay role entity tu `RoleRepository`.
9. Tao `User`.
10. Encode password bang BCrypt.
11. Neu role la JOCKEY thi status ban dau la `PENDING`.
12. Save user.
13. Map sang `UserResponse`.

Cau tra loi mau:

> Signup tao user moi. Service check email/phone khong trung, normalize role, lay Role trong database, encode password bang `PasswordEncoder`, save user bang `UserRepository`, roi tra `UserResponse`.

## 15. Flow mau: Owner tao horse

Endpoint:

```http
POST /api/owner/horses
```

Controller:

```java
@PostMapping
public ResponseEntity<HorseResponse> createHorse(@Valid @RequestBody CreateHorseRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.createHorse(request));
}
```

Luong:

1. Security check JWT va role OWNER.
2. `CreateHorseRequest` validate:
   - ten ngua bat buoc, 2-100 ky tu,
   - gender la MALE/FEMALE,
   - ngay sinh khong duoc o tuong lai,
   - can nang 200-1000 kg,
   - health certificate chua het han,
   - imgUrl phai la HTTP/HTTPS.
3. Controller goi `OwnerServiceImpl.createHorse`.
4. Service lay owner hien tai bang `getCurrentOwner`.
5. `getCurrentOwner` lay email tu `SecurityContextHolder`, tim user trong DB, check role OWNER.
6. Service normalize ten ngua bang trim.
7. Check ten ngua trung bang `horseRepository.existsByHorseNameIgnoreCase`.
8. Tao `Horse` bang builder.
9. Set `ownerId` la user dang login.
10. Set status `PENDING`.
11. Save bang `horseRepository.save`.
12. Map sang `HorseResponse`.
13. Controller tra status 201.

Cau tra loi mau:

> Tao horse khong nhan ownerId tu client de tranh gia mao. Backend lay ownerId tu JWT hien tai qua `SecurityContextHolder`. Service check ngua co trung ten khong, tao entity `Horse` voi status `PENDING`, save vao DB, roi map sang `HorseResponse`.

## 16. Flow mau: Owner lay danh sach horse

Endpoint:

```http
GET /api/owner/horses
```

Luong:

1. Security check role OWNER.
2. Controller goi `ownerService.getMyHorses()`.
3. Service lay ownerId hien tai.
4. Goi `horseRepository.findByOwnerId(ownerId)`.
5. Map tung `Horse` sang `HorseResponse`.
6. Trong mapping co tinh them:
   - `registrationCount`
   - `participated`
7. Tra list JSON.

Diem can noi:

> API nay chi tra ngua cua owner dang login, khong tra ngua cua owner khac. Dieu nay dam bao bang viec backend lay ownerId tu token, khong tin ownerId tu client.

## 17. Flow mau: Owner update horse

Endpoint:

```http
PUT /api/owner/horses/{horseId}
```

Luong:

1. Lay `horseId` tu `@PathVariable`.
2. Lay body vao `UpdateHorseRequest`.
3. Service goi `getOwnedHorse(horseId)`.
4. `getOwnedHorse` query `findByHorseIdAndOwnerId(horseId, ownerId)`.
5. Neu khong tim thay thi throw 404.
6. Check ten moi co trung voi con ngua khac khong.
7. Update field.
8. Set lai status `PENDING`.
9. Clear `rejectionReason`.
10. Save.

Y nghia nghiep vu:

> Khi owner sua thong tin horse, horse phai ve lai `PENDING` de admin review lai.

## 18. Flow mau: Owner xoa horse

Endpoint:

```http
DELETE /api/owner/horses/{horseId}
```

Luong:

1. Check horse thuoc owner dang login.
2. Neu horse da co invitation thi khong cho xoa.
3. Neu horse da co registration thi khong cho xoa.
4. Neu hop le thi `horseRepository.delete(horse)`.
5. Controller tra `204 No Content`.

Cau tra loi mau:

> Delete horse co rang buoc nghiep vu. Backend khong xoa neu ngua da co loi moi jockey hoac don dang ky giai dau, vi xoa se pha lien ket du lieu.

## 19. Flow mau: Owner moi jockey

Endpoint:

```http
POST /api/owner/invitations
```

Service chinh:

```java
OwnerServiceImpl.inviteJockey
```

Luong nghiep vu:

1. Lay owner hien tai.
2. Lay horse va dam bao horse thuoc owner.
3. Lay tournament snapshot bang `JdbcTemplate`.
4. Check horse co the dang ky:
   - horse status phai `ACTIVE`,
   - tournament status phai `OpenForRegistration`,
   - chua qua registration deadline,
   - chua vuot max participants.
5. Check expiry cua invitation phai truoc deadline tournament.
6. Check owner chua co registration active/pending invitation trong tournament.
7. Check horse chua co registration active trong tournament.
8. Lay jockey va check:
   - user role JOCKEY,
   - user status ACTIVE,
   - profile ton tai va ACTIVE.
9. Check jockey khong bi trung tournament/overlap thoi gian.
10. Check cap horse + jockey khong bi overlap.
11. Check chua co invitation pending trung.
12. Tao `JockeyInvitation` status `PENDING`.
13. Save va tra `JockeyInvitationResponse`.

Diem hay bi hoi:

> Vi sao co nhieu validate trong service?

Tra loi:

> Vi invitation lien quan nhieu bang va nhieu rule nghiep vu: horse, owner, jockey, tournament, registration, invitation. Service la noi phu hop de gom cac rule nay, controller chi nhan request.

## 20. Flow mau: Jockey chap nhan invitation

Endpoint:

```http
PUT /api/jockey/invitations/{invitationId}/accept
```

Service:

```java
JockeyServiceImpl.acceptInvitation
```

Luong:

1. Lay jockey hien tai tu JWT.
2. Bat buoc user va profile jockey dang `ACTIVE`.
3. Lay invitation theo `invitationId` va `jockeyId`.
4. Check invitation dang `PENDING`.
5. Check invitation chua het han.
6. Lay tournament snapshot.
7. Check horse thuoc owner gui loi moi va horse dang ACTIVE.
8. Check jockey khong bi trung lich.
9. Check owner/horse/cap horse+jockey khong co registration active khac.
10. Tim registration theo tournamentId + horseId, neu chua co thi tao moi.
11. Set invitation status `ACCEPTED`.
12. Set registration:
    - tournamentId
    - horseId
    - ownerId
    - jockeyId
    - status `ACCEPTED`
13. Save registration.
14. Gan `registrationId` vao invitation.
15. Save invitation.
16. Tra response.

Cau tra loi mau:

> Khi jockey accept invitation, backend khong chi update invitation ma con tao/cap nhat registration. Registration se co status `ACCEPTED`, gan horse, owner va jockey. Toan bo nam trong transaction de tranh du lieu nua thanh cong nua that bai.

## 21. Flow mau: Admin xep race entry

Endpoint:

```http
POST /api/admin/race-entries
```

Controller:

```java
public ResponseEntity<RaceEntry> createRaceEntry(@Valid @RequestBody CreateRaceEntryRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(raceEntryService.createRaceEntry(request));
}
```

Service:

```java
RaceEntryService.createRaceEntry
```

Luong:

1. Lay registration bang `registrationRepository.findByIdForUpdate`.
2. `findByIdForUpdate` dung `@Lock(PESSIMISTIC_WRITE)` de khoa row, tranh 2 admin xep cung luc gay trung.
3. Registration phai co status `CONFIRMED`.
4. Lay race bang `raceRepository.findByIdForUpdate`.
5. Race phai dang status `DRAFT`.
6. Lay round cua race.
7. Check registration va race phai cung tournament.
8. Check registration chua co entry trong race nay.
9. Check registration chua duoc xep vao race khac trong cung round.
10. Lay lane number lon nhat hien tai + 1.
11. Tao `RaceEntry`, status `ASSIGNED`.
12. Save and flush.
13. Neu database bao conflict thi throw 409.

Cau tra loi mau:

> Xep race entry can transaction va lock vi co nguy co nhieu request cung luc. Service lock registration va race, check trang thai hop le, check khong trung trong cung race/round, tu tinh lane number, roi save `RaceEntry`.

## 22. Transaction dung de lam gi?

`@Transactional` dam bao cac thao tac database trong method thanh cong hoac rollback cung nhau.

Vi du khi jockey accept invitation:

- update invitation,
- save registration,
- gan registrationId vao invitation,
- save invitation.

Neu mot buoc loi, transaction rollback, database khong bi trang thai dang do.

`@Transactional(readOnly = true)` dung cho API chi doc data, vi du:

- get my horses,
- get dashboard,
- get race entries.

## 23. Mapping Entity sang DTO

Trong service co cac ham map, vi du:

```java
private HorseResponse mapHorseToResponse(Horse horse) {
    List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
    return HorseResponse.builder()
            .horseId(horse.getHorseId())
            .ownerId(horse.getOwnerId())
            .horseName(horse.getHorseName())
            .registrationCount(registrationIds.size())
            .participated(hasActiveRegistration(registrationIds))
            .build();
}
```

Y nghia:

- Entity la du lieu trong DB.
- Response DTO la du lieu tra ve client.
- Khi map co the them thong tin tinh toan, vi du `registrationCount`.

## 24. Tai sao khong cho client gui ownerId?

Trong cac API owner, backend lay owner tu JWT:

```java
Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
User user = userRepository.findByEmail(authentication.getName()).orElseThrow(...);
```

Ly do:

- Neu client gui ownerId, user co the gia mao ownerId cua nguoi khac.
- Lay owner tu token an toan hon.
- Moi thao tac nhu get/update/delete horse deu check horse thuoc owner hien tai.

Cau tra loi mau:

> Backend khong tin ownerId tu request body. Token cho biet ai dang dang nhap, service lay user tu `SecurityContextHolder` va chi thao tac tren du lieu thuoc user do.

## 25. Cac role chinh trong he thong

Role thay trong code:

- `ADMIN`: quan ly user, review horse/jockey, tournament, race, race entry, referee assignment.
- `OWNER`: quan ly horse, dashboard, invitation.
- `JOCKEY`: tao/cap nhat profile, xem/chap nhan/tu choi invitation.
- `REFEREE`: co role trong user/admin, lien quan referee assignment.
- `SPECTATOR`: role mac dinh khi public signup neu khong chon role.

## 26. Cac status quan trong

User/Jockey/Horse:

- `ACTIVE`: dang hoat dong.
- `PENDING`: cho xu ly.
- `UNDER_REVIEW`: dang cho admin review.
- `REJECTED`: bi tu choi.
- `INACTIVE`: ngung hoat dong.

Invitation:

- `PENDING`: dang cho jockey phan hoi.
- `ACCEPTED`: jockey chap nhan.
- `REJECTED`: jockey tu choi.
- `CANCELLED`: owner huy.
- `EXPIRED`: qua han.

Registration:

- `ACCEPTED`: jockey da accept invitation, don duoc chap nhan o muc owner/jockey.
- `CONFIRMED`: admin da xac nhan.
- `REJECTED`: bi tu choi.
- `CANCELLED`: bi huy.
- `EXPIRED`: qua han.

RaceEntry:

- `ASSIGNED`: da duoc xep vao race.
- `WITHDRAWN`: rut khoi race.

Tournament:

- `OpenForRegistration`: dang mo dang ky.

## 27. Danh sach endpoint backend chinh

Auth:

- `POST /api/auth/login`
- `POST /api/auth/signup`

User:

- `GET /api/user/me`
- `GET /api/user/all`

Owner:

- `GET /api/owner/dashboard`
- `GET /api/owner/horses`
- `GET /api/owner/horses/{horseId}`
- `POST /api/owner/horses`
- `PUT /api/owner/horses/{horseId}`
- `DELETE /api/owner/horses/{horseId}`
- `GET /api/owner/invitations`
- `POST /api/owner/invitations`
- `PUT /api/owner/invitations/{invitationId}/cancel`

Jockey:

- `GET /api/jockey/profile`
- `POST /api/jockey/profile`
- `PUT /api/jockey/profile`
- `PUT /api/jockey/profile/inactive`
- `GET /api/jockey/invitations`
- `PUT /api/jockey/invitations/{invitationId}/accept`
- `PUT /api/jockey/invitations/{invitationId}/reject`

Admin:

- `POST /api/admin/users`
- `GET /api/admin/users`
- `GET /api/admin/users/{userID}`
- `PUT /api/admin/users/{userID}`
- `DELETE /api/admin/users/{userID}`
- `GET /api/admin/jockey-profiles/under-review`
- `PUT /api/admin/jockey-profiles/{jockeyId}/approve`
- `PUT /api/admin/jockey-profiles/{jockeyId}/reject`
- `GET /api/admin/horses/pending`
- `PUT /api/admin/horses/{horseId}/approve`
- `PUT /api/admin/horses/{horseId}/reject`
- `GET /api/admin/registrations/accepted`
- `PUT /api/admin/registrations/{registrationId}/confirm`
- `PUT /api/admin/registrations/{registrationId}/reject`
- `GET /api/admin/registrations/history`
- `POST /api/admin/race-entries`
- `GET /api/admin/race-entries/by-race/{raceId}`
- `GET /api/admin/race-entries/assignment-queue`
- `GET /api/admin/race-entries/unassigned/by-round/{roundId}`
- `POST /api/admin/referee-assignments`
- `PUT /api/admin/referee-assignments/{raceId}/referee/{refereeUserId}`
- `DELETE /api/admin/referee-assignments/{raceId}`
- `GET /api/admin/referee-assignments`
- `GET /api/admin/referee-assignments/by-race/{raceId}`
- `GET /api/admin/referee-assignments/referees`
- `GET /api/admin/dashboard/summary`

Tournament/Race public va admin:

- `GET /api/tournaments`
- `GET /api/tournaments/{id}`
- `POST /api/tournaments`
- `PUT /api/tournaments/{id}`
- `PUT /api/tournaments/{id}/open-registration`
- `DELETE /api/tournaments/{id}`
- `GET /api/races`
- `GET /api/races/{id}`
- `GET /api/races/by-tournament/{tournamentId}`
- `GET /api/races/by-round/{roundId}`
- `POST /api/races`
- `PUT /api/races/{id}`
- `DELETE /api/races/{id}`
- `GET /api/tournament-conditions`
- `GET /api/tournament-conditions/{id}`
- `GET /api/tournament-rounds/by-tournament/{tournamentId}`
- `GET /api/tournament-rounds/{id}`

## 28. Cach tra loi khi bi hoi "request body di dau?"

Cau tra loi mau:

> Request body la JSON tu client gui len. O controller, minh dung `@RequestBody` de Spring convert JSON thanh DTO Java, vi du `CreateHorseRequest`. Neu co `@Valid`, Spring validate DTO truoc khi vao service. Sau do controller truyen DTO nay vao service. Service lay data tu DTO, check business rule, tao hoac update entity, goi repository save vao database. Cuoi cung service map entity sang response DTO va controller tra JSON ve client.

## 29. Cach tra loi khi bi hoi "controller khac service the nao?"

Tra loi:

> Controller la tang giao tiep HTTP: nhan URL, body, path variable, query param va tra response. Service la tang xu ly nghiep vu: validate rule, check permission theo data, goi repository, transaction, mapping response. Controller khong nen viet logic phuc tap de code de bao tri va de test.

## 30. Cach tra loi khi bi hoi "repository tu query nhu the nao?"

Tra loi:

> Repository extend `JpaRepository`, nen co san cac ham CRUD nhu `findById`, `save`, `delete`, `findAll`. Ngoai ra Spring Data JPA co the sinh query tu ten method, vi du `findByOwnerId` hay `existsByHorseNameIgnoreCase`. Neu query phuc tap thi viet `@Query` bang JPQL.

## 31. Cach tra loi khi bi hoi "JWT dung de lam gi?"

Tra loi:

> JWT dung de xac thuc request sau login. Khi login thanh cong, backend tao token co email va role. Client gui token trong header `Authorization: Bearer ...`. `JwtFilter` doc token, verify chu ky, lay email/role va set vao `SecurityContextHolder`. Sau do Spring Security dung role de cho phep hoac chan endpoint.

## 32. Cach tra loi khi bi hoi "role OWNER duoc lay tu dau?"

Tra loi:

> Role duoc luu trong database o user/role. Khi login, `AuthService` lay `user.getRole().getRoleName()` roi dua vao JWT claim `role`. O cac request sau, `JwtFilter` doc role tu token va tao authority `ROLE_OWNER`, `ROLE_ADMIN`, ... De `hasRole('OWNER')` check duoc.

## 33. Cach tra loi khi bi hoi "tai sao dung GlobalExceptionHandler?"

Tra loi:

> De xu ly loi tap trung va response loi dong nhat. Service chi can throw `ApiException(status, message)`, con `GlobalExceptionHandler` se convert thanh JSON loi. Validation loi cung duoc bat o day va tra 400 voi message ro rang.

## 34. Cach tra loi khi bi hoi "tai sao dung DTO thay vi Entity?"

Tra loi:

> DTO tach request/response khoi database entity. Request DTO giup validate input. Response DTO giup chi tra nhung field can thiet, tranh lo field nhay cam nhu password va cho phep them field tinh toan nhu registrationCount.

## 35. Cach tra loi khi bi hoi "tai sao dung @Transactional?"

Tra loi:

> `@Transactional` dam bao nhieu thao tac database trong mot nghiep vu thanh cong hoac rollback cung nhau. Vi du accept invitation vua update invitation vua tao registration. Neu loi giua chung thi rollback de database khong bi lech trang thai.

## 36. Cach tra loi khi bi hoi "validation nam o dau?"

Tra loi:

> Co hai lop validation. Lop dau tien la DTO validation bang annotation nhu `@NotBlank`, `@Pattern`, duoc kich hoat boi `@Valid` trong controller. Lop thu hai la business validation trong service, vi du check email da ton tai, ngua co ACTIVE khong, tournament con mo dang ky khong, jockey co bi trung lich khong.

## 37. Cach tra loi khi bi hoi "database duoc insert o dau?"

Tra loi:

> Database khong insert truc tiep trong controller. Controller goi service, service tao entity va goi repository. Vi du tao horse thi `OwnerServiceImpl.createHorse` tao object `Horse`, sau do goi `horseRepository.save(horse)`. JPA se sinh SQL insert/update tuong ung.

## 38. Cach tra loi khi bi hoi "lay user dang dang nhap the nao?"

Tra loi:

> Sau khi `JwtFilter` verify token, filter set authentication vao `SecurityContextHolder`. Trong service goi `SecurityContextHolder.getContext().getAuthentication()`, lay email bang `authentication.getName()`, roi query `UserRepository.findByEmail(email)` de lay user trong DB.

## 39. Cach tra loi khi bi hoi "phan biet 401, 403, 404, 409"

- `400 Bad Request`: request sai format/validation/business input sai.
- `401 Unauthorized`: chua login, token sai, email/password sai.
- `403 Forbidden`: da login nhung khong co quyen/role.
- `404 Not Found`: khong tim thay tai nguyen.
- `409 Conflict`: xung dot du lieu/nghiep vu, vi du ten ngua trung, registration da ton tai.
- `500 Internal Server Error`: loi server khong mong doi.

## 40. Checklist hoc nhanh truoc khi bi hoi

Can nam chac:

- Request flow: Client -> Security/JwtFilter -> Controller -> DTO validation -> Service -> Repository -> Entity/Database -> Response DTO.
- `@RestController`, `@RequestMapping`, `@PostMapping`, `@GetMapping`, `@RequestBody`, `@PathVariable`, `@Valid`.
- DTO request/response la gi.
- Service xu ly business logic.
- Repository extend `JpaRepository`.
- Entity mapping table database.
- JWT token co email va role.
- Role duoc check bang `hasRole`.
- Loi duoc xu ly bang `GlobalExceptionHandler`.
- `@Transactional` dung de rollback khi loi.

## 41. Mot cau tra loi tong hop rat hay dung

Neu bi hoi "em giai thich mot API bat ky di", co the tra loi theo form:

> Em lay vi du API tao horse. Client gui `POST /api/owner/horses` kem JWT va JSON body. Dau tien request qua Spring Security, `JwtFilter` doc token va set user vao `SecurityContextHolder`, sau do check role OWNER. Controller `OwnerHorseController` nhan body bang `@RequestBody CreateHorseRequest` va validate bang `@Valid`. Controller khong xu ly nhieu ma goi `ownerService.createHorse`. Trong service, backend lay owner hien tai tu token, check horseName khong trung, normalize data, tao entity `Horse` voi status `PENDING`, save bang `HorseRepository`. Sau do service map entity sang `HorseResponse`, controller tra ve HTTP 201. Neu co loi nhu ten ngua trung thi service throw `ApiException`, `GlobalExceptionHandler` bat va tra JSON loi voi status 409.
