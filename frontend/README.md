# Horse Racing Frontend - Login Page

Front-end này được tạo cho trang đăng nhập của project Horse Racing System.

## Chức năng đã làm

- Giao diện login responsive.
- Validate email/password ở front-end.
- Gọi API backend: `POST /api/auth/login`.
- Hiển thị message lỗi backend trả về, ví dụ `Email không tồn tại`, `Sai password`, `Tài khoản không còn hoạt động`.
- Lưu `token` và `user` vào `localStorage` nếu chọn "Ghi nhớ đăng nhập".
- Nếu bỏ chọn "Ghi nhớ đăng nhập", lưu vào `sessionStorage`.
- Có màn hình đăng nhập thành công và nút đăng xuất.

## Cách chạy

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:5173
```

Backend cần chạy ở:

```text
http://localhost:8080
```

Nếu backend chạy port khác, tạo file `.env` trong thư mục `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## API đang dùng

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "example@gmail.com",
  "password": "123456"
}
```

Response thành công backend hiện tại:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "example@gmail.com",
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "status": "ACTIVE",
    "role": "OWNER"
  }
}
```

Lưu ý: Trong Java DTO của backend field đang là `private Integer Id;`. Khi serialize sang JSON, Jackson thường trả về key `id` hoặc `Id` tùy getter. Trang login hiện không phụ thuộc vào field này nên vẫn chạy được.
