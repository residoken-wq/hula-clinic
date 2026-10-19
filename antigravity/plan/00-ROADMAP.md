# Hula Clinic — Roadmap hoàn thiện (bản Demo)

> Người soạn: BA/Planning (Claude Code) · Người code: **Antigravity** · Người duyệt: ntnhan
> Ngày: 2026-10-19 · Phạm vi: bản **demo** chạy tại `https://clinic.nemmamnon.com`, repo public, **chưa có dữ liệu thật**.

## 1. Mục tiêu
1. **CI/CD chuẩn**: mỗi PR được build/kiểm tra tự động; merge vào `main` → GitHub Actions build image và push lên GHCR.
2. **Deploy đơn giản**: trên VPS chỉ cần `./deploy.sh` (= `docker compose pull && docker compose up -d`), domain do Nginx Proxy Manager trỏ vào.
3. **Demo chạy trơn luồng chính**: Tiếp đón → Đặt lịch → Check-in → Khám (bệnh án) → Kê đơn → Phát thuốc → Thu tiền.
4. **An toàn tối thiểu cho demo public**: không ai lấy được quyền admin hay đọc file server chỉ nhờ đọc source trên GitHub.

## 2. Thứ tự thực hiện (bắt buộc theo thứ tự)

| Phase | File instruction | Nội dung | Ước lượng* | Phụ thuộc |
|---|---|---|---|---|
| **P1** | `tasks/01-cicd-deploy.md` | Lockfile, Dockerfile, health check, CI, Release → GHCR, compose prod, deploy.sh, runbook | 2–3 ngày | — |
| **P2** | `tasks/02-security-baseline.md` | Chặn lỗi bảo mật nghiêm trọng cho demo public | 3–4 ngày | P1 |
| **P3** | `tasks/03-demo-flow.md` | Sửa lỗi gãy quy trình, nối các màn hình thành luồng khám end-to-end | 5–7 ngày | P1 |
| **P4** | `tasks/04-quality-backlog.md` | Hoàn thiện module còn thiếu và nợ kỹ thuật (sau demo) | theo sprint | P2, P3 |
| QA | `05-qa-test-plan.md` | Test case + kịch bản UAT demo; chạy sau mỗi phase | xuyên suốt | — |

*Ước lượng cho 1 dev + AI coding, **giả định**, chưa có số liệu thực tế.

P2 và P3 có thể làm song song sau khi P1 xong.

## 3. Cách giao việc cho Antigravity
- Mỗi task có ID (`CICD-01`, `SEC-03`, `FLOW-05`…). **Mỗi lần chỉ giao 1 task (hoặc 1 nhóm nhỏ cùng file)**, mỗi task = 1 commit, mỗi phase = 1 PR.
- Prompt mẫu:

```
Đọc antigravity/rules.md, antigravity/architecture.md và antigravity/plan/00-ROADMAP.md.
Thực hiện task <ID> trong antigravity/plan/tasks/<file>.md.
- Chỉ sửa các file được liệt kê trong task; cần sửa thêm file khác thì dừng lại và hỏi.
- Không đọc/ghi file .env thật; secret dùng placeholder CHANGE_ME.
- Chạy đủ các lệnh trong mục "Kiểm tra" và dán kết quả.
- Commit message: "<ID>: <mô tả ngắn>".
```

## 4. Quy tắc chung cho mọi task (Definition of Done)
1. `npx tsc --noEmit` sạch ở cả backend (root) và `frontend/`.
2. `npm run build` chạy được ở cả hai nơi.
3. Đạt hết mục **Tiêu chí nghiệm thu** của task.
4. Không hard-code secret, mật khẩu, domain mới hay IP vào code.
5. Không dùng dữ liệu người thật trong seed/test: chỉ `Bệnh nhân Test 01`, `test01@example.com`, SĐT `0900000001`.
6. Giữ phong cách code hiện có: NestJS module/controller/service, indent 4 space, thông báo lỗi tiếng Việt.
7. **Con người (ntnhan) review PR trước khi merge vào `main`**. Merge vào `main` = build image mới.

## 5. Quyết định đã chốt
| # | Quyết định | Lý do |
|---|---|---|
| D1 | Image lưu trên GHCR: `ghcr.io/residoken-wq/hula-clinic-api`, `ghcr.io/residoken-wq/hula-clinic-frontend` | Giữ tên như `deploy.yml` hiện tại |
| D2 | Tag: `latest` (main), `sha-<7 ký tự>` (mọi build), `X.Y.Z` (git tag `vX.Y.Z`) | Rollback được theo sha hoặc version |
| D3 | VPS **pull image, không build** | Yêu cầu của chủ dự án |
| D4 | TLS/domain do **Nginx Proxy Manager** (network `proxy_net`) | Hạ tầng VPS hiện tại (xem `cmdcheck.md` §8) |
| D5 | Auto-deploy qua SSH chuyển thành **tùy chọn (opt-in)**, mặc định tắt | Chủ dự án muốn tự pull trên VPS |
| D6 | Demo vẫn dùng `synchronize: true` qua biến `DB_SYNCHRONIZE`; migrations để sau (P4) | Giảm rủi ro cho demo |

## 6. Quyết định của chủ dự án (chốt ngày 2026-10-19)
| # | Câu hỏi | Quyết định |
|---|---|---|
| Q1 | Compose production đặt ở đâu? | **`deploy/` trong repo này.** VPS chỉ cần lấy thư mục `deploy/`. Repo `hula-clinic-infra` không còn dùng cho luồng deploy mới. `rules.md` Rule 1 đã cập nhật theo. |
| Q2 | Network `nexus-network` | **Bỏ.** Chỉ dùng `proxy_net` (Nginx Proxy Manager). |
| Q3 | Visibility package GHCR | **Public.** VPS `docker pull` không cần login. |
