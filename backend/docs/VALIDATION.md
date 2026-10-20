# Kết quả xác minh backend

Xác minh tại môi trường phát triển ngày 20/10/2026:

| Kiểm tra | Kết quả |
|---|---|
| npm ci với package-lock.json | Thành công |
| npm run setup, chạy mới và chạy lại | Thành công; không ghi đè .env, không có migration chờ |
| Khởi tạo/kiểm tra môi trường | Tạo mới, bổ sung biến thiếu, giữ nguyên khóa và không sao chép secret từ tiến trình; 7 kiểm thử ENV đạt |
| TypeScript build | Thành công |
| npm test | 46 passed, 0 failed, 0 skipped |
| test:fastapi trong venv từ requirements.lock.txt | 1 passed, 0 failed; gọi HTTP tới FastAPI thực, kết quả fixture |
| Cấp ADMIN bằng script | Thành công trên database tạm |
| npm run dev và npm start | Khởi động được; GET /api/health trả 200/status ok |
| Swagger/OpenAPI | Truy cập được; 17 paths, 21 operations; có DTO và schemas response |
| npm audit --omit=dev | 0 lỗ hổng được báo cáo tại lần kiểm tra |
| Docker build | Thành công qua proxy/CA của môi trường, giữ TLS/checksum verification |
| Docker smoke | Migration, đăng ký, giữ dữ liệu/phiên sau restart, logout và từ chối token đã thu hồi |
| Docker Compose | Cấu hình hợp lệ; chức năng container đã kiểm tra bằng smoke test riêng |

Không có mô hình ML đã huấn luyện trong backend. FastAPI fixture chỉ chứng minh hợp đồng tích hợp và lưu kết quả, không chứng minh Accuracy/Precision/Recall/F1 hoặc khả năng phát hiện phishing thực tế. Backend đang chạy với AI_API_URL chưa cấu hình sẽ trả 503 cho scan, không tạo dữ liệu giả.

Workflow GitHub Actions đã được thêm nhưng chưa chạy trên GitHub. Cấu hình môi trường được lưu ở dạng draft; thao tác Publish và phục hồi trong task mới chưa được xác minh.
