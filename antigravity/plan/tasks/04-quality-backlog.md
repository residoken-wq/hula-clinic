# P4 — Backlog chất lượng & module còn thiếu (sau khi demo chạy)

Ưu tiên từ trên xuống. Mỗi mục cần BA viết chi tiết thêm trước khi giao cho Antigravity (mức **[cần đặc tả]**).

## Nền tảng kỹ thuật
| ID | Việc | Ghi chú |
|---|---|---|
| QB-01 | Khung test: Jest + Supertest (BE, dùng PostgreSQL service trong GitHub Actions), Vitest + React Testing Library (FE), Playwright smoke (5 luồng trong `05-qa-test-plan.md`) | Sau đó bật lại job test trong CI |
| QB-02 | ESLint + Prettier config, thêm `npm run lint` vào CI | Dev deps đã có `@typescript-eslint` nhưng chưa có config |
| QB-03 | TypeORM migrations: baseline từ schema hiện tại, rồi đặt `DB_SYNCHRONIZE=false` | **Bắt buộc trước khi có dữ liệu thật** |
| QB-04 | `npm audit`: xử lý lỗ hổng high, rồi bỏ `continue-on-error` trong CI | Hiện tại BE 14 (5 high), FE 2 moderate (đo ngày 2026-10-19) |
| QB-05 | Bật Dependabot (npm, docker, github-actions) + quét image bằng Trivy trong release | |
| QB-06 | Bỏ transport encryption (`EncryptionInterceptor` + `frontend/src/utils/crypto.ts`) vì khóa nằm sẵn trong bundle; dựa vào HTTPS | Cần chủ dự án đồng ý |
| QB-07 | Gỡ dependency không dùng (`sharp` không được import ở đâu) | |
| QB-08 | Backup DB tự động hằng ngày (cron trên VPS + giữ 7 bản) + diễn tập restore | |

## Module còn thiếu
| ID | Việc | Trạng thái hiện tại |
|---|---|---|
| QB-10 | UI Finance (thu/chi, báo cáo tháng) | BE có, FE là placeholder |
| QB-11 | UI Tasks | BE có, FE là placeholder |
| QB-12 | Notifications: chuông thật (đếm chưa đọc, dropdown, đánh dấu đã đọc) | Đang hard-code `count={0}` trong `App.tsx` |
| QB-13 | Dashboard: số liệu theo ngày giờ VN, doanh thu, lịch hẹn | |
| QB-14 | In phiếu khám, đơn thuốc, hóa đơn (PDF / print CSS) | **[cần đặc tả]** mẫu in |

## Nghiệp vụ (cần PO quyết scope)
| ID | Việc | Câu hỏi mở |
|---|---|---|
| QB-20 | Bảng lương: lỗi lọc ngày `${month}-31` (tháng ≤ 30 ngày) → dùng ngày cuối tháng thật | Bug, làm được ngay |
| QB-21 | Công thức thuế TNCN và bảo hiểm (hiện thuế phẳng 10%, giảm trừ hard-code 11 triệu, không có trần bảo hiểm) | **Kế toán/HR cung cấp và ký duyệt công thức** — AI không tự định nghĩa. Bảng lương luôn ở DRAFT, người duyệt mới chuyển trạng thái |
| QB-22 | Lịch BS trừ ngày nghỉ phép đã duyệt khi tìm BS trống | |
| QB-23 | Xác định bác sĩ bằng cờ `is_doctor` thay cho `position LIKE '%Bác sĩ%'` | |
| QB-24 | Mã hóa trường y tế nhạy cảm (`allergies`, `medical_history`, `diagnosis`…) | Cần đánh giá ảnh hưởng tới tìm kiếm |
| QB-25 | BHYT, hóa đơn điện tử, đặt lịch online (HOLD/preauth), waitlist, nhắc lịch SMS/Zalo | Theo `squence-diagrams.md`; PO quyết có làm hay không. **Gửi SMS/Zalo là hành động ra ngoài → cần cơ chế duyệt** |
| QB-26 | Tuân thủ bảo vệ dữ liệu cá nhân và quy định bệnh án điện tử | **Pháp chế xác minh** văn bản hiện hành trước khi đặc tả |

## Tài liệu
- QB-30: Cập nhật `architecture.md` khớp code (§4.3 routes, §7 trạng thái phase, phần CI/CD mới).
- QB-31: Hướng dẫn sử dụng cho từng vai trò (Lễ tân, BS, Dược, Thu ngân, Admin).
