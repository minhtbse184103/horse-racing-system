# Horse Racing Frontend - TypeScript Version

Project đã được chuyển từ JavaScript/JSX sang TypeScript/TSX.

## Các thay đổi chính

- `src/**/*.js` đã đổi sang `src/**/*.ts`.
- `src/**/*.jsx` đã đổi sang `src/**/*.tsx`.
- `vite.config.js` đã đổi sang `vite.config.ts`.
- `index.html` đã trỏ entry point sang `src/main.tsx`.
- Thêm `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`.
- Thêm dependencies TypeScript: `typescript`, `@types/react`, `@types/react-dom`.
- Giữ nguyên UI, CSS, màu sắc và logic chức năng.

## Cài đặt và chạy

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Type check

```bash
npm run typecheck
```

## Cấu hình API

Copy `.env.example` thành `.env` nếu cần đổi URL backend.
