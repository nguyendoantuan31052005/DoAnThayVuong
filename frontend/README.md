# Giao diện React + TypeScript

Tại thư mục gốc chạy `npm run setup`, rồi `npm run dev`. Vite proxy `/api` đến backend cổng 3000. Khi cần thay đổi, sao chép `.env.example` thành `.env`; `BACKEND_URL` dùng cho Vite phát triển, `VITE_API_URL` được đóng vào bundle lúc build và phải là địa chỉ công khai, không chứa secret.

`npm run build` tại đây tạo `dist`; Docker phục vụ SPA bằng Nginx và proxy API. JWT lưu trong sessionStorage của tab, xóa khi đăng xuất/401; không có chức năng ghi nhớ đăng nhập lâu dài. Sáng/tối lưu cục bộ trong trình duyệt. Ảnh chứng cứ được tải qua API có xác thực, không công khai URL file.

`npm run test:e2e` build frontend/backend, chạy Playwright với database tạm và AI fixture qua HTTP. Cài Chromium bằng `npx playwright install --with-deps chromium`; hoặc đặt `CHROMIUM_PATH` nếu môi trường đã có Chromium. Kiểm thử không gọi mô hình sản xuất và không sử dụng database của người dùng.

Các trang: `/kiem-tra`, `/dang-nhap`, `/dang-ky`, `/lich-su`, `/bao-cao`, `/tai-khoan`, `/quan-tri`. Thời gian hiển thị theo Asia/Ho_Chi_Minh; bộ lọc ngày và thống kê backend dùng UTC. Xem đối chiếu thiết kế ở `../docs/THIET_KE.md`.
