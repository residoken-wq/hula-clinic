# Bảng theo dõi tiến độ

> Antigravity cập nhật cột *Bắt đầu → Thực tế* khi xong task; QA cập nhật cột *QA*.
> Trạng thái: ⬜ chưa làm · 🔄 đang làm · 🟡 chờ QA · ✅ QA pass · ❌ QA fail
> Thời gian theo giờ VN (+07). Ước lượng là **giả định** của BA, dùng để so với thực tế.

## P1 — CI/CD & Deploy
| ID | Task | Ước lượng | Trạng thái | Bắt đầu | Hoàn thành | Thực tế | Commit | Báo cáo | QA |
|---|---|---|---|---|---|---|---|---|---|
| CICD-01 | Lockfile & Node | 0h30 | 🟡 Báo xong, **chưa thấy trên remote** (QA lúc 2026-10-19) | | | | | | ❌ Chưa push |
| CICD-02 | `.dockerignore` | 0h15 | ⬜ | | | | | | |
| CICD-03 | Dockerfile backend | 1h | ⬜ | | | | | | |
| CICD-04 | Dockerfile frontend | 0h30 | ⬜ | | | | | | |
| CICD-05 | `/api/health` | 0h45 | ⬜ | | | | | | |
| CICD-06 | Cấu hình production an toàn | 1h | ⬜ | | | | | | |
| CICD-07 | Workflow CI | 1h | ⬜ | | | | | | |
| CICD-08 | Workflow Release → GHCR | 1h30 | ⬜ | | | | | | |
| CICD-09 | Bộ file deploy VPS | 2h | ⬜ | | | | | | |
| CICD-10 | Tài liệu vận hành | 1h30 | ⬜ | | | | | | |
| **Tổng P1** | | **10h** | | | | | | | |

## P2 — Security baseline
| ID | Task | Ước lượng | Trạng thái | Bắt đầu | Hoàn thành | Thực tế | Commit | Báo cáo | QA |
|---|---|---|---|---|---|---|---|---|---|
| SEC-01 | Ẩn hash, bỏ so sánh thô | 1h | ⬜ | | | | | | |
| SEC-02 | RBAC | 6h | ⬜ | | | | | | |
| SEC-03 | ValidationPipe + DTO | 6h | ⬜ | | | | | | |
| SEC-04 | Upload an toàn | 2h | ⬜ | | | | | | |
| SEC-05 | Bỏ secret fallback | 0h45 | ⬜ | | | | | | |
| SEC-06 | Rate limit login | 1h | ⬜ | | | | | | |
| SEC-07 | Header & CORS | 0h45 | ⬜ | | | | | | |
| SEC-08 | Audit log | 3h | ⬜ | | | | | | |

## P3 — Demo flow
| ID | Task | Ước lượng | Trạng thái | Bắt đầu | Hoàn thành | Thực tế | Commit | Báo cáo | QA |
|---|---|---|---|---|---|---|---|---|---|
| FLOW-01 | Sửa đổi trạng thái lịch hẹn | 1h | ⬜ | | | | | | |
| FLOW-02 | State machine | 2h | ⬜ | | | | | | |
| FLOW-03 | Check trùng lịch theo khoảng | 3h | ⬜ | | | | | | |
| FLOW-04 | Sinh mã bằng sequence | 2h | ⬜ | | | | | | |
| FLOW-05 | Worklist hôm nay | 5h | ⬜ | | | | | | |
| FLOW-06 | Bệnh án gắn lượt khám | 4h | ⬜ | | | | | | |
| FLOW-07 | Phát thuốc FEFO + ledger | 5h | ⬜ | | | | | | |
| FLOW-08 | Hóa đơn từ lượt khám | 6h | ⬜ | | | | | | |
| FLOW-09 | Tìm theo SĐT (blind index) | 3h | ⬜ | | | | | | |
| FLOW-10 | Múi giờ VN | 1h | ⬜ | | | | | | |
| FLOW-11 | Seed demo | 3h | ⬜ | | | | | | |

## Nhật ký QA
| Thời điểm (+07) | Task | Kết quả | Ghi chú |
|---|---|---|---|
| 2026-10-19 | CICD-01 | ❌ Chưa nghiệm thu được | Remote `origin` chỉ có `main` (`5dbae93`) và `claude/hopeful-hypatia-8b36i7` (2 commit docs). Không có `package-lock.json`, không có commit `CICD-01:`. Cần push code + báo cáo `reports/CICD-01.md` |
