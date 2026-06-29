export function validateWizardStep(step, draft) {
  const errors = {};

  if (step === 1) {
    if (!draft.name.trim()) errors.name = 'Tên Tournament là trường bắt buộc.';
    if (!draft.venue.trim()) errors.venue = 'Địa điểm là trường bắt buộc.';
    if (!draft.registrationOpen) errors.registrationOpen = 'Ngày mở Registration là trường bắt buộc.';
    if (!draft.registrationClose) errors.registrationClose = 'Ngày đóng Registration là trường bắt buộc.';
    if (!draft.start) errors.start = 'Ngày bắt đầu Tournament là trường bắt buộc.';
    if (!draft.end) errors.end = 'Ngày kết thúc Tournament là trường bắt buộc.';
    if (Number(draft.maxRegistration) < 3) errors.maxRegistration = 'Sức chứa phải tối thiểu là 3.';
    if (Number(draft.entryFee) < 0) errors.entryFee = 'Phí tham gia không được là số âm.';
    if (draft.registrationOpen && draft.registrationClose && draft.registrationClose < draft.registrationOpen) {
      errors.registrationClose = 'Ngày đóng phải sau ngày mở Registration.';
    }
    if (draft.registrationClose && draft.start && draft.registrationClose >= draft.start) {
      errors.registrationClose = 'Registration phải đóng trước khi Tournament bắt đầu.';
    }
    if (draft.start && draft.end && draft.end < draft.start) {
      errors.end = 'Ngày kết thúc phải sau ngày bắt đầu.';
    }
  }

  if (step === 2) {
    if (draft.races.length === 0) errors.races = 'Thêm ít nhất một Race trước khi tiếp tục.';
    draft.races.forEach((race) => {
      const prefix = `race-${race.id}`;
      if (!race.name.trim()) errors[`${prefix}-name`] = 'Tên Race là trường bắt buộc.';
      if (!race.track.trim()) errors[`${prefix}-track`] = 'Đường đua là trường bắt buộc.';
      if (!race.raceStartTime) errors[`${prefix}-raceStartTime`] = 'Thời gian bắt đầu Race là trường bắt buộc.';
      if (!race.raceEndTime) errors[`${prefix}-raceEndTime`] = 'Thời gian kết thúc Race là trường bắt buộc.';
      if (race.raceStartTime && race.raceEndTime && race.raceEndTime <= race.raceStartTime) {
        errors[`${prefix}-raceEndTime`] = 'Thời gian kết thúc Race phải sau thời gian bắt đầu.';
      }
      if (race.raceStartTime && draft.start && race.raceStartTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceStartTime`] = 'Thời gian bắt đầu Race phải nằm trong thời gian Tournament.';
      }
      if (race.raceStartTime && draft.end && race.raceStartTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceStartTime`] = 'Thời gian bắt đầu Race phải nằm trong thời gian Tournament.';
      }
      if (race.raceEndTime && draft.start && race.raceEndTime.slice(0, 10) < draft.start) {
        errors[`${prefix}-raceEndTime`] = 'Thời gian kết thúc Race phải nằm trong thời gian Tournament.';
      }
      if (race.raceEndTime && draft.end && race.raceEndTime.slice(0, 10) > draft.end) {
        errors[`${prefix}-raceEndTime`] = 'Thời gian kết thúc Race phải nằm trong thời gian Tournament.';
      }
      if (Number(race.distance) <= 0) errors[`${prefix}-distance`] = 'Cự ly phải lớn hơn 0.';
      if (Number(race.maxRunners) <= 0) errors[`${prefix}-maxRunners`] = 'Sức chứa Race phải lớn hơn 0.';
      if (Number(race.maxRunners) > 6) errors[`${prefix}-maxRunners`] = 'Unity hiện hỗ trợ tối đa 6 RaceEntry cho mỗi Race.';
    });
  }

  if (step === 3) {
    draft.races.forEach((race) => {
      if (race.prizes.length === 0) errors[`race-${race.id}-prizes`] = `${race.name} cần ít nhất một hạng giải thưởng.`;
      else if (race.prizes.some((prize) => Number(prize.amount) <= 0)) errors[`race-${race.id}-prizes`] = `Giá trị giải thưởng của ${race.name} phải lớn hơn 0.`;
      else if (race.prizes.some((prize) => {
        const ownerBasisPoints = Math.round(Number(prize.ownerPercent) * 100);
        const jockeyBasisPoints = Math.round(Number(prize.jockeyPercent) * 100);
        return ownerBasisPoints < 0 || jockeyBasisPoints < 0 || ownerBasisPoints + jockeyBasisPoints !== 10000;
      })) {
        errors[`race-${race.id}-prizes`] = `Tổng tỷ lệ Owner và Jockey của ${race.name} phải bằng 100 ở mỗi hạng.`;
      }
    });
  }

  return errors;
}
