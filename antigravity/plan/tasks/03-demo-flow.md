# P3 — Luồng khám bệnh end-to-end cho demo

## Luồng nghiệp vụ mục tiêu (BA)
```
Lễ tân                 Bác sĩ                       Quầy thuốc          Thu ngân
──────                 ──────                       ──────────          ────────
Tìm/tạo BN
Đặt lịch (BS + phòng) ─▶ thấy lịch trong Worklist
Check-in ─────────────▶ "BN đã đến" (thông báo)
                       Bắt đầu khám → mở BA nháp
                       Nhập sinh hiệu, chẩn đoán,
                       kê đơn, chọn dịch vụ
                       Hoàn thành ──────────────▶ Đơn chờ phát ─────────────────────▶
                                                  Phát thuốc (FEFO)
                                                                      Tạo HĐ từ lượt khám
                                                                      (dịch vụ + thuốc đã phát)
                                                                      Thu tiền → Finance
```

## State machine lịch hẹn (chuẩn hóa)
| Từ \ Sang | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW |
|---|---|---|---|---|---|---|
| BOOKED | ✅ | ✅ | ❌ | ❌ | ✅ (bắt buộc lý do) | ✅ |
| CONFIRMED | — | ✅ | ❌ | ❌ | ✅ | ✅ |
| CHECKED_IN | ❌ | — | ✅ | ❌ | ✅ | ❌ |
| IN_PROGRESS | ❌ | ❌ | — | ✅ | ❌ | ❌ |
| COMPLETED / CANCELLED / NO_SHOW | trạng thái cuối, không đổi |||||| 

---

## FLOW-01 — Sửa lỗi đổi trạng thái lịch hẹn (đang lỗi 404)
**Files:** `frontend/src/pages/AppointmentsPage.tsx` (dòng ~80), `src/clinic/appointments/appointments.controller.ts`
- FE gọi `api.patch('/appointments/:id/status')` nhưng BE khai báo `@Put(':id/status')` → 404.
- Sửa: FE **không** dùng endpoint status chung nữa; mỗi nút gọi endpoint nghiệp vụ riêng: `POST /:id/check-in`, `/:id/start`, `/:id/complete`, `/:id/cancel` (kèm modal nhập lý do). `PUT /:id/status` chỉ giữ lại cho `CONFIRMED` và `NO_SHOW`.

## FLOW-02 — Ép state machine ở backend
**File:** `src/clinic/appointments/appointments.service.ts`
- Tạo hằng `ALLOWED_TRANSITIONS` theo bảng trên; mọi hàm đổi trạng thái (`updateStatus`, `checkIn`, `startConsultation`, `completeAppointment`, `cancelAppointment`) kiểm tra trước, sai → `BadRequestException('Không thể chuyển từ X sang Y')`.
- `update()` (PUT chung) **không** được sửa `status`, `medical_record_id`, `appointment_code`.

## FLOW-03 — Kiểm tra trùng lịch theo khoảng thời gian
**Files:** `appointments.service.ts`, tạo `src/clinic/appointments/availability.service.ts` (dùng chung với `DoctorsService.findAvailable`, `RoomsService.findAvailable`)
- Hai lịch trùng khi `a.start < b.end AND a.end > b.start`, cùng ngày, cùng BS (hoặc cùng phòng), status **không** thuộc `CANCELLED` / `NO_SHOW` / `COMPLETED`.
- Thiếu `end_time` → mặc định `start_time + 30 phút` (biến `DEFAULT_SLOT_MINUTES` trong `industry.config.ts`).
- Chạy kiểm tra + insert trong **1 transaction**, khóa bằng `pg_advisory_xact_lock(doctor_id)` (và theo `room_id`) để chặn 2 lễ tân đặt cùng lúc.
- Áp dụng cho cả `create` và `update` (khi đổi giờ, BS hoặc phòng).

## FLOW-04 — Sinh mã chứng từ không trùng
**Files:** mọi service đang dùng `count() + 1` (patients, appointments, medical-records, billing, pharmacy, hr). Grep `count + 1` để tìm đủ.
- Tạo helper `src/common/utils/code-generator.ts` dùng PostgreSQL sequence (`CREATE SEQUENCE IF NOT EXISTS seq_<prefix>`, giá trị khởi tạo = max mã hiện có + 1) → `nextval`.
- Giữ nguyên format hiện tại (`BN-000001`, `LH-000001`, `BA-000001`, `HD-000001`, `TH-00001`, `NV-00001`).

## FLOW-05 — Worklist hôm nay
**Files (mới):** `frontend/src/pages/WorklistPage.tsx` (+ route `/worklist`, menu "Hàng chờ hôm nay" đặt đầu nhóm PHÒNG KHÁM). Dùng API `GET /appointments/today` có sẵn; bổ sung filter `doctor_id`.
- Cột: giờ, mã lịch, bệnh nhân, BS, phòng, trạng thái (Tag màu), hành động theo trạng thái (Check-in / Bắt đầu khám / Mở bệnh án / Hoàn thành / Hủy).
- User đăng nhập là bác sĩ (Employee có `user_id` trùng) → mặc định lọc theo chính mình.
- "Bắt đầu khám" → gọi `/start` rồi chuyển sang `/medical-records?id=<medical_record_id>` và mở modal bệnh án.
- Tự refresh mỗi 30 giây (polling là đủ cho demo).
- File > 300 dòng → tách component theo `rules.md`.

## FLOW-06 — Bệnh án gắn lượt khám; không phát thuốc 2 lần
**Files:** `src/clinic/medical-records/*`, `frontend/src/pages/MedicalRecordsPage.tsx`
- Thêm `appointment_id` (nullable) vào `MedicalRecord`; `startConsultation` ghi field này.
- `MedicalRecordsPage` đọc query `?id=` để mở thẳng bệnh án.
- `update()`: **không** xóa rồi tạo lại prescription. Upsert theo `id`; dòng `dispensed = true` không được sửa hay xóa (trả 400 nếu cố sửa).
- Bệnh án `COMPLETED` → read-only (400 khi cập nhật).
- Thêm danh sách dịch vụ đã chỉ định trong lượt khám: bảng mới `record_services(record_id, service_id, quantity, unit_price)` hoặc JSONB `ordered_services`. **Chọn bảng mới** để Billing join được.

## FLOW-07 — Phát thuốc đúng & an toàn
**Files:** `src/clinic/pharmacy/pharmacy.service.ts`, `frontend/src/pages/PharmacyPage.tsx`
- `dispenseMedicine`: chạy trong transaction; `SELECT … FOR UPDATE` các lô `quantity > 0 AND expiry_date >= hôm nay` theo `expiry_date ASC` (FEFO); **kiểm tra đủ tổng trước rồi mới trừ**. Không đủ → không trừ gì, trả lỗi.
- Mỗi lần trừ lô ghi 1 bản ghi `MedicineStock` `type = 'EXPORT'`, `quantity` âm, `reference = prescription_id` (hoặc bảng ledger riêng `stock_movements`; ghi lại lựa chọn vào `architecture.md`). Tồn kho = tổng ledger.
- UI Pharmacy thêm tab **"Đơn chờ phát"**: liệt kê prescription `dispensed = false` của các bệnh án `COMPLETED`, nút "Phát" gọi `POST /pharmacy/dispense-prescription`, hiện rõ dòng nào lỗi do thiếu kho.

## FLOW-08 — Hóa đơn từ lượt khám & thanh toán đúng
**Files:** `src/clinic/billing/*`, `frontend/src/pages/BillingPage.tsx`
- `POST /billing/from-record/:recordId`: tạo hóa đơn DRAFT từ `record_services` + prescription đã phát (đơn giá lấy từ `MedicalService.price` và `Medicine.sell_price`). Mỗi bệnh án chỉ được 1 hóa đơn chưa hủy.
- `create` + items trong **1 transaction**; `amount` tính ở server, bỏ qua `amount` client gửi lên.
- `pay`: `amount > 0`; hóa đơn `CANCELLED` / `PAID` → 400; `paid_amount + amount` không vượt `patient_amount` → nếu vượt thì 400. Ép kiểu `Number()` cho mọi cột decimal.
- `cancel`: hóa đơn đã có tiền → tạo transaction Finance `EXPENSE` "Hoàn tiền HĐ …" (hoặc `type = 'REFUND'`) bằng số đã thu. Bỏ hard delete: `DELETE` chỉ được cho hóa đơn DRAFT chưa có tiền.
- Thông báo thanh toán: bỏ `user_id: 0`; gửi cho user đã tạo hóa đơn (thêm `created_by`).
- UI: nút "Tạo hóa đơn" trong Worklist/bệnh án đã hoàn thành → mở BillingPage với hóa đơn vừa tạo.

## FLOW-09 — Tìm bệnh nhân theo SĐT
**Files:** `src/clinic/patients/*`
- SĐT đang mã hóa AES-GCM (IV ngẫu nhiên) nên `ILIKE` không bao giờ khớp.
- Thêm cột `phone_hash` = HMAC-SHA256(SĐT đã chuẩn hóa, khóa `SEARCH_HASH_KEY` mới trong env). Ghi khi create/update; tìm **khớp chính xác**. Script backfill cho bản ghi cũ.
- UI: ô tìm kiếm nhận biết input toàn số (≥ 9 chữ số) → tìm theo SĐT.

## FLOW-10 — Ngày giờ theo múi giờ Việt Nam
**Files:** grep `toISOString().split('T')[0]` trong `src/`
- Tạo helper `todayVN()` trong `src/common/utils/date.ts` (`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })`); thay toàn bộ chỗ trên.
- Compose production thêm `TZ=Asia/Ho_Chi_Minh` cho `app` và `db` (bổ sung vào CICD-09).

## FLOW-11 — Dữ liệu demo (seed)
**Files (mới):** `src/database/seeds/demo.seed.ts` + script `npm run seed:demo` (chỉ chạy khi `DEMO_SEED=true`)
- 3 BS (`Bác sĩ Test 01..03`), 2 phòng khám + 1 phòng thủ thuật, lịch làm việc T2–T7, 10 dịch vụ, 15 thuốc (có lô sắp hết hạn và lô hết hạn để demo FEFO), 20 BN (`Bệnh nhân Test 01..20`, `test01@example.com`, SĐT `09000000xx`), các nhóm quyền Admin / Lễ tân / Bác sĩ / Dược sĩ / Thu ngân kèm 1 user mỗi nhóm.
- **Cấm** dùng tên, SĐT, ảnh người thật. Mật khẩu user demo lấy từ env `DEMO_USER_PASSWORD`.

## Ngoài phạm vi P3
BHYT, HOLD/preauth, waitlist, triage riêng, đặt lịch online (xem `04-quality-backlog.md`).
