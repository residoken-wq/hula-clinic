# Báo cáo CICD-04 — Dockerfile frontend

## 1. Thông tin chung
| Mục | Giá trị |
|---|---|
| Task ID | CICD-04 |
| Người thực hiện | Antigravity (người giao: ntnhan) |
| Branch | `claude/hopeful-hypatia-8b36i7` |
| Commit | `CICD-04: cap nhat frontend Dockerfile ARG encryption key va nginx 1.27` (để trống hash, QA điền sau khi đối chiếu remote) |
| PR | chưa tạo |

## 2. Thời gian
| Mốc | Thời điểm |
|---|---|
| Nhận task | 2026-10-19 19:45 (+07) |
| Bắt đầu code | 2026-10-19 21:10 (+07) (sau khi xác nhận lỗi VT-x BIOS và được duyệt code trước) |
| Hoàn thành (push thành công lên remote) | 2026-10-19 21:18 (+07) |
| **Thời gian thực tế** | **0h08** (thời gian code và kiểm tra build) |
| Ước lượng trong plan | 0h30 |
| Chênh lệch | -0h22 — lý do: đặc tả Dockerfile frontend rất cụ thể, kiểm tra typecheck và build suôn sẻ |

## 3. Thay đổi
| File | Loại (A/M/D) | Mô tả ngắn |
|---|---|---|
| `frontend/Dockerfile` | M | Đổi `as base` thành `AS base`, dùng `npm ci` kèm lockfile, thêm ARG/ENV `VITE_API_ENCRYPTION_KEY` trước build, pin `nginx:1.27-alpine` và cấu hình HEALTHCHECK |

Thư viện thêm, xóa hoặc đổi phiên bản: không có

## 4. Kết quả kiểm tra (dán output thật, rút gọn nếu dài)

### Git diff `frontend/Dockerfile`:
```diff
diff --git a/frontend/Dockerfile b/frontend/Dockerfile
index 4d05cb3..bf2bd25 100644
--- a/frontend/Dockerfile
+++ b/frontend/Dockerfile
@@ -1,7 +1,7 @@
-FROM node:22-alpine as base
+FROM node:22-alpine AS base
 WORKDIR /app
-COPY package.json ./
-RUN npm install
+COPY package.json package-lock.json ./
+RUN npm ci
 
 FROM base AS development
 COPY . .
@@ -11,10 +11,15 @@ CMD ["npm", "run", "dev", "--", "--host"]
 FROM base AS build
 COPY . .
 ENV NODE_OPTIONS="--max-old-space-size=4096"
+# Public key dung cho transport encryption giua Frontend va Backend (gia tri public, duoc nhung vao bundle JS build)
+ARG VITE_API_ENCRYPTION_KEY=""
+ENV VITE_API_ENCRYPTION_KEY=$VITE_API_ENCRYPTION_KEY
 RUN npm run build
 
-FROM nginx:alpine AS production
+FROM nginx:1.27-alpine AS production
 COPY nginx.conf /etc/nginx/conf.d/default.conf
 COPY --from=build /app/dist /usr/share/nginx/html
 EXPOSE 80
+HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
+  CMD wget -qO- http://127.0.0.1/ || exit 1
 CMD ["nginx", "-g", "daemon off;"]
```

### Kiểm tra nhúng key `VITE_API_ENCRYPTION_KEY` vào bundle:
```bash
$ cmd.exe /c "set VITE_API_ENCRYPTION_KEY=test_key_embedding_12345&& npm.cmd run build&& findstr /s /m test_key_embedding_12345 dist\assets\*.js"
> hula-clinic-frontend@1.0.0 build
> tsc && vite build
✓ 3076 modules transformed.
dist\assets\index-j04GpaXw.js
(Exit code: 0 - chuỗi key được nhúng tĩnh trực tiếp vào bundle JS)
```

### Definition of Done:
```bash
$ npx tsc --noEmit
(Exit code: 0, không có lỗi)

$ cd frontend && npx tsc --noEmit
(Exit code: 0, không có lỗi)

$ npm run build
> hula-clinic@1.0.0 build
> nest build
(Exit code: 0)

$ cd frontend && npm run build
> hula-clinic-frontend@1.0.0 build
> tsc && vite build
✓ 3076 modules transformed.
dist/index.html                     0.82 kB │ gzip:   0.54 kB
dist/assets/index-QuVQyYdA.css      5.46 kB │ gzip:   1.59 kB
dist/assets/index-Crh0xvRN.js   1,329.52 kB │ gzip: 413.35 kB
✓ built in 17.17s
(Exit code: 0)
```

## 5. Đối chiếu tiêu chí nghiệm thu
| # | Tiêu chí (chép từ file task) | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Sửa `as base` thành `AS base` cho thống nhất | ✅ | `frontend/Dockerfile` dòng 1 |
| 2 | `npm ci` thay cho `npm install` (copy cả lockfile) | ✅ | `frontend/Dockerfile` dòng 3-4 |
| 3 | Stage `build`: thêm `ARG VITE_API_ENCRYPTION_KEY=""` và `ENV VITE_API_ENCRYPTION_KEY=$VITE_API_ENCRYPTION_KEY` trước `npm run build`, kèm comment ghi rõ giá trị này public | ✅ | `frontend/Dockerfile` dòng 14-17 |
| 4 | Stage `production`: pin `nginx:1.27-alpine`; `HEALTHCHECK` gọi `wget -qO- http://127.0.0.1/` | ✅ | `frontend/Dockerfile` dòng 20, 24-25 |
| 5 | Key `VITE_API_ENCRYPTION_KEY` được nhúng vào bundle (grep trong dist) | ✅ | Output kiểm tra `findstr` tìm thấy giá trị trong `dist/assets/index-j04GpaXw.js` |
| 6 | `docker build --target production -t hula-fe:test ./frontend` thành công | ⚠️ Chờ QA test | Máy dev local bị tắt Intel VT-x trong BIOS (`VirtualizationFirmwareEnabled: False`) nên WSL2 không chạy được Docker daemon; người dùng đã duyệt làm code trước và để QA kiểm tra trên máy QA |
| 7 | `npx tsc --noEmit` sạch ở cả root và frontend (DoD) | ✅ | Cả hai exit code 0 |
| 8 | `npm run build` chạy được ở cả root và frontend (DoD) | ✅ | Cả hai build thành công, exit code 0 |

## 6. Sai lệch so với spec & việc phát sinh
- không có

## 7. Rủi ro / cần người quyết
- Task không đụng dependency
- Máy dev local tắt VT-x trong BIOS nên việc build Docker container hoàn chỉnh cần QA chạy trên môi trường QA (Docker 29.x)

---
## 8. QA (QA điền)
| Mục | Giá trị |
|---|---|
| QA thực hiện lúc | 2026-10-19 21:22 (+07) — Claude Code, clone sạch `f2a08fe`, Docker 29.8.2 |
| Kết luận | ✅ **PASS** cho phạm vi CICD-04. Phát hiện thêm QA-04-1 (lỗi có sẵn trong `nginx.conf`, ngoài phạm vi) → tạo task **CICD-04b** |
| Lỗi tìm thấy | QA-04-1 (High cho deploy, có từ trước) |
| Thời gian QA | ~0h15 |

### Kết quả kiểm tra
| # | Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | `docker build --target production` (không build-arg / có build-arg) | ✅ | Cả 2 build OK, image **75.4 MB** |
| 2 | Có `--build-arg VITE_API_ENCRYPTION_KEY=qa-marker-7f3a91` → giá trị nằm trong bundle | ✅ | marker có trong `assets/*.js`; chuỗi khóa dev không còn |
| 3 | Không build-arg → dùng khóa dev mặc định | ✅ | Chuỗi khóa dev có trong bundle, marker không có |
| 4 | Giá trị build-arg không lọt vào ENV/history của image production | ✅ | Không có `VITE_*` trong `Config.Env`; history không chứa marker |
| 5 | `nginx:1.27-alpine` | ✅ | `nginx/1.27.5` |
| 6 | HEALTHCHECK | ✅ | `wget -qO- http://127.0.0.1/`, interval 30s, timeout 5s, start 10s, retries 3 → trạng thái **healthy** |
| 7 | Chạy thật với mock `clinic_app` | ✅ | `/` → title "Hula Clinic ERP…"; `/patients` → fallback `index.html`; `/api/health` → proxy tới mock OK; `/assets/*` có `Cache-Control: public, immutable` |
| 8 | Báo cáo trung thực | ✅ | Tiêu chí 6 ghi ⚠️ đúng quy định (máy dev tắt VT-x) |

### QA-04-1 — nginx không phân giải lại `clinic_app` (High cho deploy, có từ trước, ngoài phạm vi CICD-04)
| Tình huống | Kết quả QA đo |
|---|---|
| Chạy frontend khi chưa có `clinic_app` | Container **Exited (1)**: `[emerg] host not found in upstream "clinic_app"` |
| Tạo lại `clinic_app` (IP đổi) khi frontend đang chạy | `/api/health` → **502 Bad Gateway** cho tới khi restart frontend |

→ Mỗi lần `deploy.sh` chỉ đổi image api, `docker compose up -d` tạo lại `clinic_app` nhưng không tạo lại frontend → **demo lỗi 502 sau deploy**. Đã thêm task **CICD-04b** vào `tasks/01-cicd-deploy.md` (làm trước CICD-09).

### Ghi chú
- Tiêu chí 5 của Antigravity (grep key trong `dist`) chạy trên build ở host, không qua `docker build --build-arg`. QA đã kiểm lại qua Docker (dòng 2–4).
- Comment trong Dockerfile ghi "Public key dung cho…": nội dung đúng (giá trị public). Nit: viết không dấu, khác phần còn lại của repo.
