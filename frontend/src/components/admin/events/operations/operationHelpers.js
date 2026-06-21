export function formatOperationDateTime(value, fallback = 'Chưa có thông tin') {
  if (!value) return fallback;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function includesSearchTerm(values, search) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}
