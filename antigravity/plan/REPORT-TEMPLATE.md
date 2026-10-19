# Mẫu báo cáo hoàn thành task (Antigravity → QA)

> Bắt buộc cho **mỗi task**. Lưu tại `antigravity/plan/reports/<TASK-ID>.md`, commit **cùng** commit code của task.
> Thời gian ghi theo giờ Việt Nam, định dạng `YYYY-MM-DD HH:mm (+07)`.
> Khi xong, cập nhật thêm 1 dòng trong `antigravity/plan/PROGRESS.md`.

---

```markdown
# Báo cáo <TASK-ID> — <tên task>

## 1. Thông tin chung
| Mục | Giá trị |
|---|---|
| Task ID | CICD-01 |
| Người thực hiện | Antigravity (người giao: ntnhan) |
| Branch | `<tên branch>` |
| Commit | `<sha 7 ký tự>` — `<commit message>` (lấy **sau khi push**: `git log -1 --format=%h origin/<branch>`) |
| PR | <link PR hoặc "chưa tạo"> |

## 2. Thời gian
| Mốc | Thời điểm |
|---|---|
| Nhận task | 2026-10-19 14:00 (+07) |
| Bắt đầu code | 2026-10-19 14:05 (+07) |
| Hoàn thành (push thành công lên remote) | 2026-10-19 14:40 (+07) |
| **Thời gian thực tế** | **0h35** |
| Ước lượng trong plan | 0h30 |
| Chênh lệch | +0h05 — lý do: … |

## 3. Thay đổi
| File | Loại (A/M/D) | Mô tả ngắn |
|---|---|---|
| `package-lock.json` | A | … |

Thư viện thêm, xóa hoặc đổi phiên bản: <tên@phiên-bản, hoặc "không có">

## 4. Kết quả kiểm tra (dán output thật, rút gọn nếu dài)
```bash
$ npx tsc --noEmit
(không có lỗi)
$ npm run build
...
```

## 5. Đối chiếu tiêu chí nghiệm thu
| # | Tiêu chí (chép từ file task) | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | … | ✅ / ❌ / ⚠️ | lệnh / ảnh chụp / log |

## 6. Sai lệch so với spec & việc phát sinh
- <làm khác spec ở đâu, vì sao — hoặc "không có">
- <file ngoài phạm vi đã phải sửa — hoặc "không có">

## 7. Rủi ro / cần người quyết
- Kết quả `npm audit --omit=dev` (BE/FE) nếu task đụng dependency; so với lần trước tăng hay giảm
- <rủi ro khác, hoặc "không có">

---
## 8. QA (QA điền)
| Mục | Giá trị |
|---|---|
| QA thực hiện lúc | 2026-10-19 15:00 (+07) |
| Kết luận | ✅ PASS / ❌ FAIL / ⚠️ PASS có điều kiện |
| Lỗi tìm thấy | <ID / mô tả hoặc "không có"> |
| Thời gian QA | 0h15 |
```

## Quy tắc tính thời gian
- **Thời gian thực tế** = *Hoàn thành* − *Bắt đầu code*, trừ thời gian chờ người duyệt hoặc chờ trả lời câu hỏi (ghi rõ phần đã trừ ở mục 6).
- Task bị QA FAIL phải sửa lại → **không tạo báo cáo mới**. Thêm mục `## Lần sửa N` gồm thời gian bắt đầu, kết thúc và việc đã sửa; cộng dồn vào tổng thời gian.
- Không ghi thời gian ước đoán. Không nhớ chính xác thì ghi "~" và lấy theo timestamp của commit.
