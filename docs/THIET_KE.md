# Đối chiếu thiết kế và phạm vi

Triển khai dựa trên văn bản các màn hình Figma người dùng cung cấp: nhãn tiếng Việt, điều hướng Quét URL/Lịch sử/Báo cáo URL, trang quản trị, bảng, bộ lọc, hồ sơ, màu sáng/tối, Inter, bố cục desktop 1440 và mobile 390. Chưa truy cập được file Figma; PDF đính kèm vượt giới hạn đọc 32 MiB. Vì vậy chưa xác nhận đối chiếu hình ảnh từng pixel.

Đã kết nối dữ liệu thật cho đăng nhập/đăng ký, quét, lịch sử và tổng quan cá nhân, báo cáo có chứng cứ, hồ sơ/đổi mật khẩu, quản trị người dùng/báo cáo/thống kê/nhật ký. Không sử dụng tên người dùng, số lượt quét, điểm, phiên bản RandomForest hoặc phần trăm tiến độ mẫu trong thiết kế làm dữ liệu thật. Khi đang phân tích hiển thị trạng thái chờ, không giả lập tiến độ 75%.

Mức rủi ro: 0–29 Rủi ro thấp; 30–69 Cần thận trọng; 70–100 Nguy cơ cao. Lý do và phiên bản mô hình lấy từ AI; thời gian xử lý đo tại backend. URL không tự mở. Kết quả AI không phải bảo đảm an toàn.

Mật khẩu mới ít nhất 12 ký tự, có chữ hoa, chữ thường và số; tối đa 72 byte UTF-8. Tài khoản cũ vẫn đăng nhập bằng mật khẩu hiện tại. Thay mật khẩu thu hồi mọi phiên.

Chứng cứ PNG/JPG tối đa 5 MiB được kiểm tra chữ ký file, lưu trong database và chỉ chủ báo cáo/Admin được tải. Không thay ảnh của báo cáo đã xử lý. URL chứng cứ chỉ được lưu, máy chủ không tự tải. Nhật ký ghi các thao tác quản trị, không chứa mật khẩu.

Chưa triển khai: quên mật khẩu, email xác minh, 2FA, ghi nhớ phiên dài hạn, thông báo, đồng bộ chủ đề nhiều thiết bị, bật/tắt lưu lịch sử tài khoản, điều khoản pháp lý riêng, huấn luyện lại mô hình và Chrome Extension. Không hiển thị trạng thái xác minh hoặc tính năng bảo mật giả. Mô hình đã huấn luyện và số liệu Accuracy/Precision/Recall/F1 cần nhóm AI cung cấp và đánh giá riêng.
