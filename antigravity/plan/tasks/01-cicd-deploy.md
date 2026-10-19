# P1 — CI/CD & Deploy (GitHub Actions → GHCR → VPS `docker compose`)

## Bối cảnh (hiện trạng đã review)
- `.github/workflows/deploy.yml`: push `main` → build & push 2 image → SSH chạy `/opt/hula-clinic-infra/deploy.sh`. **Không có bước kiểm tra** (typecheck/build) trước khi push image; PR không có CI.
- **Không có `package-lock.json`** ở cả root và `frontend/` → build không tái lập được, không dùng được `npm ci`.
- **Không có `.dockerignore`** → `COPY . .` có thể chép `.env`, `node_modules`, `dist` local vào image.
- `Dockerfile` backend dùng `node:18-alpine` (đã hết hỗ trợ), chạy bằng root, không có healthcheck.
- Không có endpoint health check.
- **Bẫy khóa transport**: `src/common/interceptors/encryption.interceptor.ts` lấy khóa từ `API_ENCRYPTION_KEY || ENCRYPTION_KEY || <dev key>`, còn frontend (`frontend/src/utils/crypto.ts`) lấy `VITE_API_ENCRYPTION_KEY` **lúc build image**. Production đặt `ENCRYPTION_KEY` mà CI build frontend không có key → hai bên lệch khóa → **mọi POST/PUT lỗi**. Ngoài ra fallback sang `ENCRYPTION_KEY` khiến khóa mã hóa DB liên quan tới một giá trị nằm trong bundle JS (public).
- `metadata-action` hiện không cấu hình tag `latest` tường minh.

## Kiến trúc mục tiêu
```
PR / push nhánh ─▶ ci.yml : typecheck + build BE/FE + docker build (không push)
push main / tag v* ─▶ release.yml : verify ─▶ build & push GHCR (latest, sha-xxxxxxx, X.Y.Z)
                                      └─▶ (tuỳ chọn) deploy qua SSH nếu vars.AUTO_DEPLOY == 'true'
VPS: /opt/hula-clinic/{docker-compose.prod.yml, .env, deploy.sh}
     ./deploy.sh [tag] ─▶ compose pull ─▶ up -d ─▶ chờ clinic_app healthy
Internet ─▶ Nginx Proxy Manager (SSL) ─▶ clinic_frontend:80 ─▶ /api → clinic_app:3000 ─▶ clinic_db
```

---

## CICD-01 — Lockfile & phiên bản Node
**Files:** `package-lock.json` (mới), `frontend/package-lock.json` (mới)
- Root: `npm install --package-lock-only --legacy-peer-deps`; `frontend/`: `npm install --package-lock-only`.
- Commit cả hai lockfile. **Không** nâng major version thư viện trong task này.

**Nghiệm thu:** `npm ci --legacy-peer-deps` (root) và `npm ci` (frontend) chạy thành công trên máy sạch.

## CICD-02 — `.dockerignore`
**Files:** `.dockerignore`, `frontend/.dockerignore` (mới)
- Root loại trừ: `.env`, `.env.*` (giữ `!.env.example`), `node_modules`, `dist`, `uploads`, `frontend`, `.git`, `.github`, `antigravity`, `deploy`, `*.log`, `*.bk`.
- Frontend loại trừ: `.env`, `.env.*`, `node_modules`, `dist`, `*.log`.

**Nghiệm thu:** tạo file `.env` giả trong thư mục làm việc, build image, rồi `docker run --rm <image> ls -a /app` không thấy `.env`.

## CICD-03 — Dockerfile backend
**File:** `Dockerfile`
- Base `node:22-alpine` cho mọi stage.
- Stage `base`: copy `package.json` + `package-lock.json` → `npm ci --legacy-peer-deps` → copy `tsconfig.json`, `nest-cli.json`.
- Stage `build`: chỉ copy `src/` → `npm run build`.
- Stage `production`: `ENV NODE_ENV=production`; `npm ci --omit=dev --legacy-peer-deps && npm cache clean --force`; copy `dist`; tạo `/app/uploads` và `chown node:node`; `USER node`; `EXPOSE 3000`.
- `HEALTHCHECK` gọi `wget -qO- http://127.0.0.1:3000/api/health` (interval 30s, start-period 40s, retries 3).
- Giữ nguyên stage `development` (phục vụ `docker-compose.local.yml`).

**Nghiệm thu:** `docker build --target production -t hula-api:test .` thành công; `docker run --rm hula-api:test whoami` in ra `node`.

## CICD-04 — Dockerfile frontend
**File:** `frontend/Dockerfile`
- `npm ci` thay cho `npm install` (copy cả lockfile).
- Stage `build`: thêm `ARG VITE_API_ENCRYPTION_KEY=""` và `ENV VITE_API_ENCRYPTION_KEY=$VITE_API_ENCRYPTION_KEY` **trước** `npm run build`, kèm comment ghi rõ giá trị này public.
- Stage `production`: pin `nginx:1.27-alpine`; `HEALTHCHECK` gọi `wget -qO- http://127.0.0.1/`.
- Sửa `as base` thành `AS base` cho thống nhất.

**Nghiệm thu:** `docker build --target production -t hula-fe:test ./frontend` thành công.

## CICD-05 — Endpoint `GET /api/health`
**Files:** `src/core/health/health.controller.ts`, `src/core/health/health.module.ts` (mới), `src/app.module.ts`
- Endpoint public (không gắn `JwtAuthGuard`); chạy `SELECT 1` qua `DataSource`.
- OK → `200 { status: 'ok', db: 'up', version: process.env.APP_VERSION || 'dev' }`.
- DB lỗi → `503` (`ServiceUnavailableException`).
- Đăng ký `HealthModule` trong `AppModule` cạnh các core module khác.

**Nghiệm thu:** gọi `curl -i localhost:3000/api/health` → 200 khi DB chạy, 503 khi dừng container DB.

## CICD-06 — Cấu hình production an toàn khi khởi động
**Files:** `src/main.ts`, `src/app.module.ts`, `src/common/interceptors/encryption.interceptor.ts`, `src/core/users/users.service.ts`
1. `main.ts`: thêm `assertProductionConfig()` chạy đầu `bootstrap()`. Khi `NODE_ENV=production` mà thiếu `JWT_SECRET`, `DB_PASSWORD`, hoặc `ENCRYPTION_KEY` (hoặc `ENCRYPTION_KEY` ngắn hơn 64 ký tự hex) → throw, app thoát với thông báo nêu **tên** biến thiếu, **không in giá trị**.
2. `app.module.ts`: `synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true'`, kèm TODO chuyển sang migrations.
3. `encryption.interceptor.ts`: khóa transport **chỉ** lấy `API_ENCRYPTION_KEY || <dev key>`; **bỏ fallback `ENCRYPTION_KEY`**. Thêm comment: phải trùng `VITE_API_ENCRYPTION_KEY` của frontend.
4. `users.service.ts seedAdmin()`: mật khẩu lấy từ `process.env.ADMIN_INITIAL_PASSWORD` (fallback `admin123` chỉ cho dev, kèm `console.warn`). Log **không** in mật khẩu.

**Nghiệm thu:**
- `NODE_ENV=production` thiếu `JWT_SECRET` → app thoát với mã ≠ 0 và log có tên biến.
- Dev (không đặt `NODE_ENV`) vẫn chạy như cũ.
- FE build không có key + BE không có `API_ENCRYPTION_KEY` → tạo bệnh nhân thành công (hai bên cùng dùng khóa dev).

## CICD-07 — Workflow CI cho PR
**File:** `.github/workflows/ci.yml` (mới)
- Trigger: `pull_request` và `push` mọi nhánh trừ `main`. Có `concurrency` (`cancel-in-progress: true`), `permissions: contents: read`.
- Job `backend`: `actions/setup-node@v4` (node 22, `cache: npm`) → `npm ci --legacy-peer-deps` → `npx tsc --noEmit` → `npm run build` → `npm test --if-present` → `npm audit --omit=dev --audit-level=high` với `continue-on-error: true` (hiện có 5 lỗ hổng high, bật chặn ở P4).
- Job `frontend`: tương tự, `working-directory: frontend`, `cache-dependency-path: frontend/package-lock.json`.
- Job `docker` (needs 2 job trên): `docker/setup-buildx-action@v3` + `docker/build-push-action@v6`, `push: false`, target `production` cho cả 2 image.

**Nghiệm thu:** mở 1 PR thử → 3 job xanh; cố ý thêm lỗi TS → job đỏ.

## CICD-08 — Workflow Release → GHCR
**Files:** xóa `.github/workflows/deploy.yml`, tạo `.github/workflows/release.yml`
- Trigger: `push` `main`, tag `v*`, `workflow_dispatch`. `concurrency` với `cancel-in-progress: false`.
- Job `verify`: typecheck + build BE và FE (giống CI); fail thì dừng.
- Job `build-and-push` (needs `verify`), `permissions: packages: write`, matrix `{image: api, context: .}` và `{image: frontend, context: ./frontend}`:
  - Đăng nhập GHCR bằng `secrets.GITHUB_TOKEN`.
  - `docker/metadata-action@v5`, image `ghcr.io/${{ github.repository }}-${{ matrix.image }}`, tags:
    ```
    type=raw,value=latest,enable={{is_default_branch}}
    type=sha,format=short
    type=semver,pattern={{version}}
    type=semver,pattern={{major}}.{{minor}}
    ```
  - `docker/build-push-action@v6`, cache `type=gha` theo `scope=${{ matrix.image }}`, `build-args: VITE_API_ENCRYPTION_KEY=${{ vars.VITE_API_ENCRYPTION_KEY }}` (repo **variable**, không phải secret, vì giá trị public).
- Job `deploy` (tùy chọn): `if: vars.AUTO_DEPLOY == 'true' && github.ref == 'refs/heads/main'`, `environment: production`, `appleboy/ssh-action` (pin phiên bản ổn định mới nhất, **kiểm tra trên GitHub Marketplace**), script: `cd ${{ vars.VPS_DEPLOY_DIR || '/opt/hula-clinic' }} && ./deploy.sh sha-<7 ký tự đầu của github.sha>`.

**Nghiệm thu:**
- Merge vào `main` → GHCR có `…-api:latest`, `…-api:sha-xxxxxxx`, và tương tự cho frontend.
- Push tag `v0.1.0` → có thêm `0.1.0` và `0.1`.
- Không đặt `AUTO_DEPLOY` → job deploy hiện "skipped".

## CICD-09 — Bộ file deploy cho VPS
**Files (mới):** `deploy/docker-compose.prod.yml`, `deploy/.env.production.example`, `deploy/deploy.sh` (chmod +x). *(Chờ Q1 trong ROADMAP; nếu chủ dự án chọn repo infra thì chuyển 3 file sang đó.)*

`docker-compose.prod.yml`:
- `name: hula-clinic`. **Không có `build:`**; chỉ dùng `image:`.
- `db`: `postgres:15-alpine`, `container_name: clinic_db`, `POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}`, port `127.0.0.1:5433:5432` (không public), volume `clinic_postgres_data`, healthcheck `pg_isready`.
- `app`: `image: ${REGISTRY:-ghcr.io}/${IMAGE_NAMESPACE:-residoken-wq/hula-clinic}-api:${IMAGE_TAG:-latest}`, `container_name: clinic_app` (**bắt buộc giữ tên này**, `frontend/nginx.conf` proxy tới `clinic_app:3000`), `env_file: .env`, environment `NODE_ENV=production`, `DB_HOST=db`, `DB_PORT=5432`, `APP_VERSION=${IMAGE_TAG}`, volume `clinic_uploads:/app/uploads`, `depends_on db: service_healthy`, **không publish port**.
- `frontend`: image tương ứng, `container_name: clinic_frontend`, `depends_on app: service_healthy`, networks `default` + `proxy_net`.
- `networks.proxy_net.external: true`. Bỏ `nexus-network` (chờ Q2).
- `restart: unless-stopped` cho cả 3 service.

`.env.production.example`: chỉ placeholder `CHANGE_ME`, có comment `openssl rand -hex 32`. Biến: `IMAGE_NAMESPACE`, `IMAGE_TAG`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SYNCHRONIZE=true`, `JWT_SECRET`, `JWT_EXPIRES_IN=1d`, `ADMIN_INITIAL_PASSWORD`, `ENCRYPTION_KEY` (64 hex, ghi chú "mất khóa = mất dữ liệu đã mã hóa"), `API_ENCRYPTION_KEY` (ghi chú phải trùng `VITE_API_ENCRYPTION_KEY`, là giá trị public), `PORT=3000`.

`deploy.sh` (`set -euo pipefail`):
1. `cd` về thư mục chứa script; thiếu `.env` thì báo lỗi rồi thoát.
2. Có tham số `$1` → `export IMAGE_TAG=$1` (ghi đè giá trị trong `.env`).
3. Chưa có network `proxy_net` thì tạo.
4. `docker compose -f docker-compose.prod.yml pull` → `up -d --remove-orphans`.
5. Chờ tối đa 150 giây cho `clinic_app` chuyển `healthy` (dùng `docker inspect -f '{{.State.Health.Status}}'`). Healthy → in `compose ps`, `docker image prune -f`, exit 0. Hết thời gian → in `docker logs clinic_app --tail 50`, exit 1.

**Nghiệm thu (local):** tag image local thành `ghcr.io/residoken-wq/hula-clinic-{api,frontend}:test`, `.env` dùng giá trị giả, chạy `./deploy.sh test` → 3 container healthy; vào container frontend gọi `wget -qO- http://127.0.0.1/api/health` → `status: ok`; đăng nhập admin bằng `ADMIN_INITIAL_PASSWORD` giả thành công.

## CICD-10 — Tài liệu vận hành
**Files:** `docs/DEPLOYMENT.md` (mới); cập nhật `antigravity/architecture.md` §5 và `antigravity/cmdcheck.md` (đổi `docker compose` thành `docker compose -f docker-compose.prod.yml`, path `/opt/hula-clinic`).

`DEPLOYMENT.md` gồm:
1. **Chuẩn bị VPS lần đầu**: cài Docker + compose plugin; `mkdir /opt/hula-clinic`; tải 3 file trong `deploy/` (bằng `curl` từ raw GitHub hoặc `git clone --depth 1` rồi copy); `cp .env.production.example .env && chmod 600 .env` rồi chủ dự án **tự điền** secret.
2. GHCR private (Q3): `docker login ghcr.io -u <user>` với PAT quyền `read:packages`.
3. **Nginx Proxy Manager**: Proxy Host `clinic.nemmamnon.com` → scheme `http`, host `clinic_frontend`, port `80`; bật Block Common Exploits và Websockets; tab SSL: Let's Encrypt, Force SSL, HTTP/2, HSTS.
4. **Deploy**: `./deploy.sh` (latest) hoặc `./deploy.sh sha-abc1234`.
5. **Rollback**: `./deploy.sh <sha hoặc version cũ>`.
6. **Backup DB** (thủ công cho demo): `docker exec clinic_db pg_dump -U clinic_user clinic_db | gzip > backup_$(date +%F).sql.gz`, và lệnh restore.
7. **Bật auto-deploy (tùy chọn)**: repo variables `AUTO_DEPLOY=true`, `VPS_DEPLOY_DIR`; secrets `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY` (deploy key riêng, user không phải root); environment `production` có required reviewer.
8. **Chuyển hạ tầng**: nếu container cũ (build từ `docker-compose.yml.bk`) đang chạy, `docker compose down` (**không** dùng `-v`) trước khi chạy compose mới. Volume DB cũ có tên khác (`<project>_clinic_postgres_data`) → ghi rõ: demo thì tạo DB mới, hoặc khai báo `external` cho volume cũ.

**Nghiệm thu:** một người chưa từng làm làm theo `DEPLOYMENT.md` từ VPS trắng tới khi demo chạy được trên domain, không cần hỏi thêm.

---

## Ngoài phạm vi P1
RBAC, sửa bug nghiệp vụ, migrations, test tự động (để P2–P4).
