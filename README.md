# Horse Racing System

Horse Racing System là hệ thống quản lý giải đua ngựa, hỗ trợ các vai trò Admin, Owner, Jockey, Referee và Spectator. Dự án gồm backend Spring Boot, frontend React/Vite và cơ sở dữ liệu MySQL.

## Công Nghệ Sử Dụng

### Backend

- Java 21
- Spring Boot 3.3.4
- Spring Web để xây dựng REST API
- Spring Security và JWT để đăng nhập, xác thực và phân quyền
- Spring Data JPA/Hibernate để làm việc với database
- MySQL Connector/J
- Lombok
- Springdoc OpenAPI/Swagger UI
- Maven Wrapper
- JUnit và Spring Security Test cho unit test

### Frontend

- React 19
- Vite 7
- Tailwind CSS 4
- Lucide React cho icon
- Recharts cho biểu đồ/thống kê
- Manrope font

### Database

- MySQL
- Schema và seed data nằm tại `backend/src/main/resources/db/team_schema.sql`
- Database mặc định: `horse_racing_system`

## Cấu Trúc Thư Mục

```text
horse-racing-system/
├── backend/                         # Spring Boot REST API
├── frontend/                        # React + Vite web app
├── backend/src/main/resources/db/   # SQL schema và seed data
├── task.md                          # Phân công công việc trong team
├── run backend.md                   # Ghi chú lệnh chạy backend local
└── Main Database.md                 # Tài liệu database
```

## Yêu Cầu Cài Đặt

- JDK 21
- Node.js và npm
- MySQL Server
- PowerShell nếu chạy trên Windows

## Setup Database

Mở MySQL và import file schema:

```bash
mysql -u root -p < backend/src/main/resources/db/team_schema.sql
```

File SQL sẽ tạo lại database `horse_racing_system`, tạo bảng, khóa ngoại và seed dữ liệu mẫu.

Một số tài khoản seed để test local:

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@c.com` | `admin123` |
| OWNER | `owner@test.com` | `owner123` |
| JOCKEY | `jockey@test.com` | `jockey123` |
| REFEREE | `referee@test.com` | `referee123` |
| SPECTATOR | `spectator@test.com` | `spectator123` |

## Setup Backend

Di chuyển vào thư mục backend:

```powershell
cd backend
```

Kiểm tra cấu hình database trong file:

```text
backend/src/main/resources/application.properties
```

Cấu hình mặc định đang dùng MySQL local:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/horse_racing_system?
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=none
```

Nếu máy bạn dùng mật khẩu MySQL khác, chỉ cần đổi `spring.datasource.password` trong `application.properties` hoặc cấu hình lại bằng biến môi trường của IDE/terminal.

Chạy backend:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

Chạy test backend:

```powershell
.\mvnw.cmd test
```

## Setup Frontend

Di chuyển vào thư mục frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

Backend API mặc định được cấu hình là:

```text
http://localhost:8080
```

Nếu backend dùng port khác, tạo file `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Build frontend:

```bash
npm run build
```

## Chức Năng Chính

- Đăng ký, đăng nhập, trả JWT token và phân quyền theo role.
- Admin quản lý user, duyệt ngựa, duyệt profile jockey.
- Admin tạo tournament, tạo race, gán trọng tài, duyệt đơn đăng ký và gán race entry.
- Owner quản lý ngựa, đăng ký giải đấu và mời jockey.
- Jockey cập nhật profile, xem lời mời và chấp nhận/từ chối lời mời.
- Referee được gán vào race.
- Landing page, dashboard theo role và các màn hình quản lý trên frontend.

## Phân Công Công Việc

Thông tin được tổng hợp từ `task.md`.

### Backend

| Thành viên | Công việc |
| --- | --- |
| Minh | Signup, login trả token, phân quyền; tạo Admin CRUD user; duyệt danh sách ngựa; duyệt profile jockey |
| Huy | Admin setup tournament, tạo race và gán trọng tài; duyệt đơn đăng ký; gán vào Race Entries |
| Kiệt | Owner đăng ký giải đấu và mời jockey; thêm ngựa và chờ admin duyệt; Jockey xem lời mời và chấp nhận/từ chối; Jockey update profile chờ admin duyệt |

### Frontend

| Thành viên | Công việc |
| --- | --- |
| Trung | Dựng homepage; dựng signup/login; dựng Admin dashboard, CRUD, duyệt jockey, duyệt horse |
| Huy | Dựng trang chủ ngựa; dựng trang jockey; dựng Admin setup tournament, race, entries |

## Ghi Chú Khi Chạy Local

- Nếu backend không kết nối được database, kiểm tra MySQL đang chạy, username/password và database `horse_racing_system`.
- `spring.jpa.hibernate.ddl-auto=none`, nên cần import SQL schema trước khi chạy backend.
- Frontend dùng Vite strict port `5173`; nếu port đang bị chiếm, cần đổi cấu hình trong `frontend/vite.config.js`.
- Mật khẩu seed trong database để plain text cho local testing; backend sẽ nâng cấp sang BCrypt sau lần login thành công đầu tiên.
