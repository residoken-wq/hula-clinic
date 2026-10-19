# Bảng theo dõi tiến độ

> Antigravity cập nhật cột *Bắt đầu → Thực tế* khi xong task; QA cập nhật cột *QA*.
> Trạng thái: ⬜ chưa làm · 🔄 đang làm · 🟡 chờ QA · ✅ QA pass · ❌ QA fail
> Thời gian theo giờ VN (+07). Ước lượng là **giả định** của BA, dùng để so với thực tế.

## P1 — CI/CD & Deploy
| ID | Task | Ước lượng | Trạng thái | Bắt đầu | Hoàn thành | Thực tế | Commit | Báo cáo | QA |
|---|---|---|---|---|---|---|---|---|---|
| CICD-01 | Lockfile & Node | 0h30 | ✅ QA pass | ~16:16 | ~16:21 | ~0h05 | 680ee1a | [reports/CICD-01.md](reports/CICD-01.md) | ✅ 16:58 (2 ghi chú) |
| CICD-02 | `.dockerignore` | 0h15 | ✅ QA pass | 17:01 | 17:07 | 0h06 | 4f5a515 | [reports/CICD-02.md](reports/CICD-02.md) | ✅ 17:24 (2 ghi chú) |
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
| 2026-10-19 16:58 | CICD-01 | ✅ PASS | 6/6 checklist đạt trên clone sạch `f005545`. Ghi chú N1 (giờ push), N2 (audit: prod BE 5 high = baseline, không phát sinh mới). Chi tiết: reports/CICD-01.md §8 |
| 2026-10-19 17:24 | CICD-02 | ✅ PASS | Build context root + frontend không chứa `.env*`, `node_modules`, `dist`, `uploads`, log (probe + Dockerfile thật stage development). N1: hash commit sai (`bd49172` → `4f5a515`). N2: máy dev không có Docker → cần Docker trong WSL2 cho CICD-03/04/09 |
