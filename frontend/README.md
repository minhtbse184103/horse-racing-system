# Horse Racing Frontend

Frontend TypeScript chi cho admin tao giai dau, tao race va man hinh tao round.

## Chay

```powershell
cd frontend
npm install
npm run dev
```

Sau do mo:

```text
http://localhost:5173
```

Backend mac dinh duoc goi o `http://localhost:8082`.

Luu y: backend hien tai chua co endpoint POST tao round, nen form tao round bi khoa va hien thong bao.

## Cau truc

```text
src/
  assets/
  api/
    adminApi.ts
    client.ts
  configs/
    appConfig.ts
    seedAdmin.ts
  components/
    admin/
      AdminPage.ts
      formSpecs.ts
    auth/
    common/
      fields.ts
      toast.ts
  hooks/
  lib/
    types.ts
  services/
    adminCreateService.ts
    authService.ts
    conditionService.ts
  states/
    adminState.ts
  utils/
    form.ts
  main.ts
```
