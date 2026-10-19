# P2 — Security baseline cho demo public

> Repo public nên ai cũng đọc được source. Mục tiêu: **đọc source xong cũng không chiếm được hệ thống demo**.
> Mỗi task kèm test e2e/unit (xem `05-qa-test-plan.md`, nhóm TC-SEC).

## SEC-01 — Không trả password hash, bỏ so sánh mật khẩu thô
**Files:** `src/core/users/entities/user.entity.ts`, `src/core/users/users.service.ts`, `src/core/auth/auth.service.ts`
- `password`: `@Column({ select: false })`. `findOneByUsernameForAuth` dùng `addSelect('user.password')` (QueryBuilder) để vẫn lấy được khi login.
- `auth.service.ts validateUser`: **chỉ** dùng `bcrypt.compare`; xóa nhánh `pass === user.password`.
- `validateUser` từ chối user có `is_active = false`.
- `createUser`/`updateUser` trả về đối tượng không có `password`.

**Nghiệm thu:** `GET /api/users` và `GET /api/users/:id` không có field `password`; login bằng chuỗi hash → 401; user bị khóa → 401.

## SEC-02 — Phân quyền ở backend (RBAC) theo `GroupPermission`
**Files (mới):** `src/common/guards/permission.guard.ts`, decorator `@RequirePermission(module_code, action)` với `action ∈ 'view' | 'edit' | 'delete'`. **Sửa:** toàn bộ controller trong `src/clinic/*` và `src/core/*` (trừ `auth`, `health`, `GET /features/enabled`).
- Guard đọc `request.user.userId` → load group + permissions (cache theo `group_id` 60 giây là đủ cho demo).
- Mapping: `GET` → `view`; `POST`/`PUT`/`PATCH` → `edit`; `DELETE` → `delete`. Đặt decorator ở cấp class, override ở method khi cần.
- `module_code` dùng **đúng danh sách** trong `frontend/src/components/settings/PermissionsTab.tsx`: `PATIENTS, APPOINTMENTS, EMR, PHARMACY, SERVICES, BILLING, DOCTORS, ROOMS, FINANCE, HR, TASKS, USERS, SETTINGS`. Tách hằng này ra file dùng chung cho cả BE và FE (hoặc khai báo trùng ở cả hai nơi kèm comment trỏ sang nhau).
- Frontend: ẩn menu và nút Sửa/Xóa theo `user.permissions` (lấy từ response login). Đây chỉ là UX; quyền thật vẫn kiểm tra ở backend.
- Nhóm **Admin** (cờ `is_admin` mới trên `UserGroup`, hoặc tên nhóm cố định `Admin`; chọn 1 cách và ghi vào `architecture.md`) bỏ qua guard. Seed: tạo nhóm Admin và gán user `admin` vào nhóm này.
- Các endpoint nhạy cảm chỉ Admin được gọi: `users/*` (trừ đổi mật khẩu của chính mình), `users/groups/*`, `PATCH /features/:code/toggle`, `system/configs`.
- `POST /users/:id/change-password`: user thường chỉ đổi được khi `id === request.user.userId` **và** phải gửi kèm `old_password` đúng.

**Nghiệm thu:** user nhóm "Lễ tân" (chỉ có `PATIENTS.view`) gọi `DELETE /api/patients/1` → 403, `GET /api/hr/payrolls` → 403, `GET /api/patients` → 200.

## SEC-03 — Chặn mass assignment: ValidationPipe + DTO
**Files:** `src/main.ts`, DTO mới trong `dto/` của từng module.
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`. **Lưu ý thứ tự**: request body được `EncryptionInterceptor` giải mã, mà interceptor chạy **trước** pipe trong NestJS → kiểm tra lại bằng test tạo bệnh nhân.
- Thứ tự ưu tiên viết DTO: `users`, `auth/login`, `billing (create, pay)`, `appointments`, `patients`, `medical-records`, `pharmacy`, sau đó các module còn lại.
- DTO update của user **không** có `group_id`, `is_active`. Hai trường này chỉ đổi qua endpoint riêng dành cho Admin.
- `@Param('id')` dùng `ParseIntPipe`.

**Nghiệm thu:** `PUT /api/users/<id mình>` gửi `{ "group_id": 1 }` → 400; tạo bệnh nhân từ UI vẫn chạy.

## SEC-04 — Upload & phục vụ file an toàn
**Files:** `src/core/upload/upload.controller.ts`, `upload.service.ts`, `src/main.ts`
- `getFile`: chỉ chấp nhận `filename` khớp `^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$`; sai → 400. Sau `path.resolve` kiểm tra đường dẫn vẫn nằm trong `uploadDir`.
- `getFile` gắn `JwtAuthGuard`.
- Upload: `limits.fileSize` 5 MB, whitelist MIME + đuôi file (ảnh, pdf); đuôi file **do server đặt** theo MIME, không lấy từ `originalname`.
- Body JSON giới hạn còn `2mb` (hiện 50 MB).
- Static `/uploads`: bỏ `useStaticAssets`, chuyển sang phục vụ qua `getFile` có auth. Nếu frontend đang dùng URL `/uploads/...` trực tiếp thì cập nhật (grep `uploads` trong `frontend/src`).

**Nghiệm thu:** tên file chứa `../` (kể cả dạng URL-encode `%2e%2e%2f`) → 400; không có token → 401; upload `.html` → 400.

## SEC-05 — Bỏ secret fallback trong code
**Files:** `src/core/auth/auth.module.ts`, `src/core/auth/jwt.strategy.ts`, `src/common/encryption/encryption.service.ts`, `src/app.module.ts`
- Production (`NODE_ENV=production`): **không** dùng giá trị mặc định cho `JWT_SECRET`, `ENCRYPTION_KEY`, `DB_PASSWORD` (đã chặn khi khởi động ở CICD-06; ở đây xóa luôn fallback trong code production, fallback chỉ còn khi `NODE_ENV !== 'production'`).
- `JWT_EXPIRES_IN` mặc định `1d`.

## SEC-06 — Rate limit đăng nhập
**Files:** `package.json` (thêm `@nestjs/throttler`, chọn phiên bản tương thích NestJS 10 và **ghi phiên bản vào PR**), `src/app.module.ts`, `auth.controller.ts`
- `POST /api/auth/login`: tối đa 5 lần/phút/IP. Đặt `app.set('trust proxy', 1)` vì request đi qua 2 lớp proxy (NPM → nginx).

**Nghiệm thu:** login sai lần thứ 6 trong 1 phút → 429.

## SEC-07 — Header bảo mật & CORS
**Files:** `frontend/nginx.conf`, `src/main.ts`
- nginx: `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `client_max_body_size 6m`. HSTS do NPM đảm nhiệm.
- CORS lấy từ env `CORS_ORIGINS` (phân tách bằng dấu phẩy); mặc định dev là `localhost:5173`. Production chỉ có `https://clinic.nemmamnon.com`.

## SEC-08 — Audit log lưu DB
**Files:** `src/common/interceptors/activity.interceptor.ts`, `src/core/system/*`
- Ghi `ActivityLog` (user_id, method, path, entity, entity_id, status code, ip, timestamp) cho mọi POST/PUT/PATCH/DELETE và cho mọi `GET` vào `medical-records`.
- **Không** ghi request body (có thể chứa PII hoặc mật khẩu).
- Tab Logs trong Settings hiển thị dữ liệu thật.

## Ngoài phạm vi P2 (đưa vào P4)
Bỏ hẳn transport encryption (vì chỉ là che mắt; HTTPS đã đủ), refresh token / revoke, mã hóa trường y tế, blind index.
