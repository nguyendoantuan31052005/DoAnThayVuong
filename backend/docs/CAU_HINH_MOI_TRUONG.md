# Hướng dẫn cấu hình môi trường

Repository có đủ tệp mẫu, không chứa khóa bí mật dùng thật:

- `.env.example`: chạy NestJS trực tiếp trên máy phát triển.
- `.env.docker.example`: chạy backend bằng Docker Compose.
- `.env`: cấu hình riêng, tự tạo bằng script và không đưa lên GitHub.

## Chạy trên máy phát triển

```sh
cd backend
npm ci
npm run setup
npm run env:check
npm start
```

`setup` gọi bộ khởi tạo môi trường, sinh JWT secret ngẫu nhiên nếu chưa có, tạo Prisma Client, áp dụng migration và build. Nếu đã có `.env`, giữ nguyên mọi giá trị đang dùng và bổ sung các biến còn thiếu. JWT để trống được tự điền khóa ngẫu nhiên, trừ khi đã được cấp qua biến môi trường của tiến trình. Khóa được cấp qua tiến trình không bị chép vào `.env`.

Chỉ tạo/hoàn thiện cấu hình mà chưa cài database:

```sh
npm run env:init
```

Lệnh này không ghi đè JWT secret đang có. Muốn đổi khóa phải chủ động sửa `.env`; đổi JWT secret làm tất cả token cũ không còn hợp lệ.

## Chạy Docker

Trong thư mục backend đã cài dependencies bằng `npm ci`:

```sh
npm run env:init -- --docker
docker compose up --build -d
docker compose logs --tail=50 backend
```

Tùy chọn `--docker` chọn tệp mẫu Docker khi tạo mới. Nếu đã có `.env`, vẫn giữ nguyên giá trị đang có; Compose tự đặt `NODE_ENV=production`, cổng nội bộ 3000 và database trong `/data/phishing.db`. `PORT` trong `.env` chọn cổng mở trên máy host. `HTTP_RATE_LIMIT` được truyền vào container.

Không dùng `npm run setup` trên máy host với đường dẫn database `/data/...` của mẫu Docker. Khi cần quay lại chạy trực tiếp, chủ động sửa `DATABASE_URL=file:./dev.db` và `NODE_ENV=development` trong `.env`, rồi chạy setup.

## Tích hợp với thành viên AI

Điền endpoint thật vào `.env`, ví dụ:

```dotenv
AI_API_URL=http://127.0.0.1:8000/predict
AI_TIMEOUT_MS=10000
AI_API_TOKEN=
```

Chỉ điền AI_API_TOKEN nếu FastAPI yêu cầu Bearer token. Không gửi token qua chat hoặc đưa token thật vào tệp mẫu. Với Docker, thay địa chỉ bằng hostname dịch vụ có thể truy cập từ container, ví dụ `http://ai:8000/predict` khi nhóm có dịch vụ tên `ai` trong cùng network.

Nếu chưa có mô hình AI, để trống AI_API_URL. Backend trả 503 cho kiểm tra URL và không lưu điểm giả; chức năng tài khoản, báo cáo và quản trị vẫn hoạt động. Xem hợp đồng JSON trong README.md.

## Các biến cần biết

| Biến | Yêu cầu |
|---|---|
| NODE_ENV | development, production hoặc test |
| DATABASE_URL | SQLite local, bắt đầu bằng file: |
| JWT_SECRET | Bắt buộc, ít nhất 32 byte; script sinh ngẫu nhiên khi chưa có |
| PORT | Số nguyên 1–65535, mặc định 3000 |
| FRONTEND_ORIGIN | Một origin http/https, không có đường dẫn hoặc dấu / cuối |
| HTTP_RATE_LIMIT | Số nguyên 1–10000, mặc định 120 yêu cầu/phút/IP/endpoint |
| AI_API_URL | Endpoint HTTP(S), tùy chọn cho phát triển; cần có để dự đoán thật |
| AI_TIMEOUT_MS | Số nguyên 100–60000, mặc định 10000 ms |
| AI_API_TOKEN | Khóa gọi FastAPI, tùy chọn |

Sau khi thay đổi `.env`, khởi động lại backend. `npm run env:check` kiểm tra cấu hình từ bản build, không in giá trị secret và không chứng minh AI endpoint đang hoạt động. Nếu vừa thay đổi code cấu hình, build lại bằng `npm run build` trước khi kiểm tra.

Không commit `.env`, database, thư mục node_modules hoặc .venv. Hai tệp mẫu được theo dõi trong Git và để trống khóa bí mật. Script không tự bổ sung dịch vụ AI hay tài khoản quản trị mặc định.
