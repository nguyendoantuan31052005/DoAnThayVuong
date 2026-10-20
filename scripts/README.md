# Công cụ chạy hệ thống

**doantuan đã up** các script cài đặt, chạy phát triển, build Docker và kiểm tra tích hợp Docker.

- `npm run setup`: cài backend/frontend, giữ cấu hình riêng và áp dụng migration.
- `npm run dev`: chạy backend và frontend, dừng các tiến trình con khi kết thúc.
- `npm run docker:build`: build hai image, hỗ trợ proxy/CA sẵn có của môi trường.
- `npm run docker:smoke`: kiểm tra bằng container và volume tạm, dọn các tài nguyên do chính lần kiểm tra tạo.

Xem [tiến độ tổng thể](../docs/TIEN_DO_DOAN_TUAN.md). Không dùng fixture kiểm thử làm dịch vụ AI thật.
