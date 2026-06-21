# Báo cáo chuẩn hóa tiếng Việt Admin Event Module

## Phạm vi đã chuẩn hóa

- Tournament Control, Tournament Portfolio và Tournament Workspace.
- Luồng tạo, chỉnh sửa, nhân bản, hủy và chuyển lifecycle của Tournament.
- Wizard tạo/chỉnh sửa Tournament gồm thông tin, điều kiện tham gia, cấu hình Race, cấu hình giải thưởng và bước xác nhận.
- Registration Review gồm bộ lọc, danh sách, dialog duyệt/từ chối và validation lý do từ chối.
- RaceEntry Assignment gồm danh sách Race, danh sách ứng viên, phân công, danh sách RaceEntry chính thức và dialog hủy.
- Referee Assignment gồm danh sách, tìm kiếm, phân công, thay thế và gỡ Referee.
- Loading, empty, error, retry, helper text, placeholder, tooltip và accessibility label liên quan.

## File thay đổi

- `frontend/src/components/admin/AdminDashboard.jsx`
- `frontend/src/components/admin/events/**`
- `frontend/src/components/admin/refereeAssignments/RefereeAssignmentManagement.jsx`
- `frontend/src/lib/eventFormatters.js`
- `frontend/src/services/tournamentPersistenceService.js`

## Quy tắc được giữ nguyên

- Giữ nguyên các domain term: Tournament, Race, Registration, RaceEntry, Referee, Jockey và Owner.
- Giữ nguyên các thuật ngữ Status, Role và Payment Status.
- Không thay đổi backend enum, điều kiện so sánh, API endpoint, request payload hoặc response mapping.
- Các badge Registration, Payment và RaceEntry hiển thị nguyên backend value như `PENDING`, `APPROVED`, `REJECTED`, `PAID`, `UNPAID`, `ASSIGNED`, `CANCELLED`.
- Tournament/Race status tiếp tục hiển thị bằng nhãn tiếng Anh theo domain: `Open Registration`, `Registration Closed`, `Ongoing`, `Finished`, `Cancelled`.

## Kết quả xác minh

- Lệnh: `npm run build`
- Kết quả: PASS
- Vite: 7.3.5
- Modules transformed: 2257
- Cảnh báo còn lại: main JavaScript chunk lớn hơn 500 kB; đây là cảnh báo tối ưu bundle đã tồn tại và không ảnh hưởng build.
- Không có file backend nào được thay đổi.
