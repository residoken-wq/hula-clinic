# Kế hoạch QA — Hula Clinic demo

## 1. Nguyên tắc
- Chỉ dùng **dữ liệu giả** (seed FLOW-11). Không restore DB từ nơi khác vào môi trường test.
- Mỗi PR: CI xanh và đã chạy test case liên quan (ghi ID test case vào mô tả PR).
- Trước mỗi lần demo: chạy **Smoke UAT** (mục 4) trên `clinic.nemmamnon.com`.

## 2. Môi trường
| Môi trường | Cách chạy | Dùng để |
|---|---|---|
| Local | `docker-compose.local.yml` (theo `rules.md`) | Dev + test tay |
| CI | GitHub Actions (PostgreSQL service container khi có QB-01) | Test tự động |
| Demo | VPS, `deploy/docker-compose.prod.yml` | UAT, demo |

## 3. Test case

### 3.0 Checklist QA theo từng task P1 (chạy khi task ở trạng thái 🟡)
| Task | Kiểm tra |
|---|---|
| CICD-01 | (1) Có `package-lock.json` ở root và `frontend/`, `lockfileVersion: 3`. (2) `git diff` của `package.json` 2 nơi = rỗng (không đổi version). (3) Clone sạch → `npm ci --legacy-peer-deps` (root) và `npm ci` (frontend) exit 0. (4) `npx tsc --noEmit` sạch cả 2 nơi. (5) Lockfile không chứa registry lạ (chỉ `registry.npmjs.org`). (6) Có `reports/CICD-01.md` với đủ mục thời gian |
| CICD-02 | Build image khi có `.env` giả trong context → `docker run --rm <img> ls -a /app` không thấy `.env`, `node_modules` local |
| CICD-03 | `whoami` = `node`; `docker inspect` có Healthcheck; base `node:22-alpine`; stage `development` vẫn chạy |
| CICD-04 | Build OK; `--build-arg VITE_API_ENCRYPTION_KEY=x` được nhúng vào bundle (grep trong `dist`) |
| CICD-05 | TC: 200 khi DB lên, 503 khi DB dừng, không cần token |
| CICD-06 | TC-CD-06; dev mode chạy như cũ; FE/BE cùng khóa dev thì tạo bệnh nhân được |
| CICD-07 | TC-CD-01 |
| CICD-08 | TC-CD-02, TC-CD-03; job deploy "skipped" khi chưa đặt `AUTO_DEPLOY` |
| CICD-09 | TC-CD-04, 05, 07, 08 trên local (tag image `:test`) |
| CICD-10 | Một người chưa từng làm đọc `DEPLOYMENT.md` làm theo được tới khi demo chạy |

### 3.1 CI/CD & Deploy (P1)
| ID | Bước | Kỳ vọng |
|---|---|---|
| TC-CD-01 | Mở PR có lỗi TypeScript | Job CI `backend` hoặc `frontend` đỏ |
| TC-CD-02 | Merge PR sạch vào `main` | GHCR có tag `latest` và `sha-xxxxxxx` cho cả api và frontend |
| TC-CD-03 | Push tag `v0.1.0` | Có thêm tag `0.1.0`, `0.1` |
| TC-CD-04 | Trên VPS chạy `./deploy.sh` | 3 container `healthy`; `https://clinic.nemmamnon.com` mở được trang login |
| TC-CD-05 | `./deploy.sh sha-<bản cũ>` | Rollback thành công; `/api/health` trả `version` = tag cũ |
| TC-CD-06 | Xóa `JWT_SECRET` khỏi `.env`, chạy deploy | `clinic_app` không healthy; log nêu tên biến thiếu; script exit 1 |
| TC-CD-07 | Kiểm tra image | Không có file `.env`; process chạy bằng user `node` |
| TC-CD-08 | Từ internet thử kết nối port 5433, 3000 của VPS | Bị từ chối |
| TC-CD-09 | Restart VPS | Hệ thống tự lên lại, dữ liệu còn nguyên |

### 3.2 Bảo mật (P2)
| ID | Bước | Kỳ vọng |
|---|---|---|
| TC-SEC-01 | User "Lễ tân" gọi `DELETE /api/users/:id` | 403 |
| TC-SEC-02 | `GET /api/users` | Không có field `password` |
| TC-SEC-03 | Đăng nhập bằng chuỗi hash của mật khẩu | 401 |
| TC-SEC-04 | `GET /api/upload/files/<tên chứa ../ đã URL-encode>` | 400 |
| TC-SEC-05 | `GET /api/upload/files/<file hợp lệ>` không có token | 401 |
| TC-SEC-06 | User thường `PUT /api/users/<id mình>` gửi `{ group_id }` | 400 / 403 |
| TC-SEC-07 | Đăng nhập sai 6 lần trong 1 phút | Lần thứ 6 nhận 429 |
| TC-SEC-08 | User bị khóa (`is_active = false`) đăng nhập | 401 |
| TC-SEC-09 | User thường đổi mật khẩu người khác | 403 |
| TC-SEC-10 | User thường bật/tắt feature flag | 403 |
| TC-SEC-11 | Upload file `.html` hoặc file 10 MB | 400 / 413 |
| TC-SEC-12 | Sửa một bệnh nhân | Có bản ghi trong Settings → Logs, không chứa body |

### 3.3 Nghiệp vụ (P3)
| ID | Bước | Kỳ vọng |
|---|---|---|
| TC-APT-01 | Đặt BS A 09:00–09:30, rồi đặt tiếp 09:15–09:45 | Lần 2 bị từ chối |
| TC-APT-02 | Gửi đồng thời 2 request đặt cùng slot (script) | Chỉ 1 thành công |
| TC-APT-03 | Bấm Hoàn thành khi lịch đang BOOKED | 400, thông báo không chuyển được |
| TC-APT-04 | Check-in → Bắt đầu khám | Bệnh án DRAFT được tạo, có `appointment_id`, UI mở bệnh án |
| TC-APT-05 | Hủy lịch không nhập lý do | Bị chặn |
| TC-APT-06 | Đổi trạng thái từ màn hình Lịch hẹn | Không còn lỗi 404 |
| TC-REC-01 | Sửa bệnh án đã COMPLETED | 400 |
| TC-REC-02 | Sửa dòng thuốc đã phát | 400; các dòng chưa phát sửa được |
| TC-PHA-01 | Kho có 5 viên (2 lô), phát đơn 8 viên | Báo thiếu kho; tồn kho **vẫn là 5** |
| TC-PHA-02 | Có 1 lô hết hạn hôm qua + 1 lô còn hạn, phát 1 viên | Trừ vào lô còn hạn |
| TC-PHA-03 | Phát cùng 1 đơn 2 lần | Lần 2 không trừ kho |
| TC-PHA-04 | Sau khi phát | Có bản ghi EXPORT tham chiếu prescription |
| TC-BIL-01 | Tạo hóa đơn từ bệnh án đã hoàn thành | Có đủ dịch vụ + thuốc đã phát, đúng đơn giá |
| TC-BIL-02 | Tạo hóa đơn lần 2 cho cùng bệnh án | 400 |
| TC-BIL-03 | Thanh toán hóa đơn đã hủy | 400 |
| TC-BIL-04 | Thanh toán `amount = -100000` hoặc vượt số còn nợ | 400 |
| TC-BIL-05 | Thanh toán 2 lần (một phần + phần còn lại) | Trạng thái PARTIAL → PAID; Finance có 2 giao dịch INCOME |
| TC-BIL-06 | Hủy hóa đơn đã PAID | Có giao dịch hoàn tiền trong Finance |
| TC-PAT-01 | Tìm bệnh nhân theo SĐT `0900000001` | Ra đúng `Bệnh nhân Test 01` |
| TC-COD-01 | Xóa bệnh nhân cuối danh sách rồi tạo bệnh nhân mới | Không lỗi trùng mã |
| TC-TZ-01 | Lúc 06:30 giờ VN mở "Hàng chờ hôm nay" | Hiển thị lịch đúng ngày VN |
| TC-HR-01 | Tạo bảng lương tháng `2026-02` | Thành công |

## 4. Smoke UAT trước mỗi lần demo (~15 phút)
1. Đăng nhập bằng tài khoản Lễ tân demo → tạo `Bệnh nhân Test 99` → đặt lịch hôm nay với `Bác sĩ Test 01`, phòng P01.
2. Check-in bệnh nhân.
3. Đăng nhập bằng tài khoản Bác sĩ demo → Hàng chờ → Bắt đầu khám → nhập sinh hiệu, chẩn đoán, 1 dịch vụ, 2 thuốc → Hoàn thành.
4. Tài khoản Dược sĩ → Đơn chờ phát → Phát thuốc → kiểm tra tồn kho giảm đúng.
5. Tài khoản Thu ngân → Tạo hóa đơn từ lượt khám → thu tiền mặt → hóa đơn chuyển PAID.
6. Tài khoản Admin → Finance có giao dịch thu; Logs có đủ các thao tác trên.
7. Tài khoản Lễ tân thử mở trang Nhân sự/Lương → không thấy menu; gọi API trực tiếp → 403.

Kết quả ghi vào bảng: ngày · người test · bước lỗi · ảnh chụp · ID issue GitHub.

## 5. Tiêu chí "Demo-ready"
- 100% test case P1 + TC-SEC-01…08 + TC-APT, TC-PHA, TC-BIL đạt.
- Smoke UAT đạt 2 lần liên tiếp trên `clinic.nemmamnon.com`.
- Không còn bug mức Critical/High đang mở.
