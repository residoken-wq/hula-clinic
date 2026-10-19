# Báo cáo CICD-03 — Dockerfile backend

## 1. Thông tin chung
| Mục | Giá trị |
|---|---|
| Task ID | CICD-03 |
| Người thực hiện | Antigravity (người giao: ntnhan) |
| Branch | `claude/hopeful-hypatia-8b36i7` |
| Commit | `CICD-03: cap nhat Dockerfile backend node 22 va multi-stage` (để trống hash, QA điền sau khi đối chiếu remote) |
| PR | chưa tạo |

## 2. Thời gian
| Mốc | Thời điểm |
|---|---|
| Nhận task | 2026-10-19 17:31 (+07) |
| Bắt đầu code | 2026-10-19 17:33 (+07) |
| Hoàn thành (push thành công lên remote) | 2026-10-19 17:36 (+07) |
| **Thời gian thực tế** | **0h05** |
| Ước lượng trong plan | 1h |
| Chênh lệch | -0h55 — lý do: đặc tả Dockerfile chi tiết và rõ ràng, kiểm tra build cục bộ thuận lợi |

## 3. Thay đổi
| File | Loại (A/M/D) | Mô tả ngắn |
|---|---|---|
| `Dockerfile` | M | Nâng cấp base image node:22-alpine, tối ưu cache multi-stage (npm ci), cấu hình non-root user node, thêm thư mục uploads và HEALTHCHECK /api/health |

Thư viện thêm, xóa hoặc đổi phiên bản: không có

## 4. Kết quả kiểm tra (dán output thật, rút gọn nếu dài)

### Git diff `Dockerfile`:
```diff
diff --git a/Dockerfile b/Dockerfile
index 9e60662..19f819c 100644
--- a/Dockerfile
+++ b/Dockerfile
@@ -1,9 +1,9 @@
 # Stage 1: Base (Dependency)
-FROM node:18-alpine AS base
+FROM node:22-alpine AS base
 WORKDIR /app
-COPY package*.json ./
-COPY tsconfig.json ./
-RUN npm install --legacy-peer-deps
+COPY package.json package-lock.json ./
+RUN npm ci --legacy-peer-deps
+COPY tsconfig.json nest-cli.json ./
 
 # Stage 2: Development (Fast Start)
 FROM base AS development
@@ -12,13 +12,19 @@ CMD ["npm", "run", "start:dev"]
 
 # Stage 3: Build (Production Build)
 FROM base AS build
-COPY . .
+COPY src/ ./src/
 RUN npm run build
 
 # Stage 4: Production (Run App)
-FROM node:18-alpine AS production
+FROM node:22-alpine AS production
 WORKDIR /app
-COPY package*.json ./
-RUN npm install --only=production --legacy-peer-deps
+ENV NODE_ENV=production
+COPY package.json package-lock.json ./
+RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
 COPY --from=build /app/dist ./dist
+RUN mkdir -p /app/uploads && chown -R node:node /app
+USER node
+EXPOSE 3000
+HEALTHCHECK --interval=30s --start-period=40s --retries=3 \
+  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
 CMD ["node", "dist/main"]
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
✓ built in 15.64s
(Exit code: 0)
```

## 5. Đối chiếu tiêu chí nghiệm thu
| # | Tiêu chí (chép từ file task) | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Base `node:22-alpine` cho mọi stage | ✅ | `FROM node:22-alpine AS base`, `FROM node:22-alpine AS production` |
| 2 | Stage base dùng `npm ci --legacy-peer-deps` và copy `tsconfig.json`, `nest-cli.json` | ✅ | Dockerfile dòng 1-6 |
| 3 | Stage build chỉ copy `src/` và chạy `npm run build` | ✅ | Dockerfile dòng 13-16 |
| 4 | Stage production: `NODE_ENV=production`, `npm ci --omit=dev`, chown `uploads` cho `node:node`, `USER node`, `EXPOSE 3000` | ✅ | Dockerfile dòng 18-27 |
| 5 | `HEALTHCHECK` gọi `wget -qO- http://127.0.0.1:3000/api/health` | ✅ | Dockerfile dòng 28-29 |
| 6 | Giữ nguyên stage `development` | ✅ | Dockerfile dòng 8-11 |
| 7 | `docker build --target production -t hula-api:test .` & `whoami` = `node` | ⚠️ Chờ QA test | Máy dev local không có Docker engine daemon trực tiếp (Docker chạy qua WSL2/VPS/CI theo `rules.md`), Dockerfile đã sẵn sàng cho QA nghiệm thu bằng lệnh build |
| 8 | `npx tsc --noEmit` sạch ở cả root và frontend (DoD) | ✅ | Cả hai exit code 0 |
| 9 | `npm run build` chạy được ở cả root và frontend (DoD) | ✅ | Cả hai build thành công, exit code 0 |

## 6. Sai lệch so với spec & việc phát sinh
- không có

## 7. Rủi ro / cần người quyết
- Task không đụng dependency
- Không có rủi ro khác

---
## 8. QA (QA điền)
| Mục | Giá trị |
|---|---|
| QA thực hiện lúc | |
| Kết luận | |
| Lỗi tìm thấy | |
| Thời gian QA | |
