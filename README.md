# Phishing AI Detector

Ứng dụng tiếng Việt gồm **React + TypeScript**, **NestJS**, **Prisma + SQLite**, kết nối dịch vụ AI **FastAPI** qua HTTP.

## Chạy phát triển

Yêu cầu Node.js 22–24 và npm. Tại thư mục gốc:

```sh
npm run setup
npm run dev
```

Frontend chạy cổng 5173, backend cổng 3000. Swagger ở đường dẫn `/api/docs` của backend. `setup` cài dependency theo lockfile, tạo cấu hình riêng và áp dụng migration; chạy lại không ghi đè khóa đã có. Xem [biến môi trường](backend/.env.example), [backend](backend/README.md), [frontend](frontend/README.md).

Đặt `AI_API_URL` trong `backend/.env` đến endpoint dự đoán của nhóm AI theo [hợp đồng API](backend/README.md). Khi chưa cấu hình AI, kiểm tra URL trả 503; ứng dụng không tạo kết quả giả. Frontend chỉ gọi backend. Không đưa khóa AI vào biến `VITE_*`.

## Chức năng

- Đăng ký, đăng nhập, đăng xuất; JWT có thể thu hồi; phân quyền User/Admin.
- Quét URL công khai hoặc có tài khoản, điểm rủi ro, lý do, phiên bản mô hình và thời gian xử lý thực tế.
- Lịch sử cá nhân, tìm kiếm, bộ lọc ngày/mức rủi ro, phân trang, xem chi tiết và xóa.
- Báo cáo URL, liên kết kết quả quét, chứng cứ URL và ảnh PNG/JPG riêng tư tối đa 5 MiB.
- Hồ sơ, đổi mật khẩu, giao diện sáng/tối và bố cục desktop/mobile.
- Admin: thống kê, biểu đồ 7 ngày, quản lý tài khoản/vai trò, duyệt báo cáo và nhật ký thao tác.

Quét khách không lưu lịch sử. Dừng chờ trong trình duyệt không đảm bảo hủy tác vụ đã nhận ở máy chủ. Điểm thấp không bảo đảm website an toàn.

## Docker và kiểm thử

```sh
npm run docker:build
npm run docker:smoke
docker compose up -d
```

Chạy `setup` trước để có `backend/.env`. Web Docker dùng cổng 8080; dữ liệu nằm trong volume `backend_data`. Khi AI ở máy khác, cấu hình địa chỉ mà container truy cập được; `localhost` bên trong container là chính container đó. Không xóa volume khi cần giữ dữ liệu. Trên máy không có proxy đặc biệt có thể dùng `docker compose build`.

```sh
npm --prefix backend test
npm --prefix frontend exec -- playwright install --with-deps chromium
npm --prefix frontend run test:e2e
```

Xem [kết quả xác minh](backend/docs/VALIDATION.md), [OpenAPI](backend/docs/openapi.json), [Postman](backend/docs/postman.collection.json), [đối chiếu thiết kế](docs/THIET_KE.md). Các mô hình/dữ liệu fixture chỉ phục vụ kiểm thử, không phải AI đã huấn luyện. Chưa có mô hình/dataset thực, chỉ số đánh giá ML, Chrome Extension, xác minh email, khôi phục mật khẩu hoặc 2FA.

Chỉ `.env.example` được đưa lên Git; `.env`, database, dependency và ảnh chứng cứ không được commit.
