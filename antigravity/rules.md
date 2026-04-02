# Rules — Quy tắc phát triển
- Environment: Docker Compose inside WSL2 (Ubuntu).
- User: ntnhan (Non-root).
- Rule 1: KHÔNG sửa trực tiếp docker-compose.yml ở repo này (repo này chỉ chứa source code).
- Rule 2: Mọi cấu hình chạy Docker local nằm trong file `docker-compose.local.yml`.
- Rule 3: Luôn chạy quét mã độc/lỗ hổng thư viện trước khi commit.
## 1. Tự động tách Components

### Ngưỡng
- File > **300 dòng** → cần xem xét tách
- File > **500 dòng** → **bắt buộc** tách

### Cách tách

#### Frontend (React/TSX)
- Mỗi **Tab** trong Tabs → 1 file component riêng trong `components/<module>/`
- Page file (`pages/XxxPage.tsx`) chỉ là **orchestrator** — import tabs, render layout + stats
- Shared utils (format, constants) → `components/<module>/utils.ts`

```
pages/HrPage.tsx              → orchestrator (~60-80 dòng)
components/hr/EmployeesTab.tsx → tab component (~150 dòng)
components/hr/PayrollTab.tsx   → tab component (~150 dòng)
components/hr/utils.ts         → shared helpers
```

#### Backend (NestJS/TS)
- Service > 300 dòng → tách logic phức tạp ra service riêng
  - VD: `planning.service.ts` → `MrpCalculationService` + `GanttService`
- Giữ CRUD cơ bản ở service gốc, logic tính toán ra service phụ

### Naming Convention
| Loại | Pattern | Ví dụ |
|---|---|---|
| Tab component | `<Feature>Tab.tsx` | `EmployeesTab.tsx` |
| Page orchestrator | `<Module>Page.tsx` | `HrPage.tsx` |
| Sub-service | `<Feature>Service` | `MrpCalculationService` |
| Shared utils | `utils.ts` | `components/hr/utils.ts` |

### Folder Structure
```
frontend/src/
├── pages/           → orchestrator pages only
├── components/
│   ├── hr/          → HR tab components
│   ├── settings/    → Settings tab components
│   └── shared/      → reusable across modules
```

## 2. Import Rules
- Component import dùng **relative path** (`../../utils/api`)
- Shared constants (ALL_MODULES, category types) đặt trong component sử dụng chính
- API helper (`api`, `fetchData`) import từ `utils/api`

## 3. Khi nào KHÔNG tách
- File < 200 dòng
- Component chỉ có 1 chức năng đơn giản
- Logic quá tightly coupled không thể tách độc lập
