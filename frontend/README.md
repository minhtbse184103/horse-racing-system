# Horse Racing System Frontend

This frontend was created for the Horse Racing System web application.

## Completed Features

- Responsive login interface.
- Frontend validation for email and password.
- Backend login request: `POST /api/auth/login`.
- Displays backend error messages such as `Email not found`, `Invalid password`, or `Account is no longer active`.
- Stores `token` and `user` in `localStorage` when "Remember me" is selected.
- Stores session data in `sessionStorage` when "Remember me" is not selected.
- Includes a successful login screen and a sign-out button.

## How to Run

```bash
cd frontend
npm install
npm run dev
```

Open the browser at:

```text
http://localhost:5173
```

The backend should run at:

```text
http://localhost:8080
```

If the backend uses a different port, create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:8080
```

## API Used

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "owner1@example.com",
  "password": "123456"
}
```

Successful response example:

```json
{
  "message": "Login successful",
  "token": "...",
  "user": {
    "id": 1,
    "email": "owner1@example.com",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

Note: The backend Java DTO may use `private Integer Id;`. Depending on the getter, Jackson may serialize it as `id` or `Id`. The login page does not depend on this field, so it still works.
