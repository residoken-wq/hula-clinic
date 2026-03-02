# 🔧 Hula Clinic — Command Checklist khi có sự cố

> Chạy trên server qua SSH: `ssh root@<server-ip>`
> Project path: `/opt/hula-clinic`

---

## 1. Kiểm tra trạng thái containers

```bash
# Xem tất cả containers (bao gồm đã dừng)
docker ps -a --filter "name=clinic"

# Xem logs container (50 dòng cuối)
docker logs clinic_app --tail 50
docker logs clinic_frontend --tail 50
docker logs clinic_db --tail 50

# Xem logs realtime (follow)
docker logs clinic_app -f
```

---

## 2. Kiểm tra kết nối giữa các services

```bash
# Frontend → Backend (quan trọng nhất)
docker exec clinic_frontend wget -qO- http://clinic_app:3000/api/services?status=ACTIVE

# Backend → Database
docker exec clinic_app wget -qO- http://localhost:3000/api/auth 2>&1 | head -5

# Test port backend từ frontend container
docker exec clinic_frontend sh -c "echo > /dev/tcp/clinic_app/3000" 2>&1
```

---

## 3. Kiểm tra networking

```bash
# Xem containers trên proxy_net
docker network inspect proxy_net --format '{{range .Containers}}{{.Name}} {{end}}'

# Xem network config của từng container
docker inspect clinic_frontend --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
docker inspect clinic_app --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool

# DNS resolution test
docker exec clinic_frontend nslookup clinic_app 2>/dev/null || docker exec clinic_frontend getent hosts clinic_app
```

---

## 4. Kiểm tra TypeScript / Build errors

```bash
# Xem lỗi compile trong backend logs
docker logs clinic_app 2>&1 | grep -i "error TS"

# Xem chi tiết lỗi
docker logs clinic_app 2>&1 | grep -A 3 "error TS"
```

---

## 5. Kiểm tra Database

```bash
# Kết nối PostgreSQL
docker exec -it clinic_db psql -U clinic_user -d clinic_db

# Kiểm tra tables
docker exec clinic_db psql -U clinic_user -d clinic_db -c "\dt"

# Kiểm tra disk space
docker exec clinic_db psql -U clinic_user -d clinic_db -c "SELECT pg_size_pretty(pg_database_size('clinic_db'));"
```

---

## 6. Restart & Rebuild

```bash
# Restart một service
docker compose restart app
docker compose restart frontend

# Rebuild và restart (khi có thay đổi Dockerfile)
docker compose up -d --build app
docker compose up -d --build frontend

# Restart toàn bộ
docker compose down && docker compose up -d

# Rebuild toàn bộ từ đầu (xóa cache)
docker compose down
docker compose build --no-cache
docker compose up -d
```

> **⚠️ Lưu ý**: `docker compose down` KHÔNG xóa volume database.
> Để xóa cả data: `docker compose down -v` (NGUY HIỂM!)

---

## 7. Kiểm tra tài nguyên server

```bash
# Disk space
df -h

# Memory
free -h

# Docker disk usage
docker system df

# Dọn dẹp Docker (images/containers cũ)
docker system prune -f
```

---

## 8. Kiểm tra Nginx Proxy Manager

```bash
# Xem container NPM
docker ps --filter "name=proxy" --filter "name=npm" --filter "name=nginx-proxy"

# Test từ server → frontend
curl -s -o /dev/null -w "%{http_code}" http://clinic_frontend:80/api/services
# Hoặc qua domain
curl -s -o /dev/null -w "%{http_code}" https://clinic.nemmamnon.com/api/services
```

---

## 9. Quick Diagnostic (chạy tất cả)

```bash
echo "=== Container Status ==="
docker ps -a --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Backend Errors ==="
docker logs clinic_app --tail 5 2>&1 | grep -i "error\|fatal\|fail" || echo "No errors found"

echo -e "\n=== Frontend → Backend ==="
docker exec clinic_frontend wget -qO- --timeout=3 http://clinic_app:3000/api/services 2>&1 | head -1 || echo "Connection FAILED"

echo -e "\n=== DB Health ==="
docker exec clinic_db pg_isready -U clinic_user -d clinic_db
```

---

## Tham khảo: Luồng request Production

```
Client → Nginx Proxy Manager (443)
       → clinic_frontend:80 (nginx)
           ├── /           → serve SPA (index.html)
           ├── /api/*      → proxy → clinic_app:3000
           └── /uploads/*  → proxy → clinic_app:3000
                                       → clinic_db:5432
```
