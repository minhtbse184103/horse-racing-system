export default function OwnerRegisterRace({ onBackToHorses }) {
  return (
    <section className="owner-panel warning-owner-panel">
      <div className="warning-icon">⚠️</div>
      <div>
        <p className="eyebrow">Registration</p>
        <h2>Đăng ký race đang chờ hoàn thiện</h2>
        <p>
          Theo business rule, owner sẽ đăng ký horse và jockey vào race; hệ thống cần kiểm tra quyền sở hữu, hạn đăng ký, giấy sức khỏe, trạng thái horse và xác nhận của jockey trước khi hoàn tất.
        </p>
        <button className="outline-button" type="button" onClick={onBackToHorses}>
          Quay lại danh sách ngựa
        </button>
      </div>
    </section>
  );
}
