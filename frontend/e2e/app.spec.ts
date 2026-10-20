import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email: string, password: string) {
  await page.goto("/dang-nhap");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/kiem-tra$/);
}

test("User: đăng ký, phân tích, lỗi AI, lịch sử, báo cáo, hồ sơ, đổi mật khẩu và đăng xuất", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lich-su");
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await page.getByRole("link", { name: "Đăng ký ngay" }).click();
  await page.getByLabel("Họ và tên").fill("Người dùng kiểm thử");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-user@example.com");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("Browser-user-fixture123");
  await page
    .getByLabel("Nhập lại mật khẩu", { exact: true })
    .fill("different-fixture123");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Hai mật khẩu chưa trùng khớp.",
  );
  await page
    .getByLabel("Nhập lại mật khẩu", { exact: true })
    .fill("Browser-user-fixture123");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await expect(page).toHaveURL(/\/kiem-tra$/);
  await expect(
    page.getByRole("navigation", { name: "Điều hướng quản trị" }),
  ).toHaveCount(0);
  await page
    .getByLabel("URL cần phân tích")
    .fill("https://danger.example/verify");
  await page
    .getByRole("button", { name: "Phân tích URL", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Kết quả phân tích" }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Điểm rủi ro" }),
  ).toHaveAttribute("aria-valuenow", "85");
  await expect(
    page.getByRole("heading", { name: "Nguy cơ cao", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/kiem-tra-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Báo cáo URL này" }).click();
  await expect(page.getByLabel("Đường dẫn website")).toHaveValue(
    "https://danger.example/verify",
  );
  const description =
    "<img src=x onerror=alert(1)> Dấu hiệu giả mạo được kiểm thử";
  await page.getByLabel("Mô tả dấu hiệu đáng ngờ").fill(description);
  await page
    .getByLabel("Tải ảnh bằng chứng (tùy chọn)")
    .setInputFiles({
      name: "bang-chung.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1kAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await page.getByRole("button", { name: "Gửi báo cáo", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã gửi báo cáo." }),
  ).toContainText("Đã gửi báo cáo.");
  await page.getByRole("button", { name: "Chi tiết", exact: true }).click();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Tải ảnh bằng chứng", exact: true }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Tải ảnh bằng chứng", exact: true })
    .click();
  expect((await downloadEvent).suggestedFilename()).toBe("bang-chung.png");
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Lịch sử", exact: true })
    .click();
  await expect(
    page.getByRole("cell").filter({ hasText: "https://danger.example/verify" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chi tiết", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả phân tích" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Quét URL", exact: true })
    .click();
  await page
    .getByLabel("URL cần phân tích")
    .fill("https://unavailable.example");
  await page
    .getByRole("button", { name: "Phân tích URL", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Dịch vụ phân tích hiện chưa sẵn sàng",
  );
  await expect(
    page.getByRole("region", { name: "Kết quả phân tích" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Tài khoản", exact: true }).click();
  await page.getByLabel("Họ và tên").fill("Tên cập nhật kiểm thử");
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(page.getByRole("status")).toContainText("Đã cập nhật thông tin");
  await page.getByLabel("Mật khẩu hiện tại").fill("Browser-user-fixture123");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("Browser-new-fixture123");
  await page
    .getByLabel("Nhập lại mật khẩu mới", { exact: true })
    .fill("Browser-new-fixture123");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.getByRole("status")).toContainText("Đã đổi mật khẩu");
  await login(page, "browser-user@example.com", "Browser-new-fixture123");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("phishing.session")),
  ).toBeNull();
  expect(errors).toEqual([]);
});

test("Admin: thống kê, phiên bản AI, xử lý báo cáo, khóa và mở khóa tài khoản", async ({
  page,
}) => {
  await login(page, "admin-browser@example.com", "browser-admin-fixture123");
  await page.getByRole("link", { name: "Quản trị", exact: true }).click();
  const adminNav = page.getByRole("navigation", {
    name: "Điều hướng quản trị",
  });
  await adminNav.getByRole("link", { name: "Tổng quan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng quan nghiên cứu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("browser-test-fixture", { exact: true }),
  ).toBeVisible();
  await adminNav
    .getByRole("link", { name: "Báo cáo URL", exact: true })
    .click();
  await page.getByRole("button", { name: "Xử lý", exact: true }).click();
  await page
    .getByLabel("Trạng thái", { exact: true })
    .selectOption("CONFIRMED");
  await page
    .getByLabel("Ghi chú xử lý")
    .fill("Đã xác minh trong kịch bản trình duyệt");
  await page.getByRole("button", { name: "Lưu xử lý" }).click();
  await expect(
    page.getByRole("cell", { name: "Đã xác minh", exact: true }),
  ).toBeVisible();
  await adminNav.getByRole("link", { name: "Người dùng", exact: true }).click();
  const row = page
    .getByRole("row")
    .filter({ hasText: "managed-browser@example.com" });
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Khóa", exact: true }).click();
  await expect(row.getByText("Đã khóa", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Mở khóa", exact: true }).click();
  await expect(row.getByText("Hoạt động", { exact: true })).toBeVisible();
  for (const label of ["Quản trị viên", "Người dùng"]) {
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Đổi vai trò", exact: true }).click();
    await expect(
      row.getByRole("cell", { name: label, exact: true }),
    ).toBeVisible();
  }
  await page.getByText("Thêm người dùng", { exact: true }).click();
  await page
    .getByLabel("Họ và tên", { exact: true })
    .fill("Người dùng do Admin tạo");
  await page
    .getByLabel("Email người dùng", { exact: true })
    .fill("created-browser@example.com");
  await page.getByLabel("Mật khẩu ban đầu").fill("Created-browser-fixture123");
  await page
    .getByRole("button", { name: "Tạo người dùng", exact: true })
    .click();
  await expect(
    page.getByRole("cell", {
      name: "created-browser@example.com",
      exact: true,
    }),
  ).toBeVisible();
  await adminNav.getByRole("link", { name: "Nhật ký quản trị" }).click();
  await expect(
    page.getByRole("cell", { name: "Đổi vai trò", exact: true }).first(),
  ).toBeVisible();
  await adminNav.getByRole("link", { name: "Lịch sử hệ thống" }).click();
  await expect(
    page.getByRole("cell").filter({ hasText: "https://danger.example/verify" }),
  ).toBeVisible();
});

test("Mobile: menu hoạt động, không tràn ngang và User bị chặn trang Admin", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(
    page,
    "managed-browser@example.com",
    "managed-browser-fixture123",
  );
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Lịch sử", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lịch sử quét URL", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Chưa có lịch sử kiểm tra")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/lich-su-mobile.png",
    fullPage: true,
  });
  await page.goto("/quan-tri");
  await expect(
    page.getByRole("heading", { name: "Bạn không có quyền truy cập" }),
  ).toBeVisible();
});

test("Phiên bị thu hồi: tự chuyển về đăng nhập, không giữ dữ liệu người dùng cũ", async ({
  page,
  request,
}) => {
  await login(
    page,
    "managed-browser@example.com",
    "managed-browser-fixture123",
  );
  const token = await page.evaluate(() =>
    sessionStorage.getItem("phishing.session"),
  );
  const response = await request.post("http://127.0.0.1:3015/api/auth/logout", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Lịch sử", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("phishing.session")),
  ).toBeNull();
});

test("Khách: quét không đăng nhập, không lưu lịch sử và chọn giao diện sáng/tối", async ({
  page,
}) => {
  await page.goto("/kiem-tra");
  await page.getByLabel("URL cần phân tích").fill("https://safe.example");
  await page
    .getByRole("button", { name: "Phân tích URL", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Rủi ro thấp", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Lần quét này không lưu lịch sử.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("phishing.session")),
  ).toBeNull();
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Chuyển sang giao diện sáng" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
