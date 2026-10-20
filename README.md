# DoAnThayVuong — Hệ thống phát hiện website Phishing bằng AI

Phần backend của Người 2 đã được triển khai bằng **NestJS + TypeScript + Prisma + SQLite**, tích hợp dịch vụ AI **FastAPI** qua HTTP.

```sh
cd backend
npm ci
npm run setup
npm start
```

Xem [hướng dẫn backend](backend/README.md), [OpenAPI](backend/docs/openapi.json) và [Postman collection](backend/docs/postman.collection.json).

Phạm vi: đăng ký/đăng nhập/đăng xuất, JWT có thể thu hồi, phân quyền User/Admin, kiểm tra URL qua AI, lịch sử cá nhân, báo cáo, quản trị và thống kê. Có migration, bộ kiểm thử, Swagger và cấu hình Docker.

Frontend, mô hình AI huấn luyện trên dữ liệu thật và Chrome Extension thuộc các phần việc khác. FastAPI fixture trong backend chỉ dùng kiểm thử tích hợp.
