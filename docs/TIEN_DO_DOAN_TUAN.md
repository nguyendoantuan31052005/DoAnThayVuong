# Tiến độ phần Đoàn Tuấn đã push

Người phụ trách: **Đoàn Tuấn (doantuan)**. Tài khoản GitHub và tác giả commit: **nguyendoantuan31052005**.

Repository: https://github.com/nguyendoantuan31052005/DoAnThayVuong — nhánh `main`.

## Các phần đã hoàn thành và đưa lên GitHub

| Phần | Nội dung | Trạng thái |
|---|---|---|
| Backend NestJS | Khởi tạo dự án TypeScript, cấu hình và xử lý lỗi/validation | doantuan đã up |
| Xác thực | Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu, JWT có thể thu hồi | doantuan đã up |
| Phân quyền | User/Admin; khóa, mở khóa, đổi vai trò và thu hồi phiên | doantuan đã up |
| API kiểm tra URL | Chuẩn hóa URL, gọi FastAPI, kiểm tra phản hồi, điểm 0–100, mức rủi ro và lý do | doantuan đã up phần tích hợp; cần dịch vụ AI thật để dự đoán thực tế |
| Lịch sử | Lưu kết quả cho tài khoản, xem chi tiết, tìm kiếm, lọc, phân trang, xóa và tổng quan cá nhân | doantuan đã up |
| Báo cáo phishing | Gửi báo cáo, liên kết lượt quét, chứng cứ URL/ảnh PNG/JPG riêng tư và Admin xử lý | doantuan đã up |
| Hồ sơ | Cập nhật tên, tổ chức và đổi mật khẩu | doantuan đã up |
| Quản trị | Quản lý người dùng, báo cáo, lịch sử, thống kê, biểu đồ và nhật ký thao tác | doantuan đã up |
| Frontend React | Giao diện tiếng Việt, kết nối API, trang User/Admin, responsive và sáng/tối | doantuan đã up theo nội dung thiết kế dạng văn bản; chưa đối chiếu trực tiếp ảnh Figma/PDF |
| Database | Prisma + SQLite, migration giữ dữ liệu hiện có | doantuan đã up bản SQLite; chưa triển khai PostgreSQL |
| Cấu hình | Mẫu `.env.example`, tạo khóa riêng khi setup, không commit secret | doantuan đã up |
| Tài liệu | README, Swagger/OpenAPI, Postman, hướng dẫn chạy và đối chiếu thiết kế | doantuan đã up |
| Docker | Build backend/frontend, Nginx proxy, Compose và lưu dữ liệu bằng volume | doantuan đã up; đã kiểm tra tích hợp cục bộ |
| Kiểm thử | 55 kiểm thử backend, 5 kịch bản trình duyệt, 1 kiểm thử HTTP FastAPI fixture | doantuan đã up; kiểm thử đạt tại môi trường phát triển |
| GitHub Actions | Workflow kiểm tra toàn hệ thống | doantuan đã up workflow; chưa xác nhận kết quả chạy trên GitHub |

Mã nguồn ứng dụng đã được push trong commit `77c8c3b` với thông điệp “Hoàn thiện giao diện tiếng Việt và tích hợp toàn bộ hệ thống”. Tài liệu tiến độ này được bổ sung bằng commit riêng.

## Chưa hoàn thành / cần phối hợp

- Nhóm AI cung cấp mô hình đã huấn luyện, endpoint FastAPI thật và dữ liệu đánh giá Accuracy/Precision/Recall/F1. Fixture chỉ dùng kiểm thử, không phải mô hình thật. Khi chưa đặt `AI_API_URL`, quét trả 503 và không tạo điểm giả.
- Huấn luyện lại AI, quản lý dataset chuyên dụng và Chrome Extension chưa triển khai.
- Xác minh email, quên mật khẩu, 2FA, thông báo và đồng bộ chủ đề giữa thiết bị chưa triển khai.
- Chưa đối chiếu từng pixel Figma/PDF; PDF được gửi vượt giới hạn đọc 32 MiB.
- Chưa triển khai dịch vụ công khai lên máy chủ sản xuất. Cấu hình môi trường đám mây đã lưu dạng draft, cần Review/Publish để kích hoạt.

## Những tệp không push

Không đưa `.env` thật, khóa bí mật, database cá nhân, ảnh chứng cứ, `node_modules`, thư mục build và môi trường Python lên GitHub. Đây là dữ liệu riêng hoặc tệp sinh ra; các mẫu cấu hình, lockfile và migration cần thiết đã có trong repository.
